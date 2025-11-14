// 環境変数の型定義
export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  KINTONE_DOMAIN: string;
  KINTONE_APP_ID: string;
  CACHE?: KVNamespace;
}

// kintone レコード型
export interface KintoneRecord {
  [key: string]: {
    type: string;
    value: any;
  };
}

// kintone APIレスポンス型
export interface KintoneGetRecordsResponse {
  records: KintoneRecord[];
  totalCount?: string;
}

export interface KintoneGetRecordResponse {
  record: KintoneRecord;
}

// Supabase ユーザー型
export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
}

// アプリケーションコンテキスト
export interface AppContext {
  user?: AuthUser;
  env: Env;
}
