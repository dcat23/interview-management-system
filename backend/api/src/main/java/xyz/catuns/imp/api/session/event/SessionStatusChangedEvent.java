package xyz.catuns.imp.api.session.event;

import xyz.catuns.imp.api.session.entity.ChangeSource;
import xyz.catuns.imp.api.session.entity.SessionStatus;

import java.time.Instant;
import java.util.UUID;

public record SessionStatusChangedEvent(
        UUID sessionId,
        UUID processId,
        SessionStatus fromStatus,
        SessionStatus toStatus,
        Instant changedAt,
        ChangeSource changeSource
) {
}
