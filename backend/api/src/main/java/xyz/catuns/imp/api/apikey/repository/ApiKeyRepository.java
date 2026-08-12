package xyz.catuns.imp.api.apikey.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import xyz.catuns.imp.api.apikey.entity.ApiKey;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, UUID> {

    Optional<ApiKey> findByKeyHash(String keyHash);

    List<ApiKey> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
}
