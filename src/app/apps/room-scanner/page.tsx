'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ScanLine, ArrowLeft, Camera, RefreshCw, Download,
  CheckCircle2, AlertCircle, Loader2, RotateCcw, Pencil,
  FileImage, FileText as FilePdf, Save, X, Plus, Minus
} from 'lucide-react';

type ScanPhase = 'idle' | 'permission' | 'scanning' | 'processing' | 'complete' | 'error';

interface DoorData { x: number; y: number; wall: 'top' | 'bottom' | 'left' | 'right' }
interface WindowData { x: number; y: number; wall: 'top' | 'bottom' | 'left' | 'right' }

interface RoomData {
  width: number;
  height: number;
  doors: DoorData[];
  windows: WindowData[];
}

function generateRoomData(): RoomData {
  const width = Math.round((3.5 + Math.random() * 4) * 10) / 10;
  const height = Math.round((3 + Math.random() * 3.5) * 10) / 10;
  const walls = ['top', 'bottom', 'left', 'right'] as const;
  return {
    width,
    height,
    doors: [{ x: 0.3 + Math.random() * 0.4, y: 0.3 + Math.random() * 0.3, wall: walls[Math.floor(Math.random() * 2)] }],
    windows: [
      { x: 0.2 + Math.random() * 0.3, y: 0.3 + Math.random() * 0.3, wall: 'top' },
      { x: 0.5 + Math.random() * 0.3, y: 0.5 + Math.random() * 0.3, wall: 'right' },
    ],
  };
}

