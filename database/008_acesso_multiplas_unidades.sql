-- Acesso de usuários a um ou aos dois colégios.
-- AMBOS é representado por NULL em usuarios.unidade_id para respeitar a FK
-- com unidades (que contém apenas CE e JP). A aplicação converte NULL em AMBOS.
ALTER TABLE usuarios MODIFY COLUMN unidade_id VARCHAR(10) NULL;
