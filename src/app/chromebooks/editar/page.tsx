"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getChromebooks,
  updateChromebook,
} from "@/lib/chromebooks";
import { ChromebookStatus } from "@/types/chromebook";

export default function EditarChromebookPage() {
  const router = useRouter();

  const [id, setId] = useState("");
  const [numero, setNumero] = useState("");
  const [mac, setMac] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [modelo, setModelo] = useState("");
  const [sala, setSala] = useState("");
  const [status, setStatus] =
    useState<ChromebookStatus>("disponivel");
  const [observacoes, setObservacoes] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const parametros = new URLSearchParams(
      window.location.search
    );

    const idChromebook = parametros.get("id");

    if (!idChromebook) {
      router.push("/chromebooks");
      return;
    }

    const chromebook = getChromebooks().find(
      (item) => item.id === idChromebook
    );

    if (!chromebook) {
      router.push("/chromebooks");
      return;
    }

    setId(chromebook.id);
    setNumero(chromebook.numero);
    setMac(chromebook.mac);
    setNumeroSerie(chromebook.numeroSerie);
    setModelo(chromebook.modelo);
    setSala(chromebook.sala);
    setStatus(chromebook.status);
    setObservacoes(chromebook.observacoes);
    setCarregando(false);
  }, [router]);

  function salvarAlteracoes() {
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

    updateChromebook({
      id,
      numero,
      mac,
      numeroSerie,
      modelo,
      sala,
      status,
      observacoes,
    });

    router.push("/chromebooks");
  }

  if (carregando) {
    return (
      <main className="min-h-screen bg-gray-100 p-8 transition-colors dark:bg-[#3a3a3f]">
        <div className="mx-auto max-w-3xl">
          <p className="text-gray-600 dark:text-gray-300">
            Carregando equipamento...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8 transition-colors dark:bg-[#3a3a3f]">
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
            Editar Chromebook
          </h1>

          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Altere as informações do equipamento.
          </p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow transition-colors dark:bg-[#444449]">
          <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-[#303034]">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ID permanente
            </p>

            <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
              {id}
            </p>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              O ID não pode ser alterado.
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
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:focus:border-gray-300"
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
                  setMac(event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:focus:border-gray-300"
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
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:focus:border-gray-300"
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
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:focus:border-gray-300"
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
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:focus:border-gray-300"
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
              onClick={() => router.push("/chromebooks")}
              className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50 dark:border-[#66666c] dark:text-gray-100 dark:hover:bg-[#55555b]"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={salvarAlteracoes}
              className="rounded-lg bg-black px-5 py-3 font-medium text-white transition hover:bg-gray-800 dark:bg-[#f4f4f5] dark:text-gray-900 dark:hover:bg-white"
            >
              Salvar alterações
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}