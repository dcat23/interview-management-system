package xyz.catuns.imp.api.mcp;

import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

/**
 * Records {@code mcp.tool.invocations} for every {@link Tool @Tool}-annotated method
 * ({@link LookupTools}, {@link QuestionWriteTools}), tagged by the tool's declared name and
 * outcome (success/failure) — makes agent/MCP traffic visible in the same dashboards as human
 * REST traffic, per docs/observability.md. A single aspect rather than instrumenting each of
 * the 8 tool methods individually, since they're already thin adapters and this cross-cutting
 * concern doesn't belong in any one of them.
 */
@Aspect
@Component
@RequiredArgsConstructor
public class McpToolMetricsAspect {

    private final MeterRegistry meterRegistry;

    @Around("@annotation(org.springframework.ai.tool.annotation.Tool)")
    public Object recordInvocation(ProceedingJoinPoint joinPoint) throws Throwable {
        String toolName = toolName(joinPoint);
        try {
            Object result = joinPoint.proceed();
            meterRegistry.counter("mcp.tool.invocations", "tool", toolName, "outcome", "success").increment();
            return result;
        } catch (Throwable t) {
            meterRegistry.counter("mcp.tool.invocations", "tool", toolName, "outcome", "failure").increment();
            throw t;
        }
    }

    private static String toolName(ProceedingJoinPoint joinPoint) {
        Method method = ((MethodSignature) joinPoint.getSignature()).getMethod();
        Tool tool = method.getAnnotation(Tool.class);
        return (tool != null && !tool.name().isBlank()) ? tool.name() : method.getName();
    }
}
