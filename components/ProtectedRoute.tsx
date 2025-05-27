"use client";

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Removida a lógica de verificação de token e redirecionamento
  return <>{children}</>;
}
