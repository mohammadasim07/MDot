package com.printease.document;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/images")
public class DocumentImageController {

    private final DocumentImageService imageService;

    public DocumentImageController(DocumentImageService imageService) {
        this.imageService = imageService;
    }

    /**
     * Upload a document image (front or back side).
     */
    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "side", defaultValue = "FRONT") DocumentImage.ImageSide side) {

        DocumentImage image = imageService.upload(file, side);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", image.getId());
        response.put("originalFilename", image.getOriginalFilename());
        response.put("contentType", image.getContentType());
        response.put("fileSize", image.getFileSize());
        response.put("width", image.getWidth());
        response.put("height", image.getHeight());
        response.put("side", image.getSide());
        response.put("createdAt", image.getCreatedAt());

        return ResponseEntity.ok(response);
    }

    /**
     * Get image metadata.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getMetadata(@PathVariable String id) {
        DocumentImage image = imageService.getById(id);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", image.getId());
        response.put("originalFilename", image.getOriginalFilename());
        response.put("contentType", image.getContentType());
        response.put("fileSize", image.getFileSize());
        response.put("width", image.getWidth());
        response.put("height", image.getHeight());
        response.put("side", image.getSide());
        response.put("isOriginal", image.isOriginal());
        response.put("createdAt", image.getCreatedAt());

        return ResponseEntity.ok(response);
    }

    /**
     * Serve the actual image file for display.
     */
    @GetMapping("/{id}/file")
    public ResponseEntity<Resource> getFile(@PathVariable String id) throws MalformedURLException {
        DocumentImage image = imageService.getById(id);
        Path filePath = imageService.getFilePath(id);
        Resource resource = new UrlResource(filePath.toUri());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.getContentType()))
                .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
                .body(resource);
    }

    /**
     * Delete an image.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable String id) {
        imageService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Image deleted successfully", "id", id));
    }
}
