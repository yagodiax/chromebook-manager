"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getChromebooks } from "@/lib/chromebooks";
import {
  getManutencoes,
  updateManutencao,
} from "@/lib/manutencoes";
import type { Chromebook } from "@/types/chromebook";
import type {
  AnexoManutencao,
  CategoriaManutencao,
  Manutencao,
  TipoManutencao,
} from "@/types/manutencao";

const TAMANHO_MAXIMO = 5 * 1024 * 1024;

function formatarTamanho(tamanho: number): string {
  if (tamanho < 1024) {
    return tamanho + " B";
  }

  if (tamanho < 1024 * 1024) {
    return (tamanho / 1024).toFixed(1) + " KB";
  }

  return (tamanho / (1024 * 1024)).toFixed(1) + " MB";
}

function arquivoParaBase64(
  arquivo: File
): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();

    leitor.onload = () => {
      resolve(String(leitor.result));
    };

    leitor.onerror = () => {
      reject(
        new Error("Não foi possível ler o arquivo.")
      );
    };

    leitor.readAsDataURL(arquivo);
  });
}

export default function EditarManutencaoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [manutencao, setManutencao] =
    useState<Manutencao | null>(null);

  const [chromebook, setChromebook] =
    useState<Chromebook | null>(null);

  const [data, setData] = useState("");
  const [tipo, setTipo] =
    useState<TipoManutencao>("ocorrencia");
  const [categoria, setCategoria] =
    useState<CategoriaManutencao>("outro");
  const [descricao, setDescricao] = useState("");
  const [observacao, setObservacao] = useState("");
  const [quemRealizou, setQuemRealizou] = useState("");

  const [anexos, setAnexos] =
    useState<AnexoManutencao[]>([]);

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const id = searchParams.get("id");

    if (!id) {
      setCarregando(false);
      return;
    }

    const encontrado = getManutencoes().find(
      (item) => item.id === id
    );

    if (!encontrado) {
      setCarregando(false);
      return;
    }

    const equipamento = getChromebooks().find(
      (item) => item.id === encontrado.chromebookId
    );

    setManutencao(encontrado);
    setChromebook(equipamento || null);
    setData(encontrado.data);
    setTipo(encontrado.tipo);
    setCategoria(encontrado.categoria);
    setDescricao(encontrado.descricao);
    setObservacao(encontrado.observacao);
    setQuemRealizou(encontrado.quemRealizou);
    setAnexos(encontrado.anexos || []);
    setCarregando(false);
  }, [searchParams]);

  async function selecionarArquivos(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setErro("");

    const arquivos = Array.from(
      event.target.files ?? []
    );

    for (const arquivo of arquivos) {
      if (arquivo.size > TAMANHO_MAXIMO) {
        setErro(
          `O arquivo "${arquivo.name}" ultrapassa o limite de 5 MB.`
        );
        continue;
      }

      try {
        const dados = await arquivoParaBase64(
          arquivo
        );

        const novoAnexo: AnexoManutencao = {
          id:
            Date.now().toString() +
            "-" +
            Math.random()
              .toString(36)
              .substring(2),
          nome: arquivo.name,
          tipo:
            arquivo.type ||
            "application/octet-stream",
          tamanho: arquivo.size,
          dados,
        };

        setAnexos((atual) => [
          ...atual,
          novoAnexo,
        ]);
      } catch {
        setErro(
          `Não foi possível adicionar o arquivo "${arquivo.name}".`
        );
      }
    }

    event.target.value = "";
  }

  function removerAnexo(id: string) {
    setAnexos((atual) =>
      atual.filter((anexo) => anexo.id !== id)
    );
  }

  function salvar() {
    if (!manutencao) {
      return;
    }

    setErro("");

    if (!data) {
      setErro("Informe a data.");
      return;
    }

    if (!descricao.trim()) {
      setErro("Informe a descrição.");
      return;
    }

    if (!quemRealizou.trim()) {
      setErro("Informe quem realizou.");
      return;
    }

    setSalvando(true);

    try {
      const atualizada: Manutencao = {
        ...manutencao,
        data,
        tipo,
        categoria,
        descricao: descricao.trim(),
        observacao: observacao.trim(),
        quemRealizou: quemRealizou.trim(),
        anexos,
      };

      updateManutencao(atualizada);

      router.push(
        "/chromebooks/detalhes?id=" +
          manutencao.chromebookId
      );
    } catch {
      setErro(
        "Não foi possível salvar as alterações. O armazenamento do navegador pode estar cheio."
      );
      setSalvando(false);
    }
  }

  function voltarParaDetalhes() {
    if (!manutencao) {
      router.push("/chromebooks");
      return;
    }

    router.push(
      "/chromebooks/detalhes?id=" +
        manutencao.chromebookId
    );
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

  if (!manutencao) {
    return (
      <main className="min-h-screen bg-gray-100 p-8 transition-colors dark:bg-[#3a3a3f]">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm transition-colors dark:border-[#5a5a60] dark:bg-[#444449]">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Manutenção não encontrada
          </h1>

          <p className="mt-2 text-gray-600 dark:text-gray-300">
            O registro informado não existe no sistema.
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

  return (
    <main className="min-h-screen bg-gray-100 p-8 transition-colors dark:bg-[#3a3a3f]">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={voltarParaDetalhes}
          className="mb-6 text-sm font-medium text-gray-500 transition hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          ← Voltar para o Chromebook
        </button>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm transition-colors dark:border-[#5a5a60] dark:bg-[#444449]">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Editar manutenção
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
              Atualize as informações do registro de manutenção.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                ID da manutenção
              </label>

              <input
                type="text"
                value={manutencao.id}
                disabled
                className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-[#5a5a60] dark:bg-[#303034] dark:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Chromebook
              </label>

              <input
                type="text"
                value={
                  chromebook
                    ? chromebook.id +
                      " - Nº " +
                      (chromebook.numero || "-") +
                      " - " +
                      (chromebook.modelo || "-")
                    : manutencao.chromebookId
                }
                disabled
                className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-[#5a5a60] dark:bg-[#303034] dark:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Data
              </label>

              <input
                type="date"
                value={data}
                onChange={(event) =>
                  setData(event.target.value)
                }
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-500 dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:focus:border-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Tipo
              </label>

              <select
                value={tipo}
                onChange={(event) =>
                  setTipo(
                    event.target.value as TipoManutencao
                  )
                }
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-500 dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:focus:border-gray-300"
              >
                <option value="ocorrencia">
                  Ocorrência
                </option>

                <option value="manutencao">
                  Manutenção
                </option>

                <option value="reposicao-de-peca">
                  Reposição de Peça
                </option>

                <option value="envio-para-reparo">
                  Envio para Reparo
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Categoria do problema
              </label>

              <select
                value={categoria}
                onChange={(event) =>
                  setCategoria(
                    event.target.value as CategoriaManutencao
                  )
                }
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-500 dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:focus:border-gray-300"
              >
                <option value="tela">Tela</option>
                <option value="teclado">Teclado</option>
                <option value="bateria">Bateria</option>
                <option value="carregador">
                  Carregador
                </option>
                <option value="touchpad">
                  Touchpad
                </option>
                <option value="sistema-operacional">
                  Sistema operacional
                </option>
                <option value="wifi">Wi-Fi</option>
                <option value="bluetooth">
                  Bluetooth
                </option>
                <option value="audio">Áudio</option>
                <option value="camera">Câmera</option>
                <option value="carcaca">Carcaça</option>
                <option value="dobradica">
                  Dobradiça
                </option>
                <option value="usb">USB</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Descrição
              </label>

              <textarea
                value={descricao}
                onChange={(event) =>
                  setDescricao(event.target.value)
                }
                rows={4}
                className="mt-2 w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-500 dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Observação
                <span className="ml-1 font-normal text-gray-400">
                  (opcional)
                </span>
              </label>

              <textarea
                value={observacao}
                onChange={(event) =>
                  setObservacao(event.target.value)
                }
                rows={3}
                className="mt-2 w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-500 dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Quem realizou
              </label>

              <input
                type="text"
                value={quemRealizou}
                onChange={(event) =>
                  setQuemRealizou(event.target.value)
                }
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-500 dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:focus:border-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Anexos
                <span className="ml-1 font-normal text-gray-400">
                  (opcional)
                </span>
              </label>

              <div className="mt-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 transition-colors dark:border-[#606066] dark:bg-[#303034]">
                <input
                  id="arquivos"
                  type="file"
                  multiple
                  onChange={selecionarArquivos}
                  className="hidden"
                />

                <label
                  htmlFor="arquivos"
                  className="inline-flex cursor-pointer rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-[#f4f4f5] dark:text-gray-900 dark:hover:bg-white"
                >
                  + Adicionar arquivos
                </label>

                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Máximo de 5 MB por arquivo.
                </p>

                {anexos.length > 0 && (
                  <div className="mt-5 space-y-2">
                    {anexos.map((anexo) => (
                      <div
                        key={anexo.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors dark:border-[#5a5a60] dark:bg-[#444449]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
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
                            removerAnexo(anexo.id)
                          }
                          className="ml-4 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-[#4a3838]"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {erro && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-[#684545] dark:bg-[#4a3838] dark:text-red-200">
                {erro}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                disabled={salvando}
                onClick={voltarParaDetalhes}
                className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-[#66666c] dark:bg-[#444449] dark:text-gray-100 dark:hover:bg-[#55555b]"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={salvando}
                onClick={salvar}
                className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#f4f4f5] dark:text-gray-900 dark:hover:bg-white"
              >
                {salvando
                  ? "Salvando..."
                  : "Salvar alterações"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}