import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlinePrinter,
  HiOutlineXMark,
  HiOutlineArrowDownTray,
  HiOutlineSparkles,
  HiOutlineDocumentText,
} from 'react-icons/hi2';
import { jobApi } from '../../services/api';
import type { PrintJob } from '../../types';

interface PrintPreviewModalProps {
  job: PrintJob | null;
  isOpen: boolean;
  onClose: () => void;
  onJobDispatched?: () => void;
}

export function PrintPreviewModal({
  job,
  isOpen,
  onClose,
  onJobDispatched,
}: PrintPreviewModalProps) {
  const [copies, setCopies] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !job) return;

    setCopies(job.copies || 1);
    setImageUrl(jobApi.getCompositeUrl(job.id));

    // Ensure composite is rendered
    setLoading(true);
    jobApi.renderComposite(job.id)
      .then(() => {
        setImageUrl(`${jobApi.getCompositeUrl(job.id)}?t=${Date.now()}`);
      })
      .catch((err) => {
        console.warn('Failed pre-rendering composite:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, job]);

  if (!isOpen || !job) return null;

  const handlePrint = async () => {
    setPrinting(true);
    try {
      // 1. Try dispatching via backend execution
      await jobApi.print(job.id, { copies });
      toast.success('Print dispatched successfully!');
      if (onJobDispatched) onJobDispatched();
      onClose();
    } catch {
      // 2. Fallback to direct browser print dialog
      handleBrowserPrint();
    } finally {
      setPrinting(false);
    }
  };

  const handleBrowserPrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Could not open print window. Please allow popups.');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PrintEase Sheet #${job.id.substring(0, 8)}</title>
          <style>
            @page { margin: 0; size: auto; }
            body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; background: #fff; }
            img { width: 100%; height: auto; display: block; }
          </style>
        </head>
        <body>
          <img src="${jobApi.getCompositeUrl(job.id)}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = jobApi.getCompositeUrl(job.id);
    link.download = `PrintEase_${job.paperSize}_${job.id.substring(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('300 DPI Sheet downloaded!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
              <HiOutlinePrinter className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">
                Print Sheet Preview (300 DPI)
              </h3>
              <p className="text-xs text-gray-500">
                Job #{job.id.substring(0, 8)} · {job.paperSize} · {job.orientation}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* High-res Image Preview */}
          <div className="flex-1 bg-slate-900/95 flex items-center justify-center p-6 relative overflow-hidden select-none min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center gap-3 text-white">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-400">Rendering 300 DPI composite sheet...</span>
              </div>
            ) : (
              <div className="max-w-full max-h-full flex items-center justify-center shadow-2xl rounded-sm overflow-hidden border border-slate-700">
                <img
                  src={imageUrl}
                  alt="Print Preview"
                  className="max-h-[60vh] max-w-[50vw] object-contain block bg-white"
                  onError={() => {
                    toast.error('Composite sheet preview is still generating, please wait a moment.');
                  }}
                />
              </div>
            )}
          </div>

          {/* Right Sheet Specifications */}
          <div className="w-full md:w-72 bg-white border-t md:border-t-0 md:border-l border-gray-200 p-5 overflow-y-auto space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Copies */}
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">
                  Number of Copies
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCopies(Math.max(1, copies - 1))}
                    className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors"
                  >
                    −
                  </button>
                  <span className="text-base font-semibold text-gray-800 w-8 text-center">{copies}</span>
                  <button
                    onClick={() => setCopies(copies + 1)}
                    className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Sheet Info */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/70 space-y-2 text-xs text-gray-600">
                <div className="font-semibold text-gray-800 flex items-center gap-1.5 pb-1 border-b border-gray-200/50">
                  <HiOutlineSparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Print Specifications</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Resolution:</span>
                  <span className="font-semibold text-gray-800">300 True DPI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Paper Format:</span>
                  <span className="font-medium">{job.paperSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Orientation:</span>
                  <span className="font-medium capitalize">{job.orientation.toLowerCase()}</span>
                </div>
              </div>

              {/* Quick tip */}
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-800">
                <p className="font-medium flex items-center gap-1 mb-1">
                  <HiOutlineDocumentText className="w-3.5 h-3.5 text-blue-600" />
                  Ready to Print
                </p>
                <p className="text-[11px] text-blue-700">
                  Click &apos;Print Sheet&apos; to send directly to your printer, or download the PNG to save.
                </p>
              </div>
            </div>

            {/* Print & Download buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handlePrint}
                disabled={printing || loading}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <HiOutlinePrinter className="w-4 h-4" />
                <span>{printing ? 'Printing...' : 'Print Sheet'}</span>
              </button>

              <button
                onClick={handleDownload}
                className="w-full py-2 px-3 text-xs font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs flex items-center justify-center gap-1.5"
              >
                <HiOutlineArrowDownTray className="w-4 h-4 text-gray-500" />
                <span>Download PNG (300 DPI)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
