package com.prolearner.all.controller;

import java.util.List;

import com.prolearner.all.dto.*;
import com.prolearner.all.entity.Students;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.prolearner.all.service.SessionService;
import com.prolearner.all.service.StudentService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService studentService;

    public StudentController(
            StudentService studentService
    ) {
        this.studentService = studentService;
    }

    @GetMapping
    public StudentListResponse getStudents(
            @RequestParam(defaultValue = "all") String searchBy,
            @RequestParam(required = false) String searchKey,
            @RequestParam(required = false) Long batchId,
            @RequestParam(defaultValue = "all") String enrollmentStatus,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page - 1, size);
        return studentService.getStudents(
                searchBy,
                searchKey,
                batchId,
                enrollmentStatus,
                pageable
        );
    }

    @GetMapping("/{studentId}")
    public StudentDetailsResponse getStudentDetails(
            @PathVariable Long studentId) {
        return studentService.getStudentDetails(studentId);
    }

    @GetMapping("/feeHistory/{studentId}")
    public List<StudentFeeHistoryResponse> getStudentFeeHistory(
            @PathVariable Long studentId) {
        return studentService.getStudentFeeHistory(studentId);
    }
}