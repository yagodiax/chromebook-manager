-- Chromebook Manager - Access Points da unidade Campos Elíseos (CE).
-- Execute no TiDB Cloud antes de abrir /aps. Reexecutável sem duplicar MACs.
CREATE TABLE IF NOT EXISTS access_points (
 id VARCHAR(100) NOT NULL PRIMARY KEY, unidade_id VARCHAR(2) NOT NULL,
 bloco VARCHAR(100) NOT NULL, rack VARCHAR(150) NOT NULL, marca VARCHAR(100) NOT NULL,
 modelo VARCHAR(150) NOT NULL, mac_address CHAR(17) NOT NULL, potencia_dbm DECIMAL(5,2) NOT NULL,
 status VARCHAR(30) NOT NULL DEFAULT 'OK', observacoes TEXT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY uq_access_points_unidade_mac (unidade_id, mac_address),
 KEY idx_access_points_unidade_bloco (unidade_id, bloco), KEY idx_access_points_status (status)
);
INSERT INTO access_points (id, unidade_id, bloco, rack, marca, modelo, mac_address, potencia_dbm, status) VALUES
('AP-CE-001','CE','Secretaria','Secretaria','Ubiquiti UniFi','U6-LR (Long Range)','AC:8B:A9:47:59:F5',26,'OK'),
('AP-CE-002','CE','B','Sala 201B','Ubiquiti UniFi','AC Pro','74:83:C2:B0:ED:2E',22,'OK'),
('AP-CE-003','CE','C','Sala 202C','Ubiquiti UniFi','AC Pro','74:83:C2:B3:55:1E',22,'OK'),
('AP-CE-004','CE','D 01 ANDAR','Sala dos Professores','Ubiquiti UniFi','AC Pro','74:83:C2:B3:54:8B',22,'OK'),
('AP-CE-005','CE','D 02 ANDAR','Rack 2 Andar','Ubiquiti UniFi','AC Pro','74:83:C2:B3:55:84',22,'OK'),
('AP-CE-006','CE','D 03 ANDAR','Rack 2 Andar','Ubiquiti UniFi','U6-LR (Long Range)','60:22:32:F4:1D:79',26,'OK'),
('AP-CE-007','CE','Auditório','Rack Cpd','Ubiquiti UniFi','AC Pro','70:A7:41:89:83:96',22,'OK'),
('AP-CE-008','CE','Anexo','Tecnologia Cpd','Intelbras','AP 360','98:E5:5B:52:3F:EB',10,'OK')
ON DUPLICATE KEY UPDATE bloco=VALUES(bloco), rack=VALUES(rack), marca=VALUES(marca), modelo=VALUES(modelo), potencia_dbm=VALUES(potencia_dbm), status=VALUES(status);
