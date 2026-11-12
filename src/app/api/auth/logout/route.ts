import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { encerrarSessao } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("cm_session")?.value;

    if (token) {
      await encerrarSessao(token);
    }

    const resposta = NextResponse.json(
      { sucesso: true },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );

    resposta.cookies.set("cm_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    return resposta;
  } catch (error) {
    console.error("Erro ao encerrar sessão:", error);

    return NextResponse.json(
      { erro: "Não foi possível encerrar a sessão." },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}