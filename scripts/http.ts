/** fetch that throws with the response body on a non-2xx status, and parses JSON. */
export const api = async (url: string, init?: RequestInit): Promise<any> => {
	const res = await fetch(url, init);
	const text = await res.text();
	if (!res.ok) throw new Error(`${init?.method ?? 'GET'} ${url.split('?')[0]} -> ${res.status}: ${text.slice(0, 500)}`);
	return text ? JSON.parse(text) : {};
};

export const env = (name: string): string => {
	const v = process.env[name];
	if (!v) throw new Error(`missing secret/env ${name} (see docs/SETUP.md)`);
	return v;
};
