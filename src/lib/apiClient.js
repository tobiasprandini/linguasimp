export const BACKEND_CONFIG_ERROR =
	"Backend nao configurado. Defina VITE_API_BASE_URL na Vercel.";

export function getApiBaseUrl() {
	const explicitBaseUrl = import.meta.env.VITE_API_BASE_URL;

	if (explicitBaseUrl) {
		return explicitBaseUrl.replace(/\/$/, "");
	}

	if (
		typeof window !== "undefined" &&
		["localhost", "127.0.0.1"].includes(window.location.hostname)
	) {
		return `${window.location.protocol}//${window.location.hostname}:3001`;
	}

	return "";
}

export async function apiRequest(path, options = {}) {
	const apiBaseUrl = getApiBaseUrl();

	if (!apiBaseUrl) {
		throw new Error(BACKEND_CONFIG_ERROR);
	}

	const response = await fetch(`${apiBaseUrl}${path}`, {
		headers: {
			"Content-Type": "application/json",
			...(options.headers ?? {}),
		},
		...options,
	});

	const data = await response.json().catch(() => null);

	if (!response.ok) {
		throw new Error(data?.error ?? `Erro HTTP ${response.status}`);
	}

	return data;
}
