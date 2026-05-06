import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	RefreshCw,
	Save,
	Plus,
	Trash2,
	ArrowLeftRight,
	Volume2,
	Copy,
	GripVertical,
	ChevronUp,
	ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	createBlock,
	createSentence,
	deleteBlock,
	deleteSentence,
	duplicateSentence,
	fetchAdminRuntimeData,
	regenerateBlockAudio,
	regenerateSentenceAudio,
	replaceSentenceBlocks,
	updateBlock,
	updateSentence,
} from "@/lib/adminApi";
import { getAudioUrl } from "@/lib/getAudioUrl";
import { buildPronunciationHint } from "@/lib/buildPronunciationHint";

function formatArrayInput(value) {
	return Array.isArray(value) ? value.join(", ") : "";
}

function parseArrayInput(value) {
	return value
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}

function isLessonContextTag(value) {
	return String(value ?? "").startsWith("lesson:");
}

function formatContextTagsInput(value) {
	return formatArrayInput(
		Array.isArray(value) ? value.filter((item) => !isLessonContextTag(item)) : [],
	);
}

function buildSentenceBlockRows(sentenceBlocks, sentenceId) {
	return sentenceBlocks
		.filter((item) => item.sentence_id === sentenceId)
		.sort((a, b) => a.order_index - b.order_index);
}

function getAudioStateLabel(item) {
	return item?.audio_path ? "com audio" : "sem audio";
}

function buildAdminPronunciationHint(block) {
	return buildPronunciationHint({
		surface: block?.canonical_text ?? "",
		canonical: block?.canonical_text ?? "",
		languageCode: block?.language_code ?? DEFAULT_LANGUAGE_CODE,
	});
}

function getPageForSelectedItem(items, selectedId) {
	if (!selectedId) {
		return null;
	}

	const itemIndex = items.findIndex((item) => item.id === selectedId);

	if (itemIndex === -1) {
		return null;
	}

	return Math.floor(itemIndex / PAGE_SIZE) + 1;
}

const PAGE_SIZE = 20;
const PRONUNCIATION_HINTS_STORAGE_KEY = "linguasimp-admin-pronunciation-hints";
const DEFAULT_LANGUAGE_CODE = "en";
const DEFAULT_LESSON_ID = "lesson_1";
const DEFAULT_SENTENCE_SPEECH_SPEED = 1;
const MIN_SENTENCE_SPEECH_SPEED = 0.7;
const MAX_SENTENCE_SPEECH_SPEED = 1.2;
const ADMIN_LANGUAGES = [
	{ code: "en", label: "Ingles" },
	{ code: "es", label: "Espanhol" },
	{ code: "fr", label: "Frances" },
	{ code: "de", label: "Alemao" },
	{ code: "it", label: "Italiano" },
	{ code: "ru", label: "Russo" },
	{ code: "no", label: "Noruegues" },
	{ code: "el", label: "Grego" },
	{ code: "zh", label: "Chines" },
	{ code: "ja", label: "Japones" },
];
const DEFAULT_ADMIN_LESSONS = ["lesson_1", "lesson_2", "lesson_3"];

function formatLessonLabel(lessonId) {
	const numericPart = String(lessonId ?? "").match(/lesson_(\d+)/)?.[1];
	return numericPart ? `Licao ${numericPart}` : lessonId || "Sem licao";
}

function formatLanguageLabel(languageCode) {
	return (
		ADMIN_LANGUAGES.find((language) => language.code === languageCode)?.label ??
		languageCode ??
		"Sem idioma"
	);
}

function compareLessonIds(firstLessonId, secondLessonId) {
	const firstValue = Number(String(firstLessonId).match(/lesson_(\d+)/)?.[1] ?? 0);
	const secondValue = Number(String(secondLessonId).match(/lesson_(\d+)/)?.[1] ?? 0);

	if (firstValue !== secondValue) {
		return firstValue - secondValue;
	}

	return String(firstLessonId).localeCompare(String(secondLessonId));
}

function compareLanguageCodes(firstLanguageCode, secondLanguageCode) {
	const firstIndex = ADMIN_LANGUAGES.findIndex(
		(language) => language.code === firstLanguageCode,
	);
	const secondIndex = ADMIN_LANGUAGES.findIndex(
		(language) => language.code === secondLanguageCode,
	);

	if (firstIndex !== -1 || secondIndex !== -1) {
		return (firstIndex === -1 ? 999 : firstIndex) - (secondIndex === -1 ? 999 : secondIndex);
	}

	return String(firstLanguageCode).localeCompare(String(secondLanguageCode));
}

