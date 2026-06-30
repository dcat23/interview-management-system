package xyz.catuns.imp.api.config.properties;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import xyz.catuns.imp.api.user.entity.UserRole;

import java.util.ArrayList;
import java.util.List;

@Data
@ConfigurationProperties(prefix = "app.seed")
public class SeedDataProperties {

    /**
     * Seed Data Users
     */
    private List<SeedDataUser> users = new ArrayList<>();

    public record SeedDataUser(String name, String email, UserRole role, String password) {

        public SeedDataUser {
            if (name == null || name.isBlank()) throw new IllegalArgumentException("Seed user 'name' is required");
            if (role == null) throw new IllegalArgumentException("Seed user 'role' is required");
            if (email == null || email.isBlank()) email = name.toLowerCase().replace("\\W+", ".") + "@system.local";
            if (password == null) password = "";
        }
    }
}
