import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Room from '@/models/Room';
import FileEntry from '@/models/FileEntry';
import Message from '@/models/Message';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  try {
    const { roomCode } = await params;

    const room = await Room.findOne({ roomCode: roomCode.toLowerCase() });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const [files, messages] = await Promise.all([
      FileEntry.find({ roomCode: roomCode.toLowerCase() }).sort({ uploadedAt: -1 }),
      Message.find({ roomCode: roomCode.toLowerCase() }).sort({ timestamp: 1 }).limit(100),
    ]);

    return NextResponse.json({ room, files, messages });
  } catch (error) {
    console.error('Get room error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
