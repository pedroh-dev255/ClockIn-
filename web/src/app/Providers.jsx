'use client';

import ToastProvider from './components/ToastProvider';
import AuthGuard from './components/AuthGuard';
import ClarityInit from './ClarityInit';

export default function Providers({ children }) {
  return (
    <>
      <ClarityInit />
      <ToastProvider />
      <AuthGuard>{children}</AuthGuard>
    </>
  );
}
