"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export default function DetalhesEquipamentoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  useEffect(() => {
    const destino = returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? `/cadastros/equipamentos/${encodeURIComponent(params.id)}/editar?returnTo=${encodeURIComponent(returnTo)}`
      : `/cadastros/equipamentos/${encodeURIComponent(params.id)}/editar`;
    router.replace(destino);
  }, [params.id, returnTo, router]);

  return <main className="min-h-screen bg-gray-100 p-8 dark:bg-[#3a3a3f]"><p className="text-sm text-gray-600 dark:text-gray-300">Abrindo equipamento...</p></main>;
}
