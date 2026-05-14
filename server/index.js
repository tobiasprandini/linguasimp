import "dotenv/config";
import express from "express";
import cors from "cors";
import { supabase } from "./lib/supabase.js";
import { streamToBuffer } from "./lib/audio.js";
import { elevenlabs, resolveElevenLabsVoiceId } from "./lib/elevenlabs.js";

const app = express();
const DEFAULT_LESSON_ID = "lesson_1";
const LESSON_CONTEXT_TAG_PREFIX = "lesson:";
const CONTEXTUAL_TIP_TAG_PREFIX = "contextual_tip:";
const DEFAULT_SENTENCE_SPEECH_SPEED = 1;
const MIN_SENTENCE_SPEECH_SPEED = 0.7;
const MAX_SENTENCE_SPEECH_SPEED = 1.2;

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

function normalizeLanguageCode(value) {
	const normalizedValue = String(value ?? "")
		.trim()
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");
	const languageAliases = {
		en: "en",
		english: "en",
		ingles: "en",
		es: "es",
		spanish: "es",
		espanhol: "es",
		fr: "fr",
		french: "fr",
		frances: "fr",
		de: "de",
		german: "de",
		alemao: "de",
		it: "it",
		italian: "it",
		italiano: "it",
		ru: "ru",
		russian: "ru",
		russo: "ru",
		no: "no",
		nb: "no",
		nn: "no",
		norwegian: "no",
		noruegues: "no",
		el: "el",
		gr: "el",
		greek: "el",
		grego: "el",
		zh: "zh",
		cn: "zh",
		chinese: "zh",
		chines: "zh",
		ja: "ja",
		jp: "ja",
		japanese: "ja",
		japones: "ja",
		日本語: "ja",
		日本: "ja",
	};

	return languageAliases[normalizedValue] ?? normalizedValue ?? "en";
}

function getLessonIdFromContextTags(contextTags = []) {
	const lessonTag = (contextTags ?? []).find((tag) =>
		String(tag).startsWith(LESSON_CONTEXT_TAG_PREFIX),
	);

	return lessonTag
		? normalizeLessonId(String(lessonTag).slice(LESSON_CONTEXT_TAG_PREFIX.length))
		: DEFAULT_LESSON_ID;
}

function withLessonContextTag(contextTags = [], lessonId = DEFAULT_LESSON_ID) {
	const normalizedLessonId = normalizeLessonId(lessonId);
	const tagsWithoutLesson = (contextTags ?? []).filter(
		(tag) => !String(tag).startsWith(LESSON_CONTEXT_TAG_PREFIX),
	);

	return [...tagsWithoutLesson, `${LESSON_CONTEXT_TAG_PREFIX}${normalizedLessonId}`];
}

function hydrateSentenceLesson(sentence) {
	if (!sentence) {
		return sentence;
	}

	return {
		...sentence,
		lesson_id:
			sentence.lesson_id ??
			getLessonIdFromContextTags(sentence.context_tags ?? []),
	};
}

function isMissingLessonIdColumn(error) {
	return error?.message?.includes("lesson_id");
}

function isMissingSpeechSpeedColumn(error) {
	return error?.message?.includes("speech_speed");
}

function createMissingSpeechSpeedColumnError() {
	return new Error(
		"A coluna speech_speed ainda nao esta disponivel no Supabase. Rode a migration de speech_speed e recarregue o schema cache com: notify pgrst, 'reload schema';",
	);
}

function omitLessonId(payload) {
	const { lesson_id: _lessonId, ...rest } = payload;
	return rest;
}

function omitMissingSentenceColumns(payload, error) {
	let nextPayload = payload;

	if (isMissingLessonIdColumn(error)) {
		nextPayload = omitLessonId(nextPayload);
	}

	return nextPayload;
}

function normalize(text) {
	return text.toLowerCase().trim().replace(/\s+/g, " ");
}

function buildSafeSlug(text) {
	return String(text ?? "")
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9\s-]/g, "")
		.trim()
		.replace(/\s+/g, "-")
		.slice(0, 50);
}

function normalizeSentenceSpeechSpeed(value) {
	const numericValue = Number(value);

	if (!Number.isFinite(numericValue)) {
		return DEFAULT_SENTENCE_SPEECH_SPEED;
	}

	return Math.min(
		Math.max(numericValue, MIN_SENTENCE_SPEECH_SPEED),
		MAX_SENTENCE_SPEECH_SPEED,
	);
}

