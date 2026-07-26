ALTER TABLE interview_processes ADD COLUMN job_id varchar(50);

CREATE INDEX idx_processes_job_id ON interview_processes(job_id);

-- Enforces the app-layer matching key at the DB level; only applies when job_id is known
CREATE UNIQUE INDEX uq_processes_candidate_client_job
  ON interview_processes(candidate_id, end_client_id, job_id)
  WHERE job_id IS NOT NULL;
