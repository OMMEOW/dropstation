import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import connectDB from '@/lib/mongodb';
import FileEntry from '@/models/FileEntry';
import Room from '@/models/Room';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const roomCode = formData.get('roomCode') as string;
    const uploadedBy = formData.get('uploadedBy') as string;
    const uploaderColor = formData.get('uploaderColor') as string;

    if (!file || !roomCode || !uploadedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 413 });
    }

    const blob = await put(`dropboard/${roomCode}/${Date.now()}-${file.name}`, file, {
      access: 'public',
    });

    const fileEntry = await FileEntry.create({
      roomCode: roomCode.toLowerCase(),
      fileName: file.name,
      fileUrl: blob.url,
      fileSize: file.size,
      fileType: file.type,
      uploadedBy,
      uploaderColor: uploaderColor || '#06b6d4',
    });

    await Room.updateOne(
      { roomCode: roomCode.toLowerCase() },
      { lastActiveAt: new Date() }
    );

    await pusherServer.trigger(`room-${roomCode}`, 'file-added', {
      _id: fileEntry._id.toString(),
      roomCode: fileEntry.roomCode,
      fileName: fileEntry.fileName,
      fileUrl: fileEntry.fileUrl,
      fileSize: fileEntry.fileSize,
      fileType: fileEntry.fileType,
      uploadedBy: fileEntry.uploadedBy,
      uploaderColor: fileEntry.uploaderColor,
      uploadedAt: fileEntry.uploadedAt,
    });

    return NextResponse.json({ fileEntry }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
