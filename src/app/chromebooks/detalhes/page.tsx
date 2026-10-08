"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getChromebooks } from "@/lib/chromebooks";
import {
  deleteManutencao,
  getManutencoes,
} from "@/lib/manutencoes";
import type { Chromebook } from "@/types/chromebook";
import type { Manutencao } from "@/types/manutencao";

function obterStatusLabel(status: Chromebook["status"]): string {
  if (status === "disponivel") {
    return "Disponível";
  }

  if (status === "em-uso") {
    return "Em uso";
  }

  if (status === "em-reparo") {
    return "Em reparo";
  }

  return "Retirada de peças";
}

function obterStatusClasse(status: Chromebook["status"]): string {
  if (status === "disponivel") {
    return "bg-green-100 text-green-700 dark:bg-[#394a3d] dark:text-green-300";
  }

  if (status === "em-uso") {
    return "bg-blue-100 text-blue-700 dark:bg-[#3f454c] dark:text-blue-300";
  }

  if (status === "em-reparo") {
    return "bg-yellow-100 text-yellow-700 dark:bg-[#4c4838] dark:text-yellow-300";
  }

  return "bg-gray-200 text-gray-700 dark:bg-[#55555b] dark:text-gray-200";
}

function obterTipoLabel(tipo: Manutencao["tipo"]): string {
  if (tipo === "ocorrencia") {
    return "Ocorrência";
  }

  if (tipo === "manutencao") {
    return "Manutenção";
  }

  if (tipo === "reposicao-de-peca") {
    return "Reposição de Peça";
  }

  return "Envio para Reparo";
}

function obterCategoriaLabel(
  categoria: Manutencao["categoria"]
): string {
  const categorias: Record<Manutencao["categoria"], string> = {
    tela: "Tela",
    teclado: "Teclado",
    bateria: "Bateria",
    carregador: "Carregador",
    touchpad: "Touchpad",
    "sistema-operacional": "Sistema operacional",
    wifi: "Wi-Fi",
    bluetooth: "Bluetooth",
    audio: "Áudio",
    camera: "Câmera",
    carcaca: "Carcaça",
    dobradica: "Dobradiça",
    usb: "USB",
    outro: "Outro",
  };

  return categorias[categoria];
}

function formatarData(data: string): string {
  if (!data) {
    return "-";
  }

  const partes = data.split("-");

  if (partes.length !== 3) {
    return data;
  }

  return partes[2] + "/" + partes[1] + "/" + partes[0];
}

function formatarTamanho(tamanho: number): string {
  if (tamanho < 1024) {
    return tamanho + " B";
  }

  if (tamanho < 1024 * 1024) {
    return (tamanho / 1024).toFixed(1) + " KB";
  }

  return (tamanho / (1024 * 1024)).toFixed(1) + " MB";
}

