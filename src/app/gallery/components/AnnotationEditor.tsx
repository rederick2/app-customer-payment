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
  const [color, setColor] = React.useState('#FFFF00');
  const [size] = React.useState(3);
  const [drawing, setDrawing] = React.useState(false);
  const [items, setItems] = React.useState<DrawItem[]>([]);
  const [current, setCurrent] = React.useState<DrawItem | null>(null);
  const [draggingIdx, setDraggingIdx] = React.useState<number | null>(null);
  const [dragOffset, setDragOffset] = React.useState<Point | null>(null);
  const [dimensions, setDimensions] = React.useState({ width: 1080, height: 1440 });
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
    ctx.strokeStyle = item.color;
    ctx.fillStyle = item.color;
    ctx.lineWidth = item.size;
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
        drawArrow(ctx, item.start, item.end, item.size);
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
        ctx.font = `bold ${item.size * 8}px Arial`;
        ctx.fillStyle = item.color;
        ctx.fillText(item.text, item.start.x, item.start.y);
        break;
      }
    }
  }

  function drawArrow(ctx: CanvasRenderingContext2D, from: Point, to: Point, size: number) {
    const headLen = size * 8;
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
        const fontSize = item.size * 8;
        const width = (item.text?.length || 0) * (fontSize * 0.6);
        const height = fontSize;
        if (pos.x >= item.start.x && pos.x <= item.start.x + width &&
            pos.y >= item.start.y - height && pos.y <= item.start.y) {
          return i;
        }
      } else if (item.start && item.end) {
        // Simple bounding box for shapes
        const minX = Math.min(item.start.x, item.end.x) - 10;
        const maxX = Math.max(item.start.x, item.end.x) + 10;
        const minY = Math.min(item.start.y, item.end.y) - 10;
        const maxY = Math.max(item.start.y, item.end.y) + 10;
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
    <div className={cn('relative flex bg-black select-none overflow-hidden', className)}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="touch-none flex-1 object-contain max-h-[60vh] cursor-crosshair min-w-0"
        style={{ display: 'block' }}
        onMouseDown={onStart}
        onMouseMove={onMove}
        onMouseUp={onEnd}
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
      />

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

      {/* Right toolbar */}
      <div className="flex flex-col items-center gap-2 py-4 px-2 bg-black/60 backdrop-blur-sm flex-shrink-0 z-10 border-l border-white/10">
        {/* Undo */}
        <button
          onClick={undo}
          className="h-9 w-9 flex items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors"
          title="Undo"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        {/* Clear */}
        <button
          onClick={clear}
          className="text-[10px] text-white font-bold hover:text-red-400 transition-colors mb-2"
          title="Clear all"
        >
          Clear
        </button>

        {/* Color dots */}
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={cn(
              'h-6 w-6 rounded-full border-2 transition-all',
              color === c ? 'border-white scale-125' : 'border-transparent'
            )}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}

        <div className="w-6 h-px bg-white/20 my-2" />

        {/* Tools */}
        {tools.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTool(t.id)}
            title={t.label}
            className={cn(
              'h-9 w-9 flex items-center justify-center rounded-xl transition-colors',
              activeTool === t.id ? 'bg-primary text-primary-foreground' : 'text-white hover:bg-white/20'
            )}
          >
            {t.icon}
          </button>
        ))}

        <div className="w-6 h-px bg-white/20 my-2" />

        {/* Trash */}
        <button
          onClick={clear}
          className="h-9 w-9 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-500/20 transition-colors"
          title="Clear"
        >
          <Trash2 className="h-4 w-4" />
        </button>
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
