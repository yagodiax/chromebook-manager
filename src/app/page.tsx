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
      fetch("/api/equipamentos", { cache: "no-store", credentials: "same-origin" }).then(async (r) => { const d = await r.json().catch(() => []); if (!r.ok) throw new Error(d.erro || "Falha ao consultar equipamentos."); return d; }),
      fetch("/api/historico-equipamentos", { cache: "no-store", credentials: "same-origin" }).then(async (r) => { const d = await r.json().catch(() => []); if (!r.ok) throw new Error(d.erro || "Falha ao consultar histórico."); return d; }),
    ]).then(([eq, hist]) => {
      if (!ativo) return;
      setEquipamentos(Array.isArray(eq) ? eq : []);
      setHistorico(Array.isArray(hist) ? hist : []);
    }).catch((e: unknown) => { if (ativo) setErro(e instanceof Error ? e.message : "Não foi possível carregar o dashboard."); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, []);

  const porTipo = useMemo(() => Object.keys(TIPOS).map((tipo) => ({ tipo, nome: TIPOS[tipo], quantidade: equipamentos.filter((item) => item.tipo === tipo).length })), [equipamentos]);
  const emReparo = equipamentos.filter((item) => item.status === "em-reparo").length;
  const emUso = equipamentos.filter((item) => item.status === "em-uso").length;
  const custoReparos = historico.filter((item) => item.tipo === "retorno-de-reparo").reduce((total, item) => total + (Number(item.custo) || 0), 0);

  const cards = [
    { titulo: "Equipamentos cadastrados", valor: equipamentos.length, descricao: "Total de itens no inventário" },
    { titulo: "Em uso", valor: emUso, descricao: "Equipamentos em utilização" },
    { titulo: "Em reparo", valor: emReparo, descricao: "Itens enviados à assistência" },
    { titulo: "Custo de reparos", valor: moeda(custoReparos), descricao: "Total registrado nos retornos" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-5 sm:p-8 dark:bg-[#3a3a3f]">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Visão geral</p><h1 className="mt-2 text-3xl font-bold text-gray-950 dark:text-white">Dashboard</h1><p className="mt-2 text-gray-600 dark:text-gray-300">Acompanhe os equipamentos e as atividades de suporte da escola.</p></div><Link href="/cadastros" className="rounded-xl bg-gray-900 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900">+ Novo cadastro</Link></div>
        {erro && <div role="alert" className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{erro}</div>}
        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <div key={card.titulo} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-[#505057] dark:bg-[#444449]"><p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.titulo}</p><p className="mt-3 text-3xl font-bold text-gray-950 dark:text-white">{carregando ? "—" : card.valor}</p><p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{card.descricao}</p></div>)}</div>
        <div className="mt-7 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-[#505057] dark:bg-[#444449]"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-gray-950 dark:text-white">Inventário por categoria</h2><Link href="/equipamentos" className="text-sm font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-200 dark:hover:text-teal-100">Ver todos →</Link></div><div className="mt-4 space-y-4">{porTipo.map((item) => <div key={item.tipo}><div className="mb-2 flex items-center justify-between text-sm"><span className="text-gray-700 dark:text-gray-200">{item.nome}</span><span className="font-semibold text-gray-900 dark:text-white">{carregando ? "—" : item.quantidade}</span></div><div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-[#333338]"><div className="h-full rounded-full bg-teal-600 transition-all dark:bg-teal-300" style={{ width: equipamentos.length ? String((item.quantidade / equipamentos.length) * 100) + "%" : "0%" }} /></div></div>)}</div></section>
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-[#505057] dark:bg-[#444449]"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-gray-950 dark:text-white">Atividade recente</h2><Link href="/historico" className="text-sm font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-200 dark:hover:text-teal-100">Ver histórico →</Link></div>{historico.length === 0 ? <div className="py-12 text-center"><p className="font-medium text-gray-800 dark:text-gray-100">Nenhuma atividade registrada</p><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Os registros de manutenção e reparo aparecerão aqui.</p><Link href="/cadastros" className="mt-4 inline-block text-sm font-semibold text-teal-700 dark:text-teal-200">Criar primeiro registro →</Link></div> : <div className="mt-4 divide-y divide-gray-100 dark:divide-[#55555c]">{historico.slice(0, 6).map((item) => <div key={item.id} className="py-4 first:pt-0"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{TIPOS_HISTORICO[item.tipo] || item.tipo}</span><span className="text-xs text-gray-500 dark:text-gray-400">{formatarData(item.data)}</span></div><p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">{item.equipamento.patrimonio || item.equipamento.tipo} · {[item.equipamento.fabricante, item.equipamento.modelo].filter(Boolean).join(" ")}</p><p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{item.descricao}</p>{item.tipo === "retorno-de-reparo" && <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">{moeda(Number(item.custo) || 0)}</p>}</div>)}</div>}</section>
        </div>
        <section className="mt-7 rounded-2xl border border-gray-200 bg-white p-5 dark:border-[#505057] dark:bg-[#444449]"><h2 className="text-lg font-semibold text-gray-950 dark:text-white">Status do inventário</h2><div className="mt-4 flex flex-wrap gap-2">{Object.entries(STATUS).map(([status, nome]) => <span key={status} className="rounded-full bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 dark:bg-[#333338] dark:text-gray-200">{nome}: {carregando ? "—" : equipamentos.filter((item) => item.status === status).length}</span>)}</div></section>
      </div>
    </div>
  );
}
