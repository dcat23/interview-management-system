package xyz.catuns.imp.api.scheduleimport;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import xyz.catuns.imp.api.client.entity.Client;
import xyz.catuns.imp.api.client.repository.ClientRepository;
import xyz.catuns.imp.api.config.CacheConfig;
import xyz.catuns.imp.api.process.entity.InterviewProcess;
import xyz.catuns.imp.api.process.repository.InterviewProcessRepository;
import xyz.catuns.imp.api.scheduleimport.dto.ImportRowResult;
import xyz.catuns.imp.api.scheduleimport.dto.ImportSummaryResponse;
import xyz.catuns.imp.api.scheduleimport.dto.ScheduleCsvRow;
import xyz.catuns.imp.api.session.entity.InterviewSession;
import xyz.catuns.imp.api.session.entity.SessionStatus;
import xyz.catuns.imp.api.session.repository.InterviewSessionRepository;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.entity.UserRole;
import xyz.catuns.imp.api.user.repository.UserRepository;
import xyz.catuns.spring.base.exception.controller.BadRequestException;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ScheduleImportService {

    private final CsvScheduleParser csvParser;
    private final SupporterAssigner supporterAssigner;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final InterviewProcessRepository processRepository;
    private final InterviewSessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final CacheManager cacheManager;

    // Self-injection via @Lazy so @Transactional(REQUIRES_NEW) is honoured when called from within this class.
    @Autowired
    @Lazy
    private ScheduleImportService self;

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER','SUPPORTER')")
    public ImportSummaryResponse importCsv(MultipartFile file, Authentication authentication) {
        validateFile(file);

        List<ScheduleCsvRow> rows;
        try {
            rows = csvParser.parse(file.getInputStream());
        } catch (IOException e) {
            throw new BadRequestException("Unable to read uploaded file");
        }
        if (rows.isEmpty()) {
            throw new BadRequestException("CSV file contains no data rows");
        }

        List<User> candidates = new ArrayList<>(userRepository.findByRole(UserRole.CANDIDATE));
        List<User> marketers = new ArrayList<>(userRepository.findByRole(UserRole.MARKETER));
        List<User> supporters = new ArrayList<>(userRepository.findByRoleAndActiveTrue(UserRole.SUPPORTER));
        UUID callerSupporterId = resolveCallerSupporterId(authentication);

        List<ImportRowResult> results = new ArrayList<>();
        Set<UUID> touchedProcessIds = new LinkedHashSet<>();
        for (ScheduleCsvRow row : rows) {
            ImportRowResult result = processRow(row, candidates, marketers, supporters, callerSupporterId);
            results.add(result);
            if (result.processId() != null) {
                touchedProcessIds.add(result.processId());
            }
        }

        evictCaches(touchedProcessIds);
        return ImportSummaryResponse.from(results);
    }

    private ImportRowResult processRow(ScheduleCsvRow row, List<User> candidates, List<User> marketers,
                                        List<User> supporters, UUID callerSupporterId) {
        try {
            List<String> warnings = new ArrayList<>();

            UUID clientId = self.resolveOrCreateClient(row.clientName());
            UUID candidateId = self.resolveOrCreateUser(row.candidateName(), UserRole.CANDIDATE, "candidate", candidates);
            UUID marketerId = self.resolveOrCreateUser(row.leadName(), UserRole.MARKETER, "marketer", marketers);

            String technology = row.technology();
            String jobId = JobIdExtractor.extract(technology).orElse(null);

            Instant scheduledAt;
            try {
                scheduledAt = ScheduleDateTimeParser.parse(row.dateRaw(), row.timeRaw());
            } catch (IllegalArgumentException e) {
                throw new RowImportException(e.getMessage());
            }

            int durationMinutes = DurationParser.parseMinutes(row.durationRaw())
                    .orElseThrow(() -> new RowImportException("Unrecognized duration format: " + row.durationRaw()));

            SessionStatus status = mapStatus(row.statusRaw(), warnings);

            RowWriteResult writeResult = self.createOrUpdateProcessAndSession(
                    candidateId, clientId, marketerId, technology, jobId,
                    row.round(), scheduledAt, durationMinutes, row.mode(),
                    status, callerSupporterId, supporters);

            return new ImportRowResult(
                    row.rowNumber(),
                    writeResult.outcome(),
                    candidateId, writeResult.processId(), writeResult.sessionId(),
                    warnings, null);
        } catch (RowImportException e) {
            return new ImportRowResult(row.rowNumber(), ImportRowResult.ImportOutcome.FAILED, null, null, null, List.of(), e.getMessage());
        } catch (Exception e) {
            return new ImportRowResult(row.rowNumber(), ImportRowResult.ImportOutcome.FAILED, null, null, null, List.of(), "Unexpected error: " + e.getMessage());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public UUID resolveOrCreateClient(String name) {
        return clientRepository.findByNameIgnoreCase(name)
                .map(Client::getId)
                .orElseGet(() -> {
                    Client client = new Client();
                    client.setName(name.trim());
                    return clientRepository.save(client).getId();
                });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public UUID resolveOrCreateUser(String name, UserRole role, String emailSuffix, List<User> knownUsers) {
        Optional<User> match = matchByName(knownUsers, name);
        if (match.isPresent()) {
            return match.get().getId();
        }

        User user = new User();
        user.setName(name.trim());
        user.setEmail(placeholderEmail(name, emailSuffix));
        user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setRole(role);
        user.setActive(false);

        User saved = userRepository.save(user);
        knownUsers.add(saved);
        return saved.getId();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public RowWriteResult createOrUpdateProcessAndSession(
            UUID candidateId, UUID clientId, UUID marketerId,
            String technology, String jobId,
            String round, Instant scheduledAt, int durationMinutes, String mode,
            SessionStatus status, UUID callerSupporterId, List<User> supporters) {

        InterviewProcess process = (jobId != null
                ? processRepository.findByCandidateIdAndClientIdAndJobId(candidateId, clientId, jobId)
                : processRepository.findByCandidateIdAndClientIdAndTechnologyIgnoreCase(candidateId, clientId, technology))
                .orElse(null);

        if (process == null) {
            process = new InterviewProcess();
            process.setCandidateId(candidateId);
            process.setClientId(clientId);
            process.setMarketerId(marketerId);
            process.setTechnology(technology);
            process.setJobId(jobId);
            process = processRepository.save(process);
        }

        Optional<InterviewSession> existingSession = sessionRepository.findByProcessIdAndRoundIgnoreCase(process.getId(), round);

        InterviewSession session;
        ImportRowResult.ImportOutcome outcome;
        if (existingSession.isPresent()) {
            session = existingSession.get();
            session.setScheduledAt(scheduledAt);
            session.setDurationMinutes(durationMinutes);
            session.setMode(mode);
            // CSV status defaults to SCHEDULED for missing/unrecognized values, which is the
            // vast majority of rows. Re-importing shouldn't regress a session's status back to
            // SCHEDULED once it has progressed further (e.g. PASSED, REJECTED, CANCELLED,
            // RESCHEDULED), and a row that doesn't actually change the status is UNCHANGED
            // rather than UPDATED - re-importing the same sheet shouldn't report every
            // already-scheduled row as an update.
            boolean statusChanged = status != SessionStatus.SCHEDULED && status != session.getStatus();
            if (statusChanged) {
                session.setStatus(status);
            }
            outcome = statusChanged ? ImportRowResult.ImportOutcome.UPDATED : ImportRowResult.ImportOutcome.UNCHANGED;
        } else {
            UUID supporterId = callerSupporterId != null
                    ? callerSupporterId
                    : supporterAssigner.assign(supporters, scheduledAt, durationMinutes);

            session = new InterviewSession();
            session.setProcessId(process.getId());
            session.setSupporterId(supporterId);
            session.setRound(round);
            session.setMode(mode);
            session.setDurationMinutes(durationMinutes);
            session.setStatus(status);
            session.setScheduledAt(scheduledAt);
            outcome = ImportRowResult.ImportOutcome.IMPORTED;
        }

        session = sessionRepository.save(session);
        process = syncProcessStartedAt(process);
        return new RowWriteResult(process.getId(), session.getId(), outcome);
    }

    private InterviewProcess syncProcessStartedAt(InterviewProcess process) {
        Instant earliestScheduledAt = sessionRepository.findEarliestScheduledAtByProcessId(process.getId())
                .orElse(process.getStartedAt());
        if (!earliestScheduledAt.equals(process.getStartedAt())) {
            process.setStartedAt(earliestScheduledAt);
            process = processRepository.save(process);
        }
        return process;
    }

    private UUID resolveCallerSupporterId(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .filter(u -> u.getRole() == UserRole.SUPPORTER)
                .map(User::getId)
                .orElse(null);
    }

    private static SessionStatus mapStatus(String statusRaw, List<String> warnings) {
        if (statusRaw == null || statusRaw.isBlank()) {
            warnings.add("Missing status, defaulted to Scheduled");
            return SessionStatus.SCHEDULED;
        }
        String normalized = statusRaw.trim();
        if (normalized.equalsIgnoreCase("Scheduled")) {
            return SessionStatus.SCHEDULED;
        }
        if (normalized.equalsIgnoreCase("Cancelled") || normalized.equalsIgnoreCase("Canceled")) {
            return SessionStatus.CANCELLED;
        }
        // CSV sheets use the imperative "Reschedule"; the app's status is the past-tense RESCHEDULED.
        if (normalized.equalsIgnoreCase("Reschedule") || normalized.equalsIgnoreCase("Rescheduled")) {
            return SessionStatus.RESCHEDULED;
        }
        warnings.add("Unrecognized status '" + statusRaw + "', defaulted to Scheduled");
        return SessionStatus.SCHEDULED;
    }

    private static Optional<User> matchByName(List<User> users, String name) {
        String target = name.trim();
        for (User user : users) {
            if (user.getName() != null && user.getName().equalsIgnoreCase(target)) {
                return Optional.of(user);
            }
        }
        for (User user : users) {
            if (user.getName() == null) {
                continue;
            }
            String firstToken = user.getName().trim().split("\\s+")[0];
            if (firstToken.equalsIgnoreCase(target)) {
                return Optional.of(user);
            }
        }
        return Optional.empty();
    }

    private static String placeholderEmail(String name, String suffix) {
        String slug = name.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "");
        if (slug.isBlank()) {
            slug = suffix + "-" + UUID.randomUUID().toString().substring(0, 8);
        }
        return slug + "." + suffix + "@system.local";
    }

    private static void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("CSV file is required");
        }
        String filename = file.getOriginalFilename();
        if (filename != null && !filename.toLowerCase(Locale.ROOT).endsWith(".csv")) {
            throw new BadRequestException("File must be a .csv file");
        }
    }

    private void evictCaches(Set<UUID> touchedProcessIds) {
        Optional.ofNullable(cacheManager.getCache(CacheConfig.CLIENTS)).ifPresent(Cache::clear);
        Optional.ofNullable(cacheManager.getCache(CacheConfig.USER_ROLES)).ifPresent(Cache::clear);
        Optional.ofNullable(cacheManager.getCache(CacheConfig.SESSIONS_BY_PROCESS))
                .ifPresent(cache -> touchedProcessIds.forEach(cache::evict));
    }

    private record RowWriteResult(UUID processId, UUID sessionId, ImportRowResult.ImportOutcome outcome) {
    }
}
