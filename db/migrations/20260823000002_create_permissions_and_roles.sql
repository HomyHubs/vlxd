-- migrate:up
CREATE TABLE IF NOT EXISTS role_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_role_groups_archived_at ON role_groups(archived_at);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    module VARCHAR(50) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);

CREATE TABLE IF NOT EXISTS role_group_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_group_id UUID NOT NULL REFERENCES role_groups(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_role_group_permissions UNIQUE (role_group_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_group_permissions_role_group ON role_group_permissions(role_group_id);
CREATE INDEX IF NOT EXISTS idx_role_group_permissions_permission ON role_group_permissions(permission_id);

CREATE TABLE IF NOT EXISTS titles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role_group_id UUID NOT NULL REFERENCES role_groups(id) ON DELETE RESTRICT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ DEFAULT NULL,
    CONSTRAINT uq_titles_tenant_code UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_titles_tenant_id ON titles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_titles_role_group_id ON titles(role_group_id);
CREATE INDEX IF NOT EXISTS idx_titles_archived_at ON titles(archived_at);

CREATE TABLE IF NOT EXISTS tenant_user_titles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_user_id UUID NOT NULL REFERENCES tenant_users(id) ON DELETE CASCADE,
    title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_tenant_user_titles UNIQUE (tenant_user_id, title_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_user_titles_tenant_user_id ON tenant_user_titles(tenant_user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_user_titles_title_id ON tenant_user_titles(title_id);

CREATE TABLE IF NOT EXISTS user_custom_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_user_id UUID NOT NULL REFERENCES tenant_users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    effect VARCHAR(10) NOT NULL DEFAULT 'ALLOW' CHECK (effect IN ('ALLOW', 'DENY')),
    scope_type VARCHAR(30) NOT NULL DEFAULT 'TENANT' CHECK (scope_type IN ('TENANT', 'BRANCH', 'WAREHOUSE', 'OWN_RECORDS', 'ASSIGNED_RECORDS')),
    scope_value VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_custom_permissions UNIQUE (tenant_user_id, permission_id, scope_type, scope_value)
);

CREATE INDEX IF NOT EXISTS idx_user_custom_permissions_tenant_user ON user_custom_permissions(tenant_user_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_permissions_permission ON user_custom_permissions(permission_id);

-- migrate:down
DROP TABLE IF EXISTS user_custom_permissions;
DROP TABLE IF EXISTS tenant_user_titles;
DROP TABLE IF EXISTS titles;
DROP TABLE IF EXISTS role_group_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS role_groups;
