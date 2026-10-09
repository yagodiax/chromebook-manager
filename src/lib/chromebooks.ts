
import type {
  Chromebook,
  ChromebookStatus,
} from "@/types/chromebook";

const STORAGE_KEY = "chromebook-manager";
const MAX_CHROMEBOOKS = 999;

export type NewChromebook = Omit<Chromebook, "id">;

function normalizarStatus(status: unknown): ChromebookStatus {
  if (
    status === "disponivel" ||
    status === "em-uso" ||
    status === "em-reparo" ||
    status === "para-descarte"
  ) {
    return status;
  }

  // Compatibilidade com registros antigos.
  if (status === "retirada-de-pecas") {
    return "para-descarte";
  }

  // Um status desconhecido nunca deve liberar o equipamento
  // automaticamente para uso.
  return "para-descarte";
}

function normalizarChromebook(
  registro: Record<string, unknown>
): Chromebook {
  return {
    id: String(registro.id ?? ""),
    numero: String(registro.numero ?? ""),
    mac: String(registro.mac ?? ""),
    numeroSerie: String(registro.numeroSerie ?? ""),
    modelo: String(registro.modelo ?? ""),
    sala: String(registro.sala ?? ""),
    status: normalizarStatus(registro.status),
    observacoes: String(registro.observacoes ?? ""),
  };
}

function lerChromebooks(): Chromebook[] {
  if (typeof window === "undefined") {
    return [];
  }

  let data: string | null;

  try {
    data = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    throw new Error(
      "Não foi possível acessar o armazenamento dos Chromebooks."
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
      "Os dados dos Chromebooks estão corrompidos. Nenhuma alteração foi realizada para preservar os registros."
    );
  }

  if (!Array.isArray(registros)) {
    throw new Error(
      "O formato dos dados dos Chromebooks é inválido. Os registros foram preservados."
    );
  }

  const ids = new Set<string>();
  const chromebooks: Chromebook[] = [];

  for (const registro of registros) {
    if (
      registro === null ||
      typeof registro !== "object" ||
      Array.isArray(registro)
    ) {
      throw new Error(
        "Existe um registro de Chromebook inválido. Os dados foram preservados."
      );
    }

    const objeto = registro as Record<string, unknown>;

    if (
      typeof objeto.id !== "string" ||
      objeto.id.trim() === ""
    ) {
      throw new Error(
        "Existe um Chromebook sem identificação válida. Os dados foram preservados."
      );
    }

    if (ids.has(objeto.id)) {
      throw new Error(
        `O identificador ${objeto.id} está duplicado. Os dados foram preservados.`
      );
    }

    ids.add(objeto.id);
    chromebooks.push(normalizarChromebook(objeto));
  }

  return chromebooks;
}

function gravarChromebooks(
  chromebooks: Chromebook[]
): void {
  if (chromebooks.length > MAX_CHROMEBOOKS) {
    throw new Error(
      `O limite de ${MAX_CHROMEBOOKS} Chromebooks foi atingido.`
    );
  }

  const ids = new Set<string>();

  for (const chromebook of chromebooks) {
    if (
      !chromebook.id ||
      typeof chromebook.id !== "string" ||
      ids.has(chromebook.id)
    ) {
      throw new Error(
        "Não foi possível salvar: existem identificadores inválidos ou duplicados."
      );
    }

    ids.add(chromebook.id);
  }

  if (typeof window === "undefined") {
    throw new Error(
      "Não foi possível acessar o armazenamento do navegador."
    );
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(chromebooks)
    );
  } catch {
    throw new Error(
      "Não foi possível salvar os Chromebooks. O armazenamento do navegador pode estar cheio ou indisponível."
    );
  }
}

export function getChromebooks(): Chromebook[] {
  return lerChromebooks();
}

function gerarProximoId(
  chromebooks: Chromebook[]
): string {
  const numeros = chromebooks
    .map((chromebook) => {
      const correspondencia =
        chromebook.id.match(/^CB-(\d+)$/i);

      return correspondencia
        ? Number(correspondencia[1])
        : 0;
    })
    .filter(
      (numero) =>
        Number.isSafeInteger(numero) && numero > 0
    );

  const maiorId =
    numeros.length > 0 ? Math.max(...numeros) : 0;

  const proximoId = maiorId + 1;

  if (proximoId > MAX_CHROMEBOOKS) {
    throw new Error(
      `O limite de ${MAX_CHROMEBOOKS} Chromebooks foi atingido.`
    );
  }

  return "CB-" + String(proximoId).padStart(3, "0");
}

export function saveChromebook(
  chromebook: NewChromebook
): Chromebook {
  const chromebooks = lerChromebooks();

  if (chromebooks.length >= MAX_CHROMEBOOKS) {
    throw new Error(
      `O limite de ${MAX_CHROMEBOOKS} Chromebooks foi atingido.`
    );
  }

  const novoChromebook: Chromebook = {
    ...chromebook,
    id: gerarProximoId(chromebooks),
    status: normalizarStatus(chromebook.status),
  };

  const chromebooksAtualizados = [
    ...chromebooks,
    novoChromebook,
  ];

  gravarChromebooks(chromebooksAtualizados);

  return novoChromebook;
}

export function deleteChromebook(id: string): void {
  if (typeof id !== "string" || !id.trim()) {
    throw new Error(
      "Informe um identificador válido para excluir o Chromebook."
    );
  }

  const chromebooks = lerChromebooks();

  const existe = chromebooks.some(
    (chromebook) => chromebook.id === id
  );

  if (!existe) {
    throw new Error(
      "Chromebook não encontrado. Atualize a página e tente novamente."
    );
  }

  const chromebooksAtualizados = chromebooks.filter(
    (chromebook) => chromebook.id !== id
  );

  gravarChromebooks(chromebooksAtualizados);
}

export function updateChromebook(
  updatedChromebook: Chromebook
): void {
  if (
    !updatedChromebook ||
    typeof updatedChromebook.id !== "string" ||
    !updatedChromebook.id.trim()
  ) {
    throw new Error(
      "O Chromebook não possui um identificador válido."
    );
  }

  const chromebooks = lerChromebooks();

  const indice = chromebooks.findIndex(
    (chromebook) =>
      chromebook.id === updatedChromebook.id
  );

  if (indice === -1) {
    throw new Error(
      "Chromebook não encontrado. Atualize a página e tente novamente."
    );
  }

  const chromebooksAtualizados = [...chromebooks];

  chromebooksAtualizados[indice] = {
    ...updatedChromebook,
    id: chromebooks[indice].id,
    status: normalizarStatus(updatedChromebook.status),
  };

  gravarChromebooks(chromebooksAtualizados);
}