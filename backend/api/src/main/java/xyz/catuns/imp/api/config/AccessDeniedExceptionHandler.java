package xyz.catuns.imp.api.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.time.Instant;

/**
 * Maps authorization denials raised inside the MVC layer — {@code @PreAuthorize}'s
 * AuthorizationDeniedException and the AccessDeniedExceptions services throw for ownership
 * checks — to 403. Without this, base-starter's GlobalExceptionHandler catches them as a
 * plain {@code Exception} and answers 500. Same ProblemDetail shape as that handler.
 */
@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
class AccessDeniedExceptionHandler {

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ProblemDetail> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setTitle(ex.getClass().getSimpleName());
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("timestamp", Instant.now());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(problem);
    }
}
