"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    const temaSalvo = localStorage.getItem(
      "chromebook-theme"
    );

    if (temaSalvo === "dark") {
      document.documentElement.classList.add("dark");
      setDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setDark(false);
    }

    setCarregado(true);
  }, []);

  function alternarTema() {
    const novoTema = !dark;

    if (novoTema) {
      document.documentElement.classList.add("dark");
      localStorage.setItem(
        "chromebook-theme",
        "dark"
      );
    } else {
      document.documentElement.classList.remove(
        "dark"
      );
      localStorage.setItem(
        "chromebook-theme",
        "light"
      );
    }

    setDark(novoTema);
  }

  if (!carregado) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={alternarTema}
      className="
        fixed
        right-6
        top-6
        z-50
        flex
        h-11
        w-11
        items-center
        justify-center
        rounded-xl
        border
        border-gray-200
        bg-white
        text-gray-700
        shadow-sm
        transition
        hover:bg-gray-100
        dark:border-[#5a5a60]
        dark:bg-[#444449]
        dark:text-gray-100
        dark:hover:bg-[#505057]
      "
      title={
        dark
          ? "Ativar modo claro"
          : "Ativar modo escuro"
      }
      aria-label={
        dark
          ? "Ativar modo claro"
          : "Ativar modo escuro"
      }
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}