package com.prolearner.all.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.prolearner.all.dto.ConfigurationDTO;
import com.prolearner.all.entity.Configuration;
import com.prolearner.all.repository.BatchRepository;
import com.prolearner.all.repository.ConfigurationRepository;
import com.prolearner.all.repository.SeatRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.prolearner.all.dto.SeatResponse;

@Service
public class LookupService {

    private final JdbcTemplate jdbcTemplate;
    private final ConfigurationRepository configurationRepo;
    private final BatchRepository batchRepo;
    private final SeatRepository seatRepo;

    public LookupService(JdbcTemplate jdbcTemplate, ConfigurationRepository configurationRepo,
                         BatchRepository batchRepo,
                         SeatRepository seatRepo) {
        this.jdbcTemplate = jdbcTemplate;
        this.configurationRepo = configurationRepo;
        this.batchRepo = batchRepo;
        this.seatRepo = seatRepo;
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
        return batchRepo.findAllOrderedByCategory()
                .stream()
                .map(batch -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", batch.getId());
                    map.put("name", batch.getBatchName());
                    map.put("batchAlias", batch.getBatchAlias());
                    map.put("category", batch.getCategory());
                    map.put("room", batch.getRoom());
                    map.put("baseAmount", batch.getBaseAmount());
                    map.put("isActive", batch.getIsActive());
                    return map;
                })
                .toList();
    }

    /**
     * Returns all active seats.
     */
    public List<SeatResponse> getSeats() {
        return seatRepo.findByIsActiveTrueOrderById()
                .stream()
                .map(seat -> new SeatResponse(
                        seat.getId(),
                        seat.getSeatNumber(),
                        seat.getIsActive(),
                        seat.getStudentId()
                ))
                .toList();
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