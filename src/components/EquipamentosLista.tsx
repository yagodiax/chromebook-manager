"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export type TipoEquipamento = "chromebook" | "notebook" | "projetor" | "catraca" | "impressora";
type Equipamento = { id: string; patrimonio: string; tipo: TipoEquipamento; fabricante: string; modelo: string; numeroSerie: string; localizacao: string; status: string; observacoes: string; detalhes: Record<string, unknown> };

const NOMES: Record<TipoEquipamento, string> = { chromebook: "Chromebook", notebook: "Notebook", projetor: "Projetor", catraca: "Catraca", impressora: "Impressora" };
const PLURAIS: Record<TipoEquipamento, string> = { chromebook: "Chromebooks", notebook: "Notebooks", projetor: "Projetores", catraca: "Catracas", impressora: "Impressoras" };
const STATUS: Record<string, string> = { disponivel: "Disponível", "em-uso": "Em uso", "em-reparo": "Em reparo", inativo: "Inativo", "para-descarte": "Para descarte" };
const campo = "rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none dark:border-[#55555c] dark:bg-[#333338] dark:text-white";

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
    const textoBusca = [item.id, item.patrimonio, item.fabricante, item.modelo, item.numeroSerie, item.localizacao, String(item.detalhes?.numeroChromebook ?? ""), String(item.detalhes?.mac ?? ""), String(item.detalhes?.conexao ?? ""), String(item.detalhes?.enderecoIp ?? ""), String(item.detalhes?.paginasImpressas ?? ""), String(item.detalhes?.mac ?? ""), String(item.detalhes?.codigoModelo ?? "")].join(" ").toLocaleLowerCase("pt-BR");
    return tipoOk && (!termo || textoBusca.includes(termo)) && (statusFiltro === "todos" || item.status === statusFiltro);
  }), [equipamentos, tipoFiltro, busca, statusFiltro]);


  async function excluirEquipamento(item: Equipamento) {
    const identificacao = [item.patrimonio, item.fabricante, item.modelo].filter(Boolean).join(" — ") || item.id;
    if (!window.confirm(`Tem certeza que deseja excluir ${identificacao}? Essa ação não pode ser desfeita.`)) return;
    try {
      const resposta = await fetch(`/api/equipamentos/${encodeURIComponent(item.id)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível excluir o equipamento.");
      setEquipamentos((atuais) => atuais.filter((equipamento) => equipamento.id !== item.id));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Erro ao excluir equipamento.");
    }
  }

  const titulo = tipoFiltro ? PLURAIS[tipoFiltro] : "Todos os equipamentos";

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
          {carregando ? <p className="p-8 text-sm text-gray-500 dark:text-gray-300">Carregando equipamentos...</p> : lista.length === 0 ? <div className="p-10 text-center"><p className="font-semibold text-gray-900 dark:text-white">Nenhum equipamento encontrado</p><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Cadastre um equipamento ou ajuste os filtros.</p></div> : <div className="overflow-x-auto"><table className={`w-full text-left text-sm ${tipoFiltro === "impressora" ? "min-w-[1500px]" : tipoFiltro === "projetor" ? "min-w-[1000px]" : tipoFiltro === "notebook" ? "min-w-[1250px]" : "min-w-[850px]"}`}><thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-[#55555c] dark:bg-[#39393e] dark:text-gray-400"><tr><th className="px-5 py-4">Equipamento</th><th className="px-5 py-4">Patrimônio</th><th className="px-5 py-4">Modelo</th><th className="px-5 py-4">Departamento / localização</th>{tipoFiltro === "projetor" && <th className="px-5 py-4">Potência</th>}{tipoFiltro === "notebook" && <><th className="px-5 py-4">Código do modelo</th><th className="px-5 py-4">MAC</th><th className="px-5 py-4">Nº de série</th><th className="px-5 py-4">Observações</th></>}{tipoFiltro === "impressora" && <><th className="px-5 py-4">Conexão</th><th className="px-5 py-4">MAC</th><th className="px-5 py-4">Nº de série</th><th className="px-5 py-4 text-right">Páginas impressas</th><th className="px-5 py-4">Instalação</th></>}<th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Ações</th></tr></thead><tbody className="divide-y divide-gray-100 dark:divide-[#55555c]">{lista.map((item) => <tr key={item.id} role="link" tabIndex={0} aria-label={`Editar ${NOMES[item.tipo]} ${item.patrimonio || item.id}`} onClick={() => router.push(`/cadastros/equipamentos/${encodeURIComponent(item.id)}/editar`)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(`/cadastros/equipamentos/${encodeURIComponent(item.id)}/editar`); } }} className="cursor-pointer hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-gray-500 dark:hover:bg-[#3c3c41]"><td className="px-5 py-4"><p className="font-semibold text-gray-900 dark:text-gray-100">{NOMES[item.tipo]}</p><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.id}</p></td><td className="px-5 py-4 text-gray-700 dark:text-gray-300">{item.patrimonio || "—"}{item.tipo === "chromebook" && item.detalhes?.numeroChromebook ? <p className="mt-1 text-xs text-gray-500">Nº {String(item.detalhes.numeroChromebook)}</p> : null}</td><td className="px-5 py-4 text-gray-700 dark:text-gray-300">{[item.fabricante, item.modelo].filter(Boolean).join(" ") || "—"}</td><td className="px-5 py-4 text-gray-700 dark:text-gray-300">{item.localizacao || "—"}</td>{tipoFiltro === "projetor" && <td className="px-5 py-4 text-gray-700 dark:text-gray-300">{String(item.detalhes?.potencia ?? "—")}{item.detalhes?.potenciaFicticia === true ? <span className="ml-2 text-xs text-amber-700 dark:text-amber-300">(informação fictícia)</span> : null}</td>}{tipoFiltro === "notebook" && <><td className="px-5 py-4 text-gray-700 dark:text-gray-300">{String(item.detalhes?.codigoModelo ?? "—")}</td><td className="px-5 py-4 font-mono text-xs text-gray-700 dark:text-gray-300">{String(item.detalhes?.mac ?? "—")}</td><td className="px-5 py-4 text-gray-700 dark:text-gray-300">{item.numeroSerie || "—"}</td><td className="max-w-xs px-5 py-4 text-gray-700 dark:text-gray-300">{item.observacoes || "—"}</td></>}{tipoFiltro === "impressora" && <><td className="px-5 py-4 text-gray-700 dark:text-gray-300">{String(item.detalhes?.conexao ?? "—")}</td><td className="px-5 py-4 font-mono text-xs text-gray-700 dark:text-gray-300">{String(item.detalhes?.mac ?? "—")}</td><td className="px-5 py-4 text-gray-700 dark:text-gray-300">{item.numeroSerie || "—"}</td><td className="px-5 py-4 text-right tabular-nums text-gray-700 dark:text-gray-300">{item.detalhes?.paginasImpressas == null || item.detalhes?.paginasImpressas === "" ? "—" : Number(item.detalhes.paginasImpressas).toLocaleString("pt-BR")}</td><td className="px-5 py-4 text-gray-700 dark:text-gray-300">{typeof item.detalhes?.dataInstalacao === "string" && item.detalhes.dataInstalacao ? item.detalhes.dataInstalacao.split("-").reverse().join("/") : "—"}</td></>}<td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "em-reparo" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200" : item.status === "em-uso" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"}`}>{STATUS[item.status] || item.status}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><Link href={`/cadastros/equipamentos/${encodeURIComponent(item.id)}/editar`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-[#606066] dark:text-gray-100 dark:hover:bg-[#505057]">Editar</Link><button type="button" onClick={(e) => { e.stopPropagation(); void excluirEquipamento(item); }} disabled={carregando} className="inline-flex items-center rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40">Excluir</button></div></td></tr>)}</tbody></table></div>}
        </div>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Exibindo {lista.length} equipamento(s).</p>
      </div>
    </div>
  );
}
