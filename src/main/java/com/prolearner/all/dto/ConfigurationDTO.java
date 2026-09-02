package com.prolearner.all.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
@Data
public class ConfigurationDTO {

    @JsonProperty("LIBRARY_NAME")
    private String libraryName;

    @JsonProperty("FINE_PER_DAY")
    private Integer finePerDay;

    @JsonProperty("DAYS_FOR_EXPIRE")
    private Integer daysForExpire;

    @JsonProperty("DAYS_FOR_DISCONTINUE")
    private Integer daysForDiscontinue;

    @JsonProperty("DAYS_BEFORE_NEXT_FEE_SUBMIT")
    private Integer daysBeforeNextFeeSubmit;

    @JsonProperty("PAGE_LIMIT")
    private Integer pageLimit;

    @JsonProperty("PAGE_SORTING")
    private String pageSorting;

    @JsonProperty("UPDATE_FULL_DETAIL")
    private Boolean updateFullDetail;

    @JsonProperty("ONLINE_ADMISSION_ENABLED")
    private Boolean onlineAdmissionEnabled;

    @JsonProperty("MANAGER_LOGIN_ENABLE")
    private Boolean managerLoginEnable;

    @JsonProperty("MANAGER_CAN_UPDATE_EXPENSES")
    private Boolean managerCanUpdateExpenses;

    @JsonProperty("MANAGER_CAN_UPDATE_CASH_EXPENSES")
    private Boolean managerCanUpdateCashExpenses;

    @JsonProperty("MANAGER_CAN_UPDATE_ONLINE_EXPENSES")
    private Boolean managerCanUpdateOnlineExpenses;

    @JsonProperty("STUDENT_LOGIN_ENABLED")
    private Boolean studentLoginEnabled;

    @JsonProperty("STUDENT_DETAIL_UPDATE_ENABLE")
    private Boolean studentDetailUpdateEnable;

    @JsonProperty("STUDENT_FEE_UPDATE_ENABLE")
    private Boolean studentFeeUpdateEnable;

    @JsonProperty("STUDENT_SEAT_UPDATE_ENABLE")
    private Boolean studentSeatUpdateEnable;
}