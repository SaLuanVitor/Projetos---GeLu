-- V018: Suporte a Perfis Administrativos (RBAC) e Gestão de Equipe no Backoffice

ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_role VARCHAR(30) DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_users_admin_role ON users(admin_role);

-- Atribui SUPER_ADMIN à conta âncora principal
UPDATE users 
SET admin_role = 'SUPER_ADMIN' 
WHERE LOWER(TRIM(email)) = 'luanvitors_852@hotmail.com';
