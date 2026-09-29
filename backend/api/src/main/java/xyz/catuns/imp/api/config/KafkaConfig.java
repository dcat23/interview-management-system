package xyz.catuns.imp.api.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// ProducerFactory/KafkaTemplate come from Boot's KafkaAutoConfiguration, which applies the
// spring.kafka.producer.* settings plus KafkaConnectionDetails (@ServiceConnection in tests)
// and SSL bundles (the aiven profile). A hand-built factory from
// KafkaProperties.buildProducerProperties() silently gets neither.
@Configuration
class KafkaConfig {

    @Value("${app.kafka.topics.session-status-changed}")
    private String sessionStatusChangedTopicName;

    @Value("${app.kafka.partitions:1}")
    private int partitions;

    @Value("${app.kafka.replicas:1}")
    private short replicas;

    @Bean
    NewTopic sessionStatusChangedTopic() {
        return new NewTopic(sessionStatusChangedTopicName, partitions, replicas);
    }

}
