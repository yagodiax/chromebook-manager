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
  Chromebook,
  ChromebookStatus,
} from "@/types/chromebook";
import type { CategoriaManutencao } from "@/types/manutencao";

const classeInput =
  "mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-500 dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300";

const classeLabel =
  "block text-sm font-medium text-gray-700 dark:text-gray-200";

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

function obterDataLocal(): string {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function statusFinalValido(
  status: string
): status is ChromebookStatus {
  return (
    status === "em-uso" ||
    status === "disponivel" ||
    status === "para-descarte"
  );
}

export default function RetornoReparoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const salvandoRef = useRef(false);

  const [chromebook, setChromebook] =
    useState<Chromebook | null>(null);

  const [data, setData] = useState("");
  const [categoria, setCategoria] =
    useState<CategoriaManutencao>("outro");
  const [descricao, setDescricao] = useState("");
  const [pecaSubstituida, setPecaSubstituida] = useState("");
  const [assistencia, setAssistencia] = useState("");
  const [custo, setCusto] = useState("");
  const [resultado, setResultado] = useState("");

  const [statusFinal, setStatusFinal] =
    useState<ChromebookStatus>("em-uso");

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const id = searchParams.get("chromebook");

    if (!id) {
      setCarregando(false);
      return;
    }

    try {
      const encontrado = getChromebooks().find(
        (item) => item.id === id
      );

      if (encontrado) {
        setChromebook(encontrado);

        setStatusFinal(
          encontrado.status === "disponivel"
            ? "disponivel"
            : "em-uso"
        );
      }

      setData(obterDataLocal());
    } catch {
      setChromebook(null);
      setErro("Não foi possível carregar os dados do Chromebook.");
    } finally {
      setCarregando(false);
    }
  }, [searchParams]);

  function voltarParaDetalhes() {
    if (chromebook) {
      router.push(
        "/chromebooks/detalhes?id=" +
          encodeURIComponent(chromebook.id)
      );
      return;
    }

    router.push("/chromebooks");
  }

  function salvarRetorno() {
    if (salvandoRef.current) return;

    setErro("");

    if (!chromebook) {
      setErro("Não foi possível identificar o Chromebook.");
      return;
    }

    let equipamentoAtual: Chromebook | undefined;

    try {
      equipamentoAtual = getChromebooks().find(
        (item) => item.id === chromebook.id
      );
    } catch {
      setErro("Não foi possível consultar o equipamento salvo.");
      return;
    }

    if (!equipamentoAtual) {
      setErro("O Chromebook não foi encontrado no armazenamento.");
      return;
    }

    if (equipamentoAtual.status !== "em-reparo") {
      setErro(
        "Este Chromebook não está marcado como 'No reparo'. Atualize a página e confira a situação do equipamento."
      );
      return;
    }

    if (!data) {
      setErro("Informe a data de retorno.");
      return;
    }

    if (data > obterDataLocal()) {
      setErro("A data de retorno não pode ser futura.");
      return;
    }

    if (!assistencia.trim()) {
      setErro("Informe o nome da assistência ou responsável.");
      return;
    }

    if (!descricao.trim()) {
      setErro("Informe o serviço realizado pela assistência.");
      return;
    }

    if (!resultado.trim()) {
      setErro("Informe o resultado dos testes após o retorno.");
      return;
    }

    if (!statusFinalValido(statusFinal)) {
      setErro("Selecione uma situação final válida.");
      return;
    }

    let custoNumerico: number | undefined;

    if (custo.trim() !== "") {
      custoNumerico = Number(custo.replace(",", "."));

      if (
        !Number.isFinite(custoNumerico) ||
        custoNumerico < 0
      ) {
        setErro(
          "Informe um custo final válido, igual ou maior que zero."
        );
        return;
      }
    }

    salvandoRef.current = true;
    setSalvando(true);

    let registroCriadoId: string | null = null;
    let atualizacaoDeStatusTentada = false;

    try {
      const descricaoCompleta = pecaSubstituida.trim()
        ? `${descricao.trim()}\nPeça substituída: ${pecaSubstituida.trim()}`
        : descricao.trim();

      const registro = saveManutencao({
        chromebookId: equipamentoAtual.id,
        data,
        tipo: "retorno-de-reparo",
        categoria,
        descricao: descricaoCompleta,
        observacao: "",
        quemRealizou: assistencia.trim(),
        anexos: [],
        custo: custoNumerico,
        destinoReparo: assistencia.trim(),
        resultado: resultado.trim(),
      });

      registroCriadoId = registro.id;

      // Marca a tentativa antes da atualização para permitir
      // uma tentativa de reversão mesmo se a chamada falhar.
      atualizacaoDeStatusTentada = true;

      updateChromebook({
        ...equipamentoAtual,
        status: statusFinal,
      });
    } catch {
      let falhouAoReverter = false;

      if (atualizacaoDeStatusTentada) {
        try {
          updateChromebook(equipamentoAtual);
        } catch {
          falhouAoReverter = true;
        }
      }

      if (registroCriadoId) {
        try {
          deleteManutencao(registroCriadoId);
        } catch {
          falhouAoReverter = true;
        }
      }

      setErro(
        falhouAoReverter
          ? "Ocorreu uma falha e não foi possível reverter todas as alterações. Confira o histórico e a situação do Chromebook antes de tentar novamente."
          : "Não foi possível concluir o registro. Confira o histórico e a situação do Chromebook antes de tentar novamente."
      );

      salvandoRef.current = false;
      setSalvando(false);
      return;
    }

    router.push(
      "/chromebooks/detalhes?id=" +
        encodeURIComponent(equipamentoAtual.id)
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
      <main className="min-h-screen bg-gray-100 p-8 dark:bg-[#3a3a3f]">
        <div className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-[#5a5a60] dark:bg-[#444449]">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Chromebook não encontrado
          </h1>

          <p className="mt-2 text-gray-600 dark:text-gray-300">
            {erro ||
              "Não foi possível localizar o equipamento para registrar o retorno."}
          </p>

          <button
            type="button"
            onClick={() => router.push("/chromebooks")}
            className="mt-6 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white dark:bg-[#f4f4f5] dark:text-gray-900"
          >
            Voltar para Chromebooks
          </button>
        </div>
      </main>
    );
  }

  if (chromebook.status !== "em-reparo") {
    return (
      <main className="min-h-screen bg-gray-100 p-8 dark:bg-[#3a3a3f]">
        <div className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-[#5a5a60] dark:bg-[#444449]">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Retorno não disponível
          </h1>

          <p className="mt-3 text-gray-600 dark:text-gray-300">
            Este Chromebook não está marcado como “No reparo”.
            Para evitar registros duplicados, não é possível registrar
            outro retorno neste momento.
          </p>

          <button
            type="button"
            onClick={voltarParaDetalhes}
            className="mt-6 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white dark:bg-[#f4f4f5] dark:text-gray-900"
          >
            Voltar para o Chromebook
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

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-[#5a5a60] dark:bg-[#444449]">
          <div className="mb-8">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Controle de reparos
            </p>

            <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
              Registrar retorno do reparo
            </h1>

            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Registre o serviço concluído, o custo final e a situação
              do equipamento após o retorno.
            </p>
          </div>

          <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-[#303034]">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Chromebook
            </p>

            <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
              {chromebook.id} — Nº {chromebook.numero || "-"}
            </p>

            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Modelo: {chromebook.modelo || "-"} · Sala:{" "}
              {chromebook.sala || "-"}
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className={classeLabel}>
                Data de retorno
              </label>

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
              <label className={classeLabel}>
                Assistência técnica
              </label>

              <input
                type="text"
                value={assistencia}
                onChange={(event) => setAssistencia(event.target.value)}
                placeholder="Nome da assistência ou responsável"
                required
                className={classeInput}
              />
            </div>

            <div>
              <label className={classeLabel}>
                Categoria do reparo
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
              <label className={classeLabel}>
                Serviço realizado
              </label>

              <textarea
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                rows={3}
                required
                placeholder="Ex.: substituição da tela e revisão das conexões."
                className={classeInput + " resize-none"}
              />
            </div>

            <div>
              <label className={classeLabel}>
                Peça substituída
                <span className="ml-1 font-normal text-gray-400">
                  (opcional)
                </span>
              </label>

              <input
                type="text"
                value={pecaSubstituida}
                onChange={(event) =>
                  setPecaSubstituida(event.target.value)
                }
                placeholder="Ex.: tela LCD, teclado ou bateria"
                className={classeInput}
              />
            </div>

            <div>
              <label className={classeLabel}>
                Custo final do reparo (R$)
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
                Informe somente o valor final cobrado. Deixe em branco
                se não houve custo.
              </p>
            </div>

            <div>
              <label className={classeLabel}>
                Resultado dos testes
              </label>

              <textarea
                value={resultado}
                onChange={(event) => setResultado(event.target.value)}
                rows={3}
                required
                placeholder="Ex.: equipamento ligado, Wi-Fi conectado e teclado testado."
                className={classeInput + " resize-none"}
              />
            </div>

            <div>
              <label className={classeLabel}>
                Situação após o retorno
              </label>

              <select
                value={statusFinal}
                onChange={(event) =>
                  setStatusFinal(
                    event.target.value as ChromebookStatus
                  )
                }
                className={classeInput}
              >
                <option value="em-uso">Em uso</option>
                <option value="disponivel">Disponível</option>
                <option value="para-descarte">Para descarte</option>
              </select>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Se o equipamento não puder voltar à operação, selecione
                Para descarte.
              </p>
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
                disabled={salvando}
                onClick={voltarParaDetalhes}
                className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-[#66666c] dark:bg-[#444449] dark:text-gray-100 dark:hover:bg-[#55555b]"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={salvando}
                onClick={salvarRetorno}
                className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#f4f4f5] dark:text-gray-900 dark:hover:bg-white"
              >
                {salvando ? "Salvando..." : "Registrar retorno"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}