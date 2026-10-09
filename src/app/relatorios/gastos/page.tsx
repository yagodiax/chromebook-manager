
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

  const formatada = new Date(`${data}T00:00:00`);
  if (Number.isNaN(formatada.getTime())) return data;

  return formatada.toLocaleDateString("pt-BR");
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

  if (periodo === "7-dias") limite.setDate(limite.getDate() - 6);
  else if (periodo === "30-dias") limite.setDate(limite.getDate() - 29);
  else if (periodo === "6-meses") limite.setMonth(limite.getMonth() - 6);
  else if (periodo === "1-ano") limite.setFullYear(limite.getFullYear() - 1);

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
  return `"${String(valor).replace(/"/g, '""')}"`;
}

function obterCustoContabilizavel(manutencao: Manutencao): number {
  if (manutencao.tipo === "envio-para-reparo") return 0;

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

const cardBase =
  "rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition-colors dark:border-[#505057] dark:bg-[#444449]";

const labelBase =
  "text-sm font-medium text-gray-500 dark:text-gray-400";

const valorBase =
  "mt-3 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100";

const selectBase =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-[#5a5a60] dark:bg-[#303034] dark:text-gray-100 dark:focus:ring-[#505057]";

export default function RelatorioGastosPage() {
  const router = useRouter();

  const [chromebooks, setChromebooks] = useState<Chromebook[]>([]);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [periodo, setPeriodo] = useState<Periodo>("30-dias");
  const [equipamentoId, setEquipamentoId] = useState("todos");

  useEffect(() => {
    setChromebooks(getChromebooks());
    setManutencoes(getManutencoes());
  }, []);

  const nomeChromebook = (id: string): string => {
    const chromebook = chromebooks.find((item) => item.id === id);
    return chromebook
      ? `${chromebook.numero} — ${chromebook.modelo}`
      : id || "Equipamento não encontrado";
  };

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

        return !dataLimite || data >= dataLimite;
      })
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [manutencoes, periodo, equipamentoId]);

  const totalGasto = manutencoesFiltradas.reduce(
    (total, manutencao) =>
      total + obterCustoContabilizavel(manutencao),
    0
  );

  const totalEnvios = manutencoesFiltradas.filter(
    (item) => item.tipo === "envio-para-reparo"
  ).length;

  const totalRetornos = manutencoesFiltradas.filter(
    (item) => item.tipo === "retorno-de-reparo"
  ).length;

  const registrosComCusto = manutencoesFiltradas.filter(
    (item) => obterCustoContabilizavel(item) > 0
  ).length;

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
      .filter((item) => obterCustoContabilizavel(item) > 0)
      .map((item) => item.data)
      .filter((data) => !Number.isNaN(new Date(`${data}T00:00:00`).getTime()))
      .sort();

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dataLimite = obterDataLimite(periodo);
    const primeiraData = datasValidas.length
      ? new Date(`${datasValidas[0]}T00:00:00`)
      : null;
    const ultimaData = datasValidas.length
      ? new Date(`${datasValidas[datasValidas.length - 1]}T00:00:00`)
      : null;

    const inicioBase = dataLimite ?? primeiraData ?? hoje;
    const fimBase = ultimaData && ultimaData > hoje ? ultimaData : hoje;

    const cursor = new Date(
      inicioBase.getFullYear(),
      inicioBase.getMonth(),
      1
    );
    const fim = new Date(fimBase.getFullYear(), fimBase.getMonth(), 1);

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
        agrupamento.set(chave, (agrupamento.get(chave) ?? 0) + custo);
      }
    });

    return Array.from(agrupamento.entries()).map(([mes, total]) => {
      const [ano, numeroMes] = mes.split("-").map(Number);

      return {
        mes,
        nome: new Date(ano, numeroMes - 1, 1).toLocaleDateString("pt-BR", {
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
      obterCustoContabilizavel(manutencao).toFixed(2).replace(".", ","),
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
        <div className="min-h-screen bg-slate-50 p-5 transition-colors sm:p-8 dark:bg-[#303035]">
        <div className="mx-auto max-w-[1500px] space-y-6">
        {/* Navegação — mesmo padrão da aba Chromebooks */}
        <div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="group inline-flex items-center gap-2 rounded-lg text-sm font-medium text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <span className="transition-transform group-hover:-translate-x-1">
              ←
            </span>
            Voltar ao Dashboard
          </button>
        </div>

        <header className="flex flex-col justify-between gap-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:p-8 dark:border-[#505057] dark:bg-[#444449]">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                Financeiro · Manutenção
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl dark:text-white">
              Relatório de gastos
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-300">
              Visão geral dos custos, reparos e despesas dos equipamentos da escola.
            </p>
          </div>

          <button
            type="button"
            onClick={exportarCSV}
            disabled={manutencoesFiltradas.length === 0}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            <span aria-hidden="true">↓</span>
            Exportar CSV para Excel
          </button>
        </header>

        <section className={`${cardBase} p-5 sm:p-6`}>
          <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                Filtrar relatório
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Escolha o período e o equipamento que deseja analisar.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setPeriodo("30-dias");
                setEquipamentoId("todos");
              }}
              className="self-start rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 sm:self-auto dark:text-gray-300 dark:hover:bg-[#303034] dark:hover:text-white"
            >
              Limpar filtros
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="periodo"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Período de análise
              </label>

              <select
                id="periodo"
                value={periodo}
                onChange={(event) => setPeriodo(event.target.value as Periodo)}
                className={selectBase}
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
                Equipamento
              </label>

              <select
                id="equipamento"
                value={equipamentoId}
                onChange={(event) => setEquipamentoId(event.target.value)}
                className={selectBase}
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

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="rounded-full bg-gray-100 px-3 py-1.5 dark:bg-[#303034]">
              {periodo === "7-dias"
                ? "Últimos 7 dias"
                : periodo === "30-dias"
                  ? "Últimos 30 dias"
                  : periodo === "6-meses"
                    ? "Últimos 6 meses"
                    : periodo === "1-ano"
                      ? "Último ano"
                      : "Todo o histórico"}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1.5 dark:bg-[#303034]">
              {equipamentoId === "todos"
                ? "Todos os equipamentos"
                : nomeChromebook(equipamentoId)}
            </span>
            <span>
              {manutencoesFiltradas.length} registro(s) encontrado(s)
            </span>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className={cardBase}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={labelBase}>Total gasto</p>
                <p className={valorBase}>{formatarMoeda(totalGasto)}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                R$
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Custos contabilizados no período
            </p>
          </div>

          <div className={cardBase}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={labelBase}>Registros encontrados</p>
                <p className={valorBase}>{manutencoesFiltradas.length}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                #
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Ocorrências, manutenções e reparos
            </p>
          </div>

          <div className={cardBase}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={labelBase}>Envios para reparo</p>
                <p className={valorBase}>{totalEnvios}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-xl text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                ↗
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Registros de envio no período
            </p>
          </div>

          <div className={cardBase}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={labelBase}>Retornos de reparo</p>
                <p className={valorBase}>{totalRetornos}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-xl text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                ↩
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              {registrosComCusto} registro(s) com custo contabilizado
            </p>
          </div>
        </section>

        <section className={cardBase}>
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Evolução dos gastos
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Comparação dos valores contabilizados mês a mês.
              </p>
            </div>

            <span className="w-fit rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 dark:bg-[#303034] dark:text-gray-300">
              {gastosPorMes.length} período(s)
            </span>
          </div>

          {gastosPorMes.length === 0 ? (
            <div className="rounded-xl bg-gray-50 px-4 py-12 text-center dark:bg-[#303034]">
              <p className="font-medium text-gray-700 dark:text-gray-200">
                Não há períodos para exibir.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex h-72 min-w-full items-stretch gap-3 border-b border-gray-200 pb-3 dark:border-[#5a5a60]">
                {gastosPorMes.map((item) => {
                  const altura =
                    item.total > 0
                      ? Math.max((item.total / maiorGastoMensal) * 100, 3)
                      : 0;

                  return (
                    <div
                      key={item.mes}
                      className="flex min-w-16 flex-1 flex-col items-center justify-end gap-3"
                      title={`${item.nome}: ${formatarMoeda(item.total)}`}
                    >
                      <span className="whitespace-nowrap text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                        {item.total > 0 ? formatarMoeda(item.total) : "—"}
                      </span>

                      <div className="flex min-h-0 w-full flex-1 items-end justify-center rounded-t-lg bg-gray-50 dark:bg-[#303034]">
                        <div
                          className="w-[65%] max-w-12 rounded-t-lg bg-gray-800 transition-all duration-300 dark:bg-gray-200"
                          style={{ height: `${altura}%` }}
                        />
                      </div>

                      <span className="whitespace-nowrap text-xs capitalize text-gray-500 dark:text-gray-400">
                        {item.nome}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-2 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-[#303034]">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total exibido no gráfico
            </span>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {formatarMoeda(totalGastoNoGrafico)}
            </span>
          </div>
        </section>

        <section className={cardBase}>
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Ranking de gastos por Chromebook
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Equipamentos com maior custo contabilizado no período.
            </p>
          </div>

          {rankingGastos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 px-4 py-12 text-center dark:border-[#5a5a60]">
              <p className="font-semibold text-gray-700 dark:text-gray-200">
                Nenhum gasto registrado neste período.
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                O ranking aparecerá quando houver custos maiores que zero.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {rankingGastos.map((item, indice) => {
                const percentual =
                  maiorGastoRanking > 0
                    ? (item.total / maiorGastoRanking) * 100
                    : 0;

                return (
                  <div key={item.id}>
                    <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-700 dark:bg-[#303034] dark:text-gray-200">
                          {String(indice + 1).padStart(2, "0")}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900 dark:text-gray-100">
                            {item.nome}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {item.quantidade} registro(s) com custo
                          </p>
                        </div>
                      </div>

                      <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                        {formatarMoeda(item.total)}
                      </p>
                    </div>

                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-[#303034]">
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

        <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-[#505057] dark:bg-[#444449]">
          <div className="flex flex-col gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:border-[#5a5a60]">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Histórico de gastos
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                Os envios aparecem no histórico, mas não entram no total gasto.
                O custo contabilizado considera o valor final do retorno ou de
                uma manutenção com custo registrado.
              </p>
            </div>

            <span className="w-fit shrink-0 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:bg-[#303034] dark:text-gray-300">
              {manutencoesFiltradas.length} registro(s)
            </span>
          </div>

          {manutencoesFiltradas.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-xl dark:bg-[#303034]">
                —
              </div>
              <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100">
                Nenhum registro encontrado
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
                Altere o período ou selecione outro Chromebook.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] border-collapse text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#3d3d42]">
                    {[
                      "Data",
                      "Equipamento",
                      "Tipo / categoria",
                      "Descrição",
                      "Destino",
                      "Resultado",
                      "Custo contabilizado",
                    ].map((titulo) => (
                      <th
                        key={titulo}
                        className={`whitespace-nowrap px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300 ${
                          titulo === "Custo contabilizado" ? "text-right" : ""
                        }`}
                      >
                        {titulo}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {manutencoesFiltradas.map((manutencao) => {
                    const custo = obterCustoContabilizavel(manutencao);

                    return (
                      <tr
                        key={manutencao.id}
                        className="border-t border-gray-100 transition-colors hover:bg-gray-50/80 dark:border-[#505057] dark:hover:bg-[#3d3d42]"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {formatarData(manutencao.data)}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-900 dark:text-gray-100">
                          <div className="font-semibold">
                            {nomeChromebook(manutencao.chromebookId)}
                          </div>
                          <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                            {manutencao.id}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm">
                          <div className="font-medium text-gray-800 dark:text-gray-100">
                            {nomeTipo(manutencao.tipo)}
                          </div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {nomeCategoria(manutencao.categoria)}
                          </div>
                        </td>

                        <td className="max-w-xs px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          <div>{manutencao.descricao || "—"}</div>
                          {manutencao.observacao && (
                            <div className="mt-1 text-xs text-gray-400 dark:text-gray-400">
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

                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-gray-900 dark:text-gray-100">
                          {custo > 0 ? formatarMoeda(custo) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50 dark:border-[#5a5a60] dark:bg-[#3d3d42]">
                    <td
                      colSpan={6}
                      className="px-5 py-5 text-right text-sm font-semibold text-gray-600 dark:text-gray-300"
                    >
                      Total contabilizado no período
                    </td>
                    <td className="whitespace-nowrap px-5 py-5 text-right text-base font-bold text-gray-950 dark:text-white">
                      {formatarMoeda(totalGasto)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>

        <p className="pb-3 text-center text-xs text-gray-400 dark:text-gray-500">
          Chromebook Manager · Relatório financeiro de manutenção
        </p>
      </div>
    </div>
  );
}