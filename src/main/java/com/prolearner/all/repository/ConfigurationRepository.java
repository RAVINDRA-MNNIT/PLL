package com.prolearner.all.repository;


import org.springframework.data.jpa.repository.JpaRepository;

import com.prolearner.all.entity.Configuration;
import java.util.Optional;

public interface ConfigurationRepository
        extends JpaRepository<Configuration, String> {
    Optional<Configuration> findByProperty(String property);
}