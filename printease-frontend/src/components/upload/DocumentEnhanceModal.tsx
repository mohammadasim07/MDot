import { useState, useEffect, useRef, useCallback } from 'react';
import {
  HiOutlineSparkles,
  HiOutlineArrowPath,
  HiOutlineXMark,
  HiOutlineCheck,
  HiOutlineArrowsRightLeft,
  HiOutlineArrowsUpDown,
  HiOutlineScissors,
  HiOutlineSun,
} from 'react-icons/hi2';
import type { EditConfig, ImageSide } from '../../types';

interface DocumentEnhanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  side: ImageSide;
  imageUrl: string;
  initialConfig: EditConfig;
  onApply: (config: EditConfig, processedDataUrl: string) => void;
}

export function DocumentEnhanceModal({
  isOpen,
  onClose,
  side,
  imageUrl,
  initialConfig,
  onApply,
}: DocumentEnhanceModalProps) {
  const [config, setConfig] = useState<EditConfig>({ ...initialConfig });
  const [straightenAngle, setStraightenAngle] = useState(0);
  const [aspectPreset, setAspectPreset] = useState<'free' | 'id_card' | 'a4' | 'square'>('free');
  const [isCropping, setIsCropping] = useState(false);

  // Normalized crop coordinates [0, 1]
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 1,
    height: 1,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rawImageRef = useRef<HTMLImageElement | null>(null);

  // Load source image
  useEffect(() => {
    if (!isOpen || !imageUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      rawImageRef.current = img;
      setConfig({ ...initialConfig });
      setStraightenAngle(initialConfig.rotation % 90);
      renderLiveCanvas();
    };
  }, [isOpen, imageUrl]);

  // Render to canvas whenever config changes
  const renderLiveCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = rawImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use full image size for max quality
    const baseW = img.naturalWidth || img.width;
    const baseH = img.naturalHeight || img.height;

    // Handle crop sub-area
    let sx = cropBox.x * baseW;
    let sy = cropBox.y * baseH;
    let sw = cropBox.width * baseW;
    let sh = cropBox.height * baseH;

    // Constrain
    sx = Math.max(0, Math.min(sx, baseW - 10));
    sy = Math.max(0, Math.min(sy, baseH - 10));
    sw = Math.max(10, Math.min(sw, baseW - sx));
    sh = Math.max(10, Math.min(sh, baseH - sy));

    const totalRotation = (config.rotation || 0) + straightenAngle;
    const radians = (totalRotation * Math.PI) / 180;
    const absCos = Math.abs(Math.cos(radians));
    const absSin = Math.abs(Math.sin(radians));

    // Calculate canvas size to contain rotated image
    const destW = Math.round(sw * absCos + sh * absSin);
    const destH = Math.round(sw * absSin + sh * absCos);

    canvas.width = destW;
    canvas.height = destH;

    ctx.save();
    ctx.clearRect(0, 0, destW, destH);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, destW, destH);

    // Transform
    ctx.translate(destW / 2, destH / 2);
    ctx.rotate(radians);
    ctx.scale(config.flipH ? -1 : 1, config.flipV ? -1 : 1);

    // Draw cropped subregion centered
    ctx.drawImage(img, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
    ctx.restore();

    // Apply color filters & contrast/brightness to pixels
    const imgData = ctx.getImageData(0, 0, destW, destH);
    const data = imgData.data;
    const brightness = config.brightness || 0;
    const contrast = config.contrast || 0;
    const filter = config.filter;

    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      if (filter === 'grayscale') {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = g = b = gray;
      } else if (filter === 'bw') {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const bw = gray > 130 ? 255 : 0;
        r = g = b = bw;
      } else if (filter === 'auto_enhance' || filter === 'document_scan') {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        // Boost contrast and white paper background
        const enhanced = Math.min(255, Math.max(0, factor * (gray - 128) + 128 + 18));
        r = g = b = enhanced;
      }

      if (brightness !== 0 || contrast !== 0) {
        r = Math.min(255, Math.max(0, factor * (r - 128) + 128 + brightness * 2));
        g = Math.min(255, Math.max(0, factor * (g - 128) + 128 + brightness * 2));
        b = Math.min(255, Math.max(0, factor * (b - 128) + 128 + brightness * 2));
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    ctx.putImageData(imgData, 0, 0);
  }, [config, straightenAngle, cropBox]);

  useEffect(() => {
    if (isOpen) {
      renderLiveCanvas();
    }
  }, [isOpen, renderLiveCanvas]);

  if (!isOpen) return null;

  const handleRotate90 = (delta: number) => {
    setConfig((prev) => ({
      ...prev,
      rotation: (prev.rotation + delta + 360) % 360,
    }));
  };

  const handleApplyPreset = (preset: typeof aspectPreset) => {
    setAspectPreset(preset);
    setIsCropping(true);

    if (preset === 'id_card') {
      // 85.6mm x 54mm = 1.585 ratio
      setCropBox({ x: 0.1, y: 0.2, width: 0.8, height: 0.8 / 1.585 });
    } else if (preset === 'a4') {
      // 1 : 1.414 ratio
      setCropBox({ x: 0.15, y: 0.05, width: 0.7, height: Math.min(0.9, 0.7 * 1.414) });
    } else if (preset === 'square') {
      setCropBox({ x: 0.15, y: 0.15, width: 0.7, height: 0.7 });
    } else {
      setCropBox({ x: 0, y: 0, width: 1, height: 1 });
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const finalConfig: EditConfig = {
      ...config,
      rotation: config.rotation + straightenAngle,
      crop: isCropping
        ? {
            x: Math.round(cropBox.x * (rawImageRef.current?.naturalWidth || 1000)),
            y: Math.round(cropBox.y * (rawImageRef.current?.naturalHeight || 1000)),
            width: Math.round(cropBox.width * (rawImageRef.current?.naturalWidth || 1000)),
            height: Math.round(cropBox.height * (rawImageRef.current?.naturalHeight || 1000)),
          }
        : null,
    };

    onApply(finalConfig, dataUrl);
    onClose();
  };

  const handleReset = () => {
    setConfig({
      brightness: 0,
      contrast: 0,
      sharpness: 0,
      rotation: 0,
      flipH: false,
      flipV: false,
      filter: 'original',
      crop: null,
    });
    setStraightenAngle(0);
    setCropBox({ x: 0, y: 0, width: 1, height: 1 });
    setIsCropping(false);
  };

  const filterButtons = [
    { id: 'original', label: 'Natural' },
    { id: 'auto_enhance', label: 'Magic Enhance' },
    { id: 'document_scan', label: 'Scan Clean' },
    { id: 'bw', label: 'Photocopy B&W' },
    { id: 'grayscale', label: 'Grayscale' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
              <HiOutlineSparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">
                Enhance & Crop — {side === 'FRONT' ? 'Front Side' : 'Back Side'}
              </h3>
              <p className="text-xs text-gray-500">Auto-clean background, adjust contrast, and crop to document edges</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Canvas Preview Area */}
          <div className="flex-1 bg-slate-900/95 flex items-center justify-center p-6 relative overflow-hidden select-none">
            <div className="max-w-full max-h-full flex items-center justify-center relative shadow-2xl rounded-lg overflow-hidden border border-slate-700/50">
              <canvas
                ref={canvasRef}
                className="max-h-[58vh] max-w-[50vw] object-contain block bg-white"
              />
            </div>

            {/* Quick angle indicator */}
            {(config.rotation !== 0 || straightenAngle !== 0) && (
              <div className="absolute top-4 left-4 bg-slate-800/80 backdrop-blur-md px-3 py-1 rounded-full text-xs text-slate-300 border border-slate-700">
                Rotation: {config.rotation + straightenAngle}°
              </div>
            )}
          </div>

          {/* Right Toolbar Controls */}
          <div className="w-80 bg-white border-l border-gray-200 p-5 overflow-y-auto space-y-5">
            {/* Filter Presets */}
            <section>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <HiOutlineSparkles className="w-3.5 h-3.5 text-blue-600" />
                Document Filter
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {filterButtons.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setConfig((prev) => ({ ...prev, filter: f.id }))}
                    className={`px-3 py-2 text-left rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                      config.filter === f.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <span>{f.label}</span>
                    {config.filter === f.id && <HiOutlineCheck className="w-4 h-4 text-blue-600" />}
                  </button>
                ))}
              </div>
            </section>

            {/* Orientation & Straighten */}
            <section className="space-y-3">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block flex items-center gap-1.5">
                <HiOutlineArrowPath className="w-3.5 h-3.5 text-blue-600" />
                Rotate & Straighten
              </label>

              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={() => handleRotate90(-90)}
                  className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-medium transition-colors text-center"
                  title="Rotate -90°"
                >
                  ↺ -90°
                </button>
                <button
                  onClick={() => handleRotate90(90)}
                  className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-medium transition-colors text-center"
                  title="Rotate +90°"
                >
                  ↻ +90°
                </button>
                <button
                  onClick={() => setConfig((prev) => ({ ...prev, flipH: !prev.flipH }))}
                  className={`p-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center ${
                    config.flipH ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="Flip Horizontal"
                >
                  <HiOutlineArrowsRightLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setConfig((prev) => ({ ...prev, flipV: !prev.flipV }))}
                  className={`p-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center ${
                    config.flipV ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="Flip Vertical"
                >
                  <HiOutlineArrowsUpDown className="w-4 h-4" />
                </button>
              </div>

              {/* Fine angle slider */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Fine Straighten</span>
                  <span className="font-semibold text-gray-700">{straightenAngle > 0 ? `+${straightenAngle}` : straightenAngle}°</span>
                </div>
                <input
                  type="range"
                  min={-15}
                  max={15}
                  step={0.5}
                  value={straightenAngle}
                  onChange={(e) => setStraightenAngle(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                />
              </div>
            </section>

            {/* Crop Aspect Ratio Presets */}
            <section className="space-y-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block flex items-center gap-1.5">
                <HiOutlineScissors className="w-3.5 h-3.5 text-blue-600" />
                Crop Presets
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleApplyPreset('free')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    aspectPreset === 'free' && isCropping
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Full / Free
                </button>
                <button
                  onClick={() => handleApplyPreset('id_card')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    aspectPreset === 'id_card'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ID / Aadhaar
                </button>
                <button
                  onClick={() => handleApplyPreset('a4')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    aspectPreset === 'a4'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  A4 Ratio
                </button>
                <button
                  onClick={() => handleApplyPreset('square')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    aspectPreset === 'square'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Square 1:1
                </button>
              </div>
            </section>

            {/* Brightness & Contrast Sliders */}
            <section className="space-y-3">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block flex items-center gap-1.5">
                <HiOutlineSun className="w-3.5 h-3.5 text-blue-600" />
                Brightness & Contrast
              </label>

              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Brightness</span>
                  <span className="font-semibold text-gray-700">{config.brightness > 0 ? `+${config.brightness}` : config.brightness}</span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={config.brightness}
                  onChange={(e) => setConfig((prev) => ({ ...prev, brightness: parseInt(e.target.value) }))}
                  className="w-full accent-blue-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Contrast</span>
                  <span className="font-semibold text-gray-700">{config.contrast > 0 ? `+${config.contrast}` : config.contrast}</span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={config.contrast}
                  onChange={(e) => setConfig((prev) => ({ ...prev, contrast: parseInt(e.target.value) }))}
                  className="w-full accent-blue-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                />
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="text-xs font-medium text-gray-500 hover:text-gray-700 underline"
          >
            Reset to Original
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <HiOutlineCheck className="w-4 h-4" />
              Apply to Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
