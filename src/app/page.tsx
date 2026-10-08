"use client";

import { useEffect, useState } from "react";
import { getChromebooks } from "@/lib/chromebooks";
import { Chromebook } from "@/types/chromebook";

export default function Home() {
  const [chromebooks, setChromebooks] = useState<Chromebook[]>([]);

  useEffect(() => {
    setChromebooks(getChromebooks());
  }, []);

  const total = chromebooks.length;

  const disponiveis = chromebooks.filter(
    (chromebook) => chromebook.status === "disponivel"
  ).length;

  const emUso = chromebooks.filter(
    (chromebook) => chromebook.status === "em-uso"
  ).length;

  const manutencao = chromebooks.filter(
    (chromebook) => chromebook.status === "manutencao"
  ).length;

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Chromebook Manager
          </h1>

          <p className="mt-2 text-gray-600">
            Gerenciamento e manutenção de Chromebooks
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900">
              Chromebooks
            </h2>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {total}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Cadastrados
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900">
              Disponíveis
            </h2>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {disponiveis}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Equipamentos
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900">
              Em uso
            </h2>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {emUso}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Equipamentos
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900">
              Em manutenção
            </h2>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {manutencao}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Equipamentos
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-semibold text-gray-900">
            Acesso rápido
          </h2>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                window.location.href = "/chromebooks";
              }}
              className="rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"
            >
              Ver Chromebooks
            </button>

            <button
              type="button"
              onClick={() => {
                window.location.href = "/chromebooks/novo";
              }}
              className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              + Novo Chromebook
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}