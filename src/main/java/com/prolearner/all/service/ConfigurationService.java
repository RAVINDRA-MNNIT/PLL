package com.prolearner.all.service;

import com.prolearner.all.dto.ConfigurationDTO;
import com.prolearner.all.entity.Configuration;
import com.prolearner.all.repository.ConfigurationRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ConfigurationService {

    private final ConfigurationRepository configurationRepo;

    public ConfigurationService(ConfigurationRepository configurationRepo) {
        this.configurationRepo = configurationRepo;
    }

    public void saveGeneralConfiguration(ConfigurationDTO configuration) {

        update("LIBRARY_NAME", configuration.getLibraryName());
        update("FINE_PER_DAY", String.valueOf(configuration.getFinePerDay()));
        update("DAYS_FOR_EXPIRE", String.valueOf(configuration.getDaysForExpire()));
        update("DAYS_FOR_DISCONTINUE", String.valueOf(configuration.getDaysForDiscontinue()));
        update("DAYS_BEFORE_NEXT_FEE_SUBMIT", String.valueOf(configuration.getDaysBeforeNextFeeSubmit()));
        update("PAGE_LIMIT", String.valueOf(configuration.getPageLimit()));
        update("PAGE_SORTING", configuration.getPageSorting());
        update("UPDATE_FULL_DETAIL", String.valueOf(configuration.getUpdateFullDetail()));
    }

    public void saveManagerConfiguration(ConfigurationDTO configuration) {

        update("ONLINE_ADMISSION_ENABLED",
                String.valueOf(configuration.getOnlineAdmissionEnabled()));

        update("MANAGER_LOGIN_ENABLE",
                String.valueOf(configuration.getManagerLoginEnable()));

        update("MANAGER_CAN_UPDATE_EXPENSES",
                String.valueOf(configuration.getManagerCanUpdateExpenses()));

        update("MANAGER_CAN_UPDATE_CASH_EXPENSES",
                String.valueOf(configuration.getManagerCanUpdateCashExpenses()));

        update("MANAGER_CAN_UPDATE_ONLINE_EXPENSES",
                String.valueOf(configuration.getManagerCanUpdateOnlineExpenses()));
    }

    public void saveStudentConfiguration(ConfigurationDTO configuration) {

        update("STUDENT_LOGIN_ENABLED",
                String.valueOf(configuration.getStudentLoginEnabled()));

        update("STUDENT_DETAIL_UPDATE_ENABLE",
                String.valueOf(configuration.getStudentDetailUpdateEnable()));

        update("STUDENT_FEE_UPDATE_ENABLE",
                String.valueOf(configuration.getStudentFeeUpdateEnable()));

        update("STUDENT_SEAT_UPDATE_ENABLE",
                String.valueOf(configuration.getStudentSeatUpdateEnable()));
    }

    private void update(String property, String value) {

        Configuration configuration = configurationRepo.findById(property)
                .orElseThrow(() ->
                        new RuntimeException("Configuration not found: " + property));

        configuration.setValue(value);

        configurationRepo.save(configuration);
    }

    public int getDaysForDiscontinue() {
        return Integer.parseInt(
                configurationRepo.findByProperty("DAYS_FOR_DISCONTINUE")
                        .orElseThrow(() -> new RuntimeException("Configuration not found"))
                        .getValue()
        );
    }

    public int getDaysForExpire() {
        return Integer.parseInt(
                configurationRepo.findByProperty("DAYS_FOR_EXPIRE")
                        .orElseThrow(() -> new RuntimeException("Configuration not found"))
                        .getValue()
        );
    }

    public boolean getManagerLoginEnable() {
        return Boolean.parseBoolean(
                configurationRepo.findByProperty("MANAGER_LOGIN_ENABLE")
                        .orElseThrow(() -> new RuntimeException("Configuration not found"))
                        .getValue()
        );
    }

    public boolean getStudentLoginEnable() {
        return Boolean.parseBoolean(
                configurationRepo.findByProperty("STUDENT_LOGIN_ENABLED")
                        .orElseThrow(() -> new RuntimeException("Configuration not found"))
                        .getValue()
        );
    }

    @Transactional
    public void resetConfiguration() {

        List<Configuration> configurations =
                configurationRepo.findAll();

        configurations.forEach(configuration ->
                configuration.setValue(
                        configuration.getDefaultValue()
                )
        );

        configurationRepo.saveAll(configurations);
    }
}