async function buildSentenceExternalId(payload) {
	const normalizedLevel = String(payload.level ?? "A1").trim().toUpperCase();
	const levelSlug = normalizedLevel.toLowerCase();
	const idPattern = new RegExp(`^sent_${levelSlug}_(\\d+)$`);
	const { data: existingSentences, error } = await supabase
		.from("sentences")
		.select("id")
		.eq("level", normalizedLevel);

	if (error) {
		throw new Error(error.message);
	}

	const currentMax =
		(existingSentences ?? []).reduce((maxValue, sentence) => {
			const match = String(sentence.id ?? "").match(idPattern);
			const numericPart = Number(match?.[1] ?? 0);
			return Math.max(maxValue, numericPart);
		}, 0) || 0;

	return `sent_${levelSlug}_${String(currentMax + 1).padStart(3, "0")}`;
}

function buildBlockExternalId(payload) {
	const languageCode = normalizeLanguageCode(payload.language_code ?? "en");
	const slug = buildSafeSlug(
		payload.canonical_text || payload.core_meaning || "block",
	);
	return `blk_${languageCode}_${slug || Date.now()}`;
}

function buildDuplicateSentenceExternalId(sentence) {
	return `${sentence.id}_copy_${Date.now()}`;
}

function omitDatabaseId(record) {
	if (!record || typeof record !== "object") {
		return record;
	}

	const { id: _id, ...rest } = record;
	return rest;
}

async function generateAudioBuffer(text, { languageCode, audioKind, speechSpeed } = {}) {
	const voiceId = resolveElevenLabsVoiceId({ languageCode, audioKind });
	const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
	const normalizedSpeechSpeed =
		speechSpeed === undefined ? null : normalizeSentenceSpeechSpeed(speechSpeed);
	const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
		text,
		modelId,
		languageCode,
		outputFormat: "mp3_44100_128",
		...(normalizedSpeechSpeed
			? {
					voiceSettings: {
						speed: normalizedSpeechSpeed,
					},
				}
			: {}),
	});

	return {
		audioBuffer: await streamToBuffer(audioStream),
		voiceId,
	};
}

async function uploadAudioToBucket(bucket, filePath, audioBuffer) {
	const { error } = await supabase.storage.from(bucket).upload(filePath, audioBuffer, {
		contentType: "audio/mpeg",
		upsert: true,
	});

	if (error) {
		throw new Error(error.message);
	}
}

async function removeAudioFromBucket(bucket, filePath) {
	if (!filePath) {
		return;
	}

	const { error } = await supabase.storage.from(bucket).remove([filePath]);

	if (error) {
		console.warn(`Nao foi possivel remover ${filePath} de ${bucket}: ${error.message}`);
	}
}

async function regenerateSentenceAudioByExternalId(externalId, options = {}) {
	let { data: sentence, error: fetchError } = await supabase
		.from("sentences")
		.select("id, text, language_code, audio_path, speech_speed")
		.eq("id", externalId)
		.single();

	if (isMissingSpeechSpeedColumn(fetchError)) {
		throw createMissingSpeechSpeedColumnError();
	}

	if (fetchError || !sentence?.text) {
		throw new Error(fetchError?.message || "Frase nao encontrada.");
	}

	const previousAudioPath = sentence.audio_path ?? null;
	const speechSpeed = normalizeSentenceSpeechSpeed(
		options.speechSpeed ?? sentence.speech_speed,
	);
	const { audioBuffer } = await generateAudioBuffer(sentence.text, {
		languageCode: sentence.language_code,
		audioKind: "sentence",
		speechSpeed,
	});
	const filePath = `sentences/${sentence.id || buildSafeSlug(sentence.text)}-${Date.now()}.mp3`;

	await uploadAudioToBucket("sentence-audio", filePath, audioBuffer);

	let { data, error: updateError } = await supabase
		.from("sentences")
		.update({
			audio_path: filePath,
			speech_speed: speechSpeed,
		})
		.eq("id", externalId)
		.select()
		.single();

	if (isMissingSpeechSpeedColumn(updateError)) {
		throw createMissingSpeechSpeedColumnError();
	}

	if (updateError) {
		throw new Error(updateError.message);
	}

	if (previousAudioPath && previousAudioPath !== filePath) {
		await removeAudioFromBucket("sentence-audio", previousAudioPath);
	}

	return data;
}

async function regenerateBlockAudioByExternalId(externalId) {
	const { data: block, error: fetchError } = await supabase
		.from("blocks")
		.select("id, canonical_text, pronunciation_hint, language_code, audio_path")
		.eq("id", externalId)
		.single();

	if (fetchError || !block?.canonical_text) {
		throw new Error(fetchError?.message || "Bloco nao encontrado.");
	}

	const previousAudioPath = block.audio_path ?? null;
	const textForSpeech =
		String(block.pronunciation_hint ?? "").trim() || block.canonical_text;
	const { audioBuffer } = await generateAudioBuffer(textForSpeech, {
		languageCode: block.language_code,
		audioKind: "block",
	});
	const filePath = `blocks/${block.id || buildSafeSlug(block.canonical_text)}-${Date.now()}.mp3`;

	await uploadAudioToBucket("block-audio", filePath, audioBuffer);

	const { data, error: updateError } = await supabase
		.from("blocks")
		.update({
			audio_path: filePath,
		})
		.eq("id", externalId)
		.select()
		.single();

	if (updateError) {
		throw new Error(updateError.message);
	}

	if (previousAudioPath && previousAudioPath !== filePath) {
		await removeAudioFromBucket("block-audio", previousAudioPath);
	}

	return data;
}

