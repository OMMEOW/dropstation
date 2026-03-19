import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFileEntry extends Document {
  roomCode: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploaderColor: string;
  uploadedAt: Date;
}

const FileEntrySchema = new Schema<IFileEntry>({
  roomCode: { type: String, required: true, lowercase: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileType: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  uploaderColor: { type: String, default: '#06b6d4' },
  uploadedAt: { type: Date, default: Date.now },
});

const FileEntry: Model<IFileEntry> =
  mongoose.models.FileEntry || mongoose.model<IFileEntry>('FileEntry', FileEntrySchema);
export default FileEntry;
