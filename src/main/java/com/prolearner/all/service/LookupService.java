package com.prolearner.all.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.prolearner.all.dto.ConfigurationDTO;
import com.prolearner.all.entity.Configuration;
import com.prolearner.all.repository.ConfigurationRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.prolearner.all.dto.SeatResponse;

@Service
public class LookupService {

    private final JdbcTemplate jdbcTemplate;
    private final ConfigurationRepository configurationRepo;

    public LookupService(JdbcTemplate jdbcTemplate, ConfigurationRepository configurationRepo) {
        this.jdbcTemplate = jdbcTemplate;
        this.configurationRepo = configurationRepo;
    }

    /**
     * Returns all application configurations.
     */
    public ConfigurationDTO getConfigurations() {

        Map<String, String> configs = configurationRepo.findAll()
                .stream()
                .collect(Collectors.toMap(
                        Configuration::getProperty,
                        Configuration::getValue
                ));

        ConfigurationDTO dto = new ConfigurationDTO();

        // General
        dto.setLibraryName(configs.get("LIBRARY_NAME"));
        dto.setFinePerDay(Integer.parseInt(configs.get("FINE_PER_DAY")));
        dto.setDaysForExpire(Integer.parseInt(configs.get("DAYS_FOR_EXPIRE")));
        dto.setDaysForDiscontinue(Integer.parseInt(configs.get("DAYS_FOR_DISCONTINUE")));
        dto.setPageLimit(Integer.parseInt(configs.get("PAGE_LIMIT")));
        dto.setPageSorting(configs.get("PAGE_SORTING"));
        dto.setUpdateFullDetail(Boolean.parseBoolean(configs.get("UPDATE_FULL_DETAIL")));
        dto.setDaysBeforeNextFeeSubmit(Integer.parseInt(configs.get("DAYS_BEFORE_NEXT_FEE_SUBMIT")));

        // Manager
        dto.setOnlineAdmissionEnabled(Boolean.parseBoolean(configs.get("ONLINE_ADMISSION_ENABLED")));
        dto.setManagerLoginEnable(Boolean.parseBoolean(configs.get("MANAGER_LOGIN_ENABLE")));
        dto.setManagerCanUpdateExpenses(Boolean.parseBoolean(configs.get("MANAGER_CAN_UPDATE_EXPENSES")));
        dto.setManagerCanUpdateCashExpenses(Boolean.parseBoolean(configs.get("MANAGER_CAN_UPDATE_CASH_EXPENSES")));
        dto.setManagerCanUpdateOnlineExpenses(Boolean.parseBoolean(configs.get("MANAGER_CAN_UPDATE_ONLINE_EXPENSES")));

        // Student
        dto.setStudentLoginEnabled(Boolean.parseBoolean(configs.get("STUDENT_LOGIN_ENABLED")));
        dto.setStudentDetailUpdateEnable(Boolean.parseBoolean(configs.get("STUDENT_DETAIL_UPDATE_ENABLE")));
        dto.setStudentFeeUpdateEnable(Boolean.parseBoolean(configs.get("STUDENT_FEE_UPDATE_ENABLE")));
        dto.setStudentSeatUpdateEnable(Boolean.parseBoolean(configs.get("STUDENT_SEAT_UPDATE_ENABLE")));

        return dto;
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
                    batch_name,
                    batch_alias
                FROM library.batches
                WHERE is_active = TRUE
                ORDER BY id;
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> Map.of(
                        "id", rs.getLong("id"),
                        "name", rs.getString("batch_name"),
                        "batchAlias", rs.getString("batch_alias")
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
                is_active,
                student_id
            FROM library.seats
            WHERE is_active = TRUE
            ORDER BY id;
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new SeatResponse(
                        rs.getLong("id"),
                        rs.getString("seat_number"),
                        rs.getBoolean("is_active"),
                        rs.getLong("student_id")
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