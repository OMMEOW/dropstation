'use client';

import React from 'react';
import { Users } from 'lucide-react';

export interface UserPresence {
  userId: string;
  userName: string;
  color: string;
  isDrawing?: boolean;
}

interface PresenceProps {
  users: UserPresence[];
}

export default function Presence({ users }: PresenceProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Users size={13} className="text-slate-400" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Online
        </span>
        <span className="ml-auto bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
          {users.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {users.map(user => (
          <div
            key={user.userId}
            className="flex items-center gap-1.5 bg-[#111827] rounded-full px-2.5 py-1 border border-[#1e3a5f] transition-all"
            title={user.userName}
          >
            <div className="relative w-2.5 h-2.5 rounded-full shrink-0" style={{ background: user.color }}>
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-60"
                style={{ background: user.color }}
              />
            </div>
            <span className="text-xs text-slate-300 max-w-[80px] truncate">{user.userName}</span>
            {user.isDrawing && (
              <span className="text-[10px] text-cyan-400 animate-pulse">✏️</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
