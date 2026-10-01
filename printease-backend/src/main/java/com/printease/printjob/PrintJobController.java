package com.printease.printjob;

import com.printease.common.EventPublisherService;
import com.printease.printer.PrintExecutionService;
import com.printease.printjob.PrintJob.JobStatus;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/jobs")
public class PrintJobController {

    private final PrintJobService jobService;
    private final PrintCompositeService compositeService;
    private final PrintExecutionService printExecutionService;
    private final EventPublisherService eventPublisherService;

    public PrintJobController(
            PrintJobService jobService,
            PrintCompositeService compositeService,
            PrintExecutionService printExecutionService,
            EventPublisherService eventPublisherService) {
        this.jobService = jobService;
        this.compositeService = compositeService;
        this.printExecutionService = printExecutionService;
        this.eventPublisherService = eventPublisherService;
    }

    /**
     * Subscribe to real-time job and queue events via Server-Sent Events (SSE).
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamEvents() {
        return eventPublisherService.subscribe();
    }

    /**
     * Create a new print job.
     */
    @PostMapping
    public ResponseEntity<PrintJob> createJob(@RequestBody PrintJobRequest request) {
        PrintJob job = jobService.createJob(request);
        return ResponseEntity.ok(job);
    }

    /**
     * Get a job by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<PrintJob> getJob(@PathVariable String id) {
        return ResponseEntity.ok(jobService.getById(id));
    }

    /**
     * List jobs with optional status filter and pagination.
     */
    @GetMapping
    public ResponseEntity<Page<PrintJob>> listJobs(
            @RequestParam(required = false) List<JobStatus> status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
                jobService.listJobs(status, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
        );
    }

    /**
     * Update a draft or waiting job.
     */
    @PutMapping("/{id}")
    public ResponseEntity<PrintJob> updateJob(@PathVariable String id, @RequestBody PrintJobRequest request) {
        return ResponseEntity.ok(jobService.updateJob(id, request));
    }

    /**
     * Submit a draft to the queue.
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<PrintJob> submitToQueue(@PathVariable String id) {
        return ResponseEntity.ok(jobService.submitToQueue(id));
    }

    /**
     * Cancel a job.
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<PrintJob> cancelJob(@PathVariable String id) {
        return ResponseEntity.ok(jobService.cancelJob(id));
    }

    /**
     * Retry a failed job.
     */
    @PostMapping("/{id}/retry")
    public ResponseEntity<PrintJob> retryJob(@PathVariable String id) {
        return ResponseEntity.ok(jobService.retryJob(id));
    }

    /**
     * Render the high-resolution composite sheet for this job.
     */
    @PostMapping("/{id}/render")
    public ResponseEntity<PrintJob> renderJobComposite(@PathVariable String id) {
        PrintJob job = jobService.getById(id);
        compositeService.renderComposite(job);

        // If in WAITING, transition to READY
        if (job.getStatus() == JobStatus.WAITING) {
            job = jobService.updateStatus(id, JobStatus.READY);
        }
        return ResponseEntity.ok(job);
    }

    /**
     * Stream the rendered 300 DPI composite image for print preview or download.
     */
    @GetMapping("/{id}/composite")
    public ResponseEntity<Resource> getCompositeImage(@PathVariable String id) {
        Path compositePath = compositeService.getOrRenderComposite(id);
        Resource resource = new FileSystemResource(compositePath.toFile());

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + id + "_sheet.png\"")
                .body(resource);
    }

    /**
     * Dispatch the job to physical or virtual printer.
     */
    @PostMapping("/{id}/print")
    public ResponseEntity<Map<String, Object>> printJob(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> payload) {
        String printerName = null;
        Integer copies = null;

        if (payload != null) {
            if (payload.containsKey("printerName") && payload.get("printerName") != null) {
                printerName = payload.get("printerName").toString();
            }
            if (payload.containsKey("copies") && payload.get("copies") != null) {
                try {
                    copies = Integer.parseInt(payload.get("copies").toString());
                } catch (NumberFormatException ignored) {}
            }
        }

        printExecutionService.executePrintJob(id, printerName, copies);
        return ResponseEntity.accepted().body(Map.of(
                "jobId", id,
                "status", "DISPATCHED",
                "message", "Job sent to printer"
        ));
    }

    /**
     * Get queue statistics.
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(jobService.getQueueStats());
    }

    /**
     * Clear completed jobs.
     */
    @DeleteMapping("/completed")
    public ResponseEntity<Map<String, Object>> clearCompleted() {
        int count = jobService.clearCompleted();
        return ResponseEntity.ok(Map.of("cleared", count, "message", count + " completed jobs removed"));
    }
}
