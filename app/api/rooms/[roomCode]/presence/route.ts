import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Room from '@/models/Room';
import { pusherServer } from '@/lib/pusher';

export async function POST(
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
    const { userId, userName, color } = await req.json();

    const room = await Room.findOne({ roomCode: roomCode.toLowerCase() });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    await pusherServer.trigger(`room-${roomCode}`, 'user-joined', {
      userId,
      userName,
      color,
    });

    room.lastActiveAt = new Date();
    await room.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Presence error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
