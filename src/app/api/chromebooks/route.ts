
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { obterUsuarioAutenticado } from "@/lib/auth";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_VALIDOS = [
  "disponivel",
  "em-uso",
  "em-reparo",
  "para-descarte",
] as const;

type StatusChromebook = (typeof STATUS_VALIDOS)[number];

type ChromebookDados = {
  numero: string;
  mac: string | null;
  numeroSerie: string;
  modelo: string;
  sala: string;
  status: StatusChromebook;
  observacoes: string;
};

type ChromebookRow = RowDataPacket & {
  id: string;
  numero: string | null;
  mac: string | null;
  numeroSerie: string | null;
  modelo: string | null;
  sala: string | null;
  status: string;
  observacoes: string | null;
};

function respostaErro(mensagem: string, status: number) {
  return NextResponse.json(
    { erro: mensagem },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

async function verificarAutenticacao() {
  try {
    const usuario = await obterUsuarioAutenticado();

    if (!usuario) {
      return respostaErro("Não autenticado.", 401);
    }

    return null;
  } catch (error) {
    console.error("Erro ao verificar autenticação:", error);

    return respostaErro(
      "Não foi possível verificar a sessão.",
      500
    );
  }
}

function validarDados(body: unknown): {
  dados?: ChromebookDados;
  erro?: string;
} {
  if (
    body === null ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return { erro: "Dados inválidos." };
  }

  const entrada = body as Record<string, unknown>;

  const numero = String(entrada.numero ?? "").trim();

  const macOriginal = String(entrada.mac ?? "")
    .trim()
    .toUpperCase()
    .replace(/-/g, ":");

  const mac = macOriginal || null;

  const numeroSerie = String(
    entrada.numeroSerie ?? ""
  ).trim();

  const modelo = String(entrada.modelo ?? "").trim();
  const sala = String(entrada.sala ?? "").trim();

  const observacoes = String(
    entrada.observacoes ?? ""
  ).trim();

  const status = String(
    entrada.status ?? "disponivel"
  );

  // O MAC só é validado quando informado.
  if (
    mac !== null &&
    !/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(mac)
  ) {
    return {
      erro:
        "Informe um MAC válido, por exemplo: AA:BB:CC:DD:EE:FF.",
    };
  }

  if (
    !STATUS_VALIDOS.includes(
      status as StatusChromebook
    )
  ) {
    return {
      erro: "Status do Chromebook inválido.",
    };
  }

  if (
    numero.length > 50 ||
    numeroSerie.length > 100 ||
    modelo.length > 150 ||
    sala.length > 100 ||
    observacoes.length > 60000
  ) {
    return {
      erro: "Um ou mais campos excedem o tamanho permitido.",
    };
  }

  return {
    dados: {
      numero,
      mac,
      numeroSerie,
      modelo,
      sala,
      status: status as StatusChromebook,
      observacoes,
    },
  };
}

// GET: listar Chromebooks
export async function GET() {
  const falhaAutenticacao =
    await verificarAutenticacao();

  if (falhaAutenticacao) {
    return falhaAutenticacao;
  }

  try {
    const [rows] = await pool.query<ChromebookRow[]>(`
      SELECT
        id,
        chromebook_number AS numero,
        mac_address AS mac,
        serial_number AS numeroSerie,
        model AS modelo,
        room AS sala,
        status,
        notes AS observacoes
      FROM chromebooks
      ORDER BY id
    `);

    return NextResponse.json(rows, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(
      "Erro ao consultar Chromebooks:",
      error
    );

    return respostaErro(
      "Não foi possível consultar os Chromebooks.",
      500
    );
  }
}

// POST: cadastrar Chromebook
export async function POST(request: Request) {
  const falhaAutenticacao =
    await verificarAutenticacao();

  if (falhaAutenticacao) {
    return falhaAutenticacao;
  }

  try {
    const body: unknown = await request.json();
    const resultado = validarDados(body);

    if (!resultado.dados) {
      return respostaErro(resultado.erro!, 400);
    }

    const dados = resultado.dados;

    const [existentes] = await pool.query<
      (RowDataPacket & { id: string })[]
    >("SELECT id FROM chromebooks");

    const ids = existentes
      .map((item) => item.id.match(/^CB-(\d+)$/i))
      .filter(
        (match): match is RegExpMatchArray =>
          match !== null
      )
      .map((match) => Number(match[1]))
      .filter(Number.isSafeInteger);

    const proximoNumero = Math.max(0, ...ids) + 1;

    if (proximoNumero > 999) {
      return respostaErro(
        "O limite de 999 Chromebooks foi atingido.",
        400
      );
    }

    const id = `CB-${String(proximoNumero).padStart(3, "0")}`;

    await pool.execute<ResultSetHeader>(
      `INSERT INTO chromebooks (
        id,
        mac_address,
        serial_number,
        model,
        chromebook_number,
        room,
        status,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        dados.mac,
        dados.numeroSerie || null,
        dados.modelo || null,
        dados.numero || null,
        dados.sala || null,
        dados.status,
        dados.observacoes || null,
      ]
    );

    return NextResponse.json(
      { id, ...dados },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const erro = error as { code?: string };

    if (erro.code === "ER_DUP_ENTRY") {
      return respostaErro(
        "Já existe um Chromebook cadastrado com esse MAC ou ID.",
        409
      );
    }

    console.error(
      "Erro ao cadastrar Chromebook:",
      error
    );

    return respostaErro(
      "Não foi possível cadastrar o Chromebook.",
      500
    );
  }
}

// PUT: editar Chromebook
export async function PUT(request: Request) {
  const falhaAutenticacao =
    await verificarAutenticacao();

  if (falhaAutenticacao) {
    return falhaAutenticacao;
  }

  try {
    const body: unknown = await request.json();

    if (
      body === null ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return respostaErro("Dados inválidos.", 400);
    }

    const entrada = body as Record<string, unknown>;
    const id = String(entrada.id ?? "").trim();

    if (!/^CB-\d{3}$/i.test(id)) {
      return respostaErro(
        "Informe um ID válido, como CB-001.",
        400
      );
    }

    const resultado = validarDados(body);

    if (!resultado.dados) {
      return respostaErro(resultado.erro!, 400);
    }

    const dados = resultado.dados;

    const [resultadoUpdate] =
      await pool.execute<ResultSetHeader>(
        `UPDATE chromebooks
         SET
           mac_address = ?,
           serial_number = ?,
           model = ?,
           chromebook_number = ?,
           room = ?,
           status = ?,
           notes = ?
         WHERE id = ?`,
        [
          dados.mac,
          dados.numeroSerie || null,
          dados.modelo || null,
          dados.numero || null,
          dados.sala || null,
          dados.status,
          dados.observacoes || null,
          id.toUpperCase(),
        ]
      );

    if (resultadoUpdate.affectedRows === 0) {
      const [existentes] =
        await pool.execute<RowDataPacket[]>(
          "SELECT id FROM chromebooks WHERE id = ?",
          [id.toUpperCase()]
        );

      if (existentes.length === 0) {
        return respostaErro(
          "Chromebook não encontrado.",
          404
        );
      }
    }

    return NextResponse.json(
      {
        id: id.toUpperCase(),
        ...dados,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const erro = error as { code?: string };

    if (erro.code === "ER_DUP_ENTRY") {
      return respostaErro(
        "Esse MAC já pertence a outro Chromebook.",
        409
      );
    }

    console.error(
      "Erro ao editar Chromebook:",
      error
    );

    return respostaErro(
      "Não foi possível editar o Chromebook.",
      500
    );
  }
}

// DELETE: excluir Chromebook pelo ID
export async function DELETE(request: Request) {
  const falhaAutenticacao =
    await verificarAutenticacao();

  if (falhaAutenticacao) {
    return falhaAutenticacao;
  }

  try {
    const url = new URL(request.url);

    const id = (url.searchParams.get("id") ?? "")
      .trim()
      .toUpperCase();

    if (!/^CB-\d{3}$/.test(id)) {
      return respostaErro(
        "Informe um ID válido na URL, como ?id=CB-001.",
        400
      );
    }

    const [resultadoDelete] =
      await pool.execute<ResultSetHeader>(
        "DELETE FROM chromebooks WHERE id = ?",
        [id]
      );

    if (resultadoDelete.affectedRows === 0) {
      return respostaErro(
        "Chromebook não encontrado.",
        404
      );
    }

    return NextResponse.json(
      {
        mensagem: "Chromebook excluído com sucesso.",
        id,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const erro = error as { code?: string };

    if (
      erro.code === "ER_ROW_IS_REFERENCED_2" ||
      erro.code === "1451"
    ) {
      return respostaErro(
        "Este Chromebook possui manutenções vinculadas e não pode ser excluído.",
        409
      );
    }

    console.error(
      "Erro ao excluir Chromebook:",
      error
    );

    return respostaErro(
      "Não foi possível excluir o Chromebook.",
      500
    );
  }
}
