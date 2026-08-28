package com.prolearner.all.service;

import com.prolearner.all.entity.ApprovalRequest;
import com.prolearner.all.entity.Students;
import com.prolearner.all.entity.UserRole;
import com.prolearner.all.enums.EnrollmentStatus;
import com.prolearner.all.enums.PendingRequestStatus;
import com.prolearner.all.enums.RequestType;
import com.prolearner.all.repository.ApprovalRequestRepository;
import com.prolearner.all.repository.StudentRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.prolearner.all.dto.LoginResponse;
import com.prolearner.all.entity.User;
import com.prolearner.all.repository.UserRepository;

import java.time.LocalDate;
import java.util.Objects;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final StudentRepository studentRepository;
    private final ApprovalRequestRepository approvalRequestRepository;


    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder, StudentRepository studentRepository, ApprovalRequestRepository approvalRequestRepository
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.studentRepository = studentRepository;
        this.approvalRequestRepository = approvalRequestRepository;
    }

    public LoginResponse login(Long userId, String password) {

        User user = userRepository.findByIdAndActiveTrue(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Invalid user or password")
                );

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid user or password");
        }

        return new LoginResponse(
                user.getId(),
                user.getFullName(),
                user.getRole()
        );
    }

    public LoginResponse studentLogin(Long studentId, String password) {

        Students student = studentRepository
                .findById(studentId)
                .orElse(null);

        if (student == null) {
            ApprovalRequest approvalRequest = approvalRequestRepository
                    .findByStudentId(studentId)
                    .orElseThrow(() ->
                            new IllegalArgumentException("Invalid user")
                    );
            throw new IllegalArgumentException("Your admission request is not approved by admin yet, Please try after sometime.");
        }

        if (Objects.equals(student.getEnrollmentStatus(), EnrollmentStatus.TERMINATED.name())) {
            throw new IllegalArgumentException("You are Terminated, Please contact admin or in office.");
        }

        String fullName = student.getFullName();
    //    LocalDate dob = student.getDateOfBirth();
        String mobileNo = student.getMobileNumber();


        // Generate expected password
        String firstTwoLetters = fullName
                .replaceAll("\\s+", "")
                .substring(0, 2)
                .toUpperCase();

        String lastThreeDigits = mobileNo.substring(mobileNo.length() - 3);

    //    String year = String.valueOf(dob.getYear());

        String expectedPassword = firstTwoLetters + lastThreeDigits; //+ year;

        // Validate password
        if (!expectedPassword.equals(password)) {
            throw new IllegalArgumentException("Invalid Password");
        }

        return new LoginResponse(
                studentId,
                student.getFullName(),
                UserRole.STUDENT
        );
    }
}