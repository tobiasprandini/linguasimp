import "dotenv/config";
import { supabase } from "../lib/supabase.js";

const lessonAssignments = {
	lesson_1: [
		"sent_a1_001",
		"sent_a1_002",
		"sent_a1_003",
		"sent_a1_004",
		"sent_a1_005",
		"sent_a1_006",
		"sent_a1_007",
		"sent_a1_009",
		"sent_a1_021",
		"sent_a1_022",
	],
	lesson_2: [
		"sent_a1_010",
		"sent_a1_011",
		"sent_a1_012",
		"sent_a1_013",
		"sent_a1_014",
		"sent_a1_015",
		"sent_a1_016",
		"sent_a1_027",
		"sent_a1_028",
		"sent_a1_029",
	],
	lesson_3: [
		"sent_a1_017",
		"sent_a1_018",
		"sent_a1_019",
		"sent_a1_020",
		"sent_a1_023",
		"sent_a1_024",
		"sent_a1_025",
		"sent_a1_026",
	],
};

async function assignLessonIds() {
	const { error: columnCheckError } = await supabase
		.from("sentences")
		.select("lesson_id")
		.limit(1);

	if (columnCheckError) {
		const message = columnCheckError.message ?? "";
		if (message.includes("lesson_id")) {
			console.error(
				"A coluna lesson_id ainda nao existe. Rode server/scripts/addLessonsToSentences.sql no Supabase SQL Editor e tente de novo.",
			);
		} else {
			console.error("Nao foi possivel consultar o Supabase.");
		}
		console.error(columnCheckError);
		process.exit(1);
	}

	for (const [lessonId, sentenceIds] of Object.entries(lessonAssignments)) {
		const { error } = await supabase
			.from("sentences")
			.update({ lesson_id: lessonId })
			.in("id", sentenceIds);

		if (error) {
			console.error(`Erro ao atualizar ${lessonId}:`, error.message);
			process.exit(1);
		}

		console.log(`${lessonId}: ${sentenceIds.length} frases atualizadas.`);
	}

	const { data, error } = await supabase
		.from("sentences")
		.select("id,text,translation,language_code,lesson_id")
		.order("language_code")
		.order("lesson_id")
		.order("id");

	if (error) {
		console.error("Nao foi possivel conferir as licoes:", error.message);
		process.exit(1);
	}

	const counts = {};
	for (const sentence of data ?? []) {
		const key = `${sentence.language_code}:${sentence.lesson_id}`;
		counts[key] = (counts[key] ?? 0) + 1;
	}

	console.log("Distribuicao final:");
	for (const [key, count] of Object.entries(counts)) {
		console.log(`${key}: ${count}`);
	}
}

await assignLessonIds();
