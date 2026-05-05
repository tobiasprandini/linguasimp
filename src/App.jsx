import { useCallback, useEffect, useRef, useState } from "react";
import AuthScreen from "./components/AuthScreen";
import DashboardScreen from "./components/DashboardScreen";
import SentenceScreen from "./components/SentenceScreen";
import AdminScreen from "./components/admin/AdminScreen.jsx";
import FlashcardsScreen from "./components/FlashcardsScreen";
import LandingScreen from "./components/LandingScreen";
import LanguageMenu from "./components/LanguageMenu";
import LessonCompleteScreen from "./components/LessonCompleteScreen";
import OnboardingScreen from "./components/OnboardingScreen";
import ProfileScreen from "./components/ProfileScreen";
import ProgressExamplesScreen from "./components/ProgressExamplesScreen";
import WalletDemoScreen from "./components/WalletDemoScreen";
import { supabase } from "./lib/supabase";
import { buildRuntimeSentences } from "./lib/runtime/buildRuntimeSentences.js";
import { extractContextualTipFromTags } from "./lib/contextualTipTags.js";

const PRONUNCIATION_HINTS_STORAGE_KEY = "linguasimp-admin-pronunciation-hints";
const BLOCK_STATUSES_STORAGE_KEY_PREFIX = "linguasimp-block-statuses";
const FLASHCARD_SCHEDULE_STORAGE_KEY_PREFIX = "linguasimp-flashcard-schedule";
const LEARNING_ACTIVITY_STORAGE_KEY_PREFIX = "linguasimp-learning-activity";
const AUTH_REDIRECT_STORAGE_KEY = "linguasimp-auth-redirect";
const ACTIVE_LESSON_STORAGE_KEY_PREFIX = "linguasimp-active-lesson";
const DEFAULT_LESSON_ID = "lesson_1";
const LESSON_CONTEXT_TAG_PREFIX = "lesson:";
const SUPPORTED_LANGUAGE_CODES = new Set([
	"en",
	"es",
	"fr",
	"de",
	"it",
	"ru",
	"no",
	"el",
	"zh",
	"ja",
]);

function normalizeLessonId(value) {
	const rawValue = String(value ?? "").trim().toLowerCase();
	const numericMatch = rawValue.match(/\b([1-9][0-9]*)\b/);

	if (rawValue.startsWith("lesson_")) {
		return rawValue.replace(/[^a-z0-9_]/g, "") || DEFAULT_LESSON_ID;
	}

	if (numericMatch) {
		return `lesson_${numericMatch[1]}`;
	}

	return DEFAULT_LESSON_ID;
}

function getLessonIdFromContextTags(contextTags = []) {
	const lessonTag = (contextTags ?? []).find((tag) =>
		String(tag).startsWith(LESSON_CONTEXT_TAG_PREFIX),
	);

	return lessonTag
		? normalizeLessonId(String(lessonTag).slice(LESSON_CONTEXT_TAG_PREFIX.length))
		: DEFAULT_LESSON_ID;
}

function getSentenceLessonId(sentence) {
	return normalizeLessonId(sentence?.lessonId ?? DEFAULT_LESSON_ID);
}

function getSentencesForLesson(sentences, lessonId = DEFAULT_LESSON_ID) {
	const normalizedLessonId = normalizeLessonId(lessonId);
	const lessonSentences = sentences.filter(
		(sentence) => getSentenceLessonId(sentence) === normalizedLessonId,
	);

	return lessonSentences.length > 0 ? lessonSentences : sentences;
}

function getLessonSortValue(lessonId) {
	return Number(String(lessonId).match(/lesson_(\d+)/)?.[1] ?? 0);
}

function getAvailableLessonIds(sentences) {
	return Array.from(
		new Set((sentences ?? []).map((sentence) => getSentenceLessonId(sentence))),
	).sort((firstLessonId, secondLessonId) => {
		const firstValue = getLessonSortValue(firstLessonId);
		const secondValue = getLessonSortValue(secondLessonId);

		if (firstValue !== secondValue) {
			return firstValue - secondValue;
		}

		return firstLessonId.localeCompare(secondLessonId);
	});
}

function getNextLessonId(sentences, currentLessonId) {
	const availableLessonIds = getAvailableLessonIds(sentences);
	const normalizedCurrentLessonId = normalizeLessonId(currentLessonId);
	const currentIndex = availableLessonIds.indexOf(normalizedCurrentLessonId);

	if (currentIndex === -1) {
		return availableLessonIds[0] ?? normalizedCurrentLessonId;
	}

	return availableLessonIds[currentIndex + 1] ?? normalizedCurrentLessonId;
}

function getLessonSentencesStrict(sentences, lessonId = DEFAULT_LESSON_ID) {
	const normalizedLessonId = normalizeLessonId(lessonId);

	return (sentences ?? []).filter(
		(sentence) => getSentenceLessonId(sentence) === normalizedLessonId,
	);
}

function isReviewedBlockStatus(status) {
	return status === "known" || status === "learning";
}

function isSentenceReviewed(sentence, blockStatuses = {}) {
	const blocks = sentence?.blocks ?? [];

	return (
		blocks.length > 0 &&
		blocks.every((block) => isReviewedBlockStatus(blockStatuses[block.blockId]))
	);
}

function isLessonReviewed(sentences, lessonId, blockStatuses = {}) {
	const lessonSentences = getLessonSentencesStrict(sentences, lessonId);

	return (
		lessonSentences.length > 0 &&
		lessonSentences.every((sentence) =>
			isSentenceReviewed(sentence, blockStatuses),
		)
	);
}

function getFirstIncompleteLessonId(sentences, blockStatuses = {}) {
	const availableLessonIds = getAvailableLessonIds(sentences);

	return (
		availableLessonIds.find(
			(lessonId) => !isLessonReviewed(sentences, lessonId, blockStatuses),
		) ??
		availableLessonIds[availableLessonIds.length - 1] ??
		DEFAULT_LESSON_ID
	);
}

function getProgressAwareLessonId(sentences, currentLessonId, blockStatuses = {}) {
	const normalizedCurrentLessonId = normalizeLessonId(currentLessonId);
	const availableLessonIds = getAvailableLessonIds(sentences);

	if (!availableLessonIds.includes(normalizedCurrentLessonId)) {
		return getFirstIncompleteLessonId(sentences, blockStatuses);
	}

	if (isLessonReviewed(sentences, normalizedCurrentLessonId, blockStatuses)) {
		return getFirstIncompleteLessonId(sentences, blockStatuses);
	}

	return normalizedCurrentLessonId;
}

