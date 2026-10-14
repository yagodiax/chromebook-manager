import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { obterUsuarioAutenticado } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIPOS = ["chromebook", "notebook", "projetor", "catraca", "impressora"] as const;
const STATUS = ["disponivel", "em-uso", "em-reparo", "inativo", "para-descarte"] as const;

function erroJson(mensagem: string, status: number) {
  return NextResponse.json({ erro: mensagem }, { status, headers: { "Cache-Control": "no-store" } });
}

async function autenticacao() {
  try {
    const usuario = await obterUsuarioAutenticado();
    return usuario ? null : erroJson("Não autenticado.", 401);
  } catch (erro) {
    console.error("Erro ao verificar autenticação:", erro);
    return erroJson("Não foi possível verificar a sessão.", 500);
  }
}

function texto(valor: unknown): string {
  return typeof valor === "string" || typeof valor === "number" ? String(valor).trim() : "";
}

function detalhesValidos(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === "object" && !Array.isArray(valor) ? valor as Record<string, unknown> : {};
}

type EquipamentoRow = RowDataPacket & { id: string };

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const falha = await autenticacao();
  if (falha) return falha;
  const { id } = await context.params;

  try {
    const entrada: unknown = await request.json();
    if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) {
      return erroJson("Os dados enviados são inválidos.", 400);
    }
    const body = entrada as Record<string, unknown>;
    const patrimonio = texto(body.patrimonio) || null;
    const tipo = texto(body.tipo);
    const fabricante = texto(body.fabricante) || null;
    const modelo = texto(body.modelo) || null;
    const numeroSerie = texto(body.numeroSerie) || null;
    const localizacao = texto(body.localizacao) || null;
    const status = texto(body.status);
    const observacoes = texto(body.observacoes) || null;
    const detalhes = detalhesValidos(body.detalhes);

    if (!TIPOS.includes(tipo as typeof TIPOS[number])) return erroJson("Selecione um tipo de equipamento válido.", 400);
    if (!STATUS.includes(status as typeof STATUS[number])) return erroJson("Selecione um status válido.", 400);

    const limites: [string, string | null, number][] = [
      ["patrimônio", patrimonio, 100], ["fabricante", fabricante, 150],
      ["modelo", modelo, 150], ["número de série", numeroSerie, 150],
      ["localização", localizacao, 150],
    ];
    for (const [nome, valor, limite] of limites) {
      if (valor && valor.length > limite) return erroJson(`O campo ${nome} ultrapassa ${limite} caracteres.`, 400);
    }
    if (observacoes && observacoes.length > 60000) return erroJson("As observações ultrapassam o tamanho permitido.", 400);

    const [resultado] = await pool.execute<ResultSetHeader>(
      `UPDATE equipamentos
       SET patrimonio = ?, tipo = ?, fabricante = ?, modelo = ?, numero_serie = ?,
           localizacao = ?, status = ?, observacoes = ?, detalhes = ?
       WHERE id = ?`,
      [patrimonio, tipo, fabricante, modelo, numeroSerie, localizacao, status, observacoes, JSON.stringify(detalhes), id],
    );
    if (resultado.affectedRows === 0) {
      const [encontrados] = await pool.query<EquipamentoRow[]>("SELECT id FROM equipamentos WHERE id = ? LIMIT 1", [id]);
      if (encontrados.length === 0) return erroJson("Equipamento não encontrado.", 404);
    }
    return NextResponse.json({ sucesso: true, id }, { headers: { "Cache-Control": "no-store" } });
  } catch (erro) {
    const erroBanco = erro as { code?: string };
    if (erroBanco.code === "ER_DUP_ENTRY") return erroJson("Já existe um equipamento com esse patrimônio.", 409);
    console.error("Erro ao editar equipamento:", erro);
    return erroJson("Não foi possível salvar as alterações do equipamento.", 500);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const falha = await autenticacao();
  if (falha) return falha;
  const { id } = await context.params;

  try {
    const [resultado] = await pool.execute<ResultSetHeader>("DELETE FROM equipamentos WHERE id = ?", [id]);
    if (resultado.affectedRows === 0) return erroJson("Equipamento não encontrado.", 404);
    return NextResponse.json({ sucesso: true, id }, { headers: { "Cache-Control": "no-store" } });
  } catch (erro) {
    const erroBanco = erro as { code?: string };
    if (erroBanco.code === "ER_ROW_IS_REFERENCED_2" || erroBanco.code === "ER_ROW_IS_REFERENCED") {
      return erroJson("Este equipamento possui histórico vinculado e não pode ser excluído. Preserve o histórico e altere o status para Inativo, se necessário.", 409);
    }
    console.error("Erro ao excluir equipamento:", erro);
    return erroJson("Não foi possível excluir o equipamento.", 500);
  }
}
