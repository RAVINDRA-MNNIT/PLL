package com.prolearner.all.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    // =============================================================
    // PASSWORD ENCODER
    // =============================================================
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // =============================================================
    // SECURITY FILTER CHAIN
    // =============================================================
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http

                // =====================================================
                // CSRF
                // =====================================================
                .csrf(csrf -> csrf.disable())

                // =====================================================
                // AUTHORIZATION
                // =====================================================
                .authorizeHttpRequests(auth -> auth

                        // =================================================
                        // PUBLIC ROOT / LOGIN PAGES
                        // =================================================
                        .requestMatchers(
                                "/",
                                "/login.html",
                                "/student-login.html"
                        ).permitAll()

                        // =================================================
                        // PUBLIC STATIC RESOURCES
                        // =================================================
                        .requestMatchers(
                                "/css/**",
                                "/js/**",
                                "/images/**",
                                "/img/**",
                                "/fonts/**",
                                "/favicon.ico"
                        ).permitAll()

                        // =================================================
                        // PUBLIC HTML PAGES / HTML FRAGMENTS
                        // =================================================
                        //
                        // These pages can be loaded by the browser.
                        // Their API calls are still protected separately.
                        //
                        .requestMatchers(
                                "/admin.html",
                                "/manager.html",
                                "/admission.html",
                                "/pending-approvals.html",
                                "/transaction.html",
                                "/student-details.html",
                                "/student-issues.html",
                                "/student-id-card.html",
                                "/verify-student.html",
                                "/studentStrength.html",
                                "/fee.html",
                                "/configuration.html",
                                "/batches.html",
                                "/student.html",
                                "/bulk-id-cards.html"
                        ).permitAll()

                        // =================================================
                        // PUBLIC AUTH APIs
                        // =================================================
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/student/login",
                                "/api/auth/logout"
                        ).permitAll()

                        // =================================================
                        // CURRENT USER
                        // =================================================
                        .requestMatchers(
                                "/api/auth/me"
                        ).authenticated()

                        // =================================================
                        // PUBLIC USER LOOKUP
                        // =================================================
                        //
                        // Login page can load the user list.
                        // Other methods remain protected.
                        //
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/users"
                        ).permitAll()

                        // =================================================
                        // LOOKUP APIs
                        // =================================================
                        .requestMatchers(
                                "/api/lookups/**"
                        ).permitAll()

                        // =================================================
                        // PUBLIC ADMISSION APPLICATION
                        // =================================================
                        .requestMatchers(
                                "/api/members/applications"
                        ).permitAll()

                        // =================================================
                        // USER MANAGEMENT APIs — ADMIN ONLY
                        // =================================================
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/users/addUser"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/users/deleteUser/**"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/users/updateUser"
                        ).hasRole("ADMIN")

                        // =================================================
                        // EVERYTHING ELSE
                        // =================================================
                        //
                        // All other API endpoints require authentication.
                        //
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )

                // =============================================================
                // JWT FILTER
                // =============================================================
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}