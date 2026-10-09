"use client";

import { useEffect, useMemo, useState } from "react";
import { getChromebooks } from "@/lib/chromebooks";
import { getManutencoes } from "@/lib/manutencoes";
import type { Chromebook } from "@/types/chromebook";
import type { Manutencao } from "@/types/manutencao";

type Periodo = "7-dias" | "30-dias" | "6-meses" | "1-ano" | "todo";

type ItemRanking = {
  id: string;
  nome: string;
  total: number;
  quantidade: number;
};

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data: string): string {
  if (!data) return "—";

  const dataFormatada = new Date(`${data}T00:00:00`);

  if (Number.isNaN(dataFormatada.getTime())) return data;

  return dataFormatada.toLocaleDateString("pt-BR");
}

function obterDataLocalISO(data = new Date()): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function obterDataLimite(periodo: Periodo): Date | null {
  if (periodo === "todo") return null;

  const limite = new Date();
  limite.setHours(0, 0, 0, 0);

  if (periodo === "7-dias") {
    limite.setDate(limite.getDate() - 6);
  } else if (periodo === "30-dias") {
    limite.setDate(limite.getDate() - 29);
  } else if (periodo === "6-meses") {
    limite.setMonth(limite.getMonth() - 6);
  } else if (periodo === "1-ano") {
    limite.setFullYear(limite.getFullYear() - 1);
  }

  return limite;
}

function nomeTipo(tipo: Manutencao["tipo"]): string {
  const nomes: Record<Manutencao["tipo"], string> = {
    ocorrencia: "Ocorrência",
    manutencao: "Manutenção",
    "reposicao-de-peca": "Reposição de peça",
    "envio-para-reparo": "Envio para reparo",
    "retorno-de-reparo": "Retorno de reparo",
  };

  return nomes[tipo] ?? tipo;
}

function nomeCategoria(categoria: Manutencao["categoria"]): string {
  const nomes: Record<Manutencao["categoria"], string> = {
    tela: "Tela",
    teclado: "Teclado",
    bateria: "Bateria",
    carregador: "Carregador",
    touchpad: "Touchpad",
    "sistema-operacional": "Sistema operacional",
    wifi: "Wi-Fi",
    bluetooth: "Bluetooth",
    audio: "Áudio",
    camera: "Câmera",
    carcaca: "Carcaça",
    dobradica: "Dobradiça",
    usb: "USB",
    outro: "Outro",
  };

  return nomes[categoria] ?? categoria;
}

function escaparCSV(valor: string | number): string {
  const texto = String(valor);
  return `"${texto.replace(/"/g, '""')}"`;
}

/**
 * O envio para reparo não representa uma despesa final.
 * O custo real da assistência deve ser registrado no retorno.
 */
function obterCustoContabilizavel(manutencao: Manutencao): number {
  if (manutencao.tipo === "envio-para-reparo") {
    return 0;
  }

  const custo = manutencao.custo;

  if (
    typeof custo !== "number" ||
    !Number.isFinite(custo) ||
    custo <= 0
  ) {
    return 0;
  }

  return custo;
}

