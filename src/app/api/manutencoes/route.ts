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
  "tela",
  "teclado",
  "bateria",
  "carregador",
  "touchpad",
  "sistema-operacional",
  "wifi",
  "bluetooth",
  "audio",
  "camera",
  "carcaca",
  "dobradica",
  "usb",
  "outro",
] as const;

const MAX_ANEXOS = 5;
const MAX_TAMANHO_ANEXO = 5 * 1024 * 1024;

type AnexoEntrada = {
  id?: string;
  nome: string;
  tipo: string;
  tamanho: number;
  dados: string;
};

type ManutencaoEntrada = {
  id?: string;
  chromebookId: string;
  data: string;
  tipo: (typeof TIPOS)[number];
  categoria: (typeof CATEGORIAS)[number];
  descricao: string;
  observacao?: string;
  quemRealizou: string;
  anexos?: AnexoEntrada[];
  custo?: number;
  destinoReparo?: string;
  resultado?: string;
};

type ManutencaoRow = RowDataPacket & {
  id: string;
  chromebook_id: string;
  tipo: string;
  categoria: string | null;
  data_ocorrencia: string | Date | null;
  descricao: string;
  observacao: string | null;
  quem_realizou: string | null;
  custo: string | number | null;
  destino_reparo: string | null;
  resultado: string | null;
  created_at: string | Date;
};

type AnexoRow = RowDataPacket & {
  id: string | number;
  manutencao_id: string;
  nome_arquivo: string;
  tipo_mime: string | null;
  tamanho_bytes: string | number | null;
  conteudo_base64: string;
};

type ChromebookRow = RowDataPacket & {
  id: string;
  status: string;
};

type EventoReparoRow = RowDataPacket & {
  tipo: string;
};

type AnexoNormalizado = {
  nome: string;
  tipo: string;
  tamanho: number;
  dados: string;
};

type EntradaNormalizada = {
  chromebookId: string;
  data: string;
  tipo: (typeof TIPOS)[number];
  categoria: (typeof CATEGORIAS)[number];
  descricao: string;
  observacao: string;
  quemRealizou: string;
  anexos: AnexoNormalizado[];
  custo: number;
  destinoReparo: string;
  resultado: string;
};

class ErroValidacao extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErroValidacao";
  }
}

