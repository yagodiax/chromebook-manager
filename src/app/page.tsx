"use client";

import { useEffect, useState } from "react";
import { getChromebooks } from "@/lib/chromebooks";
import { Chromebook } from "@/types/chromebook";

export default function Home() {
  const [chromebooks, setChromebooks] =
    useState<Chromebook[]>([]);

  useEffect(() => {
    setChromebooks(getChromebooks());
  }, []);

  const total = chromebooks.length;

  const disponiveis = chromebooks.filter(
    (chromebook) =>
      chromebook.status === "disponivel"
  ).length;

  const emUso = chromebooks.filter(
    (chromebook) =>
      chromebook.status === "em-uso"
  ).length;

  const emReparo = chromebooks.filter(
    (chromebook) =>
      chromebook.status === "em-reparo"
  ).length;

  const retiradaDePecas =
    chromebooks.filter(
      (chromebook) =>
        chromebook.status ===
        "retirada-de-pecas"
    ).length;

  return (
    <main className="min-h-screen bg-gray-100 p-8 transition-colors dark:bg-[#3a3a3f]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>

          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Visão geral dos Chromebooks e equipamentos
            do sistema.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow transition-colors dark:bg-[#444449]">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total de Chromebooks
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {total}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow transition-colors dark:bg-[#444449]">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Disponíveis
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {disponiveis}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow transition-colors dark:bg-[#444449]">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Em uso
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {emUso}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow transition-colors dark:bg-[#444449]">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Em reparo
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {emReparo}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow transition-colors dark:bg-[#444449]">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Retirada de peças
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {retiradaDePecas}
            </p>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Equipamentos destinados à retirada
              de componentes
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow transition-colors dark:bg-[#444449]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Acesso rápido
            </h2>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    "/chromebooks";
                }}
                className="rounded-lg bg-black px-5 py-3 font-medium text-white transition hover:bg-gray-800 dark:bg-[#f4f4f5] dark:text-gray-900 dark:hover:bg-white"
              >
                Ver Chromebooks
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    "/chromebooks/novo";
                }}
                className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50 dark:border-[#66666c] dark:text-gray-100 dark:hover:bg-[#55555b]"
              >
                + Novo Chromebook
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}