"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/auth";
import { useIsMobile } from "@/hooks/use-mobile";

export default function FinancasPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className={`text-center p-8 bg-white rounded-xl shadow-lg border border-gray-200 max-w-md w-full ${isMobile ? 'mx-2' : 'mx-4'}`}>
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 mb-6">
          <svg
            className="h-10 w-10 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 mb-4`}>Em Desenvolvimento</h1>
        <p className={`text-gray-600 mb-8 ${isMobile ? 'text-base' : 'text-lg'}`}>
          {user ? `Olá ${user.name}, e` : 'E'}stamos trabalhando para trazer recursos financeiros incríveis para o seu negócio. Volte em breve!
        </p>
        <Link
          href="/"
          className={`inline-flex items-center ${isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3 text-base'} border border-transparent font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200`}
        >
          Voltar para página principal
        </Link>
      </div>
    </div>
  );
}
