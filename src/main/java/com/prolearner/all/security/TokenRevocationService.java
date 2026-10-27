package com.prolearner.all.security;

import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TokenRevocationService {

    /*
     * Stores revoked JWT IDs (jti).
     *
     * ConcurrentHashMap-backed Set is thread-safe and works
     * correctly when multiple requests are processed at once.
     */
    private final Set<String> revokedTokens =
            ConcurrentHashMap.newKeySet();


    // =========================================================
    // REVOKE TOKEN
    // =========================================================

    public void revoke(String tokenId) {

        if (tokenId == null || tokenId.isBlank()) {
            return;
        }

        revokedTokens.add(tokenId);
    }


    // =========================================================
    // CHECK WHETHER TOKEN IS REVOKED
    // =========================================================

    public boolean isTokenRevoked(String tokenId) {

        if (tokenId == null || tokenId.isBlank()) {
            return false;
        }

        return revokedTokens.contains(tokenId);
    }


    // =========================================================
    // OPTIONAL: REMOVE REVOKED TOKEN
    // =========================================================

    public void remove(String tokenId) {

        if (tokenId == null || tokenId.isBlank()) {
            return;
        }

        revokedTokens.remove(tokenId);
    }
}