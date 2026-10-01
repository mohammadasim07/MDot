package com.printease.printjob;

import com.printease.common.DuplicateSubmissionException;
import com.printease.common.PrintEaseException;
import com.printease.common.ResourceNotFoundException;
import com.printease.history.JobEvent;
import com.printease.history.JobEventRepository;
import com.printease.printjob.PrintJob.JobStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import com.printease.common.EventPublisherService;
import java.util.Optional;
import java.util.UUID;

@Service
public class PrintJobService {

    private static final Logger log = LoggerFactory.getLogger(PrintJobService.class);

    private final PrintJobRepository jobRepository;
    private final JobEventRepository eventRepository;
    private final EventPublisherService eventPublisher;

    public PrintJobService(PrintJobRepository jobRepository, JobEventRepository eventRepository, EventPublisherService eventPublisher) {
        this.jobRepository = jobRepository;
        this.eventRepository = eventRepository;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Create a new print job from the provided request data.
     */
    @Transactional
    public PrintJob createJob(PrintJobRequest request) {
        // Check for duplicate submission
        if (request.getIdempotencyKey() != null) {
            Optional<PrintJob> existing = jobRepository.findByIdempotencyKey(request.getIdempotencyKey());
            if (existing.isPresent()) {
                throw new DuplicateSubmissionException(request.getIdempotencyKey());
            }
        }

        PrintJob job = new PrintJob();
        job.setId(UUID.randomUUID().toString());
        job.setStatus(request.isDraft() ? JobStatus.DRAFT : JobStatus.WAITING);
        job.setPaperSize(request.getPaperSize() != null ? request.getPaperSize() : "A4");
        job.setOrientation(request.getOrientation() != null ? request.getOrientation() : PrintJob.Orientation.PORTRAIT);
        job.setCopies(request.getCopies() > 0 ? request.getCopies() : 1);
        job.setPrinterName(request.getPrinterName());
        job.setPrintQuality(request.getPrintQuality() != null ? request.getPrintQuality() : PrintJob.PrintQuality.NORMAL);
        job.setLayoutType(request.getLayoutType() != null ? request.getLayoutType() : PrintJob.LayoutType.VERTICAL);
        job.setLayoutConfig(request.getLayoutConfig());
        job.setFrontImageId(request.getFrontImageId());
        job.setBackImageId(request.getBackImageId());
        job.setEditConfigFront(request.getEditConfigFront());
        job.setEditConfigBack(request.getEditConfigBack());
        job.setIdempotencyKey(request.getIdempotencyKey() != null ? request.getIdempotencyKey() : UUID.randomUUID().toString());
        job.setCustomWidthMm(request.getCustomWidthMm());
        job.setCustomHeightMm(request.getCustomHeightMm());

        if (job.getStatus() == JobStatus.WAITING) {
            job.setSubmittedAt(LocalDateTime.now());
        }

        PrintJob saved = jobRepository.save(job);

        // Record creation event
        eventRepository.save(new JobEvent(
                saved.getId(), JobEvent.EventType.CREATED,
                null, saved.getStatus().name(),
                "Job created"
        ));

        eventPublisher.publishEvent("JOB_CREATED", saved);

        log.info("Print job created: id={}, status={}, paper={}", saved.getId(), saved.getStatus(), saved.getPaperSize());
        return saved;
    }

    /**
     * Get a job by ID.
     */
    public PrintJob getById(String id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PrintJob", id));
    }

    /**
     * List jobs with optional status filter and pagination.
     */
    public Page<PrintJob> listJobs(List<JobStatus> statuses, Pageable pageable) {
        if (statuses != null && !statuses.isEmpty()) {
            return jobRepository.findByStatusInOrderByCreatedAtDesc(statuses, pageable);
        }
        return jobRepository.findAll(pageable);
    }

    /**
     * Update job status with validation and event logging.
     */
    @Transactional
    public PrintJob updateStatus(String id, JobStatus newStatus) {
        PrintJob job = getById(id);
        JobStatus oldStatus = job.getStatus();

        validateStatusTransition(oldStatus, newStatus);

        job.setStatus(newStatus);

        if (newStatus == JobStatus.WAITING) {
            job.setSubmittedAt(LocalDateTime.now());
        } else if (newStatus == JobStatus.COMPLETED) {
            job.setCompletedAt(LocalDateTime.now());
        }

        PrintJob saved = jobRepository.save(job);

        eventRepository.save(new JobEvent(
                id, JobEvent.EventType.STATUS_CHANGE,
                oldStatus.name(), newStatus.name(),
                "Status changed"
        ));

        eventPublisher.publishEvent("JOB_STATUS_CHANGE", Map.of(
                "jobId", id,
                "oldStatus", oldStatus.name(),
                "newStatus", newStatus.name(),
                "timestamp", System.currentTimeMillis()
        ));

        log.info("Job status updated: id={}, {} -> {}", id, oldStatus, newStatus);
        return saved;
    }

    /**
     * Update job details (for editing a draft or waiting job).
     */
    @Transactional
    public PrintJob updateJob(String id, PrintJobRequest request) {
        PrintJob job = getById(id);

        if (job.getStatus() != JobStatus.DRAFT && job.getStatus() != JobStatus.WAITING) {
            throw new PrintEaseException("INVALID_STATE",
                    "Cannot edit a job in status: " + job.getStatus());
        }

        if (request.getPaperSize() != null) job.setPaperSize(request.getPaperSize());
        if (request.getOrientation() != null) job.setOrientation(request.getOrientation());
        if (request.getCopies() > 0) job.setCopies(request.getCopies());
        if (request.getPrinterName() != null) job.setPrinterName(request.getPrinterName());
        if (request.getPrintQuality() != null) job.setPrintQuality(request.getPrintQuality());
        if (request.getLayoutType() != null) job.setLayoutType(request.getLayoutType());
        if (request.getLayoutConfig() != null) job.setLayoutConfig(request.getLayoutConfig());
        if (request.getFrontImageId() != null) job.setFrontImageId(request.getFrontImageId());
        if (request.getBackImageId() != null) job.setBackImageId(request.getBackImageId());
        if (request.getEditConfigFront() != null) job.setEditConfigFront(request.getEditConfigFront());
        if (request.getEditConfigBack() != null) job.setEditConfigBack(request.getEditConfigBack());
        if (request.getCustomWidthMm() != null) job.setCustomWidthMm(request.getCustomWidthMm());
        if (request.getCustomHeightMm() != null) job.setCustomHeightMm(request.getCustomHeightMm());

        return jobRepository.save(job);
    }

    /**
     * Submit a draft job to the queue.
     */
    @Transactional
    public PrintJob submitToQueue(String id) {
        PrintJob job = getById(id);

        if (job.getFrontImageId() == null && job.getBackImageId() == null) {
            throw new PrintEaseException("NO_IMAGES", "Job must have at least one image before submission.");
        }

        return updateStatus(id, JobStatus.WAITING);
    }

    /**
     * Cancel a job.
     */
    @Transactional
    public PrintJob cancelJob(String id) {
        PrintJob job = getById(id);
        if (job.getStatus() == JobStatus.COMPLETED || job.getStatus() == JobStatus.CANCELLED) {
            throw new PrintEaseException("INVALID_STATE",
                    "Cannot cancel a job in status: " + job.getStatus());
        }
        return updateStatus(id, JobStatus.CANCELLED);
    }

    /**
     * Retry a failed job.
     */
    @Transactional
    public PrintJob retryJob(String id) {
        PrintJob job = getById(id);
        if (job.getStatus() != JobStatus.FAILED) {
            throw new PrintEaseException("INVALID_STATE", "Only failed jobs can be retried.");
        }
        job.setRetryCount(job.getRetryCount() + 1);
        job.setErrorMessage(null);
        jobRepository.save(job);

        eventRepository.save(new JobEvent(
                id, JobEvent.EventType.RETRY,
                JobStatus.FAILED.name(), JobStatus.WAITING.name(),
                "Retry attempt #" + job.getRetryCount()
        ));

        return updateStatus(id, JobStatus.WAITING);
    }

    /**
     * Get queue statistics.
     */
    public Map<String, Long> getQueueStats() {
        return Map.of(
                "draft", jobRepository.countByStatus(JobStatus.DRAFT),
                "waiting", jobRepository.countByStatus(JobStatus.WAITING),
                "preparing", jobRepository.countByStatus(JobStatus.PREPARING),
                "ready", jobRepository.countByStatus(JobStatus.READY),
                "printing", jobRepository.countByStatus(JobStatus.PRINTING),
                "completed", jobRepository.countByStatus(JobStatus.COMPLETED),
                "failed", jobRepository.countByStatus(JobStatus.FAILED),
                "cancelled", jobRepository.countByStatus(JobStatus.CANCELLED)
        );
    }

    /**
     * Clear completed jobs, keeping minimal event history.
     */
    @Transactional
    public int clearCompleted() {
        List<PrintJob> completed = jobRepository.findByStatusInOrderByCreatedAtDesc(
                List.of(JobStatus.COMPLETED), PageRequest.of(0, 1000)).getContent();

        int count = completed.size();
        jobRepository.deleteAll(completed);
        log.info("Cleared {} completed jobs", count);
        return count;
    }

    private void validateStatusTransition(JobStatus from, JobStatus to) {
        // Define valid transitions
        boolean valid = switch (from) {
            case DRAFT -> to == JobStatus.WAITING || to == JobStatus.CANCELLED;
            case WAITING -> to == JobStatus.PREPARING || to == JobStatus.READY || to == JobStatus.CANCELLED || to == JobStatus.PAUSED;
            case PREPARING -> to == JobStatus.READY || to == JobStatus.PRINTING || to == JobStatus.FAILED || to == JobStatus.CANCELLED;
            case READY -> to == JobStatus.PRINTING || to == JobStatus.WAITING || to == JobStatus.CANCELLED;
            case PRINTING -> to == JobStatus.COMPLETED || to == JobStatus.FAILED;
            case FAILED -> to == JobStatus.WAITING; // retry
            case PAUSED -> to == JobStatus.WAITING || to == JobStatus.CANCELLED;
            case COMPLETED, CANCELLED -> false;
        };

        if (!valid) {
            throw new PrintEaseException("INVALID_TRANSITION",
                    "Cannot transition from " + from + " to " + to);
        }
    }
}
