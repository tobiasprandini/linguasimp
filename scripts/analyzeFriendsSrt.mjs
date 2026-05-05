import fs from "fs";
import path from "path";

const defaultDir = "/Users/tobiasprandini/Downloads";
const defaultPattern = /^Friends-1x\d+.*\.srt$/i;

const unsafePatterns = [
	/\bsex\b/i,
	/\bsexy\b/i,
	/\bnaked\b/i,
	/\bboob/i,
	/\bbreast/i,
	/\bkiss(?:ing|ed)?\b/i,
	/\bturned on\b/i,
	/\bstrip\b/i,
	/\blesbian\b/i,
	/\bkill myself\b/i,
	/\bkill\b/i,
	/\bhell\b/i,
	/\bshut up\b/i,
	/\bstupid\b/i,
	/\bdumb\b/i,
	/\bhate\b/i,
	/\bdrunk\b/i,
	/\bbeer\b/i,
	/\bwine\b/i,
	/\bvodka\b/i,
	/\bcigarette\b/i,
	/\bsmoke\b/i,
	/\bpush her\b/i,
	/\bstairs\b/i,
];

const speakerNoisePatterns = [
	/^\(.+\)$/,
	/^\[.+\]$/,
	/^[A-Z][A-Z\s.'-]+:$/,
];

const starterMatchers = [
	{ label: "question", test: (line) => line.endsWith("?") },
	{ label: "greeting", test: (line) => /^(hi|hello|hey)\b/i.test(line) },
	{ label: "request", test: (line) => /^(can i|could you|let me|please|try to)\b/i.test(line) },
	{ label: "feeling", test: (line) => /^(i am|i'm|you are|you're|we are|we're|i feel)\b/i.test(line) },
	{ label: "need", test: (line) => /^(i need|we need|you need|i have to|we have to|you have to)\b/i.test(line) },
	{ label: "decision", test: (line) => /^(i want|we want|you want|i don't want|we don't want|you don't want)\b/i.test(line) },
	{ label: "daily_life", test: (line) => /\b(coffee|home|work|school|today|tomorrow|now|tonight)\b/i.test(line) },
];

function parseSrtContent(content) {
	const lines = content.split(/\r?\n/);
	const dialogue = [];

	for (const rawLine of lines) {
		const line = rawLine.trim();

		if (!line) continue;
		if (/^\d+$/.test(line)) continue;
		if (/^\d{2}:\d{2}:\d{2},\d{3}\s+-->\s+\d{2}:\d{2}:\d{2},\d{3}$/.test(line)) {
			continue;
		}

		dialogue.push(line);
	}

	return dialogue;
}

function normalizeLine(line) {
	return line
		.replace(/<[^>]+>/g, "")
		.replace(/\s+/g, " ")
		.replace(/^-+\s*/, "")
		.trim();
}

function isSpeakerNoise(line) {
	return speakerNoisePatterns.some((pattern) => pattern.test(line));
}

function isUnsafe(line) {
	return unsafePatterns.some((pattern) => pattern.test(line));
}

function wordCount(line) {
	return line.split(/\s+/).filter(Boolean).length;
}

function bucketLine(line) {
	for (const matcher of starterMatchers) {
		if (matcher.test(line)) {
			return matcher.label;
		}
	}

	return "other";
}

function getFilesFromArgs() {
	const args = process.argv.slice(2);

	if (args.length > 0) {
		return args;
	}

	return fs
		.readdirSync(defaultDir)
		.filter((file) => defaultPattern.test(file))
		.sort()
		.map((file) => path.join(defaultDir, file));
}

function summarizeFiles(files) {
	const summary = {
		files: [],
		totalDialogueLines: 0,
		totalUsableLines: 0,
		totalUnsafeLines: 0,
		buckets: {},
	};

	for (const filePath of files) {
		const content = fs.readFileSync(filePath, "utf8");
		const parsedLines = parseSrtContent(content).map(normalizeLine).filter(Boolean);

		const usableLines = [];
		let unsafeCount = 0;

		for (const line of parsedLines) {
			if (isSpeakerNoise(line)) continue;

			const words = wordCount(line);
			if (words < 2 || words > 10) continue;

			if (isUnsafe(line)) {
				unsafeCount += 1;
				continue;
			}

			usableLines.push(line);
			const bucket = bucketLine(line);
			summary.buckets[bucket] = (summary.buckets[bucket] ?? 0) + 1;
		}

		summary.totalDialogueLines += parsedLines.length;
		summary.totalUsableLines += usableLines.length;
		summary.totalUnsafeLines += unsafeCount;
		summary.files.push({
			file: path.basename(filePath),
			dialogueLines: parsedLines.length,
			usableLines: usableLines.length,
			unsafeLines: unsafeCount,
		});
	}

	return {
		...summary,
		recommendedPlan: {
			a1: "Use short present-tense statements, basic questions, greetings, needs, and daily-life requests.",
			a2: "Use slightly longer routines, plans, feelings, and school/work contexts with time expressions.",
			b1: "Use light opinions, explanations, and multi-clause but still conversational everyday speech.",
		},
	};
}

const files = getFilesFromArgs();

if (files.length === 0) {
	console.error("Nenhum arquivo .srt encontrado para analisar.");
	process.exit(1);
}

const summary = summarizeFiles(files);
console.log(JSON.stringify(summary, null, 2));
