"use client";

import { useEffect, useState } from "react";
import { getChromebooks } from "@/lib/chromebooks";
import { Chromebook } from "@/types/chromebook";

export default function ChromebooksPage() {
  const [chromebooks, setChromebooks] = useState<Chromebook[]>(
    []
  );

  useEffect(() => {
    setChromebooks(getChromebooks());
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Chromebooks
            </h1>

            <p className="mt-2 text-gray-600">
              Gerencie os equipamentos cadastrados.
            </p>
          </div>

          <a
            href="/chromebooks/novo"
            className="rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"
          >
            + Novo Chromebook
          </a>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl bg-white shadow">
          <table className="w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                  Patrimônio
                </th>

                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                  Modelo
                </th>

                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                  Número de série
                </th>

                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                  Status
                </th>

                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                  Usuário
                </th>
              </tr>
            </thead>

            <tbody>
              {chromebooks.length === 0 ? (
                <tr className="border-t border-gray-200">
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    Nenhum Chromebook cadastrado.
                  </td>
                </tr>
              ) : (
                chromebooks.map((chromebook) => (
                  <tr
                    key={chromebook.id}
                    className="border-t border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-gray-900">
                      {chromebook.patrimonio}
                    </td>

                    <td className="px-6 py-4 text-gray-900">
                      {chromebook.modelo}
                    </td>

                    <td className="px-6 py-4 text-gray-900">
                      {chromebook.numeroSerie}
                    </td>

                    <td className="px-6 py-4 text-gray-900">
                      {chromebook.status === "disponivel"
                        ? "Disponível"
                        : chromebook.status === "em-uso"
                          ? "Em uso"
                          : "Em manutenção"}
                    </td>

                    <td className="px-6 py-4 text-gray-900">
                      {chromebook.usuario || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}