function loadPronunciationHintsCache() {
	if (typeof window === "undefined") {
		return {};
	}

	try {
		return JSON.parse(
			window.localStorage.getItem(PRONUNCIATION_HINTS_STORAGE_KEY) ?? "{}",
		);
	} catch {
		return {};
	}
}

function getViewModeFromHash() {
	if (typeof window === "undefined") {
		return "landing";
	}

	const routeValue = window.location.hash.replace(/^#\/?/, "");
	const route = routeValue.split("?")[0];
	const pathRoute = window.location.pathname.replace(/^\/+/, "");

	if (route === "admin" || pathRoute === "admin") {
		return "admin";
	}

	if (
		route === "landing" ||
		route === "home" ||
		pathRoute === "landing" ||
		pathRoute === "home"
	) {
		return "landing";
	}

	if (route === "onboarding" || pathRoute === "onboarding") {
		return "onboarding";
	}

	if (route === "study" || pathRoute === "study") {
		return "study";
	}

	if (route === "dashboard" || pathRoute === "dashboard") {
		return "dashboard";
	}

	if (
		route === "progress-examples" ||
		route === "progresso-exemplos" ||
		pathRoute === "progress-examples" ||
		pathRoute === "progresso-exemplos"
	) {
		return "progress-examples";
	}

	if (route === "profile" || pathRoute === "profile") {
		return "profile";
	}

	if (route === "flashcards" || pathRoute === "flashcards") {
		return "flashcards";
	}

	if (
		route === "wallet-demo" ||
		route === "carteira" ||
		pathRoute === "wallet-demo" ||
		pathRoute === "carteira"
	) {
		return "wallet-demo";
	}

	if (route === "login" || pathRoute === "login") {
		return "login";
	}

	if (
		route === "cadastro" ||
		route === "signup" ||
		pathRoute === "cadastro" ||
		pathRoute === "signup"
	) {
		return "signup";
	}

	return "landing";
}

function getAuthRedirectTargetFromHash(fallbackTarget = "dashboard") {
	if (typeof window === "undefined") {
		return fallbackTarget;
	}

	const routeValue = window.location.hash.replace(/^#\/?/, "");
	const queryString = routeValue.split("?")[1] ?? "";
	const nextTarget = new URLSearchParams(queryString).get("next");

	return [
		"study",
		"dashboard",
		"profile",
		"flashcards",
		"wallet-demo",
	].includes(nextTarget)
		? nextTarget
		: fallbackTarget;
}

function popStoredAuthRedirectTarget(fallbackTarget = "dashboard") {
	if (typeof window === "undefined") {
		return fallbackTarget;
	}

	const storedTarget = window.localStorage.getItem(AUTH_REDIRECT_STORAGE_KEY);
	window.localStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);

	return [
		"study",
		"dashboard",
		"profile",
		"flashcards",
		"wallet-demo",
	].includes(storedTarget)
		? storedTarget
		: fallbackTarget;
}

function loadStoredLanguage() {
	if (typeof window === "undefined") {
		return "en";
	}

	const storedLanguage = window.localStorage.getItem("linguasimp-language");
	return SUPPORTED_LANGUAGE_CODES.has(storedLanguage) ? storedLanguage : "en";
}

function getActiveLessonStorageKey(languageCode) {
	return `${ACTIVE_LESSON_STORAGE_KEY_PREFIX}:${languageCode}`;
}

function loadStoredActiveLessonId(languageCode) {
	if (typeof window === "undefined") {
		return DEFAULT_LESSON_ID;
	}

	return normalizeLessonId(
		window.localStorage.getItem(getActiveLessonStorageKey(languageCode)),
	);
}

function persistStoredActiveLessonId(languageCode, lessonId) {
	if (typeof window === "undefined") {
		return;
	}

	window.localStorage.setItem(
		getActiveLessonStorageKey(languageCode),
		normalizeLessonId(lessonId),
	);
}

function getBlockStatusesStorageKey(languageCode) {
	return `${BLOCK_STATUSES_STORAGE_KEY_PREFIX}:${languageCode}`;
}

function getLearningActivityStorageKey(languageCode) {
	return `${LEARNING_ACTIVITY_STORAGE_KEY_PREFIX}:${languageCode}`;
}

function getLocalDateKey(date = new Date()) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

function loadStoredJson(key, fallbackValue) {
	if (typeof window === "undefined") {
		return fallbackValue;
	}

	try {
		return JSON.parse(window.localStorage.getItem(key) ?? "null") ?? fallbackValue;
	} catch {
		return fallbackValue;
	}
}

function loadStoredBlockStatuses(languageCode) {
	return loadStoredJson(getBlockStatusesStorageKey(languageCode), {});
}

function loadStoredLearningActivity(languageCode) {
	return loadStoredJson(getLearningActivityStorageKey(languageCode), {});
}

function persistStoredJson(key, value) {
	if (typeof window === "undefined") {
		return;
	}

	window.localStorage.setItem(key, JSON.stringify(value));
}

function clearStoredBlockStatuses() {
	if (typeof window === "undefined") {
		return;
	}

	Object.keys(window.localStorage)
		.filter((key) => key.startsWith(BLOCK_STATUSES_STORAGE_KEY_PREFIX))
		.forEach((key) => window.localStorage.removeItem(key));
}

function clearStoredFlashcardSchedules() {
	if (typeof window === "undefined") {
		return;
	}

	Object.keys(window.localStorage)
		.filter((key) => key.startsWith(FLASHCARD_SCHEDULE_STORAGE_KEY_PREFIX))
		.forEach((key) => window.localStorage.removeItem(key));
}

function clearStoredLearningActivity() {
	if (typeof window === "undefined") {
		return;
	}

	Object.keys(window.localStorage)
		.filter((key) => key.startsWith(LEARNING_ACTIVITY_STORAGE_KEY_PREFIX))
		.forEach((key) => window.localStorage.removeItem(key));
}

function clearStoredActiveLessons() {
	if (typeof window === "undefined") {
		return;
	}

	Object.keys(window.localStorage)
		.filter((key) => key.startsWith(ACTIVE_LESSON_STORAGE_KEY_PREFIX))
		.forEach((key) => window.localStorage.removeItem(key));
}

function buildFlashcardDeck(runtimeSentences, blockStatuses) {
	const cardsByBlockId = new Map();

	for (const sentence of runtimeSentences) {
		for (const block of sentence.blocks ?? []) {
			if (blockStatuses[block.blockId] !== "learning") {
				continue;
			}

			if (cardsByBlockId.has(block.blockId)) {
				continue;
			}

			cardsByBlockId.set(block.blockId, {
				id: `${sentence.id}:${block.blockId}`,
				block,
				sentence,
				sentenceBlocks: sentence.blocks ?? [],
			});
		}
	}

	return Array.from(cardsByBlockId.values());
}

function getFlashcardScheduleStorageKey(languageCode) {
	return `${FLASHCARD_SCHEDULE_STORAGE_KEY_PREFIX}:${languageCode}`;
}

function loadStoredFlashcardSchedule(languageCode) {
	if (typeof window === "undefined") {
		return {};
	}

	try {
		return JSON.parse(
			window.localStorage.getItem(getFlashcardScheduleStorageKey(languageCode)) ??
				"{}",
		);
	} catch {
		return {};
	}
}

function countDueFlashcards(cards, languageCode, now = Date.now()) {
	const schedule = loadStoredFlashcardSchedule(languageCode);

	return cards.filter((card) => {
		const nextReviewAt = schedule[card.block.blockId] ?? 0;
		return nextReviewAt <= now;
	}).length;
}

function isMissingUserLessonProgressTable(error) {
	return (
		error?.code === "42P01" ||
		error?.code === "PGRST205" ||
		error?.message?.includes("user_lesson_progress")
	);
}

async function loadRemoteActiveLessonId(userId, languageCode) {
	const { data, error } = await supabase
		.from("user_lesson_progress")
		.select("active_lesson_id")
		.eq("user_id", userId)
		.eq("language_code", languageCode)
		.maybeSingle();

	if (error) {
		if (!isMissingUserLessonProgressTable(error)) {
			console.warn("Nao foi possivel carregar progresso da licao:", error.message);
		}
		return null;
	}

	return data?.active_lesson_id ? normalizeLessonId(data.active_lesson_id) : null;
}

async function persistRemoteActiveLessonId(userId, languageCode, lessonId) {
	const { error } = await supabase
		.from("user_lesson_progress")
		.upsert(
			{
				user_id: userId,
				language_code: languageCode,
				active_lesson_id: normalizeLessonId(lessonId),
				updated_at: new Date().toISOString(),
			},
			{ onConflict: "user_id,language_code" },
		);

	if (error && !isMissingUserLessonProgressTable(error)) {
		console.warn("Nao foi possivel salvar progresso da licao:", error.message);
	}
}

function App() {
	const [viewMode, setViewMode] = useState(() => {
		return getViewModeFromHash();
	});
	const [selectedLanguage, setSelectedLanguage] = useState(loadStoredLanguage);
	const [selectedLessonId, setSelectedLessonId] = useState(() =>
		loadStoredActiveLessonId(loadStoredLanguage()),
	);
	const [runtimeSentences, setRuntimeSentences] = useState([]);
	const [currentSentenceId, setCurrentSentenceId] = useState(null);
	const [selectedBlockId, setSelectedBlockId] = useState(null);
	const [isSentenceAudioPlaying, setIsSentenceAudioPlaying] = useState(false);
	const [isRuntimeLoading, setIsRuntimeLoading] = useState(false);
	const [isLessonComplete, setIsLessonComplete] = useState(false);
	const [lessonBlockMarks, setLessonBlockMarks] = useState({});
	const [authUser, setAuthUser] = useState(null);
	const [isAuthLoading, setIsAuthLoading] = useState(true);
	const [remoteLessonProgressKey, setRemoteLessonProgressKey] = useState(null);
	const [blockStatuses, setBlockStatuses] = useState(() =>
		loadStoredBlockStatuses(loadStoredLanguage()),
	);
	const [learningActivity, setLearningActivity] = useState(() =>
		loadStoredLearningActivity(loadStoredLanguage()),
	);
	const audioRef = useRef(null);
	const currentAudioSrcRef = useRef(null);
	const preloadedSentenceAudioRef = useRef(null);
	const preloadedSentenceAudioSrcRef = useRef(null);
	const runtimeSentencesRef = useRef([]);
	const runtimeCacheRef = useRef({});
	const runtimeRequestsRef = useRef({});

	const stopCurrentAudio = useCallback(() => {
		if (!audioRef.current) {
			setIsSentenceAudioPlaying(false);
			currentAudioSrcRef.current = null;
			return;
		}

		audioRef.current.pause();
		audioRef.current.currentTime = 0;
		audioRef.current.onended = null;
		if (audioRef.current === preloadedSentenceAudioRef.current) {
			audioRef.current.onpause = null;
		}
		audioRef.current = null;
		currentAudioSrcRef.current = null;
		setIsSentenceAudioPlaying(false);
	}, []);

	const recordLearningActivity = useCallback(
		(increment = 1, languageCode = selectedLanguage) => {
			const dateKey = getLocalDateKey();
			const storageKey = getLearningActivityStorageKey(languageCode);
			const currentActivity = loadStoredLearningActivity(languageCode);
			const nextActivity = {
				...currentActivity,
				[dateKey]: (currentActivity[dateKey] ?? 0) + increment,
			};

			persistStoredJson(storageKey, nextActivity);

			if (languageCode === selectedLanguage) {
				setLearningActivity(nextActivity);
			}
		},
		[selectedLanguage],
	);

	const loadSentenceRuntimeData = useCallback(async (
		isMountedRef = { current: true },
		languageCode = selectedLanguage,
		{ applyToState = true, showLoading = true, forceRefresh = false } = {},
	) => {
		if (forceRefresh) {
			delete runtimeCacheRef.current[languageCode];
			delete runtimeRequestsRef.current[languageCode];
		}

		const cachedRuntimeSentences = runtimeCacheRef.current[languageCode];
		if (cachedRuntimeSentences) {
			if (applyToState && isMountedRef.current) {
					const progressAwareLessonId =
						viewMode === "study" || isLessonComplete
							? normalizeLessonId(selectedLessonId)
							: getProgressAwareLessonId(
									cachedRuntimeSentences,
									selectedLessonId,
									blockStatuses,
								);
				setRuntimeSentences(cachedRuntimeSentences);
				runtimeSentencesRef.current = cachedRuntimeSentences;
				setSelectedLessonId(progressAwareLessonId);
				setCurrentSentenceId((prevSentenceId) => {
					const cachedLessonSentences = getSentencesForLesson(
						cachedRuntimeSentences,
						progressAwareLessonId,
					);
					if (
						prevSentenceId &&
						cachedLessonSentences.some((item) => item.id === prevSentenceId)
					) {
						return prevSentenceId;
					}

					return cachedLessonSentences[0]?.id ?? null;
				});
				setIsRuntimeLoading(false);
			}

			return cachedRuntimeSentences;
		}

		if (applyToState && showLoading && runtimeSentencesRef.current.length === 0) {
			setIsRuntimeLoading(true);
		}

		runtimeRequestsRef.current[languageCode] ??= (async () => {
			let { data: sentenceData, error: sentenceError } = await supabase
				.from("sentences")
				.select(
					"id, text, translation, level, difficulty_score, naturalness_score, topic_tags, grammar_tags, context_tags, audio_path, status, language_code, lesson_id",
				)
				.eq("language_code", languageCode);

			if (sentenceError?.message?.includes("lesson_id")) {
				const fallbackSentenceResponse = await supabase
					.from("sentences")
					.select(
						"id, text, translation, level, difficulty_score, naturalness_score, topic_tags, grammar_tags, context_tags, audio_path, status, language_code",
					)
					.eq("language_code", languageCode);

				sentenceData = (fallbackSentenceResponse.data ?? []).map((sentence) => ({
					...sentence,
					lesson_id: getLessonIdFromContextTags(sentence.context_tags),
				}));
				sentenceError = fallbackSentenceResponse.error;
			}

			if (sentenceError) {
				console.error(
					"Nao foi possivel carregar frases do Supabase:",
					sentenceError,
				);
				return null;
			}

			let { data: blockData, error: blockError } = await supabase
				.from("blocks")
				.select(
					"id, canonical_text, core_meaning, pronunciation_hint, contextual_tip, block_type, tags, language_code, audio_path",
				)
				.eq("language_code", languageCode);

			if (blockError?.message?.includes("contextual_tip")) {
				const fallbackBlockResponse = await supabase
					.from("blocks")
					.select(
						"id, canonical_text, core_meaning, pronunciation_hint, block_type, tags, language_code, audio_path",
					)
					.eq("language_code", languageCode);

				blockData = (fallbackBlockResponse.data ?? []).map((block) => ({
					...block,
					contextual_tip: extractContextualTipFromTags(block.tags),
				}));
				blockError = fallbackBlockResponse.error;
			}

			if (blockError?.message?.includes("pronunciation_hint")) {
				const fallbackBlockResponse = await supabase
					.from("blocks")
					.select("id, canonical_text, core_meaning, block_type, tags, language_code, audio_path")
					.eq("language_code", languageCode);

				blockData = (fallbackBlockResponse.data ?? []).map((block) => ({
					...block,
					pronunciation_hint: null,
					contextual_tip: extractContextualTipFromTags(block.tags),
				}));
				blockError = fallbackBlockResponse.error;
			}

			if (blockError) {
				console.error("Nao foi possivel carregar blocos do Supabase:", blockError);
			}

			const pronunciationHintsByBlock = loadPronunciationHintsCache();
			const blocksWithPronunciationHints = (blockData ?? []).map((block) => ({
				...block,
				pronunciation_hint:
					block.pronunciation_hint ?? pronunciationHintsByBlock[block.id] ?? null,
			}));

			const { data: sentenceBlockData, error: sentenceBlockError } = await supabase
				.from("sentence_blocks")
				.select(
					"id, sentence_id, block_id, order_index, surface, contextual_gloss",
				);

			if (sentenceBlockError) {
				console.error(
					"Nao foi possivel carregar sentence blocks do Supabase:",
					sentenceBlockError,
				);
			}

			const nextRuntimeSentences = buildRuntimeSentences({
				dbSentenceRows: sentenceData ?? [],
				dbBlockRows: blocksWithPronunciationHints,
				dbSentenceBlockRows: sentenceBlockData ?? [],
			});

			runtimeCacheRef.current[languageCode] = nextRuntimeSentences;
			return nextRuntimeSentences;
		})();

		const nextRuntimeSentences = await runtimeRequestsRef.current[languageCode];

		if (!nextRuntimeSentences) {
			if (applyToState && isMountedRef.current) {
				setRuntimeSentences([]);
				runtimeSentencesRef.current = [];
				setCurrentSentenceId(null);
				setIsRuntimeLoading(false);
			}
			return [];
		}

		if (!isMountedRef.current || !applyToState) {
			return nextRuntimeSentences;
		}

		setRuntimeSentences(nextRuntimeSentences);
		runtimeSentencesRef.current = nextRuntimeSentences;
			const progressAwareLessonId =
				viewMode === "study" || isLessonComplete
					? normalizeLessonId(selectedLessonId)
					: getProgressAwareLessonId(
							nextRuntimeSentences,
							selectedLessonId,
							blockStatuses,
						);
		setSelectedLessonId(progressAwareLessonId);
		setCurrentSentenceId((prevSentenceId) => {
			const nextLessonSentences = getSentencesForLesson(
				nextRuntimeSentences,
				progressAwareLessonId,
			);
			if (
				prevSentenceId &&
				nextLessonSentences.some((item) => item.id === prevSentenceId)
			) {
				return prevSentenceId;
			}

			return nextLessonSentences[0]?.id ?? null;
		});
		setIsRuntimeLoading(false);
		}, [
			blockStatuses,
			isLessonComplete,
			selectedLanguage,
			selectedLessonId,
			viewMode,
		]);

	useEffect(() => {
		function handleHashChange() {
			const nextViewMode = getViewModeFromHash();
			setViewMode(nextViewMode);

			if (nextViewMode === "dashboard" || nextViewMode === "study") {
				loadSentenceRuntimeData(
					{ current: true },
					selectedLanguage,
					{ forceRefresh: true, showLoading: false },
				);
			}
		}

		window.addEventListener("hashchange", handleHashChange);
		return () => {
			window.removeEventListener("hashchange", handleHashChange);
		};
	}, [loadSentenceRuntimeData, selectedLanguage]);

	useEffect(() => {
		let isMounted = true;

		supabase.auth.getUser().then(({ data }) => {
			if (isMounted) {
				setAuthUser(data.user ?? null);
				setIsAuthLoading(false);
				if (data.user) {
					const redirectTarget = popStoredAuthRedirectTarget(null);
					if (redirectTarget) {
						window.location.hash = "dashboard";
					}
				}
			}
		});

		const { data: authListener } = supabase.auth.onAuthStateChange(
			(_event, session) => {
				setAuthUser(session?.user ?? null);
				setIsAuthLoading(false);
				if (session?.user) {
					const redirectTarget = popStoredAuthRedirectTarget(null);
					if (redirectTarget) {
						window.location.hash = "dashboard";
					}
				}
			},
		);

		return () => {
			isMounted = false;
			authListener.subscription.unsubscribe();
		};
	}, []);

	const lessonSentences = getSentencesForLesson(runtimeSentences, selectedLessonId);
	const rawSentence =
		lessonSentences.find(
			(sentenceItem) => sentenceItem.id === currentSentenceId,
		) ??
		lessonSentences[0] ??
		null;
	const sentence = rawSentence;
	const currentLessonSentenceIndex = sentence
		? lessonSentences.findIndex((sentenceItem) => sentenceItem.id === sentence.id)
		: -1;
	const canGoBackInLesson = currentLessonSentenceIndex > 0;

	const selectedBlock =
		sentence?.blocks.find((block) => block.id === selectedBlockId) ?? null;

	const sentenceBlocks = sentence?.blocks ?? [];
	const totalSentenceBlocks = sentenceBlocks.length;
	const knownBlockCount = sentenceBlocks.filter(
		(block) => blockStatuses[block.blockId] === "known",
	).length;
	const learningBlockCount = sentenceBlocks.filter(
		(block) => blockStatuses[block.blockId] === "learning",
	).length;
	const reviewedBlockCount = knownBlockCount + learningBlockCount;
	const progressValue =
		totalSentenceBlocks > 0 ? (knownBlockCount / totalSentenceBlocks) * 100 : 0;
	const reviewedProgressValue =
		totalSentenceBlocks > 0
			? (reviewedBlockCount / totalSentenceBlocks) * 100
			: 0;
	const lessonKnownBlockCount = Object.values(lessonBlockMarks).filter(
		(status) => status === "known",
	).length;
	const lessonLearningBlockCount = Object.values(lessonBlockMarks).filter(
		(status) => status === "learning",
	).length;
	const uniqueBlocksById = new Map();

	runtimeSentences.forEach((runtimeSentence) => {
		runtimeSentence.blocks?.forEach((block) => {
			if (!uniqueBlocksById.has(block.blockId)) {
				uniqueBlocksById.set(block.blockId, block);
			}
		});
	});

	const profileBlocks = Array.from(uniqueBlocksById.values());
	const lessonKnownBlocks = profileBlocks.filter(
		(block) => lessonBlockMarks[block.blockId] === "known",
	);
	const lessonLearningBlocks = profileBlocks.filter(
		(block) => lessonBlockMarks[block.blockId] === "learning",
	);
	const knownProfileBlocks = profileBlocks.filter(
		(block) => blockStatuses[block.blockId] === "known",
	);
	const learningProfileBlocks = profileBlocks.filter(
		(block) => blockStatuses[block.blockId] === "learning",
	);
	const newProfileBlockCount = profileBlocks.filter(
		(block) => !blockStatuses[block.blockId],
	).length;
	const flashcardDeck = buildFlashcardDeck(runtimeSentences, blockStatuses);
	const dueFlashcardCount = countDueFlashcards(flashcardDeck, selectedLanguage);

	useEffect(() => {
		if (
			runtimeSentences.length === 0 ||
			isLessonComplete ||
			viewMode === "study"
		) {
			return;
		}

		const progressAwareLessonId = getProgressAwareLessonId(
			runtimeSentences,
			selectedLessonId,
			blockStatuses,
		);

		if (progressAwareLessonId === selectedLessonId) {
			return;
		}

		const progressAwareLessonSentences = getSentencesForLesson(
			runtimeSentences,
			progressAwareLessonId,
		);

		setSelectedLessonId(progressAwareLessonId);
		setCurrentSentenceId(progressAwareLessonSentences[0]?.id ?? null);
	}, [
		blockStatuses,
		isLessonComplete,
		runtimeSentences,
		selectedLessonId,
		viewMode,
	]);

	useEffect(() => {
		persistStoredJson(
			getBlockStatusesStorageKey(selectedLanguage),
			blockStatuses,
		);
	}, [blockStatuses, selectedLanguage]);

	useEffect(() => {
		persistStoredActiveLessonId(selectedLanguage, selectedLessonId);

		if (!authUser?.id) {
			return;
		}

		const progressKey = `${authUser.id}:${selectedLanguage}`;

		if (remoteLessonProgressKey !== progressKey) {
			return;
		}

		persistRemoteActiveLessonId(
			authUser.id,
			selectedLanguage,
			selectedLessonId,
		);
	}, [authUser?.id, remoteLessonProgressKey, selectedLanguage, selectedLessonId]);

	useEffect(() => {
		if (!authUser?.id) {
			setRemoteLessonProgressKey(null);
			return;
		}

		let isMounted = true;
		const progressKey = `${authUser.id}:${selectedLanguage}`;
		setRemoteLessonProgressKey(null);

		async function syncActiveLessonFromSupabase() {
			const localLessonId = loadStoredActiveLessonId(selectedLanguage);
			const remoteLessonId = await loadRemoteActiveLessonId(
				authUser.id,
				selectedLanguage,
			);
			const nextLessonId = remoteLessonId ?? localLessonId;

			if (!isMounted) {
				return;
			}

			persistStoredActiveLessonId(selectedLanguage, nextLessonId);
			setSelectedLessonId(nextLessonId);
			setRemoteLessonProgressKey(progressKey);

			if (!remoteLessonId) {
				persistRemoteActiveLessonId(
					authUser.id,
					selectedLanguage,
					nextLessonId,
				);
			}
		}

		syncActiveLessonFromSupabase();

		return () => {
			isMounted = false;
		};
	}, [authUser?.id, selectedLanguage]);

	useEffect(() => {
		if (!sentence?.audio) {
			preloadedSentenceAudioRef.current = null;
			preloadedSentenceAudioSrcRef.current = null;
			return;
		}

		if (preloadedSentenceAudioSrcRef.current === sentence.audio) {
			return;
		}

		const audio = new Audio(sentence.audio);
		audio.preload = "auto";
		audio.load();
		preloadedSentenceAudioRef.current = audio;
		preloadedSentenceAudioSrcRef.current = sentence.audio;
	}, [sentence?.audio]);

	useEffect(() => {
		runtimeSentencesRef.current = runtimeSentences;
	}, [runtimeSentences]);

	useEffect(() => {
		const isMountedRef = { current: true };
		const loadRuntime = async () => {
			await loadSentenceRuntimeData(isMountedRef);
		};
		loadRuntime();

		return () => {
			isMountedRef.current = false;
		};
	}, [loadSentenceRuntimeData]);

	useEffect(() => {
		if (!authUser) {
			return;
		}

		const isMountedRef = { current: true };

		Array.from(SUPPORTED_LANGUAGE_CODES)
			.filter((languageCode) => languageCode !== selectedLanguage)
			.forEach((languageCode) => {
				loadSentenceRuntimeData(isMountedRef, languageCode, {
					applyToState: false,
					showLoading: false,
				});
			});

		return () => {
			isMountedRef.current = false;
		};
	}, [authUser, loadSentenceRuntimeData, selectedLanguage]);

	function playAudio(audioSrc) {
		if (!audioSrc) {
			return;
		}

		stopCurrentAudio();

		const audio = new Audio(audioSrc);
		audioRef.current = audio;
		currentAudioSrcRef.current = audioSrc;
		audio.onended = () => {
			audioRef.current = null;
			currentAudioSrcRef.current = null;
			setIsSentenceAudioPlaying(false);
		};
		audio.play().catch((error) => {
			console.error("Nao foi possivel tocar o audio:", error);
		});
	}

	function handleSelectBlock(blockId) {
		setSelectedBlockId((prev) => {
			const nextBlockId = prev === blockId ? null : blockId;

			if (!nextBlockId) {
				stopCurrentAudio();
				return null;
			}

			const blockToPlay = sentence?.blocks.find(
				(block) => block.id === nextBlockId,
			);

			if (blockToPlay?.audio) {
				setIsSentenceAudioPlaying(false);
				playAudio(blockToPlay.audio);
			}

			return nextBlockId;
		});
	}

	function handlePlayBlockAudio(block) {
		setIsSentenceAudioPlaying(false);
		playAudio(block.audio);
	}

	function updateBlockStatus(blockId, status) {
		setBlockStatuses((prev) => {
			if (prev[blockId] === status) {
				return prev;
			}

			recordLearningActivity();

			return {
				...prev,
				[blockId]: status,
			};
		});
	}

	function handleMarkKnown(block) {
		updateBlockStatus(block.blockId, "known");
		if (viewMode === "study") {
			setLessonBlockMarks((prev) => ({
				...prev,
				[block.blockId]: "known",
			}));
		}
		setSelectedBlockId(null);
	}

	function handleStudyBlock(block) {
		updateBlockStatus(block.blockId, "learning");
		if (viewMode === "study") {
			setLessonBlockMarks((prev) => ({
				...prev,
				[block.blockId]: "learning",
			}));
		}
		setSelectedBlockId(null);
	}

	function handleNextSentence() {
		if (!sentence) {
			return;
		}

		setSelectedBlockId(null);
		stopCurrentAudio();

		const currentIndex = lessonSentences.findIndex(
			(runtimeSentence) => runtimeSentence.id === sentence.id,
		);

		if (currentIndex === -1 || lessonSentences.length === 0) {
			return;
		}

		if (currentIndex >= lessonSentences.length - 1) {
			setIsLessonComplete(true);
			return;
		}

		const nextSentence = lessonSentences[(currentIndex + 1) % lessonSentences.length];
		setCurrentSentenceId(nextSentence.id);
	}

	function handlePreviousSentence() {
		if (!sentence) {
			return;
		}

		const currentIndex = lessonSentences.findIndex(
			(runtimeSentence) => runtimeSentence.id === sentence.id,
		);

		if (currentIndex <= 0) {
			return;
		}

		setSelectedBlockId(null);
		stopCurrentAudio();
		setCurrentSentenceId(lessonSentences[currentIndex - 1].id);
	}

	function handlePlaySentenceAudio() {
		if (!sentence?.audio) {
			return;
		}

		const isCurrentSentenceAudio =
			currentAudioSrcRef.current === sentence.audio && audioRef.current;

		if (isCurrentSentenceAudio && !audioRef.current.paused) {
			audioRef.current.pause();
			setIsSentenceAudioPlaying(false);
			return;
		}

		if (isCurrentSentenceAudio && audioRef.current.paused) {
			audioRef.current.play().catch((error) => {
				console.error("Nao foi possivel retomar o audio:", error);
			});
			setIsSentenceAudioPlaying(true);
			return;
		}

		if (preloadedSentenceAudioSrcRef.current === sentence.audio) {
			stopCurrentAudio();

			const audio = preloadedSentenceAudioRef.current;
			audio.currentTime = 0;
			audio.onended = () => {
				audioRef.current = null;
				currentAudioSrcRef.current = null;
				setIsSentenceAudioPlaying(false);
			};
			audioRef.current = audio;
			currentAudioSrcRef.current = sentence.audio;
			audio.play().catch((error) => {
				console.error("Nao foi possivel tocar o audio:", error);
			});
			setIsSentenceAudioPlaying(true);
			return;
		}

		playAudio(sentence.audio);
		setIsSentenceAudioPlaying(true);
	}

	function handleSelectLanguage(languageId) {
		if (!SUPPORTED_LANGUAGE_CODES.has(languageId)) {
			return;
		}

		window.localStorage.setItem("linguasimp-language", languageId);

			if (!authUser) {
				setSelectedLanguage(languageId);
				setSelectedLessonId(loadStoredActiveLessonId(languageId));
				setBlockStatuses(loadStoredBlockStatuses(languageId));
				setLearningActivity(loadStoredLearningActivity(languageId));
				setSelectedBlockId(null);
				setIsLessonComplete(false);
				stopCurrentAudio();
			window.location.hash = "login?next=study";
			return;
		}

			setSelectedLanguage(languageId);
			const storedActiveLessonId = loadStoredActiveLessonId(languageId);
			setSelectedLessonId(storedActiveLessonId);
			const nextBlockStatuses = loadStoredBlockStatuses(languageId);
			setLearningActivity(loadStoredLearningActivity(languageId));
			if (runtimeCacheRef.current[languageId]) {
			const cachedRuntimeSentences = runtimeCacheRef.current[languageId];
			const progressAwareLessonId = getProgressAwareLessonId(
				cachedRuntimeSentences,
				storedActiveLessonId,
				nextBlockStatuses,
			);
			const cachedLessonSentences = getSentencesForLesson(
				cachedRuntimeSentences,
				progressAwareLessonId,
			);
			setSelectedLessonId(progressAwareLessonId);
			setRuntimeSentences(cachedRuntimeSentences);
			runtimeSentencesRef.current = cachedRuntimeSentences;
			setCurrentSentenceId(cachedLessonSentences[0]?.id ?? null);
		}
		setBlockStatuses(nextBlockStatuses);
		setLessonBlockMarks({});
		setSelectedBlockId(null);
		setIsLessonComplete(false);
		stopCurrentAudio();
		window.location.hash = "study";
	}

	function handleDashboardSelectLanguage(languageId) {
		if (!SUPPORTED_LANGUAGE_CODES.has(languageId)) {
			return;
		}

		window.localStorage.setItem("linguasimp-language", languageId);
		setSelectedLanguage(languageId);
		const storedActiveLessonId = loadStoredActiveLessonId(languageId);
		setSelectedLessonId(storedActiveLessonId);
		const nextBlockStatuses = loadStoredBlockStatuses(languageId);
		setLearningActivity(loadStoredLearningActivity(languageId));
		if (runtimeCacheRef.current[languageId]) {
			const cachedRuntimeSentences = runtimeCacheRef.current[languageId];
			const progressAwareLessonId = getProgressAwareLessonId(
				cachedRuntimeSentences,
				storedActiveLessonId,
				nextBlockStatuses,
			);
			const cachedLessonSentences = getSentencesForLesson(
				cachedRuntimeSentences,
				progressAwareLessonId,
			);
			setSelectedLessonId(progressAwareLessonId);
			setRuntimeSentences(cachedRuntimeSentences);
			runtimeSentencesRef.current = cachedRuntimeSentences;
			setCurrentSentenceId(cachedLessonSentences[0]?.id ?? null);
		}
		setBlockStatuses(nextBlockStatuses);
		setLessonBlockMarks({});
		setSelectedBlockId(null);
		setIsLessonComplete(false);
		stopCurrentAudio();
	}

	function handleResetProgress() {
		clearStoredBlockStatuses();
		clearStoredFlashcardSchedules();
		clearStoredLearningActivity();
		clearStoredActiveLessons();
		setBlockStatuses({});
		setLearningActivity({});
		setSelectedLessonId(DEFAULT_LESSON_ID);
		setCurrentSentenceId(getSentencesForLesson(runtimeSentences, DEFAULT_LESSON_ID)[0]?.id ?? null);
		setLessonBlockMarks({});
		setSelectedBlockId(null);
		stopCurrentAudio();
	}

	function handleContinueAfterLessonComplete() {
		const sequentialNextLessonId = getNextLessonId(runtimeSentences, selectedLessonId);
		const nextLessonId = isLessonReviewed(
			runtimeSentences,
			sequentialNextLessonId,
			blockStatuses,
		)
			? getFirstIncompleteLessonId(runtimeSentences, blockStatuses)
			: sequentialNextLessonId;
		const nextLessonSentences = getSentencesForLesson(runtimeSentences, nextLessonId);

		persistStoredActiveLessonId(selectedLanguage, nextLessonId);
		setSelectedLessonId(nextLessonId);
		setIsLessonComplete(false);
		setLessonBlockMarks({});
		setCurrentSentenceId(nextLessonSentences[0]?.id ?? null);
		window.location.hash = "dashboard";
	}

	function handleAuthenticated(user) {
		setAuthUser(user ?? null);
		window.location.hash = "dashboard";
	}

	async function handleSignOut() {
		stopCurrentAudio();
		await supabase.auth.signOut();
		setAuthUser(null);
		setRemoteLessonProgressKey(null);
		setIsLessonComplete(false);
		setSelectedBlockId(null);
		window.location.hash = "";
	}

	useEffect(() => {
		return () => {
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current = null;
			}

			if (preloadedSentenceAudioRef.current) {
				preloadedSentenceAudioRef.current.pause();
				preloadedSentenceAudioRef.current = null;
			}
		};
	}, []);

	if (viewMode === "admin") {
		return <AdminScreen />;
	}

	if (viewMode === "landing") {
		if (authUser) {
			return (
				<DashboardScreen
					user={authUser}
					learningLanguage={selectedLanguage}
					sentenceCount={lessonSentences.length}
					knownCount={knownProfileBlocks.length}
					learningCount={learningProfileBlocks.length}
					newBlockCount={newProfileBlockCount}
					flashcardCount={flashcardDeck.length}
					dueFlashcardCount={dueFlashcardCount}
					weeklyActivity={learningActivity}
					knownBlocks={knownProfileBlocks}
					onSelectLanguage={handleDashboardSelectLanguage}
					onSignOut={handleSignOut}
				/>
			);
		}

		return <LandingScreen />;
	}

	if (viewMode === "onboarding") {
		if (authUser) {
			return (
				<DashboardScreen
					user={authUser}
					learningLanguage={selectedLanguage}
					sentenceCount={lessonSentences.length}
					knownCount={knownProfileBlocks.length}
					learningCount={learningProfileBlocks.length}
					newBlockCount={newProfileBlockCount}
					flashcardCount={flashcardDeck.length}
					dueFlashcardCount={dueFlashcardCount}
					weeklyActivity={learningActivity}
					knownBlocks={knownProfileBlocks}
					onSelectLanguage={handleDashboardSelectLanguage}
					onSignOut={handleSignOut}
				/>
			);
		}

		return <OnboardingScreen />;
	}

	if (
		isAuthLoading &&
			(viewMode === "study" ||
				viewMode === "dashboard" ||
				viewMode === "progress-examples" ||
				viewMode === "profile" ||
				viewMode === "flashcards" ||
				viewMode === "wallet-demo")
	) {
		return (
			<div className="min-h-screen bg-[#05080f] px-4 py-8 text-white sm:px-6">
				<div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-3xl flex-col justify-center text-center">
					<p className="text-sm font-medium text-slate-500">Verificando login...</p>
				</div>
			</div>
		);
	}

	if (viewMode === "login") {
		return (
			<AuthScreen
				mode="login"
				onAuthenticated={handleAuthenticated}
				redirectHash={getAuthRedirectTargetFromHash()}
			/>
		);
	}

	if (viewMode === "signup") {
		return (
			<AuthScreen
				mode="signup"
				onAuthenticated={handleAuthenticated}
				redirectHash={getAuthRedirectTargetFromHash()}
			/>
		);
	}

	if (viewMode === "menu") {
		if (authUser) {
			return (
				<DashboardScreen
					user={authUser}
					learningLanguage={selectedLanguage}
					sentenceCount={lessonSentences.length}
					knownCount={knownProfileBlocks.length}
					learningCount={learningProfileBlocks.length}
					newBlockCount={newProfileBlockCount}
					flashcardCount={flashcardDeck.length}
					dueFlashcardCount={dueFlashcardCount}
					weeklyActivity={learningActivity}
					knownBlocks={knownProfileBlocks}
					onSelectLanguage={handleDashboardSelectLanguage}
					onSignOut={handleSignOut}
				/>
			);
		}

		return (
			<LanguageMenu onSelectLanguage={handleSelectLanguage} user={authUser} />
		);
	}

	if (viewMode === "dashboard") {
		if (!authUser) {
			return (
				<AuthScreen
					mode="login"
					onAuthenticated={handleAuthenticated}
					redirectHash="dashboard"
				/>
			);
		}

		return (
			<DashboardScreen
				user={authUser}
				learningLanguage={selectedLanguage}
				sentenceCount={lessonSentences.length}
				knownCount={knownProfileBlocks.length}
				learningCount={learningProfileBlocks.length}
					newBlockCount={newProfileBlockCount}
					flashcardCount={flashcardDeck.length}
					dueFlashcardCount={dueFlashcardCount}
					weeklyActivity={learningActivity}
					knownBlocks={knownProfileBlocks}
				onSelectLanguage={handleDashboardSelectLanguage}
				onSignOut={handleSignOut}
			/>
		);
	}

	if (viewMode === "progress-examples") {
		if (!authUser) {
			return (
				<AuthScreen
					mode="login"
					onAuthenticated={handleAuthenticated}
					redirectHash="progress-examples"
				/>
			);
		}

		return (
			<ProgressExamplesScreen
				user={authUser}
				learningLanguage={selectedLanguage}
				knownCount={knownProfileBlocks.length}
				learningCount={learningProfileBlocks.length}
				flashcardCount={flashcardDeck.length}
				onSelectLanguage={handleDashboardSelectLanguage}
				onSignOut={handleSignOut}
			/>
		);
	}

	if (viewMode === "profile") {
		if (!authUser) {
			return (
				<AuthScreen
					mode="login"
					onAuthenticated={handleAuthenticated}
					redirectHash="profile"
				/>
			);
		}

		return (
			<ProfileScreen
				user={authUser}
				learningLanguage={selectedLanguage}
				sentenceCount={lessonSentences.length}
				knownBlocks={knownProfileBlocks}
				learningBlocks={learningProfileBlocks}
				newBlockCount={newProfileBlockCount}
				onResetProgress={handleResetProgress}
				onSelectLanguage={handleDashboardSelectLanguage}
				onSignOut={handleSignOut}
				onUserUpdated={setAuthUser}
			/>
		);
	}

	if (viewMode === "flashcards") {
		if (!authUser) {
			return (
				<AuthScreen
					mode="login"
					onAuthenticated={handleAuthenticated}
					redirectHash="flashcards"
				/>
			);
		}

		return (
			<FlashcardsScreen
				user={authUser}
				cards={flashcardDeck}
					learningLanguage={selectedLanguage}
					onPlayBlockAudio={handlePlayBlockAudio}
					onRecordActivity={recordLearningActivity}
					onSelectLanguage={handleDashboardSelectLanguage}
					onSignOut={handleSignOut}
				/>
		);
	}

	if (viewMode === "wallet-demo") {
		if (!authUser) {
			return (
				<AuthScreen
					mode="login"
					onAuthenticated={handleAuthenticated}
					redirectHash="wallet-demo"
				/>
			);
		}

		return (
			<WalletDemoScreen
				user={authUser}
				learningLanguage={selectedLanguage}
				onSelectLanguage={handleDashboardSelectLanguage}
				onSignOut={handleSignOut}
			/>
		);
	}

	if (isLessonComplete) {
		return (
			<LessonCompleteScreen
				user={authUser}
				learningLanguage={selectedLanguage}
				knownBlockCount={lessonKnownBlockCount}
				learningBlockCount={lessonLearningBlockCount}
				knownBlocks={lessonKnownBlocks}
				learningBlocks={lessonLearningBlocks}
				onSelectLanguage={handleDashboardSelectLanguage}
				onSignOut={handleSignOut}
				onContinue={handleContinueAfterLessonComplete}
			/>
		);
	}

	if (viewMode === "study" && !authUser) {
		return (
			<AuthScreen
				mode="login"
				onAuthenticated={handleAuthenticated}
				redirectHash="study"
			/>
		);
	}

	if (isRuntimeLoading) {
		return (
			<div className="min-h-screen bg-[#05080f] px-4 py-8 text-white sm:px-6">
				<div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-3xl flex-col justify-center text-center">
					<p className="text-sm font-medium text-slate-500">Carregando idioma...</p>
				</div>
			</div>
		);
	}

	if (!sentence) {
		return (
			<div className="min-h-screen bg-[#000000] px-4 py-8 text-white sm:px-6">
				<div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-3xl flex-col justify-center rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center">
					<p className="text-xs uppercase tracking-[0.18em] text-white/40">
						Modo estudo
					</p>
					<h1 className="mt-3 text-2xl font-semibold text-white">
						Nenhuma frase disponivel
					</h1>
					<p className="mt-3 text-sm leading-relaxed text-white/65">
						O estudo agora mostra apenas frases do idioma escolhido. Se a tela
						continua vazia, verifique se existem registros com `text`
						preenchido e `language_code` igual a `{selectedLanguage}` nas
						tabelas `sentences`, `blocks` e `sentence_blocks`.
					</p>
				</div>
			</div>
		);
	}

	return (
		<SentenceScreen
			sentence={sentence}
			selectedBlock={selectedBlock}
			blockStatuses={blockStatuses}
			onSelectBlock={handleSelectBlock}
			onMarkKnown={handleMarkKnown}
			onStudyBlock={handleStudyBlock}
				onPlayBlockAudio={handlePlayBlockAudio}
				onPrevious={handlePreviousSentence}
				canGoBack={canGoBackInLesson}
				onNext={handleNextSentence}
				onPlaySentenceAudio={handlePlaySentenceAudio}
			isSentenceAudioPlaying={isSentenceAudioPlaying}
			currentSentenceIndex={reviewedBlockCount}
			totalSentences={totalSentenceBlocks}
			progressValue={progressValue}
			reviewedProgressValue={reviewedProgressValue}
			user={authUser}
			learningLanguage={selectedLanguage}
			onSelectLanguage={handleDashboardSelectLanguage}
			onSignOut={handleSignOut}
		/>
	);
}

export default App;
