import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Room from '@/models/Room';
import Message from '@/models/Message';
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
    const { userId, user, color, text } = await req.json();

    const room = await Room.findOne({ roomCode: roomCode.toLowerCase() });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const message = await Message.create({
      roomCode: roomCode.toLowerCase(),
      userId,
      user,
      color,
      text,
    });

    await pusherServer.trigger(`room-${roomCode}`, 'chat-message', {
      _id: message._id.toString(),
      userId,
      user,
      color,
      text,
      timestamp: message.timestamp,
    });

    room.lastActiveAt = new Date();
    await room.save();

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Chat message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
