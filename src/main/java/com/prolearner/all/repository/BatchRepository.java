package com.prolearner.all.repository;

import com.prolearner.all.entity.Batches;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface BatchRepository extends JpaRepository<Batches, Long> {

    List<Batches> findAllByOrderByCategoryAscBatchNameAsc();

    @Query("""
    SELECT b
    FROM Batches b
    ORDER BY
        CASE
            WHEN b.category LIKE '%HOURS%' THEN 0
            ELSE 1
        END,
        CASE
            WHEN b.category LIKE '%HOURS%'
            THEN CAST(SUBSTRING(b.category, 1, LOCATE(' ', b.category) - 1) AS integer)
            ELSE 999999
        END,
        b.category ASC,
        b.batchName ASC
    """)
    List<Batches> findAllOrderedByCategory();
}