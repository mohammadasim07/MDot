import { create } from 'zustand';
import type { DocumentImage, EditConfig, PaperSize, LayoutType, Orientation, ImagePlacement } from '../types';

/**
 * Paper size definitions with physical dimensions in mm.
 */
export const PAPER_SIZES: PaperSize[] = [
  { id: 'A4', name: 'A4', widthMm: 210, heightMm: 297, description: '210 × 297 mm' },
  { id: 'LEGAL', name: 'Legal', widthMm: 215.9, heightMm: 355.6, description: '215.9 × 355.6 mm' },
  { id: 'A5', name: 'A5', widthMm: 148, heightMm: 210, description: '148 × 210 mm' },
  { id: 'LETTER', name: 'Letter', widthMm: 215.9, heightMm: 279.4, description: '215.9 × 279.4 mm' },
];

const defaultEditConfig: EditConfig = {
  brightness: 0,
  contrast: 0,
  sharpness: 0,
  rotation: 0,
  flipH: false,
  flipV: false,
  filter: 'original',
  crop: null,
};

interface EditorState {
  // Images
  frontImage: DocumentImage | null;
  backImage: DocumentImage | null;
  frontPreviewUrl: string | null;
  backPreviewUrl: string | null;

  // Edit configs (per side)
  frontEditConfig: EditConfig;
  backEditConfig: EditConfig;

  // Paper
  paperSize: PaperSize;
  orientation: Orientation;
  layoutType: LayoutType;

  // Canvas placements
  placements: ImagePlacement[];

  // Margins (mm)
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  spacingBetween: number;

  // Copies
  copies: number;

  // Undo/Redo
  undoStack: string[];
  redoStack: string[];

  // Actions
  setFrontImage: (image: DocumentImage | null, previewUrl?: string) => void;
  setBackImage: (image: DocumentImage | null, previewUrl?: string) => void;
  updateFrontEdit: (config: Partial<EditConfig>) => void;
  updateBackEdit: (config: Partial<EditConfig>) => void;
  setPaperSize: (paper: PaperSize) => void;
  setOrientation: (orientation: Orientation) => void;
  setLayoutType: (layout: LayoutType) => void;
  setCopies: (copies: number) => void;
  setMargins: (margins: { top?: number; bottom?: number; left?: number; right?: number }) => void;
  setSpacing: (spacing: number) => void;
  updatePlacement: (index: number, placement: Partial<ImagePlacement>) => void;
  setPlacements: (placements: ImagePlacement[]) => void;
  autoLayout: () => void;
  resetLayout: () => void;
  resetAll: () => void;
  pushUndo: () => void;
  undo: () => void;
  redo: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial state
  frontImage: null,
  backImage: null,
  frontPreviewUrl: null,
  backPreviewUrl: null,
  frontEditConfig: { ...defaultEditConfig },
  backEditConfig: { ...defaultEditConfig },
  paperSize: PAPER_SIZES[0], // A4
  orientation: 'PORTRAIT',
  layoutType: 'VERTICAL',
  placements: [],
  marginTop: 10,
  marginBottom: 10,
  marginLeft: 10,
  marginRight: 10,
  spacingBetween: 5,
  copies: 1,
  undoStack: [],
  redoStack: [],

  setFrontImage: (image, previewUrl) => {
    set({ frontImage: image, frontPreviewUrl: previewUrl || null });
    get().autoLayout();
  },

  setBackImage: (image, previewUrl) => {
    set({ backImage: image, backPreviewUrl: previewUrl || null });
    get().autoLayout();
  },

  updateFrontEdit: (config) => {
    set((s) => ({ frontEditConfig: { ...s.frontEditConfig, ...config } }));
  },

  updateBackEdit: (config) => {
    set((s) => ({ backEditConfig: { ...s.backEditConfig, ...config } }));
  },

  setPaperSize: (paper) => {
    set({ paperSize: paper });
    get().autoLayout();
  },

  setOrientation: (orientation) => {
    set({ orientation });
    get().autoLayout();
  },

  setLayoutType: (layout) => {
    set({ layoutType: layout });
    get().autoLayout();
  },

  setCopies: (copies) => set({ copies: Math.max(1, copies) }),

  setMargins: (margins) => {
    set((s) => ({
      marginTop: margins.top ?? s.marginTop,
      marginBottom: margins.bottom ?? s.marginBottom,
      marginLeft: margins.left ?? s.marginLeft,
      marginRight: margins.right ?? s.marginRight,
    }));
    get().autoLayout();
  },

  setSpacing: (spacing) => {
    set({ spacingBetween: spacing });
    get().autoLayout();
  },

  updatePlacement: (index, placement) => {
    set((s) => {
      const newPlacements = [...s.placements];
      if (newPlacements[index]) {
        newPlacements[index] = { ...newPlacements[index], ...placement };
      }
      return { placements: newPlacements };
    });
  },

  setPlacements: (placements) => set({ placements }),

