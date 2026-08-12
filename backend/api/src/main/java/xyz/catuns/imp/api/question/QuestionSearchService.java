package xyz.catuns.imp.api.question;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.catuns.imp.api.question.dto.QuestionResponse;
import xyz.catuns.imp.api.question.mapper.QuestionMapper;
import xyz.catuns.imp.api.question.repository.QuestionRepository;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuestionSearchService {

    private final QuestionRepository questionRepository;
    private final QuestionMapper questionMapper;

    @PreAuthorize("hasAnyRole('ADMIN','MARKETER','SUPPORTER','AI_AGENT')")
    public Page<QuestionResponse> search(String q, UUID clientId, Pageable pageable) {
        // Ranking (ts_rank) replaces whatever ordering the caller asked for,
        // so drop any incoming Sort before it's appended to the native query.
        Pageable unsorted = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        return questionRepository.searchByFullText(q, clientId, unsorted).map(questionMapper::toResponse);
    }
}
