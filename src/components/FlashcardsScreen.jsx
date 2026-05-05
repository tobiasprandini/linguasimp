import { useEffect, useRef, useState } from "react";
import { CalendarDays, Check, Clock3, RotateCcw, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import AppHeader from "./AppHeader";
import { buildPronunciationHint } from "../lib/buildPronunciationHint";

const languageLabels = {
	en: "Inglês",
	es: "Espanhol",
	fr: "Francês",
	de: "Alemão",
	it: "Italiano",
	ru: "Russo",
	no: "Norueguês",
	el: "Grego",
	zh: "Chinês",
	ja: "Japonês",
};
const FLASHCARD_SCHEDULE_STORAGE_KEY_PREFIX = "linguasimp-flashcard-schedule";
const REVIEW_DELAYS = {
	again: 0,
	hard: 10 * 60 * 1000,
	good: 24 * 60 * 60 * 1000,
	easy: 3 * 24 * 60 * 60 * 1000,
};
const MotionPath = motion.path;

function clampPercentage(value) {
	return Math.min(Math.max(value, 0), 100);
}

function ReviewProgressGauge({ value }) {
	const progress = clampPercentage(value);
	const arcPath = "M 38 120 A 82 82 0 0 1 202 120";
	const [displayProgress, setDisplayProgress] = useState(0);

	useEffect(() => {
		setDisplayProgress(0);

		if (progress <= 0) {
			return;
		}

		let frameId;
		let startTime;
		const duration = 900;

		function tick(timestamp) {
			startTime ??= timestamp;
			const elapsedProgress = Math.min((timestamp - startTime) / duration, 1);
			const easedProgress = 1 - (1 - elapsedProgress) ** 3;

			setDisplayProgress(Math.round(progress * easedProgress));

			if (elapsedProgress < 1) {
				frameId = window.requestAnimationFrame(tick);
			}
		}

		frameId = window.requestAnimationFrame(tick);

		return () => {
			if (frameId) {
				window.cancelAnimationFrame(frameId);
			}
		};
	}, [progress]);

	return (
		<div className="relative mx-auto -mt-1 h-40 w-full max-w-[19rem]">
			<svg
				viewBox="0 0 240 145"
				className="h-full w-full overflow-visible"
				aria-hidden="true"
			>
				<defs>
					<pattern
						id="review-pending-stripes"
						width="8"
						height="8"
						patternUnits="userSpaceOnUse"
						patternTransform="rotate(45)"
					>
						<rect width="3" height="8" fill="#141015" opacity="0.24" />
					</pattern>
				</defs>
				<path
					d={arcPath}
					fill="none"
					stroke="url(#review-pending-stripes)"
					strokeLinecap="round"
					strokeWidth="28"
					pathLength="100"
				/>
				{progress > 0 ? (
					<MotionPath
						d={arcPath}
						fill="none"
						stroke="#24885b"
						strokeLinecap="round"
						strokeWidth="28"
						pathLength="100"
						initial={{ strokeDasharray: "0 100" }}
						animate={{ strokeDasharray: `${progress} 100` }}
						transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
					/>
				) : null}
			</svg>
			<div className="absolute inset-x-0 bottom-0 text-center">
				<p className="text-6xl font-semibold leading-none tabular-nums">
					{displayProgress}%
				</p>
			</div>
		</div>
	);
}

function getFlashcardScheduleStorageKey(languageCode) {
	return `${FLASHCARD_SCHEDULE_STORAGE_KEY_PREFIX}:${languageCode}`;
}

function loadStoredSchedule(languageCode) {
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

function persistStoredSchedule(languageCode, schedule) {
	if (typeof window === "undefined") {
		return;
	}

	window.localStorage.setItem(
		getFlashcardScheduleStorageKey(languageCode),
		JSON.stringify(schedule),
	);
}

function buildDueQueue(cards, schedule, now = Date.now()) {
	return cards.filter((card) => {
		const nextReviewAt = schedule[card.block.blockId] ?? 0;
		return nextReviewAt <= now;
	});
}

function excludeRetryCards(queue, retryBlockIds) {
	return queue.filter((card) => !retryBlockIds.has(card.block.blockId));
}

function FlashcardFront({ card }) {
	return (
		<div className="flex flex-wrap justify-center gap-x-2 gap-y-3 text-center text-[1.75rem] leading-tight text-slate-100 sm:text-[2.25rem]">
			{card.sentenceBlocks.map((block) =>
				block.id === card.block.id ? (
					<span key={block.id} className="text-[#b8a6ff]">
						({block.contextualMeaning || block.contextualGloss || block.gloss})
					</span>
				) : (
					<span key={block.id}>{block.surface}</span>
				),
			)}
		</div>
	);
}

function FlashcardBack({ card, onPlayAudio }) {
	const pronunciation = buildPronunciationHint(card.block);

	return (
		<div className="flex flex-col items-center text-center">
			<div className="flex items-center justify-center gap-4">
				<h2 className="text-[2.35rem] font-semibold leading-tight text-white sm:text-[3rem]">
					{card.block.surface}
				</h2>
				<button
					type="button"
					onClick={(event) => {
						event.stopPropagation();
						onPlayAudio(card.block);
					}}
					disabled={!card.block.audio}
					className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
					aria-label={`Ouvir ${card.block.surface}`}
				>
					<Volume2 className="size-5 stroke-[2]" />
				</button>
			</div>
			{pronunciation ? (
				<p className="mt-5 text-base font-normal leading-tight text-[#778191] sm:text-lg">
					<span className="text-[#5f6878]">soa como </span>
					<span className="italic">{pronunciation}</span>
				</p>
			) : null}
		</div>
	);
}

function FlashcardsScreen({
	cards,
	onPlayBlockAudio,
	onRecordActivity,
	learningLanguage = "en",
	user,
	onSelectLanguage,
	onSignOut,
}) {
	const [isFlipped, setIsFlipped] = useState(false);
	const [schedule, setSchedule] = useState(() =>
		loadStoredSchedule(learningLanguage),
	);
	const [reviewQueue, setReviewQueue] = useState(() =>
		buildDueQueue(cards, loadStoredSchedule(learningLanguage)),
	);
	const [retryQueue, setRetryQueue] = useState([]);
	const retryBlockIdsRef = useRef(new Set());
	const previousLanguageRef = useRef(learningLanguage);
	const currentCard = reviewQueue[0] ?? retryQueue[0] ?? null;
	const isReviewingRetryCard = reviewQueue.length === 0 && retryQueue.length > 0;
	const activeReviewCount = reviewQueue.length + retryQueue.length;
	const pendingCount = Math.max(cards.length - activeReviewCount, 0);
	const scheduledPercent =
		cards.length > 0 ? Math.round((pendingCount / cards.length) * 100) : 0;

	useEffect(() => {
		const timerId = window.setTimeout(() => {
			if (previousLanguageRef.current !== learningLanguage) {
				retryBlockIdsRef.current = new Set();
				setRetryQueue([]);
				previousLanguageRef.current = learningLanguage;
			}

			const nextSchedule = loadStoredSchedule(learningLanguage);
			const dueQueue = buildDueQueue(cards, nextSchedule);
			setSchedule(nextSchedule);
			setReviewQueue(excludeRetryCards(dueQueue, retryBlockIdsRef.current));
			setRetryQueue((queue) => {
				const queuedRetryIds = new Set(
					queue.map((card) => card.block.blockId),
				);
				const refreshedQueue = queue
					.map(
						(card) =>
							cards.find(
								(nextCard) =>
									nextCard.block.blockId === card.block.blockId,
							) ?? card,
					)
					.filter((card) => retryBlockIdsRef.current.has(card.block.blockId));
				const missingRetryCards = dueQueue.filter(
					(card) =>
						retryBlockIdsRef.current.has(card.block.blockId) &&
						!queuedRetryIds.has(card.block.blockId),
				);

				return [...refreshedQueue, ...missingRetryCards];
			});
			setIsFlipped(false);
		}, 0);

		return () => window.clearTimeout(timerId);
	}, [cards, learningLanguage]);

	useEffect(() => {
		if (activeReviewCount > 0 || cards.length === 0) {
			return;
		}

		const now = Date.now();
		const nextDueAt = Math.min(
			...cards
				.map((card) => schedule[card.block.blockId])
				.filter((dueAt) => dueAt && dueAt > now),
		);

		if (!Number.isFinite(nextDueAt)) {
			return;
		}

		const timerId = window.setTimeout(() => {
			setReviewQueue(
				excludeRetryCards(buildDueQueue(cards, schedule), retryBlockIdsRef.current),
			);
		}, nextDueAt - now + 100);

		return () => window.clearTimeout(timerId);
	}, [activeReviewCount, cards, schedule]);

	useEffect(() => {
		if (!isFlipped || !currentCard?.block?.audio) {
			return;
		}

		onPlayBlockAudio(currentCard.block);
	}, [currentCard, isFlipped, onPlayBlockAudio]);

	function handleReviewAnswer(answer) {
		if (!currentCard) {
			return;
		}

		if (answer === "again") {
			const currentBlockId = currentCard.block.blockId;
			onRecordActivity?.();
			if (isReviewingRetryCard) {
				setRetryQueue((queue) =>
					queue.length <= 1 ? queue : [...queue.slice(1), queue[0]],
				);
			} else {
				retryBlockIdsRef.current.add(currentBlockId);
				setReviewQueue((queue) => queue.slice(1));
				setRetryQueue((queue) =>
					queue.some((card) => card.block.blockId === currentBlockId)
						? queue
						: [...queue, currentCard],
				);
			}
			setIsFlipped(false);
			return;
		}

		const nextReviewAt = Date.now() + REVIEW_DELAYS[answer];
		const nextSchedule = {
			...schedule,
			[currentCard.block.blockId]: nextReviewAt,
		};

		setSchedule(nextSchedule);
		persistStoredSchedule(learningLanguage, nextSchedule);
		onRecordActivity?.();
		retryBlockIdsRef.current.delete(currentCard.block.blockId);
		if (isReviewingRetryCard) {
			setRetryQueue((queue) => queue.slice(1));
		} else {
			setReviewQueue((queue) => queue.slice(1));
		}
		setIsFlipped(false);
	}

	return (
		<div className="min-h-screen bg-[#08090d] text-white">
			<header className="p-4 sm:p-6 lg:p-8">
				<div className="w-full">
					<AppHeader
						user={user}
						activePage="flashcards"
						learningLanguage={learningLanguage}
						onSelectLanguage={onSelectLanguage}
						onSignOut={onSignOut}
					/>
				</div>
			</header>

			<main className="mx-auto grid min-h-[calc(100svh-8.5rem)] w-full max-w-[82rem] items-stretch gap-7 px-4 pb-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:gap-8">
				{currentCard ? (
					<>
						<section className="h-full rounded-[1.5rem] border border-white/10 bg-[#171a24] p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:p-8 xl:p-9">
							<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
								<div>
									<p className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-normal text-slate-300">
										{languageLabels[learningLanguage] ?? languageLabels.en}
									</p>
									<h1 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-5xl">
										Revisão rápida
									</h1>
								</div>
								<div className="grid grid-cols-2 gap-3 text-sm sm:min-w-64">
									<div className="rounded-[1rem] bg-white/[0.05] p-4">
										<p className="text-slate-500">Agora</p>
										<p className="mt-1 text-2xl font-semibold tabular-nums text-white">
											{activeReviewCount}
										</p>
									</div>
									<div className="rounded-[1rem] bg-white/[0.05] p-4">
										<p className="text-slate-500">Deck</p>
										<p className="mt-1 text-2xl font-semibold tabular-nums text-white">
											{cards.length}
										</p>
									</div>
								</div>
							</div>

							<div
								role="button"
								tabIndex={0}
								onClick={() => setIsFlipped((value) => !value)}
								onKeyDown={(event) => {
									if (event.key === "Enter" || event.key === " ") {
										event.preventDefault();
										setIsFlipped((value) => !value);
									}
								}}
								className="mt-7 flex min-h-[20rem] w-full cursor-pointer items-center justify-center rounded-[1.35rem] border border-white/10 bg-[#0f1119] px-6 py-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition hover:border-[#8b6cf4]/45 sm:min-h-[23rem] sm:px-10 xl:min-h-[24rem]"
							>
								{isFlipped ? (
									<FlashcardBack
										card={currentCard}
										onPlayAudio={onPlayBlockAudio}
									/>
								) : (
									<FlashcardFront card={currentCard} />
								)}
							</div>

							<div className="mt-6 flex flex-wrap items-center justify-center gap-3">
								<button
									type="button"
									onClick={() => setIsFlipped((value) => !value)}
									className="flex h-12 min-w-[7.5rem] cursor-pointer items-center justify-center gap-2 rounded-[1rem] border border-white/10 bg-white/5 px-5 text-base font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
								>
									<RotateCcw className="size-4 stroke-[2]" />
									Virar
								</button>
								{isFlipped ? (
									<>
										<button
											type="button"
											onClick={() => handleReviewAnswer("again")}
											className="h-12 min-w-[7.5rem] cursor-pointer rounded-[1rem] border border-rose-300/20 bg-rose-300/10 px-5 text-base font-semibold text-rose-200 transition hover:border-rose-300/35 hover:bg-rose-300/15"
										>
											De novo
										</button>
										<button
											type="button"
											onClick={() => handleReviewAnswer("hard")}
											className="h-12 min-w-[7.5rem] cursor-pointer rounded-[1rem] border border-[#f4b63f]/30 bg-[#f4b63f]/10 px-5 text-base font-semibold text-[#ffd782] transition hover:border-[#f4b63f]/50 hover:bg-[#f4b63f]/15"
										>
											Difícil
										</button>
										<button
											type="button"
											onClick={() => handleReviewAnswer("good")}
											className="h-12 min-w-[7.5rem] cursor-pointer rounded-[1rem] border border-[#8b6cf4]/35 bg-[#8b6cf4]/12 px-5 text-base font-semibold text-[#b8a6ff] transition hover:border-[#8b6cf4]/55 hover:bg-[#8b6cf4]/18"
										>
											Bom
										</button>
										<button
											type="button"
											onClick={() => handleReviewAnswer("easy")}
											className="h-12 min-w-[7.5rem] cursor-pointer rounded-[1rem] bg-[#8b6cf4] px-5 text-base font-semibold text-[#070914] transition hover:bg-[#9b7cff]"
										>
											Fácil
										</button>
									</>
								) : null}
							</div>
						</section>

						<aside className="grid h-full gap-7 lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-8">
							<div className="flex h-full flex-col rounded-[1.5rem] bg-[#f4b63f] p-6 text-[#141015]">
								<h2 className="text-2xl font-semibold">Progresso</h2>
								<div className="flex flex-1 items-center">
									<ReviewProgressGauge value={scheduledPercent} />
								</div>
								<div className="grid gap-3 text-sm font-semibold">
									<div className="flex items-center justify-between">
										<span>Para revisar</span>
										<span>{activeReviewCount}</span>
									</div>
									<div className="flex items-center justify-between">
										<span>Mais tarde</span>
										<span>{pendingCount}</span>
									</div>
								</div>
							</div>

							<div className="flex h-full flex-col rounded-[1.5rem] border border-white/10 bg-[#24232d] p-6">
								<h2 className="text-2xl font-semibold text-white">Intervalos</h2>
								<div className="mt-6 grid flex-1 content-center gap-5 text-lg font-semibold text-slate-300">
									<div className="flex items-center gap-3">
										<RotateCcw className="size-6 text-rose-200" />
										De novo: fim da fila
									</div>
									<div className="flex items-center gap-3">
										<Clock3 className="size-6 text-[#ffd782]" />
										Difícil: 10 min
									</div>
									<div className="flex items-center gap-3">
										<CalendarDays className="size-6 text-[#b8a6ff]" />
										Bom: 1 dia
									</div>
									<div className="flex items-center gap-3">
										<CalendarDays className="size-6 text-[#8bff74]" />
										Fácil: 3 dias
									</div>
								</div>
							</div>
						</aside>
					</>
				) : (
					<div className="col-span-full mx-auto flex min-h-[calc(100svh-14rem)] w-full max-w-md flex-col items-center justify-center p-6 text-center">
						<div className="flex size-14 items-center justify-center rounded-[1rem] bg-[#8b6cf4] text-[#070914]">
							<Check className="size-7 stroke-[3]" />
						</div>
						<h1 className="mt-4 text-2xl font-semibold text-white">
							{cards.length > 0 ? "Revisão concluída" : "Deck vazio"}
						</h1>
						<p className="mt-3 max-w-sm text-base leading-relaxed text-slate-500">
							{cards.length > 0
								? "Tudo revisado por agora. Os próximos cartões aparecem no horário certo."
								: "Marque blocos como aprendendo para criar flashcards."}
						</p>
						<a
							href="#study"
							className="mt-6 inline-flex h-12 items-center rounded-[1rem] bg-[#8b6cf4] px-6 text-base font-semibold text-[#070914] transition hover:bg-[#9b7cff]"
						>
							Voltar ao estudo
						</a>
					</div>
				)}
			</main>
		</div>
	);
}

export default FlashcardsScreen;
