package com.printease.printjob;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Core print job entity. Stores all information needed to reproduce a print:
 * paper size, orientation, layout configuration (as JSON), selected printer, etc.
 */
@Entity
@Table(name = "print_jobs", indexes = {
    @Index(name = "idx_job_status", columnList = "status"),
    @Index(name = "idx_job_created", columnList = "created_at"),
    @Index(name = "idx_job_idempotency", columnList = "idempotency_key", unique = true)
})
public class PrintJob {

    @Id
    @Column(length = 36)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private JobStatus status = JobStatus.DRAFT;

    @Column(name = "paper_size", nullable = false, length = 20)
    private String paperSize = "A4";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Orientation orientation = Orientation.PORTRAIT;

    @Column(nullable = false)
    private int copies = 1;

    @Column(name = "printer_name")
    private String printerName;

    @Enumerated(EnumType.STRING)
    @Column(name = "print_quality", length = 10)
    private PrintQuality printQuality = PrintQuality.NORMAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "layout_type", length = 15)
    private LayoutType layoutType = LayoutType.VERTICAL;

    @Column(name = "layout_config", columnDefinition = "TEXT")
    private String layoutConfig;

    @Column(name = "front_image_id", length = 36)
    private String frontImageId;

    @Column(name = "back_image_id", length = 36)
    private String backImageId;

    @Column(name = "edit_config_front", columnDefinition = "TEXT")
    private String editConfigFront;

    @Column(name = "edit_config_back", columnDefinition = "TEXT")
    private String editConfigBack;

    @Column(name = "idempotency_key", length = 64, unique = true)
    private String idempotencyKey;

    @Column
    private int priority = 0;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "retry_count")
    private int retryCount = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    // Custom paper dimensions (mm)
    @Column(name = "custom_width_mm")
    private Double customWidthMm;

    @Column(name = "custom_height_mm")
    private Double customHeightMm;

    @Column(name = "composite_image_path")
    private String compositeImagePath;

    public enum JobStatus {
        DRAFT, WAITING, PREPARING, READY, PRINTING, COMPLETED, FAILED, CANCELLED, PAUSED
    }

    public enum Orientation {
        PORTRAIT, LANDSCAPE
    }

    public enum PrintQuality {
        DRAFT, NORMAL, HIGH
    }

    public enum LayoutType {
        VERTICAL, HORIZONTAL, FREE
    }

    public PrintJob() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public JobStatus getStatus() { return status; }
    public void setStatus(JobStatus status) { this.status = status; }

    public String getPaperSize() { return paperSize; }
    public void setPaperSize(String paperSize) { this.paperSize = paperSize; }

    public Orientation getOrientation() { return orientation; }
    public void setOrientation(Orientation orientation) { this.orientation = orientation; }

    public int getCopies() { return copies; }
    public void setCopies(int copies) { this.copies = copies; }

    public String getPrinterName() { return printerName; }
    public void setPrinterName(String printerName) { this.printerName = printerName; }

    public PrintQuality getPrintQuality() { return printQuality; }
    public void setPrintQuality(PrintQuality printQuality) { this.printQuality = printQuality; }

    public LayoutType getLayoutType() { return layoutType; }
    public void setLayoutType(LayoutType layoutType) { this.layoutType = layoutType; }

    public String getLayoutConfig() { return layoutConfig; }
    public void setLayoutConfig(String layoutConfig) { this.layoutConfig = layoutConfig; }

    public String getFrontImageId() { return frontImageId; }
    public void setFrontImageId(String frontImageId) { this.frontImageId = frontImageId; }

    public String getBackImageId() { return backImageId; }
    public void setBackImageId(String backImageId) { this.backImageId = backImageId; }

    public String getEditConfigFront() { return editConfigFront; }
    public void setEditConfigFront(String editConfigFront) { this.editConfigFront = editConfigFront; }

    public String getEditConfigBack() { return editConfigBack; }
    public void setEditConfigBack(String editConfigBack) { this.editConfigBack = editConfigBack; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public int getPriority() { return priority; }
    public void setPriority(int priority) { this.priority = priority; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public int getRetryCount() { return retryCount; }
    public void setRetryCount(int retryCount) { this.retryCount = retryCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public Double getCustomWidthMm() { return customWidthMm; }
    public void setCustomWidthMm(Double customWidthMm) { this.customWidthMm = customWidthMm; }

    public Double getCustomHeightMm() { return customHeightMm; }
    public void setCustomHeightMm(Double customHeightMm) { this.customHeightMm = customHeightMm; }

    public String getCompositeImagePath() { return compositeImagePath; }
    public void setCompositeImagePath(String compositeImagePath) { this.compositeImagePath = compositeImagePath; }
}
