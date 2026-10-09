
"use client";

import { useEffect, useState } from "react";
import {
  getChromebooks,
  updateChromebook,
} from "@/lib/chromebooks";
import type {
  Chromebook,
  ChromebookStatus,
} from "@/types/chromebook";

const inputClassName =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500";

const labelClassName =
  "mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200";

export default function EditarChromebookPage() {
  const [chromebookOriginal, setChromebookOriginal] =
    useState<Chromebook | null>(null);

  const [numero, setNumero] = useState("");
  const [mac, setMac] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [modelo, setModelo] = useState("");
  const [sala, setSala] = useState("");
  const [status, setStatus] =
    useState<ChromebookStatus>("disponivel");
  const [observacoes, setObservacoes] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    try {
      const parametros = new URLSearchParams(
        window.location.search
      );

      const id =
        parametros.get("id") ??
        parametros.get("chromebookId");

      if (!id) {
        setErro(
          "Nenhum Chromebook foi selecionado. Volte para a listagem e clique em Editar no equipamento desejado."
        );
        return;
      }

      const chromebooks = getChromebooks();

      const encontrado = chromebooks.find(
        (chromebook) => chromebook.id === id
      );

      if (!encontrado) {
        setErro(
          "Chromebook não encontrado. Volte para a listagem e tente novamente."
        );
        return;
      }

      setChromebookOriginal(encontrado);
      setNumero(encontrado.numero);
      setMac(encontrado.mac);
      setNumeroSerie(encontrado.numeroSerie);
      setModelo(encontrado.modelo);
      setSala(encontrado.sala);
      setStatus(encontrado.status);
      setObservacoes(encontrado.observacoes);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o Chromebook."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  function formatarMac(valor: string) {
    const hexadecimal = valor
      .replace(/[^a-fA-F0-9]/g, "")
      .toUpperCase()
      .slice(0, 12);

    const partes = hexadecimal.match(/.{1,2}/g);

    return partes ? partes.join(":") : "";
  }

  function salvarAlteracoes() {
    if (salvando || sucesso) return;

    setErro("");

    if (!chromebookOriginal) {
      setErro("Nenhum Chromebook válido foi carregado.");
      return;
    }

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
      updateChromebook({
        ...chromebookOriginal,
        numero: numero.trim(),
        mac: mac.toUpperCase(),
        numeroSerie: numeroSerie.trim(),
        modelo: modelo.trim(),
        sala: sala.trim(),
        status,
        observacoes: observacoes.trim(),
      });

      setSucesso(true);

      window.setTimeout(() => {
        window.location.href = "/chromebooks";
      }, 1800);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o Chromebook."
      );

      setSalvando(false);
    }
  }

  function voltar() {
    window.location.href = "/chromebooks";
  }

  return (
    <main className="min-h-screen bg-gray-100 p-5 transition-colors sm:p-8 dark:bg-[#3a3a3f]">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <button
            type="button"
            onClick={voltar}
            className="mb-4 text-sm font-medium text-gray-600 transition hover:text-black dark:text-gray-300 dark:hover:text-white"
          >
            ← Voltar para Chromebooks
          </button>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Editar Chromebook
          </h1>

          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Altere os dados do equipamento selecionado.
          </p>
        </div>

        {carregando ? (
          <div className="rounded-xl bg-white p-8 text-gray-700 shadow dark:bg-[#444449] dark:text-gray-100">
            Carregando dados do Chromebook...
          </div>
        ) : erro && !chromebookOriginal ? (
          <div className="rounded-xl bg-white p-6 shadow dark:bg-[#444449]">
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
            >
              {erro}
            </div>

            <button
              type="button"
              onClick={voltar}
              className="mt-5 rounded-lg bg-black px-5 py-3 font-medium text-white transition hover:bg-gray-800 dark:bg-[#f4f4f5] dark:text-gray-900"
            >
              Voltar para Chromebooks
            </button>
          </div>
        ) : chromebookOriginal ? (
          <div className="rounded-xl bg-white p-6 shadow transition-colors sm:p-8 dark:bg-[#444449]">
            {sucesso && (
              <div
                role="status"
                aria-live="polite"
                className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 shadow-sm dark:border-green-800 dark:bg-green-950/40 dark:text-green-300"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-xl font-bold dark:bg-green-900">
                  ✓
                </span>

                <div>
                  <p className="font-semibold">
                    Chromebook atualizado!
                  </p>
                  <p className="text-sm">
                    As alterações foram salvas com sucesso.
                    Você será redirecionado em instantes.
                  </p>
                </div>
              </div>
            )}

            {erro && (
              <div
                role="alert"
                className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
              >
                {erro}
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Identificação
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                ID permanente: {chromebookOriginal.id}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="numero" className={labelClassName}>
                  Número
                </label>
                <input
                  id="numero"
                  type="text"
                  value={numero}
                  onChange={(event) =>
                    setNumero(event.target.value)
                  }
                  placeholder="Ex.: 001"
                  required
                  disabled={salvando || sucesso}
                  className={inputClassName}
                />
              </div>

              <div>
                <label htmlFor="mac" className={labelClassName}>
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
                  disabled={salvando || sucesso}
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="numeroSerie"
                  className={labelClassName}
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
                  disabled={salvando || sucesso}
                  className={inputClassName}
                />
              </div>

              <div>
                <label htmlFor="modelo" className={labelClassName}>
                  Modelo
                </label>
                <input
                  id="modelo"
                  type="text"
                  value={modelo}
                  onChange={(event) =>
                    setModelo(event.target.value)
                  }
                  placeholder="Ex.: Acer Chromebook 311"
                  required
                  disabled={salvando || sucesso}
                  className={inputClassName}
                />
              </div>

              <div>
                <label htmlFor="sala" className={labelClassName}>
                  Sala de destino
                </label>
                <input
                  id="sala"
                  type="text"
                  value={sala}
                  onChange={(event) =>
                    setSala(event.target.value)
                  }
                  placeholder="Ex.: Sala 203 ou Reserva"
                  required
                  disabled={salvando || sucesso}
                  className={inputClassName}
                />
              </div>

              <div>
                <label htmlFor="status" className={labelClassName}>
                  Situação
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value as ChromebookStatus
                    )
                  }
                  disabled={salvando || sucesso}
                  className={inputClassName}
                >
                  <option value="disponivel">
                    Disponível — equipamento reserva
                  </option>
                  <option value="em-uso">
                    Em uso — em operação
                  </option>
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
                className={labelClassName}
              >
                Observações
              </label>
              <textarea
                id="observacoes"
                rows={4}
                value={observacoes}
                onChange={(event) =>
                  setObservacoes(event.target.value)
                }
                placeholder="Informações adicionais sobre o equipamento..."
                disabled={salvando || sucesso}
                className={inputClassName}
              />
            </div>

            <div className="mt-8 flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <button
                type="button"
                onClick={voltar}
                disabled={salvando || sucesso}
                className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#66666c] dark:text-gray-100 dark:hover:bg-[#55555b]"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={salvarAlteracoes}
                disabled={salvando || sucesso}
                className="rounded-lg bg-black px-5 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#f4f4f5] dark:text-gray-900 dark:hover:bg-white"
              >
                {sucesso
                  ? "Atualizado!"
                  : salvando
                    ? "Salvando..."
                    : "Salvar alterações"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}