package xyz.catuns.imp.api.process.entity;

import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.usertype.UserType;

import java.io.Serializable;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.Objects;

public class ProcessStatusType implements UserType<ProcessStatus> {

    @Override
    public int getSqlType() {
        return Types.OTHER;
    }

    @Override
    public Class<ProcessStatus> returnedClass() {
        return ProcessStatus.class;
    }

    @Override
    public boolean equals(ProcessStatus x, ProcessStatus y) {
        return Objects.equals(x, y);
    }

    @Override
    public int hashCode(ProcessStatus x) {
        return x == null ? 0 : x.hashCode();
    }

    @Override
    public ProcessStatus nullSafeGet(ResultSet rs, int position, SharedSessionContractImplementor session, Object owner)
            throws SQLException {
        String value = rs.getString(position);
        return value == null ? null : ProcessStatus.valueOf(value.toUpperCase());
    }

    @Override
    public void nullSafeSet(PreparedStatement st, ProcessStatus value, int index, SharedSessionContractImplementor session)
            throws SQLException {
        if (value == null) {
            st.setNull(index, Types.OTHER);
        } else {
            st.setObject(index, value.name().toLowerCase(), Types.OTHER);
        }
    }

    @Override
    public ProcessStatus deepCopy(ProcessStatus value) {
        return value;
    }

    @Override
    public boolean isMutable() {
        return false;
    }

    @Override
    public Serializable disassemble(ProcessStatus value) {
        return value;
    }

    @Override
    public ProcessStatus assemble(Serializable cached, Object owner) {
        return (ProcessStatus) cached;
    }
}
