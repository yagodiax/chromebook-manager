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
  "retorno-de-reparo": "Reparo concluído",
};
const STATUS: Record<string, string> = { "em-uso": "Em uso", disponivel: "Disponível", "em-reparo": "Em reparo", inativo: "Inativo", "para-descarte": "Para descarte" };
const campo = "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-500 dark:border-[#55555c] dark:bg-[#333338] dark:text-white";
const servicos = new Set(["manutencao", "reposicao-de-peca", "envio-para-reparo", "retorno-de-reparo"]);

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
    const texto = [
      item.equipamento.patrimonio, item.equipamento.tipo, item.equipamento.fabricante,
      item.equipamento.modelo, item.equipamento.localizacao, item.descricao,
      item.destinoReparo, item.quemRealizou, item.observacao, item.resultado,
    ].join(" ").toLocaleLowerCase("pt-BR");
    return (filtroTipo === "todos" || item.tipo === filtroTipo) &&
      (!busca.trim() || texto.includes(busca.trim().toLocaleLowerCase("pt-BR")));
  }), [registros, busca, filtroTipo]);

  const totalServicos = registros.filter((item) => servicos.has(item.tipo)).length;
  const totalManutencoes = registros.filter((item) => item.tipo === "manutencao" || item.tipo === "reposicao-de-peca").length;
  const totalReparos = registros.filter((item) => item.tipo === "envio-para-reparo" || item.tipo === "retorno-de-reparo").length;
  const equipamentosAtendidos = new Set(registros.filter((item) => servicos.has(item.tipo)).map((item) => item.equipamentoId)).size;

  function moeda(valor: number) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  function dataFormatada(valor: string) {
    if (!valor) return "—";
    const partes = valor.slice(0, 10).split("-");
    return partes.length === 3 ? partes[2] + "/" + partes[1] + "/" + partes[0] : valor;
  }
  function corTipo(tipo: string) {
    if (tipo === "retorno-de-reparo") return "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200";
    if (tipo === "envio-para-reparo") return "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200";
    if (tipo === "manutencao" || tipo === "reposicao-de-peca") return "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200";
    return "border-gray-300 bg-gray-100 text-gray-700 dark:border-gray-600 dark:bg-[#333338] dark:text-gray-200";
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-7 xl:p-9 dark:bg-[#2b2b2b]">
      <div className="mx-auto max-w-[1500px]">
        <header className="rounded-2xl border border-gray-300 bg-white p-6 shadow-sm sm:p-8 dark:border-gray-600 dark:bg-[#383838]">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-gray-500 dark:text-gray-400">Central de serviços · Inventário</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Histórico de serviços</h1>
              <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-300">Consulte as manutenções, trocas de peças, envios para assistência e reparos concluídos em cada equipamento.</p>
            </div>
            <Link href="/cadastros" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200">+ Registrar serviço</Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-gray-300 bg-gray-100 p-4 dark:border-gray-600 dark:bg-[#303030]"><p className="text-sm text-gray-600 dark:text-gray-300">Total de serviços</p><p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{carregando ? "—" : totalServicos}</p><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Manutenções, peças e reparos</p></div>
            <div className="rounded-xl border border-gray-300 bg-gray-100 p-4 dark:border-gray-600 dark:bg-[#303030]"><p className="text-sm text-gray-600 dark:text-gray-300">Equipamentos atendidos</p><p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{carregando ? "—" : equipamentosAtendidos}</p><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Equipamentos com ao menos um serviço</p></div>
            <div className="rounded-xl border border-gray-300 bg-gray-100 p-4 dark:border-gray-600 dark:bg-[#303030]"><p className="text-sm text-gray-600 dark:text-gray-300">Manutenções e peças</p><p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{carregando ? "—" : totalManutencoes}</p><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Serviços internos e substituições</p></div>
            <div className="rounded-xl border border-gray-300 bg-gray-100 p-4 dark:border-gray-600 dark:bg-[#303030]"><p className="text-sm text-gray-600 dark:text-gray-300">Eventos de reparo</p><p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{carregando ? "—" : totalReparos}</p><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Envios e retornos registrados</p></div>
          </div>
        </header>

        <section className="mt-5 grid gap-3 rounded-2xl border border-gray-300 bg-white p-4 shadow-sm sm:grid-cols-[1fr_260px] dark:border-gray-600 dark:bg-[#383838]">
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar patrimônio, equipamento, assistência, responsável ou descrição..." className={campo} />
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className={campo}><option value="todos">Todos os registros</option>{Object.entries(TIPOS).map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}</select>
        </section>

        {erro && <div role="alert" className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{erro}</div>}
        {carregando ? <div className="mt-5 rounded-2xl border border-gray-300 bg-white p-8 text-sm text-gray-500 dark:border-gray-600 dark:bg-[#383838] dark:text-gray-300">Carregando histórico de serviços...</div> : lista.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-gray-300 bg-white p-12 text-center dark:border-gray-600 dark:bg-[#383838]"><p className="font-semibold text-gray-900 dark:text-white">Nenhum serviço encontrado</p><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Os registros de manutenção e reparo aparecerão aqui depois de serem cadastrados.</p><Link href="/cadastros" className="mt-5 inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-gray-900">Registrar primeiro serviço</Link></div>
        ) : (
          <section className="mt-5 overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm dark:border-gray-600 dark:bg-[#383838]">
            <div className="flex flex-col gap-1 border-b border-gray-200 px-5 py-4 dark:border-gray-600 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-gray-900 dark:text-white">Registros de serviço</h2><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Ordenados pelos eventos mais recentes.</p></div><p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{lista.length} registro(s)</p></div>
            <div className="divide-y divide-gray-200 dark:divide-gray-600">
              {lista.map((item) => (
                <article key={item.id} className="p-5 transition hover:bg-gray-50 dark:hover:bg-[#404040] sm:p-6">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${corTipo(item.tipo)}`}>{TIPOS[item.tipo] || item.tipo}</span><span className="text-xs font-medium text-gray-500 dark:text-gray-400">{dataFormatada(item.data)}</span>{item.categoria && <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600 dark:bg-[#333338] dark:text-gray-300">{item.categoria.replaceAll("-", " ")}</span>}</div>
                      <h3 className="mt-3 text-lg font-semibold text-gray-950 dark:text-white">{item.equipamento.patrimonio || item.equipamento.tipo} · {[item.equipamento.fabricante, item.equipamento.modelo].filter(Boolean).join(" ") || "Modelo não informado"}</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.equipamento.localizacao || "Localização não informada"} · {TIPOS[item.equipamento.tipo] || item.equipamento.tipo}</p>
                    </div>
                    {item.tipo === "retorno-de-reparo" && <p className="text-lg font-bold text-gray-900 dark:text-white">{moeda(Number(item.custo) || 0)}</p>}
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-700 dark:text-gray-200">{item.descricao}</p>
                  <div className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    {item.destinoReparo && <p className="text-gray-600 dark:text-gray-300"><strong>Assistência / destino:</strong> {item.destinoReparo}</p>}
                    {item.quemRealizou && <p className="text-gray-600 dark:text-gray-300"><strong>Responsável:</strong> {item.quemRealizou}</p>}
                    {item.resultado && <p className="text-gray-600 dark:text-gray-300 sm:col-span-2"><strong>Resultado:</strong> {item.resultado}</p>}
                    {item.statusFinal && <p className="text-gray-600 dark:text-gray-300"><strong>Status após retorno:</strong> {STATUS[item.statusFinal] || item.statusFinal}</p>}
                    {item.observacao && <p className="whitespace-pre-wrap text-gray-500 dark:text-gray-400 sm:col-span-2"><strong>Observações:</strong> {item.observacao}</p>}
                  </div>
                  {item.anexos?.length > 0 && <div className="mt-4 border-t border-gray-200 pt-3 dark:border-gray-600"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Anexos</p><div className="mt-2 flex flex-wrap gap-2">{item.anexos.map((anexo) => <a key={anexo.id} href={`/api/historico-equipamentos/anexos/${anexo.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-[#5a5a61] dark:text-gray-200 dark:hover:bg-[#333338]"><span aria-hidden="true">↗</span>{anexo.nome}<span className="text-xs text-gray-400">({(anexo.tamanho / 1024 / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB)</span></a>)}</div></div>}
                  <div className="mt-4 flex justify-end border-t border-gray-200 pt-3 dark:border-gray-600"><Link href={`/historico/editar?id=${encodeURIComponent(item.id)}`} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-[#606066] dark:text-gray-100 dark:hover:bg-[#505057]">Editar registro</Link></div>
                </article>
              ))}
            </div>
          </section>
        )}
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">Exibindo {lista.length} de {registros.length} registro(s) do histórico.</p>
      </div>
    </main>
  );
}
