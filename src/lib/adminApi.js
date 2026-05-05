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

export function fetchAdminRuntimeData() {
	return request("/admin/runtime-data");
}

export function updateSentence(externalId, payload) {
	return request(`/admin/sentences/${externalId}`, {
		method: "PATCH",
		body: JSON.stringify(payload),
	});
}

export function createSentence(payload) {
	return request("/admin/sentences", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export function duplicateSentence(externalId) {
	return request(`/admin/sentences/${externalId}/duplicate`, {
		method: "POST",
	});
}

export function replaceSentenceBlocks(externalId, blocks) {
	return request(`/admin/sentences/${externalId}/blocks`, {
		method: "PUT",
		body: JSON.stringify({ blocks }),
	});
}

export function deleteSentence(externalId) {
	return request(`/admin/sentences/${externalId}`, {
		method: "DELETE",
	});
}

export function updateBlock(externalId, payload) {
	return request(`/admin/blocks/${externalId}`, {
		method: "PATCH",
		body: JSON.stringify(payload),
	});
}

export function createBlock(payload) {
	return request("/admin/blocks", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export function deleteBlock(externalId) {
	return request(`/admin/blocks/${externalId}`, {
		method: "DELETE",
	});
}

export function regenerateSentenceAudio(externalId, payload = {}) {
	return request(`/admin/sentences/${externalId}/regenerate-audio`, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export function regenerateBlockAudio(externalId) {
	return request(`/admin/blocks/${externalId}/regenerate-audio`, {
		method: "POST",
	});
}
