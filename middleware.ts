import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Permite todo o tráfego sem restrições de autenticação
  return NextResponse.next()
}

// Configuração vazia para desativar o middleware em todas as rotas
export const config = {
  matcher: []
}