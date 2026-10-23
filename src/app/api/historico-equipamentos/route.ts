import { randomUUID } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import {
  obterUsuarioAutenticado,
  podeAcessarUnidade,
  type UsuarioAutenticado,
} from "@/lib/auth";

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

const UNIDADES = ["CE", "JP"] as const;
const MAX_ANEXOS = 5;
const MAX_TAMANHO_ANEXO = 5 * 1024 * 1024;

type UnidadeId = (typeof UNIDADES)[number];

type HistoricoRow = RowDataPacket & {
  id: string;
  equipamento_id: string;
  equipamento_patrimonio: string | null;
  equipamento_tipo: string;
  equipamento_fabricante: string | null;
  equipamento_modelo: string | null;
  equipamento_localizacao: string | null;
  equipamento_unidade_id: UnidadeId;
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

type AnexoEntrada = {
  nome: string;
  tipo?: string;
  tamanho: number;
  dados: string;
};

type ResultadoAutenticacao =
  | { usuario: UsuarioAutenticado; erro: null }
  | { usuario: null; erro: NextResponse };

function erroJson(mensagem: string, status = 400) {
  return NextResponse.json(
    { erro: mensagem },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

async function verificarAutenticacao(): Promise<ResultadoAutenticacao> {
  try {
    const usuario = await obterUsuarioAutenticado();

    if (!usuario) {
      return {
        usuario: null,
        erro: erroJson("Não autenticado.", 401),
      };
    }

    return { usuario, erro: null };
  } catch (erro) {
    console.error("Erro ao verificar autenticação:", erro);

    return {
      usuario: null,
      erro: erroJson("Não foi possível verificar a sessão.", 500),
    };
  }
}

function ehAdministradorGeral(usuario: UsuarioAutenticado): boolean {
  // Mantém o perfil antigo durante a migração da conta administrativa.
  return (
    usuario.perfil === "admin_geral" ||
    usuario.perfil === "admin"
  );
}

function unidadeValida(valor: unknown): valor is UnidadeId {
  return (
    typeof valor === "string" &&
    UNIDADES.includes(valor as UnidadeId)
  );
}

function texto(valor: unknown): string {
  return typeof valor === "string" || typeof valor === "number"
    ? String(valor).trim()
    : "";
}

function converterData(valor: string | Date): string {
  if (valor instanceof Date) {
    return (
      valor.getFullYear() +
      "-" +
      String(valor.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(valor.getDate()).padStart(2, "0")
    );
  }

  return String(valor).slice(0, 10);
}

function dataValida(data: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return false;
  }

  const [ano, mes, dia] = data.split("-").map(Number);
  const dataVerificada = new Date(Date.UTC(ano, mes - 1, dia));

  return (
    dataVerificada.getUTCFullYear() === ano &&
    dataVerificada.getUTCMonth() === mes - 1 &&
    dataVerificada.getUTCDate() === dia
  );
}

function prepararDados(body: Record<string, unknown>) {
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

  const custoInformado =
    body.custo === undefined ||
    body.custo === null ||
    body.custo === ""
      ? 0
      : Number(body.custo);
  const custo =
    tipo === "manutencao" ||
    tipo === "reposicao-de-peca" ||
    tipo === "retorno-de-reparo"
      ? custoInformado
      : 0;

  return {
    equipamentoId,
    tipo,
    categoria,
    data,
    descricao,
    observacao,
    quemRealizou,
    destinoReparo,
    resultado,
    statusFinal,
    custo,
  };
}

function validarDados(
  dados: ReturnType<typeof prepararDados>,
  anexos?: AnexoEntrada[],
): string | null {
  const {
    equipamentoId,
    tipo,
    categoria,
    data,
    descricao,
    observacao,
    destinoReparo,
    resultado,
    statusFinal,
    custo,
  } = dados;

  if (!equipamentoId) return "Selecione o equipamento.";

  if (!(TIPOS as readonly string[]).includes(tipo)) {
    return "Tipo de registro inválido.";
  }

  if (!dataValida(data)) {
    return "Informe uma data válida.";
  }

  if (!descricao) return "Preencha a descrição.";

  if (
    descricao.length > 60000 ||
    observacao.length > 60000 ||
    resultado.length > 60000
  ) {
    return "Um dos textos ultrapassa o tamanho permitido.";
  }

  if (
    !Number.isFinite(custo) ||
    custo < 0 ||
    custo > 99999999.99
  ) {
    return "Informe um custo válido.";
  }

  if (
    categoria &&
    !(CATEGORIAS as readonly string[]).includes(categoria)
  ) {
    return "Categoria inválida.";
  }

  if (
    tipo === "envio-para-reparo" &&
    !destinoReparo
  ) {
    return "Informe a assistência ou empresa de reparo.";
  }

  if (
    tipo === "retorno-de-reparo" &&
    (
      !statusFinal ||
      !(STATUS_FINAIS as readonly string[]).includes(statusFinal)
    )
  ) {
    return "Selecione o status do equipamento após o retorno.";
  }

  if (
    tipo === "retorno-de-reparo" &&
    (
      !Number.isFinite(custo) ||
      custo < 0
    )
  ) {
    return "Informe o custo final do reparo.";
  }

  if (anexos) {
    if (anexos.length > MAX_ANEXOS) {
      return "É permitido anexar no máximo 5 arquivos.";
    }

    for (const anexo of anexos) {
      if (
        !anexo ||
        typeof anexo.nome !== "string" ||
        anexo.nome.trim() === "" ||
        typeof anexo.dados !== "string" ||
        anexo.dados.length > MAX_TAMANHO_ANEXO * 1.5 ||
        !Number.isFinite(anexo.tamanho) ||
        anexo.tamanho < 0 ||
        anexo.tamanho > MAX_TAMANHO_ANEXO
      ) {
        return "Um dos anexos é inválido ou ultrapassa 5 MB.";
      }
    }
  }

  return null;
}

async function obterUnidadeSolicitada(request: Request): Promise<{
  unidadeId: UnidadeId | null;
  erro: NextResponse | null;
}> {
  const autenticacao = await verificarAutenticacao();

  if (autenticacao.erro) {
    return { unidadeId: null, erro: autenticacao.erro };
  }

  const usuario = autenticacao.usuario;
  const url = new URL(request.url);
  const unidadeParam = url.searchParams.get("unidade");

  if (unidadeParam && !unidadeValida(unidadeParam)) {
    return {
      unidadeId: null,
      erro: erroJson("Unidade inválida."),
    };
  }

  if (unidadeParam && !podeAcessarUnidade(usuario, unidadeParam)) {
    return {
      unidadeId: null,
      erro: erroJson("Você não tem permissão para consultar esta unidade.", 403),
    };
  }

  if (ehAdministradorGeral(usuario)) {
    return {
      unidadeId: unidadeParam as UnidadeId | null,
      erro: null,
    };
  }

  return {
    unidadeId: unidadeParam as UnidadeId | null,
    erro: null,
  };
}

export async function GET(request: Request) {
  const { unidadeId, erro } = await obterUnidadeSolicitada(request);

  if (erro) {
    return erro;
  }

  try {
    const [registros] = await pool.execute<HistoricoRow[]>(
      `
        SELECT
          h.id,
          h.equipamento_id,
          e.patrimonio AS equipamento_patrimonio,
          e.tipo AS equipamento_tipo,
          e.fabricante AS equipamento_fabricante,
          e.modelo AS equipamento_modelo,
          e.localizacao AS equipamento_localizacao,
          e.unidade_id AS equipamento_unidade_id,
          h.tipo,
          h.categoria,
          h.data_ocorrencia,
          h.descricao,
          h.observacao,
          h.quem_realizou,
          h.custo,
          h.destino_reparo,
          h.resultado,
          h.status_final,
          h.created_at
        FROM historico_equipamentos h
        INNER JOIN equipamentos e ON e.id = h.equipamento_id
        ${unidadeId ? "WHERE e.unidade_id = ?" : ""}
        ORDER BY h.data_ocorrencia DESC, h.created_at DESC
      `,
      unidadeId ? [unidadeId] : [],
    );

    const ids = registros.map((registro) => registro.id);
    const anexosPorHistorico: Record<
      string,
      {
        id: number;
        nome: string;
        tipo: string;
        tamanho: number;
        dados: string;
      }[]
    > = {};

    if (ids.length) {
      const placeholders = ids.map(() => "?").join(", ");

      const [anexos] = await pool.execute<
        (
          RowDataPacket & {
            id: number;
            historico_id: string;
            nome_arquivo: string;
            tipo_mime: string | null;
            tamanho_bytes: number;
            conteudo_base64: string;
          }
        )[]
      >(
        `
          SELECT
            id,
            historico_id,
            nome_arquivo,
            tipo_mime,
            tamanho_bytes,
            conteudo_base64
          FROM historico_equipamento_anexos
          WHERE historico_id IN (${placeholders})
          ORDER BY id ASC
        `,
        ids,
      );

      for (const anexo of anexos) {
        (anexosPorHistorico[anexo.historico_id] ??= []).push({
          id: anexo.id,
          nome: anexo.nome_arquivo,
          tipo: anexo.tipo_mime ?? "application/octet-stream",
          tamanho: Number(anexo.tamanho_bytes),
          dados: anexo.conteudo_base64,
        });
      }
    }

    return NextResponse.json(
      registros.map((row) => ({
        id: row.id,
        equipamentoId: row.equipamento_id,
        equipamento: {
          patrimonio: row.equipamento_patrimonio ?? "",
          tipo: row.equipamento_tipo,
          fabricante: row.equipamento_fabricante ?? "",
          modelo: row.equipamento_modelo ?? "",
          localizacao: row.equipamento_localizacao ?? "",
          unidadeId: row.equipamento_unidade_id,
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
      })),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (erro) {
    console.error("Erro ao consultar histórico:", erro);

    return erroJson(
      "Não foi possível consultar o histórico. Confira a conexão e a estrutura do banco.",
      500,
    );
  }
}

export async function POST(request: Request) {
  const autenticacao = await verificarAutenticacao();

  if (autenticacao.erro) {
    return autenticacao.erro;
  }

  const usuario = autenticacao.usuario;
  const conexao = await pool.getConnection();
  let transacaoIniciada = false;

  try {
    const bodyDesconhecido: unknown = await request.json();

    if (
      !bodyDesconhecido ||
      typeof bodyDesconhecido !== "object" ||
      Array.isArray(bodyDesconhecido)
    ) {
      return erroJson("Os dados enviados são inválidos.");
    }

    const body = bodyDesconhecido as Record<string, unknown>;
    const dados = prepararDados(body);
    const anexos = Array.isArray(body.anexos)
      ? (body.anexos as AnexoEntrada[])
      : [];

    const erroValidacao = validarDados(dados, anexos);

    if (erroValidacao) {
      return erroJson(erroValidacao);
    }

    await conexao.beginTransaction();
    transacaoIniciada = true;

    const [equipamentos] = await conexao.execute<
      (RowDataPacket & {
        id: string;
        status: string;
        unidade_id: string;
      })[]
    >(
      `
        SELECT id, status, unidade_id
        FROM equipamentos
        WHERE id = ?
        FOR UPDATE
      `,
      [dados.equipamentoId],
    );

    const equipamento = equipamentos[0];

    if (!equipamento) {
      await conexao.rollback();
      transacaoIniciada = false;
      return erroJson("O equipamento selecionado não existe.", 404);
    }

    if (!podeAcessarUnidade(usuario, equipamento.unidade_id)) {
      await conexao.rollback();
      transacaoIniciada = false;

      return erroJson(
        "Você não tem permissão para registrar histórico neste equipamento.",
        403,
      );
    }

    if (dados.tipo === "retorno-de-reparo") {
      if (equipamento.status !== "em-reparo") {
        await conexao.rollback();
        transacaoIniciada = false;
        return erroJson("O retorno só pode ser registrado para um equipamento que esteja em reparo.");
      }

      const [eventos] = await conexao.execute<
        (RowDataPacket & { tipo: string })[]
      >(
        `
          SELECT tipo
          FROM historico_equipamentos
          WHERE equipamento_id = ?
            AND tipo IN ('envio-para-reparo', 'retorno-de-reparo')
          ORDER BY created_at DESC, data_ocorrencia DESC
          LIMIT 1
          FOR UPDATE
        `,
        [dados.equipamentoId],
      );

      if (eventos[0]?.tipo !== "envio-para-reparo") {
        await conexao.rollback();
        transacaoIniciada = false;
        return erroJson("Registre primeiro o envio para reparo. Este equipamento não tem um envio pendente de retorno.");
      }
    }

    const id = randomUUID();

    await conexao.execute<ResultSetHeader>(
      `
        INSERT INTO historico_equipamentos (
          id,
          equipamento_id,
          tipo,
          categoria,
          data_ocorrencia,
          descricao,
          observacao,
          quem_realizou,
          custo,
          destino_reparo,
          resultado,
          status_final
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        dados.equipamentoId,
        dados.tipo,
        dados.categoria || null,
        dados.data,
        dados.descricao,
        dados.observacao || null,
        dados.quemRealizou || null,
        dados.custo,
        dados.destinoReparo || null,
        dados.resultado || null,
        dados.statusFinal || null,
      ],
    );

    for (const anexo of anexos) {
      await conexao.execute<ResultSetHeader>(
        `
          INSERT INTO historico_equipamento_anexos (
            historico_id,
            nome_arquivo,
            tipo_mime,
            tamanho_bytes,
            conteudo_base64
          )
          VALUES (?, ?, ?, ?, ?)
        `,
        [
          id,
          anexo.nome.slice(0, 255),
          texto(anexo.tipo) || null,
          anexo.tamanho,
          anexo.dados,
        ],
      );
    }

    if (dados.tipo === "envio-para-reparo") {
      await conexao.execute<ResultSetHeader>(
        `
          UPDATE equipamentos
          SET status = 'em-reparo'
          WHERE id = ? AND unidade_id = ?
        `,
        [dados.equipamentoId, equipamento.unidade_id],
      );
    } else if (dados.tipo === "retorno-de-reparo") {
      await conexao.execute<ResultSetHeader>(
        `
          UPDATE equipamentos
          SET status = ?
          WHERE id = ? AND unidade_id = ?
        `,
        [
          dados.statusFinal,
          dados.equipamentoId,
          equipamento.unidade_id,
        ],
      );
    }

    await conexao.commit();
    transacaoIniciada = false;

    return NextResponse.json(
      { id, mensagem: "Registro salvo com sucesso." },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (erro) {
    if (transacaoIniciada) {
      try {
        await conexao.rollback();
      } catch {
        // A transação pode já ter sido encerrada.
      }
    }

    console.error("Erro ao salvar histórico:", erro);

    return erroJson("Não foi possível salvar o registro do histórico.", 500);
  } finally {
    conexao.release();
  }
}

export async function PUT(request: Request) {
  const autenticacao = await verificarAutenticacao();

  if (autenticacao.erro) {
    return autenticacao.erro;
  }

  const usuario = autenticacao.usuario;
  const conexao = await pool.getConnection();
  let transacaoIniciada = false;

  try {
    const entradaDesconhecida: unknown = await request.json();

    if (
      !entradaDesconhecida ||
      typeof entradaDesconhecida !== "object" ||
      Array.isArray(entradaDesconhecida)
    ) {
      return erroJson("Os dados enviados são inválidos.");
    }

    const body = entradaDesconhecida as Record<string, unknown>;
    const id = texto(body.id);
    const dados = prepararDados(body);

    if (!id) {
      return erroJson("Informe o ID do registro.");
    }

    const erroValidacao = validarDados(dados);

    if (erroValidacao) {
      return erroJson(erroValidacao);
    }

    await conexao.beginTransaction();
    transacaoIniciada = true;

    const [existentes] = await conexao.execute<
      (
        RowDataPacket & {
          id: string;
          equipamento_id: string;
          tipo_atual: string;
          unidade_id: string;
        }
      )[]
    >(
      `
        SELECT
          h.id,
          h.equipamento_id,
          h.tipo AS tipo_atual,
          e.unidade_id
        FROM historico_equipamentos h
        INNER JOIN equipamentos e ON e.id = h.equipamento_id
        WHERE h.id = ?
        FOR UPDATE
      `,
      [id],
    );

    const existente = existentes[0];

    if (!existente) {
      await conexao.rollback();
      transacaoIniciada = false;
      return erroJson("Registro não encontrado.", 404);
    }

    if (!podeAcessarUnidade(usuario, existente.unidade_id)) {
      await conexao.rollback();
      transacaoIniciada = false;

      return erroJson("Registro não encontrado.", 404);
    }

    if (
      existente.tipo_atual !== dados.tipo &&
      [existente.tipo_atual, dados.tipo].some((tipo) =>
        tipo === "envio-para-reparo" || tipo === "retorno-de-reparo"
      )
    ) {
      await conexao.rollback();
      transacaoIniciada = false;
      return erroJson("Não é permitido transformar um envio ou retorno em outro tipo de registro. Preserve a movimentação original e registre um novo evento.");
    }

    if (existente.equipamento_id !== dados.equipamentoId) {
      await conexao.rollback();
      transacaoIniciada = false;

      return erroJson(
        "Não é permitido transferir um registro para outro equipamento.",
        400,
      );
    }

    const [equipamentos] = await conexao.execute<
      (RowDataPacket & { id: string; unidade_id: string })[]
    >(
      `
        SELECT id, unidade_id
        FROM equipamentos
        WHERE id = ?
        FOR UPDATE
      `,
      [dados.equipamentoId],
    );

    const equipamento = equipamentos[0];

    if (
      !equipamento ||
      equipamento.unidade_id !== existente.unidade_id
    ) {
      await conexao.rollback();
      transacaoIniciada = false;

      return erroJson("Equipamento não encontrado.", 404);
    }

    await conexao.execute<ResultSetHeader>(
      `
        UPDATE historico_equipamentos
        SET
          tipo = ?,
          categoria = ?,
          data_ocorrencia = ?,
          descricao = ?,
          observacao = ?,
          quem_realizou = ?,
          custo = ?,
          destino_reparo = ?,
          resultado = ?,
          status_final = ?
        WHERE id = ?
      `,
      [
        dados.tipo,
        dados.categoria || null,
        dados.data,
        dados.descricao,
        dados.observacao || null,
        dados.quemRealizou || null,
        dados.custo,
        dados.destinoReparo || null,
        dados.resultado || null,
        dados.statusFinal || null,
        id,
      ],
    );

    return await conexao
      .commit()
      .then(() => {
        transacaoIniciada = false;

        return NextResponse.json(
          { id, mensagem: "Registro atualizado com sucesso." },
          { headers: { "Cache-Control": "no-store" } },
        );
      });
  } catch (erro) {
    if (transacaoIniciada) {
      try {
        await conexao.rollback();
      } catch {
        // A transação pode já ter sido encerrada.
      }
    }

    console.error("Erro ao atualizar histórico:", erro);

    return erroJson("Não foi possível atualizar o registro do histórico.", 500);
  } finally {
    conexao.release();
  }
}

export async function DELETE(request: Request) {
  const autenticacao = await verificarAutenticacao();

  if (autenticacao.erro) {
    return autenticacao.erro;
  }

  const usuario = autenticacao.usuario;
  const conexao = await pool.getConnection();
  let transacaoIniciada = false;

  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return erroJson("Os dados enviados são inválidos.");
    }

    const id = texto((body as Record<string, unknown>).id);

    if (!id) {
      return erroJson("Informe o ID do registro.");
    }

    await conexao.beginTransaction();
    transacaoIniciada = true;

    const [registros] = await conexao.execute<
      (RowDataPacket & { id: string; equipamento_id: string; unidade_id: string; tipo: string; status: string })[]
    >(
      `
        SELECT h.id, h.equipamento_id, e.unidade_id, h.tipo, e.status
        FROM historico_equipamentos h
        INNER JOIN equipamentos e ON e.id = h.equipamento_id
        WHERE h.id = ?
        FOR UPDATE
      `,
      [id],
    );

    const registro = registros[0];

    if (!registro) {
      await conexao.rollback();
      transacaoIniciada = false;
      return erroJson("Registro não encontrado.", 404);
    }

    if (!podeAcessarUnidade(usuario, registro.unidade_id)) {
      await conexao.rollback();
      transacaoIniciada = false;
      return erroJson("Registro não encontrado.", 404);
    }

    if (registro.tipo === "envio-para-reparo" && registro.status === "em-reparo") {
      await conexao.rollback();
      transacaoIniciada = false;
      return erroJson("Não é possível excluir um envio enquanto o equipamento estiver aguardando retorno.");
    }

    await conexao.execute<ResultSetHeader>(
      `
        DELETE FROM historico_equipamentos
        WHERE id = ?
      `,
      [id],
    );

    await conexao.commit();
    transacaoIniciada = false;

    return NextResponse.json(
      { id, mensagem: "Registro excluído com sucesso." },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (erro) {
    if (transacaoIniciada) {
      try {
        await conexao.rollback();
      } catch {
        // A transação pode já ter sido encerrada.
      }
    }

    console.error("Erro ao excluir histórico:", erro);

    return erroJson("Não foi possível excluir o registro do histórico.", 500);
  } finally {
    conexao.release();
  }
}
