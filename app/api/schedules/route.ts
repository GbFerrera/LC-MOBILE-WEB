import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Obter parâmetros da URL
    const url = new URL(request.url);
    const professionalId = url.searchParams.get('professionalId');
    const date = url.searchParams.get('date');
    const companyId = url.searchParams.get('company_id') || '1';
    
    if (!professionalId || !date) {
      return NextResponse.json(
        { message: 'Parâmetros professionalId e date são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Construir a URL para a API externa
    const apiUrl = `https://api.linkcallendar.com/schedules?professionalId=${professionalId}&date=${date}`;
    
    // Fazer a requisição para a API externa
    const response = await fetch(apiUrl, {
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
        { message: `Erro na API: ${response.status}` },
        { status: response.status }
      );
    }
    
    // Obter os dados da resposta
    const data = await response.json();
    
    // Retornar a resposta
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar horários:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar horários' },
      { status: 500 }
    );
  }
}
