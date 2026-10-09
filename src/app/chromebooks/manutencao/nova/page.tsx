
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getChromebooks,
  updateChromebook,
} from "@/lib/chromebooks";
import {
  deleteManutencao,
  saveManutencao,
} from "@/lib/manutencoes";
import type {
  AnexoManutencao,
  CategoriaManutencao,
  TipoManutencao,
} from "@/types/manutencao";
import type { Chromebook } from "@/types/chromebook";

const tipos: {
  valor: TipoManutencao;
  nome: string;
}[] = [
  { valor: "ocorrencia", nome: "Ocorrência" },
  { valor: "manutencao", nome: "Manutenção" },
  { valor: "reposicao-de-peca", nome: "Reposição de Peça" },
  { valor: "envio-para-reparo", nome: "Envio para Reparo" },
];

const categorias: {
  valor: CategoriaManutencao;
  nome: string;
}[] = [
  { valor: "tela", nome: "Tela" },
  { valor: "teclado", nome: "Teclado" },
  { valor: "bateria", nome: "Bateria" },
  { valor: "carregador", nome: "Carregador" },
  { valor: "touchpad", nome: "Touchpad" },
  { valor: "sistema-operacional", nome: "Sistema operacional" },
  { valor: "wifi", nome: "Wi-Fi" },
  { valor: "bluetooth", nome: "Bluetooth" },
  { valor: "audio", nome: "Áudio" },
  { valor: "camera", nome: "Câmera" },
  { valor: "carcaca", nome: "Carcaça" },
  { valor: "dobradica", nome: "Dobradiça" },
  { valor: "usb", nome: "USB" },
  { valor: "outro", nome: "Outro" },
];

const TAMANHO_MAXIMO = 5 * 1024 * 1024;
const QUANTIDADE_MAXIMA_ANEXOS = 5;

function obterDataLocal(): string {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function dataISOValida(data: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return false;
  }

  const [ano, mes, dia] = data.split("-").map(Number);
  const dataConvertida = new Date(ano, mes - 1, dia);

  return (
    dataConvertida.getFullYear() === ano &&
    dataConvertida.getMonth() === mes - 1 &&
    dataConvertida.getDate() === dia
  );
}

function formatarTamanho(tamanho: number): string {
  if (tamanho < 1024) {
    return `${tamanho} B`;
  }

  if (tamanho < 1024 * 1024) {
    return `${(tamanho / 1024).toFixed(1)} KB`;
  }

  return `${(tamanho / (1024 * 1024)).toFixed(1)} MB`;
}

