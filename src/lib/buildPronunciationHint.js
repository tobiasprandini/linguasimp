const pronunciationHints = {
	i: "ái",
	you: "iú",
	we: "uí",
	they: "dêi",
	he: "rí",
	she: "xí",
	it: "ít",
	my: "mái",
	your: "iór",
	our: "áuer",
	this: "dís",
	that: "dét",
	the: "dâ",
	and: "énd",
	or: "ór",
	but: "bât",
	in: "ín",
	on: "ón",
	at: "ét",
	for: "fór",
	with: "uíd",
	from: "frâm",
	of: "âv",
	is: "íz",
	are: "ár",
	am: "ém",
	be: "bí",
	do: "dú",
	does: "dâz",
	did: "díd",
	can: "kén",
	could: "kúd",
	would: "uúd",
	should: "xúd",
	will: "uíl",
	want: "uónt",
	like: "láik",
	get: "guét",
	go: "gôu",
	make: "mêik",
	take: "têik",
	"have to": "hév tu",
	have: "hév",
	has: "réz",
	had: "réd",
	to: "tu",
	work: "uârk",
	tomorrow: "tumárou",
	"grab a bite": "gráb a báit",
	grab: "gráb",
	a: "a",
	bite: "báit",
	some: "sâm",
	coffee: "cófi",
	before: "bifór",
	"before work": "bifór uârk",
	"need to": "níd tu",
	need: "níd",
	"have you ever": "hév iu évêr",
	"been to": "bin tu",
	"new york city": "niu iórk cíti",
};

const frenchPronunciationHints = {
	bonjour: "bõ-jur",
	salut: "sa-lu",
	merci: "mér-si",
	oui: "uí",
	non: "nõ",
	je: "jê",
	"je suis": "jê suí",
	suis: "suí",
	tu: "tu",
	il: "il",
	elle: "él",
	nous: "nu",
	vous: "vu",
	ils: "il",
	elles: "él",
	est: "é",
	"c'est": "sé",
	ce: "sê",
	un: "ãn",
	une: "ün",
	le: "lê",
	la: "la",
	les: "lê",
	de: "dê",
	des: "dê",
	du: "dü",
	et: "ê",
	en: "ã",
	content: "cõ-tã",
	contente: "cõ-tãnt",
	vacances: "va-kãss",
	"en vacances": "ã va-kãss",
};

const spanishPronunciationHints = {
	hola: "ô-la",
	gracias: "grá-sias",
	sí: "sí",
	si: "sí",
	no: "nô",
	yo: "iô",
	tú: "tú",
	tu: "tú",
	él: "él",
	el: "el",
	ella: "ê-ia",
	nosotros: "no-sô-tros",
	ustedes: "us-tê-des",
	soy: "sôi",
	eres: "ê-res",
	es: "ês",
	estoy: "es-tôi",
	estás: "es-tás",
	esta: "ês-ta",
	está: "es-tá",
	"por favor": "por fa-vôr",
};

function normalizePronunciationKey(value) {
	return value?.toLowerCase().trim().replace(/\s+/g, " ");
}

function approximateEnglishWordForPortuguese(word) {
	const normalizedWord = normalizePronunciationKey(word)?.replace(
		/^[^a-z0-9']+|[^a-z0-9']+$/g,
		"",
	);

	if (!normalizedWord) {
		return "";
	}

	if (pronunciationHints[normalizedWord]) {
		return pronunciationHints[normalizedWord];
	}

	let hint = normalizedWord;

	hint = hint
		.replace(/tion$/g, "xân")
		.replace(/sion$/g, "jân")
		.replace(/ough/g, "óf")
		.replace(/igh/g, "ái")
		.replace(/ight/g, "áit")
		.replace(/air/g, "ér")
		.replace(/ear/g, "ír")
		.replace(/ee/g, "í")
		.replace(/ea/g, "í")
		.replace(/oo/g, "ú")
		.replace(/ou/g, "áu")
		.replace(/ow/g, "áu")
		.replace(/ai/g, "êi")
		.replace(/ay/g, "êi")
		.replace(/oi/g, "ói")
		.replace(/oy/g, "ói")
		.replace(/^you/g, "iú")
		.replace(/^y/g, "i")
		.replace(/th/g, "d")
		.replace(/sh/g, "x")
		.replace(/ch/g, "tch")
		.replace(/ph/g, "f")
		.replace(/ck/g, "k")
		.replace(/qu/g, "kw")
		.replace(/^w/g, "u")
		.replace(/wh/g, "u")
		.replace(/er$/g, "êr")
		.replace(/or$/g, "ór")
		.replace(/ar$/g, "ár")
		.replace(/ed$/g, "d")
		.replace(/ing$/g, "in")
		.replace(/e$/g, "")
		.replace(/c([ei])/g, "s$1")
		.replace(/c/g, "k")
		.replace(/g([ei])/g, "j$1")
		.replace(/j/g, "dj")
		.replace(/r/g, "r")
		.replace(/u/g, "â")
		.replace(/âi/g, "uí")
		.replace(/â/g, "ã");

	return hint;
}

