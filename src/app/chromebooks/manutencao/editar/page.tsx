
"use client";

import { useEffect, useRef, useState } from "react";
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
const QUANTIDADE_MAXIMA_ANEXOS = 5;

const classeInput =
  "mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-500 dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300";

const classeLabel =
  "block text-sm font-medium text-gray-700 dark:text-gray-200";

const tiposManutencao: {
  valor: TipoManutencao;
  label: string;
}[] = [
  { valor: "ocorrencia", label: "Ocorrência" },
  { valor: "manutencao", label: "Manutenção" },
  { valor: "reposicao-de-peca", label: "Reposição de peça" },
  { valor: "envio-para-reparo", label: "Envio para reparo" },
  { valor: "retorno-de-reparo", label: "Retorno de reparo" },
];

const categorias: {
  valor: CategoriaManutencao;
  label: string;
}[] = [
  { valor: "tela", label: "Tela" },
  { valor: "teclado", label: "Teclado" },
  { valor: "bateria", label: "Bateria" },
  { valor: "carregador", label: "Carregador" },
  { valor: "touchpad", label: "Touchpad" },
  { valor: "sistema-operacional", label: "Sistema operacional" },
  { valor: "wifi", label: "Wi-Fi" },
  { valor: "bluetooth", label: "Bluetooth" },
  { valor: "audio", label: "Áudio" },
  { valor: "camera", label: "Câmera" },
  { valor: "carcaca", label: "Carcaça" },
  { valor: "dobradica", label: "Dobradiça" },
  { valor: "usb", label: "USB" },
  { valor: "outro", label: "Outro" },
];

function formatarTamanho(tamanho: number): string {
  if (tamanho < 1024) {
    return tamanho + " B";
  }

  if (tamanho < 1024 * 1024) {
    return (tamanho / 1024).toFixed(1) + " KB";
  }

  return (tamanho / (1024 * 1024)).toFixed(1) + " MB";
}

function arquivoParaBase64(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();

    leitor.onload = () => {
      if (typeof leitor.result !== "string") {
        reject(new Error("O arquivo não pôde ser convertido."));
        return;
      }

      resolve(leitor.result);
    };

    leitor.onerror = () => {
      reject(new Error("Não foi possível ler o arquivo."));
    };

    leitor.readAsDataURL(arquivo);
  });
}

function dataValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }

  const [ano, mes, dia] = valor.split("-").map(Number);
  const dataVerificada = new Date(ano, mes - 1, dia);

  return (
    dataVerificada.getFullYear() === ano &&
    dataVerificada.getMonth() === mes - 1 &&
    dataVerificada.getDate() === dia
  );
}

