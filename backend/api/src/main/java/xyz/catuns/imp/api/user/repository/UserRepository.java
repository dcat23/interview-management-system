package xyz.catuns.imp.api.user.repository;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import xyz.catuns.imp.api.user.entity.User;
import xyz.catuns.spring.jwt.domain.repository.UserEntityRepository;

@Repository
public interface UserRepository extends UserEntityRepository<User>, JpaSpecificationExecutor<User> {

    boolean existsByEmail(String email);
}
