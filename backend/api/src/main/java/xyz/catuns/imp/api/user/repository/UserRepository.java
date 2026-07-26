package xyz.catuns.imp.api.user.repository;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.imp.api.user.entity.UserRole;
import xyz.catuns.spring.jwt.domain.repository.UserEntityRepository;

import java.util.List;

@Repository
public interface UserRepository extends UserEntityRepository<User>, JpaSpecificationExecutor<User> {

    boolean existsByEmail(String email);

    List<User> findByRole(UserRole role);

    List<User> findByRoleAndActiveTrue(UserRole role);
}
