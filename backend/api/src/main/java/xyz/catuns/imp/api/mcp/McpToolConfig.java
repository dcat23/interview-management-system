package xyz.catuns.imp.api.mcp;

import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registers the MCP tool surface consumed by Spring AI's MCP server autoconfiguration, which
 * collects {@link ToolCallbackProvider} beans to build the tool list advertised over SSE.
 * <p>
 * The server itself (SSE transport, endpoint paths, protocol) is fully autoconfigured by
 * {@code spring-ai-starter-mcp-server-webmvc} from the {@code spring.ai.mcp.server.*} properties
 * in application.yaml — it registers a plain {@code RouterFunction} handled by the same
 * DispatcherServlet as every other endpoint, so it runs through the existing security filter
 * chain unchanged: {@code ApiKeyAuthFilter} authenticates it and {@code anyRequest().authenticated()}
 * rejects unauthenticated connections with 401, exactly as for the REST API.
 */
@Configuration
public class McpToolConfig {

    @Bean
    ToolCallbackProvider questionCaptureTools(LookupTools lookupTools, QuestionWriteTools questionWriteTools) {
        return MethodToolCallbackProvider.builder()
                .toolObjects(lookupTools, questionWriteTools)
                .build();
    }
}
