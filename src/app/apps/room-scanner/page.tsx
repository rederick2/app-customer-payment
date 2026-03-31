'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ScanLine, ArrowLeft, Download, CheckCircle2, AlertCircle,
  Loader2, RotateCcw, Pencil, FileImage, FileText as FilePdf,
  Save, X, Plus, Minus, Trash2, ArrowRight, Camera, MapPin, Upload
} from 'lucide-react';

type Phase = 'idle' | 'permission' | 'preview' | 'marking' | 'measuring' | 'processing' | 'complete' | 'error';
interface Pt { x: number; y: number }
interface RoomData { corners: Pt[]; walls: number[]; area: number }

const AR = 4 / 3; // camera container aspect ratio

/** Build room polygon from pixel directions + user-provided actual lengths.
 *  Pixel positions give wall ANGLES; lengths give actual distances in metres.
 *  This bypasses perspective distortion completely. */
function buildRoom(pixels: Pt[], lengths: number[]): RoomData {
  const n = pixels.length;
  const corners: Pt[] = [{ x: 0, y: 0 }];
  for (let i = 0; i < n; i++) {
    const ni = (i + 1) % n;
    const dx = (pixels[ni].x - pixels[i].x) * AR; // correct for 4:3 AR
    const dy = pixels[ni].y - pixels[i].y;
    const angle = Math.atan2(dy, dx);
    const prev = corners[corners.length - 1];
    corners.push({ x: prev.x + Math.cos(angle) * lengths[i], y: prev.y + Math.sin(angle) * lengths[i] });
  }
  const pts = corners.slice(0, n);
  // Shoelace area
  let area = 0;
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; area += pts[i].x * pts[j].y - pts[j].x * pts[i].y; }
  return { corners: pts, walls: lengths, area: Math.abs(area) / 2 };
}

/* ── SVG floor plan ─────────────────────────────────────────────── */
function FloorPlanSVG({ room, id }: { room: RoomData; id?: string }) {
  const W = 560, H = 440, PAD = 80;
  const xs = room.corners.map(p => p.x), ys = room.corners.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const sc = Math.min((W - PAD * 2) / ((maxX - minX) || 1), (H - PAD * 2) / ((maxY - minY) || 1));
  const toS = (p: Pt) => ({ x: PAD + (p.x - minX) * sc, y: PAD + (p.y - minY) * sc });
  const svgPts = room.corners.map(toS);
  const poly = svgPts.map(p => `${p.x},${p.y}`).join(' ');
  const cx = svgPts.reduce((s, p) => s + p.x, 0) / svgPts.length;
  const cy = svgPts.reduce((s, p) => s + p.y, 0) / svgPts.length;

  return (
    <svg id={id} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" width={W} height={H} style={{ fontFamily: 'Arial, sans-serif' }}>
      <rect width={W} height={H} fill="#f8f9fc" rx="10" />
      {Array.from({ length: 13 }).map((_, i) => Array.from({ length: 12 }).map((_, j) => (
        <circle key={`${i}-${j}`} cx={20 + i * 42} cy={20 + j * 36} r="1.5" fill="#e2e8f0" />
      )))}
      <polygon points={poly} fill="#eef2ff" />
      <polygon points={poly} fill="none" stroke="#312e81" strokeWidth="7" strokeLinejoin="round" />
      {svgPts.map((p, i) => {
        const next = svgPts[(i + 1) % svgPts.length];
        const mx = (p.x + next.x) / 2, my = (p.y + next.y) / 2;
        const dx = next.x - p.x, dy = next.y - p.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
        let nx = -dy / len, ny = dx / len;
        if ((mx + nx * 10 - cx) * nx + (my + ny * 10 - cy) * ny < 0) { nx = -nx; ny = -ny; }
        const OFFSET = 22, lx = mx + nx * OFFSET, ly = my + ny * OFFSET;
        const label = `${room.walls[i].toFixed(1)} m`, lw = label.length * 7 + 8;
        return (
          <g key={i}>
            <line x1={p.x + nx * 14} y1={p.y + ny * 14} x2={next.x + nx * 14} y2={next.y + ny * 14} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
            <line x1={p.x + nx * 10} y1={p.y + ny * 10} x2={p.x + nx * 18} y2={p.y + ny * 18} stroke="#94a3b8" strokeWidth="1.5" />
            <line x1={next.x + nx * 10} y1={next.y + ny * 10} x2={next.x + nx * 18} y2={next.y + ny * 18} stroke="#94a3b8" strokeWidth="1.5" />
            <rect x={lx - lw / 2} y={ly - 9} width={lw} height={18} rx="5" fill="#312e81" />
            <text x={lx} y={ly + 4} textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">{label}</text>
          </g>
        );
      })}
      {svgPts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="5" fill="#6366f1" stroke="white" strokeWidth="2" />)}
      <rect x={W - 115} y={10} width={105} height={42} rx="8" fill="#312e81" />
      <text x={W - 62} y={27} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.7)">ÁREA TOTAL</text>
      <text x={W - 62} y={45} textAnchor="middle" fontSize="13" fill="white" fontWeight="bold">{room.area.toFixed(1)} m²</text>
      <circle cx={W - 24} cy={H - 24} r="16" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
      <text x={W - 24} y={H - 30} textAnchor="middle" fontSize="8" fill="#312e81" fontWeight="bold">N</text>
      <polygon points={`${W - 24},${H - 24} ${W - 20},${H - 15} ${W - 24},${H - 18} ${W - 28},${H - 15}`} fill="#312e81" />
    </svg>
  );
}

