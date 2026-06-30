package xyz.catuns.imp.api.session;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import xyz.catuns.imp.api.session.event.SessionStatusChangedEvent;

@Slf4j
@Component
@RequiredArgsConstructor
public class SessionStatusEventPublisher {

    @Value("${app.kafka.topics.session-status-changed}")
    private String TOPIC;

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publish(SessionStatusChangedEvent event) {
        kafkaTemplate.send(TOPIC, event.sessionId().toString(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish session status event for session {}: {}",
                                event.sessionId(), ex.getMessage());
                    }
                });
    }
}
