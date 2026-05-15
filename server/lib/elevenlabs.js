import "./env.js";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const apiKey = process.env.ELEVENLABS_API_KEY;

export const elevenlabs = new ElevenLabsClient({
	apiKey,
});

function normalizeEnvSuffix(value) {
	const normalizedValue = String(value ?? "")
		.trim()
		.toLowerCase();
	const languageAliases = {
		jp: "ja",
		ja_jp: "ja",
		japanese: "ja",
		japones: "ja",
		japon_s: "ja",
		japonês: "ja",
		日本語: "ja",
		日本: "ja",
		cn: "zh",
		zh_cn: "zh",
		chinese: "zh",
		chines: "zh",
		chin_s: "zh",
		chinês: "zh",
		gr: "el",
		greek: "el",
		grego: "el",
		german: "de",
		alemao: "de",
		alemão: "de",
		russian: "ru",
		russo: "ru",
		nb: "no",
		nn: "no",
		norwegian: "no",
		noruegues: "no",
		noruegu_s: "no",
		norueguês: "no",
		italian: "it",
		italiano: "it",
	};

	return (languageAliases[normalizedValue] ?? normalizedValue)
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, "_");
}

export function resolveElevenLabsVoiceId({ languageCode, audioKind } = {}) {
	const languageSuffix = normalizeEnvSuffix(languageCode);
	const kindSuffix = normalizeEnvSuffix(audioKind);
	const candidates = [
		kindSuffix && languageSuffix
			? `ELEVENLABS_${kindSuffix}_VOICE_ID_${languageSuffix}`
			: null,
		languageSuffix ? `ELEVENLABS_VOICE_ID_${languageSuffix}` : null,
		kindSuffix ? `ELEVENLABS_${kindSuffix}_VOICE_ID` : null,
		"ELEVENLABS_VOICE_ID",
	].filter(Boolean);

	for (const key of candidates) {
		const voiceId = process.env[key]?.trim();

		if (voiceId) {
			return voiceId;
		}
	}

	throw new Error("Nenhum ElevenLabs voice id configurado.");
}

export function resolveElevenLabsLanguageCode(languageCode) {
	const normalizedLanguageCode = String(languageCode ?? "")
		.trim()
		.toLowerCase();

	if (normalizedLanguageCode === "no") {
		return undefined;
	}

	return normalizedLanguageCode || undefined;
}
