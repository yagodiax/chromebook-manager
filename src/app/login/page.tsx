"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setErro("");
    if (!usuario.trim()) { setErro("Informe seu nome de usuário."); return; }
    setCarregando(true);
    try {
      const resposta = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ usuario: usuario.trim(), senha }) });
      const dados = await resposta.json();
      if (resposta.status === 428 && dados.primeiroAcesso) { router.push("/primeiro-acesso?usuario=" + encodeURIComponent(usuario.trim().toLowerCase())); return; }
      if (!resposta.ok) { setErro(dados.erro || "Não foi possível fazer login."); return; }
      router.push("/"); router.refresh();
    } catch { setErro("Não foi possível conectar ao servidor. Tente novamente."); }
    finally { setCarregando(false); }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-white to-sky-100 px-4 transition-colors dark:from-[#111b22] dark:via-[#14262d] dark:to-[#172c38]">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-teal-100 bg-white shadow-2xl shadow-teal-900/10 transition-colors dark:border-[#2b454c] dark:bg-[#1c2a33]">
        <div className="bg-gradient-to-br from-teal-600 via-cyan-700 to-blue-700 px-8 py-8 text-white"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-lg font-black">CM</div><h1 className="text-center text-2xl font-black tracking-tight">Chromebook Manager</h1><p className="mt-2 text-center text-sm text-cyan-50">Entre com sua conta para continuar</p></div>
        <form onSubmit={handleSubmit} className="space-y-5 p-8">
          <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Nome de usuário</span><input type="text" value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="Digite seu usuário" autoComplete="username" required disabled={carregando} className="w-full rounded-xl border border-teal-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:opacity-60 dark:border-[#35515a] dark:bg-[#15252d] dark:text-white" /></label>
          <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Senha <span className="font-normal text-slate-400">(se já ativou a conta)</span></span><input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Digite sua senha" autoComplete="current-password" disabled={carregando} className="w-full rounded-xl border border-teal-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:opacity-60 dark:border-[#35515a] dark:bg-[#15252d] dark:text-white" /></label>
          {erro && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{erro}</div>}
          <button type="submit" disabled={carregando} className="w-full rounded-xl bg-gradient-to-r from-teal-600 to-cyan-700 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 disabled:opacity-60">{carregando ? "Verificando..." : "Entrar"}</button>
          <div className="rounded-xl bg-sky-50 px-4 py-3 text-sm leading-5 text-sky-900 dark:bg-sky-950/30 dark:text-sky-200"><strong>Primeiro acesso?</strong> Informe apenas seu usuário e clique em Entrar. Você será direcionado para criar a senha usando o código fornecido pelo administrador.</div>
          <p className="text-center text-xs text-slate-400"><Link href="/primeiro-acesso" className="font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-300">Abrir ativação de conta</Link></p>
        </form>
      </div>
    </main>
  );
}
