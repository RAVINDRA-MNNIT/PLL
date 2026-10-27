package com.prolearner.all.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;


    // =========================================================
    // SIGNING KEY
    // =========================================================
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    // =========================================================
    // GENERATE JWT TOKEN
    // =========================================================
    public String generateToken(Long userId, String role) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expiration);
        String tokenId = UUID.randomUUID().toString();
        return Jwts.builder()
                .id(tokenId)
                .subject(String.valueOf(userId))
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getSigningKey())
                .compact();
    }

    // =========================================================
    // EXTRACT USER ID
    // =========================================================
    public Long extractUserId(String token) {
        String subject = getClaims(token).getSubject();
        return Long.valueOf(subject);
    }

    // =========================================================
    // EXTRACT TOKEN ID (jti)
    // =========================================================
    public String extractTokenId(String token) {
        return getClaims(token).getId();
    }

    // =========================================================
    // EXTRACT EXPIRATION
    // =========================================================
    public Date extractExpiration(String token) {
        return getClaims(token).getExpiration();
    }

    // =========================================================
    // VALIDATE TOKEN
    // =========================================================
    public boolean isTokenValid(String token) {
        try {
            Claims claims = getClaims(token);
            // Explicit expiration check.
            //
            // JJWT parser also validates expiration, but keeping
            // this check here makes the intention explicit.
            Date expirationDate = claims.getExpiration();
            return expirationDate != null && expirationDate.after(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    // =========================================================
    // GET CLAIMS
    // =========================================================
    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
    public String extractRole(String token) {
        return getClaims(token).get("role", String.class);
    }
}