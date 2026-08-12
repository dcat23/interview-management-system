package xyz.catuns.imp.api.apikey.entity;

import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.usertype.UserType;

import java.io.Serializable;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.Objects;

public class ApiKeyScopeType implements UserType<ApiKeyScope> {

    @Override
    public int getSqlType() {
        return Types.OTHER;
    }

    @Override
    public Class<ApiKeyScope> returnedClass() {
        return ApiKeyScope.class;
    }

    @Override
    public boolean equals(ApiKeyScope x, ApiKeyScope y) {
        return Objects.equals(x, y);
    }

    @Override
    public int hashCode(ApiKeyScope x) {
        return x == null ? 0 : x.hashCode();
    }

    @Override
    public ApiKeyScope nullSafeGet(ResultSet rs, int position, SharedSessionContractImplementor session, Object owner)
            throws SQLException {
        String value = rs.getString(position);
        return value == null ? null : ApiKeyScope.valueOf(value.toUpperCase());
    }

    @Override
    public void nullSafeSet(PreparedStatement st, ApiKeyScope value, int index, SharedSessionContractImplementor session)
            throws SQLException {
        if (value == null) {
            st.setNull(index, Types.OTHER);
        } else {
            st.setObject(index, value.name().toLowerCase(), Types.OTHER);
        }
    }

    @Override
    public ApiKeyScope deepCopy(ApiKeyScope value) {
        return value;
    }

    @Override
    public boolean isMutable() {
        return false;
    }

    @Override
    public Serializable disassemble(ApiKeyScope value) {
        return value;
    }

    @Override
    public ApiKeyScope assemble(Serializable cached, Object owner) {
        return (ApiKeyScope) cached;
    }
}
