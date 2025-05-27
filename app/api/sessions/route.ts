import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Fazer a requisição para a API externa
    const response = await fetch('https://api.linkcallendar.com/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    // Obter os dados da resposta
    const data = await response.json();
    
    // Retornar a resposta
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Erro ao processar login:', error);
    return NextResponse.json(
      { message: 'Erro ao processar login' },
      { status: 500 }
    );
  }
}