function parseTextArray(value) {
	if (Array.isArray(value)) {
		return value.map((item) => String(item).trim()).filter(Boolean);
	}

	if (typeof value === "string") {
		return value
			.split(",")
			.map((item) => item.trim())
			.filter(Boolean);
	}

	return [];
}

function extractContextualTipFromTags(tags) {
	return (
		(Array.isArray(tags) ? tags : [])
			.find((tag) => String(tag).startsWith(CONTEXTUAL_TIP_TAG_PREFIX))
			?.slice(CONTEXTUAL_TIP_TAG_PREFIX.length)
			.trim() ?? ""
	);
}

function omitContextualTipTags(tags) {
	return (Array.isArray(tags) ? tags : []).filter(
		(tag) => !String(tag).startsWith(CONTEXTUAL_TIP_TAG_PREFIX),
	);
}

function withContextualTipTag(tags, contextualTip) {
	const cleanTags = omitContextualTipTags(tags);
	const normalizedTip = String(contextualTip ?? "").trim();

	return normalizedTip
		? [...cleanTags, `${CONTEXTUAL_TIP_TAG_PREFIX}${normalizedTip}`]
		: cleanTags;
}

function sanitizeSentencePayload(payload) {
	const lessonId = normalizeLessonId(payload.lesson_id);
	const contextTags = withLessonContextTag(
		parseTextArray(payload.context_tags),
		lessonId,
	);

	return {
		text: payload.text,
		translation: payload.translation,
		level: payload.level,
		difficulty_score: Number(payload.difficulty_score ?? 0),
		naturalness_score: Number(payload.naturalness_score ?? 0),
		topic_tags: parseTextArray(payload.topic_tags),
		grammar_tags: parseTextArray(payload.grammar_tags),
		context_tags: contextTags,
		language_code: normalizeLanguageCode(payload.language_code ?? "en"),
		lesson_id: lessonId,
		status: payload.status || "draft",
		source: payload.source || "manual",
		speech_speed: normalizeSentenceSpeechSpeed(payload.speech_speed),
	};
}

function sanitizeBlockPayload(payload) {
	const canonicalText = String(payload.canonical_text ?? "").trim();
	const contextualTip = String(payload.contextual_tip ?? "").trim() || null;

	return {
		canonical_text: canonicalText,
		core_meaning: payload.core_meaning ?? "",
		pronunciation_hint:
			String(payload.pronunciation_hint ?? "").trim() || null,
		contextual_tip: contextualTip,
		block_type: payload.block_type || (canonicalText.includes(" ") ? "chunk" : "word"),
		tags: withContextualTipTag(parseTextArray(payload.tags), contextualTip),
		language_code: normalizeLanguageCode(payload.language_code ?? "en"),
	};
}

function isMissingPronunciationHintColumn(error) {
	return error?.message?.includes("pronunciation_hint");
}

function isMissingContextualTipColumn(error) {
	return error?.message?.includes("contextual_tip");
}

function omitPronunciationHint(payload) {
	const { pronunciation_hint: _PRONUNCIATION_HINT, ...rest } = payload;
	return rest;
}

function omitContextualTip(payload) {
	const { contextual_tip: _CONTEXTUAL_TIP, ...rest } = payload;
	return rest;
}

function omitMissingBlockColumns(payload, error) {
	let nextPayload = payload;

	if (isMissingPronunciationHintColumn(error)) {
		nextPayload = omitPronunciationHint(nextPayload);
	}

	if (isMissingContextualTipColumn(error)) {
		nextPayload = omitContextualTip(nextPayload);
	}

	return nextPayload;
}

