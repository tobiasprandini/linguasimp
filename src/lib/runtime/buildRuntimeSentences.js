import { getBlockDetails } from "../getBlockDetails";
import { getAudioUrl } from "../getAudioUrl";
import { extractContextualTipFromTags } from "../contextualTipTags.js";

const DEFAULT_LESSON_ID = "lesson_1";
const LESSON_CONTEXT_TAG_PREFIX = "lesson:";

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

function getDbSentenceLessonId(dbSentence) {
	if (dbSentence?.lesson_id) {
		return normalizeLessonId(dbSentence.lesson_id);
	}

	const lessonTag = (dbSentence?.context_tags ?? []).find((tag) =>
		String(tag).startsWith(LESSON_CONTEXT_TAG_PREFIX),
	);

	return lessonTag
		? normalizeLessonId(String(lessonTag).slice(LESSON_CONTEXT_TAG_PREFIX.length))
		: DEFAULT_LESSON_ID;
}

function buildDbBlockMap(blockRows = []) {
	return Object.fromEntries(
		blockRows
			.filter((block) => block.id)
			.map((block) => [block.id, block]),
	);
}

function buildSentenceBlockMap(sentenceBlockRows = []) {
	const grouped = new Map();

	for (const row of sentenceBlockRows) {
		if (!row.sentence_id) {
			continue;
		}

		const currentRows = grouped.get(row.sentence_id) ?? [];
		currentRows.push(row);
		grouped.set(row.sentence_id, currentRows);
	}

	for (const rows of grouped.values()) {
		rows.sort((a, b) => a.order_index - b.order_index);
	}

	return grouped;
}

function normalizeSentenceShape(sentence, dbSentence = null) {
	return {
		...sentence,
		text: dbSentence?.text ?? sentence.text,
		translation: dbSentence?.translation ?? sentence.translation,
		lessonId: dbSentence ? getDbSentenceLessonId(dbSentence) : sentence.lessonId ?? DEFAULT_LESSON_ID,
		level: dbSentence?.level ?? sentence.level,
		difficultyScore:
			dbSentence?.difficulty_score ?? sentence.difficultyScore ?? 0,
		naturalnessScore:
			dbSentence?.naturalness_score ?? sentence.naturalnessScore ?? 0,
		topicTags: dbSentence?.topic_tags ?? sentence.topicTags ?? [],
		grammarTags: dbSentence?.grammar_tags ?? sentence.grammarTags ?? [],
		audioPath: dbSentence?.audio_path ?? sentence.audioPath ?? null,
		audio:
			dbSentence?.audio_path
				? getAudioUrl("sentence-audio", dbSentence.audio_path)
				: sentence.audio ?? null,
	};
}

function buildRuntimeBlock(blockSource, dbBlock) {
	const localBlockDetails = getBlockDetails(blockSource.blockId);

	return {
		...localBlockDetails,
		...blockSource,
		gloss: dbBlock?.core_meaning ?? localBlockDetails?.gloss ?? "",
		languageCode: dbBlock?.language_code ?? localBlockDetails?.languageCode ?? null,
		pronunciationHint: dbBlock?.pronunciation_hint ?? null,
		contextualTip:
			dbBlock?.contextual_tip ?? extractContextualTipFromTags(dbBlock?.tags),
		contextualMeaning:
			blockSource.contextualGloss ??
			dbBlock?.core_meaning ??
			localBlockDetails?.gloss ??
			"",
		audioPath: dbBlock?.audio_path ?? localBlockDetails?.audioPath ?? null,
		audio:
			dbBlock?.audio_path
				? getAudioUrl("block-audio", dbBlock.audio_path)
				: blockSource.audio ?? null,
	};
}

function buildSentenceFromDatabase(dbSentence, sentenceBlockRows, dbBlocksByExternalId) {
	if (!dbSentence?.id || !sentenceBlockRows?.length) {
		return null;
	}

	return normalizeSentenceShape(
		{
			id: dbSentence.id,
			text: dbSentence.text,
			translation: dbSentence.translation,
			lessonId: getDbSentenceLessonId(dbSentence),
			level: dbSentence.level,
			difficultyScore: dbSentence.difficulty_score,
			naturalnessScore: dbSentence.naturalness_score,
			topicTags: dbSentence.topic_tags ?? [],
			grammarTags: dbSentence.grammar_tags ?? [],
			blocks: sentenceBlockRows.map((row) =>
				buildRuntimeBlock(
					{
						id: row.id,
						blockId: row.block_id,
						surface: row.surface,
						contextualGloss: row.contextual_gloss ?? "",
					},
					dbBlocksByExternalId[row.block_id] ?? null,
				),
			),
		},
		dbSentence,
	);
}

function buildDbSentenceWithoutBlocks(dbSentence) {
	if (!dbSentence?.id) {
		return null;
	}

	return normalizeSentenceShape(
		{
			id: dbSentence.id,
			text: dbSentence.text,
			translation: dbSentence.translation,
			lessonId: getDbSentenceLessonId(dbSentence),
			level: dbSentence.level,
			difficultyScore: dbSentence.difficulty_score,
			naturalnessScore: dbSentence.naturalness_score,
			topicTags: dbSentence.topic_tags ?? [],
			grammarTags: dbSentence.grammar_tags ?? [],
			blocks: [],
		},
		dbSentence,
	);
}

export function buildRuntimeSentences({
	dbSentenceRows = [],
	dbBlockRows = [],
	dbSentenceBlockRows = [],
}) {
	const dbBlocksByExternalId = buildDbBlockMap(dbBlockRows);
	const sentenceBlocksBySentenceId = buildSentenceBlockMap(dbSentenceBlockRows);
	return (dbSentenceRows ?? [])
		.map((dbSentence) => {
			const dbSentenceBlocks = sentenceBlocksBySentenceId.get(dbSentence.id) ?? [];

			if (dbSentenceBlocks.length > 0) {
				return buildSentenceFromDatabase(
					dbSentence,
					dbSentenceBlocks,
					dbBlocksByExternalId,
				);
			}

			return buildDbSentenceWithoutBlocks(dbSentence);
		})
		.filter(Boolean);
}
