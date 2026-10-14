"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
export default function Sidebar() {
  const pathname = usePathname(); const router = useRouter();
  const [nome, setNome] = useState("Usuário"); const [perfil, setPerfil] = useState("usuario");
  const [saindo, setSaindo] = useState(false); const [erro, setErro] = useState("");
  useEffect(() => {
    let cancelado = false;
    async function carregarUsuario() {
      try {
        const resposta = await fetch("/api/auth/me", { cache: "no-store" });
        if (!resposta.ok) return;
        const dados = await resposta.json();
        if (cancelado) return;
        if (dados.usuario?.nome) setNome(dados.usuario.nome);
        if (dados.usuario?.perfil) setPerfil(dados.usuario.perfil);
      } catch { /* Sessão verificada pelo AuthGuard. */ }
    }
    void carregarUsuario(); return () => { cancelado = true; };
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
    ...(perfil === "admin" ? [{ href: "/usuarios", label: "Usuários", icon: "♙", active: pathname.startsWith("/usuarios") }] : []),
  ];
  async function sair() {
    setErro(""); setSaindo(true);
    try {
      const resposta = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      if (!resposta.ok) { setErro("Não foi possível sair. Tente novamente."); setSaindo(false); return; }
      router.replace("/login"); router.refresh();
    } catch { setErro("Erro de conexão ao tentar sair."); setSaindo(false); }
  }
  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-60 flex-col border-r border-gray-300 bg-[#e2e2e2] text-gray-800 transition-colors dark:border-[#555555] dark:bg-[#292929] dark:text-gray-100">
      <div className="border-b border-gray-300 bg-[#e2e2e2] px-5 py-6 dark:border-[#555555] dark:bg-[#292929]">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-lg font-bold text-amber-300 dark:border-gray-500 dark:bg-gray-900 dark:text-amber-300">CM</div>
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">Chromebook Manager</h1>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Central de equipamentos</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4"><p className="mb-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Menu principal</p><div className="space-y-1">
        {links.map((item) => <Link key={item.href} href={item.href} aria-current={item.active ? "page" : undefined} className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition-all duration-150 ${item.active ? "border-gray-400 bg-gray-300 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" : "border-transparent text-gray-700 hover:border-gray-300 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-base ${item.active ? "bg-gray-400/30 text-gray-900 dark:bg-gray-600 dark:text-white" : "bg-gray-300 text-gray-700 group-hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-200"}`}>{item.icon}</span><span>{item.label}</span>{item.active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />}</Link>)}
        <Link href="/cadastros/equipamentos/novo" className="ml-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700">＋ Cadastrar equipamento</Link>
      </div></nav>
      <div className="px-3 pb-3"><ThemeToggle /></div>
      <div className="border-t border-gray-300 p-3 dark:border-gray-600"><div className="mb-2 flex items-center gap-3 rounded-lg border border-gray-300 bg-gray-100 px-3 py-3 dark:border-gray-600 dark:bg-gray-800"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-300 text-sm font-semibold text-gray-800 dark:bg-gray-600 dark:text-white">{(nome.trim()[0] || "U").toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{nome}</p><p className="mt-0.5 text-[11px] text-gray-600 dark:text-gray-400">{perfil === "admin" ? "Administrador" : "Usuário"}</p></div></div>
        {erro && <p className="mb-2 text-xs text-red-600 dark:text-red-300">{erro}</p>}<button type="button" onClick={sair} disabled={saindo} className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-gray-600 transition hover:bg-gray-200 hover:text-gray-900 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">{saindo ? "Saindo..." : "↪ Sair da conta"}</button>
      </div>
    </aside>
  );
}
