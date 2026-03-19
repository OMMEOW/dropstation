'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

export interface ChatMessage {
  _id: string;
  userId: string;
  user: string;
  color: string;
  text: string;
  timestamp: string;
}

interface ChatProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSend: (text: string) => void;
}

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Chat({ messages, currentUserId, onSend }: ChatProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Chat</span>
      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-slate-600 py-4">No messages yet. Say hi! 👋</p>
        ) : (
          messages.map(msg => (
            <div
              key={msg._id}
              className={`flex gap-2 ${msg.userId === currentUserId ? 'flex-row-reverse' : ''}`}
            >
              <div
                className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-black"
                style={{ background: msg.color }}
              >
                {msg.user[0]}
              </div>
              <div className={`max-w-[75%] ${msg.userId === currentUserId ? 'items-end' : 'items-start'} flex flex-col`}>
                <span className="text-[10px] text-slate-500 mb-0.5">{msg.user} · {formatTime(msg.timestamp)}</span>
                <div
                  className={`rounded-xl px-3 py-1.5 text-xs break-words ${
                    msg.userId === currentUserId
                      ? 'rounded-tr-sm text-black font-medium'
                      : 'bg-[#1e293b] rounded-tl-sm text-slate-200'
                  }`}
                  style={msg.userId === currentUserId ? { background: msg.color } : {}}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      {/* Input */}
      <div className="flex items-center gap-2 mt-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          placeholder="Type a message..."
          className="flex-1 bg-[#111827] border border-[#1e3a5f] rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="w-8 h-8 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        >
          <Send size={13} className="text-black" />
        </button>
      </div>
    </div>
  );
}
