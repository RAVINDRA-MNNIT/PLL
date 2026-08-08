package com.prolearner.all;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordGenerator {

    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        System.out.println("Manager: " + encoder.encode("abhi1234"));
        System.out.println("Admin 1: " + encoder.encode("digital12"));
        System.out.println("Admin 2: " + encoder.encode("digital12"));
    }
}