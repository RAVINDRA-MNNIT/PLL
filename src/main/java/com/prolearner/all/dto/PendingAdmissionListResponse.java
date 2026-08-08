package com.prolearner.all.dto;
import java.math.BigDecimal;
import java.util.List;


public record PendingAdmissionListResponse(

    BigDecimal totalCash,

    BigDecimal totalOnline,

    List<PendingAdmissionResponse> requests

) {}