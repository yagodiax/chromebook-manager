
import type { Manutencao } from "@/types/manutencao";

const STORAGE_KEY = "chromebook-manager-manutencoes";
const MAX_MANUTENCOES = 999999;

export type NovaManutencao = Omit<Manutencao, "id">;

function gerarProximoId(
  manutencoes: Manutencao[]
): string {
  const numeros = manutencoes
    .map((manutencao) => {
      const id = manutencao.id;

      if (typeof id !== "string" || !id.startsWith("MAN-")) {
        return 0;
      }

      const numero = Number(id.slice(4));

      return Number.isSafeInteger(numero) && numero > 0
        ? numero
        : 0;
    });

  const maiorId =
    numeros.length > 0 ? Math.max(...numeros) : 0;

  const proximoId = maiorId + 1;

  if (proximoId > MAX_MANUTENCOES) {
    throw new Error(
      "O limite de registros de manutenção foi atingido."
    );
  }

  return `MAN-${String(proximoId).padStart(6, "0")}`;
}

function validarLista(
  valor: unknown
): valor is Manutencao[] {
  if (!Array.isArray(valor)) {
    return false;
  }

  const ids = new Set<string>();

  for (const item of valor) {
    if (
      item === null ||
      typeof item !== "object" ||
      Array.isArray(item)
    ) {
      return false;
    }

    const registro = item as Record<string, unknown>;

    if (
      typeof registro.id !== "string" ||
      registro.id.trim() === "" ||
      typeof registro.chromebookId !== "string" ||
      registro.chromebookId.trim() === "" ||
      typeof registro.data !== "string" ||
      typeof registro.tipo !== "string" ||
      typeof registro.categoria !== "string" ||
      typeof registro.descricao !== "string" ||
      typeof registro.observacao !== "string" ||
      typeof registro.quemRealizou !== "string" ||
      !Array.isArray(registro.anexos)
    ) {
      return false;
    }

    if (ids.has(registro.id)) {
      return false;
    }

    ids.add(registro.id);

    // Campos opcionais precisam ser válidos quando presentes.
    if (
      registro.custo !== undefined &&
      (
        typeof registro.custo !== "number" ||
        !Number.isFinite(registro.custo) ||
        registro.custo < 0
      )
    ) {
      return false;
    }

    if (
      registro.destinoReparo !== undefined &&
      typeof registro.destinoReparo !== "string"
    ) {
      return false;
    }

    if (
      registro.resultado !== undefined &&
      typeof registro.resultado !== "string"
    ) {
      return false;
    }

    // Verifica a estrutura dos anexos sem impor um formato
    // de conteúdo que possa invalidar arquivos antigos.
    for (const anexo of registro.anexos) {
      if (
        anexo === null ||
        typeof anexo !== "object" ||
        Array.isArray(anexo)
      ) {
        return false;
      }

      const arquivo = anexo as Record<string, unknown>;

      if (
        typeof arquivo.id !== "string" ||
        typeof arquivo.nome !== "string" ||
        typeof arquivo.tipo !== "string" ||
        typeof arquivo.tamanho !== "number" ||
        !Number.isFinite(arquivo.tamanho) ||
        arquivo.tamanho < 0 ||
        typeof arquivo.dados !== "string"
      ) {
        return false;
      }
    }
  }

  return true;
}

function lerManutencoes(): Manutencao[] {
  if (typeof window === "undefined") {
    throw new Error(
      "Não é possível acessar as manutenções fora do navegador."
    );
  }

  let data: string | null;

  try {
    data = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    throw new Error(
      "Não foi possível acessar o armazenamento das manutenções."
    );
  }

  if (data === null) {
    return [];
  }

  let registros: unknown;

  try {
    registros = JSON.parse(data);
  } catch {
    throw new Error(
      "Os registros de manutenção estão com o formato inválido. O histórico foi preservado; não salve alterações até recuperar os dados."
    );
  }

  if (!validarLista(registros)) {
    throw new Error(
      "Os registros de manutenção possuem dados inválidos ou IDs duplicados. O histórico foi preservado; não salve alterações até recuperar os dados."
    );
  }

  return registros;
}

function gravarManutencoes(
  manutencoes: Manutencao[],
  mensagemErro: string
): void {
  if (!validarLista(manutencoes)) {
    throw new Error(
      "Não foi possível salvar: a lista de manutenções contém dados inválidos ou IDs duplicados."
    );
  }

  if (typeof window === "undefined") {
    throw new Error(
      "Não é possível salvar manutenções fora do navegador."
    );
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(manutencoes)
    );
  } catch {
    throw new Error(mensagemErro);
  }
}

/**
 * Retorna os registros ou lança um erro caso o armazenamento
 * esteja inacessível ou os dados sejam inválidos.
 *
 * Não retornar [] em caso de falha evita que uma tela confunda
 * um problema de leitura com um histórico realmente vazio.
 */
export function getManutencoes(): Manutencao[] {
  return lerManutencoes();
}

export function saveManutencao(
  manutencao: NovaManutencao
): Manutencao {
  const manutencoes = lerManutencoes();

  if (manutencoes.length >= MAX_MANUTENCOES) {
    throw new Error(
      "O limite de registros de manutenção foi atingido."
    );
  }

  const novaManutencao: Manutencao = {
    ...manutencao,
    id: gerarProximoId(manutencoes),
  };

  const manutencoesAtualizadas = [
    ...manutencoes,
    novaManutencao,
  ];

  gravarManutencoes(
    manutencoesAtualizadas,
    "Não foi possível salvar a manutenção. O armazenamento do navegador pode estar cheio."
  );

  return novaManutencao;
}

export function updateManutencao(
  manutencaoAtualizada: Manutencao
): void {
  if (
    !manutencaoAtualizada ||
    typeof manutencaoAtualizada.id !== "string" ||
    !manutencaoAtualizada.id.trim()
  ) {
    throw new Error(
      "O registro de manutenção não possui um ID válido."
    );
  }

  const manutencoes = lerManutencoes();

  const indice = manutencoes.findIndex(
    (manutencao) =>
      manutencao.id === manutencaoAtualizada.id
  );

  if (indice === -1) {
    throw new Error(
      "A manutenção que você está tentando editar não foi encontrada."
    );
  }

  const manutencoesAtualizadas = [...manutencoes];

  manutencoesAtualizadas[indice] = {
    ...manutencaoAtualizada,
    id: manutencoes[indice].id,
  };

  gravarManutencoes(
    manutencoesAtualizadas,
    "Não foi possível atualizar a manutenção. O armazenamento do navegador pode estar cheio."
  );
}

export function deleteManutencao(id: string): void {
  if (typeof id !== "string" || !id.trim()) {
    throw new Error(
      "Informe um ID válido para excluir a manutenção."
    );
  }

  const manutencoes = lerManutencoes();

  const existe = manutencoes.some(
    (manutencao) => manutencao.id === id
  );

  if (!existe) {
    throw new Error(
      "A manutenção que você está tentando excluir não foi encontrada."
    );
  }

  const manutencoesAtualizadas = manutencoes.filter(
    (manutencao) => manutencao.id !== id
  );

  gravarManutencoes(
    manutencoesAtualizadas,
    "Não foi possível excluir a manutenção."
  );
}