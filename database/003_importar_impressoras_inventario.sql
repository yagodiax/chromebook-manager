-- Chromebook Manager
-- Importação inicial do inventário de impressoras fornecido pela escola.
-- Pode ser executado novamente: INSERT IGNORE evita duplicar os registros.
-- Os campos específicos ficam no JSON "detalhes", já previsto no schema universal.
-- Patrimônio interno atribuído IMP-001 a IMP-010; o ID original da planilha fica em detalhes.idTabela.

INSERT IGNORE INTO equipamentos
  (id, patrimonio, tipo, fabricante, modelo, numero_serie, localizacao, status, observacoes, detalhes)
VALUES
('EQ-IMP-001','IMP-001','impressora','Epson','L4150','X59D121570','Coordenação - CE','em-uso',NULL,
 JSON_OBJECT('idTabela',1,'conexao','192.168.1.78 (CORPORATIVO)','enderecoIp','192.168.1.78','mac','F8:D0:27:4D:56:ED','paginasImpressas',60399,'dataInstalacao','2018-10-29','statusOriginal','OK')),
('EQ-IMP-002','IMP-002','impressora','Epson','L4150','X59D212433','Direção - CE (EDSON)','em-uso',NULL,
 JSON_OBJECT('idTabela',2,'conexao','192.168.1.77 (DIREÇÃO)','enderecoIp','192.168.1.77','mac','F8:D0:27:52:CC:64','paginasImpressas',96900,'dataInstalacao','2019-05-10','statusOriginal','OK')),
('EQ-IMP-003','IMP-003','impressora','Epson','L3250','XAABK30935','CPD - CE (MARKETING)','em-uso',NULL,
 JSON_OBJECT('idTabela',3,'conexao','192.168.3.105 (TECNOLOGIA)','enderecoIp','192.168.3.105','mac','64:C6:D2:30:6A:EC','paginasImpressas',48091,'dataInstalacao','2024-11-12','statusOriginal','OK')),
('EQ-IMP-004','IMP-004','impressora','Epson','L3250','XAABT15011','Almoxarifado - CE','em-uso',NULL,
 JSON_OBJECT('idTabela',4,'conexao','USB / 192.168.2.194 (CORPORATIVO)','enderecoIp','192.168.2.194','mac','64:C6:D2:56:91:17','paginasImpressas',3530,'dataInstalacao','2025-09-12','statusOriginal','OK')),
('EQ-IMP-005','IMP-005','impressora','Epson','L1250','XDNZ164155','Direção - CE (BIA)','em-uso',NULL,
 JSON_OBJECT('idTabela',5,'conexao','192.168.3.148 (DIREÇÃO)','enderecoIp','192.168.3.148','mac','58:05:D9:5C:28:B9','paginasImpressas',165,'dataInstalacao','2026-06-24','statusOriginal','OK')),
('EQ-IMP-006','IMP-006','impressora','Canon','TC-20','BBLT00826','CPD - CE (CANON)','em-uso',NULL,
 JSON_OBJECT('idTabela',6,'conexao','192.168.3.118 (CABO DE REDE)','enderecoIp','192.168.3.118','mac','6C:F2:D8:35:45:0E','paginasImpressas',0,'dataInstalacao','2026-06-24','statusOriginal','OK')),
('EQ-IMP-007','IMP-007','impressora','Kyocera','ECOSYS MA4500ix','11L6130641','Almoxarifado - CE','em-uso',NULL,
 JSON_OBJECT('idTabela',7,'conexao','USB / 192.168.3.27 (CABO DE REDE)','enderecoIp','192.168.3.27','mac','D4:F0:C9:31:A2:0E','paginasImpressas',0,'dataInstalacao','2026-08-10','statusOriginal','OK')),
('EQ-IMP-008','IMP-008','impressora','Brother','MFC-L2740DW','U63889M6N507978','Secretaria - CE','em-uso',NULL,
 JSON_OBJECT('idTabela',8,'conexao','192.168.1.232 (CORPORATIVO)','enderecoIp','192.168.1.232','mac','28:56:5A:8B:3F:51','paginasImpressas',167962,'dataInstalacao',NULL,'statusOriginal','OK')),
('EQ-IMP-009','IMP-009','impressora','Epson','L375','WMTM243232','Secretaria - CE (COLORIDA)','em-uso',NULL,
 JSON_OBJECT('idTabela',9,'conexao','192.168.3.228 (CORPORATIVO)','enderecoIp','192.168.3.228','mac','44:D2:44:11:15:93','paginasImpressas',122456,'dataInstalacao',NULL,'statusOriginal','OK')),
('EQ-IMP-010','IMP-010','impressora','Brother','DCP-T420W','U66052D4H233258','Almoxarifado (COLORIDA)','em-reparo',NULL,
 JSON_OBJECT('idTabela',10,'conexao','(CORPORATIVO)','enderecoIp',NULL,'mac','FC:B0:DE:A9:82:8D','paginasImpressas',58359,'dataInstalacao',NULL,'statusOriginal','REPARO'));
