"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Equipamento = {
  id: string;
  patrimonio: string;
  tipo: string;
  fabricante: string;
  modelo: string;
  numeroSerie: string;
  localizacao: string;
  status: string;
  observacoes: string;
  detalhes: Record<string, unknown>;
};

const TIPOS: Record<string, string> = {
  chromebook: "Chromebook",
  notebook: "Notebook",
  projetor: "Projetor",
  catraca: "Catraca",
  impressora: "Impressora",
};

export default function EmReparoPage() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const resposta = await fetch("/api/equipamentos", {
          cache: "no-store",
          credentials: "same-origin",
        });
        const dados = await resposta.json().catch(() => []);
        if (!resposta.ok) throw new Error(dados.erro || "Não foi possível carregar os equipamentos.");
        if (ativo) {
          setEquipamentos(Array.isArray(dados) ? dados.filter((item) => item.status === "em-reparo") : []);
        }
      } catch (e) {
        if (ativo) setErro(e instanceof Error ? e.message : "Erro ao carregar equipamentos em reparo.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    void carregar();
    return () => { ativo = false; };
  }, []);

  const lista = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return equipamentos
      .filter((item) => tipoFiltro === "todos" || item.tipo === tipoFiltro)
      .filter((item) => {
        const texto = [
          item.id, item.patrimonio, item.fabricante, item.modelo, item.numeroSerie,
          item.localizacao, item.observacoes,
          String(item.detalhes?.numeroChromebook ?? ""),
          String(item.detalhes?.mac ?? ""),
        ].join(" ").toLocaleLowerCase("pt-BR");
        return !termo || texto.includes(termo);
      })
      .sort((a, b) => {
        const na = Number(itemNumero(a));
        const nb = Number(itemNumero(b));
        if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
        return (a.patrimonio || a.id).localeCompare(b.patrimonio || b.id, "pt-BR");
      });
  }, [equipamentos, busca, tipoFiltro]);

  function itemNumero(item: Equipamento) {
    return String(item.detalhes?.numeroChromebook ?? item.patrimonio ?? "");
  }

  const campo = "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-500 dark:border-[#55555c] dark:bg-[#333338] dark:text-white";
  const th = "whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[.13em] text-gray-600 dark:text-gray-300";
  const td = "px-4 py-4 align-middle text-sm text-gray-700 dark:text-gray-300";

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-7 xl:p-9 dark:bg-[#2b2b2b]">
      <div className="mx-auto max-w-[1500px]">
        <header className="rounded-2xl border border-gray-300 bg-white p-6 shadow-sm sm:p-8 dark:border-gray-600 dark:bg-[#383838]">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-gray-500 dark:text-gray-400">Inventário · Manutenção</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Equipamentos em reparo</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Acompanhe os equipamentos que estão aguardando conserto ou na assistência técnica.</p>
            </div>
            <Link href="/historico" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 dark:border-gray-500 dark:text-gray-100 dark:hover:bg-gray-700">Consultar histórico →</Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-300 bg-gray-100 p-4 dark:border-gray-600 dark:bg-[#303030]">
              <p className="text-sm text-gray-600 dark:text-gray-300">Total em reparo</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{carregando ? "—" : equipamentos.length}</p>
            </div>
            <div className="rounded-xl border border-gray-300 bg-gray-100 p-4 dark:border-gray-600 dark:bg-[#303030]">
              <p className="text-sm text-gray-600 dark:text-gray-300">Tipos de equipamento</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{carregando ? "—" : new Set(equipamentos.map((item) => item.tipo)).size}</p>
            </div>
            <div className="rounded-xl border border-gray-300 bg-gray-100 p-4 dark:border-gray-600 dark:bg-[#303030]">
              <p className="text-sm text-gray-600 dark:text-gray-300">Com localização informada</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{carregando ? "—" : equipamentos.filter((item) => item.localizacao).length}</p>
            </div>
          </div>
        </header>

        <section className="mt-5 grid gap-3 rounded-2xl border border-gray-300 bg-white p-4 shadow-sm sm:grid-cols-[1fr_220px] dark:border-gray-600 dark:bg-[#383838]">
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por número, patrimônio, modelo, série ou MAC..." className={campo} />
          <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} className={campo}>
            <option value="todos">Todos os tipos</option>
            {Object.entries(TIPOS).map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}
          </select>
        </section>

        {erro && <div role="alert" className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{erro}</div>}

        <section className="mt-5 overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm dark:border-gray-600 dark:bg-[#383838]">
          {carregando ? <p className="p-8 text-sm text-gray-500 dark:text-gray-300">Carregando equipamentos em reparo...</p> : lista.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-semibold text-gray-900 dark:text-white">Nenhum equipamento em reparo encontrado</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Quando o status de um equipamento for alterado para “Em reparo”, ele aparecerá aqui.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-[#303030]">
                  <tr>
                    <th className={th}>Equipamento</th>
                    <th className={th}>Tipo</th>
                    <th className={th}>Modelo</th>
                    <th className={th}>Localização</th>
                    <th className={th}>Número de série</th>
                    <th className={th}>Status</th>
                    <th className={th}>Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {lista.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-[#424242]">
                      <td className={td}>
                        <p className="font-semibold text-gray-900 dark:text-white">{item.detalhes?.numeroChromebook != null ? `Chromebook nº ${String(item.detalhes.numeroChromebook)}` : item.patrimonio || item.id}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.patrimonio || item.id}</p>
                      </td>
                      <td className={td}>{TIPOS[item.tipo] || item.tipo}</td>
                      <td className={td}>{[item.fabricante, item.modelo].filter(Boolean).join(" ") || "—"}</td>
                      <td className={td}>{item.localizacao || "—"}</td>
                      <td className={td}>{item.numeroSerie || "—"}</td>
                      <td className={td}><span className="inline-flex whitespace-nowrap rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">Em reparo</span></td>
                      <td className={td}><Link href={`/cadastros/equipamentos/${encodeURIComponent(item.id)}`} className="whitespace-nowrap font-semibold text-gray-800 underline-offset-4 hover:underline dark:text-gray-100">Abrir equipamento →</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!carregando && lista.length > 0 && <div className="border-t border-gray-200 px-4 py-3 text-xs text-gray-500 dark:border-gray-600 dark:text-gray-400">Exibindo {lista.length} de {equipamentos.length} equipamento(s) em reparo.</div>}
        </section>
      </div>
    </main>
  );
}
