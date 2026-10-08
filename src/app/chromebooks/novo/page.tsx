"use client";

import { useState } from "react";
import { saveChromebook } from "@/lib/chromebooks";
import { ChromebookStatus } from "@/types/chromebook";

export default function NovoChromebookPage() {
  const [patrimonio, setPatrimonio] = useState("");
  const [modelo, setModelo] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [status, setStatus] =
    useState<ChromebookStatus>("disponivel");
  const [usuario, setUsuario] = useState("");
  const [observacoes, setObservacoes] = useState("");

  function cadastrar() {
    if (!patrimonio || !modelo || !numeroSerie) {
      alert(
        "Preencha Patrimônio, Modelo e Número de série."
      );
      return;
    }

    const novoChromebook = {
      id: crypto.randomUUID(),
      patrimonio,
      modelo,
      numeroSerie,
      status,
      usuario,
      observacoes,
    };

    console.log("SALVANDO:", novoChromebook);

    saveChromebook(novoChromebook);

    console.log(
      "DADOS SALVOS:",
      localStorage.getItem("chromebook-manager")
    );

    window.location.href = "/chromebooks";
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Novo Chromebook
          </h1>

          <p className="mt-2 text-gray-600">
            Cadastre um novo equipamento no sistema.
          </p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Patrimônio
              </label>

              <input
                type="text"
                value={patrimonio}
                onChange={(event) =>
                  setPatrimonio(event.target.value)
                }
                placeholder="Ex: CB-001"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Modelo
              </label>

              <input
                type="text"
                value={modelo}
                onChange={(event) =>
                  setModelo(event.target.value)
                }
                placeholder="Ex: Acer Chromebook 311"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Número de série
              </label>

              <input
                type="text"
                value={numeroSerie}
                onChange={(event) =>
                  setNumeroSerie(event.target.value)
                }
                placeholder="Número de série"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as ChromebookStatus
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-black"
              >
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

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Usuário / Aluno
            </label>

            <input
              type="text"
              value={usuario}
              onChange={(event) =>
                setUsuario(event.target.value)
              }
              placeholder="Nome do usuário ou aluno"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-black"
            />
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Observações
            </label>

            <textarea
              rows={4}
              value={observacoes}
              onChange={(event) =>
                setObservacoes(event.target.value)
              }
              placeholder="Observações sobre o equipamento..."
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-black"
            />
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                window.location.href = "/chromebooks";
              }}
              className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={cadastrar}
              className="rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"
            >
              Cadastrar Chromebook
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}