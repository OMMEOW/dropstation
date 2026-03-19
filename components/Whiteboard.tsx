'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Download, Trash2, Undo2, Redo2, Lock, Unlock } from 'lucide-react';

type Tool = 'pen' | 'eraser' | 'rect' | 'circle' | 'line' | 'text';

interface Point { x: number; y: number }
interface Stroke {
  tool: Tool;
  points: Point[];
  color: string;
  size: number;
  text?: string;
}

interface WhiteboardProps {
  roomCode: string;
  isHost: boolean;
  isLocked: boolean;
  userId: string;
  externalCanvasState?: string;
  onCanvasChange: (state: string) => void;
  onToggleLock: () => void;
}

export default function Whiteboard({
  roomCode,
  isHost,
  isLocked,
  userId,
  externalCanvasState,
  onCanvasChange,
  onToggleLock,
}: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#06b6d4');
  const [size, setSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [snapshot, setSnapshot] = useState<ImageData | null>(null);
  const [pendingText, setPendingText] = useState('');
  const [textPos, setTextPos] = useState<Point | null>(null);
  const ignoreExternalRef = useRef(false);

  const getCtx = () => canvasRef.current?.getContext('2d') ?? null;

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getCtx();
    const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    if (imageData) ctx?.putImageData(imageData, 0, 0);
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // Load external canvas state (from other users)
  useEffect(() => {
    if (!externalCanvasState || !canvasRef.current) return;
    if (ignoreExternalRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = externalCanvasState;
  }, [externalCanvasState]);

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    setHistory(prev => [...prev.slice(-19), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    setRedoStack([]);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (isLocked && !isHost) return;
    if (tool === 'text') return;
    const ctx = getCtx();
    if (!ctx) return;
    saveHistory();
    const pos = getPos(e);
    setIsDrawing(true);
    setStartPoint(pos);
    setSnapshot(ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height));
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if (isLocked && !isHost) return;
    const ctx = getCtx();
    if (!ctx || !canvasRef.current) return;
    const pos = getPos(e);

    ctx.strokeStyle = tool === 'eraser' ? '#0f172a' : color;
    ctx.lineWidth = tool === 'eraser' ? size * 5 : size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else {
      // Restore snapshot for shape preview
      if (snapshot) ctx.putImageData(snapshot, 0, 0);
      ctx.beginPath();
      if (tool === 'rect' && startPoint) {
        ctx.strokeRect(startPoint.x, startPoint.y, pos.x - startPoint.x, pos.y - startPoint.y);
      } else if (tool === 'circle' && startPoint) {
        const rx = Math.abs(pos.x - startPoint.x) / 2;
        const ry = Math.abs(pos.y - startPoint.y) / 2;
        const cx = startPoint.x + (pos.x - startPoint.x) / 2;
        const cy = startPoint.y + (pos.y - startPoint.y) / 2;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (tool === 'line' && startPoint) {
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
    }
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    // Emit canvas state
    ignoreExternalRef.current = true;
    const dataUrl = canvasRef.current?.toDataURL() ?? '';
    onCanvasChange(dataUrl);
    setTimeout(() => { ignoreExternalRef.current = false; }, 500);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (tool !== 'text' || isLocked && !isHost) return;
    const pos = getPos(e);
    setTextPos(pos);
    setPendingText('');
  };

  const commitText = () => {
    if (!textPos || !pendingText.trim()) { setTextPos(null); return; }
    const ctx = getCtx();
    if (!ctx) return;
    saveHistory();
    ctx.font = `${size * 6}px Inter, sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(pendingText, textPos.x, textPos.y);
    setTextPos(null);
    setPendingText('');
    ignoreExternalRef.current = true;
    onCanvasChange(canvasRef.current?.toDataURL() ?? '');
    setTimeout(() => { ignoreExternalRef.current = false; }, 500);
  };

  const undo = useCallback(() => {
    const ctx = getCtx();
    if (!ctx || !canvasRef.current) return;
    if (history.length === 0) { ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); return; }
    const prev = history[history.length - 1];
    setRedoStack(r => [...r, ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height)]);
    ctx.putImageData(prev, 0, 0);
    setHistory(h => h.slice(0, -1));
    ignoreExternalRef.current = true;
    onCanvasChange(canvasRef.current.toDataURL());
    setTimeout(() => { ignoreExternalRef.current = false; }, 500);
  }, [history, onCanvasChange]);

  const redo = useCallback(() => {
    const ctx = getCtx();
    if (!ctx || !canvasRef.current || redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory(h => [...h, ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height)]);
    ctx.putImageData(next, 0, 0);
    setRedoStack(r => r.slice(0, -1));
    ignoreExternalRef.current = true;
    onCanvasChange(canvasRef.current.toDataURL());
    setTimeout(() => { ignoreExternalRef.current = false; }, 500);
  }, [redoStack, onCanvasChange]);

  const clearCanvas = () => {
    if (!isHost) return;
    const ctx = getCtx();
    if (!ctx || !canvasRef.current) return;
    saveHistory();
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ignoreExternalRef.current = true;
    onCanvasChange(canvasRef.current.toDataURL());
    setTimeout(() => { ignoreExternalRef.current = false; }, 500);
  };

  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `dropboard-${roomCode}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const tools: { id: Tool; label: string; icon: string }[] = [
    { id: 'pen', label: 'Pen', icon: '✏️' },
    { id: 'eraser', label: 'Eraser', icon: '🧹' },
    { id: 'rect', label: 'Rectangle', icon: '▭' },
    { id: 'circle', label: 'Circle', icon: '○' },
    { id: 'line', label: 'Line', icon: '╱' },
    { id: 'text', label: 'Text', icon: 'T' },
  ];

  const canDraw = !isLocked || isHost;

  return (
    <div className="flex flex-col h-full bg-[#0a0f1e]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-[#1e3a5f] bg-[#0d1626]">
        {/* Tool buttons */}
        <div className="flex gap-1 bg-[#111827] rounded-lg p-1">
          {tools.map(t => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              title={t.label}
              className={`w-9 h-9 rounded-md text-sm font-bold transition-all ${
                tool === t.id
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#1e293b]'
              }`}
            >
              {t.icon}
            </button>
          ))}
        </div>

        {/* Color picker */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Color</label>
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-2 border-[#1e3a5f] bg-transparent"
          />
        </div>

        {/* Stroke size */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Size</label>
          <input
            type="range"
            min={1}
            max={20}
            value={size}
            onChange={e => setSize(Number(e.target.value))}
            className="w-20 accent-cyan-400"
          />
          <span className="text-xs text-slate-400 w-4">{size}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={undo} title="Undo (Ctrl+Z)" className="toolbar-btn">
            <Undo2 size={15} />
          </button>
          <button onClick={redo} title="Redo (Ctrl+Y)" className="toolbar-btn">
            <Redo2 size={15} />
          </button>
          {isHost && (
            <>
              <button onClick={onToggleLock} title={isLocked ? 'Unlock canvas' : 'Lock canvas'} className={`toolbar-btn ${isLocked ? 'text-amber-400' : ''}`}>
                {isLocked ? <Lock size={15} /> : <Unlock size={15} />}
              </button>
              <button onClick={clearCanvas} title="Clear canvas" className="toolbar-btn text-red-400 hover:text-red-300">
                <Trash2 size={15} />
              </button>
            </>
          )}
          <button onClick={exportPNG} title="Export as PNG" className="toolbar-btn text-emerald-400 hover:text-emerald-300">
            <Download size={15} />
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="relative flex-1 overflow-hidden">
        {!canDraw && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 rounded-full px-4 py-2 text-amber-300 text-sm font-medium backdrop-blur-sm">
              <Lock size={14} />
              Room locked — view only
            </div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className={`w-full h-full ${canDraw ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
          style={{ background: 'transparent' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          onClick={handleCanvasClick}
        />
        {/* Text input overlay */}
        {textPos && (
          <input
            autoFocus
            type="text"
            value={pendingText}
            onChange={e => setPendingText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commitText(); if (e.key === 'Escape') setTextPos(null); }}
            onBlur={commitText}
            style={{
              position: 'absolute',
              left: textPos.x,
              top: textPos.y - 20,
              background: 'rgba(0,0,0,0.5)',
              border: `1px solid ${color}`,
              color,
              fontSize: `${size * 6}px`,
              outline: 'none',
              padding: '2px 4px',
              borderRadius: 4,
              minWidth: 80,
            }}
          />
        )}
      </div>
    </div>
  );
}
