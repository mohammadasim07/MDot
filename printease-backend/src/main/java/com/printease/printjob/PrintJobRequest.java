package com.printease.printjob;

import com.printease.printjob.PrintJob.LayoutType;
import com.printease.printjob.PrintJob.Orientation;
import com.printease.printjob.PrintJob.PrintQuality;

/**
 * Request DTO for creating or updating a print job.
 */
public class PrintJobRequest {

    private String paperSize;
    private Orientation orientation;
    private int copies = 1;
    private String printerName;
    private PrintQuality printQuality;
    private LayoutType layoutType;
    private String layoutConfig;       // JSON: positions, sizes, margins
    private String frontImageId;
    private String backImageId;
    private String editConfigFront;    // JSON: crop, filters, adjustments
    private String editConfigBack;     // JSON: crop, filters, adjustments
    private String idempotencyKey;
    private boolean draft = false;
    private Double customWidthMm;
    private Double customHeightMm;

    // Getters and setters
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

    public boolean isDraft() { return draft; }
    public void setDraft(boolean draft) { this.draft = draft; }

    public Double getCustomWidthMm() { return customWidthMm; }
    public void setCustomWidthMm(Double customWidthMm) { this.customWidthMm = customWidthMm; }

    public Double getCustomHeightMm() { return customHeightMm; }
    public void setCustomHeightMm(Double customHeightMm) { this.customHeightMm = customHeightMm; }
}
