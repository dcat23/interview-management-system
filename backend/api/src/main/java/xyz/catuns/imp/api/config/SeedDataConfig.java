package xyz.catuns.imp.api.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import xyz.catuns.imp.api.config.properties.SeedDataProperties;
import xyz.catuns.imp.api.user.dto.CreateUserRequest;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.mapper.UserMapper;
import xyz.catuns.imp.api.user.repository.UserRepository;

@Slf4j
@Profile("seed-data")
@Configuration
@RequiredArgsConstructor
@EnableConfigurationProperties(SeedDataProperties.class)
public class SeedDataConfig implements CommandLineRunner {

    private final SeedDataProperties seedDataProperties;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    @Override
    @Transactional
    public void run(String... args) {
        for (SeedDataProperties.SeedDataUser seedUser : seedDataProperties.getUsers()) {
            if (userRepository.existsByEmail(seedUser.email())) {
                log.info("Seed user already exists, skipping: {}", seedUser.email());
                continue;
            }
            CreateUserRequest request = new CreateUserRequest(
                    seedUser.name(),
                    seedUser.email(),
                    seedUser.password(),
                    seedUser.role()
            );
            User user = userMapper.toEntity(request);
            user.setPassword(passwordEncoder.encode(seedUser.password()));
            userRepository.save(user);
            log.info("Seed user created: {} [{}]", seedUser.email(), seedUser.role());
        }
    }
}
