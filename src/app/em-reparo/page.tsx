"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Equipamento = {
  id: string; patrimonio: string; tipo: string; fabricante: string; modelo: string;
  numeroSerie: string; localizacao: string; status: string; observacoes: string;
  detalhes: Record<string, unknown>;
};
type RegistroReparo = {
  id: string; equipamentoId: string; tipo: string; data: string; descricao: string;
  destinoReparo: string; quemRealizou: string; custo: number; observacao: string;
};
type ItemReparo = { equipamento: Equipamento; envio: RegistroReparo };

const TIPOS: Record<string, string> = {
  chromebook: "Chromebook", notebook: "Notebook", projetor: "Projetor",
  catraca: "Catraca", impressora: "Impressora",
};
const campo = "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-500 dark:border-[#55555c] dark:bg-[#333338] dark:text-white";
const th = "whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[.13em] text-gray-600 dark:text-gray-300";
const td = "px-4 py-4 align-middle text-sm text-gray-700 dark:text-gray-300";

export default function EmReparoPage() {
  const [itens, setItens] = useState<ItemReparo[]>([]);
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const [resEquipamentos, resHistorico] = await Promise.all([
          fetch("/api/equipamentos", { cache: "no-store", credentials: "same-origin" }),
          fetch("/api/historico-equipamentos", { cache: "no-store", credentials: "same-origin" }),
        ]);
        const [equipamentos, historico] = await Promise.all([
          resEquipamentos.json().catch(() => []),
          resHistorico.json().catch(() => []),
        ]);
        if (!resEquipamentos.ok) throw new Error(equipamentos.erro || "Não foi possível carregar os equipamentos.");
        if (!resHistorico.ok) throw new Error(historico.erro || "Não foi possível consultar os envios para reparo.");

        const listaEquipamentos: Equipamento[] = Array.isArray(equipamentos) ? equipamentos : [];
        const registros: RegistroReparo[] = Array.isArray(historico) ? historico : [];
        const eventosReparo = registros
          .filter((r) => r.tipo === "envio-para-reparo" || r.tipo === "retorno-de-reparo")
          .sort((a, b) => b.data.localeCompare(a.data));
        const ultimoEvento = new Map<string, RegistroReparo>();
        for (const evento of eventosReparo) {
          if (!ultimoEvento.has(evento.equipamentoId)) ultimoEvento.set(evento.equipamentoId, evento);
        }

        const resultado = listaEquipamentos
          .filter((equipamento) => equipamento.status === "em-reparo")
          .flatMap((equipamento) => {
            const envio = ultimoEvento.get(equipamento.id);
            return envio?.tipo === "envio-para-reparo" ? [{ equipamento, envio }] : [];
          });
        if (ativo) setItens(resultado);
      } catch (e) {
        if (ativo) setErro(e instanceof Error ? e.message : "Erro ao carregar os equipamentos enviados para reparo.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    void carregar();
    return () => { ativo = false; };
  }, []);

  const lista = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return itens
      .filter(({ equipamento }) => tipoFiltro === "todos" || equipamento.tipo === tipoFiltro)
      .filter(({ equipamento, envio }) => {
        const texto = [
          equipamento.id, equipamento.patrimonio, equipamento.fabricante, equipamento.modelo,
          equipamento.numeroSerie, equipamento.localizacao, equipamento.observacoes,
          String(equipamento.detalhes?.numeroChromebook ?? ""), String(equipamento.detalhes?.mac ?? ""),
          envio.destinoReparo, envio.descricao, envio.quemRealizou, envio.observacao,
        ].join(" ").toLocaleLowerCase("pt-BR");
        return !termo || texto.includes(termo);
      })
      .sort((a, b) => {
        const na = Number(a.equipamento.detalhes?.numeroChromebook ?? a.equipamento.patrimonio);
        const nb = Number(b.equipamento.detalhes?.numeroChromebook ?? b.equipamento.patrimonio);
        if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
        return (a.equipamento.patrimonio || a.equipamento.id).localeCompare(b.equipamento.patrimonio || b.equipamento.id, "pt-BR");
      });
  }, [itens, busca, tipoFiltro]);

  function dataFormatada(valor: string) {
    if (!valor) return "—";
    const partes = valor.slice(0, 10).split("-");
    return partes.length === 3 ? partes[2] + "/" + partes[1] + "/" + partes[0] : valor;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-7 xl:p-9 dark:bg-[#2b2b2b]">
      <div className="mx-auto max-w-[1500px]">
        <header className="rounded-2xl border border-gray-300 bg-white p-6 shadow-sm sm:p-8 dark:border-gray-600 dark:bg-[#383838]">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-gray-500 dark:text-gray-400">Inventário · Assistência técnica</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Equipamentos enviados para reparo</h1>
              <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-300">Esta lista considera somente equipamentos com envio registrado no histórico e sem retorno de reparo posterior.</p>
            </div>
            <Link href="/historico" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 dark:border-gray-500 dark:text-gray-100 dark:hover:bg-gray-700">Consultar histórico →</Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-300 bg-gray-100 p-4 dark:border-gray-600 dark:bg-[#303030]"><p className="text-sm text-gray-600 dark:text-gray-300">Aguardando retorno</p><p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{carregando ? "—" : itens.length}</p></div>
            <div className="rounded-xl border border-gray-300 bg-gray-100 p-4 dark:border-gray-600 dark:bg-[#303030]"><p className="text-sm text-gray-600 dark:text-gray-300">Assistências distintas</p><p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{carregando ? "—" : new Set(itens.map((item) => item.envio.destinoReparo).filter(Boolean)).size}</p></div>
            <div className="rounded-xl border border-gray-300 bg-gray-100 p-4 dark:border-gray-600 dark:bg-[#303030]"><p className="text-sm text-gray-600 dark:text-gray-300">Envios registrados</p><p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{carregando ? "—" : itens.length}</p></div>
          </div>
        </header>

        <section className="mt-5 grid gap-3 rounded-2xl border border-gray-300 bg-white p-4 shadow-sm sm:grid-cols-[1fr_220px] dark:border-gray-600 dark:bg-[#383838]">
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar equipamento, modelo, MAC, assistência ou descrição..." className={campo} />
          <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} className={campo}><option value="todos">Todos os tipos</option>{Object.entries(TIPOS).map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}</select>
        </section>

        {erro && <div role="alert" className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{erro}</div>}
        <section className="mt-5 overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm dark:border-gray-600 dark:bg-[#383838]">
          {carregando ? <p className="p-8 text-sm text-gray-500 dark:text-gray-300">Carregando envios para reparo...</p> : lista.length === 0 ? (
            <div className="p-12 text-center"><p className="font-semibold text-gray-900 dark:text-white">Nenhum envio pendente encontrado</p><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Um equipamento aparece aqui quando existe um registro de envio para reparo e ainda não há um retorno registrado.</p></div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-left">
              <thead className="border-b border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-[#303030]"><tr><th className={th}>Equipamento</th><th className={th}>Tipo</th><th className={th}>Modelo</th><th className={th}>Enviado em</th><th className={th}>Assistência / destino</th><th className={th}>Descrição do serviço</th><th className={th}>Editar</th></tr></thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {lista.map(({ equipamento, envio }) => <tr key={equipamento.id} className="transition hover:bg-gray-50 dark:hover:bg-[#424242]">
                  <td className={td}><Link href={`/historico/editar?id=${encodeURIComponent(envio.id)}`} className="group block min-w-40"><p className="font-semibold text-gray-900 group-hover:underline dark:text-white">{equipamento.detalhes?.numeroChromebook != null ? `Chromebook nº ${String(equipamento.detalhes.numeroChromebook)}` : equipamento.patrimonio || equipamento.id}</p><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{equipamento.patrimonio || equipamento.id}</p></Link></td>
                  <td className={td}>{TIPOS[equipamento.tipo] || equipamento.tipo}</td><td className={td}>{[equipamento.fabricante, equipamento.modelo].filter(Boolean).join(" ") || "—"}</td><td className={td}>{dataFormatada(envio.data)}</td><td className={td}>{envio.destinoReparo || "—"}</td><td className={td}><span className="line-clamp-2 min-w-48">{envio.descricao || "—"}</span></td>
                  <td className={td}><Link href={`/historico/editar?id=${encodeURIComponent(envio.id)}`} className="whitespace-nowrap rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-100 dark:border-gray-500 dark:text-gray-100 dark:hover:bg-gray-700">Editar envio ↗</Link></td>
                </tr>)}
              </tbody>
            </table></div>
          )}
          {!carregando && lista.length > 0 && <div className="border-t border-gray-200 px-4 py-3 text-xs text-gray-500 dark:border-gray-600 dark:text-gray-400">Exibindo {lista.length} equipamento(s) com envio pendente.</div>}
        </section>
      </div>
    </main>
  );
}
