import {
  HiOutlineDocumentText,
  HiOutlineArrowsUpDown,
  HiOutlineArrowsRightLeft,
  HiOutlineCursorArrowRays,
  HiOutlineArrowUturnLeft,
  HiOutlineArrowUturnRight,
  HiOutlineArrowPath,
} from 'react-icons/hi2';
import { useEditorStore, PAPER_SIZES } from '../../stores/editorStore';
import type { LayoutType, Orientation } from '../../types';

export function ControlsPanel() {
  const {
    paperSize,
    orientation,
    layoutType,
    copies,
    marginTop,
    marginLeft,
    spacingBetween,
    undoStack,
    redoStack,
    setPaperSize,
    setOrientation,
    setLayoutType,
    setCopies,
    setMargins,
    setSpacing,
    resetLayout,
    undo,
    redo,
  } = useEditorStore();

  const layoutOptions: { type: LayoutType; label: string; icon: typeof HiOutlineArrowsUpDown }[] = [
    { type: 'VERTICAL', label: 'Vertical', icon: HiOutlineArrowsUpDown },
    { type: 'HORIZONTAL', label: 'Horizontal', icon: HiOutlineArrowsRightLeft },
    { type: 'FREE', label: 'Free', icon: HiOutlineCursorArrowRays },
  ];

  const orientationOptions: { value: Orientation; label: string }[] = [
    { value: 'PORTRAIT', label: 'Portrait' },
    { value: 'LANDSCAPE', label: 'Landscape' },
  ];

  return (
    <div className="space-y-5">
      {/* Undo/Redo bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <HiOutlineArrowUturnLeft className="w-3.5 h-3.5" />
          Undo
        </button>
        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Redo (Ctrl+Shift+Z)"
        >
          <HiOutlineArrowUturnRight className="w-3.5 h-3.5" />
          Redo
        </button>
        <div className="flex-1" />
        <button
          onClick={resetLayout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
          title="Reset layout"
        >
          <HiOutlineArrowPath className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {/* Paper Size */}
      <section>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <HiOutlineDocumentText className="w-3.5 h-3.5" />
          Paper Size
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {PAPER_SIZES.map((ps) => (
            <button
              key={ps.id}
              onClick={() => setPaperSize(ps)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                paperSize.id === ps.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div>{ps.name}</div>
              <div className={`text-xs mt-0.5 ${paperSize.id === ps.id ? 'text-blue-200' : 'text-gray-400'}`}>
                {ps.description}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Orientation */}
      <section>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
          Orientation
        </h4>
        <div className="flex gap-2">
          {orientationOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setOrientation(opt.value)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                orientation === opt.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Layout */}
      <section>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
          Layout
        </h4>
        <div className="flex gap-2">
          {layoutOptions.map((opt) => (
            <button
              key={opt.type}
              onClick={() => setLayoutType(opt.type)}
              className={`flex-1 flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                layoutType === opt.type
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <opt.icon className="w-4 h-4" />
              <span className="text-xs">{opt.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Margins */}
      <section>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
          Margins (mm)
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Top/Bottom</label>
            <input
              type="number"
              value={marginTop}
              min={0}
              max={50}
              step={1}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMargins({ top: val, bottom: val });
              }}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Left/Right</label>
            <input
              type="number"
              value={marginLeft}
              min={0}
              max={50}
              step={1}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMargins({ left: val, right: val });
              }}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none"
            />
          </div>
        </div>
      </section>

      {/* Spacing */}
      <section>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
          Spacing Between (mm)
        </h4>
        <input
          type="range"
          value={spacingBetween}
          min={0}
          max={30}
          step={1}
          onChange={(e) => setSpacing(Number(e.target.value))}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0 mm</span>
          <span className="font-medium text-gray-600">{spacingBetween} mm</span>
          <span>30 mm</span>
        </div>
      </section>

      {/* Copies */}
      <section>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
          Copies
        </h4>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCopies(copies - 1)}
            disabled={copies <= 1}
            className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            −
          </button>
          <span className="text-lg font-semibold text-gray-800 w-8 text-center">{copies}</span>
          <button
            onClick={() => setCopies(copies + 1)}
            className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            +
          </button>
        </div>
      </section>
    </div>
  );
}