async function ensureBlocksExistForSentenceBlocks(sentenceExternalId, sentenceBlocks) {
	const { data: sentence, error: sentenceError } = await supabase
		.from("sentences")
		.select("id, level, language_code")
		.eq("id", sentenceExternalId)
		.single();

	if (sentenceError || !sentence) {
		throw new Error(sentenceError?.message || "Frase nao encontrada.");
	}

	const resolvedBlocks = sentenceBlocks.map((block) => {
		const explicitBlockId = String(block.block_id ?? "").trim();
		const fallbackExternalId = buildBlockExternalId({
			canonical_text: block.surface,
			core_meaning: block.contextual_gloss,
			language_code: sentence.language_code,
		});

		return {
			...block,
			block_id: explicitBlockId || fallbackExternalId,
		};
	});

	const blockExternalIds = [
		...new Set(
			resolvedBlocks
				.map((block) => block.block_id)
				.filter(Boolean),
		),
	];

	if (blockExternalIds.length === 0) {
		return {
			resolvedBlocks,
			createdBlockIds: [],
		};
	}

	const { data: existingBlocks, error: existingBlocksError } = await supabase
		.from("blocks")
		.select("id")
		.in("id", blockExternalIds);

	if (existingBlocksError) {
		throw new Error(existingBlocksError.message);
	}

	const existingBlockIds = new Set(
		(existingBlocks ?? []).map((block) => block.id),
	);
	const missingBlocks = resolvedBlocks.filter(
		(block) => !existingBlockIds.has(block.block_id),
	);

	if (missingBlocks.length > 0) {
		const newBlockRows = missingBlocks.map((block) => ({
			id: block.block_id,
			canonical_text: String(block.surface ?? "").trim(),
			core_meaning: block.contextual_gloss ?? "",
			block_type: String(block.surface ?? "").trim().includes(" ")
				? "chunk"
				: "word",
			tags: [],
			language_code: sentence.language_code ?? "en",
			pronunciation_hint: null,
			audio_path: null,
		}));

		const { error: insertBlocksError } = await supabase
			.from("blocks")
			.insert(newBlockRows);

		if (insertBlocksError) {
			throw new Error(insertBlocksError.message);
		}
	}

	return {
		resolvedBlocks,
		createdBlockIds: missingBlocks.map((block) => block.block_id),
	};
}

async function asyncRouteHandler(handler, req, res) {
	try {
		await handler(req, res);
	} catch (error) {
		res.status(500).json({
			ok: false,
			error: error.message,
		});
	}
}

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
	res.json({ ok: true, message: "Servidor backend funcionando" });
});

app.post("/auth/signup", (request, response) =>
	asyncRouteHandler(async () => {
		const email = String(request.body?.email ?? "").trim().toLowerCase();
		const password = String(request.body?.password ?? "");
		const name = String(request.body?.name ?? "").trim();

		if (!email || !password) {
			response.status(400).json({
				ok: false,
				error: "Email e senha sao obrigatorios.",
			});
			return;
		}

		if (password.length < 6) {
			response.status(400).json({
				ok: false,
				error: "A senha precisa ter pelo menos 6 caracteres.",
			});
			return;
		}

		let { data, error } = await supabase.auth.admin.createUser({
			email,
			password,
			email_confirm: true,
			user_metadata: {
				name,
			},
		});

		if (error?.message?.toLowerCase().includes("already")) {
			const { data: usersData, error: listUsersError } =
				await supabase.auth.admin.listUsers({
					page: 1,
					perPage: 1000,
				});

			if (listUsersError) {
				throw new Error(listUsersError.message);
			}

			const existingUser = usersData.users.find(
				(user) => user.email?.toLowerCase() === email,
			);

			if (!existingUser) {
				throw new Error(error.message);
			}

			const updateResponse = await supabase.auth.admin.updateUserById(
				existingUser.id,
				{
					password,
					email_confirm: true,
					user_metadata: {
						...(existingUser.user_metadata ?? {}),
						name,
					},
				},
			);

			data = updateResponse.data;
			error = updateResponse.error;
		}

		if (error) {
			throw new Error(error.message);
		}

		response.status(201).json({
			ok: true,
			user: {
				id: data.user.id,
				email: data.user.email,
			},
		});
	}, request, response),
);

