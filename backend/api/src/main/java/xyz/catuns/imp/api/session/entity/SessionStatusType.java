package xyz.catuns.imp.api.session.entity;

import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.usertype.UserType;

import java.io.Serializable;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.Objects;

public class SessionStatusType implements UserType<SessionStatus> {

    @Override
    public int getSqlType() {
        return Types.OTHER;
    }

    @Override
    public Class<SessionStatus> returnedClass() {
        return SessionStatus.class;
    }

    @Override
    public boolean equals(SessionStatus x, SessionStatus y) {
        return Objects.equals(x, y);
    }

    @Override
    public int hashCode(SessionStatus x) {
        return x == null ? 0 : x.hashCode();
    }

    @Override
    public SessionStatus nullSafeGet(ResultSet rs, int position, SharedSessionContractImplementor session, Object owner)
            throws SQLException {
        String value = rs.getString(position);
        return value == null ? null : SessionStatus.valueOf(value.toUpperCase());
    }

    @Override
    public void nullSafeSet(PreparedStatement st, SessionStatus value, int index, SharedSessionContractImplementor session)
            throws SQLException {
        if (value == null) {
            st.setNull(index, Types.OTHER);
        } else {
            st.setObject(index, value.name().toLowerCase(), Types.OTHER);
        }
    }

    @Override
    public SessionStatus deepCopy(SessionStatus value) {
        return value;
    }

    @Override
    public boolean isMutable() {
        return false;
    }

    @Override
    public Serializable disassemble(SessionStatus value) {
        return value;
    }

    @Override
    public SessionStatus assemble(Serializable cached, Object owner) {
        return (SessionStatus) cached;
    }
}
