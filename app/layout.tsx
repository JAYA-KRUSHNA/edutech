import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EduTech — AI-Powered Learning Platform',
  description: 'Personalized AI-driven educational platform with 5 deep learning models for adaptive learning, performance prediction, and intelligent recommendations.',
  keywords: 'AI, deep learning, education, personalized learning, neural networks, EdTech',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#06080f" />
      </head>
      <body>
        <div className="animated-bg" />
        {children}
      </body>
    </html>
  );
}
