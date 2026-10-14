-- Chromebook Manager
-- Etapa 2: histórico unificado para todos os tipos de equipamento.
-- Não remove nem altera as tabelas antigas.

CREATE TABLE IF NOT EXISTS historico_equipamentos (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  equipamento_id VARCHAR(100) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  categoria VARCHAR(80) NULL,
  data_ocorrencia DATE NOT NULL,
  descricao TEXT NOT NULL,
  observacao TEXT NULL,
  quem_realizou VARCHAR(150) NULL,
  custo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  destino_reparo VARCHAR(200) NULL,
  resultado TEXT NULL,
  status_final VARCHAR(40) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_historico_equipamento (equipamento_id),
  KEY idx_historico_data (data_ocorrencia),
  KEY idx_historico_tipo (tipo),
  CONSTRAINT fk_historico_equipamento
    FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS historico_equipamento_anexos (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  historico_id VARCHAR(100) NOT NULL,
  nome_arquivo VARCHAR(255) NOT NULL,
  tipo_mime VARCHAR(150) NULL,
  tamanho_bytes BIGINT NULL,
  conteudo_base64 MEDIUMTEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_historico_anexos_registro (historico_id),
  CONSTRAINT fk_historico_anexo_registro
    FOREIGN KEY (historico_id) REFERENCES historico_equipamentos(id)
    ON DELETE CASCADE
);
