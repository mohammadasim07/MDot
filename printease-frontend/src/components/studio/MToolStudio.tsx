import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  LuLayers,
  LuFileText,
  LuDownload,
  LuPrinter,
  LuCirclePlus,
  LuEllipsisVertical,
  LuSparkles,
  LuRefreshCw,
  LuCrop,
  LuRotateCcw,
  LuRotateCw,
  LuZoomOut,
  LuZoomIn,
  LuShrink,
  LuFileDown,
  LuTrash2,
} from 'react-icons/lu';
import { useMToolStore, PAPER_FORMATS, DEFAULT_CROP, type CardItem } from '../../stores/mtoolStore';
import { imageApi } from '../../services/api';
import { InteractiveCropBox } from './InteractiveCropBox';
import { CroppedPreview, getCroppedDataUrl } from './cropUtils';
import { downloadSheet300Dpi } from './directPrint';

export function MToolStudio() {
  const {
    cards,
    activeCardId,
    paperSizeId,
    orientation,
    spacingMm,
    marginsMm,
    cardWidthMm,
    addCard,
    removeCard,
    selectCard,
    setFrontImage,
    setBackImage,
    setFrontCrop,
    setBackCrop,
    rotateFront,
    rotateBack,
    resetFront,
    resetBack,
    setFrontZoom,
    setBackZoom,
    setPaperSize,
    clearAll,
  } = useMToolStore();

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const [frontPrintDataUrl, setFrontPrintDataUrl] = useState<string>('');
  const [backPrintDataUrl, setBackPrintDataUrl] = useState<string>('');

  // Toggles matching M.DoT Pro design
  const [aiAutoDetect, setAiAutoDetect] = useState(true);
  const [scissorGuidelines] = useState(true);

  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);

  const autoCropFrontRef = useRef<(() => void) | null>(null);
  const autoCropBackRef = useRef<(() => void) | null>(null);

  const activeCard: CardItem | undefined =
    cards.find((c) => c.id === activeCardId) || cards[0];

  const currentPaper =
    PAPER_FORMATS.find((p) => p.id === paperSizeId) || PAPER_FORMATS[0];

  // Pre-render cropped 1:1 card images so native print (Ctrl + P) is instant with zero lag
  useEffect(() => {
    let isCancelled = false;
    if (activeCard?.frontUrl) {
      getCroppedDataUrl(
        activeCard.frontUrl,
        activeCard.frontCrop || DEFAULT_CROP,
        activeCard.frontRotation || 0
      )
        .then((url) => {
          if (!isCancelled) setFrontPrintDataUrl(url);
        })
        .catch(() => {
          if (!isCancelled) setFrontPrintDataUrl(activeCard.frontUrl || '');
        });
    } else {
      setFrontPrintDataUrl('');
    }

    if (activeCard?.backUrl) {
      getCroppedDataUrl(
        activeCard.backUrl,
        activeCard.backCrop || DEFAULT_CROP,
        activeCard.backRotation || 0
      )
        .then((url) => {
          if (!isCancelled) setBackPrintDataUrl(url);
        })
        .catch(() => {
          if (!isCancelled) setBackPrintDataUrl(activeCard.backUrl || '');
        });
    } else {
      setBackPrintDataUrl('');
    }

    return () => {
      isCancelled = true;
    };
  }, [
    activeCard?.id,
    activeCard?.frontUrl,
    activeCard?.frontCrop,
    activeCard?.frontRotation,
    activeCard?.backUrl,
    activeCard?.backCrop,
    activeCard?.backRotation,
  ]);

  // Upload handlers
  const handleUploadFront = useCallback(
    async (file: File) => {
      if (!activeCard) return;
      try {
        const uploaded = await imageApi.upload(file, 'FRONT');
        const fileUrl = imageApi.getFileUrl(uploaded.id);
        setFrontImage(activeCard.id, fileUrl, uploaded.id);
        toast.success('Front photo updated');
      } catch {
        const localUrl = URL.createObjectURL(file);
        setFrontImage(activeCard.id, localUrl);
        toast.success('Front photo loaded');
      }
    },
    [activeCard, setFrontImage]
  );

  const handleUploadBack = useCallback(
    async (file: File) => {
      if (!activeCard) return;
      try {
        const uploaded = await imageApi.upload(file, 'BACK');
        const fileUrl = imageApi.getFileUrl(uploaded.id);
        setBackImage(activeCard.id, fileUrl, uploaded.id);
        toast.success('Back photo updated');
      } catch {
        const localUrl = URL.createObjectURL(file);
        setBackImage(activeCard.id, localUrl);
        toast.success('Back photo loaded');
      }
    },
    [activeCard, setBackImage]
  );

  const handleAutoCropFront = () => {
    if (!activeCard?.frontUrl) {
      toast.error('Upload front photo first');
      return;
    }
    if (autoCropFrontRef.current) {
      autoCropFrontRef.current();
      toast.success('Front photo auto-aligned to 86 × 54 mm!');
    }
  };

  const handleAutoCropBack = () => {
    if (!activeCard?.backUrl) {
      toast.error('Upload back photo first');
      return;
    }
    if (autoCropBackRef.current) {
      autoCropBackRef.current();
      toast.success('Back photo auto-aligned to 86 × 54 mm!');
    }
  };

  // Direct Laptop Print: Opens the exact same dialog as Control + P
  const handlePrint = async () => {
    if (!activeCard) {
      toast.error('Please select or add a card');
      return;
    }
    setPrinting(true);
    window.print();
    setPrinting(false);
  };

  // Keyboard shortcut listener: Control + P opens laptop print directly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDownloadPDF = async () => {
    if (!activeCard?.frontUrl && !activeCard?.backUrl) {
      toast.error('Please add at least one card photo');
      return;
    }
    toast.success('Generating 300 DPI Sheet...');
    try {
      await downloadSheet300Dpi({
        card: activeCard,
        paperSizeId,
        orientation,
        cardWidthMm,
        spacingMm,
        marginsMm,
      });
      toast.success('300 DPI Print Sheet downloaded!');
    } catch {
      toast.error('Failed to download sheet');
    }
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const isLandscape = orientation === 'LANDSCAPE';
  const paperAspect = isLandscape
    ? `${currentPaper.heightMm} / ${currentPaper.widthMm}`
    : `${currentPaper.widthMm} / ${currentPaper.heightMm}`;

  const paperWidthMm = isLandscape ? currentPaper.heightMm : currentPaper.widthMm;
  const paperHeightMm = isLandscape ? currentPaper.widthMm : currentPaper.heightMm;
  const cardHeightMm = Math.round((cardWidthMm * 54) / 86);

  return (
    <>
      {/* ============================================================
          INTERACTIVE APP SHELL (Hidden during native Ctrl + P print)
          ============================================================ */}
      <div
        id="studio-app-container"
        className="h-screen w-screen overflow-hidden flex flex-col bg-slate-100 font-sans text-slate-800 antialiased selection:bg-red-500 selection:text-white"
      >
        {/* Hidden file inputs */}
        <input
          ref={frontFileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/bmp,image/tiff,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUploadFront(f);
          }}
          className="hidden"
        />
        <input
          ref={backFileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/bmp,image/tiff,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUploadBack(f);
          }}
          className="hidden"
        />

        {/* BEGIN: MainHeader */}
        <header className="h-14 border-b border-rose-100 bg-white/95 backdrop-blur px-4 flex items-center justify-between shrink-0 z-30 shadow-xs">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-red-600 via-rose-500 to-red-500 p-[1.5px] shadow-sm shadow-red-500/20 flex items-center justify-center shrink-0">
              <div className="h-full w-full bg-white rounded-[7px] flex items-center justify-center">
                <LuLayers className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900 font-display leading-none">
                  M.DoT
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200 leading-none">
                  Studio Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-none font-normal">
                Smart Card Cropper &amp; Precision Multi-Sheet Print
              </p>
            </div>
          </div>

          {/* Center Paper Selection */}
          <div className="flex items-center bg-rose-50/70 border border-rose-100 rounded-xl px-3 py-1 text-xs gap-2">
            <div className="flex items-center gap-1.5 text-slate-700 font-medium text-xs">
              <LuFileText className="w-3.5 h-3.5 text-red-600" />
              <span>Sheet:</span>
            </div>
            <select
              value={paperSizeId}
              onChange={(e) => setPaperSize(e.target.value)}
              className="bg-white border border-rose-200 rounded-lg py-1 px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500 font-medium cursor-pointer shadow-2xs"
            >
              {PAPER_FORMATS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition shadow-xs cursor-pointer"
            >
              <LuDownload className="w-3.5 h-3.5 text-slate-500" />
              <span>Export PDF</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={printing}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-xs font-bold text-white shadow-sm transition active:scale-[0.98] cursor-pointer"
            >
              <LuPrinter className="w-3.5 h-3.5" />
              <span>{printing ? 'Preparing...' : 'Direct Print'}</span>
            </button>
            <div
              className="w-8 h-8 rounded-full border border-red-200 overflow-hidden ring-1 ring-red-500/20 bg-rose-50 flex items-center justify-center font-bold text-xs text-red-700 select-none ml-1"
              title="Mohammad Asim — Studio Admin"
            >
              SA
            </div>
          </div>
        </header>
        {/* END: MainHeader */}

        {/* BEGIN: ApplicationBody */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* BEGIN: LeftSidebar - Card Queue */}
          <aside className="w-64 bg-white border-r border-rose-100 flex flex-col shrink-0">
            <div className="p-3 border-b border-rose-100 space-y-2.5 bg-rose-50/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-display">
                    Document Queue
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 font-mono font-bold rounded-full">
                    {cards.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              {/* Add New Card Button */}
              <button
                type="button"
                onClick={addCard}
                className="w-full group relative flex items-center justify-center gap-2 py-2 px-3 rounded-xl border-2 border-dashed border-red-300 hover:border-red-500 bg-red-50/50 hover:bg-red-50 text-red-700 hover:text-red-800 transition cursor-pointer text-xs font-semibold"
              >
                <LuCirclePlus className="w-4 h-4 text-red-600 group-hover:scale-110 transition" />
                <span>Add New Card / Photo</span>
              </button>
            </div>

            {/* Cards List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 bg-slate-50/60">
              {cards.map((card, idx) => {
                const isSelected = card.id === activeCard?.id;
                return (
                  <div
                    key={card.id}
                    onClick={() => selectCard(card.id)}
                    className={`group relative rounded-xl border p-2.5 shadow-xs cursor-pointer transition ${
                      isSelected
                        ? 'border-red-300 bg-white ring-1 ring-red-500/20 shadow-sm'
                        : 'border-slate-200 bg-white hover:bg-rose-50/30 hover:border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Thumbnail Dual Preview */}
                      <div className="flex flex-col gap-1 shrink-0">
                        <div className="w-14 h-8 rounded-md bg-slate-100 border border-slate-200 overflow-hidden relative shadow-xs">
                          {card.frontUrl ? (
                            <CroppedPreview
                              src={card.frontUrl}
                              crop={card.frontCrop}
                              rotation={card.frontRotation}
                              className="w-full h-full object-cover"
                              alt="Front"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-100 to-rose-50">
                              <span className="text-[9px] font-mono text-red-800 font-bold">
                                Front ID
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="w-14 h-8 rounded-md bg-slate-100 border border-slate-200 overflow-hidden relative shadow-xs">
                          {card.backUrl ? (
                            <CroppedPreview
                              src={card.backUrl}
                              crop={card.backCrop}
                              rotation={card.backRotation}
                              className="w-full h-full object-cover"
                              alt="Back"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                              <span className="text-[9px] font-mono text-slate-700 font-bold">
                                Back QR
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {card.name || `Card ${idx + 1}`}
                          </h4>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === card.id ? null : card.id);
                              }}
                              className="text-slate-400 hover:text-slate-700 transition p-1"
                            >
                              <LuEllipsisVertical className="w-3.5 h-3.5" />
                            </button>

                            {activeMenuId === card.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-6 w-32 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 text-xs"
                              >
                                {cards.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      removeCard(card.id);
                                      setActiveMenuId(null);
                                      toast.success('Card removed');
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                                  >
                                    <LuTrash2 className="w-3.5 h-3.5" />
                                    <span>Delete Card</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] text-red-700/80 font-medium">
                          {idx === 0 ? 'UIDAI National ID' : 'Custom Format'}
                        </p>
                        <div className="mt-1 flex items-center gap-1">
                          {isSelected ? (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 font-bold">
                              Selected
                            </span>
                          ) : (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              Custom Size
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI Auto-detect Footer Toggle */}
            <div className="p-3 border-t border-rose-100 bg-white flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <LuSparkles className="w-3.5 h-3.5 text-red-600" />
                <span>AI Auto-detect</span>
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiAutoDetect}
                  onChange={(e) => setAiAutoDetect(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-red-600" />
              </label>
            </div>
          </aside>
          {/* END: LeftSidebar */}

          {/* BEGIN: CentralCanvasCropper */}
          <main className="flex-1 flex flex-col min-w-0 bg-slate-100 overflow-hidden min-h-0">
            {/* Dual Cropper Canvas Viewports (Spacious Grid with Inner Padding) */}
            <div className="flex-1 grid grid-cols-2 gap-3 p-3 bg-slate-100 overflow-hidden min-h-0">
              {/* ================= FRONT SIDE EDITOR ================= */}
              <section
                className="flex flex-col bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden min-h-0"
                data-purpose="front-cropper-workspace"
              >
                <div className="h-9 px-3.5 border-b border-slate-100 flex items-center justify-between bg-white text-xs shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-xs" />
                    <span className="font-bold text-slate-800">Front Side Photo</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => frontFileInputRef.current?.click()}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-md hover:bg-red-50 border border-transparent hover:border-red-200 transition"
                  >
                    <LuRefreshCw className="w-3 h-3" />
                    <span>Replace Photo</span>
                  </button>
                </div>

                {/* Canvas Box with Generous Padding */}
                <div className="flex-1 bg-canvas-pattern relative overflow-hidden flex items-center justify-center select-none p-4 min-h-0">
                  {activeCard?.frontUrl ? (
                    <InteractiveCropBox
                      imageUrl={activeCard.frontUrl}
                      rotation={activeCard.frontRotation}
                      zoom={activeCard.frontZoom}
                      crop={activeCard.frontCrop || DEFAULT_CROP}
                      onChangeCrop={(newCrop) => setFrontCrop(activeCard.id, newCrop)}
                      onAutoCropReady={(fn) => {
                        autoCropFrontRef.current = fn;
                      }}
                      alt="Front card"
                    />
                  ) : (
                    <div
                      onClick={() => frontFileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center text-slate-500 gap-2 cursor-pointer p-6"
                    >
                      <LuCirclePlus className="w-10 h-10 text-red-500" />
                      <span className="text-sm font-semibold">Click to Upload Front Photo</span>
                    </div>
                  )}
                </div>

                {/* Controls Below Front Photo */}
                <div className="border-t border-slate-100 bg-white flex flex-col gap-2.5 shrink-0 p-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleAutoCropFront}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                    >
                      <LuCrop className="w-3.5 h-3.5" />
                      <span>Auto Crop (AI)</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => activeCard && rotateFront(activeCard.id, -90)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs flex items-center gap-1 cursor-pointer"
                        title="Rotate Left 90°"
                      >
                        <LuRotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => activeCard && rotateFront(activeCard.id, 90)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs flex items-center gap-1 cursor-pointer"
                        title="Rotate Right 90°"
                      >
                        <LuRotateCw className="w-3.5 h-3.5" />
                      </button>
                      <div className="h-4 w-px bg-slate-200 my-auto" />
                      <button
                        type="button"
                        onClick={() => {
                          if (activeCard) {
                            resetFront(activeCard.id);
                            toast.success('Front photo reset');
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-red-600 text-xs font-medium cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Zoom Slider */}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <LuZoomOut className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="range"
                      min={50}
                      max={200}
                      value={activeCard?.frontZoom || 100}
                      onChange={(e) =>
                        activeCard && setFrontZoom(activeCard.id, Number(e.target.value))
                      }
                      className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-red-600"
                    />
                    <LuZoomIn className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-xs font-mono font-bold w-12 text-center text-slate-700 bg-slate-100 py-0.5 rounded shrink-0">
                      {activeCard?.frontZoom || 100}%
                    </span>
                  </div>
                </div>
              </section>

              {/* ================= BACK SIDE EDITOR ================= */}
              <section
                className="flex flex-col bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden min-h-0"
                data-purpose="back-cropper-workspace"
              >
                <div className="h-9 px-3.5 border-b border-slate-100 flex items-center justify-between bg-white text-xs shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs" />
                    <span className="font-bold text-slate-800">Back Side Photo</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => backFileInputRef.current?.click()}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-md hover:bg-red-50 border border-transparent hover:border-red-200 transition"
                  >
                    <LuRefreshCw className="w-3 h-3" />
                    <span>Replace Photo</span>
                  </button>
                </div>

                {/* Canvas Box with Generous Padding */}
                <div className="flex-1 bg-canvas-pattern relative overflow-hidden flex items-center justify-center select-none p-4 min-h-0">
                  {activeCard?.backUrl ? (
                    <InteractiveCropBox
                      imageUrl={activeCard.backUrl}
                      rotation={activeCard.backRotation}
                      zoom={activeCard.backZoom}
                      crop={activeCard.backCrop || DEFAULT_CROP}
                      onChangeCrop={(newCrop) => setBackCrop(activeCard.id, newCrop)}
                      onAutoCropReady={(fn) => {
                        autoCropBackRef.current = fn;
                      }}
                      alt="Back card"
                    />
                  ) : (
                    <div
                      onClick={() => backFileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center text-slate-500 gap-2 cursor-pointer p-6"
                    >
                      <LuCirclePlus className="w-10 h-10 text-red-500" />
                      <span className="text-sm font-semibold">Click to Upload Back Photo</span>
                    </div>
                  )}
                </div>

                {/* Controls Below Back Photo */}
                <div className="border-t border-slate-100 bg-white flex flex-col gap-2.5 shrink-0 p-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleAutoCropBack}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                    >
                      <LuCrop className="w-3.5 h-3.5" />
                      <span>Auto Crop (AI)</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => activeCard && rotateBack(activeCard.id, -90)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs flex items-center gap-1 cursor-pointer"
                        title="Rotate Left 90°"
                      >
                        <LuRotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => activeCard && rotateBack(activeCard.id, 90)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs flex items-center gap-1 cursor-pointer"
                        title="Rotate Right 90°"
                      >
                        <LuRotateCw className="w-3.5 h-3.5" />
                      </button>
                      <div className="h-4 w-px bg-slate-200 my-auto" />
                      <button
                        type="button"
                        onClick={() => {
                          if (activeCard) {
                            resetBack(activeCard.id);
                            toast.success('Back photo reset');
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-red-600 text-xs font-medium cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Zoom Slider */}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <LuZoomOut className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="range"
                      min={50}
                      max={200}
                      value={activeCard?.backZoom || 100}
                      onChange={(e) =>
                        activeCard && setBackZoom(activeCard.id, Number(e.target.value))
                      }
                      className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-red-600"
                    />
                    <LuZoomIn className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-xs font-mono font-bold w-12 text-center text-slate-700 bg-slate-100 py-0.5 rounded shrink-0">
                      {activeCard?.backZoom || 100}%
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </main>
          {/* END: CentralCanvasCropper */}

          {/* BEGIN: RightPanel - PrintSheetPreview */}
          <aside className="bg-white border-l border-rose-100 flex flex-col shrink-0 min-h-0 w-80 lg:w-[350px]">
            {/* Real-time Live Sheet Simulation Canvas with Generous Inner Padding */}
            <div className="flex-1 bg-slate-50 flex flex-col items-center justify-between p-4 overflow-y-auto min-h-0">

              {/* A4 Sheet Container with Clean Realistic Drop Shadow */}
              <div
                className="w-full bg-white rounded-md shadow-md relative p-4 border border-slate-300 transition-transform duration-200 hover:scale-[1.01] flex flex-col overflow-hidden my-auto"
                style={{
                  aspectRatio: paperAspect,
                  maxHeight: '340px',
                }}
              >
                {/* Printable Margin & Card Layout (Side-by-Side) */}
                <div
                  className="w-full h-full p-2.5 border border-dashed border-slate-300 rounded bg-slate-50/50 relative flex items-center justify-center"
                  style={{ gap: `${Math.max(4, spacingMm * 0.7)}px` }}
                >
                  {/* Front Card (8.6 × 5.4 cm) */}
                  {activeCard?.frontUrl ? (
                    <div
                      className="border border-slate-300 rounded shadow-xs bg-white shrink-0 overflow-hidden"
                      style={{
                        width: `${Math.round(cardWidthMm * 1.35)}px`,
                        height: `${Math.round(((cardWidthMm * 54) / 86) * 1.35)}px`,
                        aspectRatio: '86 / 54',
                      }}
                      title="Front Side (8.6 × 5.4 cm)"
                    >
                      <CroppedPreview
                        src={activeCard.frontUrl}
                        crop={activeCard.frontCrop}
                        rotation={activeCard.frontRotation}
                        className="w-full h-full object-cover"
                        alt="Front Card"
                      />
                    </div>
                  ) : (
                    <div
                      className="border border-dashed border-slate-300 rounded bg-amber-50/95 p-2 flex flex-col justify-between shrink-0"
                      style={{
                        width: `${Math.round(cardWidthMm * 1.35)}px`,
                        height: `${Math.round(((cardWidthMm * 54) / 86) * 1.35)}px`,
                      }}
                    >
                      <span className="text-[8px] font-bold text-slate-800">Front (86×54mm)</span>
                    </div>
                  )}

                  {/* Vertical Cut Guide Separator */}
                  {scissorGuidelines && (
                    <div className="flex flex-col items-center justify-center opacity-50 shrink-0 select-none px-1.5">
                      <div className="w-[1px] h-4 border-l border-dashed border-slate-500" />
                      <span className="text-xs text-slate-600 my-0.5 leading-none">✂</span>
                      <div className="w-[1px] h-4 border-l border-dashed border-slate-500" />
                    </div>
                  )}

                  {/* Back Card (8.6 × 5.4 cm) */}
                  {activeCard?.backUrl ? (
                    <div
                      className="border border-slate-300 rounded shadow-xs bg-white shrink-0 overflow-hidden"
                      style={{
                        width: `${Math.round(cardWidthMm * 1.35)}px`,
                        height: `${Math.round(((cardWidthMm * 54) / 86) * 1.35)}px`,
                        aspectRatio: '86 / 54',
                      }}
                      title="Back Side (8.6 × 5.4 cm)"
                    >
                      <CroppedPreview
                        src={activeCard.backUrl}
                        crop={activeCard.backCrop}
                        rotation={activeCard.backRotation}
                        className="w-full h-full object-cover"
                        alt="Back Card"
                      />
                    </div>
                  ) : (
                    <div
                      className="border border-dashed border-slate-300 rounded bg-amber-50/95 p-2 flex flex-col justify-between shrink-0"
                      style={{
                        width: `${Math.round(cardWidthMm * 1.35)}px`,
                        height: `${Math.round(((cardWidthMm * 54) / 86) * 1.35)}px`,
                      }}
                    >
                      <span className="text-[8px] font-bold text-slate-800">Back (86×54mm)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sheet Fit Indicator with Clean Padding and No Overlapping */}
              <div className="w-full flex items-center justify-between text-xs text-slate-600 mt-3 px-1">
                <span className="flex items-center font-medium">
                  <LuShrink className="w-3.5 h-3.5 mr-1 text-red-600" />
                  <span>Sheet Fit: 100%</span>
                </span>
                <span className="font-mono text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>2 Cards (1 Pair / 10 Max)</span>
                </span>
              </div>
            </div>

            {/* Print Action Quick Footer */}
            <div className="border-t border-rose-100 bg-white space-y-2 shrink-0 p-3.5">
              <button
                type="button"
                onClick={handlePrint}
                disabled={printing}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-red-600/30 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <LuPrinter className="w-4 h-4" />
                <span>Send to Printer ({currentPaper.name} Ready)</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="w-full py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-red-700 border border-rose-200 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <LuFileDown className="w-3.5 h-3.5 text-red-600" />
                <span>Save as High-Res PDF</span>
              </button>
            </div>
          </aside>
          {/* END: RightPanel */}
        </div>
        {/* END: ApplicationBody */}

        {/* BEGIN: BottomStatusBar */}
        <footer className="h-8 bg-white border-t border-rose-100 px-4 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-700 font-semibold">Ready</span>
            </span>
            <span>
              Paper: {currentPaper.name} Standard ({paperWidthMm} × {paperHeightMm} mm)
            </span>
            <span className="font-bold text-slate-800">DEV: MOHAMMAD ASIM</span>
          </div>
          <div className="flex items-center gap-4 font-mono">
            <span>Cut Lines: {scissorGuidelines ? 'Active' : 'Off'}</span>
            <span>Cards on Sheet: 2 (Front+Back) / 10 Max</span>
            <span className="text-red-600 font-bold">100% 1:1 Scale Output</span>
          </div>
        </footer>
        {/* END: BottomStatusBar */}
      </div>

      {/* ============================================================
          PRINTABLE SHEET (Shown ONLY when laptop print / Ctrl + P opens)
          Prints clean paper with 8.6 × 5.4 cm cards and center cut line
          ============================================================ */}
      <div id="printable-sheet" className="hidden print:block">
        <div
          style={{
            width: `${paperWidthMm}mm`,
            minHeight: `${paperHeightMm}mm`,
            paddingTop: `${Math.max(marginsMm, 15)}mm`,
            paddingLeft: `${marginsMm}mm`,
            paddingRight: `${marginsMm}mm`,
            paddingBottom: `${marginsMm}mm`,
            margin: '0 auto',
            background: '#ffffff',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: `${spacingMm}mm`,
            }}
          >
            {/* Front Card (Standard 8.6 × 5.4 cm) */}
            {activeCard?.frontUrl && (
              <div
                style={{
                  width: `${cardWidthMm}mm`,
                  height: `${cardHeightMm}mm`,
                  border: '0.4px solid #94a3b8',
                  borderRadius: '2mm',
                  overflow: 'hidden',
                  background: '#ffffff',
                  boxSizing: 'border-box',
                  pageBreakInside: 'avoid',
                }}
              >
                {frontPrintDataUrl ? (
                  <img
                    src={frontPrintDataUrl}
                    alt="Front Card"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : (
                  <CroppedPreview
                    src={activeCard.frontUrl}
                    crop={activeCard.frontCrop}
                    rotation={activeCard.frontRotation}
                    className="w-full h-full"
                    alt="Front Card"
                  />
                )}
              </div>
            )}

            {/* Center Cut Guide Line (Dashed separator with scissors ✂) */}
            {scissorGuidelines && activeCard?.frontUrl && activeCard?.backUrl && (
              <div
                style={{
                  height: `${cardHeightMm}mm`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  userSelect: 'none',
                }}
              >
                <div style={{ flex: 1, width: '1px', borderLeft: '1px dashed #94a3b8' }} />
                <span style={{ fontSize: '10px', margin: '1.5mm 0', lineHeight: 1 }}>✂</span>
                <div style={{ flex: 1, width: '1px', borderLeft: '1px dashed #94a3b8' }} />
              </div>
            )}

            {/* Back Card (Standard 8.6 × 5.4 cm) */}
            {activeCard?.backUrl && (
              <div
                style={{
                  width: `${cardWidthMm}mm`,
                  height: `${cardHeightMm}mm`,
                  border: '0.4px solid #94a3b8',
                  borderRadius: '2mm',
                  overflow: 'hidden',
                  background: '#ffffff',
                  boxSizing: 'border-box',
                  pageBreakInside: 'avoid',
                }}
              >
                {backPrintDataUrl ? (
                  <img
                    src={backPrintDataUrl}
                    alt="Back Card"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : (
                  <CroppedPreview
                    src={activeCard.backUrl}
                    crop={activeCard.backCrop}
                    rotation={activeCard.backRotation}
                    className="w-full h-full"
                    alt="Back Card"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