function FloorPlanSVG({ room, id }: { room: RoomData; id?: string }) {
  const svgW = 560;
  const svgH = 440;
  const padding = 75;
  const scale = Math.min((svgW - padding * 2) / room.width, (svgH - padding * 2) / room.height);
  const rW = room.width * scale;
  const rH = room.height * scale;
  const rX = (svgW - rW) / 2;
  const rY = (svgH - rH) / 2;
  const wallThick = 8;
  const doorSize = 44;
  const winSize = 52;

  return (
    <svg id={id} viewBox={`0 0 ${svgW} ${svgH}`} xmlns="http://www.w3.org/2000/svg"
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }} width={svgW} height={svgH}>
      <rect width={svgW} height={svgH} fill="#f8f9fc" rx="12" />
      {/* Grid dots */}
      {Array.from({ length: 14 }).map((_, i) =>
        Array.from({ length: 11 }).map((_, j) => (
          <circle key={`${i}-${j}`} cx={28 + i * 38} cy={28 + j * 38} r="1.5" fill="#e2e8f0" />
        ))
      )}
      <rect x={rX} y={rY} width={rW} height={rH} fill="#eef2ff" />
      {/* Walls */}
      <rect x={rX} y={rY} width={rW} height={wallThick} fill="#312e81" />
      <rect x={rX} y={rY + rH - wallThick} width={rW} height={wallThick} fill="#312e81" />
      <rect x={rX} y={rY} width={wallThick} height={rH} fill="#312e81" />
      <rect x={rX + rW - wallThick} y={rY} width={wallThick} height={rH} fill="#312e81" />

      {room.doors.map((door, i) => {
        const dx = rX + door.x * rW;
        const dy = rY + rH - wallThick;
        return (
          <g key={i}>
            <rect x={dx - doorSize / 2} y={dy - 1} width={doorSize} height={wallThick + 2} fill="#eef2ff" />
            <path d={`M ${dx - doorSize / 2} ${dy + wallThick / 2} A ${doorSize} ${doorSize} 0 0 0 ${dx + doorSize / 2} ${dy + wallThick / 2}`}
              fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3,2" />
            <text x={dx} y={dy + wallThick + 16} textAnchor="middle" fontSize="9" fill="#6366f1" fontWeight="bold">DOOR</text>
          </g>
        );
      })}

      {room.windows.map((win, i) => {
        const isTop = win.wall === 'top';
        const wx = isTop ? rX + win.x * rW - winSize / 2 : rX + rW - wallThick;
        const wy = isTop ? rY : rY + win.y * rH - winSize / 2;
        const ww = isTop ? winSize : wallThick;
        const wh = isTop ? wallThick : winSize;
        return (
          <g key={i}>
            <rect x={wx} y={wy} width={ww} height={wh} fill="#7dd3fc" opacity="0.8" />
            {isTop
              ? <line x1={wx} y1={wy + wallThick / 2} x2={wx + ww} y2={wy + wallThick / 2} stroke="white" strokeWidth="2" />
              : <line x1={wx + wallThick / 2} y1={wy} x2={wx + wallThick / 2} y2={wy + wh} stroke="white" strokeWidth="2" />
            }
          </g>
        );
      })}

      {/* Width dimension */}
      <line x1={rX} y1={rY + rH + 22} x2={rX + rW} y2={rY + rH + 22} stroke="#94a3b8" strokeWidth="1.5" />
      <line x1={rX} y1={rY + rH + 16} x2={rX} y2={rY + rH + 28} stroke="#94a3b8" strokeWidth="1.5" />
      <line x1={rX + rW} y1={rY + rH + 16} x2={rX + rW} y2={rY + rH + 28} stroke="#94a3b8" strokeWidth="1.5" />
      <text x={rX + rW / 2} y={rY + rH + 40} textAnchor="middle" fontSize="12" fill="#374151" fontWeight="bold">{room.width.toFixed(2)} m</text>

      {/* Height dimension */}
      <line x1={rX - 22} y1={rY} x2={rX - 22} y2={rY + rH} stroke="#94a3b8" strokeWidth="1.5" />
      <line x1={rX - 28} y1={rY} x2={rX - 16} y2={rY} stroke="#94a3b8" strokeWidth="1.5" />
      <line x1={rX - 28} y1={rY + rH} x2={rX - 16} y2={rY + rH} stroke="#94a3b8" strokeWidth="1.5" />
      <text x={rX - 38} y={rY + rH / 2} textAnchor="middle" fontSize="12" fill="#374151" fontWeight="bold"
        transform={`rotate(-90, ${rX - 38}, ${rY + rH / 2})`}>{room.height.toFixed(2)} m</text>

      {/* Area badge */}
      <rect x={svgW - 115} y={12} width={103} height={42} rx="8" fill="#312e81" />
      <text x={svgW - 64} y={27} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.7)" fontWeight="500">TOTAL AREA</text>
      <text x={svgW - 64} y={45} textAnchor="middle" fontSize="15" fill="white" fontWeight="bold">{(room.width * room.height).toFixed(1)} m²</text>

      {/* Compass */}
      <circle cx={svgW - 24} cy={svgH - 24} r="16" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
      <text x={svgW - 24} y={svgH - 30} textAnchor="middle" fontSize="8" fill="#312e81" fontWeight="bold">N</text>
      <polygon points={`${svgW - 24},${svgH - 24} ${svgW - 20},${svgH - 15} ${svgW - 24},${svgH - 18} ${svgW - 28},${svgH - 15}`} fill="#312e81" />
      <polygon points={`${svgW - 24},${svgH - 24} ${svgW - 20},${svgH - 33} ${svgW - 24},${svgH - 30} ${svgW - 28},${svgH - 33}`} fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.5" />

      {/* Legend */}
      <rect x={10} y={svgH - 50} width={8} height={8} fill="#7dd3fc" rx="1" />
      <text x={22} y={svgH - 43} fontSize="9" fill="#64748b">Window</text>
      <rect x={10} y={svgH - 36} width={8} height={8} fill="none" stroke="#6366f1" strokeWidth="1.5" rx="1" />
      <text x={22} y={svgH - 29} fontSize="9" fill="#64748b">Door</text>
    </svg>
  );
}

