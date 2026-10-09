
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
  "rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

export default function ChromebooksPage() {
  const router = useRouter();

  const [chromebooks, setChromebooks] =
    useState<Chromebook[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] =
    useState<"todos" | ChromebookStatus>("todos");
  const [notificacao, setNotificacao] = useState<{
    tipo: "sucesso" | "erro";
    mensagem: string;
  } | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(
    null
  );

  useEffect(() => {
    setChromebooks(getChromebooks());
  }, []);

  function abrirChromebook(id: string) {
    router.push(
      "/chromebooks/detalhes?id=" +
        encodeURIComponent(id)
    );
  }

  function editarChromebook(id: string) {
    router.push(
      "/chromebooks/editar?id=" +
        encodeURIComponent(id)
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
        "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
      disponivel:
        "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
      "em-reparo":
        "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
      "para-descarte":
        "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    };

    return classes[status];
  }

  const textoBusca = busca.trim().toLowerCase();

  const chromebooksFiltrados = chromebooks.filter(
    (chromebook) => {
      const correspondeBusca = [
        chromebook.id,
        chromebook.numero,
        chromebook.mac,
        chromebook.numeroSerie,
        chromebook.modelo,
        chromebook.sala,
      ].some((valor) =>
        String(valor ?? "")
          .toLowerCase()
          .includes(textoBusca)
      );

      const correspondeStatus =
        filtroStatus === "todos" ||
        chromebook.status === filtroStatus;

      return correspondeBusca && correspondeStatus;
    }
  );

  return (
    <main className="min-h-screen bg-gray-100 p-5 transition-colors sm:p-8 dark:bg-[#3a3a3f]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-sm font-medium text-gray-600 transition hover:text-black dark:text-gray-300 dark:hover:text-white"
          >
            ← Voltar ao Dashboard
          </button>
        </div>

        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Chromebooks
            </h1>

            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Gerencie os equipamentos cadastrados no sistema.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/chromebooks/novo")}
            className="rounded-lg bg-black px-5 py-3 font-medium text-white transition hover:bg-gray-800 dark:bg-[#f4f4f5] dark:text-gray-900 dark:hover:bg-white"
          >
            + Novo Chromebook
          </button>
        </div>

        {notificacao && (
          <div
            role={notificacao.tipo === "erro" ? "alert" : "status"}
            aria-live="polite"
            className={`mb-6 flex items-center gap-3 rounded-lg border p-4 shadow-sm ${
              notificacao.tipo === "sucesso"
                ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
            }`}
          >
            <span className="text-xl font-bold">
              {notificacao.tipo === "sucesso" ? "✓" : "!"}
            </span>
            <p className="text-sm font-medium">
              {notificacao.mensagem}
            </p>
            <button
              type="button"
              onClick={() => setNotificacao(null)}
              aria-label="Fechar notificação"
              className="ml-auto rounded px-2 py-1 text-lg hover:bg-black/5 dark:hover:bg-white/10"
            >
              ×
            </button>
          </div>
        )}

        <div className="mb-6 rounded-xl bg-white p-5 shadow transition-colors dark:bg-[#444449]">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label
                htmlFor="busca-chromebook"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Buscar Chromebook
              </label>

              <input
                id="busca-chromebook"
                type="text"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="ID, número, MAC, série, modelo ou sala..."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="filtro-status"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Filtrar por situação
              </label>

              <select
                id="filtro-status"
                value={filtroStatus}
                onChange={(event) =>
                  setFiltroStatus(
                    event.target.value as
                      | "todos"
                      | ChromebookStatus
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100"
              >
                <option value="todos">Todas as situações</option>
                <option value="em-uso">Em uso</option>
                <option value="disponivel">Disponível</option>
                <option value="em-reparo">No reparo</option>
                <option value="para-descarte">Para descarte</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Exibindo{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {chromebooksFiltrados.length}
            </span>{" "}
            de{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {chromebooks.length}
            </span>{" "}
            equipamentos
          </p>

          {(busca !== "" || filtroStatus !== "todos") && (
            <button
              type="button"
              onClick={() => {
                setBusca("");
                setFiltroStatus("todos");
              }}
              className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-300"
            >
              Limpar filtros
            </button>
          )}
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow transition-colors dark:bg-[#444449]">
          {chromebooksFiltrados.length === 0 ? (
            <div className="p-8 text-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Nenhum Chromebook encontrado
              </h2>

              <p className="mt-2 text-gray-500 dark:text-gray-300">
                Tente alterar a busca ou os filtros.
              </p>

              {chromebooks.length === 0 && (
                <button
                  type="button"
                  onClick={() => router.push("/chromebooks/novo")}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
                >
                  Cadastrar primeiro Chromebook
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left dark:border-[#5a5a60]">
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      ID
                    </th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Número
                    </th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Modelo
                    </th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Sala
                    </th>
                    <th className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Situação
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {chromebooksFiltrados.map((chromebook) => (
                    <tr
                      key={chromebook.id}
                      onClick={() => abrirChromebook(chromebook.id)}
                      className="cursor-pointer border-b border-gray-100 transition last:border-0 hover:bg-gray-50 dark:border-[#505057] dark:hover:bg-[#505057]"
                    >
                      <td className="whitespace-nowrap px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">
                        {chromebook.id}
                      </td>

                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {chromebook.numero || "—"}
                      </td>

                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {chromebook.modelo || "—"}
                      </td>

                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {chromebook.sala || "—"}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium ${classeStatus(chromebook.status)}`}
                        >
                          {nomeStatus(chromebook.status)}
                        </span>
                      </td>

                      <td
                        className="px-6 py-4"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              editarChromebook(chromebook.id)
                            }
                            disabled={excluindoId !== null}
                            className={`${botaoAcao} border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-[#66666c] dark:text-gray-100 dark:hover:bg-[#55555b]`}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              excluirChromebook(chromebook)
                            }
                            disabled={excluindoId !== null}
                            className={`${botaoAcao} border border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950`}
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
        </div>
      </div>
    </main>
  );
}