export default function RelatorioGastosPage() {
  const [chromebooks, setChromebooks] = useState<Chromebook[]>([]);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [periodo, setPeriodo] = useState<Periodo>("30-dias");
  const [equipamentoId, setEquipamentoId] = useState("todos");

  useEffect(() => {
    setChromebooks(getChromebooks());
    setManutencoes(getManutencoes());
  }, []);

  const manutencoesFiltradas = useMemo(() => {
    const dataLimite = obterDataLimite(periodo);

    return manutencoes
      .filter((manutencao) => {
        if (
          equipamentoId !== "todos" &&
          manutencao.chromebookId !== equipamentoId
        ) {
          return false;
        }

        const data = new Date(`${manutencao.data}T00:00:00`);

        if (Number.isNaN(data.getTime())) return false;

        if (!dataLimite) return true;

        return data >= dataLimite;
      })
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [manutencoes, periodo, equipamentoId]);

  const totalGasto = manutencoesFiltradas.reduce(
    (total, manutencao) =>
      total + obterCustoContabilizavel(manutencao),
    0
  );

  const totalEnvios = manutencoesFiltradas.filter(
    (manutencao) => manutencao.tipo === "envio-para-reparo"
  ).length;

  const totalRetornos = manutencoesFiltradas.filter(
    (manutencao) => manutencao.tipo === "retorno-de-reparo"
  ).length;

  const registrosComCusto = manutencoesFiltradas.filter(
    (manutencao) => obterCustoContabilizavel(manutencao) > 0
  ).length;

  function nomeChromebook(id: string): string {
    const chromebook = chromebooks.find((item) => item.id === id);

    if (!chromebook) {
      return id || "Equipamento não encontrado";
    }

    return `${chromebook.numero} — ${chromebook.modelo}`;
  }

  const rankingGastos = useMemo(() => {
    const agrupamento = new Map<string, ItemRanking>();

    manutencoesFiltradas.forEach((manutencao) => {
      const custo = obterCustoContabilizavel(manutencao);

      if (custo <= 0) return;

      const id = manutencao.chromebookId;
      const existente = agrupamento.get(id);

      if (existente) {
        existente.total += custo;
        existente.quantidade += 1;
      } else {
        agrupamento.set(id, {
          id,
          nome: nomeChromebook(id),
          total: custo,
          quantidade: 1,
        });
      }
    });

    return Array.from(agrupamento.values()).sort(
      (a, b) => b.total - a.total
    );
  }, [manutencoesFiltradas, chromebooks]);

  const maiorGastoRanking = rankingGastos[0]?.total ?? 0;

  const gastosPorMes = useMemo(() => {
    const agrupamento = new Map<string, number>();

    const datasValidas = manutencoesFiltradas
      .filter((manutencao) => obterCustoContabilizavel(manutencao) > 0)
      .map((manutencao) => manutencao.data)
      .filter((data) => {
        const dataConvertida = new Date(`${data}T00:00:00`);
        return !Number.isNaN(dataConvertida.getTime());
      })
      .sort();

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dataLimite = obterDataLimite(periodo);

    const primeiraData =
      datasValidas.length > 0
        ? new Date(`${datasValidas[0]}T00:00:00`)
        : null;

    const ultimaData =
      datasValidas.length > 0
        ? new Date(`${datasValidas[datasValidas.length - 1]}T00:00:00`)
        : null;

    const inicioBase = dataLimite ?? primeiraData ?? hoje;
    const fimBase =
      ultimaData && ultimaData > hoje ? ultimaData : hoje;

    const cursor = new Date(
      inicioBase.getFullYear(),
      inicioBase.getMonth(),
      1
    );

    const fim = new Date(
      fimBase.getFullYear(),
      fimBase.getMonth(),
      1
    );

    while (cursor <= fim) {
      const chave = `${cursor.getFullYear()}-${String(
        cursor.getMonth() + 1
      ).padStart(2, "0")}`;

      agrupamento.set(chave, 0);
      cursor.setMonth(cursor.getMonth() + 1);
    }

    manutencoesFiltradas.forEach((manutencao) => {
      const custo = obterCustoContabilizavel(manutencao);

      if (custo <= 0) return;

      const data = new Date(`${manutencao.data}T00:00:00`);

      if (Number.isNaN(data.getTime())) return;

      const chave = `${data.getFullYear()}-${String(
        data.getMonth() + 1
      ).padStart(2, "0")}`;

      if (agrupamento.has(chave)) {
        agrupamento.set(
          chave,
          (agrupamento.get(chave) ?? 0) + custo
        );
      }
    });

    return Array.from(agrupamento.entries()).map(([mes, total]) => {
      const [ano, numeroMes] = mes.split("-").map(Number);
      const data = new Date(ano, numeroMes - 1, 1);

      return {
        mes,
        nome: data.toLocaleDateString("pt-BR", {
          month: "short",
          year: "2-digit",
        }),
        total,
      };
    });
  }, [manutencoesFiltradas, periodo]);

  const maiorGastoMensal = Math.max(
    ...gastosPorMes.map((item) => item.total),
    1
  );

  const totalGastoNoGrafico = gastosPorMes.reduce(
    (total, item) => total + item.total,
    0
  );

  function exportarCSV() {
    const cabecalho = [
      "Data",
      "ID da manutenção",
      "ID do Chromebook",
      "Chromebook",
      "Tipo",
      "Categoria",
      "Descrição",
      "Observação",
      "Destino do reparo",
      "Resultado",
      "Responsável",
      "Custo registrado (R$)",
      "Custo contabilizado (R$)",
    ];

    const linhas = manutencoesFiltradas.map((manutencao) => [
      formatarData(manutencao.data),
      manutencao.id,
      manutencao.chromebookId,
      nomeChromebook(manutencao.chromebookId),
      nomeTipo(manutencao.tipo),
      nomeCategoria(manutencao.categoria),
      manutencao.descricao || "",
      manutencao.observacao || "",
      manutencao.destinoReparo || "",
      manutencao.resultado || "",
      manutencao.quemRealizou || "",
      typeof manutencao.custo === "number" &&
      Number.isFinite(manutencao.custo)
        ? manutencao.custo.toFixed(2).replace(".", ",")
        : "",
      obterCustoContabilizavel(manutencao)
        .toFixed(2)
        .replace(".", ","),
    ]);

    const conteudo = [cabecalho, ...linhas]
      .map((linha) => linha.map(escaparCSV).join(";"))
      .join("\r\n");

    const arquivo = new Blob(["\uFEFF", conteudo], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");

    link.href = url;
    link.download = `relatorio-gastos-${periodo}-${obterDataLocalISO()}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 transition-colors dark:bg-[#3a3a3f]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Relatório de gastos
            </h1>

            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Acompanhe os custos de manutenção e reparo dos Chromebooks.
            </p>
          </div>

          <button
            type="button"
            onClick={exportarCSV}
            disabled={manutencoesFiltradas.length === 0}
            className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            Exportar para Excel (CSV)
          </button>
        </div>

        <section className="mb-6 rounded-xl bg-white p-5 shadow dark:bg-[#444449]">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Filtros
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="periodo"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Período
              </label>

              <select
                id="periodo"
                value={periodo}
                onChange={(event) =>
                  setPeriodo(event.target.value as Periodo)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-black dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100"
              >
                <option value="7-dias">Últimos 7 dias</option>
                <option value="30-dias">Últimos 30 dias</option>
                <option value="6-meses">Últimos 6 meses</option>
                <option value="1-ano">Último ano</option>
                <option value="todo">Todo o histórico</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="equipamento"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Chromebook
              </label>

              <select
                id="equipamento"
                value={equipamentoId}
                onChange={(event) => setEquipamentoId(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-black dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100"
              >
                <option value="todos">Todos os Chromebooks</option>

                {chromebooks.map((chromebook) => (
                  <option key={chromebook.id} value={chromebook.id}>
                    {chromebook.numero} — {chromebook.modelo} ({chromebook.id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow dark:bg-[#444449]">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total gasto
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatarMoeda(totalGasto)}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow dark:bg-[#444449]">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Registros encontrados
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {manutencoesFiltradas.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow dark:bg-[#444449]">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Envios para reparo
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {totalEnvios}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Registrados no período
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow dark:bg-[#444449]">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Retornos de reparo
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {totalRetornos}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {registrosComCusto} registros com custo contabilizado
            </p>
          </div>
        </section>

        <section className="mb-6 rounded-xl bg-white p-5 shadow dark:bg-[#444449]">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Evolução dos gastos
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Valores mensais de manutenção e reparo no período selecionado.
            </p>
          </div>

          {gastosPorMes.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Não há períodos para exibir no gráfico.
            </p>
          ) : (
            <div className="flex h-64 items-end gap-2 overflow-x-auto border-b border-gray-200 pb-2 dark:border-[#5a5a60]">
              {gastosPorMes.map((item) => {
                const altura =
                  item.total > 0
                    ? Math.max((item.total / maiorGastoMensal) * 100, 3)
                    : 0;

                return (
                  <div
                    key={item.mes}
                    className="flex h-full min-w-14 flex-1 flex-col items-center justify-end gap-2"
                    title={`${item.nome}: ${formatarMoeda(item.total)}`}
                  >
                    <span className="whitespace-nowrap text-xs font-medium text-gray-700 dark:text-gray-200">
                      {item.total > 0 ? formatarMoeda(item.total) : "—"}
                    </span>

                    <div className="flex h-full w-full items-end justify-center">
                      <div
                        className="w-full max-w-12 rounded-t-md bg-gray-800 transition-all duration-300 dark:bg-gray-200"
                        style={{ height: `${altura}%` }}
                      />
                    </div>

                    <span className="text-xs capitalize text-gray-500 dark:text-gray-400">
                      {item.nome}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total exibido no gráfico
            </span>

            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatarMoeda(totalGastoNoGrafico)}
            </span>
          </div>
        </section>

        <section className="mb-6 rounded-xl bg-white p-5 shadow dark:bg-[#444449]">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Ranking de gastos por Chromebook
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Equipamentos com maior custo registrado no período selecionado.
            </p>
          </div>

          {rankingGastos.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-8 text-center dark:bg-[#3d3d42]">
              <p className="font-medium text-gray-700 dark:text-gray-200">
                Nenhum gasto registrado neste período.
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                O ranking aparecerá quando houver manutenções com custo maior
                que zero.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {rankingGastos.map((item, indice) => {
                const percentual =
                  maiorGastoRanking > 0
                    ? (item.total / maiorGastoRanking) * 100
                    : 0;

                return (
                  <div key={item.id}>
                    <div className="mb-2 flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-700 dark:bg-[#303034] dark:text-gray-200">
                          {indice + 1}º
                        </div>

                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {item.nome}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.quantidade}{" "}
                            {item.quantidade === 1
                              ? "registro com custo"
                              : "registros com custo"}
                          </p>
                        </div>
                      </div>

                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {formatarMoeda(item.total)}
                      </p>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-[#303034]">
                      <div
                        className="h-full rounded-full bg-gray-800 transition-all duration-300 dark:bg-gray-200"
                        style={{ width: `${percentual}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-xl bg-white shadow dark:bg-[#444449]">
          <div className="border-b border-gray-200 p-5 dark:border-[#5a5a60]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Histórico de gastos
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Os envios aparecem no histórico, mas não entram no total gasto.
              O custo contabilizado é o valor final registrado no retorno ou
              em uma manutenção com custo.
            </p>
          </div>

          {manutencoesFiltradas.length === 0 ? (
            <div className="p-10 text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Nenhum registro encontrado
              </h3>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
                Altere o período ou selecione outro Chromebook.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left dark:border-[#5a5a60]">
                    <th className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Data
                    </th>
                    <th className="px-5 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Equipamento
                    </th>
                    <th className="px-5 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Tipo / Categoria
                    </th>
                    <th className="px-5 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Descrição
                    </th>
                    <th className="px-5 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Destino
                    </th>
                    <th className="px-5 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Resultado
                    </th>
                    <th className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Custo contabilizado
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {manutencoesFiltradas.map((manutencao) => {
                    const custoContabilizado =
                      obterCustoContabilizavel(manutencao);

                    return (
                      <tr
                        key={manutencao.id}
                        className="border-b border-gray-100 last:border-0 dark:border-[#505057]"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {formatarData(manutencao.data)}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-900 dark:text-gray-100">
                          <div className="font-medium">
                            {nomeChromebook(manutencao.chromebookId)}
                          </div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {manutencao.id}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          <div>{nomeTipo(manutencao.tipo)}</div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {nomeCategoria(manutencao.categoria)}
                          </div>
                        </td>

                        <td className="min-w-48 px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          <div>{manutencao.descricao || "—"}</div>
                          {manutencao.observacao && (
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {manutencao.observacao}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {manutencao.destinoReparo || "—"}
                        </td>

                        <td className="min-w-40 px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {manutencao.resultado || "—"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {custoContabilizado > 0
                            ? formatarMoeda(custoContabilizado)
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50 dark:border-[#5a5a60] dark:bg-[#3d3d42]">
                    <td
                      colSpan={6}
                      className="px-5 py-4 text-right font-semibold text-gray-900 dark:text-gray-100"
                    >
                      Total do período
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-gray-900 dark:text-gray-100">
                      {formatarMoeda(totalGasto)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}