import "dotenv/config";
import { supabase } from "../lib/supabase.js";
import { blocks } from "../../src/data/blocks/index.js";

async function importBlocks() {
	for (const block of blocks) {
		const id = block.id;
		const canonicalText = block.canonical;

		if (!id || !canonicalText) {
			console.log("Pulando bloco invalido:", block);
			continue;
		}

		const { data: existing, error: fetchError } = await supabase
			.from("blocks")
			.select("id")
			.eq("id", id)
			.maybeSingle();

		if (fetchError) {
			console.error(
				"Erro ao buscar bloco existente:",
				id,
				fetchError.message,
			);
			continue;
		}

		if (existing) {
			console.log("Ja existe:", id, canonicalText);
			continue;
		}

		const { error: insertError } = await supabase.from("blocks").insert([
			{
				id,
				canonical_text: canonicalText,
				core_meaning: block.gloss,
				block_type: block.blockKind,
				tags: block.tags,
				language_code: block.languageCode,
				audio_path: block.audioPath ?? null,
			},
		]);

		if (insertError) {
			console.error(
				"Erro ao inserir bloco:",
				id,
				canonicalText,
				insertError.message,
			);
		} else {
			console.log("Inserido:", id, canonicalText);
		}
	}

	console.log("Importacao de blocos concluida.");
}

importBlocks();
