package com.prolearner.all.controller;

import java.util.List;

import com.prolearner.all.dto.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import com.prolearner.all.service.StudentService;

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


    @GetMapping("/strength/overall")
    public OverallStrengthResponse getOverallStrength() {
        return studentService.getOverallStrength();
    }

    @GetMapping("/strength/fullday")
    public FullDayStrengthResponse getFullDayStrength() {
        return studentService.getStrength(List.of("R1", "R2", "R3"));
    }

    @GetMapping("/strength/room1")
    public FullDayStrengthResponse getRoom1Strength() {
        return studentService.getStrength(List.of("R1"));
    }

    @GetMapping("/strength/room2")
    public ShiftStrengthResponse getRoom2Strength() {
        return studentService.getRoom2Strength();
    }

    @GetMapping("/strength/room3")
    public ShiftStrengthResponse getRoom3Strength() {
        return studentService.getRoom3Strength();
    }
}