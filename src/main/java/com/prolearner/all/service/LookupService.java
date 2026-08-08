package com.prolearner.all.service;

import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.prolearner.all.dto.SeatResponse;

@Service
public class LookupService {

    private final JdbcTemplate jdbcTemplate;

    public LookupService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Returns all qualification values from PostgreSQL enum.
     */
    public List<String> getQualifications() {
        return getEnumValues("qualification");
    }

    /**
     * Returns all preparation values from PostgreSQL enum.
     */
    public List<String> getPreparations() {
        return getEnumValues("preparation");
    }

    /**
     * Returns all active batches.
     */
    public List<Map<String, Object>> getBatches() {

        String sql = """
                SELECT
                    id,
                    batch_name
                FROM library.batches
                WHERE is_active = TRUE
                ORDER BY batch_name
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> Map.of(
                        "id", rs.getLong("id"),
                        "name", rs.getString("batch_name")
                )
        );
    }

    /**
     * Returns all active seats.
     */
    public List<SeatResponse> getSeats() {

        String sql = """
                SELECT
                    id,
                    seat_number,
                    is_active
                FROM library.seats
                WHERE is_active = TRUE
                ORDER BY seat_number
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new SeatResponse(
                        rs.getLong("id"),
                        rs.getString("seat_number"),
                        rs.getBoolean("is_active")
                )
        );
    }

    /**
     * Reads values from a PostgreSQL enum.
     */
    private List<String> getEnumValues(
            String enumName
    ) {

        String sql = """
                SELECT e.enumlabel
                FROM pg_type t
                JOIN pg_enum e
                    ON e.enumtypid = t.oid
                JOIN pg_namespace n
                    ON n.oid = t.typnamespace
                WHERE n.nspname = 'library'
                  AND t.typname = ?
                ORDER BY e.enumsortorder
                """;

        return jdbcTemplate.queryForList(
                sql,
                String.class,
                enumName
        );
    }
}