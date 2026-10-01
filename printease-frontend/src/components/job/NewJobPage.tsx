import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlinePrinter,
  HiOutlineDocumentDuplicate,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineDocumentText,
  HiOutlineArrowsUpDown,
  HiOutlineArrowsRightLeft,
  HiOutlineCursorArrowRays,
} from 'react-icons/hi2';
import { DocumentUpload } from '../upload/DocumentUpload';
import { PaperCanvas } from '../canvas/PaperCanvas';
import { PrintPreviewModal } from './PrintPreviewModal';
import { useEditorStore, PAPER_SIZES } from '../../stores/editorStore';
import { jobApi } from '../../services/api';
import { v4 as uuidv4 } from 'uuid';
import type { PrintJob, PrintJobRequest, LayoutType, Orientation } from '../../types';

export function NewJobPage() {
  const store = useEditorStore();
  const [submitting, setSubmitting] = useState(false);
  const [previewModalJob, setPreviewModalJob] = useState<PrintJob | null>(null);

  const hasImages = store.frontImage !== null || store.backImage !== null;

  const layoutOptions: { type: LayoutType; label: string; icon: typeof HiOutlineArrowsUpDown }[] = [
    { type: 'VERTICAL', label: 'Vertical', icon: HiOutlineArrowsUpDown },
    { type: 'HORIZONTAL', label: 'Horizontal', icon: HiOutlineArrowsRightLeft },
    { type: 'FREE', label: 'Free', icon: HiOutlineCursorArrowRays },
  ];

  const orientationOptions: { value: Orientation; label: string }[] = [
    { value: 'PORTRAIT', label: 'Portrait' },
    { value: 'LANDSCAPE', label: 'Landscape' },
  ];

  const buildJobRequest = (draft: boolean): PrintJobRequest => ({
    paperSize: store.paperSize.id,
    orientation: store.orientation,
    copies: store.copies,
    layoutType: store.layoutType,
    layoutConfig: JSON.stringify({
      images: store.placements,
      marginTop: store.marginTop,
      marginBottom: store.marginBottom,
      marginLeft: store.marginLeft,
      marginRight: store.marginRight,
      spacingBetween: store.spacingBetween,
    }),
    frontImageId: store.frontImage?.id,
    backImageId: store.backImage?.id,
    editConfigFront: JSON.stringify(store.frontEditConfig),
    editConfigBack: JSON.stringify(store.backEditConfig),
    idempotencyKey: uuidv4(),
    draft,
  });

  const handleSaveDraft = async () => {
    if (!hasImages) {
      toast.error('Upload at least one image before saving draft.');
      return;
    }
    setSubmitting(true);
    try {
      const job = await jobApi.create(buildJobRequest(true));
      toast.success(`Draft saved: #${job.id.substring(0, 8)}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save draft');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreviewAndPrint = async () => {
    if (!hasImages) {
      toast.error('Upload at least one image before previewing sheet.');
      return;
    }
    setSubmitting(true);
    try {
      const job = await jobApi.create(buildJobRequest(false));
      setPreviewModalJob(job);
    } catch (err: any) {
      toast.error(err.message || 'Failed to prepare print sheet');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 h-full w-full flex flex-col min-w-0 min-h-0 overflow-hidden">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 shadow-2xs z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-xs">
            <span className="text-white font-bold text-sm tracking-wide">PE</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-gray-900 leading-tight">PrintEase</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">Studio</span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium">Document & ID Card Print Studio</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={store.resetAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Clear all images and settings"
          >
            <span>Reset All</span>
          </button>

          <button
            onClick={handleSaveDraft}
            disabled={!hasImages || submitting}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <HiOutlineDocumentDuplicate className="w-4 h-4 text-gray-500" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={handlePreviewAndPrint}
            disabled={!hasImages || submitting}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <HiOutlinePrinter className="w-4 h-4" />
            <span>{submitting ? 'Preparing...' : 'Preview & Print Sheet'}</span>
          </button>
        </div>
      </header>

      {/* Main Studio Workspace */}
      <div className="flex-1 flex min-w-0 min-h-0 overflow-hidden relative">
        {/* Left Sidebar - Uploads & Layout Controls */}
        <div className="w-[360px] lg:w-[380px] bg-white border-r border-gray-200 flex flex-col shrink-0 h-full overflow-hidden shadow-xs z-10">
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Upload Zone */}
            <DocumentUpload />

            {/* Paper Size & Orientation Setup */}
            <div className="border-t border-gray-100 pt-4 space-y-3.5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <HiOutlineDocumentText className="w-4 h-4 text-gray-400" />
                Paper & Layout Setup
              </h3>

              {/* Paper Format */}
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Paper Format</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PAPER_SIZES.map((ps) => {
                    const isSelected = store.paperSize.id === ps.id;
                    return (
                      <button
                        key={ps.id}
                        type="button"
                        onClick={() => store.setPaperSize(ps)}
                        className={`px-2.5 py-1.5 rounded-lg text-left text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold shadow-2xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{ps.name}</span>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{ps.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Orientation */}
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Orientation</label>
                <div className="flex gap-1.5">
                  {orientationOptions.map((opt) => {
                    const isSelected = store.orientation === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => store.setOrientation(opt.value)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold shadow-2xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Layout Arrangement Presets */}
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Layout Preset</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {layoutOptions.map((opt) => {
                    const isSelected = store.layoutType === opt.type;
                    return (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => store.setLayoutType(opt.type)}
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs border transition-all ${
                          isSelected
                            ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold shadow-2xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <opt.icon className="w-4 h-4 mb-0.5" />
                        <span className="text-[11px]">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Print Margins & Spacing */}
            <div className="border-t border-gray-100 pt-4 space-y-3.5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <HiOutlineAdjustmentsHorizontal className="w-4 h-4 text-gray-400" />
                Margins & Copies
              </h3>

              {/* Copies */}
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Number of Copies</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => store.setCopies(Math.max(1, store.copies - 1))}
                    disabled={store.copies <= 1}
                    className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 disabled:opacity-35 transition-colors font-bold text-sm"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={store.copies}
                    onChange={(e) => store.setCopies(parseInt(e.target.value) || 1)}
                    className="w-14 h-8 text-center border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() => store.setCopies(store.copies + 1)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors font-bold text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Margins */}
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Paper Margins (mm)</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['top', 'bottom', 'left', 'right'] as const).map((dir) => (
                    <div key={dir} className="flex items-center justify-between bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                      <span className="text-[11px] text-gray-500 capitalize">{dir}</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={store[`margin${dir.charAt(0).toUpperCase() + dir.slice(1)}` as keyof typeof store] as number}
                          onChange={(e) => store.setMargins({ [dir]: parseFloat(e.target.value) || 0 })}
                          className="w-10 h-6 text-center border border-gray-300 bg-white rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-[10px] text-gray-400">mm</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spacing Between Images */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <label className="text-[11px] font-medium text-gray-500">Spacing Between Documents</label>
                  <span className="text-xs font-semibold text-gray-700">{store.spacingBetween} mm</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={1}
                  value={store.spacingBetween}
                  onChange={(e) => store.setSpacing(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                  <span>0 mm</span>
                  <span>50 mm</span>
                </div>
              </div>
            </div>

            {/* Quick Sheet Summary */}
            {hasImages && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sheet Summary</div>
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Paper:</span>
                    <span className="font-semibold text-slate-800">{store.paperSize.name} ({store.orientation})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Layout:</span>
                    <span className="font-semibold text-slate-800 capitalize">{store.layoutType.toLowerCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Items Placed:</span>
                    <span className="font-semibold text-slate-800">{store.placements.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Copies:</span>
                    <span className="font-semibold text-slate-800">{store.copies}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Canvas Area */}
        <div className="flex-1 h-full min-w-0 flex flex-col overflow-hidden bg-slate-100">
          <PaperCanvas />
        </div>
      </div>

      {/* Print Preview & Dispatch Modal */}
      <PrintPreviewModal
        job={previewModalJob}
        isOpen={!!previewModalJob}
        onClose={() => setPreviewModalJob(null)}
      />
    </div>
  );
}
