package com.printease.printer;

import com.printease.common.EventPublisherService;
import com.printease.common.PrintEaseException;
import com.printease.common.ResourceNotFoundException;
import com.printease.history.JobEvent;
import com.printease.history.JobEventRepository;
import com.printease.printjob.PrintCompositeService;
import com.printease.printjob.PrintJob;
import com.printease.printjob.PrintJob.JobStatus;
import com.printease.printjob.PrintJobRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import javax.print.*;
import javax.print.attribute.HashPrintRequestAttributeSet;
import javax.print.attribute.PrintRequestAttributeSet;
import javax.print.attribute.standard.Copies;
import javax.print.attribute.standard.MediaSizeName;
import javax.print.attribute.standard.OrientationRequested;
import javax.print.event.PrintJobAdapter;
import javax.print.event.PrintJobEvent;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.awt.print.PageFormat;
import java.awt.print.Printable;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Map;

@Service
public class PrintExecutionService {

    private static final Logger log = LoggerFactory.getLogger(PrintExecutionService.class);

    private final PrintJobRepository jobRepository;
    private final JobEventRepository eventRepository;
    private final PrintCompositeService compositeService;
    private final EventPublisherService eventPublisher;

    public PrintExecutionService(
            PrintJobRepository jobRepository,
            JobEventRepository eventRepository,
            PrintCompositeService compositeService,
            EventPublisherService eventPublisher) {
        this.jobRepository = jobRepository;
        this.eventRepository = eventRepository;
        this.compositeService = compositeService;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Dispatch print job to the target physical/virtual printer.
     */
    @Async
    public void executePrintJob(String jobId, String targetPrinterName, Integer overrideCopies) {
        PrintJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("PrintJob", jobId));

        try {
            // 1. Transition to PREPARING
            updateJobStatus(job, JobStatus.PREPARING, "Rendering high-res print sheet");

            // 2. Render composite 300 DPI image
            Path compositePath = compositeService.getOrRenderComposite(jobId);
            BufferedImage compositeImage = ImageIO.read(compositePath.toFile());
            if (compositeImage == null) {
                throw new PrintEaseException("IMAGE_CORRUPT", "Could not decode composite image from " + compositePath);
            }

            // 3. Locate Printer Service
            String printerToUse = (targetPrinterName != null && !targetPrinterName.isBlank())
                    ? targetPrinterName
                    : job.getPrinterName();

            PrintService printService = resolvePrintService(printerToUse);
            log.info("Selected printer for job {}: {}", jobId, printService.getName());
            job.setPrinterName(printService.getName());

            // 4. Configure Attributes
            PrintRequestAttributeSet attributes = new HashPrintRequestAttributeSet();
            int copies = (overrideCopies != null && overrideCopies > 0) ? overrideCopies : Math.max(1, job.getCopies());
            attributes.add(new Copies(copies));

            if (job.getOrientation() == PrintJob.Orientation.LANDSCAPE) {
                attributes.add(OrientationRequested.LANDSCAPE);
            } else {
                attributes.add(OrientationRequested.PORTRAIT);
            }

            MediaSizeName mediaSize = resolveMediaSize(job.getPaperSize());
            if (mediaSize != null) {
                attributes.add(mediaSize);
            }

            // 5. Build Printable
            Printable printable = (graphics, pageFormat, pageIndex) -> {
                if (pageIndex > 0) {
                    return Printable.NO_SUCH_PAGE;
                }
                Graphics2D g2 = (Graphics2D) graphics;
                g2.translate(pageFormat.getImageableX(), pageFormat.getImageableY());
                g2.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
                g2.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);

                g2.drawImage(
                        compositeImage,
                        0,
                        0,
                        (int) Math.round(pageFormat.getImageableWidth()),
                        (int) Math.round(pageFormat.getImageableHeight()),
                        null
                );
                return Printable.PAGE_EXISTS;
            };

            // 6. Transition to PRINTING
            updateJobStatus(job, JobStatus.PRINTING, "Sending to printer " + printService.getName());

            DocPrintJob docPrintJob = printService.createPrintJob();
            docPrintJob.addPrintJobListener(new PrintJobAdapter() {
                @Override
                public void printJobCompleted(PrintJobEvent pje) {
                    log.info("Print job completed successfully: {}", jobId);
                    completeJob(job);
                }

                @Override
                public void printJobFailed(PrintJobEvent pje) {
                    log.error("Print job failed reported by driver: {}", jobId);
                    failJob(job, "Printer driver reported failure");
                }
            });

            SimpleDoc doc = new SimpleDoc(printable, DocFlavor.SERVICE_FORMATTED.PRINTABLE, null);
            docPrintJob.print(doc, attributes);

            // Virtual printers (PDF/XPS) often finish synchronously without triggering async listener
            if (job.getStatus() == JobStatus.PRINTING) {
                completeJob(job);
            }

        } catch (Exception e) {
            log.error("Failed to execute print job {}: {}", jobId, e.getMessage(), e);
            failJob(job, e.getMessage());
        }
    }

    private PrintService resolvePrintService(String printerName) {
        PrintService[] services = PrintServiceLookup.lookupPrintServices(null, null);

        if (services.length == 0) {
            throw new PrintEaseException("NO_PRINTERS", "No print services available on host system.");
        }

        if (printerName != null && !printerName.isBlank()) {
            for (PrintService ps : services) {
                if (ps.getName().equalsIgnoreCase(printerName.trim())) {
                    return ps;
                }
            }
            log.warn("Requested printer '{}' not found. Falling back to default printer.", printerName);
        }

        PrintService defaultService = PrintServiceLookup.lookupDefaultPrintService();
        if (defaultService != null) {
            return defaultService;
        }

        return services[0];
    }

    private MediaSizeName resolveMediaSize(String paperSize) {
        if (paperSize == null) return MediaSizeName.ISO_A4;
        return switch (paperSize.toUpperCase()) {
            case "LEGAL" -> MediaSizeName.NA_LEGAL;
            case "A5" -> MediaSizeName.ISO_A5;
            case "LETTER" -> MediaSizeName.NA_LETTER;
            default -> MediaSizeName.ISO_A4;
        };
    }

    private void updateJobStatus(PrintJob job, JobStatus status, String message) {
        JobStatus old = job.getStatus();
        job.setStatus(status);
        if (status == JobStatus.COMPLETED) {
            job.setCompletedAt(LocalDateTime.now());
        }
        jobRepository.save(job);

        eventRepository.save(new JobEvent(
                job.getId(), JobEvent.EventType.STATUS_CHANGE,
                old.name(), status.name(), message
        ));

        eventPublisher.publishEvent("JOB_STATUS_CHANGE", Map.of(
                "jobId", job.getId(),
                "oldStatus", old.name(),
                "newStatus", status.name(),
                "message", message != null ? message : "",
                "timestamp", System.currentTimeMillis()
        ));
    }

    private void completeJob(PrintJob job) {
        updateJobStatus(job, JobStatus.COMPLETED, "Printed successfully");
    }

    private void failJob(PrintJob job, String error) {
        job.setErrorMessage(error);
        updateJobStatus(job, JobStatus.FAILED, "Error: " + error);
    }
}