app.get("/admin/runtime-data", (req, res) =>
	asyncRouteHandler(async (_req, response) => {
		let { data: sentences, error: sentencesError } = await supabase
			.from("sentences")
			.select(
				"id, text, translation, level, difficulty_score, naturalness_score, topic_tags, grammar_tags, context_tags, audio_path, status, source, language_code, lesson_id, speech_speed",
			)
			.order("id");

		if (isMissingSpeechSpeedColumn(sentencesError)) {
			throw createMissingSpeechSpeedColumnError();
		}

		if (isMissingLessonIdColumn(sentencesError)) {
			const fallbackSentencesResponse = await supabase
				.from("sentences")
				.select(
					"id, text, translation, level, difficulty_score, naturalness_score, topic_tags, grammar_tags, context_tags, audio_path, status, source, language_code, speech_speed",
				)
				.order("id");

			sentences = (fallbackSentencesResponse.data ?? [])
				.map(hydrateSentenceLesson);
			sentencesError = fallbackSentencesResponse.error;
		} else {
			sentences = (sentences ?? []).map(hydrateSentenceLesson);
		}

		const { data: sentenceBlocks, error: sentenceBlocksError } = await supabase
			.from("sentence_blocks")
			.select(
				"id, sentence_id, block_id, order_index, surface, contextual_gloss",
			)
			.order("sentence_id")
			.order("order_index");

		let { data: blocks, error: blocksError } = await supabase
			.from("blocks")
			.select(
				"id, canonical_text, core_meaning, pronunciation_hint, contextual_tip, block_type, tags, language_code, audio_path",
			)
			.order("id");

		if (isMissingContextualTipColumn(blocksError)) {
			const fallbackBlocksResponse = await supabase
				.from("blocks")
				.select(
					"id, canonical_text, core_meaning, pronunciation_hint, block_type, tags, language_code, audio_path",
				)
				.order("id");

			blocks = (fallbackBlocksResponse.data ?? []).map((block) => ({
				...block,
				contextual_tip: extractContextualTipFromTags(block.tags),
			}));
			blocksError = fallbackBlocksResponse.error;
		}

		if (isMissingPronunciationHintColumn(blocksError)) {
			const fallbackBlocksResponse = await supabase
				.from("blocks")
				.select(
					"id, canonical_text, core_meaning, block_type, tags, language_code, audio_path",
				)
				.order("id");

			blocks = (fallbackBlocksResponse.data ?? []).map((block) => ({
				...block,
				pronunciation_hint: null,
				contextual_tip: extractContextualTipFromTags(block.tags),
			}));
			blocksError = fallbackBlocksResponse.error;
		}

		if (sentencesError || blocksError || sentenceBlocksError) {
			throw new Error(
				sentencesError?.message ||
					blocksError?.message ||
					sentenceBlocksError?.message ||
					"Nao foi possivel carregar dados do admin.",
			);
		}

		response.json({
			ok: true,
			data: {
				sentences: sentences ?? [],
				blocks: (blocks ?? []).map((block) => ({
					...block,
					contextual_tip:
						block.contextual_tip ?? extractContextualTipFromTags(block.tags),
					tags: omitContextualTipTags(block.tags),
				})),
				sentenceBlocks: sentenceBlocks ?? [],
			},
		});
	}, req, res),
);

app.post("/admin/sentences", (req, res) =>
	asyncRouteHandler(async (request, response) => {
		const payload = sanitizeSentencePayload(request.body ?? {});
		const externalId =
			String(request.body?.id ?? "").trim() ||
			(await buildSentenceExternalId(payload));

		let { data, error } = await supabase
			.from("sentences")
			.insert([
				{
					id: externalId,
					language_code: "en",
					audio_path: null,
					...payload,
				},
			])
			.select()
			.single();

		if (isMissingSpeechSpeedColumn(error)) {
			throw createMissingSpeechSpeedColumnError();
		}

		if (isMissingLessonIdColumn(error)) {
			const fallbackPayload = omitMissingSentenceColumns(payload, error);
			const fallbackResponse = await supabase
				.from("sentences")
				.insert([
					{
						id: externalId,
						language_code: "en",
						audio_path: null,
						...fallbackPayload,
					},
				])
				.select()
				.single();

			data = hydrateSentenceLesson(fallbackResponse.data);
			error = fallbackResponse.error;
		}

		if (error) {
			throw new Error(error.message);
		}

		response.json({ ok: true, data: hydrateSentenceLesson(data) });
	}, req, res),
);

app.post("/admin/sentences/:externalId/duplicate", (req, res) =>
	asyncRouteHandler(async (request, response) => {
		const externalId = request.params.externalId;
		const [{ data: sentence, error: sentenceError }, { data: sentenceBlocks, error: sentenceBlocksError }] =
			await Promise.all([
				supabase
					.from("sentences")
					.select("*")
					.eq("id", externalId)
					.single(),
				supabase
					.from("sentence_blocks")
					.select("*")
					.eq("sentence_id", externalId)
					.order("order_index"),
			]);

		if (sentenceError || !sentence) {
			throw new Error(sentenceError?.message || "Frase nao encontrada.");
		}

		if (sentenceBlocksError) {
			throw new Error(sentenceBlocksError.message);
		}

		const nextExternalId = buildDuplicateSentenceExternalId(sentence);
		const { data: duplicatedSentence, error: insertSentenceError } = await supabase
			.from("sentences")
			.insert([
				{
					...omitDatabaseId(sentence),
					id: nextExternalId,
					audio_path: null,
				},
			])
			.select()
			.single();

		if (insertSentenceError) {
			throw new Error(insertSentenceError.message);
		}

		if ((sentenceBlocks ?? []).length > 0) {
			const duplicatedBlocks = sentenceBlocks.map((block, index) => ({
				...omitDatabaseId(block),
				id: `${nextExternalId}_blk_${String(index + 1).padStart(3, "0")}`,
				sentence_id: nextExternalId,
			}));

			const { error: insertBlocksError } = await supabase
				.from("sentence_blocks")
				.insert(duplicatedBlocks);

			if (insertBlocksError) {
				throw new Error(insertBlocksError.message);
			}
		}

		response.json({ ok: true, data: duplicatedSentence });
	}, req, res),
);

