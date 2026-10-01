import { create } from 'zustand';
import {
  ASIM_AADHAAR_FRONT,
  ASIM_AADHAAR_BACK,
  SAMPLE_CARD_1_FRONT,
  SAMPLE_CARD_1_BACK,
  SAMPLE_CARD_2_FRONT,
  SAMPLE_CARD_2_BACK,
} from '../assets/sampleCards';

export interface CropRect {
  x: number;      // 0 to 1
  y: number;      // 0 to 1
  width: number;  // 0 to 1
  height: number; // 0 to 1
}

export interface CardItem {
  id: string;
  name: string;
  frontUrl: string | null;
  frontRotation: number;
  frontZoom: number;
  frontCrop?: CropRect;
  frontImageId?: string;
  backUrl: string | null;
  backRotation: number;
  backZoom: number;
  backCrop?: CropRect;
  backImageId?: string;
}

export interface PaperFormat {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  label: string;
}

export const PAPER_FORMATS: PaperFormat[] = [
  { id: 'A4', name: 'A4', widthMm: 210, heightMm: 297, label: 'A4 (210 × 297 mm)' },
  { id: 'LEGAL', name: 'Legal', widthMm: 215.9, heightMm: 355.6, label: 'Legal (215.9 × 355.6 mm)' },
  { id: 'A5', name: 'A5', widthMm: 148, heightMm: 210, label: 'A5 (148 × 210 mm)' },
  { id: 'LETTER', name: 'Letter', widthMm: 215.9, heightMm: 279.4, label: 'Letter (215.9 × 279.4 mm)' },
];

export const DEFAULT_CROP: CropRect = {
  x: 0,
  y: 0,
  width: 1,
  height: 1,
};

interface MToolState {
  cards: CardItem[];
  activeCardId: string;
  activeSide: 'FRONT' | 'BACK';

  paperSizeId: string;
  orientation: 'PORTRAIT' | 'LANDSCAPE';
  spacingMm: number;
  marginsMm: number;
  cardWidthMm: number;

  // Actions
  addCard: () => void;
  removeCard: (id: string) => void;
  selectCard: (id: string) => void;
  setActiveSide: (side: 'FRONT' | 'BACK') => void;
  setFrontImage: (cardId: string, url: string, imageId?: string) => void;
  setBackImage: (cardId: string, url: string, imageId?: string) => void;
  setFrontCrop: (cardId: string, crop: CropRect) => void;
  setBackCrop: (cardId: string, crop: CropRect) => void;
  rotateFront: (cardId: string, deltaDeg: number) => void;
  rotateBack: (cardId: string, deltaDeg: number) => void;
  resetFront: (cardId: string) => void;
  resetBack: (cardId: string) => void;
  setFrontZoom: (cardId: string, zoom: number) => void;
  setBackZoom: (cardId: string, zoom: number) => void;
  setPaperSize: (id: string) => void;
  setOrientation: (orientation: 'PORTRAIT' | 'LANDSCAPE') => void;
  setSpacing: (mm: number) => void;
  setMargins: (mm: number) => void;
  setCardWidth: (mm: number) => void;
  clearAll: () => void;
}

const defaultCards: CardItem[] = [
  {
    id: 'card-1',
    name: 'Mohammad Asim (Aadhaar)',
    frontUrl: ASIM_AADHAAR_FRONT,
    frontRotation: 0,
    frontZoom: 100,
    frontCrop: { x: 0, y: 0, width: 1, height: 1 },
    backUrl: ASIM_AADHAAR_BACK,
    backRotation: 0,
    backZoom: 100,
    backCrop: { x: 0, y: 0, width: 1, height: 1 },
  },
  {
    id: 'card-2',
    name: 'Card 2 (Greeting)',
    frontUrl: SAMPLE_CARD_1_FRONT,
    frontRotation: 0,
    frontZoom: 100,
    frontCrop: { x: 0, y: 0, width: 1, height: 1 },
    backUrl: SAMPLE_CARD_1_BACK,
    backRotation: 0,
    backZoom: 100,
    backCrop: { x: 0, y: 0, width: 1, height: 1 },
  },
  {
    id: 'card-3',
    name: 'Card 3 (Floral)',
    frontUrl: SAMPLE_CARD_2_FRONT,
    frontRotation: 0,
    frontZoom: 100,
    frontCrop: { x: 0, y: 0, width: 1, height: 1 },
    backUrl: SAMPLE_CARD_2_BACK,
    backRotation: 0,
    backZoom: 100,
    backCrop: { x: 0, y: 0, width: 1, height: 1 },
  },
];