/* ── Download helpers ───────────────────────────────────────────── */
async function downloadPng(id: string) {
  const el = document.getElementById(id) as SVGSVGElement | null; if (!el) return;
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(el)], { type: 'image/svg+xml;charset=utf-8' }));
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas'); c.width = el.width.baseVal.value * 2; c.height = el.height.baseVal.value * 2;
    const ctx = c.getContext('2d')!; ctx.scale(2, 2); ctx.drawImage(img, 0, 0); URL.revokeObjectURL(url);
    c.toBlob(b => { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `floor-plan-${Date.now()}.png`; a.click(); }, 'image/png');
  }; img.src = url;
}
function downloadPdf(id: string, room: RoomData) {
  const el = document.getElementById(id) as SVGSVGElement | null; if (!el) return;
  const w = window.open('', '_blank'); if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Floor Plan</title>
    <style>*{margin:0;padding:0}body{background:white;font-family:Arial,sans-serif;padding:24px}h1{font-size:18px;font-weight:bold;margin-bottom:4px}
    p{font-size:12px;color:#64748b;margin-bottom:16px}svg{width:100%;max-width:700px;display:block;margin:0 auto}
    .meta{margin-top:20px;font-size:12px}@media print{body{padding:12px}}</style></head>
    <body><h1>2D Floor Plan</h1><p>Room Scanner</p>${new XMLSerializer().serializeToString(el)}
    <div class="meta">Paredes: ${room.walls.map((v, i) => `P${i + 1}: ${v.toFixed(1)}m`).join(' · ')} · Área ≈ ${room.area.toFixed(1)} m²</div></body></html>`);
  w.document.close(); w.onload = () => { w.focus(); w.print(); };
}

/* ── Dimension editor ───────────────────────────────────────────── */
function DimensionEditor({ room, onChange }: { room: RoomData; onChange: (r: RoomData) => void }) {
  const [open, setOpen] = React.useState(false);
  const [drafts, setDrafts] = React.useState(room.walls.map(w => w.toFixed(1)));
  if (!open) return (
    <button onClick={() => setOpen(true)} className="flex items-center gap-2 text-sm text-indigo-300 hover:text-white transition-colors">
      <Pencil className="h-3.5 w-3.5" /> Editar medidas
    </button>
  );
  return (
    <div className="bg-white/10 border border-white/20 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Editar Longitudes</h3>
        <button onClick={() => setOpen(false)}><X className="h-4 w-4 text-white/50" /></button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {drafts.map((d, i) => (
          <div key={i}>
            <label className="text-xs text-white/60 block mb-1">Pared {i + 1} (m)</label>
            <div className="flex items-center gap-1">
              <button onClick={() => setDrafts(dr => { const c = [...dr]; c[i] = Math.max(0.1, parseFloat(c[i]) - 0.1).toFixed(1); return c; })} className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"><Minus className="h-3 w-3" /></button>
              <input type="number" step="0.1" min="0.1" value={d} onChange={e => setDrafts(dr => { const c = [...dr]; c[i] = e.target.value; return c; })} className="flex-1 bg-white/10 border border-white/20 rounded-lg px-1 py-1 text-center text-xs font-mono font-bold focus:outline-none focus:border-indigo-400 min-w-0" />
              <button onClick={() => setDrafts(dr => { const c = [...dr]; c[i] = (parseFloat(c[i]) + 0.1).toFixed(1); return c; })} className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"><Plus className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => {
        const newWalls = drafts.map(d => parseFloat(d) || 0.5);
        const newRoom = buildRoom(room.corners, newWalls);
        onChange({ ...newRoom, corners: room.corners });
        setOpen(false);
      }} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 font-semibold py-2.5 rounded-xl text-sm">
        <Save className="h-4 w-4" /> Aplicar
      </button>
    </div>
  );
}

/* ── Canvas draw ─────────────────────────────────────────────────── */
function drawPts(canvas: HTMLCanvasElement, points: Pt[]) {
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!points.length) return;
  const W = canvas.width, H = canvas.height;
  const c = (p: Pt) => ({ x: p.x * W, y: p.y * H });
  const cp = points.map(c);
  if (points.length >= 3) {
    ctx.beginPath(); ctx.moveTo(cp[0].x, cp[0].y); cp.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath(); ctx.fillStyle = 'rgba(99,102,241,0.18)'; ctx.fill();
  }
  ctx.beginPath(); ctx.moveTo(cp[0].x, cp[0].y); cp.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  if (points.length >= 3) ctx.closePath();
  ctx.strokeStyle = '#818cf8'; ctx.lineWidth = 2.5; ctx.setLineDash([]); ctx.stroke();
  cp.forEach((p, i) => {
    ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(p.x, p.y, i === 0 ? 12 : 10, 0, Math.PI * 2);
    ctx.fillStyle = i === 0 ? '#34d399' : '#6366f1'; ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'white'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = 'white'; ctx.font = `bold ${i === 0 ? 11 : 10}px Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`${i + 1}`, p.x, p.y);
  });
}

