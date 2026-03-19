import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
  roomCode: string;
  userId: string;
  user: string;
  color: string;
  text: string;
  timestamp: Date;
}

const MessageSchema = new Schema<IMessage>({
  roomCode: { type: String, required: true, lowercase: true },
  userId: { type: String, required: true },
  user: { type: String, required: true },
  color: { type: String, default: '#06b6d4' },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
export default Message;
