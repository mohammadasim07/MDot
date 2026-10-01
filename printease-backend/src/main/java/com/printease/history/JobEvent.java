package com.printease.history;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Audit trail for job state transitions.
 * Does NOT store image data — only status changes and messages.
 */
@Entity
@Table(name = "job_events", indexes = {
    @Index(name = "idx_event_job", columnList = "job_id"),
    @Index(name = "idx_event_created", columnList = "created_at")
})
public class JobEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_id", nullable = false, length = 36)
    private String jobId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 20)
    private EventType eventType;

    @Column(name = "from_status", length = 20)
    private String fromStatus;

    @Column(name = "to_status", length = 20)
    private String toStatus;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public enum EventType {
        CREATED, STATUS_CHANGE, ERROR, RETRY, CANCEL, PRINT_SUBMITTED, PRINT_COMPLETED
    }

    public JobEvent() {
        this.createdAt = LocalDateTime.now();
    }

    public JobEvent(String jobId, EventType eventType, String fromStatus, String toStatus, String message) {
        this();
        this.jobId = jobId;
        this.eventType = eventType;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.message = message;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getJobId() { return jobId; }
    public void setJobId(String jobId) { this.jobId = jobId; }

    public EventType getEventType() { return eventType; }
    public void setEventType(EventType eventType) { this.eventType = eventType; }

    public String getFromStatus() { return fromStatus; }
    public void setFromStatus(String fromStatus) { this.fromStatus = fromStatus; }

    public String getToStatus() { return toStatus; }
    public void setToStatus(String toStatus) { this.toStatus = toStatus; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
