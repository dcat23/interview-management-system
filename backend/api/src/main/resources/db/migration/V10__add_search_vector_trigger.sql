CREATE OR REPLACE FUNCTION questions_search_vector_update()
    RETURNS trigger AS
$$
BEGIN
    NEW.search_vector :=
            setweight(to_tsvector('english', coalesce(NEW.topic, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(NEW.body, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER questions_search_vector_trigger
    BEFORE INSERT OR UPDATE
    ON questions
    FOR EACH ROW
EXECUTE FUNCTION questions_search_vector_update();
