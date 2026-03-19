import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DropBoard — Real-time Collaborative Whiteboard & File Station',
  description:
    'Share a whiteboard, drop files, and chat live — all in one room. No account required. Just enter a room code.',
  keywords: ['whiteboard', 'collaboration', 'file sharing', 'real-time', 'canvas'],
  openGraph: {
    title: 'DropBoard',
    description: 'Real-time collaborative whiteboard + file drop station',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
