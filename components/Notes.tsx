'use client';

import React, { useRef, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface NotesProps {
  value: string;
  onChange: (text: string) => void;
}

export default function Notes({ value, onChange }: NotesProps) {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shared Notes</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-[#1e293b] hover:bg-[#334155] text-slate-400 hover:text-slate-200 transition-all"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Type notes here... syncs live with everyone in the room."
        className="flex-1 w-full bg-[#0a0f1e] border border-[#1e3a5f] rounded-lg p-3 text-sm font-mono text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all leading-relaxed"
      />
    </div>
  );
}
