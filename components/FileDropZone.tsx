'use client';

import React, { useCallback, useState } from 'react';
import { Upload, File, Image, FileText, Trash2, Download, X, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export interface FileEntry {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploaderColor: string;
  uploadedAt: string;
}

interface FileDropZoneProps {
  roomCode: string;
  userId: string;
  userName: string;
  userColor: string;
  isHost: boolean;
  files: FileEntry[];
  onFileAdded: (file: FileEntry) => void;
  onFileDeleted: (fileId: string) => void;
  hostId: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return <Image size={16} className="text-cyan-400" />;
  if (type === 'application/pdf') return <FileText size={16} className="text-red-400" />;
  return <File size={16} className="text-slate-400" />;
}

export default function FileDropZone({
  roomCode, userId, userName, userColor, isHost, files, onFileAdded, onFileDeleted, hostId
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<FileEntry | null>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File too large! Maximum size is 50MB');
      return;
    }

    setUploading(true);
    const toastId = toast.loading(`Uploading ${file.name}...`);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomCode', roomCode);
      formData.append('uploadedBy', userName);
      formData.append('uploaderColor', userColor);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      toast.success(`${file.name} uploaded!`, { id: toastId });
    } catch {
      toast.error('Upload failed', { id: toastId });
    } finally {
      setUploading(false);
    }
  }, [roomCode, userName, userColor]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(uploadFile);
  }, [uploadFile]);

  const handleDelete = async (fileId: string) => {
    if (!isHost) return;
    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId }),
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('File deleted');
    } catch {
      toast.error('Failed to delete file');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all duration-200 cursor-pointer group ${
          isDragging
            ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
            : 'border-[#1e3a5f] hover:border-cyan-500/50 hover:bg-cyan-500/5'
        }`}
      >
        <label className="cursor-pointer block">
          <input
            type="file"
            multiple
            className="hidden"
            onChange={e => Array.from(e.target.files ?? []).forEach(uploadFile)}
          />
          <Upload
            size={24}
            className={`mx-auto mb-2 transition-colors ${isDragging ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-500'}`}
          />
          <p className={`text-sm font-medium transition-colors ${isDragging ? 'text-cyan-300' : 'text-slate-400'}`}>
            {uploading ? 'Uploading...' : 'Drop files here or click to browse'}
          </p>
          <p className="text-xs text-slate-600 mt-1">Any file up to 50MB</p>
        </label>
        {uploading && (
          <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* File list */}
      <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1">
        {files.length === 0 ? (
          <p className="text-center text-xs text-slate-600 py-4">No files yet</p>
        ) : (
          files.map(file => (
            <div
              key={file._id}
              className="group flex items-center gap-2 bg-[#111827] hover:bg-[#1e293b] rounded-lg px-3 py-2 transition-all border border-transparent hover:border-[#1e3a5f]"
            >
              <div className="shrink-0">{getFileIcon(file.fileType)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">{file.fileName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-slate-500">{formatBytes(file.fileSize)}</span>
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: file.uploaderColor }}
                  >
                    {file.uploadedBy}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {file.fileType.startsWith('image/') && (
                  <button
                    onClick={() => setPreview(file)}
                    className="p-1.5 rounded hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 transition-colors"
                    title="Preview"
                  >
                    <Eye size={13} />
                  </button>
                )}
                <a
                  href={file.fileUrl}
                  download={file.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-colors"
                  title="Download"
                >
                  <Download size={13} />
                </a>
                {isHost && (
                  <button
                    onClick={() => handleDelete(file._id)}
                    className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Image preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-w-3xl max-h-[80vh] rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreview(null)}
              className="absolute top-2 right-2 z-10 bg-black/60 rounded-full p-1 text-white hover:text-red-400"
            >
              <X size={18} />
            </button>
            <img src={preview.fileUrl} alt={preview.fileName} className="max-h-[75vh] max-w-[80vw] object-contain" />
            <div className="bg-black/70 px-4 py-2 text-xs text-slate-300">{preview.fileName}</div>
          </div>
        </div>
      )}
    </div>
  );
}
