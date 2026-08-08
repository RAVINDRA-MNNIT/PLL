// package com.prolearner.all.controller;

// import jakarta.servlet.http.HttpServletRequest;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;

// import java.util.Map;

// import com.prolearner.all.dto.MemberApplicationRequest;
// import com.prolearner.all.service.ManagerApprovalService;
// import com.prolearner.all.service.SessionService;

// /**
//  * ============================================================
//  * 📌 ManagerPendingController
//  * ============================================================
//  * 
//  * PURPOSE:
//  * - Handles actions performed by MANAGER
//  * 
//  * RESPONSIBILITY:
//  * - Update pending requests
//  * - Cancel requests (created by manager)
//  * 
//  * SECURITY:
//  * - Only Manager should access these APIs
//  * ============================================================
//  */
// @RestController
// @RequestMapping("/api/manager/pending")
// public class ManagerPendingController {

//     private final ManagerApprovalService service;
//     private final SessionService sessionService;

//     public ManagerPendingController(
//             ManagerApprovalService service,
//             SessionService sessionService
//     ) {
//         this.service = service;
//         this.sessionService = sessionService;
//     }

//     // ====================================================
//     // 🔹 UPDATE APIs
//     // ====================================================

//     /**
//      * Update admission request
//      */
//     @PutMapping("/admissions/{id}")
//     public ResponseEntity<?> updateAdmission(
//             @PathVariable Long id,
//             @RequestBody MemberApplicationRequest request
//     ) {
//         service.updatePendingAdmission(id, request);
//         return ok("Admission updated successfully");
//     }

//     /**
//      * Update fee request
//      */
//     @PutMapping("/fees/{id}")
//     public ResponseEntity<?> updateFee(
//             @PathVariable Long id,
//             @RequestBody Map<String, Object> request
//     ) {
//         service.updatePendingFee(id, request);
//         return ok("Fee updated successfully");
//     }

//     // ====================================================
//     // 🔹 CANCEL APIs
//     // ====================================================

//     /**
//      * Cancel admission request
//      */
//     @PatchMapping("/admissions/{id}/cancel")
//     public ResponseEntity<?> cancelAdmission(
//             @PathVariable Long id,
//             HttpServletRequest req
//     ) {
//         Long userId = sessionService.getCurrentUserId(req);
//         service.cancelPendingAdmission(id, userId);
//         return ok("Admission cancelled");
//     }

//     /**
//      * Cancel fee request
//      */
//     @PatchMapping("/fees/{id}/cancel")
//     public ResponseEntity<?> cancelFee(
//             @PathVariable Long id,
//             HttpServletRequest req
//     ) {
//         Long userId = sessionService.getCurrentUserId(req);
//         service.cancelPendingFee(id, userId);
//         return ok("Fee cancelled");
//     }

//     /**
//      * Cancel seat request
//      */
//     @PatchMapping("/seats/{id}/cancel")
//     public ResponseEntity<?> cancelSeat(
//             @PathVariable Long id,
//             HttpServletRequest req
//     ) {
//         Long userId = sessionService.getCurrentUserId(req);
//         service.cancelPendingSeat(id, userId);
//         return ok("Seat request cancelled");
//     }

//     /**
//      * Cancel details update request
//      */
//     @PatchMapping("/details/{id}/cancel")
//     public ResponseEntity<?> cancelDetails(
//             @PathVariable Long id,
//             HttpServletRequest req
//     ) {
//         Long userId = sessionService.getCurrentUserId(req);
//         service.cancelPendingDetails(id, userId);
//         return ok("Details request cancelled");
//     }

//     /**
//      * Cancel enrollment request
//      */
//     @PatchMapping("/enrollments/{id}/cancel")
//     public ResponseEntity<?> cancelEnrollment(
//             @PathVariable Long id,
//             HttpServletRequest req
//     ) {
//         Long userId = sessionService.getCurrentUserId(req);
//         service.cancelPendingEnrollment(id, userId);
//         return ok("Enrollment request cancelled");
//     }

//     // ====================================================
//     // 🔹 COMMON RESPONSE BUILDER
//     // ====================================================

//     private ResponseEntity<Map<String, String>> ok(String message) {
//         return ResponseEntity.ok(Map.of("message", message));
//     }
// }