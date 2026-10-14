import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/lib/db";
import { gerarHashSenha } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
interface UsuarioExistenteRow extends RowDataPacket { id: string; }
interface ConfiguracaoRow extends RowDataPacket { id: number; chave: string; }
export async function POST(request: Request) {
  let conexao;
  try {
    const body = await request.json();
    const nome = String(body.nome ?? "").trim();
    const usuario = String(body.usuario ?? "").trim().toLowerCase();
    const senha = String(body.senha ?? "");
    if (!nome || !usuario || !senha) return NextResponse.json({ erro: "Preencha todos os campos." }, { status: 400 });
    if (nome.length > 150 || usuario.length > 100) return NextResponse.json({ erro: "Nome ou usuário muito longo." }, { status: 400 });
    if (senha.length < 8 || Buffer.byteLength(senha, "utf8") > 128) return NextResponse.json({ erro: "A senha deve ter pelo menos 8 caracteres e no máximo 128 bytes." }, { status: 400 });
    conexao = await pool.getConnection(); await conexao.beginTransaction();
    const [configuracoes] = await conexao.query<ConfiguracaoRow[]>("SELECT id, chave FROM configuracao_sistema WHERE id = 1 FOR UPDATE");
    if (configuracoes.length === 0) { await conexao.rollback(); return NextResponse.json({ erro: "A configuração do sistema não foi inicializada. Execute o script de criação das tabelas." }, { status: 500 }); }
    const [usuariosExistentes] = await conexao.query<UsuarioExistenteRow[]>("SELECT id FROM usuarios LIMIT 1");
    if (usuariosExistentes.length > 0) { await conexao.rollback(); return NextResponse.json({ erro: "A configuração inicial já foi realizada." }, { status: 409 }); }
    const { randomUUID } = await import("node:crypto");
    const id = randomUUID(); const senhaHash = gerarHashSenha(senha);
    await conexao.execute(`INSERT INTO usuarios (id, nome, usuario, senha_hash, ativo, perfil) VALUES (?, ?, ?, ?, 1, 'admin')`, [id, nome, usuario, senhaHash]);
    await conexao.execute("UPDATE configuracao_sistema SET valor = 'concluida' WHERE id = 1");
    await conexao.commit();
    return NextResponse.json({ sucesso: true, mensagem: "Administrador criado. Faça login para continuar." }, { status: 201 });
  } catch (error) {
    if (conexao) { try { await conexao.rollback(); } catch { /* transação encerrada */ } }
    console.error("Erro na configuração inicial:", error);
    return NextResponse.json({ erro: "Não foi possível criar o administrador. Verifique os dados e tente novamente." }, { status: 500 });
  } finally { conexao?.release(); }
}
