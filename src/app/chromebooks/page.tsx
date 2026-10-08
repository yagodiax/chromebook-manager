"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getChromebooks } from "@/lib/chromebooks";
import { Chromebook } from "@/types/chromebook";

export default function ChromebooksPage() {
  const router = useRouter();

  const [chromebooks, setChromebooks] =
    useState<Chromebook[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] =
    useState("todos");

  useEffect(() => {
    setChromebooks(getChromebooks());
  }, []);

  function abrirChromebook(id: string) {
    router.push(
      "/chromebooks/detalhes?id=" + id
    );
  }

  function editarChromebook(id: string) {
    router.push(
      "/chromebooks/editar?id=" + id
    );
  }

  const chromebooksFiltrados =
    chromebooks.filter((chromebook) => {
      const textoBusca = busca.toLowerCase();

      const correspondeBusca =
        chromebook.id
          .toLowerCase()
          .includes(textoBusca) ||
        chromebook.numero
          .toLowerCase()
          .includes(textoBusca) ||
        chromebook.mac
          .toLowerCase()
          .includes(textoBusca) ||
        chromebook.numeroSerie
          .toLowerCase()
          .includes(textoBusca) ||
        chromebook.modelo
          .toLowerCase()
          .includes(textoBusca) ||
        chromebook.sala
          .toLowerCase()
          .includes(textoBusca);

      const correspondeStatus =
        filtroStatus === "todos" ||
        chromebook.status === filtroStatus;

      return (
        correspondeBusca &&
        correspondeStatus
      );
    });

  function nomeStatus(status: string) {
    if (status === "disponivel") {
      return "Disponível";
    }

    if (status === "em-uso") {
      return "Em uso";
    }

    if (status === "em-reparo") {
      return "Em reparo";
    }

    if (status === "retirada-de-pecas") {
      return "Retirada de peças";
    }

    return status;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8 transition-colors dark:bg-[#3a3a3f]">
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

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Chromebooks
            </h1>

            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Gerencie os equipamentos cadastrados
              no sistema.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/chromebooks/novo")
            }
            className="rounded-lg bg-black px-5 py-3 font-medium text-white transition hover:bg-gray-800 dark:bg-[#f4f4f5] dark:text-gray-900 dark:hover:bg-white"
          >
            + Novo Chromebook
          </button>
        </div>

        <div className="mb-6 rounded-xl bg-white p-5 shadow transition-colors dark:bg-[#444449]">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Buscar Chromebook
              </label>

              <input
                type="text"
                value={busca}
                onChange={(event) =>
                  setBusca(event.target.value)
                }
                placeholder="ID, número, MAC, série, modelo ou sala..."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Filtrar por status
              </label>

              <select
                value={filtroStatus}
                onChange={(event) =>
                  setFiltroStatus(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:focus:border-gray-300"
              >
                <option value="todos">
                  Todos os status
                </option>

                <option value="disponivel">
                  Disponível
                </option>

                <option value="em-uso">
                  Em uso
                </option>

                <option value="em-reparo">
                  Em reparo
                </option>

                <option value="retirada-de-pecas">
                  Retirada de peças
                </option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
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
        </div>

        <div className="rounded-xl bg-white shadow transition-colors dark:bg-[#444449]">
          {chromebooksFiltrados.length === 0 ? (
            <div className="p-8 text-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Nenhum Chromebook encontrado
              </h2>

              <p className="mt-2 text-gray-500 dark:text-gray-300">
                Tente alterar a busca ou o filtro
                de status.
              </p>
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
                      Nº de série
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Sala
                    </th>

                    <th className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {chromebooksFiltrados.map(
                    (chromebook) => (
                      <tr
                        key={chromebook.id}
                        onClick={() =>
                          abrirChromebook(
                            chromebook.id
                          )
                        }
                        className="cursor-pointer border-b border-gray-100 transition hover:bg-gray-50 last:border-0 dark:border-[#505057] dark:hover:bg-[#505057]"
                      >
                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">
                          {chromebook.id}
                        </td>

                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {chromebook.numero}
                        </td>

                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {chromebook.modelo}
                        </td>

                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {chromebook.numeroSerie}
                        </td>

                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {chromebook.sala}
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-[#55555b] dark:text-gray-100">
                            {nomeStatus(
                              chromebook.status
                            )}
                          </span>
                        </td>

                        <td
                          className="px-6 py-4"
                          onClick={(event) =>
                            event.stopPropagation()
                          }
                        >
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                editarChromebook(
                                  chromebook.id
                                )
                              }
                              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-[#66666c] dark:text-gray-100 dark:hover:bg-[#55555b]"
                            >
                              Editar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}