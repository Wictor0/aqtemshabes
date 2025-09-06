// Arquivo: app/api/validate-invite/route.js
import { NextResponse } from 'next/server';

// Seus códigos predefinidos. Você pode movê-los para o .env se preferir.
const validCodes = ["SHALOM2025", "SHABBAT2024"];

export async function POST(request) {
  try {
    const { inviteCode } = await request.json();

    if (!inviteCode) {
      return NextResponse.json({ error: 'Código de convite é obrigatório' }, { status: 400 });
    }

    const isValid = validCodes.includes(inviteCode.toUpperCase());

    if (isValid) {
      return NextResponse.json({ valid: true });
    } else {
      return NextResponse.json({ valid: false }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 });
  }
}