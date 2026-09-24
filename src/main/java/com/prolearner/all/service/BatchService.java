package com.prolearner.all.service;

import com.prolearner.all.dto.BatchRequest;
import com.prolearner.all.dto.BatchResponse;
import com.prolearner.all.entity.Batches;
import com.prolearner.all.repository.BatchRepository;
import com.prolearner.all.repository.FeeRecordRepository;
import org.hibernate.engine.jdbc.batch.spi.Batch;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class BatchService {

    private final BatchRepository batchRepo;
    private final FeeRecordRepository feeRecordRepo;

    public BatchService(BatchRepository batchRepo, FeeRecordRepository feeRecordRepo) {
        this.batchRepo = batchRepo;
        this.feeRecordRepo = feeRecordRepo;
    }

    @Transactional
    public BatchResponse create(BatchRequest request) {
        Batches batch = new Batches();
        batch.setBatchName(request.batchName().trim());
        batch.setBatchAlias(normalize(request.batchAlias()));
        batch.setCategory(request.category().trim());
        batch.setRoom(normalize(request.room()));
        batch.setBaseAmount(request.baseAmount());
        batch.setIsActive(request.isActive() == null || request.isActive());
        batch.setCreatedAt(OffsetDateTime.now());

        return toResponse(batchRepo.save(batch));
    }

    @Transactional
    public BatchResponse update(Long id, BatchRequest request) {
        Batches batch = batchRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + id));

        batch.setBatchName(request.batchName().trim());
        batch.setBatchAlias(normalize(request.batchAlias()));
        batch.setCategory(request.category().trim());
        batch.setRoom(normalize(request.room()));
        batch.setBaseAmount(request.baseAmount());

        if (request.isActive() != null) {
            batch.setIsActive(request.isActive());
        }

        return toResponse(batchRepo.save(batch));
    }

    @Transactional
    public void delete(Long id, Long replaceWithBatchId) {
        Batches batch = batchRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + id));
        if (replaceWithBatchId == null) {
            throw new RuntimeException("Replacement batch is required.");
        }

        if (id.equals(replaceWithBatchId)) {
            throw new RuntimeException("Replacement batch cannot be the same batch.");
        }

        if (!batchRepo.existsById(replaceWithBatchId)) {
            throw new RuntimeException("Replacement batch not found: " + replaceWithBatchId);
        }
        feeRecordRepo.replaceBatchId(id, replaceWithBatchId);
        batchRepo.delete(batch);
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private BatchResponse toResponse(Batches batch) {
        return new BatchResponse(
                batch.getId(),
                batch.getBatchName(),
                batch.getBatchAlias(),
                batch.getCategory(),
                batch.getRoom(),
                batch.getBaseAmount(),
                batch.getIsActive(),
                batch.getCreatedAt()
        );
    }
}