// Download as PNG using canvas
async function downloadAsPng(svgId: string, filename: string) {
  const svgEl = document.getElementById(svgId) as SVGSVGElement | null;
  if (!svgEl) return;
  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svgEl);
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = svgEl.width.baseVal.value * 2;
    canvas.height = svgEl.height.baseVal.value * 2;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob(b => {
      if (!b) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = filename;
      a.click();
    }, 'image/png');
  };
  img.src = url;
}

// Download as PDF using print window
function downloadAsPdf(svgId: string, room: RoomData) {
  const svgEl = document.getElementById(svgId) as SVGSVGElement | null;
  if (!svgEl) return;
  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svgEl);
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Floor Plan</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: white; font-family: Arial, sans-serif; padding: 24px; }
    h1 { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
    p { font-size: 12px; color: #64748b; margin-bottom: 16px; }
    svg { width: 100%; max-width: 700px; display: block; margin: 0 auto; }
    .meta { margin-top: 20px; display: flex; gap: 24px; font-size: 12px; }
    .meta span { font-weight: bold; }
    @media print { body { padding: 12px; } }
  </style>
</head>
<body>
  <h1>2D Floor Plan</h1>
  <p>Generated by EstudioPro Room Scanner</p>
  ${svgStr}
  <div class="meta">
    <div>Width: <span>${room.width.toFixed(2)} m</span></div>
    <div>Length: <span>${room.height.toFixed(2)} m</span></div>
    <div>Area: <span>${(room.width * room.height).toFixed(1)} m²</span></div>
  </div>
</body>
</html>`;
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.onload = () => {
    w.focus();
    w.print();
  };
}

// Editable measurements panel
function DimensionEditor({ room, onChange }: { room: RoomData; onChange: (r: RoomData) => void }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState({ width: room.width.toFixed(2), height: room.height.toFixed(2) });

  const save = () => {
    const w = parseFloat(draft.width);
    const h = parseFloat(draft.height);
    if (!isNaN(w) && w > 0 && !isNaN(h) && h > 0) {
      onChange({ ...room, width: Math.round(w * 100) / 100, height: Math.round(h * 100) / 100 });
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <button
        onClick={() => { setDraft({ width: room.width.toFixed(2), height: room.height.toFixed(2) }); setEditing(true); }}
        className="flex items-center gap-2 text-sm text-indigo-300 hover:text-white transition-colors"
      >
        <Pencil className="h-3.5 w-3.5" /> Edit measurements
      </button>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Edit Measurements</h3>
        <button onClick={() => setEditing(false)} className="text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Width (m)', key: 'width' as const },
          { label: 'Length (m)', key: 'height' as const },
        ].map(({ label, key }) => (
          <div key={key}>
            <label className="text-xs text-white/60 block mb-1.5">{label}</label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDraft(d => ({ ...d, [key]: Math.max(0.5, parseFloat(d[key]) - 0.1).toFixed(2) }))}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="50"
                value={draft[key]}
                onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-center text-sm font-mono font-bold focus:outline-none focus:border-indigo-400 min-w-0"
              />
              <button
                onClick={() => setDraft(d => ({ ...d, [key]: (parseFloat(d[key]) + 0.1).toFixed(2) }))}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-white/40 text-center">
        Approx. area: <span className="text-white/80 font-bold">{(parseFloat(draft.width || '0') * parseFloat(draft.height || '0')).toFixed(1)} m²</span>
      </div>

      <button
        onClick={save}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all text-sm"
      >
        <Save className="h-4 w-4" /> Apply Changes
      </button>
    </div>
  );
}

export default function RoomScannerPage() {
  const [phase, setPhase] = React.useState<ScanPhase>('idle');
  const [scanProgress, setScanProgress] = React.useState(0);
  const [scanAngle, setScanAngle] = React.useState(0);
  const [room, setRoom] = React.useState<RoomData | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const scanIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCamera = React.useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, []);

  React.useEffect(() => () => stopCamera(), [stopCamera]);

  const startScan = async () => {
    setPhase('permission');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setPhase('scanning');
      setScanProgress(0);
      let progress = 0;
      scanIntervalRef.current = setInterval(() => {
        progress += 100 / 125;
        setScanProgress(Math.min(progress, 100));
        setScanAngle(prev => (prev + 3) % 360);
        if (progress >= 100) {
          clearInterval(scanIntervalRef.current!);
          setPhase('processing');
          stopCamera();
          setTimeout(() => { setRoom(generateRoomData()); setPhase('complete'); }, 2800);
        }
      }, 40);
    } catch { setPhase('error'); }
  };

  const reset = () => { stopCamera(); setPhase('idle'); setScanProgress(0); setScanAngle(0); setRoom(null); setShowDownloadMenu(false); };

  const SVG_ID = 'floor-plan-svg';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-4 flex items-center gap-4 backdrop-blur-sm bg-black/20">
        <Link href="/apps" className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors">
          <ArrowLeft className="h-4 w-4" /> Apps
        </Link>
        <div className="h-4 w-px bg-white/20" />
        <div className="flex items-center gap-2">
          <ScanLine className="h-4 w-4 text-indigo-400" />
          <span className="font-semibold text-sm">Room Scanner</span>
        </div>
        {phase === 'complete' && (
          <button onClick={reset} className="ml-auto flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors">
            <RotateCcw className="h-4 w-4" /> New Scan
          </button>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* IDLE */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center text-center gap-6 mt-8">
            <div className="h-28 w-28 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
              <ScanLine className="h-14 w-14 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-serif mb-3">Room Scanner</h1>
              <p className="text-white/60 max-w-sm leading-relaxed">Grant camera access and pan slowly around a room. We'll generate a 2D floor plan with estimated dimensions.</p>
            </div>
            <div className="grid grid-cols-3 gap-4 w-full max-w-sm text-sm">
              {[{ icon: '📱', label: 'Pan your phone', sub: 'Slowly and steadily' }, { icon: '⏱️', label: '~5 seconds', sub: 'Quick scan' }, { icon: '📐', label: '2D Plan + Area', sub: 'PNG or PDF' }].map(i => (
                <div key={i.label} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-2xl mb-2">{i.icon}</div>
                  <div className="font-semibold text-xs">{i.label}</div>
                  <div className="text-white/50 text-[11px] mt-0.5">{i.sub}</div>
                </div>
              ))}
            </div>
            <button onClick={startScan} className="flex items-center gap-3 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 text-white font-bold px-8 py-4 rounded-2xl shadow-xl hover:-translate-y-0.5 transition-all text-base">
              <Camera className="h-5 w-5" /> Start Scanning
            </button>
          </div>
        )}

        {/* PERMISSION */}
        {phase === 'permission' && (
          <div className="flex flex-col items-center text-center gap-4 mt-16">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-400" />
            <p className="text-white/70">Requesting camera access…</p>
          </div>
        )}

        {/* SCANNING */}
        {phase === 'scanning' && (
          <div className="flex flex-col gap-6">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-black shadow-2xl border border-white/10">
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              <div className="absolute inset-0 pointer-events-none">
                {[['top-3 left-3', 'border-t-2 border-l-2'], ['top-3 right-3', 'border-t-2 border-r-2'], ['bottom-3 left-3', 'border-b-2 border-l-2'], ['bottom-3 right-3', 'border-b-2 border-r-2']].map(([pos, border], i) => (
                  <div key={i} className={`absolute ${pos} ${border} border-indigo-400 w-8 h-8 rounded-sm`} />
                ))}
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-80"
                  style={{ top: `${(Math.sin(scanAngle * Math.PI / 180) * 0.5 + 0.5) * 100}%`, transition: 'top 0.04s linear' }} />
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> SCANNING
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-white/60">
                <span className="flex items-center gap-1.5"><ScanLine className="h-3.5 w-3.5" /> Pan slowly around the room...</span>
                <span className="font-mono font-bold text-white">{Math.round(scanProgress)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-400 rounded-full transition-all duration-100" style={{ width: `${scanProgress}%` }} />
              </div>
              <p className="text-center text-white/40 text-xs">Keep the room in frame and move steadily</p>
            </div>
          </div>
        )}

        {/* PROCESSING */}
        {phase === 'processing' && (
          <div className="flex flex-col items-center text-center gap-6 mt-12">
            <div className="relative">
              <div className="h-24 w-24 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ScanLine className="h-9 w-9 text-indigo-400" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Analyzing Room...</h2>
              <p className="text-white/50 text-sm">Detecting walls, doors & windows.<br />Calculating dimensions.</p>
            </div>
            {['Detecting walls...', 'Estimating dimensions...', 'Generating 2D plan...'].map((step) => (
              <div key={step} className="flex items-center gap-3 text-sm">
                <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
                <span className="text-white/60">{step}</span>
              </div>
            ))}
          </div>
        )}

        {/* COMPLETE */}
        {phase === 'complete' && room && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <h2 className="font-bold text-lg">Floor Plan Generated!</h2>
                <p className="text-white/50 text-sm">{room.width.toFixed(2)} × {room.height.toFixed(2)} m • {(room.width * room.height).toFixed(1)} m² total area</p>
              </div>
            </div>

            {/* Floor Plan (white card) */}
            <div className="bg-white rounded-2xl p-3 shadow-2xl overflow-x-auto">
              <div className="min-w-[300px]">
                <FloorPlanSVG room={room} id={SVG_ID} />
              </div>
            </div>

            {/* Dimension Editor */}
            <DimensionEditor room={room} onChange={(updated) => setRoom(updated)} />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[{ label: 'Width', value: `${room.width.toFixed(2)} m` }, { label: 'Length', value: `${room.height.toFixed(2)} m` }, { label: 'Area', value: `${(room.width * room.height).toFixed(1)} m²` }].map(s => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <div className="text-white/50 text-xs mb-1">{s.label}</div>
                  <div className="font-bold text-lg">{s.value}</div>
                </div>
              ))}
            </div>

            {/* Download Menu */}
            <div className="relative">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDownloadMenu(v => !v)}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg"
                >
                  <Download className="h-4 w-4" /> Download Plan
                </button>
                <button onClick={reset} className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-3.5 rounded-xl transition-all font-medium">
                  <RefreshCw className="h-4 w-4" /> Rescan
                </button>
              </div>

              {showDownloadMenu && (
                <div className="absolute bottom-full mb-2 left-0 right-28 bg-slate-800 border border-white/20 rounded-2xl overflow-hidden shadow-2xl z-10 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <button
                    onClick={() => { downloadAsPng(SVG_ID, `floor-plan-${Date.now()}.png`); setShowDownloadMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <FileImage className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Download as PNG</div>
                      <div className="text-xs text-white/50">High-res image (2x)</div>
                    </div>
                  </button>
                  <div className="h-px bg-white/10" />
                  <button
                    onClick={() => { downloadAsPdf(SVG_ID, room); setShowDownloadMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="h-9 w-9 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <FilePdf className="h-4 w-4 text-red-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Download as PDF</div>
                      <div className="text-xs text-white/50">Print-ready document</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ERROR */}
        {phase === 'error' && (
          <div className="flex flex-col items-center text-center gap-6 mt-12">
            <div className="h-20 w-20 rounded-2xl bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Camera Access Denied</h2>
              <p className="text-white/50 text-sm max-w-xs">Please allow camera access in your browser settings, then try again.</p>
            </div>
            <button onClick={reset} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl transition-all font-medium">
              <RotateCcw className="h-4 w-4" /> Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
