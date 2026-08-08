package com.prolearner.all.dto;

import java.math.BigDecimal;

public record PendingCollectionSummaryResponse(

    BigDecimal totalCash,

    BigDecimal totalOnline

) {}