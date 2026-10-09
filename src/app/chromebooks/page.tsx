
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getChromebooks,
  deleteChromebook,
} from "@/lib/chromebooks";
import type {
  Chromebook,
  ChromebookStatus,
} from "@/types/chromebook";

const botaoAcao =
  "inline-flex items-center justify-center rounded-xl px-3.5 py-2 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50";

export default function ChromebooksPage() {
  const router = useRouter();

  const [chromebooks, setChromebooks] = useState<Chromebook[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<
    "todos" | ChromebookStatus
  >("todos");
  const [notificacao, setNotificacao] = useState<{
    tipo: "sucesso" | "erro";
    mensagem: string;
  } | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  useEffect(() => {
    setChromebooks(getChromebooks());
  }, []);

  function abrirChromebook(id: string) {
    router.push(
      "/chromebooks/detalhes?id=" + encodeURIComponent(id)
    );
  }

  function editarChromebook(id: string) {
    router.push(
      "/chromebooks/editar?id=" + encodeURIComponent(id)
    );
  }

  function excluirChromebook(chromebook: Chromebook) {
    if (excluindoId) return;

    const confirmado = window.confirm(
      `Tem certeza que deseja excluir o Chromebook ${chromebook.numero || chromebook.id}?\n\nEssa ação não poderá ser desfeita.`
    );

    if (!confirmado) return;

    setExcluindoId(chromebook.id);
    setNotificacao(null);

    try {
      deleteChromebook(chromebook.id);
      setChromebooks(getChromebooks());

      setNotificacao({
        tipo: "sucesso",
        mensagem: `Chromebook ${chromebook.numero || chromebook.id} excluído com sucesso.`,
      });
    } catch (error) {
      setNotificacao({
        tipo: "erro",
        mensagem:
          error instanceof Error
            ? error.message
            : "Não foi possível excluir o Chromebook.",
      });
    } finally {
      setExcluindoId(null);
    }
  }

  function nomeStatus(status: ChromebookStatus): string {
    const nomes: Record<ChromebookStatus, string> = {
      "em-uso": "Em uso",
      disponivel: "Disponível",
      "em-reparo": "No reparo",
      "para-descarte": "Para descarte",
    };

    return nomes[status];
  }

  function classeStatus(status: ChromebookStatus): string {
    const classes: Record<ChromebookStatus, string> = {
      "em-uso":
        "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-800",
      disponivel:
        "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800",
      "em-reparo":
        "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-800",
      "para-descarte":
        "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-800",
    };

    return classes[status];
  }

  const textoBusca = busca.trim().toLowerCase();

  const chromebooksFiltrados = chromebooks.filter((chromebook) => {
    const correspondeBusca = [
      chromebook.id,
      chromebook.numero,
      chromebook.mac,
      chromebook.numeroSerie,
      chromebook.modelo,
      chromebook.sala,
    ].some((valor) =>
      String(valor ?? "").toLowerCase().includes(textoBusca)
    );

    const correspondeStatus =
      filtroStatus === "todos" ||
      chromebook.status === filtroStatus;

    return correspondeBusca && correspondeStatus;
  });

  const totalEmUso = chromebooks.filter(
    (item) => item.status === "em-uso"
  ).length;

  const totalDisponiveis = chromebooks.filter(
    (item) => item.status === "disponivel"
  ).length;

  const totalEmReparo = chromebooks.filter(
    (item) => item.status === "em-reparo"
  ).length;

  const totalDescarte = chromebooks.filter(
    (item) => item.status === "para-descarte"
  ).length;

  const temFiltros = busca.trim() !== "" || filtroStatus !== "todos";

  function limparFiltros() {
    setBusca("");
    setFiltroStatus("todos");
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 transition-colors duration-200 sm:p-6 lg:p-8 dark:bg-[#303035]">
      <div className="mx-auto max-w-[1500px]">
        {/* Navegação */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="group inline-flex items-center gap-2 rounded-lg text-sm font-medium text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <span className="transition-transform group-hover:-translate-x-1">
              ←
            </span>
            Voltar ao Dashboard
          </button>
        </div>

        {/* Cabeçalho */}
        <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                Patrimônio de TI
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Chromebooks
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base dark:text-slate-400">
              Gerencie os equipamentos, acompanhe as situações e
              mantenha seu inventário organizado.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/chromebooks/novo")}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-[#303035]"
          >
            <span className="text-xl leading-none">+</span>
            Novo Chromebook
          </button>
        </header>

        {/* Notificação */}
        {notificacao && (
          <div
            role={notificacao.tipo === "erro" ? "alert" : "status"}
            aria-live="polite"
            className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 shadow-sm ${
              notificacao.tipo === "sucesso"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            }`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/80 text-sm font-bold dark:bg-black/20">
              {notificacao.tipo === "sucesso" ? "✓" : "!"}
            </span>

            <p className="flex-1 pt-1 text-sm font-medium">
              {notificacao.mensagem}
            </p>

            <button
              type="button"
              onClick={() => setNotificacao(null)}
              aria-label="Fechar notificação"
              className="rounded-lg px-2 py-1 text-lg leading-none opacity-70 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
            >
              ×
            </button>
          </div>
        )}

        {/* Indicadores */}
        <section
          aria-label="Resumo dos Chromebooks"
          className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-[#505057] dark:bg-[#414147]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Total de equipamentos
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {chromebooks.length}
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Cadastrados no sistema
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="13" rx="2" />
                  <path d="M8 21h8M12 17v4M2 21h20" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-[#505057] dark:bg-[#414147]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Em uso
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-violet-700 dark:text-violet-300">
                  {totalEmUso}
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Equipamentos em utilização
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-[#505057] dark:bg-[#414147]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Disponíveis
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
                  {totalDisponiveis}
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Prontos para utilização
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="m8 12 2.5 2.5L16 9" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-[#505057] dark:bg-[#414147]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Precisam de atenção
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-amber-700 dark:text-amber-300">
                  {totalEmReparo + totalDescarte}
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {totalEmReparo} em reparo · {totalDescarte} para descarte
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path d="M12 3 2.8 20h18.4L12 3Z" />
                  <path d="M12 9v5m0 3h.01" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Busca e filtros */}
        <section className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 dark:border-[#505057] dark:bg-[#414147]">
          <div className="mb-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Inventário de equipamentos
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Pesquise, filtre e acesse os dados de cada Chromebook.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div>
              <label
                htmlFor="busca-chromebook"
                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                Buscar equipamento
              </label>

              <div className="relative">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                >
                  <circle cx="10.8" cy="10.8" r="6.8" />
                  <path d="m16 16 4 4" />
                </svg>

                <input
                  id="busca-chromebook"
                  type="search"
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="ID, número, MAC, série, modelo ou sala..."
                  className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-[#606066] dark:bg-[#333338] dark:text-white dark:focus:border-blue-500 dark:focus:bg-[#303034]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="filtro-status"
                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                Situação do equipamento
              </label>

              <select
                id="filtro-status"
                value={filtroStatus}
                onChange={(event) =>
                  setFiltroStatus(
                    event.target.value as "todos" | ChromebookStatus
                  )
                }
                className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-[#606066] dark:bg-[#333338] dark:text-white dark:focus:bg-[#303034]"
              >
                <option value="todos">Todas as situações</option>
                <option value="em-uso">Em uso</option>
                <option value="disponivel">Disponível</option>
                <option value="em-reparo">No reparo</option>
                <option value="para-descarte">Para descarte</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-col justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center dark:border-[#55555b]">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Exibindo{" "}
              <span className="font-bold text-slate-900 dark:text-white">
                {chromebooksFiltrados.length}
              </span>{" "}
              de{" "}
              <span className="font-bold text-slate-900 dark:text-white">
                {chromebooks.length}
              </span>{" "}
              equipamentos
            </p>

            {temFiltros && (
              <button
                type="button"
                onClick={limparFiltros}
                className="self-start rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 sm:self-auto dark:text-blue-300 dark:hover:bg-blue-950/40"
              >
                Limpar filtros ×
              </button>
            )}
          </div>
        </section>

        {/* Tabela */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-[#505057] dark:bg-[#414147]">
          <div className="flex flex-col justify-between gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6 dark:border-[#55555b]">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">
                Equipamentos cadastrados
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Clique em uma linha para visualizar os detalhes.
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-[#333338] dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {chromebooksFiltrados.length} resultado(s)
            </span>
          </div>

          {chromebooksFiltrados.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-[#333338] dark:text-slate-500">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-8 w-8"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="13" rx="2" />
                  <path d="M8 21h8M12 17v4M2 21h20" />
                  <path d="m9 9 6 4m0-4-6 4" />
                </svg>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {chromebooks.length === 0
                  ? "Nenhum equipamento cadastrado"
                  : "Nenhum Chromebook encontrado"}
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                {chromebooks.length === 0
                  ? "Comece cadastrando seu primeiro Chromebook para montar o inventário."
                  : "Não encontramos equipamentos com os filtros selecionados. Tente mudar a busca ou a situação."}
              </p>

              {chromebooks.length === 0 ? (
                <button
                  type="button"
                  onClick={() => router.push("/chromebooks/novo")}
                  className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  + Cadastrar primeiro Chromebook
                </button>
              ) : (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="mt-5 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-[#606066] dark:text-slate-200 dark:hover:bg-[#505057]"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-[#39393f]">
                    <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-6 dark:text-slate-400">
                      ID
                    </th>
                    <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-6 dark:text-slate-400">
                      Número
                    </th>
                    <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-6 dark:text-slate-400">
                      Modelo
                    </th>
                    <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-6 dark:text-slate-400">
                      Sala
                    </th>
                    <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-6 dark:text-slate-400">
                      Situação
                    </th>
                    <th className="whitespace-nowrap px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-6 dark:text-slate-400">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-[#55555b]">
                  {chromebooksFiltrados.map((chromebook) => (
                    <tr
                      key={chromebook.id}
                      onClick={() => abrirChromebook(chromebook.id)}
                      onKeyDown={(event) => {
                        if (
                          event.target === event.currentTarget &&
                          (event.key === "Enter" || event.key === " ")
                        ) {
                          event.preventDefault();
                          abrirChromebook(chromebook.id);
                        }
                      }}
                      tabIndex={0}
                      aria-label={`Ver detalhes do Chromebook ${chromebook.numero || chromebook.id}`}
                      className="cursor-pointer transition-colors hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:hover:bg-[#494950]"
                    >
                      <td className="whitespace-nowrap px-5 py-4 sm:px-6">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {chromebook.id}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 sm:px-6">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {chromebook.numero || "—"}
                        </span>
                      </td>

                      <td className="min-w-40 px-5 py-4 sm:px-6">
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {chromebook.modelo || "—"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 sm:px-6">
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {chromebook.sala || "—"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 sm:px-6">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${classeStatus(chromebook.status)}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {nomeStatus(chromebook.status)}
                        </span>
                      </td>

                      <td
                        className="whitespace-nowrap px-5 py-4 sm:px-6"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              editarChromebook(chromebook.id)
                            }
                            disabled={excluindoId !== null}
                            className={`${botaoAcao} border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-[#626269] dark:bg-[#414147] dark:text-slate-200 dark:hover:border-blue-800 dark:hover:bg-blue-950/40 dark:hover:text-blue-300`}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              excluirChromebook(chromebook)
                            }
                            disabled={excluindoId !== null}
                            className={`${botaoAcao} border border-red-200 bg-white text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-[#414147] dark:text-red-300 dark:hover:bg-red-950/50`}
                          >
                            {excluindoId === chromebook.id
                              ? "Excluindo..."
                              : "Excluir"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {chromebooksFiltrados.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 sm:px-6 dark:border-[#55555b] dark:bg-[#39393f]">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Os indicadores consideram todos os equipamentos cadastrados,
                independentemente dos filtros aplicados.
              </p>
            </div>
          )}
        </section>

        <footer className="py-6 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Chromebook Manager · Gerenciamento de equipamentos de TI
          </p>
        </footer>
      </div>
    </main>
  );
}