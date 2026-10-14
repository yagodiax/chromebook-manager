import { randomUUID } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { obterUsuarioAutenticado } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIPOS = [
  "ocorrencia",
  "manutencao",
  "reposicao-de-peca",
  "envio-para-reparo",
  "retorno-de-reparo",
] as const;

const CATEGORIAS = [
  "tela", "teclado", "bateria", "carregador", "touchpad",
  "sistema-operacional", "wifi", "bluetooth", "audio", "camera",
  "carcaca", "dobradica", "usb", "outro",
] as const;

const STATUS_FINAIS = [
  "disponivel", "em-uso", "inativo", "para-descarte",
] as const;

const MAX_ANEXOS = 5;
const MAX_TAMANHO_ANEXO = 5 * 1024 * 1024;

type HistoricoRow = RowDataPacket & {
  id: string;
  equipamento_id: string;
  equipamento_patrimonio: string | null;
  equipamento_tipo: string;
  equipamento_fabricante: string | null;
  equipamento_modelo: string | null;
  equipamento_localizacao: string | null;
  tipo: string;
  categoria: string | null;
  data_ocorrencia: string | Date;
  descricao: string;
  observacao: string | null;
  quem_realizou: string | null;
  custo: string | number;
  destino_reparo: string | null;
  resultado: string | null;
  status_final: string | null;
  created_at: string | Date;
};

type AnexoEntrada = { nome: string; tipo?: string; tamanho: number; dados: string };

