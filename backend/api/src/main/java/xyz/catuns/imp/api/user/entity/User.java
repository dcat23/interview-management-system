package xyz.catuns.imp.api.user.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;
import xyz.catuns.spring.jwt.domain.entity.RoleEntity;
import xyz.catuns.spring.jwt.domain.entity.UserEntity;

import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@AttributeOverride(name = "password", column = @Column(name = "password_hash", nullable = false))
@Getter
@Setter
@NoArgsConstructor
public class User extends UserEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Type(UserRoleType.class)
    @Column(name = "role", nullable = false)
    private UserRole role;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Override
    public Collection<? extends RoleEntity> getRoles() {
        return role == null ? List.of() : List.of(new Role(role));
    }

    @Override
    public boolean isEnabled() {
        return active;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return active;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
}
