import { apiRequest as request } from "./apiClient";

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
