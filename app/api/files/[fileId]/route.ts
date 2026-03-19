import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import connectDB from '@/lib/mongodb';
import FileEntry from '@/models/FileEntry';
import Room from '@/models/Room';
import { pusherServer } from '@/lib/pusher';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  try {
    const { fileId } = await params;
    const { hostId } = await req.json();

    const fileEntry = await FileEntry.findById(fileId);
    if (!fileEntry) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const room = await Room.findOne({ roomCode: fileEntry.roomCode });
    if (!room || room.hostId !== hostId) {
      return NextResponse.json({ error: 'Only the host can delete files' }, { status: 403 });
    }

    await del(fileEntry.fileUrl);
    await FileEntry.deleteOne({ _id: fileId });

    await pusherServer.trigger(`room-${fileEntry.roomCode}`, 'file-deleted', {
      fileId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
