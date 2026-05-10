import { extractContextualTipFromTags } from "./contextualTipTags";
import { supabase } from "./supabase";

const DEFAULT_LESSON_ID = "lesson_1";
const LESSON_CONTEXT_TAG_PREFIX = "lesson:";
const CONTEXTUAL_TIP_TAG_PREFIX = "contextual_tip:";
const ADMIN_BACKEND_ERROR =
	"Backend do admin nao configurado. Defina VITE_API_BASE_URL na Vercel para salvar alteracoes e gerar audio.";

function getApiBaseUrl() {
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

async function request(path, options = {}) {
	const apiBaseUrl = getApiBaseUrl();

	if (!apiBaseUrl) {
		throw new Error(ADMIN_BACKEND_ERROR);
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

function normalizeLessonId(value) {
	const rawValue = String(value ?? "").trim().toLowerCase();
	const numericMatch = rawValue.match(/\b([1-9][0-9]*)\b/);

	if (rawValue.startsWith("lesson_")) {
		return rawValue.replace(/[^a-z0-9_]/g, "") || DEFAULT_LESSON_ID;
	}

	if (numericMatch) {
		return `lesson_${numericMatch[1]}`;
	}

	return DEFAULT_LESSON_ID;
}

function getLessonIdFromContextTags(contextTags = []) {
	const lessonTag = (contextTags ?? []).find((tag) =>
		String(tag).startsWith(LESSON_CONTEXT_TAG_PREFIX),
	);

	return lessonTag
		? normalizeLessonId(String(lessonTag).slice(LESSON_CONTEXT_TAG_PREFIX.length))
		: DEFAULT_LESSON_ID;
}

function hydrateSentenceLesson(sentence) {
	if (!sentence) {
		return sentence;
	}

	return {
		...sentence,
		lesson_id:
			sentence.lesson_id ?? getLessonIdFromContextTags(sentence.context_tags ?? []),
	};
}

function omitContextualTipTags(tags = []) {
	return (Array.isArray(tags) ? tags : []).filter(
		(tag) => !String(tag).startsWith(CONTEXTUAL_TIP_TAG_PREFIX),
	);
}

async function fetchAdminRuntimeDataFromSupabase() {
	const [
		sentencesResponse,
		blocksResponse,
		sentenceBlocksResponse,
	] = await Promise.all([
		supabase
			.from("sentences")
			.select(
				"id, text, translation, level, difficulty_score, naturalness_score, topic_tags, grammar_tags, context_tags, audio_path, status, source, language_code, lesson_id, speech_speed",
			)
			.order("id"),
		supabase
			.from("blocks")
			.select(
				"id, canonical_text, core_meaning, pronunciation_hint, contextual_tip, block_type, tags, language_code, audio_path",
			)
			.order("id"),
		supabase
			.from("sentence_blocks")
			.select("id, sentence_id, block_id, order_index, surface, contextual_gloss")
			.order("sentence_id")
			.order("order_index"),
	]);

	const firstError =
		sentencesResponse.error ??
		blocksResponse.error ??
		sentenceBlocksResponse.error;

	if (firstError) {
		throw firstError;
	}

	return {
		ok: true,
		data: {
			sentences: (sentencesResponse.data ?? []).map(hydrateSentenceLesson),
			blocks: (blocksResponse.data ?? []).map((block) => ({
				...block,
				contextual_tip:
					block.contextual_tip ?? extractContextualTipFromTags(block.tags),
				tags: omitContextualTipTags(block.tags),
			})),
			sentenceBlocks: sentenceBlocksResponse.data ?? [],
		},
	};
}

export function fetchAdminRuntimeData() {
	if (!getApiBaseUrl()) {
		return fetchAdminRuntimeDataFromSupabase();
	}

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
