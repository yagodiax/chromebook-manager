"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Equipamento = { id: string; patrimonio: string; tipo: string; fabricante: string; modelo: string; localizacao: string; status: string };
type Registro = { id: string; equipamentoId: string; equipamento: { patrimonio: string; tipo: string; fabricante: string; modelo: string; localizacao: string }; tipo: string; data: string; descricao: string; custo: number; destinoReparo: string; resultado: string };

const TIPOS: Record<string, string> = { chromebook: "Chromebooks", notebook: "Notebooks", projetor: "Projetores", catraca: "Catracas", impressora: "Impressoras" };
const STATUS: Record<string, string> = { disponivel: "Disponível", "em-uso": "Em uso", "em-reparo": "Em reparo", inativo: "Inativo", "para-descarte": "Para descarte" };
const TIPOS_HISTORICO: Record<string, string> = { ocorrencia: "Ocorrência", manutencao: "Manutenção", "reposicao-de-peca": "Reposição de peça", "envio-para-reparo": "Envio para reparo", "retorno-de-reparo": "Retorno do reparo" };

function formatarData(valor: string) {
  if (!valor) return "—";
  const partes = valor.slice(0, 10).split("-");
  return partes.length === 3 ? partes[2] + "/" + partes[1] + "/" + partes[0] : valor;
}

function moeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Home() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [historico, setHistorico] = useState<Registro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    Promise.all([
      fetch("/api/equipamentos", { cache: "no-store", credentials: "same-origin" }).then(async (r) => {
        const d = await r.json().catch(() => []);
        if (!r.ok) throw new Error(d.erro || "Falha ao consultar equipamentos.");
        return d;
      }),
      fetch("/api/historico-equipamentos", { cache: "no-store", credentials: "same-origin" }).then(async (r) => {
        const d = await r.json().catch(() => []);
        if (!r.ok) throw new Error(d.erro || "Falha ao consultar histórico.");
        return d;
      }),
    ])
      .then(([eq, hist]) => {
        if (!ativo) return;
        setEquipamentos(Array.isArray(eq) ? eq : []);
        setHistorico(Array.isArray(hist) ? hist : []);
      })
      .catch((e: unknown) => {
        if (ativo) setErro(e instanceof Error ? e.message : "Não foi possível carregar o dashboard.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => { ativo = false; };
  }, []);

  const porTipo = useMemo(
    () => Object.keys(TIPOS).map((tipo) => ({
      tipo,
      nome: TIPOS[tipo],
      quantidade: equipamentos.filter((item) => item.tipo === tipo).length,
    })),
    [equipamentos],
  );
  const emReparo = equipamentos.filter((item) => item.status === "em-reparo").length;
  const emUso = equipamentos.filter((item) => item.status === "em-uso").length;
  const custoReparos = historico
    .filter((item) => item.tipo === "retorno-de-reparo")
    .reduce((total, item) => total + (Number(item.custo) || 0), 0);

  const maioresGastos = useMemo(() => {
    const mapa = new Map<string, { id: string; nome: string; tipo: string; modelo: string; total: number; reparos: number }>();
    historico.filter((item) => item.tipo === "retorno-de-reparo").forEach((item) => {
      const atual = mapa.get(item.equipamentoId) || { id: item.equipamentoId, nome: item.equipamento.patrimonio || item.equipamentoId, tipo: TIPOS[item.equipamento.tipo] || item.equipamento.tipo, modelo: [item.equipamento.fabricante, item.equipamento.modelo].filter(Boolean).join(" "), total: 0, reparos: 0 };
      atual.total += Number(item.custo) || 0; atual.reparos += 1; mapa.set(item.equipamentoId, atual);
    });
    return Array.from(mapa.values()).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [historico]);

  const cards = [
    { titulo: "Equipamentos cadastrados", valor: equipamentos.length, descricao: "Total de itens no inventário", icone: "▦" },
    { titulo: "Em uso", valor: emUso, descricao: "Equipamentos em utilização", icone: "✓" },
    { titulo: "Em reparo", valor: emReparo, descricao: "Itens enviados à assistência", icone: "⚒" },
    { titulo: "Custo de reparos", valor: moeda(custoReparos), descricao: "Total registrado nos retornos", icone: "R$" },
  ];

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-7 xl:p-9 dark:bg-[#2b2b2b]">
      <div className="mx-auto max-w-[1500px]">
        <header className="rounded-xl border border-gray-300 bg-white p-6 shadow-sm sm:p-8 dark:border-gray-600 dark:bg-[#383838]">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Central administrativa · Tecnologia</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl dark:text-gray-100">Dashboard</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">
                Visão geral do patrimônio, da disponibilidade dos equipamentos e das atividades de suporte.
              </p>
            </div>
            <Link href="/cadastros" className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg border border-gray-400 bg-gray-200 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-300 sm:self-center dark:border-gray-500 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
              ＋ Novo registro
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-gray-200 pt-4 text-xs text-gray-500 dark:border-gray-600 dark:text-gray-400">
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-gray-500" /> Inventário e patrimônio</span>
            <span>Manutenção e suporte técnico</span>
          </div>
        </header>

        {erro && <div role="alert" className="mt-5 rounded-lg border border-gray-400 bg-gray-200 p-4 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">{erro}</div>}

        <section aria-label="Indicadores principais" className="mt-5 grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {cards.map((item, index) => (
            <article key={item.titulo} className="rounded-xl border border-gray-300 bg-white p-5 shadow-sm transition hover:border-gray-400 dark:border-gray-600 dark:bg-[#383838] dark:hover:border-gray-500">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{item.titulo}</p>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-gray-100 text-sm font-bold text-gray-700 dark:border-gray-600 dark:bg-[#464646] dark:text-gray-100">{item.icone}</span>
              </div>
              <p className="mt-5 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">{carregando ? "—" : item.valor}</p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{item.descricao}</p>
              <div className={`mt-5 h-1 rounded-full ${index === 0 ? "bg-gray-500" : index === 1 ? "bg-gray-400" : index === 2 ? "bg-gray-600" : "bg-gray-300 dark:bg-gray-500"}`} />
            </article>
          ))}
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <article className="overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm dark:border-gray-600 dark:bg-[#383838]">
            <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-5 sm:px-6 dark:border-gray-600">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-xl text-amber-800 dark:bg-amber-400/15 dark:text-amber-300" aria-hidden="true">▦</div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.13em] text-gray-500 dark:text-gray-400">Distribuição</p>
                  <h2 className="mt-0.5 text-lg font-semibold text-gray-900 dark:text-gray-100">Inventário por categoria</h2>
                </div>
              </div>
              <Link href="/equipamentos" className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                Ver inventário <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5">
              {porTipo.map((item) => {
                const proporcao = equipamentos.length ? Math.round((item.quantidade / equipamentos.length) * 100) : 0;
                const simbolos: Record<string, string> = { chromebook: "▣", notebook: "▱", projetor: "◉", catraca: "↔", impressora: "▤" };
                return (
                  <Link key={item.tipo} href="/equipamentos" className="group rounded-xl border border-gray-200 bg-gray-50/70 p-4 transition duration-150 hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-50/60 dark:border-gray-600 dark:bg-[#30302f] dark:hover:border-amber-400 dark:hover:bg-[#3c382d]">
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-lg text-gray-700 dark:border-gray-600 dark:bg-[#464646] dark:text-gray-100" aria-hidden="true">{simbolos[item.tipo] || "▦"}</span>
                      <span className="rounded-full bg-gray-200 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-gray-600 dark:bg-gray-700 dark:text-gray-300">{carregando ? "—" : proporcao + "%"}</span>
                    </div>
                    <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-300">{item.nome}</p>
                    <div className="mt-1 flex items-end justify-between gap-2">
                      <p className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">{carregando ? "—" : item.quantidade}</p>
                      <span className="pb-1 text-xs text-gray-500 transition group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white">Ver itens <span aria-hidden="true">↗</span></span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div className="h-full rounded-full bg-amber-500 transition-all duration-500 dark:bg-amber-400" style={{ width: carregando ? "0%" : String(proporcao) + "%" }} />
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-gray-200 px-5 py-3.5 dark:border-gray-600">
              <span className="text-xs text-gray-500 dark:text-gray-400">Total de equipamentos cadastrados</span>
              <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">{carregando ? "—" : equipamentos.length}</span>
            </div>
          </article>

          <article className="rounded-2xl border border-gray-300 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-600 dark:bg-[#383838]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">Registros</p>
                <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">Atividade recente</h2>
              </div>
              <Link href="/historico" className="rounded-md px-2 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">Ver histórico →</Link>
            </div>
            {historico.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-gray-300 bg-gray-100 text-lg text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">—</div>
                <p className="mt-3 font-semibold text-gray-800 dark:text-gray-100">Nenhuma atividade registrada</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manutenções e reparos aparecerão aqui.</p>
                <Link href="/cadastros" className="mt-4 inline-flex rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Criar primeiro registro</Link>
              </div>
            ) : (
              <div className="mt-3 divide-y divide-gray-200 dark:divide-gray-600">
                {historico.slice(0, 6).map((item) => (
                  <div key={item.id} className="py-4 first:pt-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-md border border-gray-300 bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">{TIPOS_HISTORICO[item.tipo] || item.tipo}</span>
                      <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">{formatarData(item.data)}</span>
                    </div>
                    <p className="mt-2 font-semibold text-gray-900 dark:text-gray-100">{item.equipamento.patrimonio || item.equipamento.tipo} · {[item.equipamento.fabricante, item.equipamento.modelo].filter(Boolean).join(" ")}</p>
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-gray-600 dark:text-gray-300">{item.descricao}</p>
                    {item.tipo === "retorno-de-reparo" && <p className="mt-2 text-sm font-semibold text-gray-700 dark:text-gray-200">{moeda(Number(item.custo) || 0)}</p>}
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="mt-5 rounded-xl border border-gray-300 bg-white p-5 shadow-sm dark:border-gray-600 dark:bg-[#383838]">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">Financeiro</p><h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">Equipamentos com maior gasto em reparos</h2><p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Ranking baseado nos custos registrados nos retornos da assistência.</p></div><Link href="/relatorios/gastos" className="rounded-md px-2 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">Ver relatório →</Link></div>
          {maioresGastos.length === 0 ? <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Ainda não há custos de reparos registrados.</p> : <div className="mt-4 divide-y divide-gray-200 dark:divide-gray-600">{maioresGastos.map((item, index) => <div key={item.id} className="flex items-center gap-3 py-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-100">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><p className="truncate font-semibold text-gray-900 dark:text-gray-100">{item.nome}</p><p className="truncate text-xs text-gray-500 dark:text-gray-400">{item.tipo}{item.modelo ? " · " + item.modelo : ""} · {item.reparos} reparo(s)</p></div><strong className="whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100">{carregando ? "—" : moeda(item.total)}</strong></div>)}</div>}
        </section>

        <section className="mt-5 rounded-xl border border-gray-300 bg-white p-5 shadow-sm dark:border-gray-600 dark:bg-[#383838]">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">Condição dos ativos</p>
              <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">Status do inventário</h2>
            </div>
            <span className="w-fit rounded-md border border-gray-300 bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">{equipamentos.length} equipamentos</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Object.entries(STATUS).map(([status, nome]) => {
              const quantidade = equipamentos.filter((item) => item.status === status).length;
              return (
                <div key={status} className="rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 dark:border-gray-600 dark:bg-[#464646]">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{nome}</p>
                  <p className="mt-2 text-xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">{carregando ? "—" : quantidade}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
