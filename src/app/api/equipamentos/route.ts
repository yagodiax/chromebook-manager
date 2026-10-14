import { randomUUID } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { obterUsuarioAutenticado } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIPOS = [
  "chromebook",
  "notebook",
  "projetor",
  "catraca",
  "impressora",
] as const;

const STATUS = [
  "disponivel",
  "em-uso",
  "em-reparo",
  "inativo",
  "para-descarte",
] as const;

type TipoEquipamento = (typeof TIPOS)[number];
type StatusEquipamento = (typeof STATUS)[number];

type EquipamentoRow = RowDataPacket & {
  id: string;
  patrimonio: string | null;
  tipo: TipoEquipamento;
  fabricante: string | null;
  modelo: string | null;
  numero_serie: string | null;
  localizacao: string | null;
  status: StatusEquipamento;
  observacoes: string | null;
  detalhes: Record<string, unknown> | string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

function erroJson(mensagem: string, status: number) {
  return NextResponse.json(
    { erro: mensagem },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

async function verificarAutenticacao() {
  try {
    const usuario = await obterUsuarioAutenticado();

    if (!usuario) {
      return erroJson("Não autenticado.", 401);
    }

    return null;
  } catch (erro) {
    console.error("Erro ao verificar autenticação:", erro);
    return erroJson("Não foi possível verificar a sessão.", 500);
  }
}

function texto(valor: unknown): string {
  return typeof valor === "string" || typeof valor === "number"
    ? String(valor).trim()
    : "";
}

function normalizarDetalhes(valor: unknown): Record<string, unknown> {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return {};
  }

  return valor as Record<string, unknown>;
}

function apresentarEquipamento(row: EquipamentoRow) {
  let detalhes: Record<string, unknown> = {};

  if (row.detalhes && typeof row.detalhes === "object") {
    detalhes = row.detalhes;
  } else if (typeof row.detalhes === "string") {
    try {
      const parseado: unknown = JSON.parse(row.detalhes);
      detalhes = normalizarDetalhes(parseado);
    } catch {
      detalhes = {};
    }
  }

  return {
    id: row.id,
    patrimonio: row.patrimonio ?? "",
    tipo: row.tipo,
    fabricante: row.fabricante ?? "",
    modelo: row.modelo ?? "",
    numeroSerie: row.numero_serie ?? "",
    localizacao: row.localizacao ?? "",
    status: row.status,
    observacoes: row.observacoes ?? "",
    detalhes,
    criadoEm: row.created_at,
    atualizadoEm: row.updated_at,
  };
}

export async function GET() {
  const falhaAutenticacao = await verificarAutenticacao();
  if (falhaAutenticacao) return falhaAutenticacao;

  try {
    const [rows] = await pool.query<EquipamentoRow[]>(`
      SELECT
        id, patrimonio, tipo, fabricante, modelo, numero_serie,
        localizacao, status, observacoes, detalhes, created_at, updated_at
      FROM equipamentos
      ORDER BY tipo, patrimonio, created_at
    `);

    return NextResponse.json(rows.map(apresentarEquipamento), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (erro) {
    console.error("Erro ao listar equipamentos:", erro);
    return erroJson(
      "Não foi possível listar os equipamentos. Confirme se a tabela equipamentos foi criada no banco.",
      500,
    );
  }
}

export async function POST(request: Request) {
  const falhaAutenticacao = await verificarAutenticacao();
  if (falhaAutenticacao) return falhaAutenticacao;

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
    const status = texto(body.status || "disponivel");
    const observacoes = texto(body.observacoes) || null;
    const detalhes = normalizarDetalhes(body.detalhes);

    if (!TIPOS.includes(tipo as TipoEquipamento)) {
      return erroJson("Selecione um tipo de equipamento válido.", 400);
    }

    if (!STATUS.includes(status as StatusEquipamento)) {
      return erroJson("Selecione um status válido.", 400);
    }

    const limites: [string, string | null, number][] = [
      ["patrimônio", patrimonio, 100],
      ["fabricante", fabricante, 150],
      ["modelo", modelo, 150],
      ["número de série", numeroSerie, 150],
      ["localização", localizacao, 150],
    ];

    for (const [nome, valor, limite] of limites) {
      if (valor && valor.length > limite) {
        return erroJson(`O campo ${nome} ultrapassa ${limite} caracteres.`, 400);
      }
    }

    if (observacoes && observacoes.length > 60000) {
      return erroJson("As observações ultrapassam o tamanho permitido.", 400);
    }

    const id = `EQ-${randomUUID()}`;

    await pool.execute<ResultSetHeader>(
      `
        INSERT INTO equipamentos (
          id, patrimonio, tipo, fabricante, modelo, numero_serie,
          localizacao, status, observacoes, detalhes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        patrimonio,
        tipo,
        fabricante,
        modelo,
        numeroSerie,
        localizacao,
        status,
        observacoes,
        JSON.stringify(detalhes),
      ],
    );

    return NextResponse.json(
      {
        id,
        patrimonio: patrimonio ?? "",
        tipo,
        fabricante: fabricante ?? "",
        modelo: modelo ?? "",
        numeroSerie: numeroSerie ?? "",
        localizacao: localizacao ?? "",
        status,
        observacoes: observacoes ?? "",
        detalhes,
      },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (erro) {
    const erroBanco = erro as { code?: string };

    if (erroBanco.code === "ER_DUP_ENTRY") {
      return erroJson("Já existe um equipamento com esse patrimônio.", 409);
    }

    console.error("Erro ao cadastrar equipamento:", erro);
    return erroJson(
      "Não foi possível cadastrar o equipamento. Confirme se a tabela equipamentos foi criada no banco.",
      500,
    );
  }
}
