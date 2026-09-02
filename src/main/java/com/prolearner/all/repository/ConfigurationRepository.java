package com.prolearner.all.repository;


import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;

import com.prolearner.all.entity.Configuration;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface ConfigurationRepository
        extends JpaRepository<Configuration, String> {
    Optional<Configuration> findByProperty(String property);
}