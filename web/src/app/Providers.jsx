'use client';

import ToastProvider from './components/ToastProvider';
import AuthGuard from './components/AuthGuard';

export default function Providers({ children }) {
  return (
    <>
      <ToastProvider />
      <AuthGuard>{children}</AuthGuard>
    </>
  );
}
