'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ScanLine, ArrowLeft, Download, CheckCircle2,
  AlertCircle, Loader2, RotateCcw, Pencil, FileImage,
  FileText as FilePdf, Save, X, Plus, Minus, Trash2,
  ArrowRight, Info, Crosshair, MapPin
} from 'lucide-react';

type Phase = 'idle' | 'permission' | 'active' | 'measuring' | 'processing' | 'complete' | 'error';
interface Point { x: number; y: number }
interface RoomData { points: Point[]; walls: number[]; width: number; height: number }

function dist(a: Point, b: Point) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function buildRoomData(points: Point[], refWallIdx: number, refLength: number): RoomData {
  const pxRef = dist(points[refWallIdx], points[(refWallIdx + 1) % points.length]);
  const scale = pxRef > 0 ? refLength / pxRef : 1;
  const walls = points.map((p, i) => Math.round(dist(p, points[(i + 1) % points.length]) * scale * 100) / 100);
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const width = Math.round((Math.max(...xs) - Math.min(...xs)) * scale * 100) / 100;
  const height = Math.round((Math.max(...ys) - Math.min(...ys)) * scale * 100) / 100;
  return { points, walls, width, height };
}

/* ─── SVG FLOOR PLAN ────────────────────────────────────────────── */
function FloorPlanSVG({ room, id }: { room: RoomData; id?: string }) {
  const W = 520, H = 400, PAD = 65;
  const xs = room.points.map(p => p.x), ys = room.points.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rX = maxX - minX || 1, rY = maxY - minY || 1;
  const scale = Math.min((W - PAD * 2) / rX, (H - PAD * 2) / rY);
  const toSVG = (p: Point) => ({ x: PAD + (p.x - minX) * scale, y: PAD + (p.y - minY) * scale });
  const svgPts = room.points.map(toSVG);
  const polyStr = svgPts.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg id={id} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg"
      width={W} height={H} style={{ fontFamily: 'Arial, sans-serif' }}>
      <rect width={W} height={H} fill="#f8f9fc" rx="10" />
      {Array.from({ length: 12 }).map((_, i) => Array.from({ length: 10 }).map((_, j) => (
        <circle key={`${i}-${j}`} cx={20 + i * 44} cy={20 + j * 38} r="1.5" fill="#e2e8f0" />
      )))}
      <polygon points={polyStr} fill="#eef2ff" />
      <polygon points={polyStr} fill="none" stroke="#312e81" strokeWidth="7" strokeLinejoin="round" />
      {svgPts.map((p, i) => {
        const next = svgPts[(i + 1) % svgPts.length];
        const mx = (p.x + next.x) / 2, my = (p.y + next.y) / 2;
        const angle = Math.atan2(next.y - p.y, next.x - p.x) * 180 / Math.PI;
        const na = angle > 90 || angle < -90 ? angle + 180 : angle;
        return (
          <g key={i}>
            <rect x={mx - 22} y={my - 10} width={44} height={16} rx="4" fill="white" opacity="0.85" />
            <text x={mx} y={my + 2} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#374151"
              transform={`rotate(${na},${mx},${my})`}>{room.walls[i].toFixed(2)}m</text>
          </g>
        );
      })}
      {svgPts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="5" fill="#6366f1" stroke="white" strokeWidth="2" />)}
      <rect x={W - 110} y={10} width={100} height={40} rx="8" fill="#312e81" />
      <text x={W - 60} y={26} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.7)">AREA EST.</text>
      <text x={W - 60} y={43} textAnchor="middle" fontSize="13" fill="white" fontWeight="bold">
        {(room.width * room.height).toFixed(1)} m²
      </text>
      <circle cx={W - 22} cy={H - 22} r="15" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
      <text x={W - 22} y={H - 28} textAnchor="middle" fontSize="8" fill="#312e81" fontWeight="bold">N</text>
      <polygon points={`${W - 22},${H - 22} ${W - 18},${H - 14} ${W - 22},${H - 17} ${W - 26},${H - 14}`} fill="#312e81" />
    </svg>
  );
}

