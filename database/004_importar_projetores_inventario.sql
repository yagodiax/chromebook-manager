-- Chromebook Manager
-- Importação inicial dos 17 projetores informados pela escola.
-- Pode ser executado novamente: INSERT IGNORE evita duplicar os registros.
-- Patrimônios internos PROJ-001 a PROJ-017; o ID original da planilha fica em detalhes.idTabela.
-- A potência é armazenada como informada, inclusive os casos marcados como FICTICIO.

INSERT IGNORE INTO equipamentos
  (id, patrimonio, tipo, fabricante, modelo, numero_serie, localizacao, status, observacoes, detalhes)
VALUES
('EQ-PROJ-001','PROJ-001','projetor','Epson','CO-W01',NULL,'Bloco A - Sala 201A','em-uso',NULL,
 JSON_OBJECT('idTabela',1,'bloco','A','sala','201A','potencia','270W','statusOriginal','OK')),
('EQ-PROJ-002','PROJ-002','projetor','Epson','CO-W01',NULL,'Bloco A - Sala 203A','em-uso',NULL,
 JSON_OBJECT('idTabela',2,'bloco','A','sala','203A','potencia','270W','statusOriginal','OK')),
('EQ-PROJ-003','PROJ-003','projetor','Paralelo','AJ-E01-R',NULL,'Bloco B - Sala 201B','em-uso',NULL,
 JSON_OBJECT('idTabela',3,'bloco','B','sala','201B','potencia','300W','potenciaFicticia',true,'statusOriginal','OK')),
('EQ-PROJ-004','PROJ-004','projetor','Epson','PowerLite S31+',NULL,'Bloco B - Sala 301B','em-uso',NULL,
 JSON_OBJECT('idTabela',4,'bloco','B','sala','301B','potencia','270W','statusOriginal','OK')),
('EQ-PROJ-005','PROJ-005','projetor','Epson','PowerLite S31+',NULL,'Bloco B - Sala 302B','em-uso',NULL,
 JSON_OBJECT('idTabela',5,'bloco','B','sala','302B','potencia','270W','statusOriginal','OK')),
('EQ-PROJ-006','PROJ-006','projetor','Paralelo','AJ-E01-R',NULL,'Bloco B - Sala 303B','em-uso',NULL,
 JSON_OBJECT('idTabela',6,'bloco','B','sala','303B','potencia','300W','potenciaFicticia',true,'statusOriginal','OK')),
('EQ-PROJ-007','PROJ-007','projetor','Epson','PowerLite S41+',NULL,'Bloco B - Sala 304B','em-uso',NULL,
 JSON_OBJECT('idTabela',7,'bloco','B','sala','304B','potencia','290W','statusOriginal','OK')),
('EQ-PROJ-008','PROJ-008','projetor','Paralelo','AJ-E01-R',NULL,'Bloco C - Sala 201C','em-uso',NULL,
 JSON_OBJECT('idTabela',8,'bloco','C','sala','201C','potencia','300W','statusOriginal','OK')),
('EQ-PROJ-009','PROJ-009','projetor','Epson','CO-W01',NULL,'Bloco C - Sala 202C','em-uso',NULL,
 JSON_OBJECT('idTabela',9,'bloco','C','sala','202C','potencia','270W','statusOriginal','OK')),
('EQ-PROJ-010','PROJ-010','projetor','Paralelo','AJ-E01-R',NULL,'Bloco C - Sala 301C','em-uso',NULL,
 JSON_OBJECT('idTabela',10,'bloco','C','sala','301C','potencia','300W','potenciaFicticia',true,'statusOriginal','OK')),
('EQ-PROJ-011','PROJ-011','projetor','Epson','Bright Link 675Wi+',NULL,'Bloco C - Sala 302C','em-uso',NULL,
 JSON_OBJECT('idTabela',11,'bloco','C','sala','302C','potencia','350W','statusOriginal','OK')),
('EQ-PROJ-012','PROJ-012','projetor','Epson','PowerLite X39',NULL,'Bloco D - Sala 201D','em-uso',NULL,
 JSON_OBJECT('idTabela',12,'bloco','D','sala','201D','potencia','300W','statusOriginal','OK')),
('EQ-PROJ-013','PROJ-013','projetor','Epson','PowerLite S41+',NULL,'Bloco D - Sala 202D','em-uso',NULL,
 JSON_OBJECT('idTabela',13,'bloco','D','sala','202D','potencia','290W','statusOriginal','OK')),
('EQ-PROJ-014','PROJ-014','projetor','Epson','PowerLite X39',NULL,'Bloco D - Sala 301D','em-uso',NULL,
 JSON_OBJECT('idTabela',14,'bloco','D','sala','301D','potencia','300W','statusOriginal','OK')),
('EQ-PROJ-015','PROJ-015','projetor','Paralelo','AJ-E01-R',NULL,'Bloco D - Sala 302D','em-uso',NULL,
 JSON_OBJECT('idTabela',15,'bloco','D','sala','302D','potencia','300W','potenciaFicticia',true,'statusOriginal','OK')),
('EQ-PROJ-016','PROJ-016','projetor','Paralelo','AJ-E01-R',NULL,'Bloco D - Sala 303D','em-uso',NULL,
 JSON_OBJECT('idTabela',16,'bloco','D','sala','303D','potencia','300W','potenciaFicticia',true,'statusOriginal','OK')),
('EQ-PROJ-017','PROJ-017','projetor','Epson','CO-W01',NULL,'Bloco D - Sala 304D','em-uso',NULL,
 JSON_OBJECT('idTabela',17,'bloco','D','sala','304D','potencia','270W','statusOriginal','OK'));
