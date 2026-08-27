package com.prolearner.all.dto;

import java.math.BigDecimal;

public class PendingCollectionSummaryResponse {

    private BigDecimal cashCollection;
    private BigDecimal onlineCollection;
    private BigDecimal cashPendingExpenses;
    private BigDecimal onlinePendingExpenses;

    public PendingCollectionSummaryResponse() {
    }

    public PendingCollectionSummaryResponse(
            BigDecimal cashCollection,
            BigDecimal onlineCollection,
            BigDecimal cashPendingExpenses,
            BigDecimal onlinePendingExpenses) {
        this.cashCollection = cashCollection;
        this.onlineCollection = onlineCollection;
        this.cashPendingExpenses = cashPendingExpenses;
        this.onlinePendingExpenses = onlinePendingExpenses;
    }

    public BigDecimal getCashCollection() {
        return cashCollection;
    }

    public void setCashCollection(BigDecimal cashCollection) {
        this.cashCollection = cashCollection;
    }

    public BigDecimal getOnlineCollection() {
        return onlineCollection;
    }

    public void setOnlineCollection(BigDecimal onlineCollection) {
        this.onlineCollection = onlineCollection;
    }

    public BigDecimal getCashPendingExpenses() {
        return cashPendingExpenses;
    }

    public void setCashPendingExpenses(BigDecimal cashPendingExpenses) {
        this.cashPendingExpenses = cashPendingExpenses;
    }

    public BigDecimal getOnlinePendingExpenses() {
        return onlinePendingExpenses;
    }

    public void setOnlinePendingExpenses(BigDecimal onlinePendingExpenses) {
        this.onlinePendingExpenses = onlinePendingExpenses;
    }
}