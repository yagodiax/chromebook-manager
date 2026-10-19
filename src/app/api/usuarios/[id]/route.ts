
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { obterUsuarioAutenticado } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function erro(mensagem: string, status: number) {
  return NextResponse.json(
    { erro: mensagem },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

interface UsuarioAlvoRow extends RowDataPacket {
  id: string;
  perfil: string;
  unidade_id: string | null;
  ativo: number;
}

interface ContagemRow extends RowDataPacket {
  total: number;
}

function ehAdministradorGeral(perfil: string) {
  // "admin" permanece temporariamente por compatibilidade.
  return perfil === "admin_geral" || perfil === "admin";
}

function unidadeValida(unidade: string | null | undefined) {
  return unidade === "CE" || unidade === "JP";
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const atual = await obterUsuarioAutenticado();

    if (!atual) {
      return erro("Não autenticado.", 401);
    }

    const administradorGeral = ehAdministradorGeral(atual.perfil);
    const administradorUnidade = atual.perfil === "admin_unidade";

    if (!administradorGeral && !administradorUnidade) {
      return erro("Você não tem permissão para excluir usuários.", 403);
    }

    if (
      administradorUnidade &&
      !unidadeValida(atual.unidade_id)
    ) {
      return erro("Sua conta não possui uma unidade válida.", 403);
    }

    const { id } = await context.params;

    if (!id) {
      return erro("Usuário inválido.", 400);
    }

    if (id === atual.id) {
      return erro(
        "Você não pode excluir a própria conta enquanto estiver conectado.",
        409,
      );
    }

    const [usuarios] = await pool.execute<UsuarioAlvoRow[]>(
      `SELECT id, perfil, unidade_id, ativo
       FROM usuarios
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    const alvo = usuarios[0];

    if (!alvo) {
      return erro("Usuário não encontrado.", 404);
    }

    // Administradores de unidade só podem excluir usuários comuns
    // pertencentes à própria unidade.
    if (administradorUnidade) {
      if (alvo.unidade_id !== atual.unidade_id) {
        return erro("Usuário não encontrado.", 404);
      }

      if (alvo.perfil !== "usuario") {
        return erro(
          "Administradores de unidade só podem excluir usuários comuns da própria unidade.",
          403,
        );
      }
    }

    // Impede que a exclusão deixe o sistema sem administrador geral ativo.
    if (administradorGeral && ehAdministradorGeral(alvo.perfil) && alvo.ativo) {
      const [contagem] = await pool.query<ContagemRow[]>(
        `SELECT COUNT(*) AS total
         FROM usuarios
         WHERE perfil IN ('admin_geral', 'admin')
           AND ativo = 1`,
      );

      if (Number(contagem[0]?.total ?? 0) <= 1) {
        return erro(
          "Não é possível excluir o último administrador geral ativo.",
          409,
        );
      }
    }

    // O ID já foi validado e as permissões foram verificadas acima.
    const [resultado] = await pool.execute<ResultSetHeader>(
      "DELETE FROM usuarios WHERE id = ?",
      [id],
    );

    if (resultado.affectedRows === 0) {
      return erro("Usuário não encontrado.", 404);
    }

    return NextResponse.json(
      { sucesso: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return erro("Não foi possível excluir o usuário.", 500);
  }
}
