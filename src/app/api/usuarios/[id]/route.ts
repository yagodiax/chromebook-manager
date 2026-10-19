
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

function unidadeValida(unidade: unknown): unidade is "CE" | "JP" | "AMBOS" {
  return unidade === "CE" || unidade === "JP" || unidade === "AMBOS";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const atual = await obterUsuarioAutenticado();
    if (!atual) return erro("Não autenticado.", 401);
    if (!ehAdministradorGeral(atual.perfil)) {
      return erro("Apenas o administrador geral pode editar usuários.", 403);
    }

    const { id } = await context.params;
    if (!id) return erro("Usuário inválido.", 400);
    if (id === atual.id) {
      return erro("A conta do administrador geral não pode ser editada por esta tela.", 409);
    }

    const entrada: unknown = await request.json();
    if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) {
      return erro("Os dados enviados são inválidos.", 400);
    }
    const body = entrada as Record<string, unknown>;
    const nome = typeof body.nome === "string" ? body.nome.trim() : "";
    const usuario = typeof body.usuario === "string" ? body.usuario.trim().toLowerCase() : "";
    const unidade = body.unidadeId ?? body.unidade_id;

    if (!nome || nome.length > 150) {
      return erro("Informe um nome com até 150 caracteres.", 400);
    }
    if (usuario.length < 3 || usuario.length > 100 || !/^[a-z0-9._-]+$/.test(usuario)) {
      return erro("O usuário deve ter de 3 a 100 caracteres e usar letras sem acento, números, ponto, hífen ou underline.", 400);
    }
    if (!unidadeValida(unidade)) {
      return erro("Selecione CE, JP ou AMBOS.", 400);
    }

    const [usuarios] = await pool.execute<UsuarioAlvoRow[]>(
      "SELECT id, perfil, unidade_id, ativo FROM usuarios WHERE id = ? LIMIT 1",
      [id],
    );
    const alvo = usuarios[0];
    if (!alvo) return erro("Usuário não encontrado.", 404);
    if (ehAdministradorGeral(alvo.perfil) || alvo.perfil !== "usuario") {
      return erro("As contas administrativas são protegidas e não podem ser editadas por esta tela.", 403);
    }

    const [resultado] = await pool.execute<ResultSetHeader>(
      "UPDATE usuarios SET nome = ?, usuario = ?, unidade_id = ? WHERE id = ? AND perfil = 'usuario'",
      [nome, usuario, unidade, id],
    );
    if (resultado.affectedRows === 0) {
      const [confirmacao] = await pool.execute<UsuarioAlvoRow[]>(
        "SELECT id, perfil, unidade_id, ativo FROM usuarios WHERE id = ? LIMIT 1",
        [id],
      );
      if (!confirmacao[0]) return erro("Usuário não encontrado.", 404);
    }

    return NextResponse.json(
      { sucesso: true, id, nome, usuario, unidadeId: unidade },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const dbError = error as { code?: string };
    if (dbError.code === "ER_DUP_ENTRY") return erro("Esse nome de usuário já está em uso.", 409);
    console.error("Erro ao editar usuário:", error);
    return erro("Não foi possível editar o usuário.", 500);
  }
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
    if (!administradorGeral) {
      return erro("Apenas o administrador geral pode excluir usuários.", 403);
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

    // Contas administrativas são protegidas contra exclusão acidental.
    if (ehAdministradorGeral(alvo.perfil)) {
      return erro("A conta do administrador geral não pode ser excluída por esta tela.", 403);
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
