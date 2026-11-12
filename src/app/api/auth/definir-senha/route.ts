
import { createHash } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { gerarHashSenha } from "@/lib/auth";

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

interface UsuarioRow extends RowDataPacket {
  id: string;
  codigo_ativacao_hash: string | null;
  senha_hash: string | null;
}

export async function POST(request: Request) {
  try {
    const entrada: unknown = await request.json();

    if (
      !entrada ||
      typeof entrada !== "object" ||
      Array.isArray(entrada)
    ) {
      return erro("Dados inválidos.", 400);
    }

    const body = entrada as Record<string, unknown>;

    const usuario =
      typeof body.usuario === "string"
        ? body.usuario.trim().toLowerCase()
        : "";

    const codigo =
      typeof body.codigo === "string"
        ? body.codigo.trim().toUpperCase()
        : "";

    const senha =
      typeof body.senha === "string" ? body.senha : "";

    const confirmarSenha =
      typeof body.confirmarSenha === "string"
        ? body.confirmarSenha
        : "";

    if (!usuario || !codigo || !senha || !confirmarSenha) {
      return erro("Preencha todos os campos.", 400);
    }

    if (usuario.length > 100) {
      return erro("Nome de usuário inválido.", 400);
    }

    if (
      senha.length < 8 ||
      Buffer.byteLength(senha, "utf8") > 128
    ) {
      return erro(
        "A senha deve ter pelo menos 8 caracteres e no máximo 128 bytes.",
        400,
      );
    }

    if (senha !== confirmarSenha) {
      return erro("As senhas não conferem.", 400);
    }

    if (!/^[A-F0-9]{16}$/.test(codigo)) {
      return erro("Código de ativação inválido ou expirado.", 400);
    }

    const codigoHash = createHash("sha256")
      .update(codigo)
      .digest("hex");

    const [rows] = await pool.execute<UsuarioRow[]>(
      `SELECT id, codigo_ativacao_hash, senha_hash
       FROM usuarios
       WHERE usuario = ?
         AND ativo = 1
       LIMIT 1`,
      [usuario],
    );

    const conta = rows[0];

    if (
      !conta ||
      conta.senha_hash !== null ||
      !conta.codigo_ativacao_hash ||
      conta.codigo_ativacao_hash !== codigoHash
    ) {
      return erro(
        "Código inválido ou conta já ativada. Confira os dados ou fale com o administrador.",
        400,
      );
    }

    const senhaHash = gerarHashSenha(senha);

    // A condição no UPDATE garante que o código continue válido
    // e que a conta ainda não tenha sido ativada.
    const [resultado] = await pool.execute<ResultSetHeader>(
      `UPDATE usuarios
       SET senha_hash = ?,
           codigo_ativacao_hash = NULL
       WHERE id = ?
         AND ativo = 1
         AND senha_hash IS NULL
         AND codigo_ativacao_hash = ?`,
      [senhaHash, conta.id, codigoHash],
    );

    if (resultado.affectedRows !== 1) {
      return erro(
        "A conta já foi ativada ou o código não é mais válido.",
        409,
      );
    }

    return NextResponse.json(
      {
        sucesso: true,
        mensagem: "Senha criada com sucesso. Agora você já pode entrar.",
      },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error("Erro ao definir senha inicial:", error);

    return erro(
      "Não foi possível configurar a senha. Verifique a configuração do banco.",
      500,
    );
  }
}
