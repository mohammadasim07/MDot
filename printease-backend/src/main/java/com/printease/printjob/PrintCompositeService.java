package com.printease.printjob;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.printease.common.PrintEaseException;
import com.printease.common.ResourceNotFoundException;
import com.printease.document.DocumentImageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class PrintCompositeService {

    private static final Logger log = LoggerFactory.getLogger(PrintCompositeService.class);
    private static final int DPI = 300;
    private static final double MM_PER_INCH = 25.4;

    private final DocumentImageService imageService;
    private final PrintJobRepository jobRepository;
    private final ObjectMapper objectMapper;
    private final Path printReadyPath;

    public PrintCompositeService(
            DocumentImageService imageService,
            PrintJobRepository jobRepository,
            ObjectMapper objectMapper,
            @Value("${printease.storage.base-path:./storage}") String basePath,
            @Value("${printease.storage.print-ready-dir:print-ready}") String printReadyDir) {
        this.imageService = imageService;
        this.jobRepository = jobRepository;
        this.objectMapper = objectMapper;
        this.printReadyPath = Paths.get(basePath, printReadyDir).toAbsolutePath();
        try {
            Files.createDirectories(this.printReadyPath);
        } catch (IOException e) {
            throw new RuntimeException("Cannot create print-ready storage dir: " + printReadyPath, e);
        }
    }

    /**
     * Render the high-resolution (300 DPI) composite print sheet for a job.
     */
    public Path renderComposite(PrintJob job) {
        log.info("Rendering 300 DPI composite for job: {}", job.getId());

        // 1. Determine paper dimensions in mm
        double[] dimensionsMm = getPaperDimensionsMm(job);
        double widthMm = dimensionsMm[0];
        double heightMm = dimensionsMm[1];

        if (job.getOrientation() == PrintJob.Orientation.LANDSCAPE) {
            double temp = widthMm;
            widthMm = Math.max(widthMm, heightMm);
            heightMm = Math.min(temp, heightMm);
        } else {
            double temp = widthMm;
            widthMm = Math.min(widthMm, heightMm);
            heightMm = Math.max(temp, heightMm);
        }

        int targetWidthPx = (int) Math.round((widthMm / MM_PER_INCH) * DPI);
        int targetHeightPx = (int) Math.round((heightMm / MM_PER_INCH) * DPI);

        // 2. Create blank 300 DPI canvas
        BufferedImage canvas = new BufferedImage(targetWidthPx, targetHeightPx, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = canvas.createGraphics();

        try {
            // Fill background pure white
            g2d.setColor(Color.WHITE);
            g2d.fillRect(0, 0, targetWidthPx, targetHeightPx);

            // Set high rendering quality
            g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);

            // 3. Process layoutConfig
            if (job.getLayoutConfig() != null && !job.getLayoutConfig().isBlank()) {
                JsonNode root = objectMapper.readTree(job.getLayoutConfig());
                JsonNode imagesNode = root.get("images");

                if (imagesNode != null && imagesNode.isArray()) {
                    for (JsonNode placement : imagesNode) {
                        renderPlacement(g2d, placement, job);
                    }
                }
            } else {
                // Fallback layout if layoutConfig is not specified: place front and back vertically
                renderDefaultFallback(g2d, job, targetWidthPx, targetHeightPx);
            }

        } catch (Exception e) {
            log.error("Failed to render composite for job {}: {}", job.getId(), e.getMessage(), e);
            throw new PrintEaseException("RENDER_FAILED", "Failed to render composite print sheet: " + e.getMessage(), e);
        } finally {
            g2d.dispose();
        }

        // 4. Save to storage/print-ready
        String filename = job.getId() + "_300dpi.png";
        Path outputPath = printReadyPath.resolve(filename);

        try {
            ImageIO.write(canvas, "png", outputPath.toFile());
            job.setCompositeImagePath(outputPath.toString());
            jobRepository.save(job);
            log.info("Composite image saved successfully: {} ({}x{} px)", outputPath, targetWidthPx, targetHeightPx);
            return outputPath;
        } catch (IOException e) {
            throw new PrintEaseException("SAVE_FAILED", "Failed to save composite image: " + e.getMessage(), e);
        }
    }

    /**
     * Get path to composite image. Renders if not already rendered.
     */
    public Path getOrRenderComposite(String jobId) {
        PrintJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("PrintJob", jobId));

        if (job.getCompositeImagePath() != null) {
            Path path = Paths.get(job.getCompositeImagePath());
            if (Files.exists(path)) {
                return path;
            }
        }

        return renderComposite(job);
    }

    private void renderPlacement(Graphics2D g2d, JsonNode placement, PrintJob job) {
        String imageId = placement.has("imageId") ? placement.get("imageId").asText() : null;
        if (imageId == null || imageId.isBlank()) return;

        double xMm = placement.has("x") ? placement.get("x").asDouble() : 0.0;
        double yMm = placement.has("y") ? placement.get("y").asDouble() : 0.0;
        double widthMm = placement.has("width") ? placement.get("width").asDouble() : 85.6;
        double heightMm = placement.has("height") ? placement.get("height").asDouble() : 54.0;
        double rotation = placement.has("rotation") ? placement.get("rotation").asDouble() : 0.0;
        String side = placement.has("side") ? placement.get("side").asText() : "FRONT";

        try {
            Path imageFilePath = imageService.getFilePath(imageId);
            BufferedImage docImage = ImageIO.read(imageFilePath.toFile());
            if (docImage == null) {
                log.warn("Could not read image file: {}", imageFilePath);
                return;
            }

            // Apply side edit config if present
            String editConfigJson = "FRONT".equalsIgnoreCase(side) ? job.getEditConfigFront() : job.getEditConfigBack();
            BufferedImage processedImage = applyEditConfig(docImage, editConfigJson);

            // Convert mm to 300 DPI pixels
            int pxX = (int) Math.round((xMm / MM_PER_INCH) * DPI);
            int pxY = (int) Math.round((yMm / MM_PER_INCH) * DPI);
            int pxW = (int) Math.round((widthMm / MM_PER_INCH) * DPI);
            int pxH = (int) Math.round((heightMm / MM_PER_INCH) * DPI);

            if (rotation != 0) {
                AffineTransform old = g2d.getTransform();
                g2d.translate(pxX + pxW / 2.0, pxY + pxH / 2.0);
                g2d.rotate(Math.toRadians(rotation));
                g2d.drawImage(processedImage, -pxW / 2, -pxH / 2, pxW, pxH, null);
                g2d.setTransform(old);
            } else {
                g2d.drawImage(processedImage, pxX, pxY, pxW, pxH, null);
            }

        } catch (Exception e) {
            log.error("Failed to render image placement {} for job {}: {}", imageId, job.getId(), e.getMessage());
        }
    }

    private BufferedImage applyEditConfig(BufferedImage img, String editConfigJson) {
        if (editConfigJson == null || editConfigJson.isBlank()) {
            return img;
        }

        try {
            JsonNode editNode = objectMapper.readTree(editConfigJson);

            BufferedImage current = img;

            // 1. Crop
            if (editNode.has("crop") && !editNode.get("crop").isNull()) {
                JsonNode crop = editNode.get("crop");
                double cx = crop.has("x") ? crop.get("x").asDouble() : 0;
                double cy = crop.has("y") ? crop.get("y").asDouble() : 0;
                double cw = crop.has("width") ? crop.get("width").asDouble() : current.getWidth();
                double ch = crop.has("height") ? crop.get("height").asDouble() : current.getHeight();

                int x = Math.max(0, Math.min((int) cx, current.getWidth() - 1));
                int y = Math.max(0, Math.min((int) cy, current.getHeight() - 1));
                int w = Math.max(1, Math.min((int) cw, current.getWidth() - x));
                int h = Math.max(1, Math.min((int) ch, current.getHeight() - y));

                current = current.getSubimage(x, y, w, h);
            }

            // 2. Rotation & Flip
            int rotation = editNode.has("rotation") ? editNode.get("rotation").asInt() : 0;
            boolean flipH = editNode.has("flipH") && editNode.get("flipH").asBoolean();
            boolean flipV = editNode.has("flipV") && editNode.get("flipV").asBoolean();

            if (rotation != 0 || flipH || flipV) {
                current = transformImage(current, rotation, flipH, flipV);
            }

            // 3. Brightness, Contrast & Filter
            int brightness = editNode.has("brightness") ? editNode.get("brightness").asInt() : 0;
            int contrast = editNode.has("contrast") ? editNode.get("contrast").asInt() : 0;
            String filter = editNode.has("filter") ? editNode.get("filter").asText() : "original";

            if (brightness != 0 || contrast != 0 || !"original".equals(filter)) {
                current = applyColorFilter(current, brightness, contrast, filter);
            }

            return current;

        } catch (Exception e) {
            log.warn("Failed to apply edit config, using original image: {}", e.getMessage());
            return img;
        }
    }

    private BufferedImage transformImage(BufferedImage src, int degrees, boolean flipH, boolean flipV) {
        int w = src.getWidth();
        int h = src.getHeight();

        boolean swapDims = (degrees % 180 != 0);
        int newW = swapDims ? h : w;
        int newH = swapDims ? w : h;

        BufferedImage dest = new BufferedImage(newW, newH, src.getType() == 0 ? BufferedImage.TYPE_INT_ARGB : src.getType());
        Graphics2D g2d = dest.createGraphics();

        AffineTransform at = new AffineTransform();
        at.translate(newW / 2.0, newH / 2.0);
        if (degrees != 0) {
            at.rotate(Math.toRadians(degrees));
        }
        at.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        at.translate(-w / 2.0, -h / 2.0);

        g2d.drawImage(src, at, null);
        g2d.dispose();
        return dest;
    }

    private BufferedImage applyColorFilter(BufferedImage src, int brightness, int contrast, String filter) {
        int w = src.getWidth();
        int h = src.getHeight();
        BufferedImage dest = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);

        // Contrast scale factor formula
        double factor = (259.0 * (contrast + 255.0)) / (255.0 * (259.0 - contrast));

        for (int y = 0; y < h; y++) {
            for (int x = 0; x < w; x++) {
                int rgb = src.getRGB(x, y);
                int r = (rgb >> 16) & 0xFF;
                int g = (rgb >> 8) & 0xFF;
                int b = rgb & 0xFF;

                if ("grayscale".equalsIgnoreCase(filter)) {
                    int gray = (int) (0.299 * r + 0.587 * g + 0.114 * b);
                    r = g = b = gray;
                } else if ("bw".equalsIgnoreCase(filter) || "high_contrast".equalsIgnoreCase(filter)) {
                    int gray = (int) (0.299 * r + 0.587 * g + 0.114 * b);
                    int threshold = 135;
                    int bw = (gray > threshold) ? 255 : 0;
                    r = g = b = bw;
                } else if ("document_scan".equalsIgnoreCase(filter) || "auto_enhance".equalsIgnoreCase(filter)) {
                    // Boost whites and sharpen dark text
                    int gray = (int) (0.299 * r + 0.587 * g + 0.114 * b);
                    int enhanced = (int) (factor * (gray - 128) + 128 + 20);
                    enhanced = Math.min(255, Math.max(0, enhanced));
                    r = g = b = enhanced;
                }

                if (brightness != 0 || contrast != 0) {
                    r = clamp((int) (factor * (r - 128) + 128 + brightness));
                    g = clamp((int) (factor * (g - 128) + 128 + brightness));
                    b = clamp((int) (factor * (b - 128) + 128 + brightness));
                }

                dest.setRGB(x, y, (r << 16) | (g << 8) | b);
            }
        }
        return dest;
    }

    private int clamp(int val) {
        return Math.min(255, Math.max(0, val));
    }

    private void renderDefaultFallback(Graphics2D g2d, PrintJob job, int canvasW, int canvasH) {
        if (job.getFrontImageId() != null) {
            try {
                Path p = imageService.getFilePath(job.getFrontImageId());
                BufferedImage img = ImageIO.read(p.toFile());
                if (img != null) {
                    g2d.drawImage(img, (canvasW - img.getWidth()) / 2, 50, null);
                }
            } catch (Exception ignored) {}
        }
    }

    private double[] getPaperDimensionsMm(PrintJob job) {
        String paper = job.getPaperSize() != null ? job.getPaperSize().toUpperCase() : "A4";
        return switch (paper) {
            case "LEGAL" -> new double[]{215.9, 355.6};
            case "A5" -> new double[]{148.0, 210.0};
            case "LETTER" -> new double[]{215.9, 279.4};
            case "CUSTOM" -> {
                double w = job.getCustomWidthMm() != null ? job.getCustomWidthMm() : 210.0;
                double h = job.getCustomHeightMm() != null ? job.getCustomHeightMm() : 297.0;
                yield new double[]{w, h};
            }
            default -> new double[]{210.0, 297.0}; // A4
        };
    }
}
