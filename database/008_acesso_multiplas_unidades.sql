-- Acesso de usuários a um ou aos dois colégios.
-- AMBOS é armazenado em usuarios.unidade_id para permitir alternância CE/JP.
ALTER TABLE usuarios MODIFY COLUMN unidade_id VARCHAR(10) NULL;
