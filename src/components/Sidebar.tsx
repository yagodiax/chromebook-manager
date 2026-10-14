"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [nome, setNome] = useState("Administrador");
  const [saindo, setSaindo] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancelado = false;
    async function carregarUsuario() {
      try {
        const resposta = await fetch("/api/auth/me", { cache: "no-store" });
        if (!resposta.ok) return;
        const dados = await resposta.json();
        if (!cancelado && dados.usuario?.nome) setNome(dados.usuario.nome);
      } catch { /* Sessão verificada pelo AuthGuard. */ }
    }
    void carregarUsuario();
    return () => { cancelado = true; };
  }, []);

  const links = [
    { href: "/", label: "Dashboard", icon: "▦", active: pathname === "/" },
    { href: "/chromebooks", label: "Chromebooks", icon: "▣", active: pathname.startsWith("/chromebooks") },
    { href: "/notebooks", label: "Notebooks", icon: "▱", active: pathname.startsWith("/notebooks") },
    { href: "/projetores", label: "Projetores", icon: "◉", active: pathname.startsWith("/projetores") },
    { href: "/catracas", label: "Catracas", icon: "↔", active: pathname.startsWith("/catracas") },
    { href: "/impressoras", label: "Impressoras", icon: "▤", active: pathname.startsWith("/impressoras") },
    { href: "/equipamentos", label: "Todos os equipamentos", icon: "▦", active: pathname === "/equipamentos" },
    { href: "/cadastros", label: "Cadastros", icon: "＋", active: pathname === "/cadastros" },
    { href: "/historico", label: "Histórico", icon: "◷", active: pathname.startsWith("/historico") },
    { href: "/relatorios/gastos", label: "Relatório de gastos", icon: "↗", active: pathname.startsWith("/relatorios") },
    { href: "/usuarios", label: "Usuários", icon: "♙", active: pathname.startsWith("/usuarios") },
  ];

  async function sair() {
    setErro("");
    setSaindo(true);
    try {
      const resposta = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      if (!resposta.ok) { setErro("Não foi possível sair. Tente novamente."); setSaindo(false); return; }
      router.replace("/login");
      router.refresh();
    } catch { setErro("Erro de conexão ao tentar sair."); setSaindo(false); }
  }

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-60 flex-col border-r border-teal-900/20 bg-[#e8f6f3] text-slate-800 transition-colors dark:border-[#26464b] dark:bg-[#14262d] dark:text-slate-100">
      <div className="border-b border-teal-900/10 bg-gradient-to-br from-teal-100/70 to-cyan-50/40 px-5 py-6 dark:border-[#26464b] dark:from-[#173b3d] dark:to-[#172c38]">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-lg font-black text-white shadow-lg shadow-teal-900/15">CM</div>
        <h1 className="text-base font-extrabold tracking-tight text-teal-950 dark:text-teal-100">Chromebook Manager</h1>
        <p className="mt-1 text-xs text-teal-800/70 dark:text-teal-200/60">Central de equipamentos</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-teal-900/45 dark:text-teal-100/40">Menu principal</p>
        <div className="space-y-1">
          {links.map((item) => (
            <Link key={item.href} href={item.href} aria-current={item.active ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition-all duration-150 ${item.active
                ? "border-teal-600/15 bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-900/15"
                : "border-transparent text-slate-600 hover:border-teal-700/10 hover:bg-white/80 hover:text-teal-900 dark:text-slate-300 dark:hover:bg-[#203b43] dark:hover:text-teal-100"}`}>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-base ${item.active ? "bg-white/15 text-white" : "bg-teal-700/5 text-teal-800 group-hover:bg-teal-600/10 dark:bg-white/5 dark:text-teal-200"}`}>{item.icon}</span>
              <span>{item.label}</span>
              {item.active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />}
            </Link>
          ))}
          <Link href="/cadastros/equipamentos/novo" className="ml-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-teal-800 transition hover:bg-teal-100 dark:text-teal-200 dark:hover:bg-[#203b43]">＋ Cadastrar equipamento</Link>
        </div>
      </nav>
      <div className="px-3 pb-3"><ThemeToggle /></div>
      <div className="border-t border-teal-900/10 p-3 dark:border-[#26464b]">
        <div className="mb-2 flex items-center gap-3 rounded-xl border border-teal-900/10 bg-white/70 px-3 py-3 dark:border-[#2b4a50] dark:bg-[#1b323a]">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-sm font-bold text-white">{(nome.trim()[0] || "A").toUpperCase()}</div>
          <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800 dark:text-white">{nome}</p><p className="mt-0.5 text-[11px] text-teal-800/70 dark:text-teal-200/60">Administrador</p></div>
        </div>
        {erro && <p className="mb-2 text-xs text-red-600 dark:text-red-300">{erro}</p>}
        <button type="button" onClick={sair} disabled={saindo} className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-200">{saindo ? "Saindo..." : "↪ Sair da conta"}</button>
      </div>
    </aside>
  );
}