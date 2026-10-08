"use client";

import { useEffect, useState } from "react";
import { getChromebooks, updateChromebook } from "@/lib/chromebooks";
import { ChromebookStatus } from "@/types/chromebook";

export default function EditarChromebookPage() {
const [id, setId] = useState("");
const [patrimonio, setPatrimonio] = useState("");
const [modelo, setModelo] = useState("");
const [numeroSerie, setNumeroSerie] = useState("");
const [status, setStatus] =
useState<ChromebookStatus>("disponivel");
const [usuario, setUsuario] = useState("");
const [observacoes, setObservacoes] = useState("");
const [carregando, setCarregando] = useState(true);

useEffect(() => {
const parametros = new URLSearchParams(window.location.search);
const idChromebook = parametros.get("id");

if (!idChromebook) {
  window.location.href = "/chromebooks";
  return;
}

const chromebooks = getChromebooks();

const chromebook = chromebooks.find(
  (item) => item.id === idChromebook
);

if (!chromebook) {
  window.location.href = "/chromebooks";
  return;
}

setId(chromebook.id);
setPatrimonio(chromebook.patrimonio);
setModelo(chromebook.modelo);
setNumeroSerie(chromebook.numeroSerie);
setStatus(chromebook.status);
setUsuario(chromebook.usuario);
setObservacoes(chromebook.observacoes);
setCarregando(false);

}, []);

function salvarAlteracoes() {
if (!patrimonio || !modelo || !numeroSerie) {
alert(
"Preencha Patrimônio, Modelo e Número de série."
);
return;
}

updateChromebook({
  id,
  patrimonio,
  modelo,
  numeroSerie,
  status,
  usuario,
  observacoes,
});

window.location.href = "/chromebooks";

}

if (carregando) {
return (
<main className="min-h-screen bg-gray-100 p-8">
<div className="mx-auto max-w-3xl">
<p className="text-gray-600">
Carregando equipamento...
</p>
</div>
</main>
);
}

return (
<main className="min-h-screen bg-gray-100 p-8">
<div className="mx-auto max-w-3xl">
<div className="mb-8">
<h1 className="text-3xl font-bold text-gray-900">
Editar Chromebook
</h1>

      <p className="mt-2 text-gray-600">
        Altere as informações do equipamento.
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
          onClick={salvarAlteracoes}
          className="rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"
        >
          Salvar alterações
        </button>
      </div>
    </div>
  </div>
</main>

);
}