function erroJson(mensagem: string, status = 400) {
  return NextResponse.json({ erro: mensagem }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

async function verificarAutenticacao() {
  try {
    if (!(await obterUsuarioAutenticado())) return erroJson("Não autenticado.", 401);
    return null;
  } catch (erro) {
    console.error("Erro ao verificar autenticação:", erro);
    return erroJson("Não foi possível verificar a sessão.", 500);
  }
}

function texto(valor: unknown): string {
  return typeof valor === "string" || typeof valor === "number" ? String(valor).trim() : "";
}

function converterData(valor: string | Date): string {
  if (valor instanceof Date) {
    return valor.getFullYear() + "-" + String(valor.getMonth() + 1).padStart(2, "0") + "-" + String(valor.getDate()).padStart(2, "0");
  }
  return String(valor).slice(0, 10);
}

export async function GET(request: Request) {
  const falha = await verificarAutenticacao();
  if (falha) return falha;

  try {
    const url = new URL(request.url);
    const equipamentoId = url.searchParams.get("equipamentoId");
    const tipoEquipamento = url.searchParams.get("tipoEquipamento");

    const condicoes: string[] = [];
    const parametros: string[] = [];

    if (equipamentoId) {
      condicoes.push("h.equipamento_id = ?");
      parametros.push(equipamentoId);
    }
    if (tipoEquipamento) {
      condicoes.push("e.tipo = ?");
      parametros.push(tipoEquipamento);
    }

    const where = condicoes.length ? "WHERE " + condicoes.join(" AND ") : "";
    const [rows] = await pool.query<HistoricoRow[]>(
      `SELECT h.id, h.equipamento_id, e.patrimonio AS equipamento_patrimonio,
        e.tipo AS equipamento_tipo, e.fabricante AS equipamento_fabricante,
        e.modelo AS equipamento_modelo, e.localizacao AS equipamento_localizacao,
        h.tipo, h.categoria, h.data_ocorrencia, h.descricao, h.observacao,
        h.quem_realizou, h.custo, h.destino_reparo, h.resultado, h.status_final,
        h.created_at
      FROM historico_equipamentos h
      INNER JOIN equipamentos e ON e.id = h.equipamento_id
      ${where}
      ORDER BY h.data_ocorrencia DESC, h.created_at DESC`,
      parametros,
    );

    const ids = rows.map((row) => row.id);
    let anexosPorHistorico: Record<string, { id: number; nome: string; tipo: string; tamanho: number }[]> = {};

    if (ids.length) {
      const placeholders = ids.map(() => "?").join(", ");
      const [anexos] = await pool.query<(RowDataPacket & { id: number; historico_id: string; nome_arquivo: string; tipo_mime: string | null; tamanho_bytes: number | string | null })[]>(
        `SELECT id, historico_id, nome_arquivo, tipo_mime, tamanho_bytes
         FROM historico_equipamento_anexos WHERE historico_id IN (${placeholders}) ORDER BY id`,
        ids,
      );
      anexosPorHistorico = anexos.reduce((acumulado, anexo) => {
        if (!acumulado[anexo.historico_id]) acumulado[anexo.historico_id] = [];
        acumulado[anexo.historico_id].push({
          id: Number(anexo.id),
          nome: anexo.nome_arquivo,
          tipo: anexo.tipo_mime ?? "application/octet-stream",
          tamanho: Number(anexo.tamanho_bytes ?? 0),
        });
        return acumulado;
      }, {} as typeof anexosPorHistorico);
    }

    return NextResponse.json(rows.map((row) => ({
      id: row.id,
      equipamentoId: row.equipamento_id,
      equipamento: {
        patrimonio: row.equipamento_patrimonio ?? "",
        tipo: row.equipamento_tipo,
        fabricante: row.equipamento_fabricante ?? "",
        modelo: row.equipamento_modelo ?? "",
        localizacao: row.equipamento_localizacao ?? "",
      },
      tipo: row.tipo,
      categoria: row.categoria ?? "",
      data: converterData(row.data_ocorrencia),
      descricao: row.descricao,
      observacao: row.observacao ?? "",
      quemRealizou: row.quem_realizou ?? "",
      custo: Number(row.custo ?? 0),
      destinoReparo: row.destino_reparo ?? "",
      resultado: row.resultado ?? "",
      statusFinal: row.status_final ?? "",
      anexos: anexosPorHistorico[row.id] ?? [],
      criadoEm: row.created_at,
    })), { headers: { "Cache-Control": "no-store" } });
  } catch (erro) {
    console.error("Erro ao consultar histórico universal:", erro);
    return erroJson("Não foi possível consultar o histórico. Confirme se as tabelas universais foram criadas.", 500);
  }
}

export async function POST(request: Request) {
  const falha = await verificarAutenticacao();
  if (falha) return falha;

  const conexao = await pool.getConnection();

  try {
    const bodyDesconhecido: unknown = await request.json();
    if (!bodyDesconhecido || typeof bodyDesconhecido !== "object" || Array.isArray(bodyDesconhecido)) {
      return erroJson("Os dados enviados são inválidos.");
    }

    const body = bodyDesconhecido as Record<string, unknown>;
    const equipamentoId = texto(body.equipamentoId);
    const tipo = texto(body.tipo);
    const categoria = texto(body.categoria);
    const data = texto(body.data);
    const descricao = texto(body.descricao);
    const observacao = texto(body.observacao);
    const quemRealizou = texto(body.quemRealizou);
    const destinoReparo = texto(body.destinoReparo);
    const resultado = texto(body.resultado);
    const statusFinal = texto(body.statusFinal);
    const custo = body.custo === undefined || body.custo === null || body.custo === "" ? 0 : Number(body.custo);
    const anexos = Array.isArray(body.anexos) ? body.anexos as AnexoEntrada[] : [];

    if (!equipamentoId) return erroJson("Selecione o equipamento.");
    if (!(TIPOS as readonly string[]).includes(tipo)) return erroJson("Tipo de registro inválido.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || Number.isNaN(new Date(data + "T00:00:00Z").getTime())) return erroJson("Informe uma data válida.");
    if (!descricao) return erroJson("Preencha a descrição.");
    if (descricao.length > 60000 || observacao.length > 60000 || resultado.length > 60000) return erroJson("Um dos textos ultrapassa o tamanho permitido.");
    if (!Number.isFinite(custo) || custo < 0 || custo > 99999999.99) return erroJson("Informe um custo válido.");
    if (categoria && !(CATEGORIAS as readonly string[]).includes(categoria)) return erroJson("Categoria inválida.");
    if (anexos.length > MAX_ANEXOS) return erroJson("É permitido anexar no máximo 5 arquivos.");

    if (tipo === "envio-para-reparo" && !destinoReparo) return erroJson("Informe a assistência ou empresa de reparo.");
    if (tipo === "retorno-de-reparo") {
      if (!statusFinal || !(STATUS_FINAIS as readonly string[]).includes(statusFinal)) return erroJson("Selecione o status do equipamento após o retorno.");
      if (body.custo === undefined || body.custo === null || body.custo === "" || !Number.isFinite(custo)) return erroJson("Informe o custo final do reparo, mesmo que seja R$ 0,00.");
    }

    for (const anexo of anexos) {
      if (!anexo || typeof anexo.nome !== "string" || typeof anexo.dados !== "string" || !Number.isFinite(anexo.tamanho) || anexo.tamanho < 0) return erroJson("Um dos anexos é inválido.");
      if (anexo.tamanho > MAX_TAMANHO_ANEXO) return erroJson("Cada anexo deve ter no máximo 5 MB.");
      if (Buffer.byteLength(anexo.dados, "utf8") > MAX_TAMANHO_ANEXO * 1.5) return erroJson("Um dos anexos ultrapassa o tamanho permitido.");
    }

    const [equipamentos] = await conexao.query<(RowDataPacket & { id: string; status: string })[]>(
      "SELECT id, status FROM equipamentos WHERE id = ? LIMIT 1",
      [equipamentoId],
    );
    if (!equipamentos.length) return erroJson("O equipamento selecionado não existe.", 404);

    const id = randomUUID();
    await conexao.beginTransaction();

    await conexao.execute<ResultSetHeader>(
      `INSERT INTO historico_equipamentos
       (id, equipamento_id, tipo, categoria, data_ocorrencia, descricao, observacao,
        quem_realizou, custo, destino_reparo, resultado, status_final)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, equipamentoId, tipo, categoria || null, data, descricao, observacao || null,
        quemRealizou || null, custo, destinoReparo || null, resultado || null, statusFinal || null],
    );

    for (const anexo of anexos) {
      await conexao.execute<ResultSetHeader>(
        `INSERT INTO historico_equipamento_anexos
         (historico_id, nome_arquivo, tipo_mime, tamanho_bytes, conteudo_base64)
         VALUES (?, ?, ?, ?, ?)`,
        [id, anexo.nome.slice(0, 255), texto(anexo.tipo) || null, anexo.tamanho, anexo.dados],
      );
    }

    if (tipo === "envio-para-reparo") {
      await conexao.execute<ResultSetHeader>("UPDATE equipamentos SET status = 'em-reparo' WHERE id = ?", [equipamentoId]);
    } else if (tipo === "retorno-de-reparo") {
      await conexao.execute<ResultSetHeader>("UPDATE equipamentos SET status = ? WHERE id = ?", [statusFinal, equipamentoId]);
    }

    await conexao.commit();
    return NextResponse.json({ id, mensagem: "Registro salvo com sucesso." }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (erro) {
    try { await conexao.rollback(); } catch { /* transação ainda não iniciada */ }
    console.error("Erro ao salvar registro do histórico universal:", erro);
    return erroJson("Não foi possível salvar o registro do histórico.", 500);
  } finally {
    conexao.release();
  }
}

export async function PUT(request: Request) {
  const falha = await verificarAutenticacao();
  if (falha) return falha;
  const conexao = await pool.getConnection();
  try {
    const entradaDesconhecida: unknown = await request.json();
    if (!entradaDesconhecida || typeof entradaDesconhecida !== "object" || Array.isArray(entradaDesconhecida)) return erroJson("Os dados enviados são inválidos.");
    const body = entradaDesconhecida as Record<string, unknown>;
    const id = texto(body.id);
    const equipamentoId = texto(body.equipamentoId);
    const tipo = texto(body.tipo);
    const categoria = texto(body.categoria);
    const data = texto(body.data);
    const descricao = texto(body.descricao);
    const observacao = texto(body.observacao);
    const quemRealizou = texto(body.quemRealizou);
    const destinoReparo = texto(body.destinoReparo);
    const resultado = texto(body.resultado);
    const statusFinal = texto(body.statusFinal);
    const custo = body.custo === undefined || body.custo === null || body.custo === "" ? 0 : Number(body.custo);

    if (!id) return erroJson("Informe o ID do registro.");
    if (!equipamentoId) return erroJson("O equipamento é obrigatório.");
    if (!(TIPOS as readonly string[]).includes(tipo)) return erroJson("Tipo de registro inválido.");
    if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(data) || Number.isNaN(new Date(data + "T00:00:00Z").getTime())) return erroJson("Informe uma data válida.");
    if (!descricao) return erroJson("Preencha a descrição.");
    if (descricao.length > 60000 || observacao.length > 60000 || resultado.length > 60000) return erroJson("Um dos textos ultrapassa o tamanho permitido.");
    if (!Number.isFinite(custo) || custo < 0 || custo > 99999999.99) return erroJson("Informe um custo válido.");
    if (categoria && !(CATEGORIAS as readonly string[]).includes(categoria)) return erroJson("Categoria inválida.");
    if (tipo === "envio-para-reparo" && !destinoReparo) return erroJson("Informe a assistência ou empresa de reparo.");
    if (tipo === "retorno-de-reparo" && (!statusFinal || !(STATUS_FINAIS as readonly string[]).includes(statusFinal))) return erroJson("Selecione o status do equipamento após o retorno.");

    await conexao.beginTransaction();
    const [existentes] = await conexao.execute<(RowDataPacket & { id: string; equipamento_id: string })[]>(
      "SELECT id, equipamento_id FROM historico_equipamentos WHERE id = ? FOR UPDATE", [id],
    );
    if (!existentes.length) {
      await conexao.rollback();
      return erroJson("Registro não encontrado.", 404);
    }
    if (existentes[0].equipamento_id !== equipamentoId) { await conexao.rollback(); return erroJson("Não é permitido transferir um registro para outro equipamento."); }

    await conexao.execute<ResultSetHeader>(
      `UPDATE historico_equipamentos SET tipo = ?, categoria = ?, data_ocorrencia = ?, descricao = ?, observacao = ?, quem_realizou = ?, custo = ?, destino_reparo = ?, resultado = ?, status_final = ? WHERE id = ?`,
      [tipo, categoria || null, data, descricao, observacao || null, quemRealizou || null, custo, destinoReparo || null, resultado || null, statusFinal || null, id],
    );
    if (tipo === "envio-para-reparo") {
      await conexao.execute<ResultSetHeader>("UPDATE equipamentos SET status = 'em-reparo' WHERE id = ?", [equipamentoId]);
    } else if (tipo === "retorno-de-reparo") {
      await conexao.execute<ResultSetHeader>("UPDATE equipamentos SET status = ? WHERE id = ?", [statusFinal, equipamentoId]);
    }
    await conexao.commit();
    return NextResponse.json({ id, mensagem: "Registro atualizado com sucesso." }, { headers: { "Cache-Control": "no-store" } });
  } catch (erro) {
    try { await conexao.rollback(); } catch { /* transação não iniciada */ }
    console.error("Erro ao editar registro do histórico universal:", erro);
    return erroJson("Não foi possível atualizar o registro do histórico.", 500);
  } finally {
    conexao.release();
  }
}
