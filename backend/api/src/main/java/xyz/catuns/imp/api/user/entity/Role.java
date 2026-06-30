package xyz.catuns.imp.api.user.entity;

import xyz.catuns.spring.jwt.domain.entity.RoleEntity;

class Role extends RoleEntity {

    Role(UserRole userRole) {
        this.name = "ROLE_" + userRole.name();
    }
}
