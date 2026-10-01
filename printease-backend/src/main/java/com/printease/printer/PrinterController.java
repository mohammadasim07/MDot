package com.printease.printer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.print.PrintService;
import javax.print.PrintServiceLookup;
import javax.print.attribute.standard.PrinterName;
import java.util.*;

/**
 * Discovers and exposes printers installed on the system via Java Print Service API.
 */
@RestController
@RequestMapping("/printers")
public class PrinterController {

    private static final Logger log = LoggerFactory.getLogger(PrinterController.class);

    /**
     * List all installed printers with their capabilities.
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listPrinters() {
        List<Map<String, Object>> printers = new ArrayList<>();

        try {
            PrintService[] printServices = PrintServiceLookup.lookupPrintServices(null, null);
            PrintService defaultService = PrintServiceLookup.lookupDefaultPrintService();

            for (PrintService service : printServices) {
                Map<String, Object> printer = new LinkedHashMap<>();
                String name = service.getName();
                printer.put("name", name);
                printer.put("isDefault", defaultService != null && defaultService.getName().equals(name));
                printer.put("status", "AVAILABLE");

                // Get supported media (paper sizes)
                try {
                    Object supportedMedia = service.getSupportedAttributeValues(
                            javax.print.attribute.standard.Media.class, null, null);
                    if (supportedMedia instanceof javax.print.attribute.standard.Media[] mediaArray) {
                        List<String> mediaNames = new ArrayList<>();
                        for (var media : mediaArray) {
                            mediaNames.add(media.toString());
                        }
                        printer.put("supportedMedia", mediaNames.size() > 20 ? mediaNames.subList(0, 20) : mediaNames);
                    }
                } catch (Exception e) {
                    printer.put("supportedMedia", List.of());
                }

                printers.add(printer);
            }
        } catch (Exception e) {
            log.error("Error discovering printers: ", e);
        }

        return ResponseEntity.ok(printers);
    }
}
