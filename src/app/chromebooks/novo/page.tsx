
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveChromebook } from "@/lib/chromebooks";
import type { ChromebookStatus } from "@/types/chromebook";

export default function NovoChromebookPage() {
  const router = useRouter();

  const [numero, setNumero] = useState("");
  const [mac, setMac] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [modelo, setModelo] = useState("");
  const [sala, setSala] = useState("");
  const [status, setStatus] =
    useState<ChromebookStatus>("disponivel");
  const [observacoes, setObservacoes] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  function formatarMac(valor: string) {
    const hexadecimal = valor
      .replace(/[^a-fA-F0-9]/g, "")
      .toUpperCase()
      .slice(0, 12);

    const partes = hexadecimal.match(/.{1,2}/g);

    return partes ? partes.join(":") : "";
  }

  async function cadastrar() {
    if (salvando) return;

    setErro("");

    if (
      !numero.trim() ||
      !mac.trim() ||
      !numeroSerie.trim() ||
      !modelo.trim() ||
      !sala.trim()
    ) {
      setErro(
        "Preencha Número, MAC, Número de série, Modelo e Sala."
      );
      return;
    }

    if (!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i.test(mac)) {
      setErro(
        "O MAC precisa conter 12 caracteres hexadecimais, no formato AA:BB:CC:DD:EE:FF."
      );
      return;
    }

    setSalvando(true);

    try {
      await saveChromebook({
        numero: numero.trim(),
        mac: mac.toUpperCase(),
        numeroSerie: numeroSerie.trim(),
        modelo: modelo.trim(),
        sala: sala.trim(),
        status,
        observacoes: observacoes.trim(),
      });

      router.push("/chromebooks");
      router.refresh();
    } catch (error) {
      console.error("Erro ao cadastrar Chromebook:", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o Chromebook."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-5 transition-colors sm:p-8 dark:bg-[#3a3a3f]">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.push("/chromebooks")}
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

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void cadastrar();
          }}
          className="rounded-xl bg-white p-6 shadow transition-colors sm:p-8 dark:bg-[#444449]"
        >
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Identificação
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
              O ID permanente será gerado automaticamente pelo sistema.
            </p>
          </div>

          {erro && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
            >
              {erro}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="numero"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Número
              </label>

              <input
                id="numero"
                type="text"
                value={numero}
                onChange={(event) => setNumero(event.target.value)}
                placeholder="Ex.: 001"
                required
                maxLength={50}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="mac"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Endereço MAC
              </label>

              <input
                id="mac"
                type="text"
                value={mac}
                onChange={(event) =>
                  setMac(formatarMac(event.target.value))
                }
                placeholder="AA:BB:CC:DD:EE:FF"
                maxLength={17}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="numeroSerie"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Número de série
              </label>

              <input
                id="numeroSerie"
                type="text"
                value={numeroSerie}
                onChange={(event) =>
                  setNumeroSerie(event.target.value)
                }
                placeholder="Número de série do equipamento"
                required
                maxLength={100}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="modelo"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Modelo
              </label>

              <input
                id="modelo"
                type="text"
                value={modelo}
                onChange={(event) => setModelo(event.target.value)}
                placeholder="Ex.: Acer Chromebook 311"
                required
                maxLength={150}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="sala"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Sala de destino
              </label>

              <input
                id="sala"
                type="text"
                value={sala}
                onChange={(event) => setSala(event.target.value)}
                placeholder="Ex.: Sala 203 ou Reserva"
                required
                maxLength={100}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Situação inicial
              </label>

              <select
                id="status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ChromebookStatus)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100"
              >
                <option value="disponivel">
                  Disponível — equipamento reserva
                </option>
                <option value="em-uso">Em uso — em operação</option>
                <option value="em-reparo">
                  No reparo — enviado à assistência
                </option>
                <option value="para-descarte">
                  Para descarte — fora de circulação
                </option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label
              htmlFor="observacoes"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Observações
            </label>

            <textarea
              id="observacoes"
              rows={4}
              value={observacoes}
              onChange={(event) => setObservacoes(event.target.value)}
              placeholder="Informações adicionais sobre o equipamento..."
              maxLength={5000}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500"
            />
          </div>

          <div className="mt-8 flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <button
              type="button"
              disabled={salvando}
              onClick={() => router.push("/chromebooks")}
              className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#66666c] dark:text-gray-100 dark:hover:bg-[#55555b]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={salvando}
              className="rounded-lg bg-black px-5 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#f4f4f5] dark:text-gray-900 dark:hover:bg-white"
            >
              {salvando ? "Salvando..." : "Cadastrar Chromebook"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
