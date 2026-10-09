"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getChromebooks } from "@/lib/chromebooks";
import { getManutencoes } from "@/lib/manutencoes";
import type { Chromebook } from "@/types/chromebook";
import type { Manutencao } from "@/types/manutencao";

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

function nomeTipo(tipo: Manutencao["tipo"]): string {
  const nomes: Record<Manutencao["tipo"], string> = {
    ocorrencia: "Ocorrência",
    manutencao: "Manutenção",
    "reposicao-de-peca": "Reposição de peça",
    "envio-para-reparo": "Envio para reparo",
  };

  return nomes[tipo] ?? tipo;
}

function nomeChromebook(
  id: string,
  chromebooks: Chromebook[]
): string {
  const equipamento = chromebooks.find((item) => item.id === id);

  return equipamento
    ? `Chromebook ${equipamento.numero} · ${equipamento.modelo}`
    : id || "Equipamento não encontrado";
}

type CardProps = {
  titulo: string;
  valor: string | number;
  descricao: string;
  cor: "azul" | "verde" | "laranja" | "vermelho" | "roxo";
  simbolo: string;
};

function CardIndicador({
  titulo,
  valor,
  descricao,
  cor,
  simbolo,
}: CardProps) {
  const cores = {
    azul: {
      faixa: "bg-blue-600",
      icone: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
      valor: "text-blue-700 dark:text-blue-300",
    },
    verde: {
      faixa: "bg-green-500",
      icone: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
      valor: "text-green-700 dark:text-green-300",
    },
    laranja: {
      faixa: "bg-orange-500",
      icone: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
      valor: "text-orange-700 dark:text-orange-300",
    },
    vermelho: {
      faixa: "bg-red-500",
      icone: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
      valor: "text-red-700 dark:text-red-300",
    },
    roxo: {
      faixa: "bg-violet-500",
      icone: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
      valor: "text-violet-700 dark:text-violet-300",
    },
  };

  const estilo = cores[cor];

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md dark:border-[#505057] dark:bg-[#444449]">
      <div className={`absolute left-0 top-0 h-1 w-full ${estilo.faixa}`} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {titulo}
          </p>

          <p className={`mt-3 text-3xl font-bold ${estilo.valor}`}>
            {valor}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl font-bold ${estilo.icone}`}
        >
          {simbolo}
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        {descricao}
      </p>
    </div>
  );
}

export default function Home() {
  const [chromebooks, setChromebooks] = useState<Chromebook[]>([]);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);

  useEffect(() => {
    setChromebooks(getChromebooks());
    setManutencoes(getManutencoes());
  }, []);

  const total = chromebooks.length;

  const disponiveis = chromebooks.filter(
    (item) => item.status === "disponivel"
  ).length;

  const emUso = chromebooks.filter(
    (item) => item.status === "em-uso"
  ).length;

  const emReparo = chromebooks.filter(
    (item) => item.status === "em-reparo"
  ).length;

  const retiradaDePecas = chromebooks.filter(
    (item) => item.status === "retirada-de-pecas"
  ).length;

  const totalGasto = manutencoes.reduce((soma, item) => {
    const custo = item.custo;

    return typeof custo === "number" &&
      Number.isFinite(custo) &&
      custo >= 0
      ? soma + custo
      : soma;
  }, 0);

  const manutencoesRecentes = [...manutencoes]
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-gray-50 p-5 transition-colors sm:p-8 dark:bg-[#303036]">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400">
                Central de gerenciamento
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Acompanhe seus equipamentos, manutenções e custos de TI.
            </p>
          </div>

          <Link
            href="/chromebooks/novo"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-[#303036]"
          >
            <span className="text-lg">+</span>
            Novo Chromebook
          </Link>
        </header>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-blue-600" />
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">
              Visão geral dos equipamentos
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CardIndicador
              titulo="Total de Chromebooks"
              valor={total}
              descricao="Equipamentos cadastrados"
              cor="azul"
              simbolo="▣"
            />

            <CardIndicador
              titulo="Disponíveis"
              valor={disponiveis}
              descricao="Prontos para utilização"
              cor="verde"
              simbolo="✓"
            />

            <CardIndicador
              titulo="Em uso"
              valor={emUso}
              descricao="Em utilização atualmente"
              cor="roxo"
              simbolo="↗"
            />

            <CardIndicador
              titulo="Em reparo"
              valor={emReparo}
              descricao="Precisam de acompanhamento"
              cor="laranja"
              simbolo="⚙"
            />
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-violet-600" />
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">
              Manutenção e custos
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <CardIndicador
              titulo="Gastos acumulados"
              valor={formatarMoeda(totalGasto)}
              descricao="Soma dos custos registrados"
              cor="azul"
              simbolo="R$"
            />

            <CardIndicador
              titulo="Registros de manutenção"
              valor={manutencoes.length}
              descricao="Histórico total cadastrado"
              cor="roxo"
              simbolo="≡"
            />

            <CardIndicador
              titulo="Retirada de peças"
              valor={retiradaDePecas}
              descricao="Equipamentos nessa condição"
              cor="vermelho"
              simbolo="!"
            />
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-[#505057] dark:bg-[#444449] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Manutenções recentes
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Últimos registros por data.
                </p>
              </div>

              <Link
                href="/relatorios/gastos"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950"
              >
                Ver relatório →
              </Link>
            </div>

            {manutencoesRecentes.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center dark:border-[#606068]">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  +
                </div>

                <p className="mt-3 font-semibold text-gray-800 dark:text-gray-100">
                  Nenhuma manutenção registrada
                </p>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Seus registros aparecerão aqui.
                </p>

                <Link
                  href="/chromebooks/manutencao/nova"
                  className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Registrar manutenção
                </Link>
              </div>
            ) : (
              <div className="mt-5 divide-y divide-gray-100 dark:divide-[#56565d]">
                {manutencoesRecentes.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        TI
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {nomeChromebook(item.chromebookId, chromebooks)}
                        </p>

                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                          {nomeTipo(item.tipo)}
                        </p>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {formatarData(item.data)} · {item.id}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 sm:text-right">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {typeof item.custo === "number" &&
                        Number.isFinite(item.custo)
                          ? formatarMoeda(item.custo)
                          : "Sem custo informado"}
                      </p>

                      <Link
                        href={`/chromebooks/manutencao/editar?id=${encodeURIComponent(item.id)}`}
                        className="mt-1 inline-block text-xs font-medium text-blue-700 hover:underline dark:text-blue-300"
                      >
                        Abrir registro
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-[#505057] dark:bg-[#444449] sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Acesso rápido
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              O que você precisa fazer?
            </p>

            <div className="mt-5 space-y-3">
              <Link
                href="/chromebooks"
                className="group flex items-center gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-blue-300 hover:bg-blue-50 dark:border-[#585860] dark:hover:border-blue-800 dark:hover:bg-blue-950/40"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-lg text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  ▣
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-gray-900 dark:text-gray-100">
                    Chromebooks
                  </span>
                  <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                    Consultar e gerenciar equipamentos
                  </span>
                </span>

                <span className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-blue-600">
                  →
                </span>
              </Link>

              <Link
                href="/chromebooks/manutencao/nova"
                className="group flex items-center gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-orange-300 hover:bg-orange-50 dark:border-[#585860] dark:hover:border-orange-800 dark:hover:bg-orange-950/30"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-lg text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                  ⚙
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-gray-900 dark:text-gray-100">
                    Nova manutenção
                  </span>
                  <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                    Registrar ocorrência ou reparo
                  </span>
                </span>

                <span className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-orange-600">
                  →
                </span>
              </Link>

              <Link
                href="/relatorios/gastos"
                className="group flex items-center gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-green-300 hover:bg-green-50 dark:border-[#585860] dark:hover:border-green-800 dark:hover:bg-green-950/30"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-lg font-bold text-green-700 dark:bg-green-950 dark:text-green-300">
                  R$
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-gray-900 dark:text-gray-100">
                    Relatório de gastos
                  </span>
                  <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                    Consultar despesas e ranking
                  </span>
                </span>

                <span className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-green-600">
                  →
                </span>
              </Link>
            </div>

            <div className="mt-6 rounded-xl bg-blue-50 p-4 dark:bg-blue-950/40">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                Controle de equipamentos
              </p>

              <p className="mt-1 text-xs leading-5 text-blue-800 dark:text-blue-300">
                Acompanhe os status e mantenha o histórico de manutenção
                atualizado para facilitar a gestão de TI.
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-500 dark:border-[#505057] dark:text-gray-400">
          Chromebook Manager · Indicadores calculados com os registros locais.
        </footer>
      </div>
    </main>
  );
}