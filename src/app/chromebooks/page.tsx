"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
deleteChromebook,
getChromebooks,
} from "@/lib/chromebooks";
import { Chromebook } from "@/types/chromebook";

export default function ChromebooksPage() {
const router = useRouter();

const [chromebooks, setChromebooks] = useState<Chromebook[]>([]);
const [busca, setBusca] = useState("");
const [filtroStatus, setFiltroStatus] = useState("todos");

useEffect(() => {
setChromebooks(getChromebooks());
}, []);

function excluirChromebook(id: string) {
const confirmar = window.confirm(
"Tem certeza que deseja excluir este Chromebook?"
);

if (!confirmar) {
  return;
}

deleteChromebook(id);
setChromebooks(getChromebooks());

}

function editarChromebook(id: string) {
router.push("/chromebooks/editar?id=" + id);
}

const chromebooksFiltrados = chromebooks.filter(
(chromebook) => {
const textoBusca = busca.toLowerCase();

  const correspondeBusca =
    chromebook.patrimonio
      .toLowerCase()
      .includes(textoBusca) ||
    chromebook.modelo
      .toLowerCase()
      .includes(textoBusca) ||
    chromebook.numeroSerie
      .toLowerCase()
      .includes(textoBusca) ||
    chromebook.usuario
      .toLowerCase()
      .includes(textoBusca);

  const correspondeStatus =
    filtroStatus === "todos" ||
    chromebook.status === filtroStatus;

  return correspondeBusca && correspondeStatus;
}

);

return (
<main className="min-h-screen bg-gray-100 p-8">
<div className="mx-auto max-w-7xl">
<div className="mb-6">
<button
type="button"
onClick={() => router.push("/")}
className="text-sm font-medium text-gray-600 hover:text-black"
>
← Voltar ao Dashboard
</button>
</div>

    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Chromebooks
        </h1>

        <p className="mt-2 text-gray-600">
          Gerencie os equipamentos cadastrados no sistema.
        </p>
      </div>

      <button
        type="button"
        onClick={() => router.push("/chromebooks/novo")}
        className="rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"
      >
        + Novo Chromebook
      </button>
    </div>

    <div className="mb-6 rounded-xl bg-white p-5 shadow">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Buscar Chromebook
          </label>

          <input
            type="text"
            value={busca}
            onChange={(event) =>
              setBusca(event.target.value)
            }
            placeholder="Patrimônio, modelo, número de série ou usuário..."
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-black"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Filtrar por status
          </label>

          <select
            value={filtroStatus}
            onChange={(event) =>
              setFiltroStatus(event.target.value)
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-black"
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

            <option value="manutencao">
              Em manutenção
            </option>
          </select>
        </div>
      </div>
    </div>

    <div className="mb-4 flex items-center justify-between">
      <p className="text-sm text-gray-600">
        Exibindo{" "}
        <span className="font-semibold text-gray-900">
          {chromebooksFiltrados.length}
        </span>{" "}
        de{" "}
        <span className="font-semibold text-gray-900">
          {chromebooks.length}
        </span>{" "}
        equipamentos
      </p>
    </div>

    <div className="rounded-xl bg-white shadow">
      {chromebooksFiltrados.length === 0 ? (
        <div className="p-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Nenhum Chromebook encontrado
          </h2>

          <p className="mt-2 text-gray-500">
            Tente alterar a busca ou o filtro de status.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                  Patrimônio
                </th>

                <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                  Modelo
                </th>

                <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                  Nº de série
                </th>

                <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                  Status
                </th>

                <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                  Usuário
                </th>

                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {chromebooksFiltrados.map((chromebook) => (
                <tr
                  key={chromebook.id}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {chromebook.patrimonio}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {chromebook.modelo}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {chromebook.numeroSerie}
                  </td>

                  <td className="px-6 py-4">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                      {chromebook.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {chromebook.usuario || "-"}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          editarChromebook(chromebook.id)
                        }
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          excluirChromebook(chromebook.id)
                        }
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                      >
                        Excluir
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