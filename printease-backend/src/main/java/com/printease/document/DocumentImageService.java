package com.printease.document;

import com.printease.common.PrintEaseException;
import com.printease.common.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Service
public class DocumentImageService {

    private static final Logger log = LoggerFactory.getLogger(DocumentImageService.class);

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/bmp", "image/tiff", "image/webp"
    );

    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    private final DocumentImageRepository repository;
    private final Path originalsPath;

    public DocumentImageService(
            DocumentImageRepository repository,
            @Value("${printease.storage.base-path:./storage}") String basePath,
            @Value("${printease.storage.originals-dir:originals}") String originalsDir) {
        this.repository = repository;
        this.originalsPath = Paths.get(basePath, originalsDir).toAbsolutePath();
        try {
            Files.createDirectories(this.originalsPath);
        } catch (IOException e) {
            throw new RuntimeException("Cannot create storage directory: " + originalsPath, e);
        }
    }

    /**
     * Upload and store a document image.
     */
    public DocumentImage upload(MultipartFile file, DocumentImage.ImageSide side) {
        validateFile(file);

        String id = UUID.randomUUID().toString();
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown";
        String extension = getExtension(originalFilename);
        String storedFilename = id + extension;
        Path filePath = originalsPath.resolve(storedFilename);

        try {
            // Copy file to storage
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Read image dimensions
            int width = 0, height = 0;
            try (InputStream is = Files.newInputStream(filePath)) {
                BufferedImage img = ImageIO.read(is);
                if (img != null) {
                    width = img.getWidth();
                    height = img.getHeight();
                }
            }

            DocumentImage image = new DocumentImage(
                    id,
                    originalFilename,
                    storedFilename,
                    file.getContentType(),
                    file.getSize(),
                    side,
                    originalsPath.toString()
            );
            image.setWidth(width);
            image.setHeight(height);

            // Set expiration for automatic cleanup (24 hours default)
            image.setExpiresAt(LocalDateTime.now().plusHours(24));

            DocumentImage saved = repository.save(image);
            log.info("Image uploaded: id={}, filename={}, size={}, dimensions={}x{}",
                    id, originalFilename, file.getSize(), width, height);
            return saved;

        } catch (IOException e) {
            // Clean up partial file
            try { Files.deleteIfExists(filePath); } catch (IOException ignored) {}
            throw new PrintEaseException("UPLOAD_FAILED", "Failed to store uploaded image: " + e.getMessage(), e);
        }
    }

    /**
     * Get image metadata by ID.
     */
    public DocumentImage getById(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Image", id));
    }

    /**
     * Get the actual file path for serving.
     */
    public Path getFilePath(String id) {
        DocumentImage image = getById(id);
        Path path = Paths.get(image.getStoragePath(), image.getStoredFilename());
        if (!Files.exists(path)) {
            throw new ResourceNotFoundException("Image file", id);
        }
        return path;
    }

    /**
     * Delete an image and its file from disk.
     */
    public void delete(String id) {
        DocumentImage image = getById(id);
        Path filePath = Paths.get(image.getStoragePath(), image.getStoredFilename());
        try {
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.warn("Failed to delete image file: {}", filePath, e);
        }
        repository.delete(image);
        log.info("Image deleted: id={}", id);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new PrintEaseException("INVALID_FILE", "No file was uploaded.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new PrintEaseException("FILE_TOO_LARGE",
                    "File is too large. Maximum size is 50MB. Uploaded: " +
                            (file.getSize() / (1024 * 1024)) + "MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new PrintEaseException("UNSUPPORTED_FORMAT",
                    "Unsupported file format: " + contentType +
                            ". Supported formats: JPG, JPEG, PNG, BMP, TIFF, WebP");
        }
    }

    private String getExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : ".jpg";
    }
}
