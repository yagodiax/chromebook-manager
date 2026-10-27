import { randomUUID } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { obterUsuarioAutenticado, podeAcessarUnidade } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Unidade = "CE" | "JP";
type APRow = RowDataPacket & { id:string; unidade_id:Unidade; bloco:string; rack:string; marca:string; modelo:string; mac_address:string; potencia_dbm:number; status:string; observacoes:string|null; created_at:string|Date; updated_at:string|Date };
const erro=(mensagem:string,status:number)=>NextResponse.json({erro:mensagem},{status,headers:{"Cache-Control":"no-store"}});
const ehUnidade=(v:unknown):v is Unidade=>v==="CE"||v==="JP";
async function contexto(request:Request) {
 const usuario=await obterUsuarioAutenticado();
 if(!usuario)return {erro:erro("Não autenticado.",401)} as const;
 const p=new URL(request.url).searchParams.get("unidade"), geral=usuario.perfil==="admin_geral"||usuario.perfil==="admin";
 const podeAlternar=geral||usuario.unidade_id==="AMBOS", propria=ehUnidade(usuario.unidade_id)?usuario.unidade_id:"CE";
 if(p&&!ehUnidade(p))return {erro:erro("Unidade inválida.",400)} as const;
 const unidade=podeAlternar?(ehUnidade(p)?p:propria):propria;
 if(!podeAcessarUnidade(usuario,unidade))return {erro:erro("Sem permissão para acessar esta unidade.",403)} as const;
 return {unidade} as const;
}
function validar(b:Record<string,unknown>) {
 const bloco=String(b.bloco??"").trim(),rack=String(b.rack??"").trim(),marca=String(b.marca??"").trim(),modelo=String(b.modelo??"").trim();
 const macAddress=String(b.macAddress??"").trim().toUpperCase().replace(/-/g,":"),potenciaDbm=Number(b.potenciaDbm),status=String(b.status??"OK"),observacoes=String(b.observacoes??"").trim()||null;
 if(!bloco||!rack||!marca||!modelo||!macAddress)return {erro:"Preencha bloco, rack, marca, modelo e MAC Address."};
 if(!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(macAddress))return {erro:"MAC inválido. Use AA:BB:CC:DD:EE:FF."};
 if(!Number.isFinite(potenciaDbm)||potenciaDbm<0||potenciaDbm>100)return {erro:"Informe uma potência válida em dBm."};
 if(!["OK","Atenção","Em manutenção","Inativo"].includes(status))return {erro:"Status inválido."};
 return {valores:{bloco,rack,marca,modelo,macAddress,potenciaDbm,status,observacoes}};
}
export async function GET(request:Request) {
 try { const c=await contexto(request);if("erro"in c)return c.erro;
 const [rows]=await pool.execute<APRow[]>("SELECT id,unidade_id,bloco,rack,marca,modelo,mac_address,potencia_dbm,status,observacoes,created_at,updated_at FROM access_points WHERE unidade_id=? ORDER BY bloco,rack,marca,modelo",[c.unidade]);
 return NextResponse.json(rows.map(r=>({id:r.id,unidadeId:r.unidade_id,bloco:r.bloco,rack:r.rack,marca:r.marca,modelo:r.modelo,macAddress:r.mac_address,potenciaDbm:Number(r.potencia_dbm),status:r.status,observacoes:r.observacoes??"",criadoEm:r.created_at,atualizadoEm:r.updated_at})),{headers:{"Cache-Control":"no-store"}});
 } catch(e){console.error("Erro ao listar APs:",e);return erro("Não foi possível carregar os APs. Verifique se a migração SQL foi executada.",500);}
}
export async function POST(request:Request) {
 try {const c=await contexto(request);if("erro"in c)return c.erro;const b:unknown=await request.json();if(!b||typeof b!=="object"||Array.isArray(b))return erro("Dados inválidos.",400);
 const v=validar(b as Record<string,unknown>);if("erro"in v)return erro(v.erro,400);const id="AP-"+randomUUID(),a=v.valores;
 await pool.execute<ResultSetHeader>("INSERT INTO access_points (id,unidade_id,bloco,rack,marca,modelo,mac_address,potencia_dbm,status,observacoes) VALUES (?,?,?,?,?,?,?,?,?,?)",[id,c.unidade,a.bloco,a.rack,a.marca,a.modelo,a.macAddress,a.potenciaDbm,a.status,a.observacoes]);
 return NextResponse.json({id,unidadeId:c.unidade,...a},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(e){if((e as {code?:string}).code==="ER_DUP_ENTRY")return erro("Já existe um AP com esse MAC nesta unidade.",409);console.error("Erro ao cadastrar AP:",e);return erro("Não foi possível cadastrar o AP.",500);}
}
export async function PATCH(request:Request) {
 try {const c=await contexto(request);if("erro"in c)return c.erro;const b:unknown=await request.json();if(!b||typeof b!=="object"||Array.isArray(b))return erro("Dados inválidos.",400);const entrada=b as Record<string,unknown>,id=String(entrada.id??"").trim();if(!id)return erro("ID do AP não informado.",400);
 const v=validar(entrada);if("erro"in v)return erro(v.erro,400);const a=v.valores;
 const [r]=await pool.execute<ResultSetHeader>("UPDATE access_points SET bloco=?,rack=?,marca=?,modelo=?,mac_address=?,potencia_dbm=?,status=?,observacoes=? WHERE id=? AND unidade_id=?",[a.bloco,a.rack,a.marca,a.modelo,a.macAddress,a.potenciaDbm,a.status,a.observacoes,id,c.unidade]);
 if(!r.affectedRows)return erro("AP não encontrado nesta unidade.",404);return NextResponse.json({id,unidadeId:c.unidade,...a},{headers:{"Cache-Control":"no-store"}});
 }catch(e){if((e as {code?:string}).code==="ER_DUP_ENTRY")return erro("Já existe um AP com esse MAC nesta unidade.",409);console.error("Erro ao editar AP:",e);return erro("Não foi possível atualizar o AP.",500);}
}
export async function DELETE(request:Request) {
 try {const c=await contexto(request);if("erro"in c)return c.erro;const id=new URL(request.url).searchParams.get("id")?.trim();if(!id)return erro("ID do AP não informado.",400);
 const [r]=await pool.execute<ResultSetHeader>("DELETE FROM access_points WHERE id=? AND unidade_id=?",[id,c.unidade]);if(!r.affectedRows)return erro("AP não encontrado nesta unidade.",404);return NextResponse.json({sucesso:true},{headers:{"Cache-Control":"no-store"}});
 }catch(e){console.error("Erro ao excluir AP:",e);return erro("Não foi possível excluir o AP.",500);}
}
