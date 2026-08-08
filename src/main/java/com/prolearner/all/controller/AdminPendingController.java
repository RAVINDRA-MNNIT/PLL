// package com.prolearner.all.controller;

// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;

// import java.util.Map;

// import com.prolearner.all.service.ManagerApprovalService;

// /**
//  * ============================================================
//  * 📌 AdminPendingController
//  * ============================================================
//  * 
//  * PURPOSE:
//  * - Handles ADMIN-level actions
//  * 
//  * RESPONSIBILITY:
//  * - Approve requests
//  * - Reject requests
//  * - Clear processed requests
//  * 
//  * SECURITY:
//  * - Only Admin should access these APIs
//  * ============================================================
//  */
// @RestController
// @RequestMapping("/api/admin/pending")
// public class AdminPendingController {

//     private final ManagerApprovalService service;

//     public AdminPendingController(ManagerApprovalService service) {
//         this.service = service;
//     }

//     // ====================================================
//     // 🔹 APPROVE APIs
//     // ====================================================

//     @PatchMapping("/seats/{id}/approve")
//     public ResponseEntity<?> approveSeat(@PathVariable Long id) {
//         service.approveSeat(id);
//         return ok("Seat approved");
//     }

//     // (Add same pattern for admission, fee, details, enrollment)

//     // ====================================================
//     // 🔹 REJECT APIs
//     // ====================================================

//     @PatchMapping("/seats/{id}/reject")
//     public ResponseEntity<?> rejectSeat(
//             @PathVariable Long id,
//             @RequestBody Map<String, String> body
//     ) {
//         service.rejectSeat(id, body.get("reason"));
//         return ok("Seat rejected");
//     }

//     // ====================================================
//     // 🔹 CLEAR API
//     // ====================================================

//     /**
//      * Clears ONLY processed requests:
//      * - Approved
//      * - Rejected
//      * - Cancelled
//      */
//     @DeleteMapping("/clear")
//     public ResponseEntity<?> clearProcessedRequests() {
//         service.clearProcessedRequests();
//         return ok("Processed requests cleared");
//     }

//     private ResponseEntity<Map<String, String>> ok(String message) {
//         return ResponseEntity.ok(Map.of("message", message));
//     }
// }