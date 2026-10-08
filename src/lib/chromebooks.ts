import { Chromebook } from "@/types/chromebook";

const STORAGE_KEY = "chromebook-manager";
const MAX_CHROMEBOOKS = 999;

export type NewChromebook = Omit<Chromebook, "id">;

export function getChromebooks(): Chromebook[] {
  if (typeof window === "undefined") {
    return [];
  }

  const data = localStorage.getItem(STORAGE_KEY);

  if (!data) {
    return [];
  }

  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function gerarProximoId(
  chromebooks: Chromebook[]
): string {
  const numeros = chromebooks
    .map((chromebook) => {
      const numero = Number(
        chromebook.id.replace("CB-", "")
      );

      return Number.isNaN(numero) ? 0 : numero;
    })
    .filter((numero) => numero > 0);

  const maiorId =
    numeros.length > 0 ? Math.max(...numeros) : 0;

  const proximoId = maiorId + 1;

  if (proximoId > MAX_CHROMEBOOKS) {
    throw new Error(
      "O limite de 999 Chromebooks foi atingido."
    );
  }

  return "CB-" + String(proximoId).padStart(3, "0");
}

export function saveChromebook(
  chromebook: NewChromebook
): Chromebook {
  const chromebooks = getChromebooks();

  const novoChromebook: Chromebook = {
    id: gerarProximoId(chromebooks),
    ...chromebook,
  };

  const chromebooksAtualizados = [
    ...chromebooks,
    novoChromebook,
  ];

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(chromebooksAtualizados)
  );

  return novoChromebook;
}

export function deleteChromebook(id: string): void {
  const chromebooks = getChromebooks();

  const chromebooksAtualizados =
    chromebooks.filter(
      (chromebook) => chromebook.id !== id
    );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(chromebooksAtualizados)
  );
}

export function updateChromebook(
  updatedChromebook: Chromebook
): void {
  const chromebooks = getChromebooks();

  const chromebooksAtualizados =
    chromebooks.map((chromebook) =>
      chromebook.id === updatedChromebook.id
        ? updatedChromebook
        : chromebook
    );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(chromebooksAtualizados)
  );
}