package com.prolearner.all.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.prolearner.all.dto.LoginRequest;
import com.prolearner.all.dto.LoginResponse;
import com.prolearner.all.service.AuthService;
import com.prolearner.all.service.SessionService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final SessionService sessionService;

    public AuthController(
            AuthService authService,
            SessionService sessionService
    ) {
        this.authService = authService;
        this.sessionService = sessionService;
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

            sessionService.createSession(
                    httpRequest,
                    user
            );

            return ResponseEntity.ok(user);

        } catch (IllegalArgumentException exception) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid user or password");
        }
    }

    // =========================
    // CURRENT USER
    // =========================

    @GetMapping("/me")
    public ResponseEntity<?> me(
            HttpServletRequest request
    ) {

        try {

            return ResponseEntity.ok(
                    sessionService.getCurrentUser(request)
            );

        } catch (IllegalStateException exception) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(exception.getMessage());
        }
    }

    // =========================
    // LOGOUT
    // =========================

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            HttpServletRequest request
    ) {

        sessionService.invalidate(request);

        return ResponseEntity.ok().build();
    }

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

            sessionService.createSession(
                    httpRequest,
                    user
            );

            return ResponseEntity.ok(user);

        } catch (IllegalArgumentException exception) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(exception.getLocalizedMessage());
        }
    }
}