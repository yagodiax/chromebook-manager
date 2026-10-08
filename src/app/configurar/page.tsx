"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function ConfigurarPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] =
    useState("");
  const [erro, setErro] = useState("");

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setErro("");

    if (
      !nome.trim() ||
      !usuario.trim() ||
      !senha
    ) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (senha.length < 6) {
      setErro(
        "A senha deve ter pelo menos 6 caracteres."
      );
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }

    const administrador = {
      nome: nome.trim(),
      usuario: usuario.trim(),
      senha,
      ativo: true,
    };

    localStorage.setItem(
      "chromebook-manager-users",
      JSON.stringify([administrador])
    );

    router.push("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 text-gray-900 transition-colors dark:bg-[#3a3a3f] dark:text-gray-100">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-colors dark:border-[#5a5a60] dark:bg-[#444449]">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Chromebook Manager
          </h1>

          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Configure o primeiro administrador
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200">
              Nome
            </label>

            <input
              type="text"
              value={nome}
              onChange={(event) =>
                setNome(event.target.value)
              }
              placeholder="Nome completo"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300 dark:focus:ring-gray-700"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200">
              Nome de usuário
            </label>

            <input
              type="text"
              value={usuario}
              onChange={(event) =>
                setUsuario(event.target.value)
              }
              placeholder="Ex.: administrador"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300 dark:focus:ring-gray-700"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200">
              Senha
            </label>

            <input
              type="password"
              value={senha}
              onChange={(event) =>
                setSenha(event.target.value)
              }
              placeholder="Mínimo de 6 caracteres"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300 dark:focus:ring-gray-700"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200">
              Confirmar senha
            </label>

            <input
              type="password"
              value={confirmarSenha}
              onChange={(event) =>
                setConfirmarSenha(
                  event.target.value
                )
              }
              placeholder="Digite a senha novamente"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 dark:border-[#606066] dark:bg-[#303034] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300 dark:focus:ring-gray-700"
            />
          </div>

          {erro && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-[#684545] dark:bg-[#4a3838] dark:text-red-200">
              {erro}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-[#f4f4f5] dark:text-gray-900 dark:hover:bg-white"
          >
            Criar administrador
          </button>
        </form>
      </div>
    </main>
  );
}