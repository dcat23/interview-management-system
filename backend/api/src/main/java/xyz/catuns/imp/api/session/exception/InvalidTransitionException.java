package xyz.catuns.imp.api.session.exception;

import xyz.catuns.imp.api.session.entity.SessionStatus;
import xyz.catuns.spring.base.exception.controller.ConflictException;

public class InvalidTransitionException extends ConflictException {

    public InvalidTransitionException(SessionStatus from, SessionStatus to) {
        super("Invalid status transition: " + from + " → " + to);
    }
}