function approximateSpanishWordForPortuguese(word) {
	const normalizedWord = normalizePronunciationKey(word)?.replace(
		/^[^a-z0-9áéíóúüñ]+|[^a-z0-9áéíóúüñ]+$/g,
		"",
	);

	if (!normalizedWord) {
		return "";
	}

	if (spanishPronunciationHints[normalizedWord]) {
		return spanishPronunciationHints[normalizedWord];
	}

	return normalizedWord
		.replace(/^h/g, "")
		.replace(/ll/g, "i")
		.replace(/y/g, "i")
		.replace(/ñ/g, "nh")
		.replace(/gue/g, "gue")
		.replace(/gui/g, "gui")
		.replace(/ge/g, "rre")
		.replace(/gi/g, "rri")
		.replace(/j/g, "rr")
		.replace(/que/g, "kê")
		.replace(/qui/g, "ki")
		.replace(/ce/g, "se")
		.replace(/ci/g, "si")
		.replace(/z/g, "s")
		.replace(/v/g, "b")
		.replace(/r$/g, "r");
}

function approximateFrenchWordForPortuguese(word) {
	const normalizedWord = normalizePronunciationKey(word)?.replace(
		/^[^a-z0-9àâçéèêëîïôùûüœæ'-]+|[^a-z0-9àâçéèêëîïôùûüœæ'-]+$/g,
		"",
	);

	if (!normalizedWord) {
		return "";
	}

	if (frenchPronunciationHints[normalizedWord]) {
		return frenchPronunciationHints[normalizedWord];
	}

	let hint = normalizedWord;

	hint = hint
		.replace(/eaux$/g, "ô")
		.replace(/aux$/g, "ô")
		.replace(/eau/g, "ô")
		.replace(/au/g, "ô")
		.replace(/ou/g, "u")
		.replace(/oi/g, "uá")
		.replace(/ch/g, "x")
		.replace(/gn/g, "nh")
		.replace(/ill/g, "i")
		.replace(/qu/g, "k")
		.replace(/ç/g, "s")
		.replace(/c([eéi])/g, "s$1")
		.replace(/g([eéi])/g, "j$1")
		.replace(/an/g, "ã")
		.replace(/am/g, "ã")
		.replace(/en/g, "ã")
		.replace(/em/g, "ã")
		.replace(/on/g, "õ")
		.replace(/om/g, "õ")
		.replace(/ain/g, "ãn")
		.replace(/ein/g, "ãn")
		.replace(/in/g, "ãn")
		.replace(/un/g, "ãn")
		.replace(/é/g, "ê")
		.replace(/è/g, "é")
		.replace(/ê/g, "é")
		.replace(/à/g, "a")
		.replace(/â/g, "a")
		.replace(/ô/g, "ô")
		.replace(/ù/g, "u")
		.replace(/û/g, "u")
		.replace(/er$/g, "ê")
		.replace(/ez$/g, "ê")
		.replace(/et$/g, "ê")
		.replace(/[tdsxz]$/g, "")
		.replace(/e$/g, "");

	return hint;
}

function buildApproximationForLanguage(text, languageCode) {
	const normalizedLanguage = languageCode?.toLowerCase();
	const normalizedText = normalizePronunciationKey(text);

	if (!normalizedText) {
		return "";
	}

	if (normalizedLanguage === "fr" && frenchPronunciationHints[normalizedText]) {
		return frenchPronunciationHints[normalizedText];
	}

	if (normalizedLanguage === "es" && spanishPronunciationHints[normalizedText]) {
		return spanishPronunciationHints[normalizedText];
	}

	if (pronunciationHints[normalizedText]) {
		return pronunciationHints[normalizedText];
	}

	const approximator =
		normalizedLanguage === "fr"
			? approximateFrenchWordForPortuguese
			: normalizedLanguage === "es"
				? approximateSpanishWordForPortuguese
				: approximateEnglishWordForPortuguese;

	return normalizedText
		.split(/\s+/)
		.map(approximator)
		.filter(Boolean)
		.join(" ");
}

export function buildPronunciationHint(block) {
	const explicitHint =
		block.pronunciation ??
		block.pronunciationHint ??
		block.pronunciation_hint ??
		block.phonetic ??
		block.ipa ??
		block.transcription;

	if (explicitHint) {
		return explicitHint;
	}

	const text =
		normalizePronunciationKey(block.surface) ??
		normalizePronunciationKey(block.canonical);

	if (!text) {
		return "";
	}

	return buildApproximationForLanguage(text, block.languageCode);
}
