package com.prolearner.all.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            .csrf(csrf -> csrf.disable())

            .authorizeHttpRequests(auth -> auth

                // Public pages/resources
                .requestMatchers(
                    "/",
                    "/login.html"
                ).permitAll()

                // Login page needs these before authentication
                .requestMatchers(
                    "/api/users",
                    "/api/users/**",
                    "/api/auth/**"
                ).permitAll()

                // HTML pages
                // Authorization is currently handled by /api/auth/me
                // and your application session.
                .requestMatchers(
                    "/manager.html",
                    "/admin.html",
                    "/admission.html"
                ).permitAll()

                // Manager lookup APIs
                .requestMatchers(
                    "/api/lookups/**"
                ).permitAll()

                // Admission API
                // Your controller/service must verify the manager session.
                .requestMatchers(
                    "/api/members/applications"
                ).permitAll()

                .anyRequest().permitAll()
            );

        return http.build();
    }
}