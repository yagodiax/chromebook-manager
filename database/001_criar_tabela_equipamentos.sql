-- Chromebook Manager
-- Etapa 1: estrutura universal de equipamentos.
-- Este script NAO apaga nem altera as tabelas antigas.
-- Execute no banco TiDB Cloud conectado ao projeto.

CREATE TABLE IF NOT EXISTS equipamentos (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  patrimonio VARCHAR(100) NULL,
  tipo VARCHAR(40) NOT NULL,
  fabricante VARCHAR(150) NULL,
  modelo VARCHAR(150) NULL,
  numero_serie VARCHAR(150) NULL,
  localizacao VARCHAR(150) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'disponivel',
  observacoes TEXT NULL,
  detalhes JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_equipamentos_patrimonio (patrimonio),
  KEY idx_equipamentos_tipo (tipo),
  KEY idx_equipamentos_status (status),
  KEY idx_equipamentos_localizacao (localizacao)
);
