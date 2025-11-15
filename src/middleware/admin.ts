import { Context, Next } from 'hono';
import { createClient } from '@supabase/supabase-js';
import type { Env, AuthUser } from '../types';

/**
 * 管理者権限チェックミドルウェア
 */
export async function adminMiddleware(
  c: Context<{ Bindings: Env; Variables: { user: AuthUser } }>,
  next: Next
) {
  const user = c.get('user');

  if (!user) {
    return c.json({ error: 'Unauthorized: Authentication required' }, 401);
  }

  // ロールチェック
  if (user.role !== 'admin') {
    return c.json({ error: 'Forbidden: Admin role required' }, 403);
  }

  await next();
}
