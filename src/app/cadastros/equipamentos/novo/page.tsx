"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUnidade } from "@/components/UnidadeProvider";

const TIPOS = [
  {
    valor: "chromebook",
    nome: "Chromebook",
    descricao: "Número do Chromebook, MAC e dados de identificação.",
  },
  {
    valor: "notebook",
    nome: "Notebook",
    descricao: "Processador, memória RAM, armazenamento e sistema operacional.",
  },
  {
    valor: "projetor",
    nome: "Projetor",
    descricao: "Tecnologia, conexões e localização.",
  },
  {
    valor: "catraca",
    nome: "Catraca",
    descricao: "Fabricante, modelo, tipo de controle e localização.",
  },
  {
    valor: "impressora",
    nome: "Impressora",
    descricao: "Tecnologia de impressão, conexão e endereço IP.",
  },
] as const;

type Tipo = (typeof TIPOS)[number]["valor"];

const campo =
  "w-full rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/15 dark:border-[#55555c] dark:bg-[#333338] dark:text-gray-100 dark:placeholder:text-gray-500";

const rotulo =
  "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300";

export default function CadastroPage() {
  const router = useRouter();
  const { unidadeAtiva, unidadeCarregada } = useUnidade();

  const [tipo, setTipo] = useState<Tipo>("chromebook");
  const [patrimonio, setPatrimonio] = useState("");
  const [fabricante, setFabricante] = useState("");
  const [modelo, setModelo] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [status, setStatus] = useState("disponivel");
  const [observacoes, setObservacoes] = useState("");
  const [detalhes, setDetalhes] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  function alterarTipo(novoTipo: Tipo) {
    setTipo(novoTipo);
    setDetalhes({});
  }

  function campoDetalhe(
    chave: string,
    nome: string,
    placeholder = "",
  ) {
    return (
      <div key={chave}>
        <label className={rotulo} htmlFor={chave}>
          {nome}
        </label>

        <input
          id={chave}
          className={campo}
          value={detalhes[chave] ?? ""}
          placeholder={placeholder}
          onChange={(event) =>
            setDetalhes((atual) => ({
              ...atual,
              [chave]: event.target.value,
            }))
          }
        />
      </div>
    );
  }

  async function cadastrar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (salvando || !unidadeCarregada) return;

    setErro("");
    setSalvando(true);

    try {
      const resposta = await fetch("/api/equipamentos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          unidadeId: unidadeAtiva,
          patrimonio,
          tipo,
          fabricante,
          modelo,
          numeroSerie,
          localizacao,
          status,
          observacoes,
          detalhes,
        }),
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(
          dados.erro || "Não foi possível cadastrar o equipamento.",
        );
      }

      router.push("/equipamentos");
      router.refresh();
    } catch (erroCadastro) {
      setErro(
        erroCadastro instanceof Error
          ? erroCadastro.message
          : "Erro inesperado ao cadastrar.",
      );
    } finally {
      setSalvando(false);
    }
  }

  const tipoSelecionado = TIPOS.find((item) => item.valor === tipo)!;

  return (
    <div className="min-h-screen bg-gray-100 p-5 transition-colors sm:p-8 dark:bg-[#3a3a3f]">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-5 text-sm font-medium text-gray-600 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white"
        >
          ← Voltar
        </button>

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
            Inventário · {unidadeCarregada ? unidadeAtiva : "Carregando unidade"}
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-950 dark:text-white">
            Cadastrar equipamento
          </h1>

          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Cadastre os equipamentos da escola em uma estrutura única.
          </p>

          {unidadeCarregada && (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              O equipamento será cadastrado na unidade{" "}
              <strong className="text-gray-800 dark:text-gray-100">
                {unidadeAtiva}
              </strong>
              .
            </p>
          )}
        </div>

        <form onSubmit={cadastrar} className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7 dark:border-[#505057] dark:bg-[#444449]">
            <h2 className="text-lg font-semibold text-gray-950 dark:text-white">
              1. Tipo de equipamento
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Os campos específicos mudam conforme o tipo escolhido.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TIPOS.map((item) => (
                <button
                  key={item.valor}
                  type="button"
                  onClick={() => alterarTipo(item.valor)}
                  className={`rounded-xl border p-4 text-left transition ${
                    tipo === item.valor
                      ? "border-gray-800 bg-gray-100 ring-2 ring-gray-800/10 dark:border-gray-200 dark:bg-[#35353a] dark:ring-white/10"
                      : "border-gray-200 hover:border-gray-400 dark:border-[#5a5a61] dark:hover:border-gray-400"
                  }`}
                >
                  <span className="block font-semibold text-gray-900 dark:text-gray-100">
                    {item.nome}
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">
                    {item.descricao}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7 dark:border-[#505057] dark:bg-[#444449]">
            <h2 className="text-lg font-semibold text-gray-950 dark:text-white">
              2. Identificação e localização
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label className={rotulo} htmlFor="patrimonio">
                  Patrimônio / identificação
                </label>

                <input
                  id="patrimonio"
                  className={campo}
                  value={patrimonio}
                  onChange={(event) => setPatrimonio(event.target.value)}
                  placeholder="Ex.: PAT-001 ou etiqueta patrimonial"
                />
              </div>

              <div>
                <label className={rotulo} htmlFor="fabricante">
                  Fabricante
                </label>

                <input
                  id="fabricante"
                  className={campo}
                  value={fabricante}
                  onChange={(event) => setFabricante(event.target.value)}
                  placeholder="Ex.: Acer, Epson, HP"
                />
              </div>

              <div>
                <label className={rotulo} htmlFor="modelo">
                  Modelo
                </label>

                <input
                  id="modelo"
                  className={campo}
                  value={modelo}
                  onChange={(event) => setModelo(event.target.value)}
                  placeholder="Modelo do equipamento"
                />
              </div>

              <div>
                <label className={rotulo} htmlFor="numeroSerie">
                  Número de série
                </label>

                <input
                  id="numeroSerie"
                  className={campo}
                  value={numeroSerie}
                  onChange={(event) => setNumeroSerie(event.target.value)}
                  placeholder="Número de série, se houver"
                />
              </div>

              <div>
                <label className={rotulo} htmlFor="localizacao">
                  Sala / setor / localização
                </label>

                <input
                  id="localizacao"
                  className={campo}
                  value={localizacao}
                  onChange={(event) => setLocalizacao(event.target.value)}
                  placeholder="Ex.: 202D, Secretaria, Portaria"
                />
              </div>

              <div>
                <label className={rotulo} htmlFor="status">
                  Status inicial
                </label>

                <select
                  id="status"
                  className={campo}
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="disponivel">Disponível</option>
                  <option value="em-uso">Em uso</option>
                  <option value="em-reparo">Em reparo</option>
                  <option value="inativo">Inativo</option>
                  <option value="para-descarte">Para descarte</option>
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7 dark:border-[#505057] dark:bg-[#444449]">
            <h2 className="text-lg font-semibold text-gray-950 dark:text-white">
              3. Dados específicos — {tipoSelecionado.nome}
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {tipo === "chromebook" && (
                <>
                  {campoDetalhe(
                    "numeroChromebook",
                    "Número do Chromebook",
                    "Ex.: 17",
                  )}

                  {campoDetalhe(
                    "mac",
                    "Endereço MAC",
                    "AA:BB:CC:DD:EE:FF",
                  )}

                  {campoDetalhe(
                    "saudeBateria",
                    "Saúde da bateria (%)",
                    "Ex.: 75",
                  )}
                </>
              )}

              {tipo === "notebook" && (
                <>
                  {campoDetalhe(
                    "processador",
                    "Processador",
                    "Ex.: Intel Core i5",
                  )}

                  {campoDetalhe(
                    "memoriaRam",
                    "Memória RAM",
                    "Ex.: 8 GB",
                  )}

                  {campoDetalhe(
                    "armazenamento",
                    "Armazenamento",
                    "Ex.: SSD 256 GB",
                  )}

                  {campoDetalhe(
                    "sistemaOperacional",
                    "Sistema operacional",
                    "Ex.: Windows 11",
                  )}

                  {campoDetalhe(
                    "codigoModelo",
                    "Código do modelo",
                    "Ex.: 81S9, PU401LA",
                  )}

                  {campoDetalhe(
                    "mac",
                    "Endereço MAC",
                    "AA-BB-CC-DD-EE-FF",
                  )}
                </>
              )}

              {tipo === "projetor" && (
                <>
                  {campoDetalhe(
                    "tecnologia",
                    "Tecnologia",
                    "Ex.: DLP, LCD, LED",
                  )}

                  {campoDetalhe(
                    "conexoes",
                    "Conexões",
                    "Ex.: HDMI, VGA, USB",
                  )}
                </>
              )}

              {tipo === "catraca" && (
                <>
                  {campoDetalhe(
                    "tipoControle",
                    "Tipo de controle",
                    "Ex.: biometria, cartão, facial",
                  )}

                  {campoDetalhe(
                    "fabricanteControladora",
                    "Fabricante/controladora",
                    "Fabricante do sistema de controle",
                  )}
                </>
              )}

              {tipo === "impressora" && (
                <>
                  {campoDetalhe(
                    "tecnologiaImpressao",
                    "Tecnologia de impressão",
                    "Ex.: laser, jato de tinta",
                  )}

                  {campoDetalhe(
                    "conexao",
                    "Conexão / rede",
                    "Ex.: 192.168.1.50 (CORPORATIVO), USB",
                  )}

                  {campoDetalhe(
                    "enderecoIp",
                    "Endereço IP",
                    "Ex.: 192.168.1.50",
                  )}

                  {campoDetalhe(
                    "mac",
                    "Endereço MAC",
                    "AA:BB:CC:DD:EE:FF",
                  )}

                  {campoDetalhe(
                    "paginasImpressas",
                    "Páginas impressas",
                    "Ex.: 60399",
                  )}

                  {campoDetalhe(
                    "dataInstalacao",
                    "Data de instalação",
                    "AAAA-MM-DD",
                  )}
                </>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7 dark:border-[#505057] dark:bg-[#444449]">
            <label className={rotulo} htmlFor="observacoes">
              Observações
            </label>

            <textarea
              id="observacoes"
              rows={4}
              className={campo}
              value={observacoes}
              onChange={(event) => setObservacoes(event.target.value)}
              placeholder="Informações adicionais sobre o equipamento..."
            />
          </section>

          {erro && (
            <div
              role="alert"
              className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
            >
              {erro}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200 dark:border-[#5a5a61] dark:text-gray-200 dark:hover:bg-[#505057]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={salvando || !unidadeCarregada}
              className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              {!unidadeCarregada
                ? "Carregando unidade..."
                : salvando
                  ? "Salvando..."
                  : `Cadastrar equipamento · ${unidadeAtiva}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}