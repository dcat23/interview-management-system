package xyz.catuns.imp.api.session.entity;

import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.usertype.UserType;

import java.io.Serializable;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.Objects;

public class ChangeSourceType implements UserType<ChangeSource> {

    @Override
    public int getSqlType() {
        return Types.OTHER;
    }

    @Override
    public Class<ChangeSource> returnedClass() {
        return ChangeSource.class;
    }

    @Override
    public boolean equals(ChangeSource x, ChangeSource y) {
        return Objects.equals(x, y);
    }

    @Override
    public int hashCode(ChangeSource x) {
        return x == null ? 0 : x.hashCode();
    }

    @Override
    public ChangeSource nullSafeGet(ResultSet rs, int position, SharedSessionContractImplementor session, Object owner)
            throws SQLException {
        String value = rs.getString(position);
        return value == null ? null : ChangeSource.valueOf(value.toUpperCase());
    }

    @Override
    public void nullSafeSet(PreparedStatement st, ChangeSource value, int index, SharedSessionContractImplementor session)
            throws SQLException {
        if (value == null) {
            st.setNull(index, Types.OTHER);
        } else {
            st.setObject(index, value.name().toLowerCase(), Types.OTHER);
        }
    }

    @Override
    public ChangeSource deepCopy(ChangeSource value) {
        return value;
    }

    @Override
    public boolean isMutable() {
        return false;
    }

    @Override
    public Serializable disassemble(ChangeSource value) {
        return value;
    }

    @Override
    public ChangeSource assemble(Serializable cached, Object owner) {
        return (ChangeSource) cached;
    }
}
