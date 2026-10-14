"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const TIPOS = [
  { valor: "chromebook", nome: "Chromebook" },
  { valor: "notebook", nome: "Notebook" },
  { valor: "projetor", nome: "Projetor" },
  { valor: "catraca", nome: "Catraca" },
  { valor: "impressora", nome: "Impressora" },
] as const;
type Tipo = (typeof TIPOS)[number]["valor"];
type Equipamento = {
  id: string; patrimonio: string; tipo: Tipo; fabricante: string; modelo: string;
  numeroSerie: string; localizacao: string; status: string; observacoes: string;
  detalhes: Record<string, unknown>;
};

const campo = "w-full rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-500/15 dark:border-[#55555c] dark:bg-[#333338] dark:text-gray-100";
const rotulo = "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300";

export default function EditarEquipamentoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [equipamento, setEquipamento] = useState<Equipamento | null>(null);
  const [patrimonio, setPatrimonio] = useState("");
  const [tipo, setTipo] = useState<Tipo>("chromebook");
  const [fabricante, setFabricante] = useState("");
  const [modelo, setModelo] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [status, setStatus] = useState("disponivel");
  const [observacoes, setObservacoes] = useState("");
  const [detalhes, setDetalhes] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const resposta = await fetch("/api/equipamentos", { cache: "no-store", credentials: "same-origin" });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.erro || "Não foi possível carregar o equipamento.");
        const encontrado = (dados as Equipamento[]).find((item) => item.id === params.id);
        if (!encontrado) throw new Error("Equipamento não encontrado.");
        if (!ativo) return;
        setEquipamento(encontrado);
        setPatrimonio(encontrado.patrimonio || "");
        setTipo(encontrado.tipo);
        setFabricante(encontrado.fabricante || "");
        setModelo(encontrado.modelo || "");
        setNumeroSerie(encontrado.numeroSerie || "");
        setLocalizacao(encontrado.localizacao || "");
        setStatus(encontrado.status || "disponivel");
        setObservacoes(encontrado.observacoes || "");
        setDetalhes(Object.fromEntries(Object.entries(encontrado.detalhes || {}).map(([k, v]) => [k, v == null ? "" : String(v)])));
      } catch (e) {
        if (ativo) setErro(e instanceof Error ? e.message : "Erro ao carregar equipamento.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    void carregar();
    return () => { ativo = false; };
  }, [params.id]);

  function alterarTipo(novo: Tipo) {
    setTipo(novo);
  }

  function campoDetalhe(chave: string, nome: string, placeholder = "") {
    return <div key={chave}><label className={rotulo} htmlFor={chave}>{nome}</label><input id={chave} className={campo} value={detalhes[chave] ?? ""} placeholder={placeholder} onChange={(e) => setDetalhes((atual) => ({ ...atual, [chave]: e.target.value }))} /></div>;
  }

  async function salvar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (salvando) return;
    setSalvando(true); setErro("");
    try {
      const resposta = await fetch(`/api/equipamentos/${encodeURIComponent(params.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ patrimonio, tipo, fabricante, modelo, numeroSerie, localizacao, status, observacoes, detalhes }),
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível salvar as alterações.");
      router.push(tipo === "impressora" ? "/impressoras" : "/equipamentos");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar as alterações.");
    } finally {
      setSalvando(false);
    }
  }

  const tituloTipo = TIPOS.find((item) => item.valor === tipo)?.nome || "Equipamento";

  return <div className="min-h-screen bg-gray-100 p-5 sm:p-8 dark:bg-[#3a3a3f]"><div className="mx-auto max-w-5xl">
    <button type="button" onClick={() => router.back()} className="mb-5 text-sm font-medium text-gray-600 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white">← Voltar</button>
    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Inventário</p>
    <h1 className="mt-2 text-3xl font-bold text-gray-950 dark:text-white">Editar {tituloTipo}</h1>
    <p className="mt-2 mb-8 text-gray-600 dark:text-gray-300">Altere os dados do equipamento e salve as mudanças.</p>
    {carregando ? <p className="rounded-2xl bg-white p-6 dark:bg-[#444449]">Carregando dados do equipamento...</p> : erro && !equipamento ? <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{erro}</div> : equipamento && <form onSubmit={salvar} className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7 dark:border-[#505057] dark:bg-[#444449]">
        <h2 className="text-lg font-semibold text-gray-950 dark:text-white">Identificação e localização</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div><label className={rotulo} htmlFor="patrimonio">Patrimônio / identificação</label><input id="patrimonio" className={campo} value={patrimonio} onChange={(e) => setPatrimonio(e.target.value)} /></div>
          <div><label className={rotulo} htmlFor="tipo">Tipo</label><select id="tipo" className={campo} value={tipo} onChange={(e) => alterarTipo(e.target.value as Tipo)}>{TIPOS.map((item) => <option key={item.valor} value={item.valor}>{item.nome}</option>)}</select></div>
          <div><label className={rotulo} htmlFor="fabricante">Fabricante</label><input id="fabricante" className={campo} value={fabricante} onChange={(e) => setFabricante(e.target.value)} /></div>
          <div><label className={rotulo} htmlFor="modelo">Modelo</label><input id="modelo" className={campo} value={modelo} onChange={(e) => setModelo(e.target.value)} /></div>
          <div><label className={rotulo} htmlFor="numeroSerie">Número de série</label><input id="numeroSerie" className={campo} value={numeroSerie} onChange={(e) => setNumeroSerie(e.target.value)} /></div>
          <div><label className={rotulo} htmlFor="localizacao">Sala / setor / localização</label><input id="localizacao" className={campo} value={localizacao} onChange={(e) => setLocalizacao(e.target.value)} /></div>
          <div><label className={rotulo} htmlFor="status">Status</label><select id="status" className={campo} value={status} onChange={(e) => setStatus(e.target.value)}><option value="disponivel">Disponível</option><option value="em-uso">Em uso</option><option value="em-reparo">Em reparo</option><option value="inativo">Inativo</option><option value="para-descarte">Para descarte</option></select></div>
        </div>
      </section>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7 dark:border-[#505057] dark:bg-[#444449]">
        <h2 className="text-lg font-semibold text-gray-950 dark:text-white">Dados específicos — {tituloTipo}</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {tipo === "chromebook" && <>{campoDetalhe("numeroChromebook", "Número do Chromebook", "Ex.: 17")}{campoDetalhe("mac", "Endereço MAC", "AA:BB:CC:DD:EE:FF")}</>}
          {tipo === "notebook" && <>{campoDetalhe("processador", "Processador", "Ex.: Intel Core i5")}{campoDetalhe("memoriaRam", "Memória RAM", "Ex.: 8 GB")}{campoDetalhe("armazenamento", "Armazenamento", "Ex.: SSD 256 GB")}{campoDetalhe("sistemaOperacional", "Sistema operacional", "Ex.: Windows 11")}</>}
          {tipo === "projetor" && <>{campoDetalhe("tecnologia", "Tecnologia", "Ex.: DLP, LCD, LED")}{campoDetalhe("conexoes", "Conexões", "Ex.: HDMI, VGA, USB")}</>}
          {tipo === "catraca" && <>{campoDetalhe("tipoControle", "Tipo de controle", "Ex.: biometria, cartão, facial")}{campoDetalhe("fabricanteControladora", "Fabricante/controladora", "Fabricante do sistema de controle")}</>}
          {tipo === "impressora" && <>{campoDetalhe("tecnologiaImpressao", "Tecnologia de impressão", "Ex.: laser, jato de tinta")}{campoDetalhe("conexao", "Conexão / rede", "Ex.: 192.168.1.50 (CORPORATIVO), USB")}{campoDetalhe("enderecoIp", "Endereço IP", "Ex.: 192.168.1.50")}{campoDetalhe("mac", "Endereço MAC", "AA:BB:CC:DD:EE:FF")}{campoDetalhe("paginasImpressas", "Páginas impressas", "Ex.: 60399")}{campoDetalhe("dataInstalacao", "Data de instalação", "AAAA-MM-DD")}</>}
        </div>
      </section>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7 dark:border-[#505057] dark:bg-[#444449]"><label className={rotulo} htmlFor="observacoes">Observações</label><textarea id="observacoes" rows={4} className={campo} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} /></section>
      {erro && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{erro}</div>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => router.back()} className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200 dark:border-[#5a5a61] dark:text-gray-200 dark:hover:bg-[#505057]">Cancelar</button><button type="submit" disabled={salvando} className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-60 dark:bg-white dark:text-gray-900">{salvando ? "Salvando..." : "Salvar alterações"}</button></div>
    </form>}
  </div></div>;
}
