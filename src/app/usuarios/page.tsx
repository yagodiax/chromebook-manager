"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
type Usuario = { id: string; nome: string; usuario: string; perfil: string; ativo: boolean; precisaAtivar: boolean; criadoEm: string; proprioUsuario: boolean; };
type NovoUsuario = { id: string; nome: string; usuario: string; perfil: string; precisaAtivar: boolean; };
const campo = "w-full rounded-xl border border-teal-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-[#35515a] dark:bg-[#15252d] dark:text-white";
function dataBR(valor: string) { if (!valor) return "—"; const data = new Date(valor); return Number.isNaN(data.getTime()) ? valor : data.toLocaleDateString("pt-BR"); }
export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [nome, setNome] = useState(""); const [usuario, setUsuario] = useState("");
  const [carregando, setCarregando] = useState(true); const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(""); const [mensagem, setMensagem] = useState("");
  const [novo, setNovo] = useState<NovoUsuario | null>(null); const [codigo, setCodigo] = useState("");
  const carregar = useCallback(async () => {
    setCarregando(true); setErro("");
    try {
      const resposta = await fetch("/api/usuarios", { cache: "no-store", credentials: "same-origin" });
      const dados = await resposta.json();
      if (resposta.status === 403) { window.location.replace("/"); return; }
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível carregar os usuários.");
      setUsuarios(dados);
    } catch (e) { setErro(e instanceof Error ? e.message : "Falha ao carregar usuários."); }
    finally { setCarregando(false); }
  }, []);
  useEffect(() => { void carregar(); }, [carregar]);
  async function criar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setErro(""); setMensagem(""); setNovo(null); setCodigo(""); setSalvando(true);
    try {
      const resposta = await fetch("/api/usuarios", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ nome, usuario }) });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível criar a conta.");
      setNovo(dados.usuario); setCodigo(dados.codigoPrimeiroAcesso);
      setMensagem("Conta criada. Copie o código de ativação antes de sair desta tela.");
      setNome(""); setUsuario(""); await carregar();
    } catch (e) { setErro(e instanceof Error ? e.message : "Falha ao criar conta."); }
    finally { setSalvando(false); }
  }
  async function excluir(item: Usuario) {
    if (item.proprioUsuario) return;
    if (!window.confirm("Tem certeza que deseja excluir a conta de " + item.nome + " (@" + item.usuario + ")? Essa ação encerra o acesso dessa conta.")) return;
    setErro(""); setMensagem("");
    try {
      const resposta = await fetch("/api/usuarios/" + encodeURIComponent(item.id), { method: "DELETE", credentials: "same-origin" });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível excluir a conta.");
      setMensagem("A conta @" + item.usuario + " foi excluída."); await carregar();
    } catch (e) { setErro(e instanceof Error ? e.message : "Falha ao excluir conta."); }
  }
  async function copiarCodigo() {
    try { await navigator.clipboard.writeText(codigo); setMensagem("Código copiado. Entregue-o ao usuário por um canal privado."); }
    catch { setMensagem("Não foi possível copiar automaticamente. Selecione o código e copie manualmente."); }
  }
  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-7 xl:p-9 dark:bg-[#3a3a3f]"><div className="mx-auto max-w-6xl space-y-6">
      <header className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0d766e] via-[#087f8c] to-[#3656a6] p-6 text-white shadow-xl shadow-teal-950/10 sm:p-8"><div className="pointer-events-none absolute -right-10 -top-20 -z-10 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" /><p className="text-xs font-bold uppercase tracking-[.2em] text-teal-100">Administração · Acesso ao sistema</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Gerenciar usuários</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-cyan-50">Crie e exclua contas sem acessar as senhas. Cada pessoa define sua própria senha no primeiro acesso.</p><div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-white/90"><span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">🔒 Senhas protegidas</span><span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">♙ {usuarios.length} conta(s)</span></div></header>
      {erro && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{erro}</div>}
      {mensagem && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{mensagem}</div>}
      {novo && codigo && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/25"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">Código exibido uma única vez</p><h2 className="mt-1 text-lg font-extrabold text-amber-950 dark:text-amber-100">Conta de {novo.nome} criada</h2><p className="mt-1 text-sm text-amber-900/80 dark:text-amber-200/80">Usuário: <strong>@{novo.usuario}</strong>. Entregue este código diretamente à pessoa para ativar a conta.</p><p className="mt-4 select-all rounded-xl border border-amber-300 bg-white px-4 py-3 font-mono text-2xl font-black tracking-[.25em] text-amber-950 dark:border-amber-800 dark:bg-[#1c2a33] dark:text-amber-100">{codigo}</p></div><button type="button" onClick={copiarCodigo} className="shrink-0 rounded-xl bg-amber-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-amber-800">Copiar código</button></div><button type="button" onClick={() => { setNovo(null); setCodigo(""); }} className="mt-4 text-xs font-bold text-amber-900 underline dark:text-amber-200">Já entreguei o código — ocultar</button></section>}
      <div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
        <section className="h-fit rounded-2xl border border-teal-100 bg-white p-5 shadow-sm sm:p-6 dark:border-[#2b454c] dark:bg-[#1c2a33]"><p className="text-xs font-bold uppercase tracking-[.16em] text-teal-700 dark:text-teal-300">Nova conta</p><h2 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">Cadastrar usuário</h2><p className="mt-2 text-sm leading-5 text-slate-500 dark:text-slate-400">Não defina uma senha. O usuário criará a dele.</p>
          <form onSubmit={criar} className="mt-5 space-y-4"><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Nome completo</span><input className={campo} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Maria Silva" maxLength={150} required /></label><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Nome de usuário</span><input className={campo} value={usuario} onChange={(e) => setUsuario(e.target.value.toLowerCase().replace(/\s/g, ""))} placeholder="Ex.: maria.silva" minLength={3} maxLength={100} pattern="[a-zA-Z0-9._-]+" autoComplete="off" required /><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">Letras sem acento, números, ponto, hífen e underline.</span></label><button type="submit" disabled={salvando} className="w-full rounded-xl bg-gradient-to-r from-teal-600 to-cyan-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 disabled:opacity-60">{salvando ? "Criando conta..." : "＋ Criar conta e gerar código"}</button></form>
        </section>
        <section className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm dark:border-[#2b454c] dark:bg-[#1c2a33]"><div className="flex items-center justify-between gap-3 border-b border-sky-100 bg-gradient-to-r from-sky-50 to-teal-50 px-5 py-5 dark:border-[#2b454c] dark:from-[#1a303a] dark:to-[#183735]"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-sky-700 dark:text-sky-300">Contas cadastradas</p><h2 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">Usuários do sistema</h2></div><button type="button" onClick={() => void carregar()} className="rounded-lg px-3 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 dark:text-teal-200 dark:hover:bg-[#203b43]">↻ Atualizar</button></div>
          {carregando ? <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">Carregando usuários...</div> : usuarios.length === 0 ? <div className="p-10 text-center"><p className="font-bold text-slate-800 dark:text-white">Nenhum usuário encontrado</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Crie a primeira conta para começar.</p></div> : <div className="divide-y divide-slate-100 dark:divide-[#2b454c]">{usuarios.map((item) => <article key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-sm font-black text-white">{(item.nome[0] || "U").toUpperCase()}</div><div className="min-w-0"><p className="truncate font-bold text-slate-900 dark:text-white">{item.nome} {item.proprioUsuario && <span className="ml-1 text-xs font-semibold text-teal-700 dark:text-teal-300">(você)</span>}</p><p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">@{item.usuario}</p><p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Criado em {dataBR(String(item.criadoEm))}</p></div></div><div className="flex flex-wrap items-center gap-2 sm:justify-end"><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${item.perfil === "admin" ? "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200" : "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200"}`}>{item.perfil === "admin" ? "Administrador" : "Usuário"}</span><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${item.precisaAtivar ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"}`}>{item.precisaAtivar ? "Aguardando primeiro acesso" : "Senha configurada"}</span>{!item.proprioUsuario && <button type="button" onClick={() => void excluir(item)} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40">Excluir</button>}</div></article>)}</div>}
        </section>
      </div>
      <p className="px-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Por segurança, o sistema não mostra senhas nem hashes. O código de ativação só aparece no momento da criação e é invalidado quando o usuário define a senha.</p>
    </div></main>
  );
}
