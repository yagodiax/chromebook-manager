
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getChromebooks } from "@/lib/chromebooks";
import { saveManutencao } from "@/lib/manutencoes";
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
      resolve(String(leitor.result));
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

  const [chromebook, setChromebook] = useState<Chromebook | null>(null);

  const [data, setData] = useState("");
  const [tipo, setTipo] = useState<TipoManutencao>("ocorrencia");
  const [categoria, setCategoria] = useState<CategoriaManutencao>("outro");
  const [descricao, setDescricao] = useState("");
  const [observacao, setObservacao] = useState("");
  const [quemRealizou, setQuemRealizou] = useState("");

  // Novos campos financeiros e de reparo externo.
  const [custo, setCusto] = useState("");
  const [destinoReparo, setDestinoReparo] = useState("");
  const [resultado, setResultado] = useState("");

  const [anexos, setAnexos] = useState<AnexoManutencao[]>([]);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!chromebookId) {
      return;
    }

    const chromebooks = getChromebooks();
    const encontrado = chromebooks.find(
      (item) => item.id === chromebookId
    );

    setChromebook(encontrado ?? null);

    const hoje = new Date().toISOString().split("T")[0];
    setData(hoje);
  }, [chromebookId]);

  async function selecionarArquivos(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setErro("");

    const arquivos = Array.from(event.target.files ?? []);

    for (const arquivo of arquivos) {
      if (arquivo.size > TAMANHO_MAXIMO) {
        setErro(
          `O arquivo "${arquivo.name}" ultrapassa o limite de 5 MB.`
        );
        continue;
      }

      try {
        const dados = await arquivoParaBase64(arquivo);

        const novoAnexo: AnexoManutencao = {
          id:
            Date.now().toString() +
            "-" +
            Math.random().toString(36).substring(2),
          nome: arquivo.name,
          tipo: arquivo.type || "application/octet-stream",
          tamanho: arquivo.size,
          dados,
        };

        setAnexos((atual) => [...atual, novoAnexo]);
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

  async function salvar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");

    if (!chromebook) {
      setErro("Chromebook não encontrado.");
      return;
    }

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

    let custoNumerico: number | undefined;

    if (custo.trim() !== "") {
      custoNumerico = Number(custo.replace(",", "."));

      if (!Number.isFinite(custoNumerico) || custoNumerico < 0) {
        setErro("Informe um custo válido, igual ou maior que zero.");
        return;
      }
    }

    setSalvando(true);

    try {
      saveManutencao({
        chromebookId: chromebook.id,
        data,
        tipo,
        categoria,
        descricao: descricao.trim(),
        observacao: observacao.trim(),
        quemRealizou: quemRealizou.trim(),
        anexos,
        custo: custoNumerico,
        destinoReparo: destinoReparo.trim(),
        resultado: resultado.trim(),
      });

      router.push("/chromebooks/detalhes?id=" + chromebook.id);
    } catch {
      setErro(
        "Não foi possível salvar a manutenção. O armazenamento do navegador pode estar cheio."
      );
      setSalvando(false);
    }
  }

  if (!chromebook) {
    return (
      <main className="min-h-screen bg-gray-100 p-8 transition-colors dark:bg-[#3a3a3f]">
        <div className="mx-auto max-w-4xl">
          <button
            type="button"
            onClick={() => router.push("/chromebooks")}
            className="text-sm font-medium text-gray-600 transition hover:text-black dark:text-gray-300 dark:hover:text-white"
          >
            ← Voltar para Chromebooks
          </button>

          <div className="mt-8 rounded-xl bg-white p-8 shadow transition-colors dark:bg-[#444449]">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Chromebook não encontrado
            </h1>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
              Não foi possível localizar o equipamento informado.
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
            router.push("/chromebooks/detalhes?id=" + chromebook.id)
          }
          className="text-sm font-medium text-gray-600 transition hover:text-black dark:text-gray-300 dark:hover:text-white"
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
            Registre uma ocorrência, manutenção, reposição de peça ou envio para reparo.
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
            </div>

            <div>
              <label className={classeLabel}>Categoria do problema</label>
              <select
                value={categoria}
                onChange={(event) =>
                  setCategoria(event.target.value as CategoriaManutencao)
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
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300"
              />
            </div>

            <div className="md:col-span-2">
              <label className={classeLabel}>
                Observação
                <span className="ml-1 font-normal text-gray-400 dark:text-gray-500">
                  (opcional)
                </span>
              </label>
              <textarea
                value={observacao}
                onChange={(event) => setObservacao(event.target.value)}
                rows={3}
                placeholder="Alguma informação adicional..."
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300"
              />
            </div>

            <div>
              <label className={classeLabel}>Quem realizou</label>
              <input
                type="text"
                value={quemRealizou}
                onChange={(event) => setQuemRealizou(event.target.value)}
                required
                placeholder="Nome do responsável"
                className={classeInput}
              />
            </div>

            <div>
              <label className={classeLabel}>
                Custo do serviço (R$)
                <span className="ml-1 font-normal text-gray-400 dark:text-gray-500">
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
                Deixe em branco se não houve custo.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className={classeLabel}>
                Destino do reparo
                <span className="ml-1 font-normal text-gray-400 dark:text-gray-500">
                  (opcional)
                </span>
              </label>
              <input
                type="text"
                value={destinoReparo}
                onChange={(event) => setDestinoReparo(event.target.value)}
                placeholder="Ex.: Oficina do João, assistência técnica..."
                className={classeInput}
              />
            </div>

            <div className="md:col-span-2">
              <label className={classeLabel}>
                Resultado da manutenção
                <span className="ml-1 font-normal text-gray-400 dark:text-gray-500">
                  (opcional)
                </span>
              </label>
              <textarea
                value={resultado}
                onChange={(event) => setResultado(event.target.value)}
                rows={3}
                placeholder="Ex.: Tela substituída, equipamento testado e funcionando normalmente..."
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-black dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300"
              />
            </div>

            <div className="md:col-span-2">
              <label className={classeLabel}>
                Anexos
                <span className="ml-1 font-normal text-gray-400 dark:text-gray-500">
                  (opcional)
                </span>
              </label>

              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 dark:border-[#606066] dark:bg-[#303034]">
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
                          onClick={() => removerAnexo(anexo.id)}
                          className="ml-4 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-[#553333]"
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
            <div className="mx-6 mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-[#3d2929] dark:text-red-300">
              {erro}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-5 dark:border-[#5a5a60]">
            <button
              type="button"
              disabled={salvando}
              onClick={() =>
                router.push("/chromebooks/detalhes?id=" + chromebook.id)
              }
              className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-[#66666c] dark:bg-[#444449] dark:text-gray-100 dark:hover:bg-[#55555b]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={salvando}
              className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#f4f4f5] dark:text-gray-900 dark:hover:bg-white"
            >
              {salvando ? "Salvando..." : "Salvar manutenção"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}