function arquivoParaBase64(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();

    leitor.onload = () => {
      if (typeof leitor.result !== "string") {
        reject(new Error("O conteúdo do arquivo é inválido."));
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

const classeInput =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300";

const classeLabel =
  "mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200";

export default function NovaManutencaoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chromebookId = searchParams.get("chromebook");

  const salvandoRef = useRef(false);
  const processandoAnexosRef = useRef(false);

  const [chromebook, setChromebook] =
    useState<Chromebook | null>(null);

  const [carregando, setCarregando] = useState(true);
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
  const [anexos, setAnexos] = useState<AnexoManutencao[]>([]);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [processandoAnexos, setProcessandoAnexos] = useState(false);

  useEffect(() => {
    if (!chromebookId) {
      setCarregando(false);
      setErro("Não foi informado o identificador do Chromebook.");
      return;
    }

    try {
      const encontrado = getChromebooks().find(
        (item) => item.id === chromebookId
      );

      setChromebook(encontrado ?? null);
      setData(obterDataLocal());

      if (!encontrado) {
        setErro("Não foi possível localizar o Chromebook.");
      }
    } catch (erroLeitura) {
      setChromebook(null);
      setErro(
        erroLeitura instanceof Error
          ? erroLeitura.message
          : "Não foi possível carregar os dados do Chromebook."
      );
    } finally {
      setCarregando(false);
    }
  }, [chromebookId]);

  async function selecionarArquivos(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const arquivosSelecionados = Array.from(
      event.target.files ?? []
    );

    // Libera o mesmo arquivo para ser selecionado novamente.
    event.target.value = "";

    if (arquivosSelecionados.length === 0) {
      return;
    }

    if (processandoAnexosRef.current || salvandoRef.current) {
      setErro("Aguarde o processamento atual antes de continuar.");
      return;
    }

    processandoAnexosRef.current = true;
    setProcessandoAnexos(true);
    setErro("");

    const novosAnexos: AnexoManutencao[] = [];
    const errosArquivos: string[] = [];

    try {
      for (const arquivo of arquivosSelecionados) {
        if (
          anexos.length + novosAnexos.length >=
          QUANTIDADE_MAXIMA_ANEXOS
        ) {
          errosArquivos.push(
            `O limite de ${QUANTIDADE_MAXIMA_ANEXOS} anexos foi atingido.`
          );
          break;
        }

        if (arquivo.size > TAMANHO_MAXIMO) {
          errosArquivos.push(
            `O arquivo "${arquivo.name}" ultrapassa o limite de 5 MB.`
          );
          continue;
        }

        try {
          const dados = await arquivoParaBase64(arquivo);

          novosAnexos.push({
            id:
              `${Date.now()}-` +
              Math.random().toString(36).substring(2),
            nome: arquivo.name,
            tipo: arquivo.type || "application/octet-stream",
            tamanho: arquivo.size,
            dados,
          });
        } catch {
          errosArquivos.push(
            `Não foi possível adicionar o arquivo "${arquivo.name}".`
          );
        }
      }

      if (novosAnexos.length > 0) {
        setAnexos((atuais) => [
          ...atuais,
          ...novosAnexos,
        ]);
      }

      if (errosArquivos.length > 0) {
        setErro(errosArquivos.join(" "));
      }
    } finally {
      processandoAnexosRef.current = false;
      setProcessandoAnexos(false);
    }
  }

  function removerAnexo(id: string) {
    if (processandoAnexosRef.current || salvandoRef.current) {
      return;
    }

    setAnexos((atuais) =>
      atuais.filter((anexo) => anexo.id !== id)
    );
    setErro("");
  }

  async function salvar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (salvandoRef.current) {
      return;
    }

    setErro("");

    if (processandoAnexosRef.current) {
      setErro("Aguarde o término do processamento dos anexos.");
      return;
    }

    if (!chromebook) {
      setErro("Chromebook não encontrado.");
      return;
    }

    if (!dataISOValida(data)) {
      setErro("Informe uma data válida.");
      return;
    }

    if (data > obterDataLocal()) {
      setErro("A data não pode ser futura.");
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

    if (
      anexos.length > QUANTIDADE_MAXIMA_ANEXOS ||
      anexos.some(
        (anexo) =>
          !Number.isFinite(anexo.tamanho) ||
          anexo.tamanho < 0 ||
          anexo.tamanho > TAMANHO_MAXIMO
      )
    ) {
      setErro("Confira os anexos antes de salvar a manutenção.");
      return;
    }

    if (
      tipo === "envio-para-reparo" &&
      !destinoReparo.trim()
    ) {
      setErro("Informe a assistência ou o destino do reparo.");
      return;
    }

    if (
      tipo === "envio-para-reparo" &&
      chromebook.status !== "em-uso" &&
      chromebook.status !== "disponivel"
    ) {
      setErro(
        chromebook.status === "em-reparo"
          ? "Este Chromebook já está marcado como No reparo."
          : "Um Chromebook para descarte não pode ser enviado para reparo por este formulário."
      );
      return;
    }

    let custoNumerico: number | undefined;

    // O custo da assistência externa só é registrado no retorno.
    if (tipo !== "envio-para-reparo" && custo.trim() !== "") {
      const valorInformado = Number(custo.replace(",", "."));

      if (
        !Number.isFinite(valorInformado) ||
        valorInformado < 0
      ) {
        setErro(
          "Informe um custo válido, igual ou maior que zero."
        );
        return;
      }

      custoNumerico = Math.round(
        (valorInformado + Number.EPSILON) * 100
      ) / 100;

      if (!Number.isFinite(custoNumerico)) {
        setErro("O custo informado é muito alto.");
        return;
      }
    }

    salvandoRef.current = true;
    setSalvando(true);

    let manutencaoSalva: { id: string } | null = null;
    let estadoAtual: Chromebook | undefined;
    let atualizacaoDeStatusTentada = false;
    let erroAoReverter = false;
    let erroAoExcluirHistorico = false;

    try {
      // Consulta novamente os dados imediatamente antes de gravar.
      const chromebooksAtuais = getChromebooks();

      estadoAtual = chromebooksAtuais.find(
        (item) => item.id === chromebook.id
      );

      if (!estadoAtual) {
        throw new Error(
          "O Chromebook não foi encontrado no armazenamento."
        );
      }

      if (
        tipo === "envio-para-reparo" &&
        estadoAtual.status !== "em-uso" &&
        estadoAtual.status !== "disponivel"
      ) {
        throw new Error(
          estadoAtual.status === "em-reparo"
            ? "Este Chromebook já está marcado como No reparo."
            : "A situação atual do Chromebook não permite enviá-lo para reparo."
        );
      }

      manutencaoSalva = saveManutencao({
        chromebookId: estadoAtual.id,
        data,
        tipo,
        categoria,
        descricao: descricao.trim(),
        observacao: observacao.trim(),
        quemRealizou: quemRealizou.trim(),
        anexos: [...anexos],
        custo:
          tipo === "envio-para-reparo"
            ? undefined
            : custoNumerico,
        destinoReparo: destinoReparo.trim(),
        resultado: resultado.trim(),
      });

      if (tipo === "envio-para-reparo") {
        // Registra a tentativa antes de atualizar o status.
        atualizacaoDeStatusTentada = true;

        updateChromebook({
          ...estadoAtual,
          status: "em-reparo",
        });
      }
    } catch (erroOperacao) {
      if (atualizacaoDeStatusTentada && estadoAtual) {
        try {
          updateChromebook(estadoAtual);
        } catch {
          erroAoReverter = true;
        }
      }

      if (manutencaoSalva) {
        try {
          deleteManutencao(manutencaoSalva.id);
        } catch {
          erroAoExcluirHistorico = true;
        }
      }

      let mensagem =
        erroOperacao instanceof Error
          ? erroOperacao.message
          : "Não foi possível concluir a operação.";

      if (erroAoReverter || erroAoExcluirHistorico) {
        mensagem =
          "Ocorreu uma falha e não foi possível reverter todas as alterações. Confira o status do Chromebook e o histórico antes de tentar novamente.";
      }

      setErro(mensagem);
      salvandoRef.current = false;
      setSalvando(false);
      return;
    }

    router.push(
      "/chromebooks/detalhes?id=" +
        encodeURIComponent(chromebook.id)
    );
  }

  if (carregando) {
    return (
      <main className="min-h-screen bg-gray-100 p-8 dark:bg-[#3a3a3f]">
        <p className="text-gray-600 dark:text-gray-300">
          Carregando Chromebook...
        </p>
      </main>
    );
  }

  if (!chromebook) {
    return (
      <main className="min-h-screen bg-gray-100 p-8 transition-colors dark:bg-[#3a3a3f]">
        <div className="mx-auto max-w-4xl">
          <button
            type="button"
            onClick={() => router.push("/chromebooks")}
            className="text-sm font-medium text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white"
          >
            ← Voltar para Chromebooks
          </button>

          <div className="mt-8 rounded-xl bg-white p-8 shadow dark:bg-[#444449]">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Chromebook não encontrado
            </h1>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
              {erro ||
                "Não foi possível localizar o equipamento informado."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8 transition-colors dark:bg-[#3a3a3f]">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/chromebooks/detalhes?id=" +
                encodeURIComponent(chromebook.id)
            )
          }
          className="text-sm font-medium text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white"
        >
          ← Voltar para {chromebook.id}
        </button>

        <div className="mb-8 mt-6">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {chromebook.id} • {chromebook.modelo}
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
            Registrar manutenção
          </h1>

          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Registre uma ocorrência, manutenção, reposição de peça
            ou envio para reparo.
          </p>
        </div>

        <form
          onSubmit={salvar}
          className="rounded-xl bg-white shadow transition-colors dark:bg-[#444449]"
        >
          <div className="border-b border-gray-200 px-6 py-5 dark:border-[#5a5a60]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Informações da manutenção
            </h2>
          </div>

          <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
            <div>
              <label className={classeLabel}>Chromebook</label>
              <input
                type="text"
                value={chromebook.id}
                disabled
                className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-gray-600 dark:border-[#606066] dark:bg-[#303034] dark:text-gray-400"
              />
            </div>

            <div>
              <label className={classeLabel}>Data</label>
              <input
                type="date"
                value={data}
                max={obterDataLocal()}
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
                {tipos.map((item) => (
                  <option key={item.valor} value={item.valor}>
                    {item.nome}
                  </option>
                ))}
              </select>

              {tipo === "envio-para-reparo" && (
                <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                  Ao salvar, o status mudará para No reparo.
                  O custo final será registrado no retorno.
                </p>
              )}
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
                    {item.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className={classeLabel}>Descrição</label>
              <textarea
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                rows={4}
                required
                placeholder="Descreva o problema ou o serviço realizado..."
                className={`${classeInput} resize-none`}
              />
            </div>

            <div className="md:col-span-2">
              <label className={classeLabel}>
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
                placeholder="Alguma informação adicional..."
                className={`${classeInput} resize-none`}
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
                placeholder="Nome do responsável"
                className={classeInput}
              />
            </div>

            {tipo !== "envio-para-reparo" && (
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
                  placeholder="Ex.: 150,00"
                  className={classeInput}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Para envio externo, o custo real deve ser informado
                  quando o Chromebook retornar.
                </p>
              </div>
            )}

            {tipo === "envio-para-reparo" && (
              <div>
                <label className={classeLabel}>
                  Assistência ou destino do reparo
                </label>
                <input
                  type="text"
                  value={destinoReparo}
                  onChange={(event) =>
                    setDestinoReparo(event.target.value)
                  }
                  required
                  placeholder="Nome da assistência técnica"
                  className={classeInput}
                />
              </div>
            )}

            {tipo !== "envio-para-reparo" && (
              <div className="md:col-span-2">
                <label className={classeLabel}>
                  Destino do reparo
                  <span className="ml-1 font-normal text-gray-400">
                    (opcional)
                  </span>
                </label>
                <input
                  type="text"
                  value={destinoReparo}
                  onChange={(event) =>
                    setDestinoReparo(event.target.value)
                  }
                  placeholder="Ex.: assistência técnica..."
                  className={classeInput}
                />
              </div>
            )}

            <div className="md:col-span-2">
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
                placeholder="Descreva o resultado, se já houver..."
                className={`${classeInput} resize-none`}
              />
            </div>

            <div className="md:col-span-2">
              <label className={classeLabel}>
                Anexos
                <span className="ml-1 font-normal text-gray-400">
                  (opcional)
                </span>
              </label>

              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 dark:border-[#606066] dark:bg-[#303034]">
                <input
                  id="arquivos"
                  type="file"
                  multiple
                  disabled={
                    processandoAnexos ||
                    salvando ||
                    anexos.length >= QUANTIDADE_MAXIMA_ANEXOS
                  }
                  onChange={selecionarArquivos}
                  className="hidden"
                />

                <label
                  htmlFor="arquivos"
                  className={`inline-flex rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition dark:bg-[#f4f4f5] dark:text-gray-900 ${
                    processandoAnexos ||
                    salvando ||
                    anexos.length >= QUANTIDADE_MAXIMA_ANEXOS
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer hover:bg-gray-800 dark:hover:bg-white"
                  }`}
                >
                  {processandoAnexos
                    ? "Processando arquivos..."
                    : "+ Adicionar arquivos"}
                </label>

                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Até {QUANTIDADE_MAXIMA_ANEXOS} arquivos, com no máximo
                  5 MB cada. {anexos.length}/{QUANTIDADE_MAXIMA_ANEXOS} anexos adicionados.
                </p>

                {anexos.length > 0 && (
                  <div className="mt-5 space-y-2">
                    {anexos.map((anexo) => (
                      <div
                        key={anexo.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-[#5a5a60] dark:bg-[#444449]"
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
                          disabled={processandoAnexos || salvando}
                          onClick={() => removerAnexo(anexo.id)}
                          className="ml-4 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-[#553333]"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {erro && (
            <div
              role="alert"
              className="mx-6 mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-[#3d2929] dark:text-red-300"
            >
              {erro}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-5 dark:border-[#5a5a60]">
            <button
              type="button"
              disabled={salvando || processandoAnexos}
              onClick={() =>
                router.push(
                  "/chromebooks/detalhes?id=" +
                    encodeURIComponent(chromebook.id)
                )
              }
              className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-[#66666c] dark:bg-[#444449] dark:text-gray-100 dark:hover:bg-[#55555b]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={salvando || processandoAnexos}
              className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#f4f4f5] dark:text-gray-900 dark:hover:bg-white"
            >
              {salvando
                ? "Salvando..."
                : processandoAnexos
                  ? "Processando anexos..."
                  : "Salvar manutenção"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}