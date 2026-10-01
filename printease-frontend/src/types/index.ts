/**
 * PrintEase TypeScript type definitions
 */

// ==================== Image Types ====================

export type ImageSide = 'FRONT' | 'BACK';

export interface DocumentImage {
  id: string;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  width: number;
  height: number;
  side: ImageSide;
  isOriginal: boolean;
  createdAt: string;
}

// ==================== Print Job Types ====================

export type JobStatus =
  | 'DRAFT'
  | 'WAITING'
  | 'PREPARING'
  | 'READY'
  | 'PRINTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'PAUSED';

export type Orientation = 'PORTRAIT' | 'LANDSCAPE';
export type PrintQuality = 'DRAFT' | 'NORMAL' | 'HIGH';
export type LayoutType = 'VERTICAL' | 'HORIZONTAL' | 'FREE';

export interface PrintJob {
  id: string;
  status: JobStatus;
  paperSize: string;
  orientation: Orientation;
  copies: number;
  printerName: string | null;
  printQuality: PrintQuality;
  layoutType: LayoutType;
  layoutConfig: string | null;
  frontImageId: string | null;
  backImageId: string | null;
  editConfigFront: string | null;
  editConfigBack: string | null;
  idempotencyKey: string;
  priority: number;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  completedAt: string | null;
  customWidthMm: number | null;
  customHeightMm: number | null;
}

export interface PrintJobRequest {
  paperSize?: string;
  orientation?: Orientation;
  copies?: number;
  printerName?: string;
  printQuality?: PrintQuality;
  layoutType?: LayoutType;
  layoutConfig?: string;
  frontImageId?: string;
  backImageId?: string;
  editConfigFront?: string;
  editConfigBack?: string;
  idempotencyKey?: string;
  draft?: boolean;
  customWidthMm?: number;
  customHeightMm?: number;
}

// ==================== Paper Types ====================

export interface PaperSize {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  description: string;
}

// ==================== Printer Types ====================

export interface Printer {
  name: string;
  isDefault: boolean;
  status: string;
  supportedMedia: string[];
}

// ==================== Queue Stats ====================

export interface QueueStats {
  draft: number;
  waiting: number;
  preparing: number;
  ready: number;
  printing: number;
  completed: number;
  failed: number;
  cancelled: number;
}

// ==================== Layout Config ====================

export interface ImagePlacement {
  imageId: string;
  side: ImageSide;
  x: number;       // mm from left
  y: number;       // mm from top
  width: number;   // mm
  height: number;  // mm
  rotation: number; // degrees
}

export interface LayoutConfig {
  images: ImagePlacement[];
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  spacingBetween: number;
}

// ==================== Edit Config ====================

export interface EditConfig {
  brightness: number;   // -100 to 100, default 0
  contrast: number;     // -100 to 100, default 0
  sharpness: number;    // 0 to 100, default 0
  rotation: number;     // degrees
  flipH: boolean;
  flipV: boolean;
  filter: string;       // 'original' | 'auto_enhance' | 'document_scan' | 'grayscale' | 'bw' | 'high_contrast'
  crop: CropConfig | null;
}

export interface CropConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ==================== API Response Types ====================

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
}
