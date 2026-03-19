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
    const { hostId } = await req.json();

    const room = await Room.findOne({ roomCode: roomCode.toLowerCase() });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.hostId !== hostId) {
      return NextResponse.json({ error: 'Only the host can toggle lock' }, { status: 403 });
    }

    room.isLocked = !room.isLocked;
    room.lastActiveAt = new Date();
    await room.save();

    await pusherServer.trigger(`room-${roomCode}`, 'room-locked', {
      isLocked: room.isLocked,
    });

    return NextResponse.json({ isLocked: room.isLocked });
  } catch (error) {
    console.error('Toggle lock error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
