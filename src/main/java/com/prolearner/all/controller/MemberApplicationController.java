package com.prolearner.all.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.prolearner.all.dto.MemberApplicationRequest;
import com.prolearner.all.dto.MemberApplicationResponse;
import com.prolearner.all.service.MemberApplicationService;
import com.prolearner.all.service.SessionService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/members")
public class MemberApplicationController {

    private final MemberApplicationService service;
    private final SessionService sessionService;

    public MemberApplicationController(
            MemberApplicationService service,
            SessionService sessionService
    ) {
        this.service = service;
        this.sessionService = sessionService;
    }

    @PostMapping("/applications")
    public ResponseEntity<?> createApplication(
            @RequestBody MemberApplicationRequest request,
            HttpServletRequest httpRequest
    ) {

        try {

            Long managerId =
                    sessionService.getCurrentUserId(httpRequest);

            MemberApplicationResponse response =
                    service.createApplication(
                            request,
                            managerId
                    );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(response);

        } catch (IllegalStateException exception) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "message",
                            exception.getMessage()
                    ));

        } catch (SecurityException exception) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message",
                            exception.getMessage()
                    ));

        } catch (IllegalArgumentException exception) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            exception.getMessage()
                    ));

        } catch (Exception exception) {

            exception.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "message",
                            "Unexpected server error."
                    ));
        }
    }
}