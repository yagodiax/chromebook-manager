"use client";

import { useState } from "react";
import { saveChromebook } from "@/lib/chromebooks";
import { ChromebookStatus } from "@/types/chromebook";

export default function NovoChromebookPage() {
  const [numero, setNumero] = useState("");
  const [mac, setMac] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [modelo, setModelo] = useState("");
  const [sala, setSala] = useState("");
  const [status, setStatus] =
    useState<ChromebookStatus>("disponivel");
  const [observacoes, setObservacoes] = useState("");

  function formatarMac(valor: string) {
    const hexadecimal = valor
      .replace(/[^a-fA-F0-9]/g, "")
      .toUpperCase()
      .slice(0, 12);

    const partes = hexadecimal.match(/.{1,2}/g);

    return partes ? partes.join(":") : "";
  }

  function cadastrar() {
    if (
      !numero ||
      !mac ||
      !numeroSerie ||
      !modelo ||
      !sala
    ) {
      alert(
        "Preencha Número, MAC, Número de série, Modelo e Sala."
      );
      return;
    }

    try {
      saveChromebook({
        numero,
        mac,
        numeroSerie,
        modelo,
        sala,
        status,
        observacoes,
      });

      window.location.href = "/chromebooks";
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert(
          "Não foi possível cadastrar o Chromebook."
        );
      }
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8 transition-colors dark:bg-[#3a3a3f]">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => {
              window.location.href = "/chromebooks";
            }}
            className="mb-4 text-sm font-medium text-gray-600 transition hover:text-black dark:text-gray-300 dark:hover:text-white"
          >
            ← Voltar para Chromebooks
          </button>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Novo Chromebook
          </h1>

          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Cadastre um novo equipamento no sistema.
          </p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow transition-colors dark:bg-[#444449]">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Identificação
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
              O ID permanente será gerado
              automaticamente pelo sistema.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Número
              </label>

              <input
                type="text"
                value={numero}
                onChange={(event) =>
                  setNumero(event.target.value)
                }
                placeholder="Ex: 001"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                MAC
              </label>

              <input
                type="text"
                value={mac}
                onChange={(event) =>
                  setMac(
                    formatarMac(
                      event.target.value
                    )
                  )
                }
                placeholder="Ex: AA:BB:CC:DD:EE:FF"
                maxLength={17}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Número de série
              </label>

              <input
                type="text"
                value={numeroSerie}
                onChange={(event) =>
                  setNumeroSerie(event.target.value)
                }
                placeholder="Número de série"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Modelo
              </label>

              <input
                type="text"
                value={modelo}
                onChange={(event) =>
                  setModelo(event.target.value)
                }
                placeholder="Ex: Acer Chromebook 311"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Sala
              </label>

              <input
                type="text"
                value={sala}
                onChange={(event) =>
                  setSala(event.target.value)
                }
                placeholder="Ex: Sala 203"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as ChromebookStatus
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:focus:border-gray-300"
              >
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

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Observações
            </label>

            <textarea
              rows={4}
              value={observacoes}
              onChange={(event) =>
                setObservacoes(event.target.value)
              }
              placeholder="Observações sobre o equipamento..."
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300"
            />
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                window.location.href = "/chromebooks";
              }}
              className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50 dark:border-[#66666c] dark:text-gray-100 dark:hover:bg-[#55555b]"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={cadastrar}
              className="rounded-lg bg-black px-5 py-3 font-medium text-white transition hover:bg-gray-800 dark:bg-[#f4f4f5] dark:text-gray-900 dark:hover:bg-white"
            >
              Cadastrar Chromebook
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}