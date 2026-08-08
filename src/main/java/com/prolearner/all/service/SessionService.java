package com.prolearner.all.service;

import org.springframework.stereotype.Service;

import com.prolearner.all.dto.LoginResponse;
import com.prolearner.all.entity.UserRole;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

@Service
public class SessionService {

    public static final String SESSION_USER = "loggedInUser";

    private static final int SESSION_TIMEOUT = 30 * 60;

    /**
     * Creates a fresh authenticated session.
     */
    public void createSession(
            HttpServletRequest request,
            LoginResponse user
    ) {

        HttpSession oldSession = request.getSession(false);

        if (oldSession != null) {
            oldSession.invalidate();
        }

        HttpSession session = request.getSession(true);

        session.setAttribute(
                SESSION_USER,
                user
        );

        session.setMaxInactiveInterval(SESSION_TIMEOUT);
    }

    /**
     * Returns the current session.
     */
    public HttpSession getSession(
            HttpServletRequest request
    ) {

        HttpSession session = request.getSession(false);

        if (session == null) {
            throw new IllegalStateException(
                    "Session expired. Please login again."
            );
        }

        return session;
    }

    /**
     * Returns the currently logged-in user.
     */
    public LoginResponse getCurrentUser(
            HttpServletRequest request
    ) {

        Object sessionUser =
                getSession(request)
                        .getAttribute(SESSION_USER);

        if (!(sessionUser instanceof LoginResponse user)) {

            throw new IllegalStateException(
                    "User is not logged in."
            );
        }

        return user;
    }

    /**
     * Returns logged-in user ID.
     */
    public Long getCurrentUserId(
            HttpServletRequest request
    ) {

        return getCurrentUser(request).id();
    }

    /**
     * Returns logged-in user's full name.
     */
    public String getCurrentUserName(
            HttpServletRequest request
    ) {

        return getCurrentUser(request).fullName();
    }

    /**
     * Returns logged-in user's role.
     */
    public UserRole getCurrentUserRole(
            HttpServletRequest request
    ) {

        return getCurrentUser(request).role();
    }

    /**
     * Checks whether user is logged in.
     */
    public boolean isLoggedIn(
            HttpServletRequest request
    ) {

        HttpSession session = request.getSession(false);

        return session != null
                && session.getAttribute(SESSION_USER)
                        instanceof LoginResponse;
    }

    /**
     * Invalidates current session.
     */
    public void invalidate(
            HttpServletRequest request
    ) {

        HttpSession session =
                request.getSession(false);

        if (session != null) {
            session.invalidate();
        }
    }
}