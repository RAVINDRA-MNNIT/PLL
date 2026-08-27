package com.prolearner.all.repository;

import com.prolearner.all.entity.Seat;
import com.prolearner.all.entity.Students;
import com.prolearner.all.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Students,Long> {

    Optional <Students> findById(Long id);

    @Query("SELECT MAX(s.studentId) FROM Students s")
    Long findMaxId();

    boolean existsByAadhaarNumber(String addhar);
    Optional<Students> findByStudentId(Long studentId);
}
