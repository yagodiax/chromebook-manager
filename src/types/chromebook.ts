export type ChromebookStatus =
  | "disponivel"
  | "em-uso"
  | "manutencao";

export type Chromebook = {
  id: string;
  patrimonio: string;
  modelo: string;
  numeroSerie: string;
  status: ChromebookStatus;
  usuario: string;
  observacoes: string;
};