/* ── Main ────────────────────────────────────────────────────────── */
const SVG_ID = 'room-plan-svg';
const MIN_PTS = 3, MAX_PTS = 12;

export default function RoomScannerPage() {
  const [phase, setPhase] = React.useState<Phase>('idle');
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null);
  const [points, setPoints] = React.useState<Pt[]>([]);
  const [wallLengths, setWallLengths] = React.useState<string[]>([]);
  const [room, setRoom] = React.useState<RoomData | null>(null);
  const [showDl, setShowDl] = React.useState(false);
  const [zoom, setZoom] = React.useState(1);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const overlayRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const lastTap = React.useRef(0);

  const stopCam = React.useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  React.useEffect(() => () => stopCam(), [stopCam]);
  React.useEffect(() => { if (overlayRef.current) drawPts(overlayRef.current, points); }, [points]);
  React.useEffect(() => {
    if (phase === 'preview' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [phase]);

  const openCamera = async () => {
    setPhase('permission');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } });
      streamRef.current = stream; setPhase('preview');
    } catch { setPhase('error'); }
  };

  const goMarking = (url: string) => {
    setPhotoUrl(url); stopCam(); setPoints([]); setZoom(1); setPhase('marking');
  };

  const takePhoto = () => {
    const v = videoRef.current; if (!v) return;
    const c = document.createElement('canvas'); c.width = v.videoWidth || 1280; c.height = v.videoHeight || 720;
    c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height);
    goMarking(c.toDataURL('image/jpeg', 0.92));
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { const url = ev.target?.result as string; if (url) goMarking(url); };
    reader.readAsDataURL(file); e.target.value = '';
  };

  const handleTap = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== 'marking' || points.length >= MAX_PTS) return;
    const now = Date.now(); if (now - lastTap.current < 300) return; lastTap.current = now;
    const rect = contentRef.current?.getBoundingClientRect(); if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width, y = (e.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    setPoints(prev => [...prev, { x, y }]);
  };

  const goMeasuring = () => {
    setWallLengths(points.map(() => ''));
    setPhase('measuring');
  };

  const generatePlan = () => {
    const lens = wallLengths.map(v => parseFloat(v));
    if (lens.some(l => isNaN(l) || l <= 0)) return;
    setPhase('processing');
    setTimeout(() => { setRoom(buildRoom(points, lens)); setPhase('complete'); }, 1000);
  };

  const reset = () => {
    stopCam(); setPhase('idle'); setPoints([]); setRoom(null); setPhotoUrl(null);
    setWallLengths([]); setShowDl(false); setZoom(1);
  };

  const allLengthsFilled = wallLengths.length > 0 && wallLengths.every(v => parseFloat(v) > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-4 flex items-center gap-4 bg-black/30 backdrop-blur-sm sticky top-0 z-30">
        <Link href="/apps" className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors"><ArrowLeft className="h-4 w-4" /> Apps</Link>
        <div className="h-4 w-px bg-white/20" />
        <div className="flex items-center gap-2"><ScanLine className="h-4 w-4 text-indigo-400" /><span className="font-semibold text-sm">Room Scanner</span></div>
        {phase !== 'idle' && phase !== 'permission' && (
          <button onClick={reset} className="ml-auto flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"><RotateCcw className="h-4 w-4" /> Reiniciar</button>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* IDLE */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center text-center gap-6 pt-6">
            <div className="h-28 w-28 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
              <Camera className="h-14 w-14 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-serif mb-2">Room Scanner</h1>
              <p className="text-white/60 max-w-sm leading-relaxed text-sm">Toma una foto, marca las esquinas del piso y luego ingresa la medida real de cada pared para generar un plano 2D exacto.</p>
            </div>
            <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-3">
              {[['📸','Toma o sube una foto de la habitación'],['📍','Marca las esquinas del piso en la foto'],['📏','Indica la longitud real de cada pared'],['📐','Descarga el plano 2D con medidas exactas']].map(([icon, text], i) => (
                <div key={i} className="flex items-start gap-3"><div className="text-xl shrink-0">{icon}</div><p className="text-sm text-white/70">{text}</p></div>
              ))}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <div className="flex gap-3">
              <button onClick={openCamera} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 font-bold px-6 py-4 rounded-2xl shadow-xl hover:-translate-y-0.5 transition-all">
                <Camera className="h-5 w-5" /> Abrir Cámara
              </button>
              <button onClick={() => fileRef.current?.click()} className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 font-semibold px-5 py-4 rounded-2xl transition-all text-sm border border-white/10">
                <Upload className="h-5 w-5" /> Subir
              </button>
            </div>
          </div>
        )}

        {phase === 'permission' && (
          <div className="flex flex-col items-center gap-4 pt-20 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-400" />
            <p className="text-white/70">Solicitando acceso a la cámara…</p>
          </div>
        )}

        {/* CAMERA PREVIEW */}
        {phase === 'preview' && (
          <div className="flex flex-col gap-4">
            <div className="bg-indigo-900/50 border border-indigo-500/30 rounded-xl px-4 py-3 text-sm text-indigo-200">
              📸 Encuadra la habitación — incluye el piso y las esquinas. Luego toma la foto.
            </div>
            <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl" style={{ aspectRatio: '4/3' }}>
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline autoPlay />
              <div className="absolute inset-0 pointer-events-none">
                {[['top-3 left-3','border-t-2 border-l-2'],['top-3 right-3','border-t-2 border-r-2'],['bottom-12 left-3','border-b-2 border-l-2'],['bottom-12 right-3','border-b-2 border-r-2']].map(([pos,b],i) => (
                  <div key={i} className={`absolute ${pos} ${b} border-white/50 w-6 h-6 rounded-sm`} />
                ))}
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <button onClick={takePhoto} className="h-16 w-16 rounded-full bg-white border-4 border-white/30 shadow-2xl hover:scale-95 active:scale-90 transition-transform">
                  <div className="h-12 w-12 mx-auto rounded-full bg-white" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => fileRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-sm font-medium py-2.5 rounded-xl transition-colors">
                <Upload className="h-4 w-4" /> Subir imagen
              </button>
              <button onClick={reset} className="text-sm text-white/40 hover:text-white/70 px-3">Cancelar</button>
            </div>
          </div>
        )}

        {/* MARKING */}
        {phase === 'marking' && photoUrl && (
          <div className="flex flex-col gap-4">
            <div className="bg-indigo-900/50 border border-indigo-500/30 rounded-xl px-4 py-3 flex items-start gap-3 text-sm">
              <MapPin className="h-4 w-4 text-indigo-300 shrink-0 mt-0.5" />
              <span className="text-indigo-200">
                {points.length === 0 ? 'Toca la primera esquina del piso en la foto'
                  : points.length < MIN_PTS ? `${points.length} esquinas — agrega ${MIN_PTS - points.length} más como mínimo`
                  : `${points.length} esquinas marcadas • Agrega más o presiona Continuar`}
              </span>
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
              <span className="text-xs text-white/50 shrink-0">Zoom</span>
              <input type="range" min={1} max={4} step={0.25} value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} className="flex-1 accent-indigo-500" />
              <span className="text-xs font-bold text-indigo-300 w-10 text-right">{zoom.toFixed(2)}x</span>
              <button onClick={() => setZoom(1)} className="text-xs text-white/40 hover:text-white px-2 py-1 rounded-lg bg-white/10">Reset</button>
            </div>

            {/* Photo + overlay */}
            <div ref={containerRef} className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl select-none" style={{ aspectRatio: '4/3', cursor: 'crosshair' }}>
              <div ref={contentRef} className="absolute inset-0" style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', touchAction: 'none' }} onPointerDown={handleTap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl} alt="Room" className="w-full h-full object-cover" draggable={false} />
                <canvas ref={overlayRef} className="absolute inset-0 pointer-events-none" width={960} height={720} style={{ width: '100%', height: '100%' }} />
              </div>
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded-xl px-3 py-2 text-xs font-semibold pointer-events-none z-10">
                <span className="text-emerald-400">{points.length}</span><span className="text-white/60"> / {MAX_PTS}</span>
              </div>
              {points.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-4 py-3 text-center max-w-[180px]">
                    <MapPin className="h-6 w-6 text-emerald-400 mx-auto mb-1" />
                    <p className="text-xs text-white/80">Toca una esquina del piso para empezar</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setPoints(p => p.slice(0, -1))} disabled={!points.length} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-sm">
                <Trash2 className="h-4 w-4" /> Deshacer
              </button>
              <button onClick={() => setPoints([])} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-sm">
                <RotateCcw className="h-4 w-4" /> Limpiar
              </button>
              <button onClick={goMeasuring} disabled={points.length < MIN_PTS} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 font-bold py-2.5 rounded-xl text-sm">
                Continuar <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {points.length > 0 && (
              <div className="flex flex-wrap gap-1.5 bg-white/5 border border-white/10 rounded-xl p-3">
                {points.map((_, i) => (
                  <span key={i} className={`text-xs font-bold px-2 py-0.5 rounded-full ${i === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-300'}`}>Esq. {i + 1}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MEASURING — one input per wall */}
        {phase === 'measuring' && (
          <div className="space-y-5 pt-2">
            <div>
              <h2 className="text-xl font-bold mb-1">Medidas reales de cada pared</h2>
              <p className="text-white/60 text-sm">Ingresa la longitud en metros de cada pared. Esto garantiza exactitud sin importar la perspectiva de la foto.</p>
            </div>

            {/* Mini preview */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-xs text-white/50 mb-3">Tu habitación ({points.length} esquinas):</p>
              <svg viewBox="0 0 200 150" className="w-full max-w-[260px] mx-auto">
                <rect width="200" height="150" fill="#1e1b4b" rx="8" />
                {(() => {
                  const xs = points.map(p => p.x), ys = points.map(p => p.y);
                  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
                  const sc = Math.min(160 / ((maxX - minX) || 1), 110 / ((maxY - minY) || 1));
                  const pts = points.map(p => ({ x: 20 + (p.x - minX) * sc, y: 20 + (p.y - minY) * sc }));
                  return (<>
                    <polygon points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="rgba(99,102,241,0.2)" stroke="#818cf8" strokeWidth="1.5" />
                    {pts.map((p, i) => { const n = pts[(i + 1) % pts.length]; return (
                      <text key={i} x={(p.x + n.x) / 2} y={(p.y + n.y) / 2 - 4} textAnchor="middle" fontSize="8" fill="#818cf8" fontWeight="bold">P{i + 1}</text>
                    ); })}
                    {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill={i === 0 ? '#34d399' : '#6366f1'} stroke="white" strokeWidth="1" />)}
                  </>);
                })()}
              </svg>
            </div>

            {/* Wall inputs */}
            <div className="grid grid-cols-2 gap-3">
              {points.map((_, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <label className="text-xs text-white/60 block mb-2 font-medium">
                    Pared {i + 1} <span className="text-white/30">(Esq. {i + 1} → Esq. {(i + 1) % points.length + 1})</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" step="0.1" min="0.1" placeholder="ej. 4.5"
                      value={wallLengths[i] ?? ''}
                      onChange={e => setWallLengths(prev => { const c = [...prev]; c[i] = e.target.value; return c; })}
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:border-indigo-400 placeholder-white/20"
                    />
                    <span className="text-white/50 text-xs">m</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPhase('marking')} className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-medium">← Volver</button>
              <button onClick={generatePlan} disabled={!allLengthsFilled} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 font-bold py-3 rounded-xl">
                <ScanLine className="h-4 w-4" /> Generar Plano
              </button>
            </div>
          </div>
        )}

        {/* PROCESSING */}
        {phase === 'processing' && (
          <div className="flex flex-col items-center gap-6 pt-16 text-center">
            <div className="relative"><div className="h-24 w-24 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" /><div className="absolute inset-0 flex items-center justify-center"><ScanLine className="h-9 w-9 text-indigo-400" /></div></div>
            <div><h2 className="text-xl font-bold mb-2">Generando Plano...</h2><p className="text-white/50 text-sm">Construyendo el plano con las medidas reales.</p></div>
          </div>
        )}

        {/* COMPLETE */}
        {phase === 'complete' && room && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
              <div><h2 className="font-bold text-lg">¡Plano Generado!</h2><p className="text-white/50 text-sm">{room.walls.length} paredes · Área ≈ {room.area.toFixed(1)} m²</p></div>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-2xl overflow-x-auto"><div className="min-w-[300px]"><FloorPlanSVG room={room} id={SVG_ID} /></div></div>
            <DimensionEditor room={room} onChange={setRoom} />
            <div className="grid grid-cols-2 gap-2">
              {room.walls.map((w, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <span className="text-[10px] font-bold bg-indigo-600/40 text-indigo-300 px-1.5 py-0.5 rounded">P{i + 1}</span>
                  <span className="text-sm font-bold">{w.toFixed(1)} m</span>
                </div>
              ))}
              <div className="col-span-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5">
                <span className="text-sm">Área: <strong className="text-emerald-400">{room.area.toFixed(1)} m²</strong></span>
              </div>
            </div>
            <div className="relative">
              <div className="flex gap-3">
                <button onClick={() => setShowDl(v => !v)} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 font-semibold py-3.5 rounded-xl hover:-translate-y-0.5 transition-all shadow-lg">
                  <Download className="h-4 w-4" /> Descargar Plano
                </button>
                <button onClick={reset} className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20"><RotateCcw className="h-4 w-4" /></button>
              </div>
              {showDl && (
                <div className="absolute bottom-full mb-2 left-0 right-14 bg-slate-800 border border-white/20 rounded-2xl overflow-hidden shadow-2xl z-10">
                  <button onClick={() => { downloadPng(SVG_ID); setShowDl(false); }} className="w-full flex items-center gap-3 px-4 py-4 hover:bg-white/10 text-left">
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/20 flex items-center justify-center"><FileImage className="h-4 w-4 text-emerald-400" /></div>
                    <div><div className="font-semibold text-sm">Descargar PNG</div><div className="text-xs text-white/50">Alta resolución (2x)</div></div>
                  </button>
                  <div className="h-px bg-white/10" />
                  <button onClick={() => { downloadPdf(SVG_ID, room); setShowDl(false); }} className="w-full flex items-center gap-3 px-4 py-4 hover:bg-white/10 text-left">
                    <div className="h-9 w-9 rounded-xl bg-red-500/20 flex items-center justify-center"><FilePdf className="h-4 w-4 text-red-400" /></div>
                    <div><div className="font-semibold text-sm">Descargar PDF</div><div className="text-xs text-white/50">Listo para imprimir</div></div>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ERROR */}
        {phase === 'error' && (
          <div className="flex flex-col items-center gap-6 pt-16 text-center">
            <div className="h-20 w-20 rounded-2xl bg-red-500/20 flex items-center justify-center"><AlertCircle className="h-10 w-10 text-red-400" /></div>
            <div><h2 className="text-xl font-bold mb-2">Acceso a cámara denegado</h2><p className="text-white/50 text-sm max-w-xs">Permite el acceso en los ajustes del navegador.</p></div>
            <button onClick={reset} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-medium"><RotateCcw className="h-4 w-4" /> Reintentar</button>
          </div>
        )}

      </div>
    </div>
  );
}
