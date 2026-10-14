"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type TipoEquipamento = "chromebook" | "notebook" | "projetor" | "catraca" | "impressora";
type Equipamento = { id: string; patrimonio: string; tipo: TipoEquipamento; fabricante: string; modelo: string; numeroSerie: string; localizacao: string; status: string; observacoes: string; detalhes: Record<string, unknown> };

const NOMES: Record<TipoEquipamento, string> = { chromebook: "Chromebook", notebook: "Notebook", projetor: "Projetor", catraca: "Catraca", impressora: "Impressora" };
const STATUS: Record<string, string> = { disponivel: "Disponível", "em-uso": "Em uso", "em-reparo": "Em reparo", inativo: "Inativo", "para-descarte": "Para descarte" };
const campo = "rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none dark:border-[#55555c] dark:bg-[#333338] dark:text-white";

export default function EquipamentosLista({ tipoFiltro }: { tipoFiltro?: TipoEquipamento }) {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const resposta = await fetch("/api/equipamentos", { cache: "no-store", credentials: "same-origin" });
        const dados = await resposta.json().catch(() => []);
        if (!resposta.ok) throw new Error(dados.erro || "Não foi possível carregar os equipamentos.");
        if (ativo) setEquipamentos(Array.isArray(dados) ? dados : []);
      } catch (e) {
        if (ativo) setErro(e instanceof Error ? e.message : "Erro ao carregar equipamentos.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    void carregar();
    return () => { ativo = false; };
  }, []);

  const lista = useMemo(() => equipamentos.filter((item) => {
    const tipoOk = !tipoFiltro || item.tipo === tipoFiltro;
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    const textoBusca = [item.id, item.patrimonio, item.fabricante, item.modelo, item.numeroSerie, item.localizacao, String(item.detalhes?.numeroChromebook ?? ""), String(item.detalhes?.mac ?? "")].join(" ").toLocaleLowerCase("pt-BR");
    return tipoOk && (!termo || textoBusca.includes(termo)) && (statusFiltro === "todos" || item.status === statusFiltro);
  }), [equipamentos, tipoFiltro, busca, statusFiltro]);

  const titulo = tipoFiltro ? NOMES[tipoFiltro] + "s" : "Todos os equipamentos";

  return (
    <div className="min-h-screen bg-gray-100 p-5 sm:p-8 dark:bg-[#3a3a3f]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Inventário</p><h1 className="mt-2 text-3xl font-bold text-gray-950 dark:text-white">{titulo}</h1><p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Consulte e filtre os equipamentos cadastrados.</p></div>
          <Link href="/cadastros/equipamentos/novo" className="rounded-xl bg-gray-900 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900">+ Cadastrar equipamento</Link>
        </div>
        <div className="mb-5 grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-[1fr_220px] dark:border-[#505057] dark:bg-[#444449]">
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar patrimônio, modelo, série ou localização..." className={campo} />
          <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)} className={campo}><option value="todos">Todos os status</option>{Object.entries(STATUS).map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}</select>
        </div>
        {erro && <div role="alert" className="mb-4 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{erro}</div>}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-[#505057] dark:bg-[#444449]">
          {carregando ? <p className="p-8 text-sm text-gray-500 dark:text-gray-300">Carregando equipamentos...</p> : lista.length === 0 ? <div className="p-10 text-center"><p className="font-semibold text-gray-900 dark:text-white">Nenhum equipamento encontrado</p><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Cadastre um equipamento ou ajuste os filtros.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-[#55555c] dark:bg-[#39393e] dark:text-gray-400"><tr><th className="px-5 py-4">Equipamento</th><th className="px-5 py-4">Patrimônio</th><th className="px-5 py-4">Modelo</th><th className="px-5 py-4">Localização</th><th className="px-5 py-4">Status</th></tr></thead><tbody className="divide-y divide-gray-100 dark:divide-[#55555c]">{lista.map((item) => <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-[#3c3c41]"><td className="px-5 py-4"><p className="font-semibold text-gray-900 dark:text-gray-100">{NOMES[item.tipo]}</p><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.id}</p></td><td className="px-5 py-4 text-gray-700 dark:text-gray-300">{item.patrimonio || "—"}{item.tipo === "chromebook" && item.detalhes?.numeroChromebook ? <p className="mt-1 text-xs text-gray-500">Nº {String(item.detalhes.numeroChromebook)}</p> : null}</td><td className="px-5 py-4 text-gray-700 dark:text-gray-300">{[item.fabricante, item.modelo].filter(Boolean).join(" ") || "—"}</td><td className="px-5 py-4 text-gray-700 dark:text-gray-300">{item.localizacao || "—"}</td><td className="px-5 py-4"><span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">{STATUS[item.status] || item.status}</span></td></tr>)}</tbody></table></div>}
        </div>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Exibindo {lista.length} equipamento(s).</p>
      </div>
    </div>
  );
}
