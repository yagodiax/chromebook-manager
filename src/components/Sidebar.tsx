
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
        const resposta = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!resposta.ok) return;

        const dados = await resposta.json();

        if (!cancelado && dados.usuario?.nome) {
          setNome(dados.usuario.nome);
        }
      } catch {
        // A verificação principal da sessão é feita pelo AuthGuard.
      }
    }

    carregarUsuario();

    return () => {
      cancelado = true;
    };
  }, []);

  const dashboardAtivo = pathname === "/";

  const chromebooksAtivo =
    pathname === "/chromebooks" ||
    pathname.startsWith("/chromebooks/");

  const relatoriosAtivo =
    pathname === "/relatorios/gastos" ||
    pathname.startsWith("/relatorios/");

  const usuariosAtivo =
    pathname === "/usuarios" ||
    pathname.startsWith("/usuarios/");

  async function sair() {
    setErro("");
    setSaindo(true);

    try {
      const resposta = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!resposta.ok) {
        setErro("Não foi possível sair. Tente novamente.");
        setSaindo(false);
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setErro("Erro de conexão ao tentar sair.");
      setSaindo(false);
    }
  }

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-60 flex-col border-r border-gray-300 bg-gray-100 text-gray-900 transition-colors dark:border-[#3d3d42] dark:bg-[#29292d] dark:text-gray-100">
      <div className="border-b border-gray-300 px-6 py-6 dark:border-[#3d3d42]">
        <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Chromebook Manager
        </h1>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Sistema de gerenciamento
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-1">
          <Link
            href="/"
            className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition ${
              dashboardAtivo
                ? "bg-gray-200 text-gray-900 dark:bg-[#505057] dark:text-white"
                : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#3d3d42] dark:hover:text-gray-100"
            }`}
          >
            Dashboard
          </Link>

          <Link
            href="/chromebooks"
            className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition ${
              chromebooksAtivo
                ? "bg-gray-200 text-gray-900 dark:bg-[#505057] dark:text-white"
                : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#3d3d42] dark:hover:text-gray-100"
            }`}
          >
            Chromebooks
          </Link>

          <Link
            href="/chromebooks/novo"
            className={`ml-4 block rounded-lg px-4 py-2.5 text-sm transition ${
              pathname === "/chromebooks/novo"
                ? "bg-gray-200 font-medium text-gray-900 dark:bg-[#505057] dark:text-white"
                : "text-gray-500 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-500 dark:hover:bg-[#3d3d42] dark:hover:text-gray-100"
            }`}
          >
            + Novo Chromebook
          </Link>

          <Link
            href="/relatorios/gastos"
            className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition ${
              relatoriosAtivo
                ? "bg-gray-200 text-gray-900 dark:bg-[#505057] dark:text-white"
                : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#3d3d42] dark:hover:text-gray-100"
            }`}
          >
            Relatório de gastos
          </Link>

          <div className="my-4 border-t border-gray-300 dark:border-[#3d3d42]" />

          <Link
            href="/usuarios"
            className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition ${
              usuariosAtivo
                ? "bg-gray-300 text-gray-900 dark:bg-[#505057] dark:text-white"
                : "text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#3d3d42] dark:hover:text-gray-100"
            }`}
          >
            Usuários
          </Link>
        </div>
      </nav>

      <div className="px-3 pb-3">
        <ThemeToggle />
      </div>

      <div className="border-t border-gray-300 p-4 dark:border-[#3d3d42]">
        <div className="mb-3 rounded-lg bg-gray-200 px-4 py-3 dark:bg-[#3d3d42]">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
            {nome}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Administrador
          </p>
        </div>

        {erro && (
          <p className="mb-2 text-xs text-red-600 dark:text-red-300">
            {erro}
          </p>
        )}

        <button
          type="button"
          onClick={sair}
          disabled={saindo}
          className="w-full rounded-lg px-4 py-2.5 text-left text-sm text-gray-600 transition hover:bg-gray-300 hover:text-gray-900 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-[#3d3d42] dark:hover:text-gray-100"
        >
          {saindo ? "Saindo..." : "Sair"}
        </button>
      </div>
    </aside>
  );
}
