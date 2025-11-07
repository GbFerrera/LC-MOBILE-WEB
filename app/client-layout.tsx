"use client";

import { AuthProvider } from "@/hooks/auth";
import { Toaster } from "sonner";

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      {children}
      <Toaster 
        position="top-center"
        richColors={true}
        expand={true}
        closeButton={true}
        theme="light"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'white',
            color: 'black',
            border: '1px solid #ccc',
          },
        }}
      />
    </AuthProvider>
  );
}
