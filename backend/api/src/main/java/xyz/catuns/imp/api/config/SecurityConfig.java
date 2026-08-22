package xyz.catuns.imp.api.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.DefaultSecurityFilterChain;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;
import xyz.catuns.imp.api.apikey.ApiKeyAuthFilter;
import xyz.catuns.imp.api.apikey.ApiKeyTokenProvider;
import xyz.catuns.imp.api.apikey.repository.ApiKeyRepository;
import xyz.catuns.imp.api.auth.BlocklistAwareTokenProvider;
import xyz.catuns.imp.api.user.repository.UserRepository;
import xyz.catuns.spring.jwt.autoconfigure.properties.JwtProperties;
import xyz.catuns.spring.jwt.security.OrderedSecurityFilterChain;
import xyz.catuns.spring.jwt.security.configurer.JwtExceptionHandlingConfigurer;
import xyz.catuns.spring.jwt.security.configurer.JwtFilterConfigurer;
import xyz.catuns.spring.jwt.security.configurer.JwtSecurityConfigurer;
import xyz.catuns.spring.jwt.security.filter.JwtTokenValidatorFilter;
import xyz.catuns.spring.jwt.security.properties.JwtSecurityProperties;

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

    @Bean
    ApiKeyTokenProvider apiKeyTokenProvider(JwtProperties jwtProperties, ApiKeyRepository apiKeyRepository) {
        return new ApiKeyTokenProvider(jwtProperties, apiKeyRepository);
    }

    @Bean
    ApiKeyAuthFilter apiKeyAuthFilter(ApiKeyRepository apiKeyRepository, ApiKeyTokenProvider apiKeyTokenProvider,
                                       UserRepository userRepository) {
        return new ApiKeyAuthFilter(apiKeyRepository, apiKeyTokenProvider, userRepository);
    }

    @Bean
    RequestLoggingFilter requestLoggingFilter() {
        return new RequestLoggingFilter();
    }

    /**
     * jwt-spring-boot-starter's own SecurityFilterChain bean (JwtSecurityAutoConfiguration) is
     * {@code @ConditionalOnMissingBean(name = "jwtSecurityFilterChain")} — its documented extension
     * point for composing a custom chain. This bean takes over under that same name so
     * {@link ApiKeyAuthFilter} can run in the same chain as the JWT validator, ahead of it: when
     * X-API-Key is present it sets the Authentication (ROLE_AI_AGENT), and
     * JwtTokenValidatorFilter's own shouldNotFilter() then skips, leaving JWT Bearer auth unaffected.
     * Everything else below is an unmodified copy of the starter's default bean.
     */
    @Bean(name = "jwtSecurityFilterChain")
    SecurityFilterChain jwtSecurityFilterChain(
            HttpSecurity http,
            ApiKeyAuthFilter apiKeyAuthFilter,
            RequestLoggingFilter requestLoggingFilter,
            JwtFilterConfigurer filterConfigurer,
            JwtExceptionHandlingConfigurer exceptionConfigurer,
            JwtSecurityConfigurer jwtSecurityConfigurer,
            JwtSecurityProperties properties,
            @Qualifier("corsConfigurationSource") CorsConfigurationSource corsConfigurationSource
    ) throws Exception {

        http.with(jwtSecurityConfigurer, jwt -> {
            jwt.exceptionConfigurer(() -> exceptionConfigurer);
            jwt.filterConfigurer(() -> filterConfigurer);

            if (!properties.getFilter().isValidator()) {
                jwt.disableValidator();
            }
            if (!properties.getFilter().isGenerator()) {
                jwt.disableGenerator();
            }
            if (!properties.getFilter().isExceptionHandler()) {
                jwt.disableExceptionHandler();
            }
        });

        if (properties.getCors().isEnabled()) {
            http.cors(cors -> cors
                    .configurationSource(corsConfigurationSource));
        } else {
            http.cors(AbstractHttpConfigurer::disable);
        }

        http.csrf(AbstractHttpConfigurer::disable);

        http.authorizeHttpRequests(auth -> {
            String[] publicPaths = properties.getPublicPaths();
            if (publicPaths.length > 0) {
                auth.requestMatchers(publicPaths).permitAll();
            }
            auth.anyRequest().authenticated();
        });

        // ApiKeyAuthFilter must be registered (and so have a known position in Spring
        // Security's FilterComparator) before requestLoggingFilter can be positioned
        // relative to it below — addFilterBefore(x, ApiKeyAuthFilter.class) throws if
        // ApiKeyAuthFilter isn't already registered.
        http.addFilterBefore(apiKeyAuthFilter, UsernamePasswordAuthenticationFilter.class);
        // Logs every request, including ones rejected before authentication — must run
        // earlier in the chain than ApiKeyAuthFilter, not just before UsernamePasswordAuthenticationFilter.
        http.addFilterBefore(requestLoggingFilter, ApiKeyAuthFilter.class);

        DefaultSecurityFilterChain chain = http.build();
        int order = properties.getFilter().getOrder();
        return new OrderedSecurityFilterChain(chain, order);
    }
}