function respostaErro(
  erro: unknown,
  statusPadrao = 500,
) {
  if (erro instanceof ErroValidacao) {
    return NextResponse.json(
      { erro: erro.message },
      {
        status: 400,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  console.error("Erro na API de manutenções:", erro);

  return NextResponse.json(
    { erro: "Não foi possível concluir a operação." },
    {
      status: statusPadrao,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

async function verificarAutenticacao() {
  try {
    const usuario = await obterUsuarioAutenticado();

    if (!usuario) {
      return NextResponse.json(
        { erro: "Não autenticado." },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    return null;
  } catch (erro) {
    console.error("Erro ao verificar autenticação:", erro);

    return NextResponse.json(
      { erro: "Não foi possível verificar a sessão." },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function converterData(valor: string | Date | null): string {
  if (!valor) return "";

  if (valor instanceof Date) {
    const ano = valor.getFullYear();
    const mes = String(valor.getMonth() + 1).padStart(2, "0");
    const dia = String(valor.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  const correspondencia = String(valor).match(/^(\d{4}-\d{2}-\d{2})/);

  return correspondencia ? correspondencia[1] : "";
}

function normalizarEntrada(
  valor: unknown,
): EntradaNormalizada {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    throw new ErroValidacao("Os dados enviados são inválidos.");
  }

  const entrada = valor as Record<string, unknown>;

  const chromebookId = texto(entrada.chromebookId);
  const data = texto(entrada.data);
  const tipo = texto(entrada.tipo);
  const categoria = texto(entrada.categoria);
  const descricao = texto(entrada.descricao);
  const observacao = texto(entrada.observacao);
  const quemRealizou = texto(entrada.quemRealizou);
  const destinoReparo = texto(entrada.destinoReparo);
  const resultado = texto(entrada.resultado);

  if (!chromebookId) {
    throw new ErroValidacao("Informe o Chromebook da manutenção.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    throw new ErroValidacao("Informe uma data válida.");
  }

  const dataValidacao = new Date(`${data}T00:00:00.000Z`);

  if (
    Number.isNaN(dataValidacao.getTime()) ||
    dataValidacao.toISOString().slice(0, 10) !== data
  ) {
    throw new ErroValidacao("A data informada não existe.");
  }

  if (!TIPOS.includes(tipo as (typeof TIPOS)[number])) {
    throw new ErroValidacao("O tipo de manutenção é inválido.");
  }

  if (!CATEGORIAS.includes(categoria as (typeof CATEGORIAS)[number])) {
    throw new ErroValidacao("A categoria da manutenção é inválida.");
  }

  if (!descricao) {
    throw new ErroValidacao("Informe a descrição da manutenção.");
  }

  if (!quemRealizou) {
    throw new ErroValidacao("Informe quem realizou a manutenção.");
  }

  if (descricao.length > 20000 || observacao.length > 20000) {
    throw new ErroValidacao("A descrição ou observação é muito extensa.");
  }

  if (quemRealizou.length > 150) {
    throw new ErroValidacao("O nome de quem realizou excede 150 caracteres.");
  }

  if (destinoReparo.length > 200) {
    throw new ErroValidacao("O destino do reparo excede 200 caracteres.");
  }

  if (tipo === "envio-para-reparo" && !destinoReparo) {
    throw new ErroValidacao(
      "Informe o destino para onde o Chromebook será enviado.",
    );
  }

  const custoRecebido = entrada.custo ?? 0;
  const custo = Number(custoRecebido);

  if (
    typeof custoRecebido === "boolean" ||
    !Number.isFinite(custo) ||
    custo < 0 ||
    custo > 99999999.99
  ) {
    throw new ErroValidacao("O custo informado é inválido.");
  }

  const anexosRecebidos = entrada.anexos ?? [];

  if (!Array.isArray(anexosRecebidos)) {
    throw new ErroValidacao("A lista de anexos é inválida.");
  }

  if (anexosRecebidos.length > MAX_ANEXOS) {
    throw new ErroValidacao(
      `É permitido anexar no máximo ${MAX_ANEXOS} arquivos por manutenção.`,
    );
  }

  const anexos: AnexoNormalizado[] = anexosRecebidos.map(
    (item: unknown) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw new ErroValidacao("Um dos anexos é inválido.");
      }

      const anexo = item as Record<string, unknown>;
      const nome = texto(anexo.nome);
      const tipoMime = texto(anexo.tipo);
      const dados = typeof anexo.dados === "string" ? anexo.dados : "";
      const tamanho = Number(anexo.tamanho);

      if (!nome || nome.length > 255) {
        throw new ErroValidacao(
          "O nome de um anexo é inválido ou muito extenso.",
        );
      }

      if (tipoMime.length > 150) {
        throw new ErroValidacao("O tipo de um anexo é inválido.");
      }

      if (
        !Number.isInteger(tamanho) ||
        tamanho < 0 ||
        tamanho > MAX_TAMANHO_ANEXO
      ) {
        throw new ErroValidacao(
          "Cada anexo deve ter no máximo 5 MB.",
        );
      }

      const correspondencia = dados.match(
        /^data:([^;,]+)?;base64,([A-Za-z0-9+/]*={0,2})$/,
      );

      if (!correspondencia) {
        throw new ErroValidacao(
          `O arquivo "${nome}" não contém dados válidos.`,
        );
      }

      const conteudoBase64 = correspondencia[2];

      if (conteudoBase64.length % 4 !== 0) {
        throw new ErroValidacao(
          `O arquivo "${nome}" contém dados inválidos.`,
        );
      }

      const tamanhoReal = Buffer.from(
        conteudoBase64,
        "base64",
      ).length;

      if (tamanhoReal !== tamanho) {
        throw new ErroValidacao(
          `O tamanho do arquivo "${nome}" não corresponde aos dados enviados.`,
        );
      }

      if (tamanhoReal > MAX_TAMANHO_ANEXO) {
        throw new ErroValidacao(
          "Cada anexo deve ter no máximo 5 MB.",
        );
      }

      return {
        nome,
        tipo: tipoMime || correspondencia[1] || "application/octet-stream",
        tamanho,
        dados,
      };
    },
  );

  return {
    chromebookId,
    data,
    tipo: tipo as (typeof TIPOS)[number],
    categoria: categoria as (typeof CATEGORIAS)[number],
    descricao,
    observacao,
    quemRealizou,
    anexos,
    custo: Math.round(custo * 100) / 100,
    destinoReparo,
    resultado,
  };
}

async function inserirAnexos(
  conexao: Awaited<ReturnType<typeof pool.getConnection>>,
  manutencaoId: string,
  anexos: AnexoNormalizado[],
) {
  for (const anexo of anexos) {
    await conexao.execute(
      `INSERT INTO manutencao_anexos
        (
          manutencao_id,
          nome_arquivo,
          tipo_mime,
          tamanho_bytes,
          conteudo_base64
        )
       VALUES (?, ?, ?, ?, ?)`,
      [
        manutencaoId,
        anexo.nome,
        anexo.tipo,
        anexo.tamanho,
        anexo.dados,
      ],
    );
  }
}

async function listarRegistros(id?: string) {
  const parametros: string[] = [];
  let filtro = "";

  if (id) {
    filtro = "WHERE m.id = ?";
    parametros.push(id);
  }

  const [manutencoes] = await pool.execute<ManutencaoRow[]>(
    `SELECT
        m.id,
        m.chromebook_id,
        m.tipo,
        m.categoria,
        m.data_ocorrencia,
        m.descricao,
        m.observacao,
        m.quem_realizou,
        m.custo,
        m.destino_reparo,
        m.resultado,
        m.created_at
     FROM manutencoes m
     ${filtro}
     ORDER BY m.data_ocorrencia DESC, m.created_at DESC`,
    parametros,
  );

  if (manutencoes.length === 0) {
    return [];
  }

  const ids = manutencoes.map((manutencao) => manutencao.id);
  const placeholders = ids.map(() => "?").join(", ");

  const [anexos] = await pool.execute<AnexoRow[]>(
    `SELECT
        id,
        manutencao_id,
        nome_arquivo,
        tipo_mime,
        tamanho_bytes,
        conteudo_base64
     FROM manutencao_anexos
     WHERE manutencao_id IN (${placeholders})
     ORDER BY id ASC`,
    ids,
  );

  const anexosPorManutencao = new Map<
    string,
    {
      id: string;
      nome: string;
      tipo: string;
      tamanho: number;
      dados: string;
    }[]
  >();

  for (const anexo of anexos) {
    const lista = anexosPorManutencao.get(anexo.manutencao_id) ?? [];

    lista.push({
      id: String(anexo.id),
      nome: anexo.nome_arquivo,
      tipo: anexo.tipo_mime ?? "application/octet-stream",
      tamanho: Number(anexo.tamanho_bytes ?? 0),
      dados: anexo.conteudo_base64,
    });

    anexosPorManutencao.set(anexo.manutencao_id, lista);
  }

  return manutencoes.map((manutencao) => ({
    id: manutencao.id,
    chromebookId: manutencao.chromebook_id,
    data: converterData(manutencao.data_ocorrencia),
    tipo: manutencao.tipo,
    categoria: manutencao.categoria ?? "outro",
    descricao: manutencao.descricao,
    observacao: manutencao.observacao ?? "",
    quemRealizou: manutencao.quem_realizou ?? "",
    custo: Number(manutencao.custo ?? 0),
    destinoReparo: manutencao.destino_reparo ?? "",
    resultado: manutencao.resultado ?? "",
    anexos: anexosPorManutencao.get(manutencao.id) ?? [],
  }));
}

/**
 * Recalcula o status de reparo com base no evento mais recente.
 *
 * Se o último evento for um envio, o Chromebook permanece em reparo.
 * Se não houver envio pendente e o status atual for em-reparo,
 * ele volta para disponivel.
 *
 * Outros status, como em-uso e para-descarte, não são sobrescritos
 * quando não existe um envio pendente.
 */
async function recalcularStatusReparo(
  conexao: Awaited<ReturnType<typeof pool.getConnection>>,
  chromebookId: string,
) {
  const [eventos] = await conexao.execute<EventoReparoRow[]>(
    `SELECT tipo
     FROM manutencoes
     WHERE chromebook_id = ?
       AND tipo IN ('envio-para-reparo', 'retorno-de-reparo')
     ORDER BY
       data_ocorrencia DESC,
       created_at DESC,
       id DESC
     LIMIT 1`,
    [chromebookId],
  );

  const [chromebooks] = await conexao.execute<ChromebookRow[]>(
    `SELECT id, status
     FROM chromebooks
     WHERE id = ?
     FOR UPDATE`,
    [chromebookId],
  );

  if (chromebooks.length === 0) {
    throw new ErroValidacao("O Chromebook vinculado não foi encontrado.");
  }

  const statusAtual = chromebooks[0].status;
  const ultimoEvento = eventos[0]?.tipo;

  if (ultimoEvento === "envio-para-reparo") {
    if (statusAtual !== "em-reparo") {
      await conexao.execute(
        "UPDATE chromebooks SET status = 'em-reparo' WHERE id = ?",
        [chromebookId],
      );
    }

    return;
  }

  if (statusAtual === "em-reparo") {
    await conexao.execute(
      "UPDATE chromebooks SET status = 'disponivel' WHERE id = ?",
      [chromebookId],
    );
  }
}

// GET: listar manutenções
export async function GET(request: Request) {
  const falhaAutenticacao = await verificarAutenticacao();

  if (falhaAutenticacao) {
    return falhaAutenticacao;
  }

  try {
    const url = new URL(request.url);
    const id = texto(url.searchParams.get("id"));

    const registros = await listarRegistros(id || undefined);

    if (id && registros.length === 0) {
      return NextResponse.json(
        { erro: "Manutenção não encontrada." },
        {
          status: 404,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    return NextResponse.json(registros, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (erro) {
    return respostaErro(erro);
  }
}

// POST: cadastrar manutenção
export async function POST(request: Request) {
  const falhaAutenticacao = await verificarAutenticacao();

  if (falhaAutenticacao) {
    return falhaAutenticacao;
  }

  const conexao = await pool.getConnection();

  try {
    const entrada = normalizarEntrada(await request.json());

    await conexao.beginTransaction();

    const [chromebooks] = await conexao.execute<ChromebookRow[]>(
      `SELECT id, status
       FROM chromebooks
       WHERE id = ?
       FOR UPDATE`,
      [entrada.chromebookId],
    );

    if (chromebooks.length === 0) {
      throw new ErroValidacao("O Chromebook selecionado não existe.");
    }

    if (
      entrada.tipo === "envio-para-reparo" &&
      chromebooks[0].status === "em-reparo"
    ) {
      throw new ErroValidacao(
        "Este Chromebook já está marcado como em reparo.",
      );
    }

    const id = randomUUID();

    await conexao.execute(
      `INSERT INTO manutencoes
        (
          id,
          chromebook_id,
          tipo,
          categoria,
          data_ocorrencia,
          descricao,
          observacao,
          quem_realizou,
          custo,
          destino_reparo,
          resultado
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        entrada.chromebookId,
        entrada.tipo,
        entrada.categoria,
        entrada.data,
        entrada.descricao,
        entrada.observacao || null,
        entrada.quemRealizou,
        entrada.custo,
        entrada.destinoReparo || null,
        entrada.resultado || null,
      ],
    );

    await inserirAnexos(conexao, id, entrada.anexos);

    if (
      entrada.tipo === "envio-para-reparo" ||
      entrada.tipo === "retorno-de-reparo"
    ) {
      await recalcularStatusReparo(conexao, entrada.chromebookId);
    }

    await conexao.commit();

    const registros = await listarRegistros(id);

    return NextResponse.json(registros[0], {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (erro) {
    await conexao.rollback();
    return respostaErro(erro);
  } finally {
    conexao.release();
  }
}

// PUT: editar manutenção
export async function PUT(request: Request) {
  const falhaAutenticacao = await verificarAutenticacao();

  if (falhaAutenticacao) {
    return falhaAutenticacao;
  }

  const conexao = await pool.getConnection();

  try {
    const corpo = await request.json();

    if (!corpo || typeof corpo !== "object" || Array.isArray(corpo)) {
      throw new ErroValidacao("Os dados enviados são inválidos.");
    }

    const id = texto((corpo as Record<string, unknown>).id);

    if (!id) {
      throw new ErroValidacao("O identificador da manutenção é obrigatório.");
    }

    const entrada = normalizarEntrada(corpo);

    await conexao.beginTransaction();

    const [existentes] = await conexao.execute<
      (ManutencaoRow & { chromebook_id: string })[]
    >(
      `SELECT
          id,
          chromebook_id,
          tipo,
          categoria,
          data_ocorrencia,
          descricao,
          observacao,
          quem_realizou,
          custo,
          destino_reparo,
          resultado,
          created_at
       FROM manutencoes
       WHERE id = ?
       FOR UPDATE`,
      [id],
    );

    if (existentes.length === 0) {
      throw new ErroValidacao("Manutenção não encontrada.");
    }

    const manutencaoExistente = existentes[0];

    if (manutencaoExistente.chromebook_id !== entrada.chromebookId) {
      throw new ErroValidacao(
        "Não é permitido transferir uma manutenção para outro Chromebook.",
      );
    }

    const [chromebooks] = await conexao.execute<ChromebookRow[]>(
      `SELECT id, status
       FROM chromebooks
       WHERE id = ?
       FOR UPDATE`,
      [entrada.chromebookId],
    );

    if (chromebooks.length === 0) {
      throw new ErroValidacao("O Chromebook vinculado não foi encontrado.");
    }

    if (
      entrada.tipo === "envio-para-reparo" &&
      manutencaoExistente.tipo !== "envio-para-reparo" &&
      chromebooks[0].status === "em-reparo"
    ) {
      throw new ErroValidacao(
        "Este Chromebook já está marcado como em reparo.",
      );
    }

    await conexao.execute(
      `UPDATE manutencoes
       SET
         tipo = ?,
         categoria = ?,
         data_ocorrencia = ?,
         descricao = ?,
         observacao = ?,
         quem_realizou = ?,
         custo = ?,
         destino_reparo = ?,
         resultado = ?
       WHERE id = ?`,
      [
        entrada.tipo,
        entrada.categoria,
        entrada.data,
        entrada.descricao,
        entrada.observacao || null,
        entrada.quemRealizou,
        entrada.custo,
        entrada.destinoReparo || null,
        entrada.resultado || null,
        id,
      ],
    );

    await conexao.execute(
      "DELETE FROM manutencao_anexos WHERE manutencao_id = ?",
      [id],
    );

    await inserirAnexos(conexao, id, entrada.anexos);

    if (
      manutencaoExistente.tipo === "envio-para-reparo" ||
      manutencaoExistente.tipo === "retorno-de-reparo" ||
      entrada.tipo === "envio-para-reparo" ||
      entrada.tipo === "retorno-de-reparo"
    ) {
      await recalcularStatusReparo(conexao, entrada.chromebookId);
    }

    await conexao.commit();

    const registros = await listarRegistros(id);

    return NextResponse.json(registros[0], {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (erro) {
    await conexao.rollback();

    if (
      erro instanceof Error &&
      erro.message === "Manutenção não encontrada."
    ) {
      return NextResponse.json(
        { erro: erro.message },
        {
          status: 404,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    return respostaErro(erro);
  } finally {
    conexao.release();
  }
}

// DELETE: excluir manutenção
export async function DELETE(request: Request) {
  const falhaAutenticacao = await verificarAutenticacao();

  if (falhaAutenticacao) {
    return falhaAutenticacao;
  }

  const conexao = await pool.getConnection();

  try {
    const url = new URL(request.url);
    const id = texto(url.searchParams.get("id"));

    if (!id) {
      throw new ErroValidacao(
        "Informe o identificador da manutenção que deseja excluir.",
      );
    }

    await conexao.beginTransaction();

    const [existentes] = await conexao.execute<ManutencaoRow[]>(
      `SELECT
          id,
          chromebook_id,
          tipo,
          categoria,
          data_ocorrencia,
          descricao,
          observacao,
          quem_realizou,
          custo,
          destino_reparo,
          resultado,
          created_at
       FROM manutencoes
       WHERE id = ?
       FOR UPDATE`,
      [id],
    );

    if (existentes.length === 0) {
      await conexao.rollback();

      return NextResponse.json(
        { erro: "Manutenção não encontrada." },
        {
          status: 404,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    const manutencao = existentes[0];

    await conexao.execute(
      "DELETE FROM manutencao_anexos WHERE manutencao_id = ?",
      [id],
    );

    const [resultado] = await conexao.execute<ResultSetHeader>(
      "DELETE FROM manutencoes WHERE id = ?",
      [id],
    );

    if (resultado.affectedRows === 0) {
      throw new ErroValidacao("Não foi possível excluir a manutenção.");
    }

    if (
      manutencao.tipo === "envio-para-reparo" ||
      manutencao.tipo === "retorno-de-reparo"
    ) {
      await recalcularStatusReparo(
        conexao,
        manutencao.chromebook_id,
      );
    }

    await conexao.commit();

    return NextResponse.json(
      { sucesso: true, id },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (erro) {
    await conexao.rollback();
    return respostaErro(erro);
  } finally {
    conexao.release();
  }
}