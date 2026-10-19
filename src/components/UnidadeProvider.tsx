"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type UnidadeId = "CE" | "JP";

type UnidadeContexto = {
  unidadeAtiva: UnidadeId;
  setUnidadeAtiva: (unidade: UnidadeId) => void;
  administradorGeral: boolean;
  unidadeCarregada: boolean;
};

const CHAVE_UNIDADE = "chromebook-manager-unidade-ativa";

const UnidadeContext = createContext<UnidadeContexto | null>(null);

function unidadeValida(valor: unknown): valor is UnidadeId {
  return valor === "CE" || valor === "JP";
}

export function UnidadeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [unidadeAtiva, definirUnidade] = useState<UnidadeId>("CE");
  const [administradorGeral, setAdministradorGeral] = useState(false);
  const [unidadeCarregada, setUnidadeCarregada] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function carregarUnidade() {
      try {
        const resposta = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!resposta.ok) return;

        const dados = await resposta.json();
        const usuario = dados.usuario;

        if (!usuario || cancelado) return;

        const geral =
          usuario.administradorGeral === true ||
          usuario.perfil === "admin_geral" ||
          usuario.perfil === "admin";

        setAdministradorGeral(geral);

        const unidadeDoUsuario: UnidadeId = unidadeValida(
          usuario.unidade_id,
        )
          ? usuario.unidade_id
          : "CE";

        if (geral) {
          let unidadeSalva: string | null = null;

          try {
            unidadeSalva = localStorage.getItem(CHAVE_UNIDADE);
          } catch {
            // O sistema continua funcionando sem persistência local.
          }

          definirUnidade(
            unidadeValida(unidadeSalva) ? unidadeSalva : unidadeDoUsuario,
          );
        } else {
          definirUnidade(unidadeDoUsuario);
        }
      } catch (erro) {
        console.error("Erro ao carregar a unidade ativa:", erro);
      } finally {
        if (!cancelado) setUnidadeCarregada(true);
      }
    }

    void carregarUnidade();

    return () => {
      cancelado = true;
    };
  }, []);

  const setUnidadeAtiva = useCallback(
    (unidade: UnidadeId) => {
      if (!unidadeValida(unidade)) return;

      // Usuários comuns e administradores de unidade não podem trocar de unidade.
      if (!administradorGeral) return;

      definirUnidade(unidade);

      try {
        localStorage.setItem(CHAVE_UNIDADE, unidade);
      } catch {
        // A seleção continua ativa até a página ser fechada.
      }
    },
    [administradorGeral],
  );

  return (
    <UnidadeContext.Provider
      value={{
        unidadeAtiva,
        setUnidadeAtiva,
        administradorGeral,
        unidadeCarregada,
      }}
    >
      {children}
    </UnidadeContext.Provider>
  );
}

export function useUnidade() {
  const contexto = useContext(UnidadeContext);

  if (!contexto) {
    throw new Error(
      "useUnidade precisa ser usado dentro de UnidadeProvider.",
    );
  }

  return contexto;
}
