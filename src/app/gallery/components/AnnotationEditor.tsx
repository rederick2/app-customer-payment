'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Pencil, ArrowUpRight, Circle, Square, Type, Trash2,
  RotateCcw, Minus, MousePointer2
} from 'lucide-react';

type Tool = 'pen' | 'arrow' | 'circle' | 'rect' | 'text' | 'line' | 'eraser' | 'select';

interface Point { x: number; y: number }
interface DrawItem {
  tool: Tool;
  color: string;
  size: number;
  points?: Point[];
  start?: Point;
  end?: Point;
  text?: string;
}

interface AnnotationEditorProps {
  imageUrl: string;
  onExport: (blob: Blob) => void;
  className?: string;
}

const COLORS = ['#FFFF00', '#FF3B30', '#34C759', '#007AFF', '#FF9500', '#FFFFFF', '#000000'];

export default function AnnotationEditor({ imageUrl, onExport, className }: AnnotationEditorProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = React.useState<Tool>('pen');
  const [color, setColor] = React.useState('#FF3B30');
  const [size, setSize] = React.useState(5);
  const [drawing, setDrawing] = React.useState(false);
  const [items, setItems] = React.useState<DrawItem[]>([]);
  const [current, setCurrent] = React.useState<DrawItem | null>(null);
  const [draggingIdx, setDraggingIdx] = React.useState<number | null>(null);
  const [dragOffset, setDragOffset] = React.useState<Point | null>(null);
  const [dimensions, setDimensions] = React.useState({ width: 1080, height: 1440 });
  const [scaleFactor, setScaleFactor] = React.useState(1);
  const [image, setImage] = React.useState<HTMLImageElement | null>(null);
  const [textInput, setTextInput] = React.useState('');
  const [textPos, setTextPos] = React.useState<Point | null>(null);
  const [showTextBox, setShowTextBox] = React.useState(false);
  const textRef = React.useRef<HTMLInputElement>(null);

  // Load image
  React.useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setScaleFactor(Math.max(img.naturalWidth, img.naturalHeight) / 1000);
    };
  }, [imageUrl]);

  // Redraw canvas
  const redraw = React.useCallback((extra?: DrawItem) => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const allItems = extra ? [...items, extra] : items;
    for (const item of allItems) drawItem(ctx, item);
  }, [image, items]);

  React.useEffect(() => { redraw(); }, [redraw]);

  function drawItem(ctx: CanvasRenderingContext2D, item: DrawItem) {
    const scaledSize = item.size * scaleFactor;
    ctx.strokeStyle = item.color;
    ctx.fillStyle = item.color;
    ctx.lineWidth = scaledSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (item.tool) {
      case 'pen':
      case 'eraser': {
        if (!item.points || item.points.length < 2) return;
        if (item.tool === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.lineWidth = item.size * 6;
        }
        ctx.beginPath();
        ctx.moveTo(item.points[0].x, item.points[0].y);
        item.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
        break;
      }
      case 'line': {
        if (!item.start || !item.end) return;
        ctx.beginPath();
        ctx.moveTo(item.start.x, item.start.y);
        ctx.lineTo(item.end.x, item.end.y);
        ctx.stroke();
        break;
      }
      case 'arrow': {
        if (!item.start || !item.end) return;
        drawArrow(ctx, item.start, item.end, scaledSize);
        break;
      }
      case 'circle': {
        if (!item.start || !item.end) return;
        const rx = Math.abs(item.end.x - item.start.x) / 2;
        const ry = Math.abs(item.end.y - item.start.y) / 2;
        const cx = Math.min(item.start.x, item.end.x) + rx;
        const cy = Math.min(item.start.y, item.end.y) + ry;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case 'rect': {
        if (!item.start || !item.end) return;
        ctx.beginPath();
        ctx.strokeRect(
          item.start.x, item.start.y,
          item.end.x - item.start.x, item.end.y - item.start.y
        );
        break;
      }
      case 'text': {
        if (!item.start || !item.text) return;
        ctx.font = `bold ${scaledSize * 8}px Arial`;
        ctx.fillStyle = item.color;
        ctx.fillText(item.text, item.start.x, item.start.y);
        break;
      }
    }
  }

  function drawArrow(ctx: CanvasRenderingContext2D, from: Point, to: Point, scaledSize: number) {
    const headLen = scaledSize * 8;
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 6), to.y - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 6), to.y - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  function getPos(e: React.MouseEvent | React.TouchEvent): Point {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function getHitItem(pos: Point): number | null {
    // Check backwards from top-most items
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (item.tool === 'text' && item.start) {
        // Estimate text area
        const fontSize = item.size * scaleFactor * 8;
        const width = (item.text?.length || 0) * (fontSize * 0.6);
        const height = fontSize;
        if (pos.x >= item.start.x && pos.x <= item.start.x + width &&
            pos.y >= item.start.y - height && pos.y <= item.start.y) {
          return i;
        }
      } else if (item.start && item.end) {
        // Simple bounding box for shapes
        const buffer = scaleFactor * 20;
        const minX = Math.min(item.start.x, item.end.x) - buffer;
        const maxX = Math.max(item.start.x, item.end.x) + buffer;
        const minY = Math.min(item.start.y, item.end.y) - buffer;
        const maxY = Math.max(item.start.y, item.end.y) + buffer;
        if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY) {
          return i;
        }
      }
    }
    return null;
  }

  const onStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getPos(e);

    if (activeTool === 'select') {
      const idx = getHitItem(pos);
      if (idx !== null) {
        setDraggingIdx(idx);
        const item = items[idx];
        if (item.start) {
          setDragOffset({ x: pos.x - item.start.x, y: pos.y - item.start.y });
        }
      }
      return;
    }

    if (activeTool === 'text') {
      setTextPos(pos);
      setShowTextBox(true);
      setTextInput('');
      setTimeout(() => textRef.current?.focus(), 50);
      return;
    }
    setDrawing(true);
    const item: DrawItem = { tool: activeTool, color, size };
    if (activeTool === 'pen' || activeTool === 'eraser') item.points = [pos];
    else { item.start = pos; item.end = pos; }
    setCurrent(item);
  };

  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getPos(e);

    if (activeTool === 'select' && draggingIdx !== null && dragOffset) {
      const idx = draggingIdx;
      setItems(prev => {
        const next = [...prev];
        const item = { ...next[idx] };
        if (item.start) {
          const dx = pos.x - (item.start.x + dragOffset.x);
          const dy = pos.y - (item.start.y + dragOffset.y);
          item.start = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
          if (item.end) {
            item.end = { x: item.end.x + dx, y: item.end.y + dy };
          }
          if (item.points) {
            item.points = item.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
          }
        }
        next[idx] = item;
        return next;
      });
      return;
    }

    if (!drawing || !current) return;
    let updated: DrawItem;
    if (activeTool === 'pen' || activeTool === 'eraser') {
      updated = { ...current, points: [...(current.points || []), pos] };
    } else {
      updated = { ...current, end: pos };
    }
    setCurrent(updated);
    redraw(updated);
  };

  const onEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDraggingIdx(null);
    setDragOffset(null);
    if (!drawing || !current) return;
    setDrawing(false);
    setItems(prev => [...prev, current]);
    setCurrent(null);
  };

  const addText = () => {
    if (!textPos || !textInput.trim()) { setShowTextBox(false); return; }
    const item: DrawItem = { tool: 'text', color, size, start: textPos, text: textInput };
    setItems(prev => [...prev, item]);
    setShowTextBox(false);
    setTextInput('');
    setTextPos(null);
  };

  const undo = () => setItems(prev => prev.slice(0, -1));
  const clear = () => setItems([]);

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(blob => { if (blob) onExport(blob); }, 'image/jpeg', 0.92);
  };

  React.useEffect(() => { if (items.length >= 0) redraw(); }, [items, redraw]);

  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: 'select', icon: <MousePointer2 className="h-4 w-4" />, label: 'Move' },
    { id: 'pen', icon: <Pencil className="h-4 w-4" />, label: 'Draw' },
    { id: 'arrow', icon: <ArrowUpRight className="h-4 w-4" />, label: 'Arrow' },
    { id: 'line', icon: <Minus className="h-4 w-4" />, label: 'Line' },
    { id: 'circle', icon: <Circle className="h-4 w-4" />, label: 'Circle' },
    { id: 'rect', icon: <Square className="h-4 w-4" />, label: 'Box' },
    { id: 'text', icon: <Type className="h-4 w-4" />, label: 'Text' },
  ];

  return (
    <div className={cn('relative flex flex-col sm:flex-row bg-black select-none', className)}>
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-2 min-h-[300px]">
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="touch-none block max-w-full max-h-[60vh] h-auto w-auto cursor-crosshair shadow-2xl"
          onMouseDown={onStart}
          onMouseMove={onMove}
          onMouseUp={onEnd}
          onTouchStart={onStart}
          onTouchMove={onMove}
          onTouchEnd={onEnd}
        />
      </div>

      {/* Text input overlay */}
      {showTextBox && textPos && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
          <div className="bg-background rounded-xl p-4 flex flex-col gap-3 w-72 shadow-2xl">
            <input
              ref={textRef}
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addText(); if (e.key === 'Escape') setShowTextBox(false); }}
              placeholder="Type text..."
              className="border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary"
              style={{ color, fontWeight: 'bold' }}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowTextBox(false)} className="text-sm text-muted-foreground px-3 py-1.5">Cancel</button>
              <button onClick={addText} className="text-sm bg-primary text-primary-foreground rounded-lg px-3 py-1.5 font-bold">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Adaptive Toolbar */}
      <div className="flex flex-row sm:flex-col items-center gap-4 sm:gap-4 py-4 px-6 sm:py-4 sm:px-2 bg-[#1A1A1A] backdrop-blur-md flex-shrink-0 z-10 border-t sm:border-t-0 sm:border-l border-white/10 overflow-x-auto no-scrollbar min-h-[72px]">
        {/* Undo/Clear Group */}
        <div className="flex flex-row sm:flex-col items-center gap-4 sm:gap-2 pr-6 sm:pr-0 border-r sm:border-r-0 sm:border-b border-white/10 shrink-0">
          <button
            onClick={undo}
            className="h-9 w-9 flex items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors"
            title="Undo"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={clear}
            className="h-9 w-9 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-500/20 transition-colors"
            title="Clear all"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Color Dots */}
        <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 px-1">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                'h-6 w-6 rounded-full border-2 transition-all shrink-0',
                color === c ? 'border-white scale-125' : 'border-transparent'
              )}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>

        <div className="hidden sm:block w-6 h-px bg-white/20 my-1" />

        {/* Size selection */}
        <div className="flex flex-row sm:flex-col items-center gap-1 sm:gap-1 px-1 border-l sm:border-l-0 border-white/10 pl-4 sm:pl-0">
          {[2, 5, 10].map(s => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className="h-8 w-8 flex items-center justify-center group shrink-0"
              title={`Size: ${s === 2 ? 'Thin' : s === 5 ? 'Medium' : 'Thick'}`}
            >
              <div className={cn(
                'rounded-full bg-white transition-all',
                s === 2 ? 'h-1.5 w-1.5' : s === 5 ? 'h-3 w-3' : 'h-4.5 w-4.5',
                size === s ? 'ring-2 ring-primary ring-offset-2 ring-offset-black scale-110' : 'opacity-40 group-hover:opacity-100'
              )} />
            </button>
          ))}
        </div>

        <div className="hidden sm:block w-6 h-px bg-white/20 my-1" />

        {/* Tools */}
        <div className="flex flex-row sm:flex-col items-center gap-2 px-1 border-l sm:border-l-0 border-white/10 pl-4 sm:pl-0">
          {tools.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              title={t.label}
              className={cn(
                'h-9 w-9 flex items-center justify-center rounded-xl transition-colors shrink-0',
                activeTool === t.id ? 'bg-primary text-primary-foreground' : 'text-white hover:bg-white/20'
              )}
            >
              {t.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Export trigger (hidden, parent calls exportImage imperatively) */}
      <button
        id="annotation-export-btn"
        onClick={exportImage}
        className="hidden"
      />
    </div>
  );
}
