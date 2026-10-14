-- Chromebook Manager
-- Importação inicial dos 6 notebooks informados pela escola.
-- INSERT IGNORE evita duplicar registros ao executar novamente.
-- Patrimônios internos NOTE-001 a NOTE-006; IDs originais ficam em detalhes.idTabela.
-- Campos não informados permanecem vazios.

INSERT IGNORE INTO equipamentos
  (id, patrimonio, tipo, fabricante, modelo, numero_serie, localizacao, status, observacoes, detalhes)
VALUES
('EQ-NOTE-001','NOTE-001','notebook',NULL,NULL,NULL,'Sala Professores','em-uso','Bateria Ruim',
 JSON_OBJECT('idTabela',1,'nomeInventario',NULL,'codigoModelo',NULL,'mac',NULL,'serialOriginal',NULL)),
('EQ-NOTE-002','NOTE-002','notebook',NULL,NULL,NULL,'Sabrina','em-uso',NULL,
 JSON_OBJECT('idTabela',2,'nomeInventario',NULL,'codigoModelo',NULL,'mac',NULL,'serialOriginal',NULL)),
('EQ-NOTE-003','NOTE-003','notebook','Lenovo','ThinkPad T480','PE03V6VM','Eventos 1','em-uso',NULL,
 JSON_OBJECT('idTabela',3,'nomeInventario','ThinkPad T480','codigoModelo',NULL,'mac',NULL,'serialOriginal','PE03V6VM')),
('EQ-NOTE-004','NOTE-004','notebook','Lenovo','Ideapad S145','PE04T8MD','Reserva (PRISCILLA)','em-uso','Defeito na Placa Wifi',
 JSON_OBJECT('idTabela',4,'nomeInventario','Ideapad S145','codigoModelo','81S9','mac','A0-A3-F0-48-E7-CC','serialOriginal','PE04T8MD')),
('EQ-NOTE-005','NOTE-005','notebook',NULL,NULL,NULL,'Priscilla','em-uso',NULL,
 JSON_OBJECT('idTabela',5,'nomeInventario',NULL,'codigoModelo',NULL,'mac',NULL,'serialOriginal',NULL)),
('EQ-NOTE-006','NOTE-006','notebook','ASUS','Asuspro Essential',NULL,'Eventos','em-uso','Placa Wifi Fraca',
 JSON_OBJECT('idTabela',6,'nomeInventario','Asuspro Essential','codigoModelo','PU401LA','mac','6C-71-D9-A3-22-7D','serialOriginal',NULL));
