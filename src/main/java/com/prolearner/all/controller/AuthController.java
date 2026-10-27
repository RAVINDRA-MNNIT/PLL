package com.prolearner.all.controller;

import com.prolearner.all.dto.LoginRequest;
import com.prolearner.all.dto.LoginResponse;
import com.prolearner.all.security.JwtService;
import com.prolearner.all.security.TokenRevocationService;
import com.prolearner.all.service.AuthService;
import com.prolearner.all.service.SessionService;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final SessionService sessionService;
    private final JwtService jwtService;
    private final TokenRevocationService tokenRevocationService;

    public AuthController(
            AuthService authService,
            SessionService sessionService,
            JwtService jwtService,
            TokenRevocationService tokenRevocationService
    ) {
        this.authService = authService;
        this.sessionService = sessionService;
        this.jwtService = jwtService;
        this.tokenRevocationService = tokenRevocationService;
    }

    // =========================
    // LOGIN
    // =========================

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        try {
            LoginResponse user = authService.login(
                    request.userId(),
                    request.password()
            );

            // Create JWT token after successful authentication
            String token = jwtService.generateToken(
                    request.userId(),
                    user.role().name()
            );

            // Keep existing HTTP session for now
            sessionService.createSession(
                    httpRequest,
                    user
            );

            return ResponseEntity.ok(
                    Map.of(
                            "token", token,
                            "user", user
                    )
            );

        } catch (IllegalArgumentException exception) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(
                            Map.of(
                                    "message",
                                    exception.getMessage()
                            )
                    );
        }
    }


    // =========================
    // CURRENT USER
    // =========================

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        // No authenticated user
        if (authentication == null ||
                !authentication.isAuthenticated()) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(
                            Map.of(
                                    "message",
                                    "User is not authenticated."
                            )
                    );
        }

        try {
            Object principal = authentication.getPrincipal();
            Long userId;

            // JwtAuthenticationFilter stores Long userId
            // as the authentication principal.
            if (principal instanceof Long) {
                userId = (Long) principal;
            } else {
                userId = Long.valueOf(principal.toString());
            }

            // Load current user
            LoginResponse user;
            String role = authentication.getAuthorities()
                    .iterator()
                    .next()
                    .getAuthority();
            if ("ROLE_STUDENT".equals(role)) {
                user = authService.getCurrentStudent(userId);
            } else {
                user = authService.getCurrentUser(userId);
            }
            return ResponseEntity.ok(user);
        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(
                            Map.of(
                                    "message",
                                    exception.getMessage() != null
                                            ? exception.getMessage()
                                            : "Unable to load current user."
                            )
                    );
        }
    }


    // =========================
    // LOGOUT
    // =========================

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            HttpServletRequest request
    ) {
        // =========================================================
        // GET JWT FROM AUTHORIZATION HEADER
        // =========================================================
        String authorizationHeader = request.getHeader("Authorization");

        // =========================================================
        // REVOKE CURRENT JWT
        // =========================================================
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            String token = authorizationHeader.substring(7);
            try {
                // -------------------------------------------------
                // Extract JWT ID (jti)
                // -------------------------------------------------
                String tokenId = jwtService.extractTokenId(token);
                // -------------------------------------------------
                // Revoke JWT by jti
                // -------------------------------------------------
                tokenRevocationService.revoke(tokenId);
            } catch (Exception exception) {
                // -------------------------------------------------
                // Token is invalid/expired/malformed.
                // We still continue with session invalidation.
                // -------------------------------------------------
                // No action required.
            }
        }

        // =========================================================
        // INVALIDATE EXISTING HTTP SESSION
        // =========================================================
        sessionService.invalidate(request);
        // =========================================================
        // CLEAR SPRING SECURITY CONTEXT
        // =========================================================
        SecurityContextHolder.clearContext();
        // =========================================================
        // RESPONSE
        // =========================================================
        return ResponseEntity
                .ok(
                        Map.of(
                                "message",
                                "Logout successful."
                        )
                );
    }

    // =========================
    // STUDENT LOGIN
    // =========================
    @PostMapping("/student/login")
    public ResponseEntity<?> studentLogin(
            @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        try {
            LoginResponse user = authService.studentLogin(
                    request.userId(),
                    request.password()
            );
            // Create JWT token after successful student authentication
            String token = jwtService.generateToken(
                    request.userId(),
                    user.role().name()
            );
            // Keep existing HTTP session for now
            sessionService.createSession(httpRequest, user);
            return ResponseEntity.ok(
                    Map.of(
                            "token", token,
                            "user", user
                    )
            );
        } catch (IllegalArgumentException exception) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(
                            Map.of(
                                    "message",
                                    exception.getLocalizedMessage()
                            )
                    );
        }
    }
}