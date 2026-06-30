package xyz.catuns.imp.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import xyz.catuns.imp.api.auth.BlocklistAwareTokenProvider;
import xyz.catuns.spring.jwt.autoconfigure.properties.JwtProperties;

@Configuration
@EnableMethodSecurity
@EnableJpaAuditing
class SecurityConfig {

    @Bean
    BlocklistAwareTokenProvider blocklistAwareTokenProvider(JwtProperties jwtProperties,
                                                            StringRedisTemplate redis) {
        return new BlocklistAwareTokenProvider(jwtProperties, redis);
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
