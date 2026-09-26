package com.prolearner.all.controller;

import java.util.List;

import com.prolearner.all.dto.*;
import com.prolearner.all.entity.StudentComplaint;
import com.prolearner.all.entity.StudentWarning;
import org.springframework.data.domain.Page;
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
            @RequestParam(defaultValue = "false") boolean pendingFees,
            @RequestParam(defaultValue = "false") boolean discount,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page - 1, size);
        return studentService.getStudents(
                searchBy,
                searchKey,
                batchId,
                enrollmentStatus,
                pendingFees,
                discount,
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

    @PostMapping("/addwarning")
    public void addWarning(@RequestBody AddWarningRequest request) {
        studentService.addWarning(request);
    }

    @PostMapping("/addcomplaint")
    public void addComplaint(@RequestBody AddComplaintRequest request) {
        studentService.addComplaint(request);
    }

    @GetMapping("/getwarnings/{studentId}")
    public List<StudentWarning> getStudentWarnings(
            @PathVariable Long studentId) {
        return studentService.getStudentWarnings(studentId);
    }

    @GetMapping("/getcomplaints/{studentId}")
    public List<StudentComplaint> getStudentComplaints(
            @PathVariable Long studentId) {
        return studentService.getStudentComplaints(studentId);
    }

    @DeleteMapping("/deletewarning/{warningId}")
    public void deleteWarning(
            @PathVariable Long warningId) {
        studentService.deleteWarning(warningId);
    }

    @DeleteMapping("/deletecomplaint/{complaintId}")
    public void deleteComplaint(
            @PathVariable Long complaintId) {
        studentService.deleteComplaint(complaintId);
    }

    @GetMapping("/getallcomplaints")
    public Page<StudentComplaintResponse> getAllComplaints(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search
    ) {
        return studentService.getAllComplaints(
                page,
                size,
                search
        );
    }

    @GetMapping("/getallwarnings")
    public Page<StudentWarningResponse> getAllWarnings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search
    ) {
        return studentService.getAllWarnings(
                page,
                size,
                search
        );
    }

    @PutMapping("/resolvecomplaint/{complaintId}")
    public void resolveComplaint(
            @PathVariable Long complaintId) {

        studentService.resolveComplaint(complaintId);
    }
}