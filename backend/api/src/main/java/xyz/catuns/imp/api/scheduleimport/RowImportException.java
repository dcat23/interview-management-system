package xyz.catuns.imp.api.scheduleimport;

/** Signals a single CSV row can't be imported; caught per-row so the rest of the batch still runs. */
public class RowImportException extends RuntimeException {

    public RowImportException(String message) {
        super(message);
    }
}
