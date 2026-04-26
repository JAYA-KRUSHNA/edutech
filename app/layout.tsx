import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EduTech — AI-Powered Learning Platform',
  description: 'Personalized AI-driven educational platform with 5 deep learning models for adaptive learning, performance prediction, and intelligent recommendations.',
  keywords: 'AI, deep learning, education, personalized learning, neural networks, EdTech',
  openGraph: {
    title: 'EduTech — AI-Powered Learning Platform',
    description: 'Learn smarter with 5 neural networks: ANN classification, Autoencoder analysis, LSTM predictions, NCF recommendations, and NLP text analysis.',
    type: 'website',
    siteName: 'EduTech',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EduTech — AI-Powered Learning Platform',
    description: 'Learn smarter with 5 neural networks powering your education.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#06080f" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎓</text></svg>" />
      </head>
      <body>
        <div className="animated-bg" />
        {children}
      </body>
    </html>
  );
}
