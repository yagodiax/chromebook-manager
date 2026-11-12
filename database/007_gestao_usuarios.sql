-- Gestão de usuários: execute este arquivo uma única vez no TiDB Cloud.
ALTER TABLE usuarios MODIFY COLUMN senha_hash VARCHAR(255) NULL;
ALTER TABLE usuarios ADD COLUMN perfil VARCHAR(20) NOT NULL DEFAULT 'usuario';
ALTER TABLE usuarios ADD COLUMN codigo_ativacao_hash CHAR(64) NULL;
-- A conta mais antiga é o administrador inicial.
UPDATE usuarios SET perfil = 'admin'
WHERE id = (SELECT id FROM (SELECT id FROM usuarios ORDER BY created_at ASC, id ASC LIMIT 1) AS primeiro_usuario);