function formatSpeechSpeed(value) {
	return Number(value ?? DEFAULT_SENTENCE_SPEECH_SPEED).toFixed(2);
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

function AdminScreen() {
	const [view, setView] = useState("sentences");
	const [search, setSearch] = useState("");
	const [levelFilter, setLevelFilter] = useState("all");
	const [languageFilter, setLanguageFilter] = useState("all");
	const [lessonFilter, setLessonFilter] = useState("all");
	const [audioStatusFilter, setAudioStatusFilter] = useState("all");
	const [currentPage, setCurrentPage] = useState(1);
	const [runtimeData, setRuntimeData] = useState({
		sentences: [],
		blocks: [],
		sentenceBlocks: [],
	});
	const [selectedSentenceId, setSelectedSentenceId] = useState(null);
	const [selectedBlockId, setSelectedBlockId] = useState(null);
	const [sentenceForm, setSentenceForm] = useState(null);
	const [blockForm, setBlockForm] = useState(null);
	const pronunciationHintsByBlockRef = useRef(loadPronunciationHintsCache());
	const [sentenceBlocksForm, setSentenceBlocksForm] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSavingSentence, setIsSavingSentence] = useState(false);
	const [isSavingSentenceBlocks, setIsSavingSentenceBlocks] = useState(false);
	const [isSavingBlock, setIsSavingBlock] = useState(false);
	const [isRegeneratingSentenceAudio, setIsRegeneratingSentenceAudio] = useState(false);
	const [isRegeneratingBlockAudio, setIsRegeneratingBlockAudio] = useState(false);
	const [isDuplicatingSentence, setIsDuplicatingSentence] = useState(false);
	const [isDeletingSentence, setIsDeletingSentence] = useState(false);
	const [isDeletingBlock, setIsDeletingBlock] = useState(false);
	const [draggedSentenceBlockIndex, setDraggedSentenceBlockIndex] = useState(null);
	const [message, setMessage] = useState("");

	const levelOptions = [
		...new Set(
			[...runtimeData.sentences, ...runtimeData.blocks]
				.map((item) => item.level)
				.filter(Boolean),
		),
	].sort();
	const audioStatusOptions = [
		...new Set(
			[...runtimeData.sentences, ...runtimeData.blocks].map(getAudioStateLabel),
		),
	].sort();
	const languageOptions = [
		...new Set(
			[
				...ADMIN_LANGUAGES.map((language) => language.code),
				...runtimeData.sentences.map((item) => item.language_code),
				...runtimeData.blocks.map((item) => item.language_code),
			]
				.filter(Boolean),
		),
	].sort(compareLanguageCodes);
	const buildLessonOptionsForLanguage = (languageCode = "all") =>
		[
			...new Set([
				...DEFAULT_ADMIN_LESSONS,
				...runtimeData.sentences
					.filter(
						(item) =>
							languageCode === "all" ||
							item.language_code === languageCode,
					)
					.map((item) => item.lesson_id ?? DEFAULT_LESSON_ID),
			]),
		].sort(compareLessonIds);
	const lessonOptions = buildLessonOptionsForLanguage(languageFilter);
	const languageLessonGroups = languageOptions.map((languageCode) => {
		const languageSentences = runtimeData.sentences.filter(
			(sentence) => sentence.language_code === languageCode,
		);
		const lessons = [
			...new Set(
				languageSentences.map(
					(sentence) => sentence.lesson_id ?? DEFAULT_LESSON_ID,
				),
			),
		].sort(compareLessonIds);

		return {
			languageCode,
			count: languageSentences.length,
			lessons: lessons.map((lessonId) => ({
				lessonId,
				count: languageSentences.filter(
					(sentence) =>
						(sentence.lesson_id ?? DEFAULT_LESSON_ID) === lessonId,
				).length,
			})),
		};
	});
	const populatedLanguageLessonGroups = languageLessonGroups.filter(
		(group) => group.count > 0,
	);
	const emptyLanguageLessonGroups = languageLessonGroups.filter(
		(group) => group.count === 0,
	);
	const selectedDraftLanguage =
		languageFilter === "all" ? DEFAULT_LANGUAGE_CODE : languageFilter;
	const selectedDraftLesson =
		lessonFilter === "all" ? DEFAULT_LESSON_ID : lessonFilter;
	const sentenceFormLessonOptions = buildLessonOptionsForLanguage(
		sentenceForm?.language_code ?? selectedDraftLanguage,
	);
	const sentenceBlockSuggestions = runtimeData.blocks.filter(
		(block) =>
			!sentenceForm?.language_code ||
			block.language_code === sentenceForm.language_code,
	);

	const filteredSentences = useMemo(() => {
		return runtimeData.sentences.filter((sentence) => {
			const haystack =
				`${sentence.id} ${sentence.text} ${sentence.translation}`.toLowerCase();
			const matchesSearch = haystack.includes(search.toLowerCase());
			const matchesLevel =
				levelFilter === "all" || sentence.level === levelFilter;
			const matchesLanguage =
				languageFilter === "all" ||
				sentence.language_code === languageFilter;
			const matchesLesson =
				lessonFilter === "all" ||
				(sentence.lesson_id ?? DEFAULT_LESSON_ID) === lessonFilter;
			const matchesAudioStatus =
				audioStatusFilter === "all" ||
				getAudioStateLabel(sentence) === audioStatusFilter;

			return matchesSearch && matchesLevel && matchesLanguage && matchesLesson && matchesAudioStatus;
		}).sort((firstSentence, secondSentence) => {
			const languageComparison = compareLanguageCodes(
				firstSentence.language_code,
				secondSentence.language_code,
			);

			if (languageComparison !== 0) {
				return languageComparison;
			}

			const lessonComparison = compareLessonIds(
				firstSentence.lesson_id ?? DEFAULT_LESSON_ID,
				secondSentence.lesson_id ?? DEFAULT_LESSON_ID,
			);

			if (lessonComparison !== 0) {
				return lessonComparison;
			}

			return String(firstSentence.id).localeCompare(String(secondSentence.id));
		});
	}, [
		audioStatusFilter,
		languageFilter,
		lessonFilter,
		levelFilter,
		runtimeData.sentences,
		search,
	]);
	const filteredBlocks = useMemo(() => {
		return runtimeData.blocks.filter((block) => {
			const haystack = `${block.id} ${block.canonical_text} ${block.core_meaning}`.toLowerCase();
			const matchesSearch = haystack.includes(search.toLowerCase());
			const matchesLanguage =
				languageFilter === "all" ||
				block.language_code === languageFilter;
			const matchesAudioStatus =
				audioStatusFilter === "all" ||
				getAudioStateLabel(block) === audioStatusFilter;

			return matchesSearch && matchesLanguage && matchesAudioStatus;
		}).sort((firstBlock, secondBlock) => {
			const languageComparison = compareLanguageCodes(
				firstBlock.language_code,
				secondBlock.language_code,
			);

			if (languageComparison !== 0) {
				return languageComparison;
			}

			return String(firstBlock.id).localeCompare(String(secondBlock.id));
		});
	}, [audioStatusFilter, languageFilter, runtimeData.blocks, search]);
	const visibleItems = useMemo(() => {
		return view === "sentences" ? filteredSentences : filteredBlocks;
	}, [filteredBlocks, filteredSentences, view]);
	const totalPages = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE));
	const paginatedItems = useMemo(() => {
		return visibleItems.slice(
			(currentPage - 1) * PAGE_SIZE,
			currentPage * PAGE_SIZE,
		);
	}, [currentPage, visibleItems]);
	const paginatedSentenceGroups = useMemo(() => {
		const groups = [];

		paginatedItems.forEach((sentence) => {
			const languageCode = sentence.language_code ?? DEFAULT_LANGUAGE_CODE;
			const lessonId = sentence.lesson_id ?? DEFAULT_LESSON_ID;
			const groupKey = `${languageCode}:${lessonId}`;
			const currentGroup = groups.at(-1);

			if (currentGroup?.key === groupKey) {
				currentGroup.items.push(sentence);
				return;
			}

			groups.push({
				key: groupKey,
				languageCode,
				lessonId,
				items: [sentence],
			});
		});

		return groups;
	}, [paginatedItems]);
	const paginatedBlockGroups = useMemo(() => {
		const groups = [];

		paginatedItems.forEach((block) => {
			const languageCode = block.language_code ?? DEFAULT_LANGUAGE_CODE;
			const currentGroup = groups.at(-1);

			if (currentGroup?.languageCode === languageCode) {
				currentGroup.items.push(block);
				return;
			}

			groups.push({
				languageCode,
				items: [block],
			});
		});

		return groups;
	}, [paginatedItems]);
	const selectedSentenceRecord =
		runtimeData.sentences.find(
			(item) => item.id === sentenceForm?.id,
		) ?? null;
	const selectedBlockRecord =
		runtimeData.blocks.find((item) => item.id === blockForm?.id) ??
		null;
	const sentenceAudioUrl = selectedSentenceRecord?.audio_path
		? getAudioUrl("sentence-audio", selectedSentenceRecord.audio_path)
		: null;
	const blockAudioUrl = selectedBlockRecord?.audio_path
		? getAudioUrl("block-audio", selectedBlockRecord.audio_path)
		: null;

	const loadAdminData = useCallback(async () => {
		setIsLoading(true);
		setMessage("");

		try {
			const response = await fetchAdminRuntimeData();
			const nextRuntimeData = response.data;
			setRuntimeData(nextRuntimeData);

			setSelectedSentenceId((prev) => {
				if (prev) {
					return prev;
				}

				return nextRuntimeData.sentences[0]?.id ?? null;
			});

			setSelectedBlockId((prev) => {
				if (prev) {
					return prev;
				}

				return nextRuntimeData.blocks[0]?.id ?? null;
			});
		} catch (error) {
			setMessage(error.message);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadAdminData();
	}, [loadAdminData]);

	function savePronunciationHintToCache(blockId, value) {
		if (!blockId) {
			return;
		}

		pronunciationHintsByBlockRef.current = {
			...pronunciationHintsByBlockRef.current,
			[blockId]: value,
		};
		window.localStorage.setItem(
			PRONUNCIATION_HINTS_STORAGE_KEY,
			JSON.stringify(pronunciationHintsByBlockRef.current),
		);
	}

	useEffect(() => {
		setCurrentPage(1);
	}, [view, search, levelFilter, languageFilter, lessonFilter, audioStatusFilter]);

	useEffect(() => {
		setCurrentPage((prev) => Math.min(prev, totalPages));
	}, [totalPages]);

	useEffect(() => {
		const selectedId =
			view === "sentences" ? selectedSentenceId : selectedBlockId;
		const nextPage = getPageForSelectedItem(visibleItems, selectedId);

		if (nextPage) {
			setCurrentPage((prev) => (prev === nextPage ? prev : nextPage));
		}
	}, [selectedBlockId, selectedSentenceId, view, visibleItems]);

	useEffect(() => {
		const selectedSentence =
			runtimeData.sentences.find(
				(sentence) => sentence.id === selectedSentenceId,
			) ?? null;

		if (!selectedSentence) {
			setSentenceForm((prev) => (prev?.isNew ? prev : null));
			setSentenceBlocksForm((prev) => (sentenceForm?.isNew ? prev : []));
			return;
		}

		setSentenceForm({
			original_id: selectedSentence.id,
			id: selectedSentence.id,
			text: selectedSentence.text ?? "",
			translation: selectedSentence.translation ?? "",
			lesson_id: selectedSentence.lesson_id ?? "lesson_1",
			level: selectedSentence.level ?? "",
			difficulty_score: selectedSentence.difficulty_score ?? 0,
			naturalness_score: selectedSentence.naturalness_score ?? 0,
			speech_speed:
				selectedSentence.speech_speed ?? DEFAULT_SENTENCE_SPEECH_SPEED,
			topic_tags: formatArrayInput(selectedSentence.topic_tags),
			grammar_tags: formatArrayInput(selectedSentence.grammar_tags),
			context_tags: formatContextTagsInput(selectedSentence.context_tags),
			language_code: selectedSentence.language_code ?? DEFAULT_LANGUAGE_CODE,
			status: selectedSentence.status ?? "draft",
			source: selectedSentence.source ?? "manual",
		});
		setSentenceBlocksForm(
			buildSentenceBlockRows(runtimeData.sentenceBlocks, selectedSentence.id),
		);
	}, [
		selectedSentenceId,
		runtimeData.sentences,
		runtimeData.sentenceBlocks,
		sentenceForm?.isNew,
	]);

	useEffect(() => {
		const selectedBlock =
			runtimeData.blocks.find((block) => block.id === selectedBlockId) ??
			null;

		if (!selectedBlock) {
			setBlockForm((prev) => (prev?.isNew ? prev : null));
			return;
		}

		setBlockForm((prev) => {
			const preservedPronunciationHint =
				prev?.id === selectedBlock.id || prev?.original_id === selectedBlock.id
					? prev.pronunciation_hint
					: "";
			const cachedPronunciationHint =
				pronunciationHintsByBlockRef.current[selectedBlock.id] ?? "";
			const generatedPronunciationHint =
				buildAdminPronunciationHint(selectedBlock);

			return {
				original_id: selectedBlock.id,
				id: selectedBlock.id,
				canonical_text: selectedBlock.canonical_text ?? "",
				core_meaning: selectedBlock.core_meaning ?? "",
				pronunciation_hint:
					selectedBlock.pronunciation_hint ||
					cachedPronunciationHint ||
					preservedPronunciationHint ||
					generatedPronunciationHint ||
					"",
				contextual_tip: selectedBlock.contextual_tip ?? "",
				block_type: selectedBlock.block_type ?? "word",
				tags: formatArrayInput(selectedBlock.tags),
				language_code: selectedBlock.language_code ?? DEFAULT_LANGUAGE_CODE,
			};
		});
	}, [
		selectedBlockId,
		runtimeData.blocks,
		blockForm?.isNew,
	]);

	async function handleSaveSentence() {
		if (!sentenceForm) {
			return;
		}

		setIsSavingSentence(true);
		setMessage("");

		try {
			const previousSpeechSpeed = Number(
				selectedSentenceRecord?.speech_speed ?? DEFAULT_SENTENCE_SPEECH_SPEED,
			);
			const nextSpeechSpeed = Number(
				sentenceForm.speech_speed ?? DEFAULT_SENTENCE_SPEECH_SPEED,
			);
			const shouldRegenerateAudio =
				!sentenceForm.isNew &&
				Boolean(selectedSentenceRecord?.audio_path) &&
				Math.abs(previousSpeechSpeed - nextSpeechSpeed) > 0.001;
			const payload = {
				...sentenceForm,
				topic_tags: parseArrayInput(sentenceForm.topic_tags),
				grammar_tags: parseArrayInput(sentenceForm.grammar_tags),
				context_tags: parseArrayInput(sentenceForm.context_tags),
			};
			const targetExternalId =
				sentenceForm.original_id ?? sentenceForm.id;
			const response = sentenceForm.isNew
				? await createSentence(payload)
				: await updateSentence(targetExternalId, payload);
			if (shouldRegenerateAudio) {
				await regenerateSentenceAudio(response?.data?.id ?? targetExternalId, {
					speech_speed: nextSpeechSpeed,
				});
			}
			await loadAdminData();
			if (response?.data?.id) {
				setSelectedSentenceId(response.data.id);
			}
			setMessage(
				shouldRegenerateAudio
					? "Frase atualizada e audio regenerado."
					: "Frase atualizada.",
			);
		} catch (error) {
			setMessage(error.message);
		} finally {
			setIsSavingSentence(false);
		}
	}

	async function handleSaveSentenceBlocks() {
		if (!sentenceForm) {
			return;
		}

		setIsSavingSentenceBlocks(true);
		setMessage("");

		try {
			await replaceSentenceBlocks(
				sentenceForm.id,
				sentenceBlocksForm.map((block, index) => ({
					id:
						block.id ||
						`${sentenceForm.id}_blk_${String(index + 1).padStart(3, "0")}`,
					block_id: block.block_id,
					surface: block.surface,
					contextual_gloss: block.contextual_gloss ?? "",
				})),
			);
			await loadAdminData();
			setMessage("Blocos da frase atualizados.");
		} catch (error) {
			setMessage(error.message);
		} finally {
			setIsSavingSentenceBlocks(false);
		}
	}

	async function handleSaveBlock() {
		if (!blockForm) {
			return;
		}

		setIsSavingBlock(true);
		setMessage("");

		try {
			const payload = {
				...blockForm,
				tags: parseArrayInput(blockForm.tags),
			};
			const targetExternalId =
				blockForm.original_id ?? blockForm.id;
			const response = blockForm.isNew
				? await createBlock(payload)
				: await updateBlock(targetExternalId, payload);
			const nextBlockId = response?.data?.id ?? blockForm.id;
			if (nextBlockId) {
				savePronunciationHintToCache(
					nextBlockId,
					blockForm.pronunciation_hint ?? "",
				);
			}
			await loadAdminData();
			if (response?.data?.id) {
				setSelectedBlockId(response.data.id);
			}
			setMessage("Bloco atualizado.");
		} catch (error) {
			setMessage(error.message);
		} finally {
			setIsSavingBlock(false);
		}
	}

	function handleCreateSentenceDraft() {
		const preservedTags = {
			topic_tags: sentenceForm?.topic_tags ?? "",
			grammar_tags: sentenceForm?.grammar_tags ?? "",
		};

		setView("sentences");
		setSelectedSentenceId(null);
		setSelectedBlockId(null);
		setBlockForm(null);
		setSentenceForm({
			isNew: true,
			original_id: "",
			id: "",
			text: "",
			translation: "",
			lesson_id: selectedDraftLesson,
			level: "A1",
			difficulty_score: 0.2,
			naturalness_score: 0.9,
			speech_speed: DEFAULT_SENTENCE_SPEECH_SPEED,
			context_tags: "",
			...preservedTags,
			language_code: selectedDraftLanguage,
			status: "draft",
			source: "manual",
		});
		setSentenceBlocksForm([]);
		setMessage("Preencha a nova frase e salve.");
	}

	function handleCreateBlockDraft() {
		setView("blocks");
		setSelectedBlockId(null);
		setSelectedSentenceId(null);
		setSentenceForm(null);
		setSentenceBlocksForm([]);
		setBlockForm({
			isNew: true,
			original_id: "",
			id: "",
			canonical_text: "",
			core_meaning: "",
			pronunciation_hint: "",
			contextual_tip: "",
			block_type: "word",
			tags: "",
			language_code: selectedDraftLanguage,
		});
		setMessage("Preencha o novo bloco e salve.");
	}

	function updateBlockFormField(key, value) {
		setBlockForm((prev) => ({
			...prev,
			[key]: value,
		}));

		if (key === "pronunciation_hint" && blockForm?.id) {
			savePronunciationHintToCache(blockForm.id, value);
		}
	}

	async function handleRegenerateSentenceAudio() {
		if (!sentenceForm?.id) {
			return;
		}

		setIsRegeneratingSentenceAudio(true);
		setMessage("");

		try {
			await regenerateSentenceAudio(sentenceForm.id, {
				speech_speed: sentenceForm.speech_speed,
			});
			await loadAdminData();
			setMessage("Audio da frase regenerado.");
		} catch (error) {
			setMessage(error.message);
		} finally {
			setIsRegeneratingSentenceAudio(false);
		}
	}

	async function handleRegenerateBlockAudio() {
		if (!blockForm?.id) {
			return;
		}

		setIsRegeneratingBlockAudio(true);
		setMessage("");

		try {
			await regenerateBlockAudio(blockForm.id);
			await loadAdminData();
			setMessage("Audio do bloco regenerado.");
		} catch (error) {
			setMessage(error.message);
		} finally {
			setIsRegeneratingBlockAudio(false);
		}
	}

	async function handleDuplicateSentence() {
		if (!sentenceForm?.id || sentenceForm.isNew) {
			return;
		}

		setIsDuplicatingSentence(true);
		setMessage("");

		try {
			const response = await duplicateSentence(sentenceForm.id);
			await loadAdminData();
			if (response?.data?.id) {
				setSelectedSentenceId(response.data.id);
			}
			setMessage("Frase duplicada.");
		} catch (error) {
			setMessage(error.message);
		} finally {
			setIsDuplicatingSentence(false);
		}
	}

	async function handleDeleteSentence() {
		if (!sentenceForm?.id || sentenceForm.isNew) {
			return;
		}

		const confirmed = window.confirm(
			`Excluir a frase ${sentenceForm.id}? Esta acao remove tambem os sentence_blocks ligados a ela.`,
		);

		if (!confirmed) {
			return;
		}

		setIsDeletingSentence(true);
		setMessage("");

		try {
			await deleteSentence(sentenceForm.id);
			await loadAdminData();
			setSelectedSentenceId(null);
			setSentenceForm(null);
			setSentenceBlocksForm([]);
			setMessage("Frase excluida.");
		} catch (error) {
			setMessage(error.message);
		} finally {
			setIsDeletingSentence(false);
		}
	}

	async function handleDeleteBlock() {
		if (!blockForm?.id || blockForm.isNew) {
			return;
		}

		const confirmed = window.confirm(
			`Excluir o bloco ${blockForm.id}? Ele tambem sera removido das frases que usam esse bloco.`,
		);

		if (!confirmed) {
			return;
		}

		setIsDeletingBlock(true);
		setMessage("");

		try {
			await deleteBlock(blockForm.id);
			await loadAdminData();
			setSelectedBlockId(null);
			setBlockForm(null);
			setMessage("Bloco excluido.");
		} catch (error) {
			setMessage(error.message);
		} finally {
			setIsDeletingBlock(false);
		}
	}

	function updateSentenceBlockRow(index, patch) {
		setSentenceBlocksForm((prevRows) =>
			prevRows.map((row, rowIndex) =>
				rowIndex === index ? { ...row, ...patch } : row,
			),
		);
	}

	function addSentenceBlockRow() {
		setSentenceBlocksForm((prevRows) => [
			...prevRows,
			{
				id: "",
				block_id: runtimeData.blocks[0]?.id ?? "",
				surface: "",
				contextual_gloss: "",
			},
		]);
	}

	function removeSentenceBlockRow(index) {
		setSentenceBlocksForm((prevRows) =>
			prevRows.filter((_, rowIndex) => rowIndex !== index),
		);
	}

	function moveSentenceBlockRow(fromIndex, toIndex) {
		if (
			fromIndex === toIndex ||
			fromIndex < 0 ||
			toIndex < 0 ||
			fromIndex >= sentenceBlocksForm.length ||
			toIndex >= sentenceBlocksForm.length
		) {
			return;
		}

		setSentenceBlocksForm((prevRows) => {
			const nextRows = [...prevRows];
			const [movedRow] = nextRows.splice(fromIndex, 1);
			nextRows.splice(toIndex, 0, movedRow);
			return nextRows;
		});
	}

	return (
		<div className="min-h-screen bg-[#050917] px-6 py-6 text-white">
			<div className="mx-auto max-w-7xl">
				<div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 px-6 py-5">
					<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
						<div>
							<p className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">
								Admin interno
							</p>
							<h1 className="mt-2 text-3xl font-semibold">Conteudo</h1>
						</div>

						<div className="flex flex-wrap items-center gap-3">
							<Button
								type="button"
								onClick={handleCreateSentenceDraft}
								className="cursor-pointer rounded-2xl bg-cyan-400 text-slate-950 hover:bg-cyan-300"
							>
								<Plus className="mr-2 size-4" />
								Nova frase
							</Button>
							<Button
								type="button"
								onClick={handleCreateBlockDraft}
								className="cursor-pointer rounded-2xl bg-white/10 text-white hover:bg-white/15"
							>
								<Plus className="mr-2 size-4" />
								Novo bloco
							</Button>
							<Button
								type="button"
								onClick={() => loadAdminData()}
								className="cursor-pointer rounded-2xl bg-white/10 text-white hover:bg-white/15"
							>
								<RefreshCw className="mr-2 size-4" />
								Atualizar
							</Button>
							<a
								href="#study"
								className="inline-flex h-10 items-center rounded-2xl border border-white/10 px-4 text-sm text-white/80 hover:bg-white/10"
							>
								<ArrowLeftRight className="mr-2 size-4" />
								Voltar ao estudo
							</a>
						</div>
					</div>

					<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
						<div className="flex gap-2">
							<Button
								type="button"
								onClick={() => setView("sentences")}
								className={`cursor-pointer rounded-2xl px-4 ${
									view === "sentences"
										? "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
										: "bg-white/10 text-white hover:bg-white/15"
								}`}
							>
								Frases
							</Button>
							<Button
								type="button"
								onClick={() => setView("blocks")}
								className={`cursor-pointer rounded-2xl px-4 ${
									view === "blocks"
										? "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
										: "bg-white/10 text-white hover:bg-white/15"
								}`}
							>
								Blocos
							</Button>
						</div>

						<input
							type="text"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Buscar por id, frase, traducao..."
							className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white placeholder:text-white/30 md:max-w-md"
						/>
					</div>

						<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
						<div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
							<select
								value={levelFilter}
								onChange={(event) => setLevelFilter(event.target.value)}
								className="h-11 min-w-0 appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 pr-10 text-white sm:min-w-44"
							>
								<option value="all">Todos os niveis</option>
								{levelOptions.map((level) => (
									<option key={level} value={level}>
										{level}
									</option>
								))}
							</select>

							<select
								value={languageFilter}
								onChange={(event) => {
									setLanguageFilter(event.target.value);
									setLessonFilter("all");
								}}
								className="h-11 min-w-0 appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 pr-10 text-white sm:min-w-44"
							>
								<option value="all">Todos os idiomas</option>
								{languageOptions.map((languageCode) => (
									<option key={languageCode} value={languageCode}>
										{formatLanguageLabel(languageCode)}
									</option>
								))}
							</select>

							{view === "sentences" ? (
								<select
									value={lessonFilter}
									onChange={(event) => setLessonFilter(event.target.value)}
									className="h-11 min-w-0 appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 pr-10 text-white sm:min-w-44"
								>
									<option value="all">Todas as licoes</option>
									{lessonOptions.map((lessonId) => (
										<option key={lessonId} value={lessonId}>
											{formatLessonLabel(lessonId)}
										</option>
									))}
								</select>
							) : null}

							<select
								value={audioStatusFilter}
								onChange={(event) => setAudioStatusFilter(event.target.value)}
								className="h-11 min-w-0 appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 pr-10 text-white sm:min-w-52"
							>
								<option value="all">Todo status de audio</option>
								{audioStatusOptions.map((status) => (
									<option key={status} value={status}>
										{status}
									</option>
								))}
							</select>
						</div>

						<p className="shrink-0 text-sm text-white/45">
							{visibleItems.length} resultado(s)
						</p>
					</div>

					{view === "sentences" ? (
						<div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
							<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
								<div>
									<p className="text-xs uppercase tracking-[0.18em] text-white/40">
										Licoes por idioma
									</p>
									<p className="mt-1 text-sm text-white/35">
										Filtre rapidamente por idioma ou por uma licao especifica.
									</p>
								</div>
								<button
									type="button"
									onClick={() => {
										setLanguageFilter("all");
										setLessonFilter("all");
									}}
									className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition ${
										languageFilter === "all" && lessonFilter === "all"
											? "border-cyan-300/70 bg-cyan-400/10 text-cyan-100"
											: "border-white/10 bg-white/5 text-white/55 hover:bg-white/10"
									}`}
								>
									Todos os idiomas
								</button>
							</div>

							<div className="overflow-hidden rounded-2xl border border-white/8 bg-black/15">
								{populatedLanguageLessonGroups.map(
									({ languageCode, count, lessons }, index) => (
										<div
											key={languageCode}
											className={`grid gap-3 p-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center ${
												index > 0 ? "border-t border-white/8" : ""
											}`}
										>
											<button
												type="button"
												onClick={() => {
													setLanguageFilter(languageCode);
													setLessonFilter("all");
												}}
												className={`flex min-h-14 w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left transition ${
													languageFilter === languageCode &&
													lessonFilter === "all"
														? "bg-cyan-400/10 text-cyan-100"
														: "text-white hover:bg-white/8"
												}`}
											>
												<span>
													<span className="block font-medium">
														{formatLanguageLabel(languageCode)}
													</span>
													<span className="mt-0.5 block text-xs text-white/45">
														{count} frase(s)
													</span>
												</span>
											</button>

											<div className="flex flex-wrap gap-2">
												{lessons.map(({ lessonId, count: lessonCount }) => (
													<button
														key={lessonId}
														type="button"
														onClick={() => {
															setLanguageFilter(languageCode);
															setLessonFilter(lessonId);
														}}
														className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs transition ${
															languageFilter === languageCode &&
															lessonFilter === lessonId
																? "border-cyan-300/70 bg-cyan-400/10 text-cyan-100"
																: "border-white/10 bg-white/5 text-white/55 hover:bg-white/10"
														}`}
													>
														<span>{formatLessonLabel(lessonId)}</span>
														<span className="text-white/40">·</span>
														<span>{lessonCount}</span>
													</button>
												))}
											</div>
										</div>
									),
								)}
							</div>

							{emptyLanguageLessonGroups.length > 0 ? (
								<div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/10 p-3">
									<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
										<p className="shrink-0 text-xs uppercase tracking-[0.14em] text-white/35">
											Sem licoes ainda
										</p>
										<div className="flex flex-wrap gap-2">
										{emptyLanguageLessonGroups.map(({ languageCode }) => (
											<button
												key={languageCode}
												type="button"
												onClick={() => {
													setLanguageFilter(languageCode);
													setLessonFilter("all");
												}}
												className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs transition ${
													languageFilter === languageCode &&
													lessonFilter === "all"
														? "border-cyan-300/70 bg-cyan-400/10 text-cyan-100"
														: "border-white/10 bg-white/5 text-white/45 hover:bg-white/10 hover:text-white/70"
												}`}
											>
												{formatLanguageLabel(languageCode)}
											</button>
										))}
										</div>
									</div>
								</div>
							) : null}
						</div>
					) : null}

					{message ? (
						<p className="text-sm text-cyan-100/85">{message}</p>
					) : null}
				</div>

				<div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
					<div className="rounded-[2rem] border border-white/10 bg-white/5 p-4">
						<p className="mb-3 text-xs uppercase tracking-[0.18em] text-white/40">
							{view === "sentences" ? "Frases" : "Blocos"}
						</p>

						<div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
							{isLoading ? <p className="text-white/60">Carregando...</p> : null}

							{view === "sentences"
								? paginatedSentenceGroups.map((group) => (
										<div key={group.key} className="space-y-2">
											<div className="sticky top-0 z-10 rounded-xl border border-white/8 bg-[#111827] px-3 py-2 text-xs uppercase tracking-[0.14em] text-white/45">
												{formatLanguageLabel(group.languageCode)} ·{" "}
												{formatLessonLabel(group.lessonId)}
											</div>
											{group.items.map((sentence) => (
												<button
													key={sentence.id}
													type="button"
													onClick={() => setSelectedSentenceId(sentence.id)}
													className={`w-full cursor-pointer rounded-2xl border px-4 py-3 text-left transition ${
														selectedSentenceId === sentence.id
															? "border-cyan-300/70 bg-cyan-400/10"
															: "border-white/8 bg-black/10 hover:bg-white/8"
													}`}
												>
													<p className="text-xs uppercase tracking-[0.12em] text-white/35">
														{sentence.id}
													</p>
													<p className="mt-1 text-sm font-medium text-white">
														{sentence.text}
													</p>
													<div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/40">
														<span>{sentence.level || "sem nivel"}</span>
														<span>•</span>
														<span>{getAudioStateLabel(sentence)}</span>
													</div>
												</button>
											))}
										</div>
									))
								: paginatedBlockGroups.map((group) => (
										<div key={group.languageCode} className="space-y-2">
											<div className="sticky top-0 z-10 rounded-xl border border-white/8 bg-[#111827] px-3 py-2 text-xs uppercase tracking-[0.14em] text-white/45">
												{formatLanguageLabel(group.languageCode)}
											</div>
											{group.items.map((block) => (
												<button
													key={block.id}
													type="button"
													onClick={() => setSelectedBlockId(block.id)}
													className={`w-full cursor-pointer rounded-2xl border px-4 py-3 text-left transition ${
														selectedBlockId === block.id
															? "border-cyan-300/70 bg-cyan-400/10"
															: "border-white/8 bg-black/10 hover:bg-white/8"
													}`}
												>
													<p className="text-xs uppercase tracking-[0.12em] text-white/35">
														{block.id}
													</p>
													<p className="mt-1 text-sm font-medium text-white">
														{block.canonical_text}
													</p>
													<p className="mt-1 text-xs text-white/40">
														{block.block_type || "sem tipo"} •{" "}
														{getAudioStateLabel(block)}
													</p>
												</button>
											))}
										</div>
									))}
						</div>

						<div className="mt-4 flex items-center justify-between gap-3">
							<Button
								type="button"
								onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
								disabled={currentPage === 1}
								className="cursor-pointer rounded-2xl bg-white/10 text-white hover:bg-white/15"
							>
								Anterior
							</Button>
							<span className="text-sm text-white/55">
								Pagina {currentPage} de {totalPages}
							</span>
							<Button
								type="button"
								onClick={() =>
									setCurrentPage((prev) => Math.min(totalPages, prev + 1))
								}
								disabled={currentPage === totalPages}
								className="cursor-pointer rounded-2xl bg-white/10 text-white hover:bg-white/15"
							>
								Proxima
							</Button>
						</div>
					</div>

					{view === "sentences" ? (
						<div className="space-y-6">
							<div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
								<div className="mb-4 flex items-center justify-between">
								<div>
									<p className="text-xs uppercase tracking-[0.18em] text-white/40">
										Frase
									</p>
									<p className="mt-1 text-lg font-semibold text-white">
										{sentenceForm?.id || "Nova frase / selecione uma frase"}
									</p>
									<p className="mt-1 text-sm text-white/50">
										Audio:{" "}
										{getAudioStateLabel(selectedSentenceRecord)}
									</p>
								</div>
								<div className="flex flex-wrap gap-2">
									<Button
										type="button"
										onClick={handleDuplicateSentence}
										disabled={!sentenceForm || sentenceForm.isNew || isDuplicatingSentence}
										className="cursor-pointer rounded-2xl bg-white/10 px-4 text-white hover:bg-white/15"
									>
										<Copy className="mr-2 size-4" />
										{isDuplicatingSentence ? "Duplicando..." : "Duplicar"}
									</Button>
									<Button
										type="button"
										onClick={handleRegenerateSentenceAudio}
										disabled={!sentenceForm || isRegeneratingSentenceAudio}
										className="cursor-pointer rounded-2xl bg-white/10 px-4 text-white hover:bg-white/15"
									>
										<Volume2 className="mr-2 size-4" />
										{isRegeneratingSentenceAudio
											? "Gerando..."
											: "Gerar audio"}
									</Button>
									<Button
										type="button"
										onClick={handleSaveSentence}
										disabled={!sentenceForm || isSavingSentence}
										className="cursor-pointer rounded-2xl bg-cyan-400 px-4 text-slate-950 hover:bg-cyan-300"
									>
										<Save className="mr-2 size-4" />
										{isSavingSentence ? "Salvando..." : "Salvar frase"}
									</Button>
									<Button
										type="button"
										onClick={handleDeleteSentence}
										disabled={!sentenceForm || sentenceForm.isNew || isDeletingSentence}
										className="cursor-pointer rounded-2xl bg-red-400/15 px-4 text-red-100 hover:bg-red-400/20"
									>
										<Trash2 className="mr-2 size-4" />
										{isDeletingSentence ? "Excluindo..." : "Excluir"}
									</Button>
								</div>
								</div>

								{sentenceForm ? (
									<div className="grid gap-4 md:grid-cols-2">
										{sentenceAudioUrl ? (
											<div className="md:col-span-2">
												<p className="mb-2 text-xs uppercase tracking-[0.14em] text-white/40">
													Preview do audio
												</p>
												<audio
													key={sentenceAudioUrl}
													controls
													preload="none"
													className="w-full"
												>
													<source src={sentenceAudioUrl} type="audio/mpeg" />
												</audio>
											</div>
										) : null}
										<label className="space-y-2 md:col-span-2">
											<span className="text-xs uppercase tracking-[0.14em] text-white/40">
												Frase
											</span>
											<textarea
												value={sentenceForm.text}
												onChange={(event) =>
													setSentenceForm((prev) => ({
														...prev,
														text: event.target.value,
													}))
												}
												className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
											/>
										</label>

										<label className="space-y-2 md:col-span-2">
											<span className="text-xs uppercase tracking-[0.14em] text-white/40">
												Traducao
											</span>
											<textarea
												value={sentenceForm.translation}
												onChange={(event) =>
													setSentenceForm((prev) => ({
														...prev,
														translation: event.target.value,
													}))
												}
												className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
											/>
										</label>

										{[
											["id", "ID"],
											["level", "Nivel"],
										].map(([key, label]) => (
											<label key={key} className="space-y-2">
												<span className="text-xs uppercase tracking-[0.14em] text-white/40">
													{label}
												</span>
												<input
													value={sentenceForm[key]}
													onChange={(event) =>
														setSentenceForm((prev) => ({
															...prev,
															[key]: event.target.value,
														}))
													}
													placeholder={
														key === "id" && sentenceForm.isNew
															? "Gerado automaticamente ao salvar"
															: undefined
													}
													className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4"
												/>
											</label>
										))}

										<label className="space-y-2">
											<span className="text-xs uppercase tracking-[0.14em] text-white/40">
												Idioma
											</span>
											<select
												value={sentenceForm.language_code ?? DEFAULT_LANGUAGE_CODE}
												onChange={(event) =>
													setSentenceForm((prev) => ({
														...prev,
														language_code: event.target.value,
														lesson_id: DEFAULT_LESSON_ID,
													}))
												}
												className="h-11 w-full appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 text-white"
											>
												{languageOptions.map((languageCode) => (
													<option key={languageCode} value={languageCode}>
														{formatLanguageLabel(languageCode)}
													</option>
												))}
											</select>
										</label>

										<label className="space-y-2">
											<span className="text-xs uppercase tracking-[0.14em] text-white/40">
												Licao
											</span>
											<input
												value={sentenceForm.lesson_id ?? DEFAULT_LESSON_ID}
												list="admin-lesson-options"
												onChange={(event) =>
													setSentenceForm((prev) => ({
														...prev,
														lesson_id: event.target.value,
													}))
												}
												placeholder="lesson_4"
												className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white placeholder:text-white/30"
											/>
											<datalist id="admin-lesson-options">
												{sentenceFormLessonOptions.map((lessonId) => (
													<option key={lessonId} value={lessonId}>
														{formatLessonLabel(lessonId)}
													</option>
												))}
											</datalist>
										</label>

										<div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:col-span-2">
											<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
												<div>
													<p className="text-xs uppercase tracking-[0.14em] text-white/40">
														Velocidade da frase
													</p>
													<p className="mt-1 text-sm text-white/45">
														Use valores menores para áudio mais lento e claro.
													</p>
												</div>
												<span className="rounded-full border border-[#8b6cf4]/35 bg-[#8b6cf4]/12 px-3 py-1 text-sm font-semibold text-[#c8bbff]">
													{formatSpeechSpeed(sentenceForm.speech_speed)}x
												</span>
											</div>
											<input
												type="range"
												min={MIN_SENTENCE_SPEECH_SPEED}
												max={MAX_SENTENCE_SPEECH_SPEED}
												step="0.05"
												value={
													sentenceForm.speech_speed ??
													DEFAULT_SENTENCE_SPEECH_SPEED
												}
												onChange={(event) =>
													setSentenceForm((prev) => ({
														...prev,
														speech_speed: Number(event.target.value),
													}))
												}
												className="w-full accent-[#8b6cf4]"
											/>
											<div className="flex justify-between text-xs text-white/35">
												<span>0.70x</span>
												<span>1.00x normal</span>
												<span>1.20x</span>
											</div>
										</div>

										<label className="space-y-2 md:col-span-2">
											<span className="text-xs uppercase tracking-[0.14em] text-white/40">
												Topic tags
											</span>
											<input
												value={sentenceForm.topic_tags}
												onChange={(event) =>
													setSentenceForm((prev) => ({
														...prev,
														topic_tags: event.target.value,
													}))
												}
												className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4"
											/>
										</label>

										<label className="space-y-2 md:col-span-2">
											<span className="text-xs uppercase tracking-[0.14em] text-white/40">
												Grammar tags
											</span>
											<input
												value={sentenceForm.grammar_tags}
												onChange={(event) =>
													setSentenceForm((prev) => ({
														...prev,
														grammar_tags: event.target.value,
													}))
												}
												className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4"
											/>
										</label>
									</div>
								) : null}
							</div>

							<div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
								<div className="mb-4 flex items-center justify-between">
									<div>
										<p className="text-xs uppercase tracking-[0.18em] text-white/40">
											Blocos da frase
										</p>
										<p className="mt-1 text-sm text-white/65">
											Arraste para reordenar ou use as setas. Edite o bloco base,
											o surface e o gloss contextual.
										</p>
									</div>

									<div className="flex gap-2">
										<Button
											type="button"
											onClick={addSentenceBlockRow}
											className="cursor-pointer rounded-2xl bg-white/10 text-white hover:bg-white/15"
										>
											<Plus className="mr-2 size-4" />
											Adicionar
										</Button>
										<Button
											type="button"
											onClick={handleSaveSentenceBlocks}
											disabled={!sentenceForm || isSavingSentenceBlocks}
											className="cursor-pointer rounded-2xl bg-cyan-400 text-slate-950 hover:bg-cyan-300"
										>
											<Save className="mr-2 size-4" />
											{isSavingSentenceBlocks ? "Salvando..." : "Salvar blocos"}
										</Button>
									</div>
								</div>

								<div className="space-y-3">
									<datalist id="admin-block-suggestions">
										{sentenceBlockSuggestions.map((item) => (
											<option key={item.id} value={item.id}>
												{item.canonical_text}
											</option>
										))}
									</datalist>

									{sentenceBlocksForm.map((block, index) => (
										<div
											key={`${block.id || "new"}-${index}`}
											draggable
											onDragStart={() => setDraggedSentenceBlockIndex(index)}
											onDragOver={(event) => event.preventDefault()}
											onDrop={() => {
												if (draggedSentenceBlockIndex === null) {
													return;
												}

												moveSentenceBlockRow(draggedSentenceBlockIndex, index);
												setDraggedSentenceBlockIndex(null);
											}}
											onDragEnd={() => setDraggedSentenceBlockIndex(null)}
											className={`grid gap-3 rounded-2xl border border-white/8 bg-black/10 p-4 md:grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.7fr)_auto] ${
												draggedSentenceBlockIndex === index
													? "opacity-60 ring-1 ring-cyan-300/40"
													: ""
											}`}
										>
											<div className="flex items-center gap-1">
												<button
													type="button"
													draggable={false}
													onClick={() => moveSentenceBlockRow(index, index - 1)}
													disabled={index === 0}
													className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
												>
													<ChevronUp className="size-4" />
												</button>
												<button
													type="button"
													draggable={false}
													onClick={() => moveSentenceBlockRow(index, index + 1)}
													disabled={index === sentenceBlocksForm.length - 1}
													className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
												>
													<ChevronDown className="size-4" />
												</button>
												<div className="cursor-grab rounded-xl border border-white/10 bg-white/5 p-2 text-white/60 active:cursor-grabbing">
													<GripVertical className="size-4" />
												</div>
											</div>
											<div className="space-y-2">
												<input
													list="admin-block-suggestions"
													value={block.block_id}
													onChange={(event) =>
														updateSentenceBlockRow(index, {
															block_id: event.target.value,
														})
													}
													placeholder="blk_x ou escolha existente"
													className="h-11 w-full min-w-0 rounded-2xl border border-white/10 bg-black/20 px-3"
												/>
											</div>
											<input
												value={block.surface}
												onChange={(event) =>
													updateSentenceBlockRow(index, {
														surface: event.target.value,
													})
												}
												placeholder="surface"
												className="h-11 min-w-0 rounded-2xl border border-white/10 bg-black/20 px-3"
											/>
											<input
												value={block.contextual_gloss ?? ""}
												onChange={(event) =>
													updateSentenceBlockRow(index, {
														contextual_gloss: event.target.value,
													})
												}
												placeholder="gloss contextual"
												className="h-11 min-w-0 rounded-2xl border border-white/10 bg-black/20 px-3"
											/>
											<Button
												type="button"
												size="icon"
												onClick={() => removeSentenceBlockRow(index)}
												className="size-11 cursor-pointer rounded-2xl bg-red-400/15 text-red-100 hover:bg-red-400/20"
											>
												<Trash2 className="size-4" />
											</Button>
										</div>
									))}
								</div>
								<p className="mt-3 text-sm text-white/45">
									Se o `block_id` nao existir em `blocks`, ele sera criado
									automaticamente usando `surface` como canonical e `contextual_gloss`
									como gloss inicial.
								</p>
							</div>
						</div>
					) : (
						<div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
							<div className="mb-4 flex items-center justify-between">
								<div>
									<p className="text-xs uppercase tracking-[0.18em] text-white/40">
										Bloco base
									</p>
									<p className="mt-1 text-lg font-semibold text-white">
										{blockForm?.id || "Novo bloco / selecione um bloco"}
									</p>
									<p className="mt-1 text-sm text-white/50">
										Audio:{" "}
										{getAudioStateLabel(selectedBlockRecord)}
									</p>
								</div>
								<div className="flex flex-wrap gap-2">
									<Button
										type="button"
										onClick={handleRegenerateBlockAudio}
										disabled={!blockForm || isRegeneratingBlockAudio}
										className="cursor-pointer rounded-2xl bg-white/10 px-4 text-white hover:bg-white/15"
									>
										<Volume2 className="mr-2 size-4" />
										{isRegeneratingBlockAudio
											? "Gerando..."
											: "Gerar audio"}
									</Button>
									<Button
										type="button"
										onClick={handleSaveBlock}
										disabled={!blockForm || isSavingBlock}
										className="cursor-pointer rounded-2xl bg-cyan-400 px-4 text-slate-950 hover:bg-cyan-300"
									>
										<Save className="mr-2 size-4" />
										{isSavingBlock ? "Salvando..." : "Salvar bloco"}
									</Button>
									<Button
										type="button"
										onClick={handleDeleteBlock}
										disabled={!blockForm || blockForm.isNew || isDeletingBlock}
										size="icon"
										className="size-11 cursor-pointer rounded-2xl bg-red-400/15 text-red-100 hover:bg-red-400/20"
									>
										<Trash2 className="size-4" />
									</Button>
								</div>
							</div>

							{blockForm ? (
								<div className="grid gap-4 md:grid-cols-2">
									{blockAudioUrl ? (
										<div className="md:col-span-2">
											<p className="mb-2 text-xs uppercase tracking-[0.14em] text-white/40">
												Preview do audio
											</p>
											<audio
												key={blockAudioUrl}
												controls
												preload="none"
												className="w-full"
											>
												<source src={blockAudioUrl} type="audio/mpeg" />
											</audio>
										</div>
									) : null}
									{[
										["id", "ID"],
										["canonical_text", "Canonical"],
										["core_meaning", "Core meaning"],
										["pronunciation_hint", "Dica de pronuncia"],
										["block_type", "Block type"],
									].map(([key, label]) => (
										<label key={key} className="space-y-2">
											<span className="text-xs uppercase tracking-[0.14em] text-white/40">
												{label}
											</span>
											<input
												value={blockForm[key]}
												onChange={(event) =>
													updateBlockFormField(key, event.target.value)
												}
												className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4"
											/>
										</label>
									))}

									<label className="space-y-2">
										<span className="text-xs uppercase tracking-[0.14em] text-white/40">
											Idioma
										</span>
										<select
											value={blockForm.language_code ?? DEFAULT_LANGUAGE_CODE}
											onChange={(event) =>
												updateBlockFormField("language_code", event.target.value)
											}
											className="h-11 w-full appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 text-white"
										>
											{languageOptions.map((languageCode) => (
												<option key={languageCode} value={languageCode}>
													{formatLanguageLabel(languageCode)}
												</option>
											))}
										</select>
									</label>

									<label className="space-y-2 md:col-span-2">
										<span className="text-xs uppercase tracking-[0.14em] text-white/40">
											Dica contextual
										</span>
										<textarea
											value={blockForm.contextual_tip}
											onChange={(event) =>
												updateBlockFormField(
													"contextual_tip",
													event.target.value,
												)
											}
											rows={3}
											placeholder="Aparece no card do bloco quando preenchida."
											className="min-h-24 w-full resize-y rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
										/>
									</label>

									<label className="space-y-2 md:col-span-2">
										<span className="text-xs uppercase tracking-[0.14em] text-white/40">
											Tags
										</span>
										<input
											value={blockForm.tags}
											onChange={(event) =>
												setBlockForm((prev) => ({
													...prev,
													tags: event.target.value,
												}))
											}
											className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4"
										/>
									</label>
								</div>
							) : null}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default AdminScreen;
