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
    const { notes, userId } = await req.json();

    const room = await Room.findOne({ roomCode: roomCode.toLowerCase() });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    room.notes = notes;
    room.lastActiveAt = new Date();
    await room.save();

    await pusherServer.trigger(`room-${roomCode}`, 'notes-update', {
      notes,
      updatedBy: userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save notes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
