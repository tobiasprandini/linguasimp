import "dotenv/config";
import { supabase } from "../lib/supabase.js";
import { sentences } from "../../src/data/sentences/index.js";

async function importSentences() {
	for (const sentence of sentences) {
		const id = sentence.id;

		if (!sentence.text || !id) {
			console.log("Pulando frase invalida:", sentence);
			continue;
		}

		const payload = {
			id,
			text: sentence.text,
			translation: sentence.translation,
			language_code: "en",
			lesson_id: sentence.lessonId ?? sentence.lesson_id ?? "lesson_1",
			level: sentence.level,
			difficulty_score: sentence.difficultyScore,
			naturalness_score: sentence.naturalnessScore,
			topic_tags: sentence.topicTags ?? [],
			grammar_tags: sentence.grammarTags ?? [],
			context_tags: sentence.contextTags ?? [],
			status: sentence.status ?? "draft",
			source: sentence.source ?? "manual",
		};

		const { data: existing, error: fetchError } = await supabase
			.from("sentences")
			.select("audio_path")
			.eq("id", id)
			.maybeSingle();

		if (fetchError && fetchError.code !== "PGRST116") {
			console.error(
				"Erro ao buscar frase existente:",
				id,
				sentence.text,
				fetchError.message,
			);
			continue;
		}

		const { error: upsertError } = await supabase.from("sentences").upsert(
			[
				{
					...payload,
					audio_path: existing?.audio_path ?? null,
				},
			],
			{ onConflict: "id" },
		);

		if (upsertError) {
			console.error(
				"Erro ao importar frase:",
				id,
				sentence.text,
				upsertError.message,
			);
		} else {
			console.log("Importada:", id, sentence.text);
		}
	}

	console.log("Importacao concluida.");
}

importSentences();
