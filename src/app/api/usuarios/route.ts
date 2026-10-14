import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { obterUsuarioAutenticado } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function erro(mensagem: string, status: number) {
  return NextResponse.json({ erro: mensagem }, { status, headers: { "Cache-Control": "no-store" } });
}
async function administrador() {
  const usuario = await obterUsuarioAutenticado();
  if (!usuario) return { usuario: null, resposta: erro("Não autenticado.", 401) };
  if (usuario.perfil !== "admin") return { usuario: null, resposta: erro("Apenas administradores podem gerenciar usuários.", 403) };
  return { usuario, resposta: null };
}
interface UsuarioRow extends RowDataPacket {
  id: string; nome: string; usuario: string; perfil: string; ativo: number;
  precisa_ativar: number; created_at: string | Date;
}
export async function GET() {
  try {
    const auth = await administrador();
    if (auth.resposta) return auth.resposta;
    const [rows] = await pool.query<UsuarioRow[]>(`SELECT id, nome, usuario, perfil, ativo,
      (senha_hash IS NULL) AS precisa_ativar, created_at
      FROM usuarios ORDER BY created_at DESC, nome ASC`);
    return NextResponse.json(rows.map((row) => ({
      id: row.id, nome: row.nome, usuario: row.usuario, perfil: row.perfil,
      ativo: Number(row.ativo) === 1, precisaAtivar: Number(row.precisa_ativar) === 1,
      criadoEm: row.created_at, proprioUsuario: row.id === auth.usuario?.id,
    })), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return erro("Não foi possível listar os usuários. Confirme se a migração 007 foi executada.", 500);
  }
}
export async function POST(request: Request) {
  try {
    const auth = await administrador();
    if (auth.resposta) return auth.resposta;
    const entrada: unknown = await request.json();
    if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) return erro("Os dados enviados são inválidos.", 400);
    const body = entrada as Record<string, unknown>;
    const nome = typeof body.nome === "string" ? body.nome.trim() : "";
    const usuario = typeof body.usuario === "string" ? body.usuario.trim().toLowerCase() : "";
    if (!nome || !usuario) return erro("Informe o nome e o nome de usuário.", 400);
    if (nome.length > 150) return erro("O nome deve ter no máximo 150 caracteres.", 400);
    if (usuario.length < 3 || usuario.length > 100 || !/^[a-z0-9._-]+$/.test(usuario)) {
      return erro("O usuário deve ter de 3 a 100 caracteres e usar letras sem acento, números, ponto, hífen ou underline.", 400);
    }
    const id = randomUUID();
    const codigo = randomBytes(4).toString("hex").toUpperCase();
    const codigoHash = createHash("sha256").update(codigo).digest("hex");
    await pool.execute<ResultSetHeader>(
      `INSERT INTO usuarios (id, nome, usuario, senha_hash, codigo_ativacao_hash, perfil, ativo)
       VALUES (?, ?, ?, NULL, ?, 'usuario', 1)`,
      [id, nome, usuario, codigoHash],
    );
    return NextResponse.json({
      sucesso: true, usuario: { id, nome, usuario, perfil: "usuario", precisaAtivar: true },
      codigoPrimeiroAcesso: codigo,
      mensagem: "Conta criada. Copie o código de primeiro acesso agora; ele não será exibido novamente.",
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const dbError = error as { code?: string };
    if (dbError.code === "ER_DUP_ENTRY") return erro("Esse nome de usuário já está em uso.", 409);
    console.error("Erro ao criar usuário:", error);
    return erro("Não foi possível criar a conta. Confirme se a migração 007 foi executada.", 500);
  }
}
