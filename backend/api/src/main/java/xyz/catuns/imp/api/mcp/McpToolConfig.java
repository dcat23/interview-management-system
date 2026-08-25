package xyz.catuns.imp.api.mcp;

import io.modelcontextprotocol.server.McpServerFeatures;
import io.modelcontextprotocol.spec.McpSchema;
import org.springframework.ai.mcp.McpToolUtils;
import org.springframework.ai.mcp.server.common.autoconfigure.properties.McpServerProperties;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.MimeType;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

/**
 * Registers the MCP tool surface consumed by Spring AI's MCP server autoconfiguration, which
 * collects {@code McpServerFeatures.SyncToolSpecification} beans to build the tool list
 * advertised over SSE.
 * <p>
 * The server itself (SSE transport, endpoint paths, protocol) is fully autoconfigured by
 * {@code spring-ai-starter-mcp-server-webmvc} from the {@code spring.ai.mcp.server.*} properties
 * in application.yaml — it registers a plain {@code RouterFunction} handled by the same
 * DispatcherServlet as every other endpoint, so it runs through the existing security filter
 * chain unchanged: {@code ApiKeyAuthFilter} authenticates it and {@code anyRequest().authenticated()}
 * rejects unauthenticated connections with 401, exactly as for the REST API.
 * <p>
 * <b>Read/write tool classification.</b> Spring AI's {@code @Tool} annotation
 * ({@link org.springframework.ai.tool.annotation.Tool}) has no attribute for MCP's
 * {@link McpSchema.ToolAnnotations} ({@code readOnlyHint}, {@code destructiveHint}, {@code
 * idempotentHint}, {@code openWorldHint}) — and the conversion path that would normally turn our
 * {@link ToolCallback}s into {@code McpSchema.Tool} objects (Spring AI's {@code
 * ToolCallbackConverterAutoConfiguration}, via {@code McpToolUtils#toSharedSyncToolSpecification})
 * always builds the {@code Tool} with {@code annotations} left {@code null}. Per the MCP spec,
 * clients must treat a missing {@code readOnlyHint} as {@code false} (not read-only), so every
 * tool — including the pure lookups in {@link LookupTools} — was advertised as a potential write
 * and the connector required confirmation before running any of them, indistinguishable from the
 * real mutations in {@link QuestionWriteTools}.
 * <p>
 * {@code spring.ai.mcp.server.tool-callback-converter: false} turns off that default conversion
 * (its {@code syncTools} bean), and {@link #syncTools} below supplies the equivalent bean, built
 * from the same {@link ToolCallback}s (same JSON schema, same call handler, so validation, error
 * handling, auth, and transaction behavior are unchanged — {@code @PreAuthorize} on the delegate
 * services and {@link McpToolMetricsAspect} still run, since the call handler still invokes the
 * Spring-managed {@link LookupTools}/{@link QuestionWriteTools} beans), stamping each tool with
 * the {@link McpSchema.ToolAnnotations} that actually describe it.
 */
@Configuration
public class McpToolConfig {

    private static final Set<String> READ_ONLY_TOOLS = Set.of(
            "search_clients", "search_sessions", "search_questions", "search_candidates",
            "get_session", "list_session_questions");

    /** Pure lookups: no side effects, safe to re-run, don't reach outside our own data. */
    private static final McpSchema.ToolAnnotations READ_ONLY_ANNOTATIONS =
            new McpSchema.ToolAnnotations(null, true, false, true, false, null);

    /** {@code add_questions_to_session} / {@code link_existing_question}: create/link, never delete. */
    private static final McpSchema.ToolAnnotations WRITE_ANNOTATIONS =
            new McpSchema.ToolAnnotations(null, false, false, false, false, null);

    @Bean
    ToolCallbackProvider questionCaptureTools(LookupTools lookupTools, QuestionWriteTools questionWriteTools) {
        return MethodToolCallbackProvider.builder()
                .toolObjects(lookupTools, questionWriteTools)
                .build();
    }

    @Bean
    @ConditionalOnProperty(prefix = McpServerProperties.CONFIG_PREFIX, name = "type", havingValue = "SYNC",
            matchIfMissing = true)
    List<McpServerFeatures.SyncToolSpecification> syncTools(ToolCallbackProvider questionCaptureTools,
            McpServerProperties serverProperties) {
        return Arrays.stream(questionCaptureTools.getToolCallbacks())
                .map(callback -> withAnnotations(callback, serverProperties))
                .toList();
    }

    private static McpServerFeatures.SyncToolSpecification withAnnotations(ToolCallback callback,
            McpServerProperties serverProperties) {
        String toolName = callback.getToolDefinition().name();
        MimeType mimeType = serverProperties.getToolResponseMimeType().containsKey(toolName)
                ? MimeType.valueOf(serverProperties.getToolResponseMimeType().get(toolName)) : null;
        McpServerFeatures.SyncToolSpecification base = McpToolUtils.toSyncToolSpecification(callback, mimeType);
        McpSchema.Tool tool = McpSchema.Tool.builder()
                .name(base.tool().name())
                .title(base.tool().title())
                .description(base.tool().description())
                .inputSchema(base.tool().inputSchema())
                .outputSchema(base.tool().outputSchema())
                .meta(base.tool().meta())
                .annotations(READ_ONLY_TOOLS.contains(toolName) ? READ_ONLY_ANNOTATIONS : WRITE_ANNOTATIONS)
                .build();
        return McpServerFeatures.SyncToolSpecification.builder()
                .tool(tool)
                .callHandler(base.callHandler())
                .build();
    }
}
