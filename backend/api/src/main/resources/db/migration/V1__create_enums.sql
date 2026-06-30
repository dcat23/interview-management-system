CREATE TYPE user_role AS ENUM ('candidate', 'marketer', 'supporter', 'admin');

CREATE TYPE process_status AS ENUM ('active', 'completed', 'withdrawn', 'cancelled');

CREATE TYPE session_status AS ENUM (
    'scheduled',
    'in_review',
    'passed',
    'rejected',
    'no_show',
    'cancelled'
);

CREATE TYPE change_source AS ENUM ('manual', 'background_job');