export default function EditarManutencaoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // O ref impede salvamentos duplicados antes mesmo da atualização do estado.
  const salvamentoEmAndamento = useRef(false);
  const selecaoDeArquivosEmAndamento = useRef(false);

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

  const [custo, setCusto] = useState("");
  const [destinoReparo, setDestinoReparo] = useState("");
  const [resultado, setResultado] = useState("");

  const [anexos, setAnexos] =
    useState<AnexoManutencao[]>([]);

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [adicionandoAnexos, setAdicionandoAnexos] = useState(false);

  useEffect(() => {
    try {
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

      setCusto(
        encontrado.custo !== undefined
          ? String(encontrado.custo)
          : ""
      );

      setDestinoReparo(encontrado.destinoReparo ?? "");
      setResultado(encontrado.resultado ?? "");
      setAnexos(encontrado.anexos || []);
    } catch {
      setErro(
        "Não foi possível carregar o registro. Verifique os dados salvos no navegador."
      );
    } finally {
      setCarregando(false);
    }
  }, [searchParams]);

  async function selecionarArquivos(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    if (selecaoDeArquivosEmAndamento.current) {
      event.target.value = "";
      return;
    }

    selecaoDeArquivosEmAndamento.current = true;
    setAdicionandoAnexos(true);
    setErro("");

    const arquivos = Array.from(event.target.files ?? []);
    let quantidadeAtual = anexos.length;
    const novosAnexos: AnexoManutencao[] = [];
    const errosArquivos: string[] = [];

    try {
      for (const arquivo of arquivos) {
        if (
          quantidadeAtual + novosAnexos.length >=
          QUANTIDADE_MAXIMA_ANEXOS
        ) {
          errosArquivos.push(
            `O limite é de ${QUANTIDADE_MAXIMA_ANEXOS} anexos por manutenção.`
          );
          break;
        }

        if (arquivo.size > TAMANHO_MAXIMO) {
          errosArquivos.push(
            `"${arquivo.name}" ultrapassa o limite de 5 MB.`
          );
          continue;
        }

        try {
          const dados = await arquivoParaBase64(arquivo);

          novosAnexos.push({
            id:
              Date.now().toString() +
              "-" +
              Math.random().toString(36).substring(2),
            nome: arquivo.name,
            tipo: arquivo.type || "application/octet-stream",
            tamanho: arquivo.size,
            dados,
          });
        } catch {
          errosArquivos.push(
            `Não foi possível adicionar "${arquivo.name}".`
          );
        }
      }

      if (novosAnexos.length > 0) {
        setAnexos((atuais) => [...atuais, ...novosAnexos]);
      }

      if (errosArquivos.length > 0) {
        setErro(errosArquivos.join(" "));
      }
    } finally {
      selecaoDeArquivosEmAndamento.current = false;
      setAdicionandoAnexos(false);
      event.target.value = "";
    }
  }

  function removerAnexo(id: string) {
    setAnexos((atuais) =>
      atuais.filter((anexo) => anexo.id !== id)
    );
    setErro("");
  }

  function salvar() {
    if (
      salvamentoEmAndamento.current ||
      salvando ||
      !manutencao
    ) {
      return;
    }

    setErro("");

    if (!dataValida(data)) {
      setErro("Informe uma data válida.");
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

    if (anexos.length > QUANTIDADE_MAXIMA_ANEXOS) {
      setErro(
        `Uma manutenção pode ter no máximo ${QUANTIDADE_MAXIMA_ANEXOS} anexos.`
      );
      return;
    }

    const anexoInvalido = anexos.some(
      (anexo) =>
        !Number.isFinite(anexo.tamanho) ||
        anexo.tamanho < 0 ||
        anexo.tamanho > TAMANHO_MAXIMO
    );

    if (anexoInvalido) {
      setErro(
        "Existe um anexo inválido ou maior que 5 MB. Remova-o e tente novamente."
      );
      return;
    }

    if (
      tipo === "envio-para-reparo" &&
      !destinoReparo.trim()
    ) {
      setErro(
        "Informe a assistência técnica ou o destino do reparo."
      );
      return;
    }

    let custoNumerico: number | undefined;

    // O envio para reparo não deve contabilizar custo no relatório.
    if (tipo !== "envio-para-reparo" && custo.trim() !== "") {
      custoNumerico = Number(custo.replace(",", "."));

      if (
        !Number.isFinite(custoNumerico) ||
        custoNumerico < 0
      ) {
        setErro(
          "Informe um custo válido, igual ou maior que zero."
        );
        return;
      }

      // Mantém o valor monetário com precisão de centavos.
      custoNumerico = Math.round(custoNumerico * 100) / 100;
    }

    salvamentoEmAndamento.current = true;
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
        custo:
          tipo === "envio-para-reparo"
            ? undefined
            : custoNumerico,
        destinoReparo: destinoReparo.trim(),
        resultado: resultado.trim(),
      };

      updateManutencao(atualizada);

      router.push(
        "/chromebooks/detalhes?id=" +
          encodeURIComponent(manutencao.chromebookId)
      );
    } catch (erroSalvamento) {
      const mensagem =
        erroSalvamento instanceof Error
          ? erroSalvamento.message
          : "";

      setErro(
        mensagem
          ? `Não foi possível salvar as alterações: ${mensagem}`
          : "Não foi possível salvar as alterações. Verifique o espaço disponível no armazenamento do navegador."
      );

      salvamentoEmAndamento.current = false;
      setSalvando(false);
    }
  }

  function voltarParaDetalhes() {
    if (salvamentoEmAndamento.current) {
      return;
    }

    if (!manutencao) {
      router.push("/chromebooks");
      return;
    }

    router.push(
      "/chromebooks/detalhes?id=" +
        encodeURIComponent(manutencao.chromebookId)
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
            {erro ||
              "O registro informado não existe no sistema."}
          </p>

          <button
            type="button"
            onClick={() => router.push("/chromebooks")}
            className="mt-6 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-[#f4f4f5] dark:text-gray-900 dark:hover:bg-white"
          >
            Voltar para Chromebooks
          </button>
        </div>
      </main>
    );
  }

  const envioParaReparo = tipo === "envio-para-reparo";

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
              Atualize as informações do registro sem apagar o histórico.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className={classeLabel}>
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
              <label className={classeLabel}>Chromebook</label>

              <input
                type="text"
                value={
                  chromebook
                    ? `${chromebook.id} - Nº ${
                        chromebook.numero || "-"
                      } - ${chromebook.modelo || "-"}`
                    : manutencao.chromebookId
                }
                disabled
                className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-[#5a5a60] dark:bg-[#303034] dark:text-gray-400"
              />
            </div>

            <div>
              <label className={classeLabel}>Data</label>

              <input
                type="date"
                value={data}
                onChange={(event) => setData(event.target.value)}
                required
                className={classeInput}
              />
            </div>

            <div>
              <label className={classeLabel}>Tipo</label>

              <select
                value={tipo}
                onChange={(event) =>
                  setTipo(event.target.value as TipoManutencao)
                }
                className={classeInput}
              >
                {tiposManutencao.map((item) => (
                  <option key={item.valor} value={item.valor}>
                    {item.label}
                  </option>
                ))}
              </select>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                O tipo pode ser alterado; confira se a mudança
                corresponde ao histórico real do equipamento.
              </p>
            </div>

            <div>
              <label className={classeLabel}>
                Categoria do problema
              </label>

              <select
                value={categoria}
                onChange={(event) =>
                  setCategoria(
                    event.target.value as CategoriaManutencao
                  )
                }
                className={classeInput}
              >
                {categorias.map((item) => (
                  <option key={item.valor} value={item.valor}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={classeLabel}>Descrição</label>

              <textarea
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                rows={4}
                required
                className={classeInput + " resize-none"}
              />
            </div>

            <div>
              <label className={classeLabel}>
                Observação
                <span className="ml-1 font-normal text-gray-400">
                  (opcional)
                </span>
              </label>

              <textarea
                value={observacao}
                onChange={(event) => setObservacao(event.target.value)}
                rows={3}
                className={classeInput + " resize-none"}
              />
            </div>

            <div>
              <label className={classeLabel}>Quem realizou</label>

              <input
                type="text"
                value={quemRealizou}
                onChange={(event) =>
                  setQuemRealizou(event.target.value)
                }
                required
                className={classeInput}
              />
            </div>

            {envioParaReparo ? (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950/30">
                <p className="text-sm font-semibold text-orange-900 dark:text-orange-200">
                  Registro de envio para reparo
                </p>

                <p className="mt-1 text-sm text-orange-800 dark:text-orange-300">
                  O custo final deve ser registrado no retorno da assistência,
                  não no envio.
                </p>
              </div>
            ) : (
              <div>
                <label className={classeLabel}>
                  Custo do serviço (R$)
                  <span className="ml-1 font-normal text-gray-400">
                    (opcional)
                  </span>
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={custo}
                  onChange={(event) => setCusto(event.target.value)}
                  placeholder="Ex.: 150.00"
                  className={classeInput}
                />

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Informe o valor efetivamente cobrado. Deixe em branco
                  se não houve custo.
                </p>
              </div>
            )}

            <div>
              <label className={classeLabel}>
                Assistência técnica ou destino do reparo
                {envioParaReparo && (
                  <span className="ml-1 text-red-500">*</span>
                )}
              </label>

              <input
                type="text"
                value={destinoReparo}
                onChange={(event) =>
                  setDestinoReparo(event.target.value)
                }
                placeholder="Ex.: nome da assistência técnica"
                className={classeInput}
                required={envioParaReparo}
              />
            </div>

            <div>
              <label className={classeLabel}>
                Resultado da manutenção
                <span className="ml-1 font-normal text-gray-400">
                  (opcional)
                </span>
              </label>

              <textarea
                value={resultado}
                onChange={(event) => setResultado(event.target.value)}
                rows={3}
                placeholder="Ex.: tela substituída e equipamento testado."
                className={classeInput + " resize-none"}
              />
            </div>

            <div>
              <label className={classeLabel}>
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
                  disabled={
                    salvando ||
                    adicionandoAnexos ||
                    anexos.length >= QUANTIDADE_MAXIMA_ANEXOS
                  }
                  onChange={selecionarArquivos}
                  className="hidden"
                />

                <label
                  htmlFor="arquivos"
                  className={`inline-flex rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition dark:bg-[#f4f4f5] dark:text-gray-900 ${
                    salvando ||
                    adicionandoAnexos ||
                    anexos.length >= QUANTIDADE_MAXIMA_ANEXOS
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer hover:bg-gray-800 dark:hover:bg-white"
                  }`}
                >
                  {adicionandoAnexos
                    ? "Adicionando arquivos..."
                    : "+ Adicionar arquivos"}
                </label>

                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Máximo de 5 arquivos no total, com até 5 MB por arquivo.
                </p>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {anexos.length} de {QUANTIDADE_MAXIMA_ANEXOS} anexos
                  utilizados.
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
                            {formatarTamanho(anexo.tamanho)}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={salvando || adicionandoAnexos}
                          onClick={() => removerAnexo(anexo.id)}
                          className="ml-4 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-300 dark:hover:bg-[#4a3838]"
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
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-[#684545] dark:bg-[#4a3838] dark:text-red-200"
              >
                {erro}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                disabled={salvando || adicionandoAnexos}
                onClick={voltarParaDetalhes}
                className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-[#66666c] dark:bg-[#444449] dark:text-gray-100 dark:hover:bg-[#55555b]"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={salvando || adicionandoAnexos}
                onClick={salvar}
                className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#f4f4f5] dark:text-gray-900 dark:hover:bg-white"
              >
                {salvando ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}