function normalizeBlockText(text) {
	return text.toLowerCase().trim().replace(/\s+/g, " ");
}

function inferCurriculumGroup(tags) {
	if (tags.includes("subject") || tags.includes("object")) {
		return "core_pronouns";
	}

	if (
		tags.includes("verb") ||
		tags.includes("verb_chunk") ||
		tags.includes("obligation") ||
		tags.includes("ability") ||
		tags.includes("connector")
	) {
		return "grammar_core";
	}

	if (tags.includes("time")) {
		return "time_expressions";
	}

	if (tags.includes("place") || tags.includes("movement") || tags.includes("transport")) {
		return "location_and_movement";
	}

	if (tags.includes("feeling") || tags.includes("social")) {
		return "social_and_feelings";
	}

	if (tags.includes("food") || tags.includes("drink")) {
		return "food_and_drink";
	}

	if (tags.includes("study") || tags.includes("learning") || tags.includes("digital")) {
		return "study_and_routine";
	}

	if (tags.includes("work")) {
		return "work_and_routine";
	}

	return "general_vocab";
}

function inferGrammarFocus(tags) {
	if (tags.includes("to_be")) {
		return "to_be";
	}

	if (tags.includes("obligation")) {
		return "obligation";
	}

	if (tags.includes("ability")) {
		return "modals";
	}

	if (tags.includes("connector")) {
		return "connectors";
	}

	if (tags.includes("verb") || tags.includes("verb_chunk")) {
		return "verb_phrase";
	}

	return "lexical";
}

function inferChunkStrategy(canonical, tags) {
	if (!canonical.includes(" ")) {
		return "single_token";
	}

	if (
		tags.includes("obligation") ||
		tags.includes("connector") ||
		tags.includes("ability") ||
		tags.includes("request")
	) {
		return "keep_as_chunk";
	}

	return "review_for_split";
}

function createBlockFromDb({
	id,
	canonicalText,
	coreMeaning,
	blockType,
	tags = [],
	languageCode = "en",
	audioPath = null,
}) {
	return {
		id,
		canonical: canonicalText,
		normalizedText: normalizeBlockText(canonicalText),
		blockKind: blockType,
		gloss: coreMeaning,
		tags,
		level: null,
		curriculumGroup: inferCurriculumGroup(tags),
		grammarFocus: inferGrammarFocus(tags),
		teachingPriority: "medium",
		chunkStrategy: inferChunkStrategy(canonicalText, tags),
		languageCode,
		audioPath,
		audioStatus: audioPath ? "generated" : "pending",
		voiceProvider: null,
		voiceId: null,
		lastGeneratedAt: null,
		generationError: null,
	};
}

export const blocks = [
	createBlockFromDb({
		id: "blk_have_to",
		canonicalText: "have to",
		coreMeaning: "ter que",
		blockType: "expression",
		audioPath: "blocks/blk_have_to-1776138555186.mp3",
	}),
	createBlockFromDb({
		id: "blk_i",
		canonicalText: "I",
		coreMeaning: "eu",
		blockType: "word",
		audioPath: "blocks/blk_i-1776138563298.mp3",
	}),
	createBlockFromDb({
		id: "blk_tomorrow",
		canonicalText: "tomorrow",
		coreMeaning: "amanhã",
		blockType: "word",
		audioPath: "blocks/blk_tomorrow-1776138577180.mp3",
	}),
	createBlockFromDb({
		id: "blk_work",
		canonicalText: "work",
		coreMeaning: "trabalhar",
		blockType: "word",
		audioPath: "blocks/blk_work-1776138586086.mp3",
	}),
];
