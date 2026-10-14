-- Chromebook Manager
-- Etapa 1: inventário universal.
-- Esta migração cria uma tabela nova; não apaga nem modifica chromebooks/manutencoes.
-- Execute no TiDB Cloud antes de usar as telas e APIs universais.

CREATE TABLE IF NOT EXISTS equipamentos (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  patrimonio VARCHAR(100) NULL,
  tipo VARCHAR(50) NOT NULL,
  fabricante VARCHAR(150) NULL,
  modelo VARCHAR(150) NULL,
  numero_serie VARCHAR(150) NULL,
  localizacao VARCHAR(150) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'disponivel',
  observacoes TEXT NULL,
  detalhes JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_equipamentos_patrimonio (patrimonio),
  KEY idx_equipamentos_tipo (tipo),
  KEY idx_equipamentos_status (status),
  KEY idx_equipamentos_localizacao (localizacao)
);
