import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authMiddleware, optionalAuthMiddleware } from './middleware/auth';
import { adminMiddleware } from './middleware/admin';
import { KintoneService } from './services/kintone';
import type { Env, AuthUser } from './types';

type Variables = {
  user?: AuthUser;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// ミドルウェア
app.use('*', logger());
app.use('*', cors());

// 静的ファイル配信は実際の環境では Cloudflare Pages や別の静的ホスティングを使用することを推奨
// 開発時は wrangler dev で public フォルダが自動的に配信されます

// ヘルスチェック
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API ルート
const api = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * レコード一覧取得
 * GET /api/records?app_id=xxx
 */
api.get('/records', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // クエリパラメータから検索条件を取得
    const appId = c.req.query('app_id');
    const query = c.req.query('query');
    const fields = c.req.query('fields')?.split(',');

    // kintone API トークンをヘッダーから取得
    const apiToken = c.req.header('X-Kintone-API-Token') || '';

    if (!apiToken) {
      return c.json({ error: 'kintone API token is required' }, 400);
    }

    // app_idが指定されている場合は使用、なければ環境変数から
    const kintoneAppId = appId || c.env.KINTONE_APP_ID;
    const kintone = new KintoneService(c.env.KINTONE_DOMAIN, kintoneAppId);
    const result = await kintone.getRecords(apiToken, query, fields);

    // htmx 用の HTML レスポンス
    if (c.req.header('HX-Request')) {
      const html = result.records
        .map(
          (record) => `
        <div class="record-item">
          <pre>${JSON.stringify(record, null, 2)}</pre>
        </div>
      `
        )
        .join('');

      return c.html(html || '<p>レコードがありません</p>');
    }

    // JSON レスポンス
    return c.json(result);
  } catch (error) {
    console.error('Error fetching records:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (c.req.header('HX-Request')) {
      return c.html(`<div class="error">エラー: ${errorMessage}</div>`);
    }

    return c.json({ error: errorMessage }, 500);
  }
});

/**
 * 単一レコード取得
 * GET /api/records/:id?app_id=xxx
 */
api.get('/records/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const recordId = c.req.param('id');
    const appId = c.req.query('app_id');
    const apiToken = c.req.header('X-Kintone-API-Token') || '';

    if (!apiToken) {
      return c.json({ error: 'kintone API token is required' }, 400);
    }

    const kintoneAppId = appId || c.env.KINTONE_APP_ID;
    const kintone = new KintoneService(c.env.KINTONE_DOMAIN, kintoneAppId);
    const result = await kintone.getRecord(apiToken, recordId);

    if (c.req.header('HX-Request')) {
      const html = `
        <div class="record-item">
          <pre>${JSON.stringify(result.record, null, 2)}</pre>
        </div>
      `;
      return c.html(html);
    }

    return c.json(result);
  } catch (error) {
    console.error('Error fetching record:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (c.req.header('HX-Request')) {
      return c.html(`<div class="error">エラー: ${errorMessage}</div>`);
    }

    return c.json({ error: errorMessage }, 500);
  }
});

/**
 * レコード作成
 * POST /api/records?app_id=xxx
 */
api.post('/records', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const appId = c.req.query('app_id');
    const apiToken = c.req.header('X-Kintone-API-Token') || '';

    if (!apiToken) {
      return c.json({ error: 'kintone API token is required' }, 400);
    }

    const body = await c.req.json();
    const record = body.record;

    if (!record) {
      return c.json({ error: 'Record data is required' }, 400);
    }

    const kintoneAppId = appId || c.env.KINTONE_APP_ID;
    const kintone = new KintoneService(c.env.KINTONE_DOMAIN, kintoneAppId);
    const result = await kintone.createRecord(apiToken, record);

    return c.json(result, 201);
  } catch (error) {
    console.error('Error creating record:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMessage }, 500);
  }
});

/**
 * レコード更新
 * PUT /api/records/:id?app_id=xxx
 */
api.put('/records/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const recordId = c.req.param('id');
    const appId = c.req.query('app_id');
    const apiToken = c.req.header('X-Kintone-API-Token') || '';

    if (!apiToken) {
      return c.json({ error: 'kintone API token is required' }, 400);
    }

    const body = await c.req.json();
    const record = body.record;
    const revision = body.revision;

    if (!record) {
      return c.json({ error: 'Record data is required' }, 400);
    }

    const kintoneAppId = appId || c.env.KINTONE_APP_ID;
    const kintone = new KintoneService(c.env.KINTONE_DOMAIN, kintoneAppId);
    const result = await kintone.updateRecord(apiToken, recordId, record, revision);

    return c.json(result);
  } catch (error) {
    console.error('Error updating record:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMessage }, 500);
  }
});

/**
 * レコード削除
 * DELETE /api/records?app_id=xxx
 */
api.delete('/records', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const appId = c.req.query('app_id');
    const apiToken = c.req.header('X-Kintone-API-Token') || '';

    if (!apiToken) {
      return c.json({ error: 'kintone API token is required' }, 400);
    }

    const body = await c.req.json();
    const recordIds = body.ids;

    if (!recordIds || !Array.isArray(recordIds)) {
      return c.json({ error: 'Record IDs array is required' }, 400);
    }

    const kintoneAppId = appId || c.env.KINTONE_APP_ID;
    const kintone = new KintoneService(c.env.KINTONE_DOMAIN, kintoneAppId);
    const result = await kintone.deleteRecords(apiToken, recordIds);

    return c.json(result);
  } catch (error) {
    console.error('Error deleting records:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMessage }, 500);
  }
});

// API ルートをマウント
app.route('/api', api);

export default app;
