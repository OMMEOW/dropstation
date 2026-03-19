import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Room from '@/models/Room';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  try {
    const { roomCode, hostId } = await req.json();

    if (!roomCode || !hostId) {
      return NextResponse.json({ error: 'roomCode and hostId are required' }, { status: 400 });
    }

    const code = roomCode.toLowerCase().trim();

    let room = await Room.findOne({ roomCode: code });

    if (room) {
      room.lastActiveAt = new Date();
      await room.save();
      return NextResponse.json({ room, isHost: room.hostId === hostId, created: false });
    }

    room = await Room.create({
      roomCode: code,
      hostId,
      canvasState: '',
      notes: '',
      isLocked: false,
    });

    return NextResponse.json({ room, isHost: true, created: true }, { status: 201 });
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
