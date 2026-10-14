import type { RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { obterUsuarioAutenticado } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnexoRow = RowDataPacket & {
  nome_arquivo: string;
  tipo_mime: string | null;
  conteudo_base64: string;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const usuario = await obterUsuarioAutenticado();
    if (!usuario) {
      return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    }

    const { id } = await context.params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ erro: "Anexo inválido." }, { status: 400 });
    }

    const [rows] = await pool.query<AnexoRow[]>(
      `SELECT nome_arquivo, tipo_mime, conteudo_base64
       FROM historico_equipamento_anexos
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    const anexo = rows[0];
    if (!anexo) {
      return NextResponse.json({ erro: "Anexo não encontrado." }, { status: 404 });
    }

    const separador = anexo.conteudo_base64.indexOf(",");
    const base64 = anexo.conteudo_base64.startsWith("data:") && separador >= 0
      ? anexo.conteudo_base64.slice(separador + 1)
      : anexo.conteudo_base64;
    const bytes = Buffer.from(base64, "base64");
    const tipoMime = anexo.tipo_mime || "application/octet-stream";
    const nomeSeguro = anexo.nome_arquivo.replace(/[\r\n"]/g, "_");

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": tipoMime,
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": `inline; filename="${nomeSeguro}"; filename*=UTF-8''${encodeURIComponent(anexo.nome_arquivo)}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (erro) {
    console.error("Erro ao abrir anexo do histórico:", erro);
    return NextResponse.json(
      { erro: "Não foi possível abrir o anexo." },
      { status: 500 },
    );
  }
}
