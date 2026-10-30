package com.prolearner.all.dto;

public class PrintLaterResponse {

    private Long studentId;
    private Boolean printLater;

    public PrintLaterResponse(Long studentId, Boolean printLater) {
        this.studentId = studentId;
        this.printLater = printLater;
    }

    public Long getStudentId() {
        return studentId;
    }

    public Boolean getPrintLater() {
        return printLater;
    }
}