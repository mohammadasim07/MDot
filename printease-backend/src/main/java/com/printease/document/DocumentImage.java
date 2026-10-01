package com.printease.document;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Represents an uploaded document image (original or processed).
 * Each image is stored on disk with metadata in the database.
 */
@Entity
@Table(name = "document_images")
public class DocumentImage {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    @Column(name = "stored_filename", nullable = false)
    private String storedFilename;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column
    private Integer width;

    @Column
    private Integer height;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ImageSide side;

    @Column(name = "storage_path", nullable = false)
    private String storagePath;

    @Column(name = "is_original", nullable = false)
    private boolean original = true;

    @Column(name = "parent_image_id", length = 36)
    private String parentImageId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    public enum ImageSide {
        FRONT, BACK
    }

    public DocumentImage() {}

    public DocumentImage(String id, String originalFilename, String storedFilename,
                          String contentType, Long fileSize, ImageSide side,
                          String storagePath) {
        this.id = id;
        this.originalFilename = originalFilename;
        this.storedFilename = storedFilename;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.side = side;
        this.storagePath = storagePath;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getOriginalFilename() { return originalFilename; }
    public void setOriginalFilename(String originalFilename) { this.originalFilename = originalFilename; }

    public String getStoredFilename() { return storedFilename; }
    public void setStoredFilename(String storedFilename) { this.storedFilename = storedFilename; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public Integer getWidth() { return width; }
    public void setWidth(Integer width) { this.width = width; }

    public Integer getHeight() { return height; }
    public void setHeight(Integer height) { this.height = height; }

    public ImageSide getSide() { return side; }
    public void setSide(ImageSide side) { this.side = side; }

    public String getStoragePath() { return storagePath; }
    public void setStoragePath(String storagePath) { this.storagePath = storagePath; }

    public boolean isOriginal() { return original; }
    public void setOriginal(boolean original) { this.original = original; }

    public String getParentImageId() { return parentImageId; }
    public void setParentImageId(String parentImageId) { this.parentImageId = parentImageId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
}
