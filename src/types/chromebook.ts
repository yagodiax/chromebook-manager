export type ChromebookStatus =
  | "disponivel"
  | "em-uso"
  | "em-reparo"
  | "retirada-de-pecas";

export type Chromebook = {
  id: string;
  numero: string;
  mac: string;
  numeroSerie: string;
  modelo: string;
  sala: string;
  status: ChromebookStatus;
  observacoes: string;
};