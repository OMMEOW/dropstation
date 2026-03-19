import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRoom extends Document {
  roomCode: string;
  createdAt: Date;
  lastActiveAt: Date;
  hostId: string;
  canvasState: string;
  notes: string;
  isLocked: boolean;
}

const RoomSchema = new Schema<IRoom>({
  roomCode: { type: String, required: true, unique: true, lowercase: true, trim: true },
  createdAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now },
  hostId: { type: String, required: true },
  canvasState: { type: String, default: '' },
  notes: { type: String, default: '' },
  isLocked: { type: Boolean, default: false },
});

// TTL index: auto-delete after 24h of inactivity
RoomSchema.index({ lastActiveAt: 1 }, { expireAfterSeconds: 86400 });

const Room: Model<IRoom> = mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);
export default Room;
