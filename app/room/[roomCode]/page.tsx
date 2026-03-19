'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { QrCode, LogOut, ChevronDown, ChevronUp, Crown, Files, MessageSquare, StickyNote, Users } from 'lucide-react';

import type { FileEntry } from '@/components/FileDropZone';
import type { ChatMessage } from '@/components/Chat';
import type { UserPresence } from '@/components/Presence';
import { getUseridentity } from '@/lib/names';
import { getPusherClient } from '@/lib/pusher';

// Dynamic imports to avoid SSR issues
const Whiteboard = dynamic(() => import('@/components/Whiteboard'), { ssr: false });
const FileDropZone = dynamic(() => import('@/components/FileDropZone'), { ssr: false });
const Notes = dynamic(() => import('@/components/Notes'), { ssr: false });
const Chat = dynamic(() => import('@/components/Chat'), { ssr: false });
const Presence = dynamic(() => import('@/components/Presence'), { ssr: false });
const QRModal = dynamic(() => import('@/components/QRModal'), { ssr: false });

type SidebarTab = 'files' | 'notes' | 'chat';

interface RoomData {
  roomCode: string;
  hostId: string;
  canvasState: string;
  notes: string;
  isLocked: boolean;
}

// Simple confetti trigger
async function triggerConfetti() {
  const confetti = (await import('canvas-confetti')).default;
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#06b6d4', '#a855f7', '#f59e0b', '#10b981'],
  });
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params.roomCode as string).toLowerCase();

  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notes, setNotes] = useState('');
  const [canvasState, setCanvasState] = useState('');
  const [activeTab, setActiveTab] = useState<SidebarTab>('files');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [roomUrl, setRoomUrl] = useState('');

  const notesDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const canvasDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const userRef = useRef<{ id: string; name: string; color: string }>({ id: '', name: '', color: '' });

  // Initialize user
  useEffect(() => {
    setRoomUrl(window.location.href);
    const identity = getUseridentity();
    userRef.current = identity;
  }, []);

  // Create/join room and fetch initial data
  useEffect(() => {
    const init = async () => {
      const identity = getUseridentity();

      // Create or join room
      const createRes = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, hostId: identity.id }),
      });
      const createData = await createRes.json();

      setRoom(createData.room);
      setIsHost(createData.isHost);
      setIsLocked(createData.room?.isLocked ?? false);

      // Check localStorage host flag as fallback
      const storedHostId = localStorage.getItem(`dropboard-host-${roomCode}`);
      if (createData.isHost || storedHostId === identity.id) {
        setIsHost(true);
        localStorage.setItem(`dropboard-host-${roomCode}`, identity.id);
      }

      // Fetch full room data
      const roomRes = await fetch(`/api/rooms/${roomCode}`);
      if (roomRes.ok) {
        const roomData = await roomRes.json();
        setFiles(roomData.files);
        setMessages(roomData.messages);
        setNotes(roomData.room.notes || '');
        setCanvasState(roomData.room.canvasState || '');
        setIsLocked(roomData.room.isLocked || false);
      }

      // Announce presence
      await fetch(`/api/rooms/${roomCode}/presence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: identity.id,
          userName: identity.name,
          color: identity.color,
        }),
      });

      // Add self to online users
      setOnlineUsers([{ userId: identity.id, userName: identity.name, color: identity.color }]);

      setLoading(false);

      if (createData.created) {
        triggerConfetti();
        toast.success(`Room "${roomCode}" created! You're the host.`, { duration: 4000 });
      } else {
        toast(`Joined room "${roomCode}"`, { icon: '🚪', duration: 3000 });
      }
    };

    init().catch(() => {
      toast.error('Failed to connect to room');
      setLoading(false);
    });
  }, [roomCode]);

  // Pusher real-time subscriptions
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`room-${roomCode}`);

    channel.bind('canvas-update', (data: { canvasState: string; updatedBy: string }) => {
      if (data.updatedBy !== userRef.current.id) {
        setCanvasState(data.canvasState);
      }
    });

    channel.bind('file-added', (file: FileEntry) => {
      setFiles(prev => [file, ...prev]);
      toast.success(`${file.uploadedBy} uploaded "${file.fileName}"`, { icon: '📎' });
    });

    channel.bind('file-deleted', (data: { fileId: string }) => {
      setFiles(prev => prev.filter(f => f._id !== data.fileId));
    });

    channel.bind('notes-update', (data: { notes: string; updatedBy: string }) => {
      if (data.updatedBy !== userRef.current.id) {
        setNotes(data.notes);
      }
    });

    channel.bind('chat-message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    channel.bind('user-joined', (data: { userId: string; userName: string; color: string }) => {
      if (data.userId !== userRef.current.id) {
        setOnlineUsers(prev => {
          const exists = prev.find(u => u.userId === data.userId);
          if (exists) return prev;
          triggerConfetti();
          toast(`${data.userName} joined!`, { icon: '👋', duration: 3000 });
          return [...prev, { userId: data.userId, userName: data.userName, color: data.color }];
        });
      }
    });

    channel.bind('room-locked', (data: { isLocked: boolean }) => {
      setIsLocked(data.isLocked);
      toast(data.isLocked ? '🔒 Host locked the canvas' : '🔓 Canvas unlocked', { duration: 3000 });
    });

    return () => {
      pusher.unsubscribe(`room-${roomCode}`);
    };
  }, [roomCode]);

  // Notes debounced save
  const handleNotesChange = useCallback((text: string) => {
    setNotes(text);
    clearTimeout(notesDebounceRef.current);
    notesDebounceRef.current = setTimeout(async () => {
      await fetch(`/api/rooms/${roomCode}/save-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: text, userId: userRef.current.id }),
      });
    }, 800);
  }, [roomCode]);

  // Canvas debounced save
  const handleCanvasChange = useCallback((state: string) => {
    clearTimeout(canvasDebounceRef.current);
    canvasDebounceRef.current = setTimeout(async () => {
      await fetch(`/api/rooms/${roomCode}/save-canvas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvasState: state, hostId: userRef.current.id }),
      });
    }, 300);
  }, [roomCode]);

  const handleToggleLock = useCallback(async () => {
    if (!isHost) return;
    await fetch(`/api/rooms/${roomCode}/toggle-lock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostId: userRef.current.id, userId: userRef.current.id }),
    });
  }, [roomCode, isHost]);

  const handleSendChat = useCallback(async (text: string) => {
    const user = userRef.current;
    await fetch(`/api/rooms/${roomCode}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, user: user.name, color: user.color, text }),
    });
  }, [roomCode]);

  const handleFileAdded = useCallback((file: FileEntry) => {
    setFiles(prev => [file, ...prev]);
  }, []);

  const handleFileDeleted = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f._id !== fileId));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Connecting to room <strong className="text-cyan-400">{roomCode}</strong>...</p>
        </div>
      </div>
    );
  }

  const sidebarTabs = [
    { id: 'files' as SidebarTab, icon: <Files size={15} />, label: 'Files', badge: files.length },
    { id: 'notes' as SidebarTab, icon: <StickyNote size={15} />, label: 'Notes' },
    { id: 'chat' as SidebarTab, icon: <MessageSquare size={15} />, label: 'Chat', badge: messages.length },
  ];

  return (
    <div className="h-screen bg-[#0a0f1e] flex flex-col overflow-hidden">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#0d1626', color: '#e2e8f0', border: '1px solid #1e3a5f', fontSize: 13 },
          success: { iconTheme: { primary: '#06b6d4', secondary: '#0a0f1e' } },
        }}
      />

      {/* QR Modal */}
      {showQR && <QRModal url={roomUrl} onClose={() => setShowQR(false)} />}

      {/* Top nav */}
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-[#1e3a5f] bg-[#0d1626] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-cyan-400 to-violet-500 rounded-lg flex items-center justify-center text-xs font-black text-black">
            D
          </div>
          <span className="font-bold text-white text-sm">DropBoard</span>
        </div>

        <div className="h-4 w-px bg-[#1e3a5f]" />

        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs">Room</span>
          <code className="bg-[#111827] border border-[#1e3a5f] rounded-md px-2 py-0.5 text-cyan-400 text-xs font-mono font-semibold">
            {roomCode}
          </code>
          {isHost && (
            <span className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
              <Crown size={10} /> Host
            </span>
          )}
          {isLocked && (
            <span className="bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
              🔒 Locked
            </span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Online count */}
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            {onlineUsers.length} online
          </div>

          <button
            onClick={() => setShowQR(true)}
            className="p-2 rounded-lg bg-[#111827] border border-[#1e3a5f] text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
            title="QR Code"
          >
            <QrCode size={15} />
          </button>

          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-lg bg-[#111827] border border-[#1e3a5f] text-slate-400 hover:text-red-400 hover:border-red-500/40 transition-all"
            title="Leave room"
          >
            <LogOut size={15} />
          </button>

          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="md:hidden p-2 rounded-lg bg-[#111827] border border-[#1e3a5f] text-slate-400"
          >
            {sidebarOpen ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 overflow-hidden relative" style={{ background: 'radial-gradient(ellipse at 50% 0%, #0f2040 0%, #0a0f1e 70%)' }}>
          <Whiteboard
            roomCode={roomCode}
            isHost={isHost}
            isLocked={isLocked}
            userId={userRef.current.id}
            externalCanvasState={canvasState}
            onCanvasChange={handleCanvasChange}
            onToggleLock={handleToggleLock}
          />
        </div>

        {/* Sidebar */}
        <div className={`
          w-80 shrink-0 flex flex-col border-l border-[#1e3a5f] bg-[#0d1626] transition-all duration-300 ease-in-out
          md:relative md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          absolute right-0 top-0 bottom-0 z-20 md:z-auto
        `}>
          {/* Presence */}
          <div className="px-4 pt-3 pb-3 border-b border-[#1e3a5f]">
            <Presence users={onlineUsers} />
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#1e3a5f]">
            {sidebarTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="bg-cyan-500/20 text-cyan-400 text-[10px] rounded-full px-1.5 py-0.5 font-bold">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden p-3">
            {activeTab === 'files' && (
              <FileDropZone
                roomCode={roomCode}
                userId={userRef.current.id}
                userName={userRef.current.name}
                userColor={userRef.current.color}
                isHost={isHost}
                files={files}
                onFileAdded={handleFileAdded}
                onFileDeleted={handleFileDeleted}
                hostId={room?.hostId ?? ''}
              />
            )}
            {activeTab === 'notes' && (
              <Notes value={notes} onChange={handleNotesChange} />
            )}
            {activeTab === 'chat' && (
              <Chat
                messages={messages}
                currentUserId={userRef.current.id}
                onSend={handleSendChat}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