  /**
   * Auto-arrange images based on layout type and paper size.
   */
  autoLayout: () => {
    const state = get();
    const images: { id: string; side: 'FRONT' | 'BACK'; w: number; h: number }[] = [];

    if (state.frontImage) {
      images.push({ id: state.frontImage.id, side: 'FRONT', w: state.frontImage.width, h: state.frontImage.height });
    }
    if (state.backImage) {
      images.push({ id: state.backImage.id, side: 'BACK', w: state.backImage.width, h: state.backImage.height });
    }

    if (images.length === 0) {
      set({ placements: [] });
      return;
    }

    const paper = state.paperSize;
    const isLandscape = state.orientation === 'LANDSCAPE';
    const pageW = isLandscape ? paper.heightMm : paper.widthMm;
    const pageH = isLandscape ? paper.widthMm : paper.heightMm;

    const printableW = pageW - state.marginLeft - state.marginRight;
    const printableH = pageH - state.marginTop - state.marginBottom;

    const placements: ImagePlacement[] = [];

    if (state.layoutType === 'VERTICAL') {
      const availH = images.length > 1
        ? (printableH - state.spacingBetween) / images.length
        : printableH;

      images.forEach((img, i) => {
        // Scale image to fit within slot, maintaining aspect ratio
        const aspectRatio = img.w / img.h;
        let fitW = printableW;
        let fitH = fitW / aspectRatio;

        if (fitH > availH) {
          fitH = availH;
          fitW = fitH * aspectRatio;
        }

        // Center horizontally
        const x = state.marginLeft + (printableW - fitW) / 2;
        const y = state.marginTop + i * (availH + state.spacingBetween);

        placements.push({
          imageId: img.id,
          side: img.side,
          x, y,
          width: fitW,
          height: fitH,
          rotation: 0,
        });
      });
    } else if (state.layoutType === 'HORIZONTAL') {
      const availW = images.length > 1
        ? (printableW - state.spacingBetween) / images.length
        : printableW;

      images.forEach((img, i) => {
        const aspectRatio = img.w / img.h;
        let fitH = printableH;
        let fitW = fitH * aspectRatio;

        if (fitW > availW) {
          fitW = availW;
          fitH = fitW / aspectRatio;
        }

        const x = state.marginLeft + i * (availW + state.spacingBetween);
        const y = state.marginTop + (printableH - fitH) / 2;

        placements.push({
          imageId: img.id,
          side: img.side,
          x, y,
          width: fitW,
          height: fitH,
          rotation: 0,
        });
      });
    } else {
      // FREE: place at top-left with some offset
      images.forEach((img, i) => {
        const aspectRatio = img.w / img.h;
        let fitW = printableW * 0.6;
        let fitH = fitW / aspectRatio;

        if (fitH > printableH * 0.6) {
          fitH = printableH * 0.6;
          fitW = fitH * aspectRatio;
        }

        placements.push({
          imageId: img.id,
          side: img.side,
          x: state.marginLeft + i * 20,
          y: state.marginTop + i * 20,
          width: fitW,
          height: fitH,
          rotation: 0,
        });
      });
    }

    set({ placements });
  },

  resetLayout: () => {
    set({
      layoutType: 'VERTICAL',
      marginTop: 10,
      marginBottom: 10,
      marginLeft: 10,
      marginRight: 10,
      spacingBetween: 5,
    });
    get().autoLayout();
  },

  resetAll: () => {
    set({
      frontImage: null,
      backImage: null,
      frontPreviewUrl: null,
      backPreviewUrl: null,
      frontEditConfig: { ...defaultEditConfig },
      backEditConfig: { ...defaultEditConfig },
      paperSize: PAPER_SIZES[0],
      orientation: 'PORTRAIT',
      layoutType: 'VERTICAL',
      placements: [],
      marginTop: 10,
      marginBottom: 10,
      marginLeft: 10,
      marginRight: 10,
      spacingBetween: 5,
      copies: 1,
      undoStack: [],
      redoStack: [],
    });
  },

  pushUndo: () => {
    const state = get();
    const snapshot = JSON.stringify({
      placements: state.placements,
      layoutType: state.layoutType,
      orientation: state.orientation,
      paperSize: state.paperSize,
    });
    set((s) => ({
      undoStack: [...s.undoStack.slice(-19), snapshot],
      redoStack: [],
    }));
  },

  undo: () => {
    const state = get();
    if (state.undoStack.length === 0) return;
    const current = JSON.stringify({
      placements: state.placements,
      layoutType: state.layoutType,
      orientation: state.orientation,
      paperSize: state.paperSize,
    });
    const prev = state.undoStack[state.undoStack.length - 1];
    const restored = JSON.parse(prev);
    set({
      ...restored,
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, current],
    });
  },

  redo: () => {
    const state = get();
    if (state.redoStack.length === 0) return;
    const current = JSON.stringify({
      placements: state.placements,
      layoutType: state.layoutType,
      orientation: state.orientation,
      paperSize: state.paperSize,
    });
    const next = state.redoStack[state.redoStack.length - 1];
    const restored = JSON.parse(next);
    set({
      ...restored,
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, current],
    });
  },
}));
