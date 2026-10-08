import type { Manutencao } from "@/types/manutencao";

const STORAGE_KEY = "chromebook-manager-manutencoes";
const MAX_MANUTENCOES = 999999;

export type NovaManutencao = Omit<
  Manutencao,
  "id"
>;

function gerarProximoId(
  manutencoes: Manutencao[]
): string {
  const numeros = manutencoes
    .map((manutencao) => {
      const numero = Number(
        manutencao.id.replace("MAN-", "")
      );

      return Number.isNaN(numero) ? 0 : numero;
    })
    .filter((numero) => numero > 0);

  const maiorId =
    numeros.length > 0
      ? Math.max(...numeros)
      : 0;

  const proximoId = maiorId + 1;

  if (proximoId > MAX_MANUTENCOES) {
    throw new Error(
      "O limite de registros de manutenção foi atingido."
    );
  }

  return (
    "MAN-" +
    String(proximoId).padStart(6, "0")
  );
}

export function getManutencoes(): Manutencao[] {
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

export function saveManutencao(
  manutencao: NovaManutencao
): Manutencao {
  const manutencoes = getManutencoes();

  const novaManutencao: Manutencao = {
    id: gerarProximoId(manutencoes),
    ...manutencao,
  };

  const manutencoesAtualizadas = [
    ...manutencoes,
    novaManutencao,
  ];

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(manutencoesAtualizadas)
  );

  return novaManutencao;
}

export function updateManutencao(
  manutencaoAtualizada: Manutencao
): void {
  const manutencoes = getManutencoes();

  const manutencoesAtualizadas =
    manutencoes.map((manutencao) =>
      manutencao.id === manutencaoAtualizada.id
        ? manutencaoAtualizada
        : manutencao
    );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(manutencoesAtualizadas)
  );
}

export function deleteManutencao(
  id: string
): void {
  const manutencoes = getManutencoes();

  const manutencoesAtualizadas =
    manutencoes.filter(
      (manutencao) => manutencao.id !== id
    );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(manutencoesAtualizadas)
  );
}