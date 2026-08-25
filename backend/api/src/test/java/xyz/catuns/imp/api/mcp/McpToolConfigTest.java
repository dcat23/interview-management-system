package xyz.catuns.imp.api.mcp;

import io.modelcontextprotocol.server.McpServerFeatures;
import io.modelcontextprotocol.spec.McpSchema;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mockito;
import org.springframework.ai.mcp.server.common.autoconfigure.properties.McpServerProperties;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import xyz.catuns.imp.api.client.ClientService;
import xyz.catuns.imp.api.question.QuestionSearchService;
import xyz.catuns.imp.api.question.SessionQuestionService;
import xyz.catuns.imp.api.session.InterviewSessionService;
import xyz.catuns.imp.api.user.UserService;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Proves the MCP tool metadata actually emitted for the connector: the six read-only lookups get
 * {@code readOnlyHint: true, destructiveHint: false}, and the two mutating tools get
 * {@code readOnlyHint: false} — see {@link McpToolConfig}. Before the fix, every tool's
 * {@code McpSchema.Tool#annotations()} was {@code null} (Spring AI's default
 * {@code ToolCallbackConverterAutoConfiguration} never sets them), which is why connectors that
 * gate write confirmation on {@code readOnlyHint} required confirmation for every tool call.
 */
class McpToolConfigTest {

    private static final List<String> READ_ONLY_TOOL_NAMES = List.of(
            "search_clients", "search_sessions", "search_questions", "search_candidates",
            "get_session", "list_session_questions");

    private static final List<String> WRITE_TOOL_NAMES = List.of(
            "add_questions_to_session", "link_existing_question");

    private final McpToolConfig config = new McpToolConfig();

    private List<McpServerFeatures.SyncToolSpecification> syncTools() {
        LookupTools lookupTools = new LookupTools(Mockito.mock(ClientService.class), Mockito.mock(UserService.class),
                Mockito.mock(InterviewSessionService.class), Mockito.mock(QuestionSearchService.class),
                Mockito.mock(SessionQuestionService.class));
        QuestionWriteTools questionWriteTools = new QuestionWriteTools(Mockito.mock(SessionQuestionService.class));

        ToolCallbackProvider provider = MethodToolCallbackProvider.builder()
                .toolObjects(lookupTools, questionWriteTools)
                .build();

        return config.syncTools(provider, new McpServerProperties());
    }

    @Test
    void exposesAllEightTools() {
        List<McpServerFeatures.SyncToolSpecification> tools = syncTools();

        assertThat(tools).extracting(spec -> spec.tool().name())
                .containsExactlyInAnyOrder("search_clients", "search_sessions", "search_questions",
                        "search_candidates", "get_session", "list_session_questions",
                        "add_questions_to_session", "link_existing_question");
    }

    @ParameterizedTest
    @ValueSource(strings = { "search_clients", "search_sessions", "search_questions", "search_candidates",
            "get_session", "list_session_questions" })
    void readOnlyToolsAreAnnotatedReadOnly(String toolName) {
        McpSchema.ToolAnnotations annotations = annotationsFor(toolName);

        assertThat(annotations).isNotNull();
        assertThat(annotations.readOnlyHint()).isTrue();
        assertThat(annotations.destructiveHint()).isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = { "add_questions_to_session", "link_existing_question" })
    void writeToolsAreNotAnnotatedReadOnly(String toolName) {
        McpSchema.ToolAnnotations annotations = annotationsFor(toolName);

        assertThat(annotations).isNotNull();
        assertThat(annotations.readOnlyHint()).isFalse();
    }

    private McpSchema.ToolAnnotations annotationsFor(String toolName) {
        Map<String, McpServerFeatures.SyncToolSpecification> byName = syncTools().stream()
                .collect(java.util.stream.Collectors.toMap(spec -> spec.tool().name(), spec -> spec));
        assertThat(byName).containsKey(toolName);
        return byName.get(toolName).tool().annotations();
    }
}
