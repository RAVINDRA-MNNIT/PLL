package com.prolearner.all.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.prolearner.all.entity.User;
import com.prolearner.all.entity.UserRole;

public interface UserRepository extends JpaRepository<User, Long> {

    List<User> findByRoleAndActiveTrue(UserRole role);

    Optional<User> findByIdAndActiveTrue(Long id);
}