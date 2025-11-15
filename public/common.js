// 共通JavaScript

// Supabase 設定（実際の値に置き換えてください）
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

let supabaseClient = null;
let currentUser = null;
let currentToken = null;

// Supabase クライアント初期化
function initSupabase() {
  if (SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    checkSession();
  } else {
    console.error('Supabase の設定が必要です');
  }
}

// セッションチェック
async function checkSession() {
  if (!supabaseClient) return null;

  const { data: { session }, error } = await supabaseClient.auth.getSession();
  if (session) {
    currentToken = session.access_token;
    currentUser = session.user;

    // プロファイル取得
    const profile = await getUserProfile(currentUser.id);
    if (profile) {
      currentUser.profile = profile;
    }

    return session;
  }
  return null;
}

// ユーザープロファイル取得
async function getUserProfile(userId) {
  if (!supabaseClient) return null;

  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Profile fetch error:', error);
    return null;
  }

  return data;
}

// 管理者チェック
function isAdmin() {
  return currentUser?.profile?.role === 'admin';
}

// ログイン
async function login(email, password) {
  if (!supabaseClient) {
    throw new Error('Supabase が初期化されていません');
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  currentToken = data.session.access_token;
  currentUser = data.user;

  const profile = await getUserProfile(currentUser.id);
  if (profile) {
    currentUser.profile = profile;
  }

  return data;
}

// ログアウト
async function logout() {
  if (!supabaseClient) return;

  await supabaseClient.auth.signOut();
  currentToken = null;
  currentUser = null;
  window.location.href = '/';
}

// API リクエストヘッダー取得
function getAuthHeaders(apiToken = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }

  if (apiToken) {
    headers['X-Kintone-API-Token'] = apiToken;
  }

  return headers;
}

// API リクエスト（共通）
async function apiRequest(endpoint, options = {}) {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'API エラー');
  }

  return response.json();
}

// htmx グローバル設定
document.addEventListener('DOMContentLoaded', () => {
  // htmx リクエストに認証ヘッダーを自動追加
  document.body.addEventListener('htmx:configRequest', (event) => {
    if (currentToken) {
      event.detail.headers['Authorization'] = `Bearer ${currentToken}`;
    }
  });

  // htmx エラーハンドリング
  document.body.addEventListener('htmx:responseError', (event) => {
    const status = event.detail.xhr.status;
    if (status === 401) {
      alert('認証エラー: 再度ログインしてください');
      window.location.href = '/';
    } else {
      console.error('htmx error:', event.detail);
    }
  });
});

// 日付フォーマット
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ローディング表示
function showLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = '<div class="loading">読み込み中...</div>';
  }
}

// エラー表示
function showError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `<div class="error">${message}</div>`;
  }
}
