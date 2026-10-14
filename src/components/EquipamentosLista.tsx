"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export type TipoEquipamento = "chromebook" | "notebook" | "projetor" | "catraca" | "impressora";
type Equipamento = { id: string; patrimonio: string; tipo: TipoEquipamento; fabricante: string; modelo: string; numeroSerie: string; localizacao: string; status: string; observacoes: string; detalhes: Record<string, unknown> };

const NOMES: Record<TipoEquipamento, string> = { chromebook: "Chromebook", notebook: "Notebook", projetor: "Projetor", catraca: "Catraca", impressora: "Impressora" };
const PLURAIS: Record<TipoEquipamento, string> = { chromebook: "Chromebooks", notebook: "Notebooks", projetor: "Projetores", catraca: "Catracas", impressora: "Impressoras" };
const STATUS: Record<string, string> = { disponivel: "Disponível", "em-uso": "Em uso", "em-reparo": "Em reparo", inativo: "Inativo", "para-descarte": "Para descarte" };
const campo = "rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none dark:border-[#55555c] dark:bg-[#303035] dark:text-white";

export default function EquipamentosLista({ tipoFiltro }: { tipoFiltro?: TipoEquipamento }) {
  const router = useRouter();
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const resposta = await fetch("/api/equipamentos", { cache: "no-store", cgrayentials: "same-origin" });
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
    const textoBusca = [item.id, item.patrimonio, item.fabricante, item.modelo, item.numeroSerie, item.localizacao, item.observacoes, String(item.detalhes?.numeroChromebook ?? ""), String(item.detalhes?.mac ?? ""), String(item.detalhes?.conexao ?? ""), String(item.detalhes?.enderecoIp ?? ""), String(item.detalhes?.paginasImpressas ?? ""), String(item.detalhes?.codigoModelo ?? ""), String(item.detalhes?.saudeBateria ?? "")].join(" ").toLocaleLowerCase("pt-BR");
    return tipoOk && (!termo || textoBusca.includes(termo)) && (statusFiltro === "todos" || item.status === statusFiltro);
  }), [equipamentos, tipoFiltro, busca, statusFiltro]);

  async function excluirEquipamento(item: Equipamento) {
    const identificacao = [item.patrimonio, item.fabricante, item.modelo].filter(Boolean).join(" — ") || item.id;
    if (!window.confirm(`Tem certeza que deseja excluir ${identificacao}? Essa ação não pode ser desfeita.`)) return;
    try {
      const resposta = await fetch(`/api/equipamentos/${encodeURIComponent(item.id)}`, { method: "DELETE", cgrayentials: "same-origin" });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível excluir o equipamento.");
      setEquipamentos((atuais) => atuais.filter((equipamento) => equipamento.id !== item.id));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Erro ao excluir equipamento.");
    }
  }

  const titulo = tipoFiltro ? PLURAIS[tipoFiltro] : "Todos os equipamentos";
  const th = "whitespace-nowrap px-3 py-3 font-semibold";
  const td = "px-3 py-3 align-middle text-gray-700 dark:text-gray-300";

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-7 xl:p-9 dark:bg-[#3a3a3f]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-700 dark:text-gray-300">Inventário</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-white">{titulo}</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Consulte, pesquise e edite os equipamentos em um só lugar.</p>
          </div>
          <Link href="/cadastros/equipamentos/novo" className="rounded-xl bg-gray-900 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900">+ Cadastrar equipamento</Link>
        </div>

        <div className="mb-4 grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_200px] dark:border-[#48484d] dark:bg-[#303035]">
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar número, MAC, modelo, série ou localização..." className={campo} />
          <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)} className={campo}>
            <option value="todos">Todos os status</option>
            {Object.entries(STATUS).map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}
          </select>
        </div>

        {erro && <div role="alert" className="mb-4 rounded-xl border border-gray-300 bg-gray-50 p-4 text-sm text-gray-800 dark:border-gray-900 dark:bg-gray-950/40 dark:text-gray-200">{erro}</div>}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-[#48484d] dark:bg-[#303035]">
          {carregando ? <p className="p-8 text-sm text-gray-500 dark:text-gray-300">Carregando equipamentos...</p> : lista.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-semibold text-gray-900 dark:text-white">Nenhum equipamento encontrado</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Cadastre um equipamento ou ajuste os filtros.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-100 text-[10px] uppercase tracking-[.13em] text-gray-900/70 dark:border-[#48484d] dark:bg-[#3b3b40] dark:text-gray-100/70">
                  <tr>
                    {tipoFiltro === "chromebook" ? (
                      <><th className={th}>Chromebook</th><th className={th}>MAC</th><th className={th}>Saúde da bateria</th><th className={th}>Localização</th></>
                    ) : (
                      <><th className={th}>Equipamento</th>{!tipoFiltro && <th className={th}>Patrimônio</th>}<th className={th}>Modelo</th><th className={th}>Localização</th>{tipoFiltro === "projetor" && <th className={th}>Potência</th>}</>
                    )}
                    <th className={th}>Status</th>
                    <th className={th + " text-right"}>Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#55555c]">
                  {lista.map((item) => (
                    <tr key={item.id} role="link" tabIndex={0} aria-label={`Editar ${NOMES[item.tipo]} ${item.patrimonio || item.id}`}
                      onClick={() => router.push(`/cadastros/equipamentos/${encodeURIComponent(item.id)}/editar`)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(`/cadastros/equipamentos/${encodeURIComponent(item.id)}/editar`); } }}
                      className="cursor-pointer hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-gray-500 dark:hover:bg-[#20363e]">
                      {tipoFiltro === "chromebook" ? (
                        <>
                          <td className={td}>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">Nº {String(item.detalhes?.numeroChromebook ?? item.patrimonio.replace("CHROME-", ""))}</p>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{item.observacoes || item.id}</p>
                          </td>
                          <td className={td + " whitespace-nowrap font-mono text-xs"}>{String(item.detalhes?.mac ?? "—")}</td>
                          <td className={td + " whitespace-nowrap"}>{item.detalhes?.saudeBateria == null || item.detalhes?.saudeBateria === "" ? "—" : `${String(item.detalhes.saudeBateria)}%`}</td>
                          <td className={td}>{item.localizacao || "—"}</td>
                        </>
                      ) : (
                        <>
                          <td className={td}>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{NOMES[item.tipo]}</p>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{item.id}</p>
                          </td>
                          {!tipoFiltro && <td className={td}>{item.patrimonio || "—"}</td>}
                          <td className={td}>{[item.fabricante, item.modelo].filter(Boolean).join(" ") || "—"}</td>
                          <td className={td}>{item.localizacao || "—"}</td>
                          {tipoFiltro === "projetor" && <td className={td + " whitespace-nowrap"}>{String(item.detalhes?.potencia ?? "—")}{item.detalhes?.potenciaFicticia === true ? <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">(fictícia)</span> : null}</td>}
                        </>
                      )}
                      <td className={td}>
                        <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "em-reparo" ? "bg-gray-100 text-gray-800 dark:bg-gray-950/50 dark:text-gray-200" : item.status === "em-uso" ? "bg-gray-100 text-gray-800 dark:bg-gray-950/50 dark:text-gray-200" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"}`}>{STATUS[item.status] || item.status}</span>
                      </td>
                      <td className={td}>
                        <div className="flex justify-end gap-1.5">
                          <Link href={`/cadastros/equipamentos/${encodeURIComponent(item.id)}/editar`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-[#606066] dark:text-gray-100 dark:hover:bg-[#505057]">Editar</Link>
                          <button type="button" onClick={(e) => { e.stopPropagation(); void excluirEquipamento(item); }} disabled={carregando} className="inline-flex items-center rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-900 dark:text-gray-300 dark:hover:bg-gray-950/40">Excluir</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Exibindo {lista.length} equipamento(s). Clique em uma linha para editar e ver os demais detalhes.</p>
      </div>
    </div>
  );
}