app.patch("/admin/sentences/:externalId", (req, res) =>
	asyncRouteHandler(async (request, response) => {
		const externalId = request.params.externalId;
		const payload = sanitizeSentencePayload(request.body ?? {});
		const nextExternalId = String(request.body?.id ?? "").trim() || externalId;

		if (nextExternalId !== externalId) {
			const { data: existingSentence, error: existingSentenceError } = await supabase
				.from("sentences")
				.select("*")
				.eq("id", externalId)
				.single();

			if (existingSentenceError || !existingSentence) {
				throw new Error(existingSentenceError?.message || "Frase nao encontrada.");
			}

			const { data: conflictingSentence } = await supabase
				.from("sentences")
				.select("id")
				.eq("id", nextExternalId)
				.maybeSingle();

			if (conflictingSentence) {
				throw new Error("Ja existe uma frase com esse id.");
			}

			let { error: insertError } = await supabase
				.from("sentences")
				.insert([
					{
						...omitDatabaseId(existingSentence),
						id: nextExternalId,
						...payload,
					},
				])
				.select()
				.single();

			if (isMissingSpeechSpeedColumn(insertError)) {
				throw createMissingSpeechSpeedColumnError();
			}

			if (isMissingLessonIdColumn(insertError)) {
				const fallbackInsertResponse = await supabase
					.from("sentences")
					.insert([
						{
							...omitDatabaseId(existingSentence),
							id: nextExternalId,
							...omitMissingSentenceColumns(payload, insertError),
						},
					])
					.select()
					.single();

				insertError = fallbackInsertResponse.error;
			}

			if (insertError) {
				throw new Error(insertError.message);
			}

			const { data: existingSentenceBlocks, error: existingSentenceBlocksError } =
				await supabase
					.from("sentence_blocks")
					.select("id, order_index")
					.eq("sentence_id", externalId)
					.order("order_index");

			if (existingSentenceBlocksError) {
				throw new Error(existingSentenceBlocksError.message);
			}

			const { error: updateSentenceBlocksError } = await supabase
				.from("sentence_blocks")
				.update({ sentence_id: nextExternalId })
				.eq("sentence_id", externalId);

			if (updateSentenceBlocksError) {
				throw new Error(updateSentenceBlocksError.message);
			}

			for (const [index, sentenceBlock] of (existingSentenceBlocks ?? []).entries()) {
				const nextSentenceBlockExternalId = `${nextExternalId}_blk_${String(
					index + 1,
				).padStart(3, "0")}`;

				const { error: updateSentenceBlockIdError } = await supabase
					.from("sentence_blocks")
					.update({ id: nextSentenceBlockExternalId })
					.eq("id", sentenceBlock.id);

				if (updateSentenceBlockIdError) {
					throw new Error(updateSentenceBlockIdError.message);
				}
			}

			const { error: deleteOldSentenceError } = await supabase
				.from("sentences")
				.delete()
				.eq("id", externalId);

			if (deleteOldSentenceError) {
				throw new Error(deleteOldSentenceError.message);
			}

			const refreshedSentence = await regenerateSentenceAudioByExternalId(
				nextExternalId,
			);

			return response.json({ ok: true, data: refreshedSentence });
		}

		let { data, error } = await supabase
			.from("sentences")
			.update(payload)
			.eq("id", externalId)
			.select()
			.single();

		if (isMissingSpeechSpeedColumn(error)) {
			throw createMissingSpeechSpeedColumnError();
		}

		if (isMissingLessonIdColumn(error)) {
			const fallbackResponse = await supabase
				.from("sentences")
				.update(omitMissingSentenceColumns(payload, error))
				.eq("id", externalId)
				.select()
				.single();

			data = hydrateSentenceLesson(fallbackResponse.data);
			error = fallbackResponse.error;
		}

		if (error) {
			throw new Error(error.message);
		}

		response.json({ ok: true, data: hydrateSentenceLesson(data) });
	}, req, res),
);

app.delete("/admin/sentences/:externalId", (req, res) =>
	asyncRouteHandler(async (request, response) => {
		const externalId = request.params.externalId;

		const { error } = await supabase
			.from("sentences")
			.delete()
			.eq("id", externalId);

		if (error) {
			throw new Error(error.message);
		}

		response.json({ ok: true });
	}, req, res),
);