export const useMToolStore = create<MToolState>((set) => ({
  cards: defaultCards,
  activeCardId: 'card-1',
  activeSide: 'FRONT',

  paperSizeId: 'A4',
  orientation: 'PORTRAIT',
  spacingMm: 10,
  marginsMm: 15,
  cardWidthMm: 86,

  addCard: () => {
    set((state) => {
      const nextNum = state.cards.length + 1;
      const newCard: CardItem = {
        id: `card-${Date.now()}`,
        name: `Card ${nextNum}`,
        frontUrl: null,
        frontRotation: 0,
        frontZoom: 100,
        frontCrop: { ...DEFAULT_CROP },
        backUrl: null,
        backRotation: 0,
        backZoom: 100,
        backCrop: { ...DEFAULT_CROP },
      };
      return {
        cards: [...state.cards, newCard],
        activeCardId: newCard.id,
      };
    });
  },

  removeCard: (id) => {
    set((state) => {
      const filtered = state.cards.filter((c) => c.id !== id);
      const newActive = filtered.length > 0
        ? (state.activeCardId === id ? filtered[0].id : state.activeCardId)
        : '';
      return { cards: filtered, activeCardId: newActive };
    });
  },

  selectCard: (id) => set({ activeCardId: id }),

  setActiveSide: (side) => set({ activeSide: side }),

  setFrontImage: (cardId, url, imageId) => {
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === cardId
          ? {
              ...c,
              frontUrl: url,
              frontImageId: imageId,
              frontCrop: { ...DEFAULT_CROP },
              frontRotation: 0,
              frontZoom: 100,
            }
          : c
      ),
    }));
  },

  setBackImage: (cardId, url, imageId) => {
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === cardId
          ? {
              ...c,
              backUrl: url,
              backImageId: imageId,
              backCrop: { ...DEFAULT_CROP },
              backRotation: 0,
              backZoom: 100,
            }
          : c
      ),
    }));
  },

  setFrontCrop: (cardId, crop) => {
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === cardId ? { ...c, frontCrop: crop } : c
      ),
    }));
  },

  setBackCrop: (cardId, crop) => {
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === cardId ? { ...c, backCrop: crop } : c
      ),
    }));
  },

  rotateFront: (cardId, deltaDeg) => {
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === cardId ? { ...c, frontRotation: (c.frontRotation + deltaDeg + 360) % 360 } : c
      ),
    }));
  },

  rotateBack: (cardId, deltaDeg) => {
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === cardId ? { ...c, backRotation: (c.backRotation + deltaDeg + 360) % 360 } : c
      ),
    }));
  },

  resetFront: (cardId) => {
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === cardId
          ? {
              ...c,
              frontRotation: 0,
              frontZoom: 100,
              frontCrop: { ...DEFAULT_CROP },
            }
          : c
      ),
    }));
  },

  resetBack: (cardId) => {
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === cardId
          ? {
              ...c,
              backRotation: 0,
              backZoom: 100,
              backCrop: { ...DEFAULT_CROP },
            }
          : c
      ),
    }));
  },

  setFrontZoom: (cardId, zoom) => {
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === cardId ? { ...c, frontZoom: zoom } : c
      ),
    }));
  },

  setBackZoom: (cardId, zoom) => {
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === cardId ? { ...c, backZoom: zoom } : c
      ),
    }));
  },

  setPaperSize: (id) => set({ paperSizeId: id }),

  setOrientation: (orientation) => set({ orientation }),

  setSpacing: (mm) => set({ spacingMm: mm }),

  setMargins: (mm) => set({ marginsMm: mm }),

  setCardWidth: (mm) => set({ cardWidthMm: mm }),

  clearAll: () => {
    set({
      cards: [],
      activeCardId: '',
    });
  },
}));
