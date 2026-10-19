package com.prolearner.all.repository;

import com.prolearner.all.entity.ComplaintComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComplaintCommentRepository
        extends JpaRepository<ComplaintComment, Long> {

    List<ComplaintComment> findByComplaintIdOrderByCreatedAtAsc(
            Long complaintId
    );

    List<ComplaintComment> findByComplaintIdInOrderByCreatedAtAsc(
            List<Long> complaintIds
    );

    void deleteByComplaintId(Long complaintId);

}