package com.prolearner.all.dto;

public class StudentIdAllocation {

    private final Long studentId;
    private final Long reusableStudentId;

    public StudentIdAllocation(Long studentId, Long reusableStudentId) {
        this.studentId = studentId;
        this.reusableStudentId = reusableStudentId;
    }

    public Long getStudentId() {
        return studentId;
    }

    public Long getReusableStudentId() {
        return reusableStudentId;
    }
}
