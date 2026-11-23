/** fetch that throws with the response body on a non-2xx status, and parses JSON. */
/** retries: send again after a network error, only safe for requests that change nothing or can't apply twice. */
export const api = async (url: string, init?: RequestInit, retries = 3): Promise<any> => {
	let res: Response;
	// A connection kept open during a 30-minute render is often dead by the next request ("fetch failed"): retry on a new one.
	for (let attempt = 1; ; attempt++) {
		try {
			res = await fetch(url, init);
			break;
		} catch (e) {
			const why = `${(e as Error).message}${(e as {cause?: Error}).cause ? ` (${(e as {cause?: Error}).cause!.message})` : ''}`;
			if (attempt >= retries) throw new Error(`${init?.method ?? 'GET'} ${url.split('?')[0]} -> network error: ${why}`);
			console.warn(`network error, retrying: ${why}`);
			await new Promise((r) => setTimeout(r, 3000 * attempt));
		}
	}
	const text = await res.text();
	if (!res.ok) throw new Error(`${init?.method ?? 'GET'} ${url.split('?')[0]} -> ${res.status}: ${text.slice(0, 500)}`);
	return text ? JSON.parse(text) : {};
};

export const env = (name: string): string => {
	const v = process.env[name];
	// Pasted secrets often carry a trailing newline, spaces or quotes; strip them so a copy-paste slip is not fatal.
	const clean = v?.trim().replace(/^["']|["']$/g, '').trim();
	if (!clean) throw new Error(`missing secret/env ${name} (see docs/SETUP.md)`);
	return clean;
};
