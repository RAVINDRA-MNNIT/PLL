package com.prolearner.all.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final TokenRevocationService tokenRevocationService;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            TokenRevocationService tokenRevocationService
    ) {
        this.jwtService = jwtService;
        this.tokenRevocationService = tokenRevocationService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // =========================================================
        // GET AUTHORIZATION HEADER
        // =========================================================
        String authorizationHeader = request.getHeader("Authorization");

        // =========================================================
        // NO JWT TOKEN
        // =========================================================
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // =========================================================
        // EXTRACT TOKEN
        // =========================================================
        String token = authorizationHeader.substring(7);
        try {
            // =====================================================
            // VALIDATE JWT
            // =====================================================
            if (!jwtService.isTokenValid(token)) {
                SecurityContextHolder.clearContext();
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"message\":\"Invalid or expired token.\"}");
                return;
            }

            // =====================================================
            // EXTRACT TOKEN ID (jti)
            // =====================================================
            String tokenId = jwtService.extractTokenId(token);

            // =====================================================
            // CHECK TOKEN REVOCATION
            // =====================================================
            if (tokenRevocationService.isTokenRevoked(tokenId)) {
                SecurityContextHolder.clearContext();
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"message\":\"Token has been revoked. Please login again.\"}");
                return;
            }

            // =====================================================
            // DON'T REPLACE EXISTING AUTHENTICATION
            // =====================================================
            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                // =================================================
                // EXTRACT USER ID
                // =================================================
                Long userId = jwtService.extractUserId(token);

                // =================================================
                // CREATE AUTHENTICATION
                // =================================================
                String role = jwtService.extractRole(token);
                List<GrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role));
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(userId, null, authorities);

                // =================================================
                // REQUEST DETAILS
                // =================================================
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // =================================================
                // SET SECURITY CONTEXT
                // =================================================
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            // =====================================================
            // INVALID / EXPIRED / MALFORMED JWT
            // =====================================================
            SecurityContextHolder.clearContext();
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Invalid authentication token.\"}");
            return;
        }

        // =========================================================
        // CONTINUE REQUEST
        // =========================================================
        filterChain.doFilter(request, response);
    }
}