import type { ColumnType, Generated, JSONColumnType } from "kysely";

export type TenantStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED";
export type UserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED" | "ARCHIVED";
export type TenantUserStatus = "ACTIVE" | "SUSPENDED" | "REVOKED";

export type PermissionEffect = "ALLOW" | "DENY";
export type PermissionScopeType =
  "TENANT" | "BRANCH" | "WAREHOUSE" | "OWN_RECORDS" | "ASSIGNED_RECORDS";

export interface TenantSettings {
  currency?: string;
  dateFormat?: string;
  timezone?: string;
  [key: string]: unknown;
}

export interface TenantTable {
  id: Generated<string>;
  code: string;
  name: string;
  tax_code: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: Generated<TenantStatus>;
  settings: Generated<JSONColumnType<TenantSettings>>;
  created_at: Generated<Date | string>;
  updated_at: Generated<Date | string>;
  archived_at: ColumnType<Date | string | null, Date | string | null, Date | string | null>;
}

export interface UserTable {
  id: Generated<string>;
  email: string;
  phone: string | null;
  full_name: string;
  password_hash: string;
  status: Generated<UserStatus>;
  created_at: Generated<Date | string>;
  updated_at: Generated<Date | string>;
  archived_at: ColumnType<Date | string | null, Date | string | null, Date | string | null>;
}

export interface TenantUserTable {
  id: Generated<string>;
  tenant_id: string;
  user_id: string;
  status: Generated<TenantUserStatus>;
  is_owner: Generated<boolean>;
  created_at: Generated<Date | string>;
  updated_at: Generated<Date | string>;
  archived_at: ColumnType<Date | string | null, Date | string | null, Date | string | null>;
}

export interface SessionTable {
  id: Generated<string>;
  token_hash: string;
  user_id: string;
  tenant_id: string;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: Date | string;
  created_at: Generated<Date | string>;
  last_seen_at: Generated<Date | string>;
  revoked_at: ColumnType<Date | string | null, Date | string | null, Date | string | null>;
}

export interface RoleGroupTable {
  id: Generated<string>;
  code: string;
  name: string;
  description: string | null;
  is_system: Generated<boolean>;
  created_at: Generated<Date | string>;
  updated_at: Generated<Date | string>;
  archived_at: ColumnType<Date | string | null, Date | string | null, Date | string | null>;
}

export interface PermissionTable {
  id: Generated<string>;
  code: string;
  module: string;
  resource: string;
  action: string;
  name: string;
  description: string | null;
  created_at: Generated<Date | string>;
  updated_at: Generated<Date | string>;
}

export interface RoleGroupPermissionTable {
  id: Generated<string>;
  role_group_id: string;
  permission_id: string;
  created_at: Generated<Date | string>;
}

export interface TitleTable {
  id: Generated<string>;
  tenant_id: string | null;
  code: string;
  name: string;
  role_group_id: string;
  description: string | null;
  created_at: Generated<Date | string>;
  updated_at: Generated<Date | string>;
  archived_at: ColumnType<Date | string | null, Date | string | null, Date | string | null>;
}

export interface TenantUserTitleTable {
  id: Generated<string>;
  tenant_user_id: string;
  title_id: string;
  created_at: Generated<Date | string>;
}

export interface UserCustomPermissionTable {
  id: Generated<string>;
  tenant_user_id: string;
  permission_id: string;
  effect: Generated<PermissionEffect>;
  scope_type: Generated<PermissionScopeType>;
  scope_value: string | null;
  created_at: Generated<Date | string>;
  updated_at: Generated<Date | string>;
}

export interface Database {
  tenants: TenantTable;
  users: UserTable;
  tenant_users: TenantUserTable;
  sessions: SessionTable;
  role_groups: RoleGroupTable;
  permissions: PermissionTable;
  role_group_permissions: RoleGroupPermissionTable;
  titles: TitleTable;
  tenant_user_titles: TenantUserTitleTable;
  user_custom_permissions: UserCustomPermissionTable;
}
