'use client';
import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
        <Toaster
            position="bottom-right"
            toastOptions={{
                style: {
                background: '#333',
                color: '#fff',
                borderRadius: '10px',
                padding: '10px 16px',
                fontSize: '0.9rem',
                },
                success: { iconTheme: { primary: '#4ade80', secondary: '#1a1a1a' } },
                error: { iconTheme: { primary: '#f87171', secondary: '#1a1a1a' } },
            }}
        />
  );
}
