package com.prolearner.all.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.prolearner.all.dto.StudentDetailsResponse;
import com.prolearner.all.dto.StudentFeeResponse;
import com.prolearner.all.dto.StudentResponse;
import com.prolearner.all.dto.UpdateFeeRequest;
import com.prolearner.all.service.SessionService;
import com.prolearner.all.service.StudentService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService studentService;
    private final SessionService sessionService;

    public StudentController(
            StudentService studentService,
            SessionService sessionService
    ) {
        this.studentService = studentService;
        this.sessionService = sessionService;
    }

    /**
     * Returns all students.
     */
    @GetMapping
    public List<StudentResponse> getStudents() {
        return studentService.getStudents();
    }

    /**
     * Returns fee details for a student.
     */
    @GetMapping("/{studentId}/fees")
    public StudentFeeResponse getStudentFees(
            @PathVariable Long studentId
    ) {
        return studentService.getStudentFees(studentId);
    }

    /**
     * Creates a fee update approval request.
     */
    @PostMapping("/{studentId}/fees")
    public ResponseEntity<Void> submitFeeUpdateRequest(
            @PathVariable Long studentId,
            @RequestBody UpdateFeeRequest request,
            HttpServletRequest httpRequest
    ) {

        Long managerId =
                sessionService.getCurrentUserId(httpRequest);

        studentService.submitFeeUpdateRequest(
                studentId,
                managerId,
                request
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .build();
    }

        @PutMapping("/pending-fees/{requestId}")
        public ResponseEntity<?> updatePendingFee(
                @PathVariable Long requestId,
                @RequestBody UpdateFeeRequest request
        ) {

        studentService.updatePendingFeeRequest(
                requestId,
                request
        );

        return ResponseEntity.ok().build();
        }

        @GetMapping("/{studentId}")
        public StudentDetailsResponse getStudentDetails(
                @PathVariable Long studentId) {

        return studentService.getStudentDetails(studentId);

        }
}