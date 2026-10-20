"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Equipamento = { id: string; patrimonio: string; tipo: string; fabricante: string; modelo: string; numeroSerie: string; localizacao: string; status: string; observacoes: string; detalhes: Record<string, unknown> };
type Registro = { id: string; equipamentoId: string; tipo: string; categoria: string; data: string; descricao: string; observacao: string; quemRealizou: string; custo: number; destinoReparo: string; resultado: string };
const TIPOS: Record<string,string> = { chromebook:"Chromebook", notebook:"Notebook", projetor:"Projetor", catraca:"Catraca", impressora:"Impressora" };
const REGISTROS: Record<string,string> = { ocorrencia:"Ocorrência", manutencao:"Manutenção", "reposicao-de-peca":"Reposição de peça", "envio-para-reparo":"Envio para reparo", "retorno-de-reparo":"Retorno do reparo" };
const STATUS: Record<string,string> = { disponivel:"Disponível", "em-uso":"Em uso", reserva:"Reserva", reservado:"Reservado", "em-reparo":"Em reparo", "em-manutencao":"Em manutenção", manutencao:"Em manutenção", inativo:"Inativo", "para-descarte":"Para descarte", "retirada-de-pecas":"Retirada de peças" };
function classeStatus(status:string) {
 if (status === "disponivel") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200";
 if (status === "em-uso") return "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200";
 if (status === "reserva" || status === "reservado") return "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200";
 if (status === "em-reparo" || status === "em-manutencao" || status === "manutencao") return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200";
 return "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200";
}
const campo = "text-sm text-gray-500 dark:text-gray-400";
function moeda(n:number) { return n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); }
function dataBR(v:string) { const p=(v||"").slice(0,10).split("-"); return p.length===3 ? p[2]+"/"+p[1]+"/"+p[0] : v || "—"; }

export default function DetalhesEquipamentoPage() {
 const params=useParams<{id:string}>(); const router=useRouter();
 const [equipamento,setEquipamento]=useState<Equipamento|null>(null);
 const [historico,setHistorico]=useState<Registro[]>([]);
 const [carregando,setCarregando]=useState(true); const [erro,setErro]=useState("");
 useEffect(()=>{let ativo=true; async function carregar(){try{
  const [er,hr]=await Promise.all([
   fetch("/api/equipamentos",{cache:"no-store",credentials:"same-origin"}),
   fetch("/api/historico-equipamentos?equipamentoId="+encodeURIComponent(params.id),{cache:"no-store",credentials:"same-origin"})
  ]);
  const [ed,hd]=await Promise.all([er.json().catch(()=>[]),hr.json().catch(()=>[])]);
  if(!er.ok) throw new Error(ed.erro||"Não foi possível carregar o equipamento.");
  if(!hr.ok) throw new Error(hd.erro||"Não foi possível carregar as manutenções.");
  const achado=(ed as Equipamento[]).find(x=>x.id===params.id);
  if(!achado) throw new Error("Equipamento não encontrado.");
  if(ativo){setEquipamento(achado);setHistorico(Array.isArray(hd)?hd:[]);}
 }catch(e){if(ativo)setErro(e instanceof Error?e.message:"Erro ao carregar detalhes.");}finally{if(ativo)setCarregando(false);}}
 void carregar(); return ()=>{ativo=false;};},[params.id]);
 const total=historico.filter(x=>x.tipo==="retorno-de-reparo").reduce((s,x)=>s+(Number(x.custo)||0),0);
 return <main className="min-h-screen bg-gray-100 p-5 sm:p-8 dark:bg-[#3a3a3f]"><div className="mx-auto max-w-6xl">
  <button onClick={()=>router.push("/equipamentos")} className="mb-5 text-sm font-semibold text-gray-600 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white">← Voltar para equipamentos</button>
  {carregando?<div className="rounded-2xl bg-white p-8 dark:bg-[#444449]">Carregando detalhes...</div>:erro||!equipamento?<div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-5 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{erro||"Equipamento não encontrado."}</div>:<>
   <header className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center dark:border-[#505057] dark:bg-[#444449]"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-gray-500 dark:text-gray-400">{TIPOS[equipamento.tipo]||equipamento.tipo} · Detalhes do patrimônio</p><h1 className="mt-2 text-3xl font-bold text-gray-950 dark:text-white">{equipamento.patrimonio||equipamento.id}</h1><p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{[equipamento.fabricante,equipamento.modelo].filter(Boolean).join(" ")||"Modelo não informado"} · {equipamento.localizacao||"Localização não informada"}</p></div><Link href={"/cadastros/equipamentos/"+encodeURIComponent(equipamento.id)+"/editar"} className="rounded-xl bg-gray-900 px-5 py-3 text-center text-sm font-semibold text-white dark:bg-white dark:text-gray-900">Editar equipamento</Link></header>
   <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[{label:"Status",value:STATUS[equipamento.status]||equipamento.status},{label:"Registros de manutenção",value:String(historico.length)},{label:"Reparos concluídos",value:String(historico.filter(x=>x.tipo==="retorno-de-reparo").length)},{label:"Total gasto em reparos",value:moeda(total)}].map(x=><article key={x.label} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-[#505057] dark:bg-[#444449]"><p className={campo}>{x.label}</p>{x.label==="Status"?<p className="mt-2"><span className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${classeStatus(equipamento.status)}`}>{x.value}</span></p>:<p className="mt-2 text-xl font-bold text-gray-950 dark:text-white">{x.value}</p>}</article>)}</section>
   <section className="mt-5 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-[#505057] dark:bg-[#444449]"><div className="border-b border-gray-200 p-5 dark:border-[#55555c]"><h2 className="text-xl font-bold text-gray-950 dark:text-white">Manutenções realizadas</h2><p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Histórico de ocorrências, manutenções, peças e reparos deste equipamento.</p></div>
   {historico.length===0?<p className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Nenhuma manutenção registrada para este equipamento.</p>:<div className="divide-y divide-gray-200 dark:divide-gray-600">{historico.map(item=><article key={item.id} className="p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-[#333338] dark:text-gray-200">{REGISTROS[item.tipo]||item.tipo}</span><span className="text-xs text-gray-500 dark:text-gray-400">{dataBR(item.data)}</span>{item.categoria&&<span className="text-xs text-gray-500 dark:text-gray-400">· {item.categoria}</span>}</div><p className="mt-3 whitespace-pre-wrap font-semibold text-gray-900 dark:text-white">{item.descricao}</p>{item.observacao&&<p className="mt-2 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">Observação: {item.observacao}</p>}{item.resultado&&<p className="mt-2 text-sm text-gray-600 dark:text-gray-300"><strong>Resultado:</strong> {item.resultado}</p>}{item.destinoReparo&&<p className="mt-2 text-sm text-gray-600 dark:text-gray-300"><strong>Assistência:</strong> {item.destinoReparo}</p>}<p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Responsável: {item.quemRealizou||"Não informado"}</p></div><div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">{item.tipo==="retorno-de-reparo"&&<strong className="text-sm text-gray-900 dark:text-white">{moeda(Number(item.custo)||0)}</strong>}<Link href={"/historico/editar?id="+encodeURIComponent(item.id)} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-[#606066] dark:text-gray-100 dark:hover:bg-[#505057]">Editar registro</Link></div></div></article>)}</div>}</section>
  </>}
 </div></main>;
}
