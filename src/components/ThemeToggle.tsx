"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [carregado, setCarregado] = useState(false);
  useEffect(() => {
    const temaEscuro = localStorage.getItem("chromebook-theme") === "dark";
    document.documentElement.classList.toggle("dark", temaEscuro);
    setDark(temaEscuro);
    setCarregado(true);
  }, []);
  function alternarTema() {
    const novoTema = !dark;
    document.documentElement.classList.toggle("dark", novoTema);
    localStorage.setItem("chromebook-theme", novoTema ? "dark" : "light");
    setDark(novoTema);
  }
  if (!carregado) return <span aria-hidden="true" className="h-10 w-10 shrink-0" />;
  return (
    <button type="button" onClick={alternarTema}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-lg text-gray-700 transition hover:bg-gray-200 hover:text-gray-950 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white"
      title={dark ? "Ativar modo claro" : "Ativar modo escuro"}
      aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}>
      <span aria-hidden="true">{dark ? "☀️" : "🌙"}</span>
    </button>
  );
}