app.put("/admin/sentences/:externalId/blocks", (req, res) =>
	asyncRouteHandler(async (request, response) => {
		const externalId = request.params.externalId;
		const blocks = Array.isArray(request.body?.blocks) ? request.body.blocks : [];
		const { resolvedBlocks, createdBlockIds } =
			await ensureBlocksExistForSentenceBlocks(
			externalId,
			blocks,
		);

		const normalizedBlocks = resolvedBlocks.map((block, index) => ({
			id:
				block.id ||
				`${externalId}_blk_${String(index + 1).padStart(3, "0")}`,
			sentence_id: externalId,
			block_id: block.block_id,
			order_index: index,
			surface: block.surface,
			contextual_gloss: block.contextual_gloss ?? null,
		}));

		const { error: deleteError } = await supabase
			.from("sentence_blocks")
			.delete()
			.eq("sentence_id", externalId);

		if (deleteError) {
			throw new Error(deleteError.message);
		}

		if (normalizedBlocks.length > 0) {
			const { error: insertError } = await supabase
				.from("sentence_blocks")
				.insert(normalizedBlocks);

			if (insertError) {
				throw new Error(insertError.message);
			}
		}

		const audioGenerationResults = await Promise.allSettled(
			createdBlockIds.map((blockExternalId) =>
				regenerateBlockAudioByExternalId(blockExternalId),
			),
		);
		const audioGenerationErrors = audioGenerationResults
			.filter((result) => result.status === "rejected")
			.map((result) => result.reason?.message ?? "Erro ao gerar audio do bloco.");

		response.json({
			ok: true,
			data: normalizedBlocks,
			meta: {
				createdBlockIds,
				audioGeneratedCount: createdBlockIds.length - audioGenerationErrors.length,
				audioGenerationErrors,
			},
		});
	}, req, res),
);

app.post("/admin/blocks", (req, res) =>
	asyncRouteHandler(async (request, response) => {
		const payload = sanitizeBlockPayload(request.body ?? {});
		const externalId =
			String(request.body?.id ?? "").trim() ||
			buildBlockExternalId(payload);

		let { data, error } = await supabase
			.from("blocks")
			.insert([
				{
					id: externalId,
					audio_path: null,
					...payload,
				},
			])
			.select()
			.single();

		if (
			isMissingPronunciationHintColumn(error) ||
			isMissingContextualTipColumn(error)
		) {
			const retryResponse = await supabase
				.from("blocks")
				.insert([
					{
						id: externalId,
						audio_path: null,
						...omitMissingBlockColumns(payload, error),
					},
				])
				.select()
				.single();

			data = retryResponse.data
				? {
						...retryResponse.data,
						pronunciation_hint: payload.pronunciation_hint,
						contextual_tip: payload.contextual_tip,
					}
				: null;
			error = retryResponse.error;
		}

		if (error) {
			throw new Error(error.message);
		}

		response.json({ ok: true, data });
	}, req, res),
);

app.delete("/admin/blocks/:externalId", (req, res) =>
	asyncRouteHandler(async (request, response) => {
		const externalId = request.params.externalId;
		const { data: linkedRows, error: linkedRowsError } = await supabase
			.from("sentence_blocks")
			.select("id")
			.eq("block_id", externalId)
			.limit(1);

		if (linkedRowsError) {
			throw new Error(linkedRowsError.message);
		}

		if ((linkedRows ?? []).length > 0) {
			const { error: unlinkError } = await supabase
				.from("sentence_blocks")
				.delete()
				.eq("block_id", externalId);

			if (unlinkError) {
				throw new Error(unlinkError.message);
			}
		}

		const { error } = await supabase
			.from("blocks")
			.delete()
			.eq("id", externalId);

		if (error) {
			throw new Error(error.message);
		}

		response.json({ ok: true });
	}, req, res),
);

