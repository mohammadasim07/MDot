package com.printease.printjob;

import com.printease.printjob.PrintJob.JobStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrintJobRepository extends JpaRepository<PrintJob, String> {

    Page<PrintJob> findByStatusOrderByPriorityDescCreatedAtAsc(JobStatus status, Pageable pageable);

    List<PrintJob> findByStatusInOrderByPriorityDescCreatedAtAsc(List<JobStatus> statuses);

    Page<PrintJob> findByStatusInOrderByCreatedAtDesc(List<JobStatus> statuses, Pageable pageable);

    Optional<PrintJob> findByIdempotencyKey(String idempotencyKey);

    long countByStatus(JobStatus status);

    /**
     * Atomically claim a WAITING job for processing.
     * Uses optimistic approach — only updates if status is still WAITING.
     */
    @Modifying
    @Query("UPDATE PrintJob j SET j.status = :newStatus, j.updatedAt = CURRENT_TIMESTAMP " +
           "WHERE j.id = :jobId AND j.status = :currentStatus")
    int claimJob(@Param("jobId") String jobId,
                 @Param("currentStatus") JobStatus currentStatus,
                 @Param("newStatus") JobStatus newStatus);

    @Query("SELECT j FROM PrintJob j WHERE j.status IN :statuses ORDER BY j.priority DESC, j.createdAt ASC")
    List<PrintJob> findNextJobs(@Param("statuses") List<JobStatus> statuses, Pageable pageable);
}
