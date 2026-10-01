import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import {
  HiOutlineCloudArrowUp,
  HiOutlineTrash,
  HiOutlineArrowPath,
  HiOutlinePhoto,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import { imageApi } from '../../services/api';
import { useEditorStore } from '../../stores/editorStore';
import { DocumentEnhanceModal } from './DocumentEnhanceModal';
import type { ImageSide, EditConfig } from '../../types';

interface UploadBoxProps {
  side: ImageSide;
  label: string;
}

export function UploadBox({ side, label }: UploadBoxProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showEnhance, setShowEnhance] = useState(false);

  const store = useEditorStore();
  const image = side === 'FRONT' ? store.frontImage : store.backImage;
  const previewUrl = side === 'FRONT' ? store.frontPreviewUrl : store.backPreviewUrl;
  const editConfig = side === 'FRONT' ? store.frontEditConfig : store.backEditConfig;
  const setImage = side === 'FRONT' ? store.setFrontImage : store.setBackImage;

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error(`Unsupported format: ${file.type}. Use JPG, PNG, BMP, TIFF, or WebP.`);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 50MB.');
      return;
    }

    setUploading(true);
    setProgress(20);

    try {
      // Create local preview first for instant feedback
      const localUrl = URL.createObjectURL(file);
      setProgress(40);

      // Upload to backend
      const uploaded = await imageApi.upload(file, side);
      setProgress(80);

      // Get the server URL for the uploaded image
      const serverUrl = imageApi.getFileUrl(uploaded.id);
      setImage(uploaded, serverUrl);

      // Revoke the local blob URL
      URL.revokeObjectURL(localUrl);
      setProgress(100);

      toast.success(`${label} uploaded successfully`);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [side, label, setImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/bmp': ['.bmp'],
      'image/tiff': ['.tiff', '.tif'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  const handleRemove = async () => {
    if (!image) return;
    try {
      await imageApi.delete(image.id);
      setImage(null);
      toast.success(`${label} removed`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove image');
    }
  };

  const handleReplace = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/bmp,image/tiff,image/webp';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) onDrop([file]);
    };
    input.click();
  };

  const handleApplyEnhance = (newConfig: EditConfig, processedDataUrl: string) => {
    if (side === 'FRONT') {
      store.updateFrontEdit(newConfig);
      store.setFrontImage(image, processedDataUrl);
    } else {
      store.updateBackEdit(newConfig);
      store.setBackImage(image, processedDataUrl);
    }
    toast.success(`${label} enhanced & updated!`);
  };

  const sideBadgeClass = side === 'FRONT'
    ? 'bg-blue-100 text-blue-800 border-blue-200'
    : 'bg-indigo-100 text-indigo-800 border-indigo-200';

  if (image && previewUrl) {
    return (
      <>
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs hover:shadow-sm transition-all overflow-hidden flex flex-col">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-100 bg-gray-50/80">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border ${sideBadgeClass}`}>
                {label}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowEnhance(true)}
                className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                title="Enhance, straighten, filter & crop"
              >
                <HiOutlineSparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Enhance</span>
              </button>

              <button
                type="button"
                onClick={handleReplace}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Replace image"
              >
                <HiOutlineArrowPath className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove image"
              >
                <HiOutlineTrash className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Preview Image */}
          <div
            onClick={() => setShowEnhance(true)}
            className="relative aspect-[16/10] bg-slate-900/5 flex items-center justify-center p-3 cursor-pointer group select-none"
            title="Click to enhance & crop"
          >
            <img
              src={previewUrl}
              alt={`${label} preview`}
              className="max-w-full max-h-full object-contain rounded-md shadow-xs transition-transform group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
              <span className="px-3 py-1.5 rounded-lg bg-white/95 text-xs font-bold text-gray-800 shadow-md flex items-center gap-1.5">
                <HiOutlineSparkles className="w-3.5 h-3.5 text-blue-600" /> Click to Edit & Crop
              </span>
            </div>
          </div>

          {/* Info Footer */}
          <div className="px-3.5 py-2 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between text-xs text-gray-500">
            <span className="truncate max-w-[60%] font-medium text-gray-600">{image.originalFilename}</span>
            <span className="text-gray-400 font-mono text-[11px]">{image.width} × {image.height}px</span>
          </div>
        </div>

        {/* Modal */}
        <DocumentEnhanceModal
          isOpen={showEnhance}
          onClose={() => setShowEnhance(false)}
          side={side}
          imageUrl={imageApi.getFileUrl(image.id)}
          initialConfig={editConfig}
          onApply={handleApplyEnhance}
        />
      </>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`
        bg-white rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200
        ${isDragActive
          ? 'border-blue-500 bg-blue-50/70 shadow-sm scale-[1.01]'
          : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/30'}
        ${uploading ? 'opacity-70 pointer-events-none' : ''}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center py-4 px-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-1.5 transition-colors ${
          isDragActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
        }`}>
          {uploading ? (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <HiOutlineCloudArrowUp className="w-5 h-5" />
          )}
        </div>

        <div className="flex items-center gap-2 mb-1">
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${sideBadgeClass}`}>
            {label}
          </span>
        </div>

        <p className="text-xs text-gray-600 font-medium text-center">
          {uploading ? 'Uploading image...' : isDragActive ? 'Drop your image here' : 'Drag & drop or click to browse'}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, BMP, TIFF, WebP (up to 50MB)</p>

        {uploading && (
          <div className="w-full mt-2.5 max-w-[180px]">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1 text-center">Uploading...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function DocumentUpload() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <HiOutlinePhoto className="w-4 h-4 text-gray-400" />
          Document Photos
        </h3>
        <span className="text-[11px] text-gray-400">Front & Back</span>
      </div>

      {/* Stacked vertically with compact padding so both cards fit comfortably */}
      <div className="flex flex-col gap-2.5">
        <UploadBox side="FRONT" label="Front Side" />
        <UploadBox side="BACK" label="Back Side" />
      </div>
    </div>
  );
}
