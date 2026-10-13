import mysql from "mysql2/promise";

let connection;

const tables = [
  `
    CREATE TABLE IF NOT EXISTS chromebooks (
      id VARCHAR(100) NOT NULL PRIMARY KEY,
      mac_address VARCHAR(17) NOT NULL UNIQUE,
      serial_number VARCHAR(100) NULL,
      model VARCHAR(150) NULL,
      chromebook_number VARCHAR(50) NULL,
      room VARCHAR(100) NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'disponivel',
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_chromebooks_status (status),
      INDEX idx_chromebooks_room (room)
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS manutencoes (
      id VARCHAR(100) NOT NULL PRIMARY KEY,
      chromebook_id VARCHAR(100) NOT NULL,
      tipo VARCHAR(50) NOT NULL,
      categoria VARCHAR(80) NULL,
      data_ocorrencia DATE NULL,
      descricao TEXT NOT NULL,
      observacao TEXT NULL,
      quem_realizou VARCHAR(150) NULL,
      custo DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      destino_reparo VARCHAR(200) NULL,
      resultado TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_manutencoes_chromebook (chromebook_id),
      INDEX idx_manutencoes_data (data_ocorrencia),
      CONSTRAINT fk_manutencoes_chromebook
        FOREIGN KEY (chromebook_id)
        REFERENCES chromebooks(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS manutencao_anexos (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      manutencao_id VARCHAR(100) NOT NULL,
      nome_arquivo VARCHAR(255) NOT NULL,
      tipo_mime VARCHAR(150) NULL,
      tamanho_bytes BIGINT NULL,
      conteudo_base64 MEDIUMTEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_anexos_manutencao (manutencao_id),
      CONSTRAINT fk_anexos_manutencao
        FOREIGN KEY (manutencao_id)
        REFERENCES manutencoes(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS usuarios (
      id VARCHAR(100) NOT NULL PRIMARY KEY,
      nome VARCHAR(150) NOT NULL,
      usuario VARCHAR(100) NOT NULL UNIQUE,
      senha_hash VARCHAR(255) NOT NULL,
      ativo TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS sessoes (
      token_hash CHAR(64) NOT NULL PRIMARY KEY,
      usuario_id VARCHAR(100) NOT NULL,
      expira_em DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_sessoes_usuario (usuario_id),
      INDEX idx_sessoes_expiracao (expira_em),
      CONSTRAINT fk_sessoes_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS configuracao_sistema (
      id TINYINT NOT NULL PRIMARY KEY,
      chave VARCHAR(100) NOT NULL,
      valor VARCHAR(255) NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
    )
  `,
];

try {
  if (
    !process.env.DB_HOST ||
    !process.env.DB_USER ||
    !process.env.DB_PASSWORD ||
    !process.env.DB_NAME
  ) {
    throw new Error(
      "Confira as variáveis DB_HOST, DB_USER, DB_PASSWORD e DB_NAME no .env.local."
    );
  }

  connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 4000),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: true,
    },
    connectTimeout: 10000,
  });

  for (const sql of tables) {
    await connection.query(sql);
  }

  await connection.query(
    `INSERT INTO configuracao_sistema (id, chave, valor)
     VALUES (1, 'configuracao_inicial', 'pendente')
     ON DUPLICATE KEY UPDATE id = id`
  );

  console.log("Estrutura do banco criada com sucesso!");
  console.log("- chromebooks");
  console.log("- manutencoes");
  console.log("- manutencao_anexos");
  console.log("- usuarios");
  console.log("- sessoes");
  console.log("- configuracao_sistema");
} catch (error) {
  console.error("Erro ao criar as tabelas:", error.message);
  process.exitCode = 1;
} finally {
  if (connection) {
    await connection.end();
  }
}