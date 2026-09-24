package com.prolearner.all.enums;

/**
 * Defines all supported pending request types
 */
public enum RequestType {
    ADMISSION,
    FEES,
    SEAT,
    DETAILS,
    BATCH,
    PENDING_FEES,
    DISCOUNT,
    ENROLLMENT;

    public static RequestType from(String value) {
        try {
            return RequestType.valueOf(value.toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid request type: " + value);
        }
    }
}