"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    const temaSalvo = localStorage.getItem("chromebook-theme");
    const temaEscuro = temaSalvo === "dark";

    document.documentElement.classList.toggle("dark", temaEscuro);
    setDark(temaEscuro);
    setCarregado(true);
  }, []);

  function alternarTema() {
    const novoTema = !dark;

    document.documentElement.classList.toggle("dark", novoTema);
    localStorage.setItem(
      "chromebook-theme",
      novoTema ? "dark" : "light"
    );

    setDark(novoTema);
  }

  if (!carregado) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={alternarTema}
      className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#3d3d42] dark:hover:text-gray-100"
      title={dark ? "Ativar modo claro" : "Ativar modo escuro"}
      aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      <span>{dark ? "Modo claro" : "Modo escuro"}</span>
      <span className="text-lg" aria-hidden="true">
        {dark ? "☀️" : "🌙"}
      </span>
    </button>
  );
}