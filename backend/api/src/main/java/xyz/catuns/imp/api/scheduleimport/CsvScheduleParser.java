package xyz.catuns.imp.api.scheduleimport;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Component;
import xyz.catuns.imp.api.scheduleimport.dto.ScheduleCsvRow;
import xyz.catuns.spring.base.exception.controller.BadRequestException;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Parses the interview schedule sheet's columns
 * (Candidate Name, Lead Name, Technology, Interview Date, Time, Duration,
 * Mode of interview, Client name, Interview Round, Status) into raw rows.
 * Blank trailing rows (the sheet always has a few) are skipped.
 */
@Component
public class CsvScheduleParser {

    private static final CSVFormat FORMAT = CSVFormat.DEFAULT.builder()
            .setHeader()
            .setSkipHeaderRecord(true)
            .setIgnoreSurroundingSpaces(true)
            .setTrim(true)
            .build();

    public List<ScheduleCsvRow> parse(InputStream inputStream) {
        List<ScheduleCsvRow> rows = new ArrayList<>();
        try (CSVParser parser = CSVParser.parse(
                new InputStreamReader(inputStream, StandardCharsets.UTF_8), FORMAT)) {
            for (CSVRecord record : parser) {
                String candidateName = value(record, "Candidate Name");
                if (candidateName.isBlank()) {
                    continue;
                }
                rows.add(new ScheduleCsvRow(
                        (int) record.getRecordNumber() + 1,
                        candidateName,
                        value(record, "Lead Name"),
                        value(record, "Technology"),
                        value(record, "Interview Date"),
                        value(record, "Time"),
                        value(record, "Duration"),
                        value(record, "Mode of interview"),
                        value(record, "Client name"),
                        value(record, "Interview Round"),
                        value(record, "Status")
                ));
            }
        } catch (IOException e) {
            throw new BadRequestException("Unable to read CSV file: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Malformed CSV file: " + e.getMessage());
        }
        return rows;
    }

    private static String value(CSVRecord record, String column) {
        if (!record.isMapped(column)) {
            return "";
        }
        String value = record.get(column);
        return value == null ? "" : value.trim();
    }
}
