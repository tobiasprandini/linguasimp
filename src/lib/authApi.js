function getApiBaseUrl() {
	const explicitBaseUrl = import.meta.env.VITE_API_BASE_URL;

	if (explicitBaseUrl) {
		return explicitBaseUrl.replace(/\/$/, "");
	}

	if (typeof window !== "undefined") {
		return `${window.location.protocol}//${window.location.hostname}:3001`;
	}

	return "http://localhost:3001";
}

async function request(path, options = {}) {
	const response = await fetch(`${getApiBaseUrl()}${path}`, {
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

export function createConfirmedUser(payload) {
	return request("/auth/signup", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}
