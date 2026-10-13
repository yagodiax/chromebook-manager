
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/lib/db";
import { criarSessao, verificarSenha } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface UsuarioRow extends RowDataPacket {
  id: string;
  nome: string;
  usuario: string;
  senha_hash: string;
  ativo: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const usuario = String(body.usuario ?? "").trim();
    const senha = String(body.senha ?? "");

    if (!usuario || !senha) {
      return NextResponse.json(
        { erro: "Informe o usuário e a senha." },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute<UsuarioRow[]>(
      `SELECT id, nome, usuario, senha_hash, ativo
       FROM usuarios WHERE usuario = ? LIMIT 1`,
      [usuario]
    );

    const conta = rows[0];

    if (
      !conta ||
      Number(conta.ativo) !== 1 ||
      !verificarSenha(senha, conta.senha_hash)
    ) {
      return NextResponse.json(
        { erro: "Usuário ou senha inválidos." },
        { status: 401 }
      );
    }

    const token = await criarSessao(conta.id);
    const resposta = NextResponse.json({
      sucesso: true,
      usuario: {
        nome: conta.nome,
        usuario: conta.usuario,
      },
    });

    resposta.cookies.set("cm_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return resposta;
  } catch (error) {
    console.error("Erro no login:", error);

    return NextResponse.json(
      { erro: "Não foi possível realizar o login." },
      { status: 500 }
    );
  }
}
