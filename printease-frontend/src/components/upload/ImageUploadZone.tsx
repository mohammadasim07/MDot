import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  HiOutlineCloudArrowUp,
  HiOutlinePhoto,
  HiOutlineTrash,
  HiOutlineArrowPath,
} from 'react-icons/hi2';
import type { ImageSide, DocumentImage } from '../../types';

interface ImageUploadZoneProps {
  side: ImageSide;
  image: DocumentImage | null;
  previewUrl: string | null;
  onUpload: (file: File, side: ImageSide) => Promise<void>;
  onRemove: () => void;
  disabled?: boolean;
}

export function ImageUploadZone({
  side,
  image,
  previewUrl,
  onUpload,
  onRemove,
  disabled = false,
}: ImageUploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setUploading(true);
      setError(null);
      try {
        await onUpload(acceptedFiles[0], side);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [side, onUpload]
  );

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
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: disabled || uploading,
  });

  const sideLabel = side === 'FRONT' ? 'Front Side' : 'Back Side';
  const sideColor = side === 'FRONT' ? 'blue' : 'indigo';

  if (image && previewUrl) {
    return (
      <div className="relative group rounded-xl border-2 border-gray-200 bg-white overflow-hidden">
        {/* Label */}
        <div className={`absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md text-xs font-semibold bg-${sideColor}-600 text-white shadow-sm`}>
          {sideLabel}
        </div>

        {/* Image preview */}
        <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center p-3">
          <img
            src={previewUrl}
            alt={`${sideLabel} preview`}
            className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
          />
        </div>

        {/* Image info bar */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <HiOutlinePhoto className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-xs text-gray-600 truncate">{image.originalFilename}</span>
            <span className="text-xs text-gray-400">
              {image.width}×{image.height}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Replace button */}
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <button
                type="button"
                className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="Replace image"
              >
                <HiOutlineArrowPath className="w-4 h-4" />
              </button>
            </div>

            {/* Remove button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Remove image"
            >
              <HiOutlineTrash className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
        isDragActive
          ? 'border-blue-400 bg-blue-50 scale-[1.02]'
          : 'border-gray-300 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/30'
      } ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center justify-center p-8 gap-3">
        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center ${
            isDragActive ? 'bg-blue-100' : 'bg-gray-100'
          }`}
        >
          {uploading ? (
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <HiOutlineCloudArrowUp
              className={`w-7 h-7 ${isDragActive ? 'text-blue-600' : 'text-gray-400'}`}
            />
          )}
        </div>

        {/* Label */}
        <div className="text-center">
          <p className={`text-sm font-semibold mb-0.5 ${isDragActive ? 'text-blue-700' : 'text-gray-700'}`}>
            {uploading ? 'Uploading...' : isDragActive ? 'Drop image here' : `Upload ${sideLabel}`}
          </p>
          <p className="text-xs text-gray-400">
            Drag & drop or click to browse
          </p>
          <p className="text-xs text-gray-300 mt-1">
            JPG, PNG, BMP, TIFF, WebP — up to 50 MB
          </p>
        </div>

        {/* Side badge */}
        <span
          className={`px-2.5 py-1 rounded-md text-xs font-semibold bg-${sideColor}-100 text-${sideColor}-700`}
        >
          {sideLabel}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}
    </div>
  );
}
