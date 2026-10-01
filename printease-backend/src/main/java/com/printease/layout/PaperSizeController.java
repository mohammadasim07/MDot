package com.printease.layout;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Provides paper size definitions and layout utilities.
 * Dimensions are in millimeters.
 */
@RestController
@RequestMapping("/paper-sizes")
public class PaperSizeController {

    /**
     * Standard paper sizes with dimensions in mm.
     */
    public static final List<Map<String, Object>> PAPER_SIZES = List.of(
            Map.of("id", "A4", "name", "A4", "widthMm", 210.0, "heightMm", 297.0, "description", "210 x 297 mm"),
            Map.of("id", "LEGAL", "name", "Legal", "widthMm", 215.9, "heightMm", 355.6, "description", "215.9 x 355.6 mm"),
            Map.of("id", "A5", "name", "A5", "widthMm", 148.0, "heightMm", 210.0, "description", "148 x 210 mm"),
            Map.of("id", "LETTER", "name", "Letter", "widthMm", 215.9, "heightMm", 279.4, "description", "215.9 x 279.4 mm"),
            Map.of("id", "CUSTOM", "name", "Custom", "widthMm", 210.0, "heightMm", 297.0, "description", "Custom dimensions")
    );

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getPaperSizes() {
        return ResponseEntity.ok(PAPER_SIZES);
    }

    /**
     * Get paper dimensions by ID.
     */
    public static Map<String, Object> getPaperSize(String id) {
        return PAPER_SIZES.stream()
                .filter(ps -> ps.get("id").equals(id))
                .findFirst()
                .orElse(PAPER_SIZES.get(0)); // Default to A4
    }
}
