package xyz.catuns.imp.api.user.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.entity.UserRole;
import xyz.catuns.imp.api.user.repository.UserRepository;

import java.util.List;

@Profile("!prod")
@Configuration
@RequiredArgsConstructor
public class UserConfig {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;

    @PostConstruct
    public void init() {
        repository.saveAll(List.of(
                buildUser(UserRole.ADMIN),
                buildUser(UserRole.CANDIDATE),
                buildUser(UserRole.MARKETER),
                buildUser(UserRole.SUPPORTER)
        ));
    }

    private User buildUser(UserRole userRole) {
        User user = new User();
        user.setName(userRole.name().charAt(0) + userRole.name().substring(1).toLowerCase());
        user.setEmail(userRole.name().toLowerCase() + "@system.local");
        user.setPassword(passwordEncoder.encode("Password1!"));
        user.setRole(userRole);
        return user;
    }
}
