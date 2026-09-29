package xyz.catuns.imp.api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
// Same context as the MockMvc test classes, so the suite starts one set of containers, not two.
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiApplicationTests {

    @Test
    void contextLoads() {
    }

}
