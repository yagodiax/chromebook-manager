"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Periodo = "7-dias" | "30-dias" | "6-meses" | "1-ano" | "todo";
type Registro = {
  id: string;
  equipamentoId: string;
  equipamento: { patrimonio: string; tipo: string; fabricante: string; modelo: string; localizacao: string };
  tipo: string;
  categoria: string;
  data: string;
  descricao: string;
  observacao: string;
  custo: number;
  destinoReparo: string;
  resultado: string;
};
const TIPOS: Record<string, string> = { chromebook: "Chromebook", notebook: "Notebook", projetor: "Projetor", catraca: "Catraca", impressora: "Impressora" };
const REGISTROS: Record<string, string> = { ocorrencia: "Ocorrência", manutencao: "Manutenção interna", "reposicao-de-peca": "Reposição de peça", "envio-para-reparo": "Envio para reparo", "retorno-de-reparo": "Retorno do reparo" };
const card = "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-[#505057] dark:bg-[#444449]";
const campo = "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none dark:border-[#55555c] dark:bg-[#333338] dark:text-white";

function moeda(valor: number) { return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function dataBR(valor: string) { const partes = (valor || "").slice(0, 10).split("-"); return partes.length === 3 ? partes[2] + "/" + partes[1] + "/" + partes[0] : valor || "—"; }
function limitePeriodo(periodo: Periodo): string | null {
  if (periodo === "todo") return null;
  const data = new Date();
  data.setHours(0, 0, 0, 0);
  if (periodo === "7-dias") data.setDate(data.getDate() - 6);
  else if (periodo === "30-dias") data.setDate(data.getDate() - 29);
  else if (periodo === "6-meses") data.setMonth(data.getMonth() - 6);
  else data.setFullYear(data.getFullYear() - 1);
  return data.getFullYear() + "-" + String(data.getMonth() + 1).padStart(2, "0") + "-" + String(data.getDate()).padStart(2, "0");
}
function csv(valor: string | number) { return '"' + String(valor).replace(/"/g, '""') + '"'; }

export default function RelatorioGastosPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [periodo, setPeriodo] = useState<Periodo>("30-dias");
  const [equipamentoId, setEquipamentoId] = useState("todos");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    fetch("/api/historico-equipamentos", { cache: "no-store", credentials: "same-origin" })
      .then(async (resposta) => {
        const dados = await resposta.json().catch(() => []);
        if (!resposta.ok) throw new Error(dados.erro || "Não foi possível carregar o relatório.");
        if (ativo) setRegistros(Array.isArray(dados) ? dados : []);
      })
      .catch((e: unknown) => { if (ativo) setErro(e instanceof Error ? e.message : "Erro ao carregar relatório."); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, []);

  const equipamentos = useMemo(() => {
    const mapa = new Map<string, Registro["equipamento"]>();
    registros.forEach((item) => mapa.set(item.equipamentoId, item.equipamento));
    return Array.from(mapa.entries()).map(([id, equipamento]) => ({ id, equipamento }));
  }, [registros]);

  const filtrados = useMemo(() => {
    const limite = limitePeriodo(periodo);
    return registros.filter((item) => {
      if (equipamentoId !== "todos" && item.equipamentoId !== equipamentoId) return false;
      if (limite && item.data < limite) return false;
      return true;
    }).sort((a, b) => b.data.localeCompare(a.data));
  }, [registros, periodo, equipamentoId]);

  const total = filtrados.filter((item) => item.tipo === "retorno-de-reparo").reduce((soma, item) => soma + (Number(item.custo) || 0), 0);
  const envios = filtrados.filter((item) => item.tipo === "envio-para-reparo").length;
  const retornos = filtrados.filter((item) => item.tipo === "retorno-de-reparo").length;

  function exportarCSV() {
    const cabecalho = ["Data", "ID do registro", "ID do equipamento", "Patrimônio", "Tipo de equipamento", "Fabricante", "Modelo", "Localização", "Registro", "Categoria", "Descrição", "Destino do reparo", "Resultado", "Custo (R$)"];
    const linhas = filtrados.map((item) => [dataBR(item.data), item.id, item.equipamentoId, item.equipamento.patrimonio, TIPOS[item.equipamento.tipo] || item.equipamento.tipo, item.equipamento.fabricante, item.equipamento.modelo, item.equipamento.localizacao, REGISTROS[item.tipo] || item.tipo, item.categoria, item.descricao, item.destinoReparo, item.resultado, item.tipo === "retorno-de-reparo" ? (Number(item.custo) || 0).toFixed(2).replace(".", ",") : ""]);
    const texto = [cabecalho, ...linhas].map((linha) => linha.map(csv).join(";")).join("\r\n");
    const blob = new Blob(["\uFEFF", texto], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "relatorio-gastos-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gray-100 p-5 sm:p-8 dark:bg-[#3a3a3f]">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="text-sm font-medium text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white">← Voltar ao Dashboard</Link>
        <header className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Financeiro · Inventário</p><h1 className="mt-2 text-3xl font-bold text-gray-950 dark:text-white">Relatório de gastos</h1><p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Custos finais dos reparos externos de todas as categorias.</p></div><button type="button" onClick={exportarCSV} disabled={carregando || filtrados.length === 0} className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-gray-900">Exportar CSV para Excel ↓</button></header>
        {erro && <div role="alert" className="mt-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{erro}</div>}
        <section className={card + " mt-6"}><h2 className="font-semibold text-gray-900 dark:text-white">Filtros</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><label htmlFor="periodo" className="mb-2 block text-sm text-gray-600 dark:text-gray-300">Período</label><select id="periodo" className={campo} value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)}><option value="7-dias">Últimos 7 dias</option><option value="30-dias">Últimos 30 dias</option><option value="6-meses">Últimos 6 meses</option><option value="1-ano">Último ano</option><option value="todo">Todo o histórico</option></select></div><div><label htmlFor="equipamento" className="mb-2 block text-sm text-gray-600 dark:text-gray-300">Equipamento</label><select id="equipamento" className={campo} value={equipamentoId} onChange={(e) => setEquipamentoId(e.target.value)}><option value="todos">Todos os equipamentos</option>{equipamentos.map(({ id, equipamento }) => <option key={id} value={id}>{equipamento.patrimonio || id} · {TIPOS[equipamento.tipo] || equipamento.tipo} · {equipamento.modelo}</option>)}</select></div></div></section>
        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[{ nome: "Total gasto em reparos", valor: moeda(total), descricao: "Somente custos finais registrados no retorno" }, { nome: "Registros no período", valor: String(filtrados.length), descricao: "Ocorrências, manutenções e reparos" }, { nome: "Envios para reparo", valor: String(envios), descricao: "Envios à assistência técnica" }, { nome: "Retornos de reparo", valor: String(retornos), descricao: "Retornos com resultado e custo" }].map((item) => <div key={item.nome} className={card}><p className="text-sm text-gray-500 dark:text-gray-400">{item.nome}</p><p className="mt-3 text-2xl font-bold text-gray-950 dark:text-white">{carregando ? "—" : item.valor}</p><p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{item.descricao}</p></div>)}</section>
        <section className={card + " mt-5"}><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold text-gray-950 dark:text-white">Histórico financeiro</h2><span className="text-sm text-gray-500 dark:text-gray-400">{filtrados.length} registro(s)</span></div>{carregando ? <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-300">Carregando relatório...</p> : filtrados.length === 0 ? <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-300">Nenhum registro encontrado para esses filtros.</p> : <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[950px] text-left text-sm"><thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-[#55555c] dark:text-gray-400"><tr>{["Data", "Equipamento", "Tipo de registro", "Descrição", "Assistência", "Custo contabilizado"].map((titulo) => <th key={titulo} className="px-4 py-3">{titulo}</th>)}</tr></thead><tbody className="divide-y divide-gray-100 dark:divide-[#55555c]">{filtrados.map((item) => <tr key={item.id}><td className="whitespace-nowrap px-4 py-4">{dataBR(item.data)}</td><td className="px-4 py-4"><p className="font-semibold text-gray-900 dark:text-white">{item.equipamento.patrimonio || item.equipamento.tipo}</p><p className="text-xs text-gray-500 dark:text-gray-400">{[item.equipamento.fabricante, item.equipamento.modelo].filter(Boolean).join(" ")}</p></td><td className="px-4 py-4">{REGISTROS[item.tipo] || item.tipo}</td><td className="max-w-sm px-4 py-4">{item.descricao}</td><td className="px-4 py-4">{item.destinoReparo || "—"}</td><td className="whitespace-nowrap px-4 py-4 font-semibold">{item.tipo === "retorno-de-reparo" ? moeda(Number(item.custo) || 0) : "—"}</td></tr>)}</tbody><tfoot><tr className="border-t border-gray-200 dark:border-[#55555c]"><td colSpan={5} className="px-4 py-4 text-right font-semibold">Total gasto</td><td className="px-4 py-4 font-bold">{moeda(total)}</td></tr></tfoot></table></div>}</section>
      </div>
    </div>
  );
}
