import { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage, Transformer, Group, Text } from 'react-konva';
import type Konva from 'konva';
import {
  HiOutlineMagnifyingGlassPlus,
  HiOutlineMagnifyingGlassMinus,
  HiOutlineArrowsPointingOut,
  HiOutlineArrowUturnLeft,
  HiOutlineArrowUturnRight,
  HiOutlineArrowPath,
  HiOutlineDocumentText,
} from 'react-icons/hi2';
import { useEditorStore } from '../../stores/editorStore';

/**
 * Convert mm dimensions to screen pixels given a canvas scale.
 */
function mmToPixels(mm: number, scale: number): number {
  return mm * scale;
}

export function PaperCanvas() {
  const {
    paperSize,
    orientation,
    placements,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    frontPreviewUrl,
    backPreviewUrl,
    frontImage,
    backImage,
    undoStack,
    redoStack,
    updatePlacement,
    pushUndo,
    undo,
    redo,
    resetLayout,
  } = useEditorStore();

  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportDim, setViewportDim] = useState({ width: 800, height: 600 });
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = 100% fit
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());

  // Paper dimensions in mm
  const isLandscape = orientation === 'LANDSCAPE';
  const pageWidthMm = isLandscape ? paperSize.heightMm : paperSize.widthMm;
  const pageHeightMm = isLandscape ? paperSize.widthMm : paperSize.heightMm;

  // Viewport resize observer
  useEffect(() => {
    if (!viewportRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 50 && height > 50) {
          setViewportDim({ width, height });
        }
      }
    });
    observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute fit scale so paper fits gracefully inside viewport with comfortable padding (min 48px padding)
  const availableW = Math.max(150, viewportDim.width - 64);
  const availableH = Math.max(150, viewportDim.height - 64);
  const fitScale = Math.min(availableW / pageWidthMm, availableH / pageHeightMm);

  // Active scale factoring in user zoom level
  const scale = fitScale * zoomLevel;
  const canvasWidth = Math.round(pageWidthMm * scale);
  const canvasHeight = Math.round(pageHeightMm * scale);

  // Load images
  useEffect(() => {
    const urls: { id: string; url: string }[] = [];
    if (frontImage && frontPreviewUrl) urls.push({ id: frontImage.id, url: frontPreviewUrl });
    if (backImage && backPreviewUrl) urls.push({ id: backImage.id, url: backPreviewUrl });

    urls.forEach(({ id, url }) => {
      if (loadedImages.has(id)) return;
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = () => {
        setLoadedImages((prev) => new Map(prev).set(id, img));
      };
    });
  }, [frontImage, backImage, frontPreviewUrl, backPreviewUrl, loadedImages]);

  // Attach transformer to selected node
  useEffect(() => {
    if (!transformerRef.current) return;
    const stage = transformerRef.current.getStage();
    if (!stage) return;

    if (selectedId) {
      const node = stage.findOne(`#${selectedId}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
        return;
      }
    }
    transformerRef.current.nodes([]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedId, placements]);

  const handleDragEnd = useCallback(
    (index: number, e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      const xMm = node.x() / scale;
      const yMm = node.y() / scale;
      pushUndo();
      updatePlacement(index, { x: xMm, y: yMm });
    },
    [scale, pushUndo, updatePlacement]
  );

  const handleTransformEnd = useCallback(
    (index: number, e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      node.scaleX(1);
      node.scaleY(1);

      const newWidthMm = (node.width() * scaleX) / scale;
      const newHeightMm = (node.height() * scaleY) / scale;

      pushUndo();
      updatePlacement(index, {
        x: node.x() / scale,
        y: node.y() / scale,
        width: newWidthMm,
        height: newHeightMm,
        rotation: node.rotation(),
      });
    },
    [scale, pushUndo, updatePlacement]
  );

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) {
        setSelectedId(null);
      }
    },
    []
  );

  // Margin lines in pixels
  const mLeft = mmToPixels(marginLeft, scale);
  const mRight = mmToPixels(marginRight, scale);
  const mTop = mmToPixels(marginTop, scale);
  const mBottom = mmToPixels(marginBottom, scale);

  return (
    <div className="flex-1 h-full w-full flex flex-col min-w-0 min-h-0 overflow-hidden bg-slate-100/90">
      {/* Canvas Top Bar */}
      <div className="h-12 px-5 bg-white border-b border-gray-200 flex items-center justify-between shrink-0 shadow-2xs z-10">
        {/* Undo/Redo & Reset */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <HiOutlineArrowUturnLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Undo</span>
          </button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            title="Redo (Ctrl+Shift+Z)"
          >
            <HiOutlineArrowUturnRight className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Redo</span>
          </button>
          <div className="h-4 w-px bg-gray-200 mx-1" />
          <button
            onClick={resetLayout}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            title="Reset to default arrangement"
          >
            <HiOutlineArrowPath className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        {/* Paper Dimensions Badge */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
            <HiOutlineDocumentText className="w-3.5 h-3.5 text-slate-500" />
            <span>{paperSize.name}</span>
            <span className="text-slate-300">·</span>
            <span className="capitalize">{orientation.toLowerCase()}</span>
            <span className="text-slate-300">·</span>
            <span className="font-mono text-[11px] text-slate-500">{pageWidthMm.toFixed(0)} × {pageHeightMm.toFixed(0)} mm</span>
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.4, Number((z - 0.15).toFixed(2))))}
            disabled={zoomLevel <= 0.4}
            className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
            title="Zoom out"
          >
            <HiOutlineMagnifyingGlassMinus className="w-4 h-4" />
          </button>

          <span className="text-xs font-medium text-gray-700 w-12 text-center select-none font-mono">
            {Math.round(zoomLevel * 100)}%
          </span>

          <button
            onClick={() => setZoomLevel((z) => Math.min(2.0, Number((z + 0.15).toFixed(2))))}
            disabled={zoomLevel >= 2.0}
            className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
            title="Zoom in"
          >
            <HiOutlineMagnifyingGlassPlus className="w-4 h-4" />
          </button>

          <button
            onClick={() => setZoomLevel(1)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors ml-1"
            title="Fit to view"
          >
            <HiOutlineArrowsPointingOut className="w-3.5 h-3.5" />
            <span>Fit</span>
          </button>
        </div>
      </div>

      {/* Main Viewport Container with comfortable padding and scrollability */}
      <div
        ref={viewportRef}
        className="flex-1 w-full h-full overflow-auto p-6 md:p-10 flex items-center justify-center min-h-0 select-none relative"
      >
        {/* Paper Sheet Representation */}
        <div
          className="bg-white shadow-2xl rounded-xs border border-slate-300/80 relative transition-transform duration-75 shrink-0"
          style={{ width: canvasWidth, height: canvasHeight }}
        >
          <Stage
            width={canvasWidth}
            height={canvasHeight}
            onClick={handleStageClick}
            className="cursor-default"
          >
            <Layer>
              {/* Paper Background */}
              <Rect
                x={0}
                y={0}
                width={canvasWidth}
                height={canvasHeight}
                fill="#ffffff"
              />

              {/* Printable Margin Guidelines (dashed) */}
              <Rect
                x={mLeft}
                y={mTop}
                width={Math.max(10, canvasWidth - mLeft - mRight)}
                height={Math.max(10, canvasHeight - mTop - mBottom)}
                stroke="#cbd5e1"
                strokeWidth={1}
                dash={[5, 4]}
              />

              {/* Images Placed on Canvas */}
              {placements.map((placement, index) => {
                const imageEl = loadedImages.get(placement.imageId);
                if (!imageEl) return null;

                const x = mmToPixels(placement.x, scale);
                const y = mmToPixels(placement.y, scale);
                const w = mmToPixels(placement.width, scale);
                const h = mmToPixels(placement.height, scale);
                const nodeId = `img-${placement.imageId}-${index}`;

                return (
                  <KonvaImage
                    key={nodeId}
                    id={nodeId}
                    image={imageEl}
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    rotation={placement.rotation}
                    draggable
                    onClick={() => setSelectedId(nodeId)}
                    onTap={() => setSelectedId(nodeId)}
                    onDragEnd={(e) => handleDragEnd(index, e)}
                    onTransformEnd={(e) => handleTransformEnd(index, e)}
                  />
                );
              })}

              {/* Empty State Prompt */}
              {placements.length === 0 && (
                <Group>
                  <Text
                    x={canvasWidth / 2 - 120}
                    y={canvasHeight / 2 - 25}
                    width={240}
                    text="Upload document photos from the left panel to arrange on this sheet"
                    fontSize={Math.max(11, Math.min(14, scale * 4))}
                    fill="#94a3b8"
                    align="center"
                    lineHeight={1.4}
                  />
                </Group>
              )}

              {/* Interactive Resize & Rotate Transformer */}
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 25 || newBox.height < 25) return oldBox;
                  return newBox;
                }}
                enabledAnchors={[
                  'top-left',
                  'top-right',
                  'bottom-left',
                  'bottom-right',
                  'middle-left',
                  'middle-right',
                  'top-center',
                  'bottom-center',
                ]}
                rotateEnabled={true}
                borderStroke="#2563eb"
                borderStrokeWidth={2}
                anchorFill="#ffffff"
                anchorStroke="#2563eb"
                anchorSize={8}
                anchorCornerRadius={2}
              />
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
}
