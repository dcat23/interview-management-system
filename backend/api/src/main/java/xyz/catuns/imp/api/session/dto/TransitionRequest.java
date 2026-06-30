package xyz.catuns.imp.api.session.dto;

import jakarta.validation.constraints.NotNull;
import xyz.catuns.imp.api.session.entity.SessionStatus;

public record TransitionRequest(@NotNull SessionStatus targetStatus) {
}
