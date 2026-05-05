import "dotenv/config";
import { supabase } from "../lib/supabase.js";
import { sentences } from "../../src/data/sentences/index.js";

function buildSentenceBlockRows() {
	return sentences.flatMap((sentence) =>
		(sentence.blocks ?? []).map((block, index) => ({
			id: block.id,
			sentence_id: sentence.id,
			block_id: block.blockId,
			order_index: index,
			surface: block.surface,
			contextual_gloss: block.contextualGloss ?? null,
		})),
	);
}

async function importSentenceBlocks() {
	const rows = buildSentenceBlockRows();

	if (rows.length === 0) {
		console.log("Nenhum sentence block encontrado para importar.");
		return;
	}

	const chunkSize = 500;

	for (let index = 0; index < rows.length; index += chunkSize) {
		const chunk = rows.slice(index, index + chunkSize);

		const { error } = await supabase
			.from("sentence_blocks")
			.upsert(chunk, { onConflict: "id" });

		if (error) {
			console.error(
				"Erro ao importar sentence blocks:",
				error.message,
				`(chunk ${index / chunkSize + 1})`,
			);
			return;
		}

		console.log(
			`Chunk ${index / chunkSize + 1} importado com ${chunk.length} registros.`,
		);
	}

	console.log(`Importacao de sentence blocks concluida. Total: ${rows.length}.`);
}

importSentenceBlocks();
