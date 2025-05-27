import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Obter o company_id do cabeçalho da requisição ou usar um valor padrão
    const url = new URL(request.url);
    const companyId = url.searchParams.get('company_id') || '1';
    
    // Fazer a requisição para a API externa
    const response = await fetch('https://api.linkcallendar.com/clients', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'company-id': companyId
      }
    });
    
    // Verificar se a resposta foi bem-sucedida
    if (!response.ok) {
      return NextResponse.json(
        { message: `Erro ao buscar clientes: ${response.status}` },
        { status: response.status }
      );
    }
    
    // Obter os dados da resposta
    const data = await response.json();
    
    // Retornar a resposta
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar clientes' },
      { status: 500 }
    );
  }
}
