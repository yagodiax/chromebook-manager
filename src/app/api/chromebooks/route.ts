import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Esta API legada usa tabelas sem unidade_id. Ela foi desativada para
// impedir que registros sem vínculo de unidade sejam compartilhados entre CE e JP.
// O sistema atual usa /api/equipamentos e /api/historico-equipamentos.
function endpointLegadoDesativado() {
  return NextResponse.json(
    {
      erro:
        "Esta API antiga foi desativada para proteger a separação entre unidades. Use as telas atuais de Equipamentos e Histórico de serviços.",
    },
    {
      status: 410,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export async function GET() {
  return endpointLegadoDesativado();
}

export async function POST() {
  return endpointLegadoDesativado();
}

export async function PUT() {
  return endpointLegadoDesativado();
}

export async function DELETE() {
  return endpointLegadoDesativado();
}
