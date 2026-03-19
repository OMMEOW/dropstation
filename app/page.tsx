'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowRight, Layers, Zap, Shield, Users } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEnter = (e: React.FormEvent) => {
    e.preventDefault();
    const code = roomCode.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!code) {
      toast.error('Enter a room code');
      return;
    }
    if (code.length < 2) {
      toast.error('Room code must be at least 2 characters');
      return;
    }
    setLoading(true);
    router.push(`/room/${code}`);
  };

  const handleRandom = () => {
    const words = ['neon', 'drop', 'board', 'flux', 'sync', 'node', 'edge', 'beam', 'volt', 'spark'];
    const num = Math.floor(Math.random() * 9000) + 1000;
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    setRoomCode(`${pick(words)}-${pick(words)}-${num}`);
  };

  const features = [
    { icon: <Layers size={20} />, title: 'Interactive Whiteboard', desc: 'Draw, sketch and collaborate live with pen, shapes, and text tools.' },
    { icon: <Zap size={20} />, title: 'Instant File Drop', desc: 'Drag & drop any file up to 50MB. Available to everyone in the room.' },
    { icon: <Users size={20} />, title: 'Live Presence', desc: "See who's in the room with real-time presence indicators and chat." },
    { icon: <Shield size={20} />, title: 'No Account Needed', desc: 'Just enter a room code. Rooms auto-expire after 24h.' },
  ];

  return (
    <main className="min-h-screen bg-[#0a0f1e] overflow-x-hidden">
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#0d1626', color: '#e2e8f0', border: '1px solid #1e3a5f', fontSize: 13 },
        }}
      />

      {/* Animated background grid */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(#06b6d420 1px, transparent 1px),
              linear-gradient(90deg, #06b6d420 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-violet-500 rounded-xl flex items-center justify-center text-black font-black text-base shadow-lg shadow-cyan-500/30">
            D
          </div>
          <span className="font-bold text-white text-lg tracking-tight">DropBoard</span>
        </div>
        <div className="text-xs text-slate-500 bg-[#0d1626] border border-[#1e3a5f] rounded-full px-3 py-1">
          Beta · No account required
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium rounded-full px-4 py-1.5 mb-6 animate-fadeIn">
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
          Real-time collaboration, zero friction
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tight mb-6 max-w-4xl">
          Your personal
          <span className="block bg-gradient-to-r from-cyan-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
            drop station
          </span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
          A shared whiteboard, file transfer station, and live notepad — all in one room.
          No accounts. No setup. Just a room code.
        </p>

        {/* Room code form */}
        <div className="w-full max-w-md">
          <form onSubmit={handleEnter} className="relative">
            <div className="flex items-center bg-[#0d1626] border-2 border-[#1e3a5f] focus-within:border-cyan-500/60 rounded-2xl overflow-hidden transition-all duration-200 focus-within:shadow-lg focus-within:shadow-cyan-500/10">
              <span className="pl-4 text-slate-500 text-sm font-mono">/room/</span>
              <input
                type="text"
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="my-board-42"
                className="flex-1 bg-transparent px-2 py-4 text-white font-mono text-sm outline-none placeholder-slate-600"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading}
                className="mr-2 flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                ) : (
                  <>Enter <ArrowRight size={15} /></>
                )}
              </button>
            </div>
          </form>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleRandom}
              className="flex-1 text-center text-xs text-slate-500 hover:text-cyan-400 transition-colors py-2 border border-[#1e3a5f] rounded-xl hover:border-cyan-500/30 bg-[#0d1626]"
            >
              🎲 Generate random code
            </button>
            <span className="text-slate-700 text-xs">or</span>
            <button
              onClick={() => {
                const code = `board-${Math.random().toString(36).slice(2, 8)}`;
                setRoomCode(code);
                setTimeout(() => router.push(`/room/${code}`), 100);
              }}
              className="flex-1 text-center text-xs text-slate-500 hover:text-violet-400 transition-colors py-2 border border-[#1e3a5f] rounded-xl hover:border-violet-500/30 bg-[#0d1626]"
            >
              ⚡ Quick start
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 md:px-12 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-[#0d1626] border border-[#1e3a5f] rounded-2xl p-5 hover:border-cyan-500/30 hover:bg-[#0f1f3a] transition-all duration-200 group"
              >
                <div className="w-9 h-9 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#1e3a5f] px-6 py-6 text-center text-xs text-slate-600">
        DropBoard — built with Next.js 14, MongoDB Atlas & Pusher.  Rooms expire after 24h of inactivity.
      </footer>
    </main>
  );
}
