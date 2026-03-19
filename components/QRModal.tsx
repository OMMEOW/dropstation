'use client';

import React, { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';
import { X } from 'lucide-react';

interface QRModalProps {
  url: string;
  onClose: () => void;
}

export default function QRModal({ url, onClose }: QRModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, url, {
        width: 220,
        color: { dark: '#06b6d4', light: '#0a0f1e' },
        margin: 2,
      });
    }
  }, [url]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#0d1626] border border-[#1e3a5f] rounded-2xl p-6 flex flex-col items-center gap-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-sm font-semibold text-slate-200">Scan to join room</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <canvas ref={canvasRef} className="rounded-lg" />
        <p className="text-xs text-slate-500 text-center max-w-[220px] break-all">{url}</p>
      </div>
    </div>
  );
}