/* ─── DOWNLOAD HELPERS ──────────────────────────────────────────── */
async function downloadAsPng(svgId: string) {
  const el = document.getElementById(svgId) as SVGSVGElement | null;
  if (!el) return;
  const str = new XMLSerializer().serializeToString(el);
  const blob = new Blob([str], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = el.width.baseVal.value * 2; c.height = el.height.baseVal.value * 2;
    const ctx = c.getContext('2d')!; ctx.scale(2, 2); ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    c.toBlob(b => {
      if (!b) return;
      const a = document.createElement('a'); a.href = URL.createObjectURL(b);
      a.download = `floor-plan-${Date.now()}.png`; a.click();
    }, 'image/png');
  };
  img.src = url;
}

function downloadAsPdf(svgId: string, room: RoomData) {
  const el = document.getElementById(svgId) as SVGSVGElement | null;
  if (!el) return;
  const svgStr = new XMLSerializer().serializeToString(el);
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Floor Plan</title>
    <style>*{margin:0;padding:0}body{background:white;font-family:Arial,sans-serif;padding:24px}
    h1{font-size:18px;font-weight:bold;margin-bottom:4px}p{font-size:12px;color:#64748b;margin-bottom:16px}
    svg{width:100%;max-width:700px;display:block;margin:0 auto}
    .meta{margin-top:20px;font-size:12px}@media print{body{padding:12px}}</style></head>
    <body><h1>2D Floor Plan</h1><p>EstudioPro Room Scanner</p>${svgStr}
    <div class="meta">Walls: ${room.walls.map((w, i) => `Wall ${i + 1}: ${w.toFixed(2)}m`).join(' · ')} · 
    Area ≈ ${(room.width * room.height).toFixed(1)} m²</div></body></html>`);
  w.document.close();
  w.onload = () => { w.focus(); w.print(); };
}

/* ─── DIMENSION EDITOR ──────────────────────────────────────────── */
function DimensionEditor({ room, onChange }: { room: RoomData; onChange: (r: RoomData) => void }) {
  const [open, setOpen] = React.useState(false);
  const [drafts, setDrafts] = React.useState(room.walls.map(w => w.toFixed(2)));
  if (!open) return (
    <button onClick={() => setOpen(true)} className="flex items-center gap-2 text-sm text-indigo-300 hover:text-white transition-colors">
      <Pencil className="h-3.5 w-3.5" /> Edit wall measurements
    </button>
  );
  return (
    <div className="bg-white/10 border border-white/20 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Edit Wall Lengths</h3>
        <button onClick={() => setOpen(false)}><X className="h-4 w-4 text-white/50" /></button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {drafts.map((d, i) => (
          <div key={i}>
            <label className="text-xs text-white/60 block mb-1">Wall {i + 1} (m)</label>
            <div className="flex items-center gap-1">
              <button onClick={() => setDrafts(dr => { const c = [...dr]; c[i] = Math.max(0.1, parseFloat(c[i]) - 0.1).toFixed(2); return c; })}
                className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"><Minus className="h-3 w-3" /></button>
              <input type="number" step="0.1" min="0.1" value={d}
                onChange={e => setDrafts(dr => { const c = [...dr]; c[i] = e.target.value; return c; })}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-1 py-1 text-center text-xs font-mono font-bold focus:outline-none focus:border-indigo-400 min-w-0" />
              <button onClick={() => setDrafts(dr => { const c = [...dr]; c[i] = (parseFloat(c[i]) + 0.1).toFixed(2); return c; })}
                className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"><Plus className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => { onChange({ ...room, walls: drafts.map(d => parseFloat(d) || 0.5) }); setOpen(false); }}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 font-semibold py-2.5 rounded-xl text-sm">
        <Save className="h-4 w-4" /> Apply Changes
      </button>
    </div>
  );
}

/* ─── CANVAS OVERLAY DRAW ───────────────────────────────────────── */
function drawOverlay(canvas: HTMLCanvasElement, points: Point[]) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (points.length === 0) return;
  const toC = (p: Point) => ({ x: p.x * w, y: p.y * h });
  const cPts = points.map(toC);

  if (points.length >= 3) {
    ctx.beginPath();
    ctx.moveTo(cPts[0].x, cPts[0].y);
    cPts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.fillStyle = 'rgba(99,102,241,0.18)';
    ctx.fill();
  }

  ctx.beginPath();
  ctx.moveTo(cPts[0].x, cPts[0].y);
  cPts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  if (points.length >= 3) ctx.closePath();
  ctx.strokeStyle = '#818cf8';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([]);
  ctx.stroke();

  cPts.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, i === 0 ? 10 : 8, 0, Math.PI * 2);
    ctx.fillStyle = i === 0 ? '#34d399' : '#6366f1';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(i === 0 ? '✓' : `${i + 1}`, p.x, p.y);
  });
}

/* ─── MAIN PAGE ─────────────────────────────────────────────────── */
const SVG_ID = 'room-plan-svg';
const MIN_PTS = 3, MAX_PTS = 12;

export default function RoomScannerPage() {
  const [phase, setPhase] = React.useState<Phase>('idle');
  const [points, setPoints] = React.useState<Point[]>([]);
  const [room, setRoom] = React.useState<RoomData | null>(null);
  const [refWallIdx, setRefWallIdx] = React.useState(0);
  const [refLength, setRefLength] = React.useState('');
  const [showDownloadMenu, setShowDownloadMenu] = React.useState(false);
  const [crosshairMode, setCrosshairMode] = React.useState(false);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const overlayRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const videoContainerRef = React.useRef<HTMLDivElement>(null);

  const stopCamera = React.useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  React.useEffect(() => () => stopCamera(), [stopCamera]);

  // Redraw overlay whenever points change
  React.useEffect(() => {
    if (overlayRef.current) drawOverlay(overlayRef.current, points);
  }, [points]);

  // Attach stream to video once both are ready
  React.useEffect(() => {
    if (phase === 'active' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [phase]);

  const startCamera = async () => {
    setPhase('permission');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      setPhase('active'); // mount video FIRST, then useEffect will attach stream
    } catch {
      setPhase('error');
    }
  };

  // Get normalized coordinates from click/touch
  const getRelCoords = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>): Point | null => {
    const container = videoContainerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    const raw = 'touches' in e ? e.touches[0] : (e as React.MouseEvent);
    const x = (raw.clientX - rect.left) / rect.width;
    const y = (raw.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return null;
    return { x, y };
  };

  const addPoint = (p: Point) => {
    if (points.length >= MAX_PTS || phase !== 'active') return;
    setPoints(prev => [...prev, p]);
  };

  const handleTap = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (crosshairMode) return; // in crosshair mode, use the Mark button instead
    const p = getRelCoords(e);
    if (p) addPoint(p);
  };

  const markCrosshairPoint = () => {
    // Place a point at the center of the frame (crosshair position)
    addPoint({ x: 0.5, y: 0.5 });
  };

  const undoLast = () => setPoints(prev => prev.slice(0, -1));

  const generatePlan = () => {
    const len = parseFloat(refLength);
    if (isNaN(len) || len <= 0) return;
    setPhase('processing');
    setTimeout(() => {
      setRoom(buildRoomData(points, refWallIdx, len));
      stopCamera();
      setPhase('complete');
    }, 1500);
  };

  const reset = () => {
    stopCamera();
    setPhase('idle');
    setPoints([]);
    setRoom(null);
    setRefLength('');
    setRefWallIdx(0);
    setShowDownloadMenu(false);
    setCrosshairMode(false);
  };

  const showCamera = phase === 'active';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-4 flex items-center gap-4 bg-black/30 backdrop-blur-sm sticky top-0 z-30">
        <Link href="/apps" className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors">
          <ArrowLeft className="h-4 w-4" /> Apps
        </Link>
        <div className="h-4 w-px bg-white/20" />
        <div className="flex items-center gap-2">
          <ScanLine className="h-4 w-4 text-indigo-400" />
          <span className="font-semibold text-sm">Room Scanner</span>
        </div>
        {(phase === 'active' || phase === 'complete') && (
          <button onClick={reset} className="ml-auto flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors">
            <RotateCcw className="h-4 w-4" /> Restart
          </button>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── IDLE ──────────────────────────────────────────────────── */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center text-center gap-6 pt-6">
            <div className="h-28 w-28 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
              <MapPin className="h-14 w-14 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-serif mb-2">Room Scanner</h1>
              <p className="text-white/60 max-w-sm leading-relaxed text-sm">
                Apunta tu cámara a la habitación y marca cada esquina. Nosotros calculamos el plano 2D con medidas reales.
              </p>
            </div>
            <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-3">
              {[
                { n: '1', text: 'Abre la cámara y apunta al piso de la habitación' },
                { n: '2', text: 'Toca cada esquina en la pantalla (o usa la mira central)' },
                { n: '3', text: 'Ingresa la medida real de una pared como referencia' },
                { n: '4', text: 'Obtén el plano 2D con todas las medidas y descárgalo' },
              ].map(s => (
                <div key={s.n} className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{s.n}</div>
                  <p className="text-sm text-white/70">{s.text}</p>
                </div>
              ))}
            </div>
            <button onClick={startCamera}
              className="flex items-center gap-3 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 font-bold px-8 py-4 rounded-2xl shadow-xl hover:-translate-y-0.5 transition-all text-base">
              <Crosshair className="h-5 w-5" /> Abrir Cámara
            </button>
          </div>
        )}

        {/* ── PERMISSION ────────────────────────────────────────────── */}
        {phase === 'permission' && (
          <div className="flex flex-col items-center gap-4 pt-20 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-400" />
            <p className="text-white/70">Solicitando acceso a la cámara…</p>
          </div>
        )}

        {/* ── CAMERA VIEW (active + measuring share the camera) ──────── */}
        {showCamera && (
          <>
            {/* INSTRUCTION BAR */}
            {phase === 'active' && (
              <div className="bg-indigo-900/70 border border-indigo-500/30 rounded-xl px-4 py-3 flex items-center gap-3 text-sm">
                <Info className="h-4 w-4 text-indigo-300 shrink-0" />
                <span className="text-indigo-200">
                  {points.length === 0
                    ? 'Toca la pantalla en la primera esquina de la habitación'
                    : points.length < MIN_PTS
                      ? `Toca la siguiente esquina — faltan ${MIN_PTS - points.length} más`
                      : `${points.length} esquinas marcadas. Agrega más o presiona "Listo"`}
                </span>
              </div>
            )}

            {/* CAMERA + OVERLAY */}
            <div
              ref={videoContainerRef}
              className="relative rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl"
              style={{ aspectRatio: '4/3' }}
              onClick={handleTap}
              onTouchStart={handleTap}
            >
              {/* VIDEO ELEMENT — always rendered when camera is open */}
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                playsInline
                autoPlay
              />

              {/* CANVAS OVERLAY */}
              {phase === 'active' && (
                <canvas
                  ref={overlayRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  width={960}
                  height={720}
                />
              )}

              {/* CROSSHAIR MODE indicator */}
              {phase === 'active' && crosshairMode && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative">
                    <div className="h-10 w-10 border-2 border-emerald-400 rounded-sm opacity-90" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-1.5 bg-emerald-400 rounded-full" />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-px h-4 bg-emerald-400/70" />
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-px h-4 bg-emerald-400/70" />
                    <div className="absolute top-1/2 -left-6 -translate-y-1/2 h-px w-4 bg-emerald-400/70" />
                    <div className="absolute top-1/2 -right-6 -translate-y-1/2 h-px w-4 bg-emerald-400/70" />
                  </div>
                </div>
              )}

              {/* TOP STATUS */}
              {phase === 'active' && (
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 text-xs font-semibold">
                  <span className="text-emerald-400">{points.length}</span>
                  <span className="text-white/60"> / {MAX_PTS} esquinas</span>
                </div>
              )}

              {/* CROSSHAIR MARK BUTTON (bottom center) */}
              {phase === 'active' && crosshairMode && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
                  <button
                    onClick={(e) => { e.stopPropagation(); markCrosshairPoint(); }}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-5 py-2.5 rounded-full shadow-xl text-sm"
                  >
                    <MapPin className="h-4 w-4" /> Marcar esta esquina
                  </button>
                </div>
              )}
            </div>

            {/* CONTROLS */}
            {phase === 'active' && (
              <>
                <div className="flex gap-2">
                  <button onClick={undoLast} disabled={points.length === 0}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-all text-sm">
                    <Trash2 className="h-4 w-4" /> Deshacer
                  </button>
                  <button
                    onClick={() => setCrosshairMode(m => !m)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${crosshairMode ? 'bg-emerald-600 text-white' : 'bg-white/10 hover:bg-white/20'}`}
                  >
                    <Crosshair className="h-4 w-4" />
                    {crosshairMode ? 'Modo mira ON' : 'Usar mira'}
                  </button>
                  <button
                    onClick={() => { stopCamera(); setPhase('measuring'); }}
                    disabled={points.length < MIN_PTS}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 font-bold py-2.5 rounded-xl transition-all text-sm"
                  >
                    Listo <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-xs text-white/50 mb-2 font-medium">
                    {crosshairMode
                      ? '✦ Modo mira: apunta la cámara a cada esquina y presiona "Marcar esta esquina"'
                      : '✦ Modo toque: toca directamente en las esquinas de la habitación en la pantalla'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {points.map((_, i) => (
                      <span key={i} className={`text-xs font-bold px-2 py-0.5 rounded-full ${i === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-300'}`}>
                        {i === 0 ? '⬤ Inicio' : `Esq. ${i + 1}`}
                      </span>
                    ))}
                    {points.length === 0 && <span className="text-xs text-white/30 italic">Sin esquinas aún</span>}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ── MEASURING ─────────────────────────────────────────────── */}
        {phase === 'measuring' && (
          <div className="space-y-5 pt-2">
            <div>
              <h2 className="text-xl font-bold mb-1">Referencia de escala</h2>
              <p className="text-white/60 text-sm">Indica la medida real de una pared para calibrar todas las demás.</p>
            </div>

            {/* Mini preview */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-xs text-white/50 mb-3">Tu plano ({points.length} esquinas) — toca una pared para seleccionarla:</p>
              <svg viewBox="0 0 200 150" className="w-full max-w-[280px] mx-auto">
                <rect width="200" height="150" fill="#1e1b4b" rx="8" />
                {(() => {
                  const xs = points.map(p => p.x), ys = points.map(p => p.y);
                  const minX = Math.min(...xs), maxX = Math.max(...xs);
                  const minY = Math.min(...ys), maxY = Math.max(...ys);
                  const rX = maxX - minX || 1, rY = maxY - minY || 1;
                  const sc = Math.min(160 / rX, 110 / rY);
                  const toS = (p: Point) => ({ x: 20 + (p.x - minX) * sc, y: 20 + (p.y - minY) * sc });
                  const pts = points.map(toS);
                  return (
                    <>
                      <polygon points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="rgba(99,102,241,0.2)" stroke="#818cf8" strokeWidth="1.5" />
                      {pts.map((p, i) => {
                        const next = pts[(i + 1) % pts.length];
                        const sel = i === refWallIdx;
                        return (
                          <g key={i} style={{ cursor: 'pointer' }} onClick={() => setRefWallIdx(i)}>
                            <line x1={p.x} y1={p.y} x2={next.x} y2={next.y}
                              stroke={sel ? '#34d399' : '#818cf8'} strokeWidth={sel ? 3.5 : 1.5} />
                            <text x={(p.x + next.x) / 2} y={(p.y + next.y) / 2 - 5} textAnchor="middle"
                              fontSize="8" fill={sel ? '#34d399' : '#818cf8'} fontWeight="bold">P{i + 1}</text>
                          </g>
                        );
                      })}
                      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill={i === 0 ? '#34d399' : '#6366f1'} stroke="white" strokeWidth="1" />)}
                    </>
                  );
                })()}
              </svg>
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-2">¿Qué pared conoces?</label>
              <div className="flex flex-wrap gap-2">
                {points.map((_, i) => (
                  <button key={i} onClick={() => setRefWallIdx(i)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${refWallIdx === i ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
                    Pared {i + 1}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-2">Longitud real de la Pared {refWallIdx + 1} (metros)</label>
              <div className="flex items-center gap-3">
                <input type="number" step="0.1" min="0.1" placeholder="ej. 4.5"
                  value={refLength} onChange={e => setRefLength(e.target.value)}
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-lg font-mono font-bold focus:outline-none focus:border-indigo-400 placeholder-white/20" />
                <span className="text-white/60 font-semibold">m</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={async () => {
                // Re-open camera reusing existing permission
                setPhase('permission');
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
                  });
                  streamRef.current = stream;
                  setPhase('active');
                } catch { setPhase('error'); }
              }} className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-medium">
                ← Volver a marcar
              </button>
              <button onClick={generatePlan} disabled={!refLength || parseFloat(refLength) <= 0}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 font-bold py-3 rounded-xl transition-all">
                <ScanLine className="h-4 w-4" /> Generar Plano
              </button>
            </div>
          </div>
        )}

        {/* ── PROCESSING ────────────────────────────────────────────── */}
        {phase === 'processing' && (
          <div className="flex flex-col items-center gap-6 pt-16 text-center">
            <div className="relative">
              <div className="h-24 w-24 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ScanLine className="h-9 w-9 text-indigo-400" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Generando Plano...</h2>
              <p className="text-white/50 text-sm">Calculando longitudes y proporciones de las paredes.</p>
            </div>
          </div>
        )}

        {/* ── COMPLETE ──────────────────────────────────────────────── */}
        {phase === 'complete' && room && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
              <div>
                <h2 className="font-bold text-lg">¡Plano Generado!</h2>
                <p className="text-white/50 text-sm">{room.points.length} paredes · Área ≈ {(room.width * room.height).toFixed(1)} m²</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3 shadow-2xl overflow-x-auto">
              <div className="min-w-[300px]">
                <FloorPlanSVG room={room} id={SVG_ID} />
              </div>
            </div>

            <DimensionEditor room={room} onChange={setRoom} />

            <div className="grid grid-cols-2 gap-2">
              {room.walls.map((w, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <span className="text-[10px] font-bold bg-indigo-600/40 text-indigo-300 px-1.5 py-0.5 rounded shrink-0">P{i + 1}</span>
                  <span className="text-sm font-bold">{w.toFixed(2)} m</span>
                </div>
              ))}
              <div className="col-span-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5">
                <span className="text-sm">Área estimada: <strong className="text-emerald-400">{(room.width * room.height).toFixed(1)} m²</strong></span>
              </div>
            </div>

            {/* Download */}
            <div className="relative">
              <div className="flex gap-3">
                <button onClick={() => setShowDownloadMenu(v => !v)}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 font-semibold py-3.5 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg">
                  <Download className="h-4 w-4" /> Descargar Plano
                </button>
                <button onClick={reset} className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
              {showDownloadMenu && (
                <div className="absolute bottom-full mb-2 left-0 right-14 bg-slate-800 border border-white/20 rounded-2xl overflow-hidden shadow-2xl z-10 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <button onClick={() => { downloadAsPng(SVG_ID); setShowDownloadMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-4 hover:bg-white/10 transition-colors text-left">
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <FileImage className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Descargar como PNG</div>
                      <div className="text-xs text-white/50">Imagen alta resolución (2x)</div>
                    </div>
                  </button>
                  <div className="h-px bg-white/10" />
                  <button onClick={() => { downloadAsPdf(SVG_ID, room); setShowDownloadMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-4 hover:bg-white/10 transition-colors text-left">
                    <div className="h-9 w-9 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <FilePdf className="h-4 w-4 text-red-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Descargar como PDF</div>
                      <div className="text-xs text-white/50">Documento listo para imprimir</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ERROR ─────────────────────────────────────────────────── */}
        {phase === 'error' && (
          <div className="flex flex-col items-center gap-6 pt-16 text-center">
            <div className="h-20 w-20 rounded-2xl bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Acceso a cámara denegado</h2>
              <p className="text-white/50 text-sm max-w-xs">Permite el acceso a la cámara en los ajustes del navegador e inténtalo de nuevo.</p>
            </div>
            <button onClick={reset} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-medium">
              <RotateCcw className="h-4 w-4" /> Reintentar
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
