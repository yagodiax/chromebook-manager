"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
type Estado = "verificando" | "autenticado" | "erro";
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const router = useRouter();
  const [estado, setEstado] = useState<Estado>("verificando");
  const paginaPublica = pathname === "/login" || pathname === "/configurar" || pathname === "/primeiro-acesso";
  useEffect(() => {
    let cancelado = false;
    if (paginaPublica) { setEstado("autenticado"); return; }
    setEstado("verificando");
    async function verificar() {
      try {
        const resposta = await fetch("/api/auth/me", { method: "GET", credentials: "same-origin", cache: "no-store" });
        if (cancelado) return;
        if (resposta.status === 401) { router.replace("/login"); return; }
        if (!resposta.ok) { setEstado("erro"); return; }
        const dados = await resposta.json();
        if (pathname.startsWith("/usuarios") && dados.usuario?.perfil !== "admin") { router.replace("/"); return; }
        setEstado("autenticado");
      } catch { if (!cancelado) setEstado("erro"); }
    }
    void verificar();
    return () => { cancelado = true; };
  }, [pathname, paginaPublica, router]);
  if (paginaPublica) return <>{children}</>;
  if (estado === "verificando") return <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-[#3a3a3f]"><p className="text-sm text-gray-600 dark:text-gray-300">Verificando sessão...</p></div>;
  if (estado === "erro") return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100 px-4 dark:bg-[#3a3a3f]"><p className="text-sm text-gray-700 dark:text-gray-200">Não foi possível verificar sua sessão.</p><button onClick={() => router.refresh()} className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-gray-900">Tentar novamente</button></div>;
  return <div className="min-h-screen"><Sidebar /><main className="min-h-screen pl-60">{children}</main></div>;
}