app.patch("/admin/blocks/:externalId", (req, res) =>
	asyncRouteHandler(async (request, response) => {
		const externalId = request.params.externalId;
		const payload = sanitizeBlockPayload(request.body ?? {});
		const nextExternalId = String(request.body?.id ?? "").trim() || externalId;

		if (nextExternalId !== externalId) {
			const { data: existingBlock, error: existingBlockError } = await supabase
				.from("blocks")
				.select("*")
				.eq("id", externalId)
				.single();

			if (existingBlockError || !existingBlock) {
				throw new Error(existingBlockError?.message || "Bloco nao encontrado.");
			}

			const { data: conflictingBlock } = await supabase
				.from("blocks")
				.select("id")
				.eq("id", nextExternalId)
				.maybeSingle();

			if (conflictingBlock) {
				throw new Error("Ja existe um bloco com esse id.");
			}

			let { error: insertError } = await supabase
				.from("blocks")
				.insert([
					{
						...omitDatabaseId(existingBlock),
						id: nextExternalId,
						...payload,
					},
				])
				.select()
				.single();

			if (
				isMissingPronunciationHintColumn(insertError) ||
				isMissingContextualTipColumn(insertError)
			) {
				const retryResponse = await supabase
					.from("blocks")
					.insert([
						{
							...omitMissingBlockColumns(
								omitDatabaseId(existingBlock),
								insertError,
							),
							id: nextExternalId,
							...omitMissingBlockColumns(payload, insertError),
						},
					])
					.select()
					.single();

				insertError = retryResponse.error;
			}

			if (insertError) {
				throw new Error(insertError.message);
			}

			const { error: updateSentenceBlocksError } = await supabase
				.from("sentence_blocks")
				.update({ block_id: nextExternalId })
				.eq("block_id", externalId);

			if (updateSentenceBlocksError) {
				throw new Error(updateSentenceBlocksError.message);
			}

			const { error: deleteOldBlockError } = await supabase
				.from("blocks")
				.delete()
				.eq("id", externalId);

			if (deleteOldBlockError) {
				throw new Error(deleteOldBlockError.message);
			}

			const refreshedBlock = await regenerateBlockAudioByExternalId(
				nextExternalId,
			);

			return response.json({ ok: true, data: refreshedBlock });
		}

		let { data, error } = await supabase
			.from("blocks")
			.update(payload)
			.eq("id", externalId)
			.select()
			.single();

		if (
			isMissingPronunciationHintColumn(error) ||
			isMissingContextualTipColumn(error)
		) {
			const retryResponse = await supabase
				.from("blocks")
				.update(omitMissingBlockColumns(payload, error))
				.eq("id", externalId)
				.select()
				.single();

			data = retryResponse.data
				? {
						...retryResponse.data,
						pronunciation_hint: payload.pronunciation_hint,
						contextual_tip: payload.contextual_tip,
					}
				: null;
			error = retryResponse.error;
		}

		if (error) {
			throw new Error(error.message);
		}

		response.json({ ok: true, data });
	}, req, res),
);

app.post("/admin/sentences/:externalId/regenerate-audio", (req, res) =>
	asyncRouteHandler(async (request, response) => {
		const externalId = request.params.externalId;
		const data = await regenerateSentenceAudioByExternalId(externalId, {
			speechSpeed: request.body?.speech_speed,
		});

		response.json({ ok: true, data });
	}, req, res),
);

app.post("/admin/blocks/:externalId/regenerate-audio", (req, res) =>
	asyncRouteHandler(async (request, response) => {
		const externalId = request.params.externalId;
		const data = await regenerateBlockAudioByExternalId(externalId);

		response.json({ ok: true, data });
	}, req, res),
);

app.post("/generate-sentence-audio", async (req, res) => {
	try {
		const { text, language_code, speech_speed } = req.body;

		if (!text || !language_code) {
			return res.status(400).json({
				ok: false,
				error: "text e language_code sao obrigatorios.",
			});
		}

		const normalizedText = normalize(text);

		const { data: existingCandidates, error: fetchError } = await supabase
			.from("sentences")
			.select("*")
			.eq("language_code", language_code)
			.limit(200);

		if (fetchError) {
			return res.status(500).json({
				ok: false,
				error: fetchError.message,
			});
		}

		const existing = existingCandidates?.find(
			(sentence) => normalize(sentence.text) === normalizedText,
		);

		if (existing) {
			return res.json({
				ok: true,
				data: [existing],
				reused: true,
			});
		}

		const { audioBuffer } = await generateAudioBuffer(text, {
			languageCode: language_code,
			audioKind: "sentence",
			speechSpeed: speech_speed,
		});
		const safeText = buildSafeSlug(text);
		const filePath = `sentences/${Date.now()}-${safeText || "audio"}.mp3`;

		await uploadAudioToBucket("sentence-audio", filePath, audioBuffer);

		const speechSpeed = normalizeSentenceSpeechSpeed(speech_speed);
		let { data, error: insertError } = await supabase
			.from("sentences")
			.insert([
				{
					id: `gen_${Date.now()}`,
					text,
					translation: text,
					language_code,
					status: "draft",
					source: "ai_generated",
					audio_path: filePath,
					speech_speed: speechSpeed,
				},
			])
			.select();

		if (isMissingSpeechSpeedColumn(insertError)) {
			const fallbackInsertResponse = await supabase
				.from("sentences")
				.insert([
					{
						id: `gen_${Date.now()}`,
						text,
						translation: text,
						language_code,
						status: "draft",
						source: "ai_generated",
						audio_path: filePath,
					},
				])
				.select();

			data = fallbackInsertResponse.data;
			insertError = fallbackInsertResponse.error;
		}

		if (insertError) {
			return res.status(500).json({
				ok: false,
				error: insertError.message,
			});
		}

		res.json({
			ok: true,
			data,
		});
	} catch (err) {
		res.status(500).json({
			ok: false,
			error: err.message,
		});
	}
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
	console.log(`Servidor backend rodando na porta ${PORT}`);
});
