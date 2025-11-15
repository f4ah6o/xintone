import { createClient } from "@supabase/supabase-js";
import type { Context, Next } from "hono";
import type { AuthUser, Env } from "../types";

/**
 * Supabase 認証ミドルウェア
 * リクエストヘッダーから JWT トークンを取得し、認証を行う
 */
export async function authMiddleware(
	c: Context<{ Bindings: Env; Variables: { user: AuthUser } }>,
	next: Next,
) {
	const authHeader = c.req.header("Authorization");

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return c.json({ error: "Unauthorized: No token provided" }, 401);
	}

	const token = authHeader.substring(7);

	try {
		const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);

		const {
			data: { user },
			error,
		} = await supabase.auth.getUser(token);

		if (error || !user) {
			return c.json({ error: "Unauthorized: Invalid token" }, 401);
		}

		// ユーザー情報をコンテキストに設定
		c.set("user", {
			id: user.id,
			email: user.email,
			role: user.role,
		});

		await next();
	} catch (error) {
		console.error("Auth error:", error);
		return c.json({ error: "Unauthorized: Authentication failed" }, 401);
	}
}

/**
 * オプショナルな認証ミドルウェア
 * トークンがあれば認証するが、なくてもリクエストを通す
 */
export async function optionalAuthMiddleware(
	c: Context<{ Bindings: Env; Variables: { user?: AuthUser } }>,
	next: Next,
) {
	const authHeader = c.req.header("Authorization");

	if (authHeader?.startsWith("Bearer ")) {
		const token = authHeader.substring(7);

		try {
			const supabase = createClient(
				c.env.SUPABASE_URL,
				c.env.SUPABASE_ANON_KEY,
			);

			const {
				data: { user },
			} = await supabase.auth.getUser(token);

			if (user) {
				c.set("user", {
					id: user.id,
					email: user.email,
					role: user.role,
				});
			}
		} catch (error) {
			console.error("Optional auth error:", error);
			// エラーが発生してもリクエストは継続
		}
	}

	await next();
}