export default function DetalhesChromebookPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [chromebook, setChromebook] =
    useState<Chromebook | null>(null);

  const [manutencoes, setManutencoes] =
    useState<Manutencao[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  useEffect(() => {
    const id = searchParams.get("id");

    if (!id) {
      setCarregando(false);
      return;
    }

    const chromebooks = getChromebooks();

    const encontrado = chromebooks.find(
      (item) => item.id === id
    );

    const todasManutencoes = getManutencoes();

    const manutencoesDoChromebook =
      todasManutencoes
        .filter(
          (manutencao) =>
            manutencao.chromebookId === id
        )
        .sort((a, b) =>
          b.data.localeCompare(a.data)
        );

    setChromebook(encontrado || null);
    setManutencoes(manutencoesDoChromebook);
    setCarregando(false);
  }, [searchParams]);

  function abrirEdicao() {
    if (!chromebook) {
      return;
    }

    router.push(
      "/chromebooks/editar?id=" +
        chromebook.id
    );
  }

  function registrarManutencao() {
    if (!chromebook) {
      return;
    }

    router.push(
      "/chromebooks/manutencao/nova?chromebook=" +
        chromebook.id
    );
  }

  function editarManutencao(id: string) {
    router.push(
      "/chromebooks/manutencao/editar?id=" +
        id
    );
  }

  function excluirManutencao(id: string) {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este registro de manutenção?"
    );

    if (!confirmar) {
      return;
    }

    deleteManutencao(id);

    setManutencoes((atual) =>
      atual.filter(
        (manutencao) => manutencao.id !== id
      )
    );
  }

  function abrirAnexo(dados: string) {
    const novaAba = window.open(
      "",
      "_blank"
    );

    if (!novaAba) {
      alert(
        "O navegador bloqueou a abertura do arquivo. Permita pop-ups para este site."
      );
      return;
    }

    novaAba.document.write(
      `
        <html>
          <head>
            <title>Anexo</title>
            <style>
              html,
              body {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                overflow: hidden;
                background: #222226;
              }

              iframe {
                width: 100%;
                height: 100%;
                border: 0;
              }
            </style>
          </head>

          <body>
            <iframe src="${dados}"></iframe>
          </body>
        </html>
      `
    );

    novaAba.document.close();
  }

  if (carregando) {
    return (
      <main className="min-h-screen bg-gray-100 p-8 transition-colors dark:bg-[#3a3a3f]">
        <p className="text-gray-600 dark:text-gray-300">
          Carregando...
        </p>
      </main>
    );
  }

  if (!chromebook) {
    return (
      <main className="min-h-screen bg-gray-100 p-8 transition-colors dark:bg-[#3a3a3f]">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm transition-colors dark:border-[#5a5a60] dark:bg-[#444449]">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Chromebook não encontrado
          </h1>

          <p className="mt-2 text-gray-600 dark:text-gray-300">
            O Chromebook informado não existe no sistema.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/chromebooks")
            }
            className="mt-6 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-[#f4f4f5] dark:text-gray-900 dark:hover:bg-white"
          >
            Voltar para Chromebooks
          </button>
        </div>
      </main>
    );
  }

  const ultimaManutencao =
    manutencoes.length > 0
      ? manutencoes[0]
      : null;

  return (
    <main className="min-h-screen bg-gray-100 p-8 transition-colors dark:bg-[#3a3a3f]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              type="button"
              onClick={() =>
                router.push("/chromebooks")
              }
              className="mb-3 text-sm font-medium text-gray-500 transition hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              ← Voltar para Chromebooks
            </button>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {chromebook.id}
            </h1>

            <p className="mt-1 text-gray-500 dark:text-gray-300">
              Detalhes e histórico do equipamento
            </p>
          </div>

          <button
            type="button"
            onClick={abrirEdicao}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-[#66666c] dark:bg-[#444449] dark:text-gray-100 dark:hover:bg-[#55555b]"
          >
            Editar Chromebook
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-colors lg:col-span-2 dark:border-[#5a5a60] dark:bg-[#444449]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Informações do Chromebook
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                  Dados atuais do equipamento
                </p>
              </div>

              <span
                className={
                  "inline-flex whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium " +
                  obterStatusClasse(chromebook.status)
                }
              >
                {obterStatusLabel(chromebook.status)}
              </span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ID permanente
                </p>

                <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                  {chromebook.id}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Número
                </p>

                <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                  {chromebook.numero || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Modelo
                </p>

                <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                  {chromebook.modelo || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sala
                </p>

                <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                  {chromebook.sala || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  MAC
                </p>

                <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                  {chromebook.mac || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Número de série
                </p>

                <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                  {chromebook.numeroSerie || "-"}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Observações
                </p>

                <p className="mt-1 whitespace-pre-wrap font-medium text-gray-900 dark:text-gray-100">
                  {chromebook.observacoes || "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-[#5a5a60] dark:bg-[#444449]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Manutenção
            </h2>

            <div className="mt-5 space-y-5">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total de registros
                </p>

                <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {manutencoes.length}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Última manutenção
                </p>

                <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                  {ultimaManutencao
                    ? formatarData(
                        ultimaManutencao.data
                      )
                    : "Nenhuma registrada"}
                </p>
              </div>

              <button
                type="button"
                onClick={registrarManutencao}
                className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-[#f4f4f5] dark:text-gray-900 dark:hover:bg-white"
              >
                + Registrar manutenção
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm transition-colors dark:border-[#5a5a60] dark:bg-[#444449]">
          <div className="border-b border-gray-200 p-6 dark:border-[#5a5a60]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Histórico de manutenção
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                  Todos os registros relacionados a este Chromebook
                </p>
              </div>

              <span className="text-sm text-gray-500 dark:text-gray-300">
                {manutencoes.length} registro(s)
              </span>
            </div>
          </div>

          {manutencoes.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                Nenhuma manutenção registrada
              </p>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                Os registros de ocorrência, manutenção,
                reposição de peça e envio para reparo
                aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 dark:border-[#5a5a60] dark:bg-[#303034]">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">
                      ID
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">
                      Data
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">
                      Tipo
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">
                      Categoria
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">
                      Descrição
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">
                      Quem realizou
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">
                      Anexos
                    </th>

                    <th className="px-6 py-4 text-right font-semibold text-gray-700 dark:text-gray-200">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {manutencoes.map(
                    (manutencao) => (
                      <tr
                        key={manutencao.id}
                        className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 dark:border-[#505057] dark:hover:bg-[#505057]"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                          {manutencao.id}
                        </td>

                        <td className="px-6 py-4 text-gray-700 dark:text-gray-200">
                          {formatarData(
                            manutencao.data
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-[#55555b] dark:text-gray-200">
                            {obterTipoLabel(
                              manutencao.tipo
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-gray-700 dark:text-gray-200">
                          {obterCategoriaLabel(
                            manutencao.categoria
                          )}
                        </td>

                        <td className="max-w-md px-6 py-4 text-gray-700 dark:text-gray-200">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {manutencao.descricao}
                          </p>

                          {manutencao.observacao && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {manutencao.observacao}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-4 text-gray-700 dark:text-gray-200">
                          {manutencao.quemRealizou}
                        </td>

                        <td className="px-6 py-4">
                          {manutencao.anexos &&
                          manutencao.anexos.length > 0 ? (
                            <div className="space-y-2">
                              {manutencao.anexos.map(
                                (anexo) => (
                                  <div
                                    key={anexo.id}
                                    className="flex min-w-[220px] items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-[#5a5a60] dark:bg-[#303034]"
                                  >
                                    <div className="min-w-0">
                                      <p
                                        className="truncate text-xs font-medium text-gray-900 dark:text-gray-100"
                                        title={anexo.nome}
                                      >
                                        {anexo.nome}
                                      </p>

                                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        {formatarTamanho(
                                          anexo.tamanho
                                        )}
                                      </p>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        abrirAnexo(
                                          anexo.dados
                                        )
                                      }
                                      className="shrink-0 rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-800 dark:bg-[#f4f4f5] dark:text-gray-900 dark:hover:bg-white"
                                    >
                                      Abrir
                                    </button>
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              Nenhum
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                editarManutencao(
                                  manutencao.id
                                )
                              }
                              className="rounded-lg px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-[#3f454c]"
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                excluirManutencao(
                                  manutencao.id
                                )
                              }
                              className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-[#4a3838]"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}