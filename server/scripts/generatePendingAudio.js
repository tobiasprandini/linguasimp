import "dotenv/config";
import { supabase } from "../lib/supabase.js";
import { elevenlabs, resolveElevenLabsVoiceId } from "../lib/elevenlabs.js";
import { streamToBuffer } from "../lib/audio.js";

async function generatePendingAudio() {
	let processedCount = 0;

	while (true) {
		const { data: sentences, error } = await supabase
			.from("sentences")
			.select("*")
			.is("audio_path", null)
			.limit(100);

		if (error) {
			console.error("Erro ao buscar frases pendentes:", error.message);
			return;
		}

		if (!sentences || sentences.length === 0) {
			break;
		}

		for (const sentence of sentences) {
			try {
				console.log("Gerando:", sentence.text);
				const voiceId = resolveElevenLabsVoiceId({
					languageCode: sentence.language_code,
					audioKind: "sentence",
				});

				const audioStream = await elevenlabs.textToSpeech.convert(
					voiceId,
					{
						text: sentence.text,
						modelId:
							process.env.ELEVENLABS_MODEL_ID ||
							"eleven_multilingual_v2",
						languageCode: sentence.language_code,
						outputFormat: "mp3_44100_128",
						...(sentence.speech_speed
							? {
									voiceSettings: {
										speed: Number(sentence.speech_speed),
									},
								}
							: {}),
					},
				);

				const audioBuffer = await streamToBuffer(audioStream);
				const filePath = `sentences/${sentence.id}.mp3`;

				const { error: uploadError } = await supabase.storage
					.from("sentence-audio")
					.upload(filePath, audioBuffer, {
						contentType: "audio/mpeg",
						upsert: false,
					});

				if (uploadError) {
					console.error(
						"Erro no upload:",
						sentence.text,
						uploadError.message,
					);
					continue;
				}

				const { error: updateError } = await supabase
					.from("sentences")
					.update({
						audio_path: filePath,
					})
					.eq("id", sentence.id);

				if (updateError) {
					console.error(
						"Erro ao atualizar banco:",
						sentence.text,
						updateError.message,
					);
				} else {
					processedCount += 1;
					console.log("OK:", sentence.text);
				}
			} catch (err) {
				console.error("Erro ao gerar áudio:", sentence.text, err.message);
			}
		}
	}

	console.log(`Geracao concluida. Audios prontos nesta execucao: ${processedCount}.`);
}

generatePendingAudio();
