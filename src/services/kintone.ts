import type {
	KintoneGetRecordResponse,
	KintoneGetRecordsResponse,
	KintoneRecord,
} from "../types";

/**
 * kintone API クライアント
 */
export class KintoneService {
	private domain: string;
	private appId: string;

	constructor(domain: string, appId: string) {
		this.domain = domain;
		this.appId = appId;
	}

	/**
	 * レコード一覧を取得
	 */
	async getRecords(
		apiToken: string,
		query?: string,
		fields?: string[],
	): Promise<KintoneGetRecordsResponse> {
		const url = new URL(`https://${this.domain}/k/v1/records.json`);
		url.searchParams.set("app", this.appId);
		if (query) {
			url.searchParams.set("query", query);
		}
		if (fields && fields.length > 0) {
			url.searchParams.set("fields", JSON.stringify(fields));
		}

		const response = await fetch(url.toString(), {
			method: "GET",
			headers: {
				"X-Cybozu-API-Token": apiToken,
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(
				`kintone API Error: ${response.status} ${response.statusText}`,
			);
		}

		return await response.json();
	}

	/**
	 * 単一レコードを取得
	 */
	async getRecord(
		apiToken: string,
		recordId: string,
	): Promise<KintoneGetRecordResponse> {
		const url = `https://${this.domain}/k/v1/record.json?app=${this.appId}&id=${recordId}`;

		const response = await fetch(url, {
			method: "GET",
			headers: {
				"X-Cybozu-API-Token": apiToken,
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(
				`kintone API Error: ${response.status} ${response.statusText}`,
			);
		}

		return await response.json();
	}

	/**
	 * レコードを追加
	 */
	async createRecord(
		apiToken: string,
		record: KintoneRecord,
	): Promise<{ id: string; revision: string }> {
		const url = `https://${this.domain}/k/v1/record.json`;

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"X-Cybozu-API-Token": apiToken,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				app: this.appId,
				record: record,
			}),
		});

		if (!response.ok) {
			throw new Error(
				`kintone API Error: ${response.status} ${response.statusText}`,
			);
		}

		return await response.json();
	}

	/**
	 * レコードを更新
	 */
	async updateRecord(
		apiToken: string,
		recordId: string,
		record: KintoneRecord,
		revision?: number,
	): Promise<{ revision: string }> {
		const url = `https://${this.domain}/k/v1/record.json`;

		const body: any = {
			app: this.appId,
			id: recordId,
			record: record,
		};

		if (revision !== undefined) {
			body.revision = revision;
		}

		const response = await fetch(url, {
			method: "PUT",
			headers: {
				"X-Cybozu-API-Token": apiToken,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			throw new Error(
				`kintone API Error: ${response.status} ${response.statusText}`,
			);
		}

		return await response.json();
	}

	/**
	 * レコードを削除
	 */
	async deleteRecords(apiToken: string, recordIds: string[]): Promise<{}> {
		const url = `https://${this.domain}/k/v1/records.json`;

		const response = await fetch(url, {
			method: "DELETE",
			headers: {
				"X-Cybozu-API-Token": apiToken,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				app: this.appId,
				ids: recordIds,
			}),
		});

		if (!response.ok) {
			throw new Error(
				`kintone API Error: ${response.status} ${response.statusText}`,
			);
		}

		return await response.json();
	}
}
