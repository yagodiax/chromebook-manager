import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { obterUsuarioAutenticado } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function erro(mensagem: string, status: number) {
  return NextResponse.json({ erro: mensagem }, { status, headers: { "Cache-Control": "no-store" } });
}
interface AdminRow extends RowDataPacket { id: string; }
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const atual = await obterUsuarioAutenticado();
    if (!atual) return erro("Não autenticado.", 401);
    if (atual.perfil !== "admin") return erro("Apenas administradores podem excluir usuários.", 403);
    const { id } = await context.params;
    if (!id) return erro("Usuário inválido.", 400);
    if (id === atual.id) return erro("Você não pode excluir a própria conta enquanto estiver conectado.", 409);
    const [admins] = await pool.query<AdminRow[]>("SELECT id FROM usuarios WHERE perfil = 'admin' AND ativo = 1");
    const [alvo] = await pool.query<AdminRow[]>("SELECT id FROM usuarios WHERE id = ? AND perfil = 'admin' AND ativo = 1 LIMIT 1", [id]);
    if (alvo.length && admins.length <= 1) return erro("Não é possível excluir o último administrador ativo.", 409);
    const [resultado] = await pool.execute<ResultSetHeader>("DELETE FROM usuarios WHERE id = ?", [id]);
    if (resultado.affectedRows === 0) return erro("Usuário não encontrado.", 404);
    return NextResponse.json({ sucesso: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return erro("Não foi possível excluir o usuário.", 500);
  }
}
