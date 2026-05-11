import {
	ArrowUpRight,
	BookOpenCheck,
	Check,
} from "lucide-react";
import AppHeader from "./AppHeader";

const certificateLabels = {
	en: "MOVERS A1",
	es: "DELE A1",
	fr: "DELF A1",
	de: "Goethe A1",
	it: "CELI A1",
	ru: "TORFL A1",
	no: "A1",
	el: "A1",
	zh: "HSK 1",
	ja: "JLPT N5",
};
const A1_BLOCK_TARGET = 500;

function clampPercentage(value) {
	return Math.min(Math.max(value, 0), 100);
}

function getGaugePoint(cx, cy, radius, percentage) {
	const angle = Math.PI - (Math.PI * percentage) / 100;

	return {
		x: cx + radius * Math.cos(angle),
		y: cy - radius * Math.sin(angle),
	};
}

function getGaugeArcPath(startPercentage, endPercentage) {
	const start = getGaugePoint(120, 120, 82, startPercentage);
	const end = getGaugePoint(120, 120, 82, endPercentage);
	const largeArcFlag = endPercentage - startPercentage > 50 ? 1 : 0;

	return `M ${start.x} ${start.y} A 82 82 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

function getLocalDateKey(date = new Date()) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

function buildWeeklyActivityItems(weeklyActivity = {}) {
	const dayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
	const today = new Date();

	return Array.from({ length: 7 }).map((_, index) => {
		const date = new Date(today);
		date.setDate(today.getDate() - (6 - index));
		const dateKey = getLocalDateKey(date);
		const label = dayFormatter.format(date).replace(".", "");

		return {
			dateKey,
			label: label.charAt(0).toUpperCase() + label.slice(1),
			value: weeklyActivity[dateKey] ?? 0,
			isToday: index === 6,
		};
	});
}

	function WeeklyBars({ weeklyActivity = {} }) {
		const days = buildWeeklyActivityItems(weeklyActivity);
		const maxValue = Math.max(...days.map((day) => day.value), 1);
		const activeDayCount = days.filter((day) => day.value > 0).length;
		const minimumBarHeight = 12;

	return (
		<div className="min-w-0 rounded-[1.25rem] border border-white/10 bg-[#171a24] p-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<h2 className="text-lg font-semibold text-white">Ritmo semanal</h2>
				<div className="flex flex-wrap gap-1.5 sm:gap-2">
					{days.map((day) => (
						<span
							key={day.dateKey}
							className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-normal sm:size-7 ${
								day.value > 0
									? "bg-[#8b6cf4] text-white"
									: "bg-white/10 text-slate-600"
							}`}
						>
							{day.value > 0 ? <Check className="size-3 stroke-[2.4]" /> : null}
						</span>
					))}
				</div>
			</div>
			<p className="mt-2 text-xs font-normal text-slate-500">
				{activeDayCount > 0
					? `${activeDayCount} ${activeDayCount === 1 ? "dia ativo" : "dias ativos"} nos últimos 7 dias`
					: "Nenhuma atividade registrada nesta semana"}
			</p>
			<div className="mt-5 flex h-28 min-w-0 items-end gap-1.5 sm:h-32 sm:gap-3">
				{days.map((day) => (
					<div
						key={day.dateKey}
						className="flex min-w-0 flex-1 flex-col items-center gap-2"
					>
						<div className="flex h-20 w-full min-w-4 items-end rounded-full bg-white/[0.045] sm:h-24">
								<div
									className={`w-full rounded-full ${
										day.value > 0
											? day.isToday
												? "bg-[#8b6cf4]"
												: "bg-[#8b6cf4]/70"
											: "bg-[#8b6cf4]/28"
									}`}
									style={{
										height: `${day.value > 0 ? Math.max((day.value / maxValue) * 100, 14) : minimumBarHeight}%`,
									}}
								/>
						</div>
						<span className="max-w-full truncate text-[0.68rem] font-normal text-slate-500 sm:text-xs">
							{day.label}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

function A1ProgressCard({ knownCount, learningLanguage }) {
	const a1Progress = clampPercentage(
		Math.round((knownCount / A1_BLOCK_TARGET) * 100),
	);
	const knownWidth = clampPercentage((knownCount / A1_BLOCK_TARGET) * 100);
	const remainingBlocks = Math.max(
		A1_BLOCK_TARGET - knownCount,
		0,
	);
	const knownSegmentEnd = clampPercentage(knownWidth);
	const hasKnownProgress = knownSegmentEnd > 0;

	return (
		<div className="flex min-h-[21.75rem] flex-col rounded-[1.5rem] bg-[#f4b63f] p-7 text-[#141015]">
			<div>
				<p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#141015]/55">
					Rumo ao certificado
				</p>
				<h2 className="mt-1 text-2xl font-semibold leading-tight">
					{certificateLabels[learningLanguage] ?? certificateLabels.en}
				</h2>
			</div>

			<div className="relative mx-auto mt-4 h-40 w-full max-w-[18rem]">
				<svg
					viewBox="0 0 240 145"
					className="h-full w-full -translate-y-3 overflow-visible"
					aria-hidden="true"
				>
					<defs>
						<pattern
							id="a1-pending-stripes"
							width="8"
							height="8"
							patternUnits="userSpaceOnUse"
							patternTransform="rotate(45)"
						>
							<rect width="3" height="8" fill="#141015" opacity="0.26" />
						</pattern>
					</defs>
					<path
						d={getGaugeArcPath(0, 100)}
						fill="none"
						stroke="url(#a1-pending-stripes)"
						strokeLinecap="round"
						strokeWidth="32"
					/>
					{hasKnownProgress ? (
						<path
							d={getGaugeArcPath(0, knownSegmentEnd)}
							fill="none"
							stroke="#24885b"
							strokeLinecap="round"
							strokeWidth="32"
						/>
					) : null}
				</svg>
				<div className="absolute inset-x-0 bottom-1 text-center">
					<p className="text-5xl font-semibold leading-none tabular-nums">
						{a1Progress}%
					</p>
					<p className="mt-1 text-xs font-semibold text-[#24885b]">rumo ao A1</p>
				</div>
			</div>

			<div className="mt-5">
				<div className="flex items-end justify-between gap-4">
					<div>
						<p className="text-sm font-semibold text-[#141015]/55">Progresso até A1</p>
						<p className="mt-1 text-xl font-semibold tabular-nums">
							{knownCount} / {A1_BLOCK_TARGET} blocos conhecidos
						</p>
					</div>
					<p className="text-sm font-semibold text-[#141015]/55">
						faltam {remainingBlocks}
					</p>
				</div>
				<div className="mt-4 h-5 overflow-hidden rounded-full bg-[#141015]/12">
					<div
						className="h-full rounded-full bg-[#141015]/25"
						style={{ width: `${knownWidth}%` }}
					/>
				</div>
				<div className="mt-3 flex items-center justify-between text-xs font-semibold text-[#141015]/55">
					<span>começo</span>
					<span>A1</span>
				</div>
			</div>

		</div>
	);
}

function formatProgressLabel(value, singularLabel, pluralLabel) {
	return `${value} ${value === 1 ? singularLabel : pluralLabel}`;
}

function ProgressSegmentPanel({ knownCount, learningCount, dueFlashcardCount }) {
	const items = [
		{
			key: "known",
			label: "Conhecidos",
			valueLabel: formatProgressLabel(
				knownCount,
				"bloco conhecido",
				"blocos conhecidos",
			),
			value: knownCount,
			color: "bg-[#8b6cf4]",
		},
		{
			key: "learning",
			label: "Estudando",
			valueLabel: formatProgressLabel(
				learningCount,
				"bloco estudando",
				"blocos estudando",
			),
			value: learningCount,
			color: "bg-[#f4b63f]",
		},
			{
				key: "review",
				label: "Revisão",
				valueLabel: formatProgressLabel(
					dueFlashcardCount,
					"cartão para revisar",
					"cartões para revisar",
				),
				value: dueFlashcardCount,
				color: "bg-lime-300",
			},
	];
	const totalValue = items.reduce((sum, item) => sum + item.value, 0);

	return (
		<div className="mt-5 rounded-[1.5rem] border border-white/10 bg-[#171821] p-5 sm:p-6">
			<div className="flex">
				{items.map((item) => {
					const segmentWidth =
						totalValue > 0 ? (item.value / totalValue) * 100 : 100 / items.length;

					return (
						<div
							key={item.key}
							className="flex min-w-0 items-center justify-between gap-2 px-1"
							style={{ width: `${segmentWidth}%` }}
						>
							<p className="truncate text-sm font-normal text-slate-300">
								{item.valueLabel}
							</p>
						</div>
					);
				})}
			</div>

			<div className="mt-4 flex h-16 overflow-hidden rounded-[1.1rem]">
				{items.map((item) => {
					const segmentWidth =
						totalValue > 0 ? (item.value / totalValue) * 100 : 100 / items.length;

					return (
						<div
							key={item.key}
							className={`min-w-0 ${item.color}`}
							style={{ width: `${segmentWidth}%` }}
							aria-label={item.valueLabel}
						/>
					);
				})}
			</div>
		</div>
	);
}

function getBlockPreviewLabel(block) {
	return block?.surface || block?.canonicalText || block?.canonical_text || block?.text || "bloco";
}

function KnownBlocksPreview({ knownBlocks = [] }) {
	const visibleBlocks = knownBlocks.slice(0, 5);
	const hiddenCount = Math.max(knownBlocks.length - visibleBlocks.length, 0);
	const chipClassNames = [
		"bg-[#8b6cf4] text-white",
		"bg-lime-300 text-[#10120f]",
		"bg-[#f4b63f] text-[#141015]",
		"bg-white/[0.08] text-slate-200",
		"bg-[#8b6cf4]/35 text-[#d8ceff]",
	];

	if (visibleBlocks.length === 0) {
		return (
			<div className="mt-8 grid gap-4">
				<div className="mx-auto h-14 w-40 rounded-[1.15rem] bg-[#8b6cf4]/45" />
				<div className="grid grid-cols-[0.8fr_1fr] gap-4">
					<div className="h-14 rounded-[1.15rem] bg-lime-300/45" />
					<div className="h-14 rounded-[1.15rem] bg-[#f4b63f]/45" />
				</div>
			</div>
		);
	}

	return (
		<div className="mt-8 flex flex-wrap justify-center gap-3">
			{visibleBlocks.map((block, index) => (
				<span
					key={`${block.blockId ?? getBlockPreviewLabel(block)}-${index}`}
					className={`flex min-h-12 max-w-full items-center rounded-[1rem] px-5 text-base font-semibold shadow-[0_14px_34px_rgba(0,0,0,0.18)] ${chipClassNames[index % chipClassNames.length]}`}
				>
					<span className="truncate">{getBlockPreviewLabel(block)}</span>
				</span>
			))}
			{hiddenCount > 0 ? (
				<span className="flex min-h-12 items-center rounded-[1rem] bg-white/[0.08] px-5 text-base font-semibold text-slate-300">
					+{hiddenCount}
				</span>
			) : null}
		</div>
	);
}

function DashboardScreen({
	user,
	learningLanguage = "en",
	sentenceCount = 0,
	knownCount = 0,
	learningCount = 0,
	flashcardCount = 0,
	dueFlashcardCount = 0,
	weeklyActivity = {},
	knownBlocks = [],
	onSelectLanguage,
	onSignOut,
}) {
		const scheduledFlashcardCount = Math.max(flashcardCount - dueFlashcardCount, 0);
		const studyActionLabel =
			knownCount + learningCount > 0 ? "Continuar estudo" : "Começar estudo";

	return (
		<div className="min-h-screen bg-[#08090d] p-4 text-white sm:p-6 lg:p-8">
			<div className="w-full">
				<AppHeader
					user={user}
					activePage="dashboard"
					learningLanguage={learningLanguage}
					onSelectLanguage={onSelectLanguage}
					onSignOut={onSignOut}
				/>

				<main className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
					<section className="grid gap-4">
						<div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
							<div className="min-h-[21.75rem] overflow-hidden rounded-[1.5rem] bg-[#1b1d27] p-7">
								<div className="flex h-full flex-col justify-between">
									<div>
										<h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
											Continue sua próxima rodada
										</h1>
										<p className="mt-1 text-base font-normal leading-relaxed text-slate-500">
											{sentenceCount} frases disponíveis para construir vocabulário por blocos.
										</p>
									</div>
									<a
										href="#study"
										className="mt-5 inline-flex h-14 w-full items-center justify-center gap-3 rounded-[1rem] bg-[#8b6cf4] px-8 text-lg font-semibold text-[#070914] shadow-[0_16px_40px_rgba(139,108,244,0.28)] transition hover:-translate-y-0.5 hover:bg-[#9b7cff]"
									>
										{studyActionLabel}
										<ArrowUpRight className="size-5 stroke-[2.1]" />
									</a>
								</div>
							</div>

							<A1ProgressCard
								knownCount={knownCount}
								learningLanguage={learningLanguage}
							/>
						</div>

							<section>
								<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
										<h2 className="text-3xl font-semibold text-white">Progresso</h2>
										<p className="text-base font-normal text-slate-500">
											Acompanhe seus blocos e o que precisa revisar agora.
										</p>
									</div>
									<ProgressSegmentPanel
										knownCount={knownCount}
										learningCount={learningCount}
										dueFlashcardCount={dueFlashcardCount}
									/>
							</section>
					</section>

					<section className="grid gap-5">
						<WeeklyBars weeklyActivity={weeklyActivity} />

						<div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
							<div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#24232d] p-6">
								<p className="text-4xl font-semibold leading-tight text-yellow-300">
									Construa
									<span className="font-normal text-white"> vocabulário em peças pequenas.</span>
								</p>
								<KnownBlocksPreview knownBlocks={knownBlocks} />
							</div>

							<div className="rounded-[1.5rem] border border-white/10 bg-[#24232d] p-6">
								<h2 className="text-3xl font-semibold text-white">Repetição espaçada</h2>
								<p className="mt-6 text-3xl font-semibold text-[#9b5cff]">
									Flashcards
								</p>
								<div className="mt-5 text-sm font-normal text-slate-400">
									{flashcardCount} cartões no deck
								</div>
								<div className="mt-2 text-sm font-normal text-slate-500">
									{dueFlashcardCount} para revisar agora
								</div>
								{scheduledFlashcardCount > 0 ? (
									<div className="mt-1 text-sm font-normal text-slate-600">
										{scheduledFlashcardCount} ficam para depois
									</div>
								) : null}
								<a
									href="#flashcards"
									className="group mt-6 flex justify-center rounded-[1.25rem] transition hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#8b6cf4]/70"
									aria-label="Abrir flashcards"
								>
									<div className="relative h-40 w-56 overflow-visible" key="flashcard-review-deck">
										<div className="dashboard-flashcard-main absolute left-1/2 top-2 flex h-30 w-44 -translate-x-1/2 flex-col rounded-[1.15rem] p-4 transition group-hover:-translate-y-1 group-hover:rotate-[-1deg]">
											<div className="flex items-start justify-between">
												<div className="dashboard-flashcard-chip flex size-12 items-center justify-center rounded-2xl">
													<BookOpenCheck className="size-6 stroke-[2.3]" />
												</div>
												<div className="dashboard-flashcard-chip rounded-full px-3 py-1 text-sm font-normal tabular-nums">
													{flashcardCount}
												</div>
											</div>
											<div className="mt-auto space-y-2">
												<span className="dashboard-flashcard-line dashboard-flashcard-line-strong block h-2 w-24 rounded-full" />
												<div className="flex gap-1.5">
													<span className="dashboard-flashcard-line h-2 w-10 rounded-full" />
													<span className="dashboard-flashcard-line h-2 w-6 rounded-full" />
												</div>
											</div>
										</div>
									</div>
								</a>
							</div>
						</div>
					</section>
				</main>
			</div>
		</div>
	);
}

export default DashboardScreen;
