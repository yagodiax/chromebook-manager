"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Registro = {
  id: string;
  equipamentoId: string;
  equipamento: { patrimonio: string; tipo: string; fabricante: string; modelo: string; localizacao: string };
  tipo: string;
  categoria: string;
  data: string;
  descricao: string;
  observacao: string;
  quemRealizou: string;
  custo: number;
  destinoReparo: string;
  resultado: string;
  statusFinal: string;
  anexos: { id: number; nome: string; tipo: string; tamanho: number }[];
};
const TIPOS: Record<string, string> = {
  ocorrencia: "Ocorrência",
  manutencao: "Manutenção interna",
  "reposicao-de-peca": "Reposição de peça",
  "envio-para-reparo": "Envio para reparo",
  "retorno-de-reparo": "Retorno do reparo",
};
const STATUS: Record<string, string> = { "em-uso": "Em uso", disponivel: "Disponível", "em-reparo": "Em reparo", inativo: "Inativo", "para-descarte": "Para descarte" };
const campo = "rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none dark:border-[#55555c] dark:bg-[#333338] dark:text-white";

export default function HistoricoPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    fetch("/api/historico-equipamentos", { cache: "no-store", credentials: "same-origin" })
      .then(async (resposta) => {
        const dados = await resposta.json().catch(() => []);
        if (!resposta.ok) throw new Error(dados.erro || "Não foi possível carregar o histórico.");
        if (ativo) setRegistros(Array.isArray(dados) ? dados : []);
      })
      .catch((e: unknown) => { if (ativo) setErro(e instanceof Error ? e.message : "Erro ao carregar histórico."); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, []);

  const lista = useMemo(() => registros.filter((item) => {
    const texto = [item.equipamento.patrimonio, item.equipamento.tipo, item.equipamento.fabricante, item.equipamento.modelo, item.equipamento.localizacao, item.descricao, item.destinoReparo, item.quemRealizou].join(" ").toLocaleLowerCase("pt-BR");
    return (filtroTipo === "todos" || item.tipo === filtroTipo) && (!busca.trim() || texto.includes(busca.trim().toLocaleLowerCase("pt-BR")));
  }), [registros, busca, filtroTipo]);

  function moeda(valor: number) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  function dataFormatada(valor: string) {
    if (!valor) return "—";
    const partes = valor.slice(0, 10).split("-");
    return partes.length === 3 ? partes[2] + "/" + partes[1] + "/" + partes[0] : valor;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-5 sm:p-8 dark:bg-[#3a3a3f]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Manutenções e reparos</p><h1 className="mt-2 text-3xl font-bold text-gray-950 dark:text-white">Histórico dos equipamentos</h1><p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Todos os registros em uma única consulta.</p></div><Link href="/cadastros" className="rounded-xl bg-gray-900 px-5 py-3 text-center text-sm font-semibold text-white dark:bg-white dark:text-gray-900">+ Novo registro</Link></div>
        <div className="mb-5 grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-[1fr_250px] dark:border-[#505057] dark:bg-[#444449]"><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar equipamento, empresa, descrição..." className={campo} /><select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className={campo}><option value="todos">Todos os registros</option>{Object.entries(TIPOS).map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}</select></div>
        {erro && <div role="alert" className="mb-4 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{erro}</div>}
        {carregando ? <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-500 dark:border-[#505057] dark:bg-[#444449] dark:text-gray-300">Carregando histórico...</div> : lista.length === 0 ? <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-[#505057] dark:bg-[#444449]"><p className="font-semibold text-gray-900 dark:text-white">Nenhum registro encontrado</p><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Quando você registrar uma ocorrência, manutenção ou reparo, ela aparecerá aqui.</p><Link href="/cadastros" className="mt-5 inline-block rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-gray-900">Cadastrar primeiro registro</Link></div> : <div className="space-y-4">{lista.map((item) => <article key={item.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-[#505057] dark:bg-[#444449] sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-[#333338] dark:text-gray-200">{TIPOS[item.tipo] || item.tipo}</span><span className="text-xs text-gray-500 dark:text-gray-400">{dataFormatada(item.data)}</span></div><h2 className="mt-3 text-lg font-semibold text-gray-950 dark:text-white">{item.equipamento.patrimonio || item.equipamento.tipo} · {[item.equipamento.fabricante, item.equipamento.modelo].filter(Boolean).join(" ")}</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.equipamento.localizacao || "Localização não informada"} · ID {item.equipamentoId}</p></div>{item.tipo === "retorno-de-reparo" && <p className="text-lg font-bold text-gray-900 dark:text-white">{moeda(Number(item.custo) || 0)}</p>}</div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-700 dark:text-gray-200">{item.descricao}</p>{item.destinoReparo && <p className="mt-3 text-sm text-gray-600 dark:text-gray-300"><strong>Assistência:</strong> {item.destinoReparo}</p>}{item.resultado && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300"><strong>Resultado:</strong> {item.resultado}</p>}{item.statusFinal && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300"><strong>Status após retorno:</strong> {STATUS[item.statusFinal] || item.statusFinal}</p>}{item.quemRealizou && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300"><strong>Responsável:</strong> {item.quemRealizou}</p>}{item.observacao && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-500 dark:text-gray-400"><strong>Observação:</strong> {item.observacao}</p>}{item.anexos.length > 0 && <div className="mt-4 border-t border-gray-200 pt-3 dark:border-[#55555c]"><p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Anexos</p><p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{item.anexos.map((anexo) => anexo.nome).join(" · ")}</p></div>}</article>)}</div>}
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">{lista.length} registro(s) encontrado(s).</p>
      </div>
    </div>
  );
}
