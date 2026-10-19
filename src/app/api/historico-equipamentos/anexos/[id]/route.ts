
import type { RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import {
  obterUsuarioAutenticado,
  podeAcessarUnidade,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnexoRow = RowDataPacket & {
  nome_arquivo: string;
  tipo_mime: string | null;
  conteudo_base64: string;
  unidade_id: string;
};

function ehAdministradorGeral(usuario: UsuarioAutenticado): boolean {
  // "admin" é mantido temporariamente para compatibilidade
  // com a conta administrativa antiga durante a migração.
  return (
    usuario.perfil === "admin_geral" ||
    usuario.perfil === "admin"
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const usuario = await obterUsuarioAutenticado();

    if (!usuario) {
      return NextResponse.json(
        { erro: "Não autenticado." },
        { status: 401 },
      );
    }

    const { id } = await context.params;

    if (!/^\d+$/.test(id)) {
      return NextResponse.json(
        { erro: "Anexo inválido." },
        { status: 400 },
      );
    }

    const [rows] = await pool.query<AnexoRow[]>(
      `SELECT
         a.nome_arquivo,
         a.tipo_mime,
         a.conteudo_base64,
         e.unidade_id
       FROM historico_equipamento_anexos a
       INNER JOIN historico_equipamentos h
         ON h.id = a.historico_id
       INNER JOIN equipamentos e
         ON e.id = h.equipamento_id
       WHERE a.id = ?
       LIMIT 1`,
      [id],
    );

    const anexo = rows[0];

    // Não revela se um anexo de outra unidade existe.
    if (!anexo) {
      return NextResponse.json(
        { erro: "Anexo não encontrado." },
        { status: 404 },
      );
    }

    // O administrador geral pode acessar as duas unidades.
    // Os demais usuários só acessam anexos da própria unidade.
    if (!podeAcessarUnidade(usuario, anexo.unidade_id)) {
      return NextResponse.json({ erro: "Anexo não encontrado." }, { status: 404 });
    }

    const separador = anexo.conteudo_base64.indexOf(",");

    const base64 =
      anexo.conteudo_base64.startsWith("data:") && separador >= 0
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
