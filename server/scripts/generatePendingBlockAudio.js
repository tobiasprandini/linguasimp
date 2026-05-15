import "dotenv/config";
import { supabase } from "../lib/supabase.js";
import {
	elevenlabs,
	resolveElevenLabsLanguageCode,
	resolveElevenLabsVoiceId,
} from "../lib/elevenlabs.js";
import { streamToBuffer } from "../lib/audio.js";

async function generatePendingBlockAudio() {
	let processedCount = 0;

	while (true) {
		const { data: blocks, error } = await supabase
			.from("blocks")
			.select("*")
			.is("audio_path", null)
			.limit(100);

		if (error) {
			console.error("Erro ao buscar blocos pendentes:", error.message);
			return;
		}

		if (!blocks || blocks.length === 0) {
			break;
		}

		for (const block of blocks) {
			try {
				console.log("Gerando bloco:", block.canonical_text);
				const textForSpeech =
					String(block.pronunciation_hint ?? "").trim() ||
					block.canonical_text;
				const voiceId = resolveElevenLabsVoiceId({
					languageCode: block.language_code,
					audioKind: "block",
				});
				const languageCode = resolveElevenLabsLanguageCode(block.language_code);

				const audioStream = await elevenlabs.textToSpeech.convert(
					voiceId,
					{
						text: textForSpeech,
						modelId:
							process.env.ELEVENLABS_MODEL_ID ||
							"eleven_multilingual_v2",
						...(languageCode ? { languageCode } : {}),
						outputFormat: "mp3_44100_128",
					},
				);

				const audioBuffer = await streamToBuffer(audioStream);
				const filePath = `blocks/${block.id}.mp3`;

				const { error: uploadError } = await supabase.storage
					.from("block-audio")
					.upload(filePath, audioBuffer, {
						contentType: "audio/mpeg",
						upsert: false,
					});

				if (uploadError) {
					console.error(
						"Erro no upload do bloco:",
						block.canonical_text,
						uploadError.message,
					);
					continue;
				}

				const { error: updateError } = await supabase
					.from("blocks")
					.update({
						audio_path: filePath,
					})
					.eq("id", block.id);

				if (updateError) {
					console.error(
						"Erro ao atualizar bloco no banco:",
						block.canonical_text,
						updateError.message,
					);
				} else {
					processedCount += 1;
					console.log("OK bloco:", block.canonical_text);
				}
			} catch (err) {
				console.error("Erro ao gerar audio do bloco:", block.canonical_text, err.message);
			}
		}
	}

	console.log(
		`Geracao de audio dos blocos concluida. Audios prontos nesta execucao: ${processedCount}.`,
	);
}

generatePendingBlockAudio();
