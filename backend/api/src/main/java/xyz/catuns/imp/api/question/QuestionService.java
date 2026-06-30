package xyz.catuns.imp.api.question;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.catuns.imp.api.client.repository.ClientRepository;
import xyz.catuns.imp.api.config.CacheConfig;
import xyz.catuns.imp.api.question.dto.CreateQuestionRequest;
import xyz.catuns.imp.api.question.dto.QuestionResponse;
import xyz.catuns.imp.api.question.dto.UpdateQuestionRequest;
import xyz.catuns.imp.api.question.entity.Question;
import xyz.catuns.imp.api.question.entity.QuestionVersion;
import xyz.catuns.imp.api.question.mapper.QuestionMapper;
import xyz.catuns.imp.api.question.repository.QuestionRepository;
import xyz.catuns.imp.api.question.repository.QuestionVersionRepository;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.repository.UserRepository;
import xyz.catuns.spring.base.exception.controller.NotFoundException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final QuestionVersionRepository questionVersionRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final QuestionMapper questionMapper;

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER','SUPPORTER')")
    public Page<QuestionResponse> list(UUID clientId, String topic, Pageable pageable) {
        Specification<Question> spec = (root, query, cb) -> cb.isTrue(root.get("active"));
        if (clientId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("clientId"), clientId));
        }
        if (topic != null && !topic.isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("topic")), "%" + topic.toLowerCase() + "%"));
        }
        return questionRepository.findAll(spec, pageable).map(questionMapper::toResponse);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER','SUPPORTER')")
    public QuestionResponse getById(UUID id) {
        return questionRepository.findById(id)
                .map(questionMapper::toResponse)
                .orElseThrow(() -> new NotFoundException("Question not found"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public QuestionResponse create(CreateQuestionRequest request, Authentication authentication) {
        clientRepository.findById(request.clientId())
                .orElseThrow(() -> new NotFoundException("Client not found"));
        UUID actorId = resolveUserId(authentication.getName());

        Question question = questionMapper.toEntity(request);
        question.setCreatedBy(actorId);
        return questionMapper.toResponse(questionRepository.save(question));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @CacheEvict(value = CacheConfig.QUESTIONS_BY_SESSION, allEntries = true)
    public QuestionResponse update(UUID id, UpdateQuestionRequest request, Authentication authentication) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Question not found"));
        UUID actorId = resolveUserId(authentication.getName());

        QuestionVersion snapshot = new QuestionVersion();
        snapshot.setQuestionId(question.getId());
        snapshot.setVersion(question.getVersion());
        snapshot.setTopic(question.getTopic());
        snapshot.setRound(question.getRound());
        snapshot.setBody(question.getBody());
        snapshot.setUpdatedBy(question.getUpdatedBy());
        questionVersionRepository.save(snapshot);

        questionMapper.update(request, question);
        question.setVersion(question.getVersion() + 1);
        question.setUpdatedBy(actorId);
        return questionMapper.toResponse(questionRepository.save(question));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @CacheEvict(value = CacheConfig.QUESTIONS_BY_SESSION, allEntries = true)
    public void softDelete(UUID id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Question not found"));
        question.setActive(false);
        questionRepository.save(question);
    }

    @Cacheable(value = CacheConfig.QUESTIONS_BY_SESSION, key = "#questionId")
    public QuestionResponse getCachedById(UUID questionId) {
        return questionRepository.findById(questionId)
                .map(questionMapper::toResponse)
                .orElseThrow(() -> new NotFoundException("Question not found"));
    }

    private UUID resolveUserId(String email) {
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }
}
