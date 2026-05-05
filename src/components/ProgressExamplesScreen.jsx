import { BookOpenCheck, Check, Clock, Layers3, RotateCcw } from "lucide-react";
import AppHeader from "./AppHeader";

const metrics = [
	{
		key: "known",
		label: "Blocos conhecidos",
		shortLabel: "Conhecidos",
		accent: "bg-lime-300",
		text: "text-lime-200",
		soft: "bg-lime-300/12",
		icon: Check,
	},
	{
		key: "learning",
		label: "Blocos estudando",
		shortLabel: "Estudando",
		accent: "bg-[#f4b63f]",
		text: "text-[#ffd782]",
		soft: "bg-[#f4b63f]/12",
		icon: BookOpenCheck,
	},
	{
		key: "review",
		label: "Revisão",
		shortLabel: "Revisão",
		accent: "bg-[#8b6cf4]",
		text: "text-[#b8a6ff]",
		soft: "bg-[#8b6cf4]/12",
		icon: RotateCcw,
	},
];

function getMetricItems({ knownCount, learningCount, flashcardCount }) {
	const values = {
		known: knownCount,
		learning: learningCount,
		review: flashcardCount,
	};
	const maxValue = Math.max(knownCount, learningCount, flashcardCount, 1);

	return metrics.map((metric) => ({
		...metric,
		value: values[metric.key] ?? 0,
		valueLabel: `${values[metric.key] ?? 0} ${metric.shortLabel.toLowerCase()}`,
		percent: Math.round(((values[metric.key] ?? 0) / maxValue) * 100),
	}));
}

function ExampleShell({ number, title, note, children }) {
	return (
		<section className="border-t border-white/[0.06] py-10 first:border-t-0 first:pt-0">
			<div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">
						Opção {number}
					</p>
					<h2 className="mt-1 text-2xl font-semibold text-white">{title}</h2>
				</div>
				<p className="max-w-md text-sm font-normal leading-relaxed text-slate-500">
					{note}
				</p>
			</div>
			{children}
		</section>
	);
}

function OptionNoNumbers({ items }) {
	return (
		<div className="grid gap-4 sm:grid-cols-3">
			{items.map((item) => (
				<div key={item.key}>
					<div className="relative h-40 overflow-hidden rounded-[1rem] border border-white/10 bg-[#171821]">
						<div
							className={`absolute inset-x-0 bottom-0 rounded-t-[1rem] ${item.accent}`}
							style={{ height: `${Math.max(item.percent, item.value > 0 ? 18 : 0)}%` }}
						/>
					</div>
					<p className="mt-3 text-center text-base font-normal text-slate-300">
						{item.label}
					</p>
				</div>
			))}
		</div>
	);
}

function OptionNumberBelow({ items }) {
	return (
		<div className="grid gap-4 sm:grid-cols-3">
			{items.map((item) => (
				<div key={item.key}>
					<div className="relative h-36 overflow-hidden rounded-[1rem] border border-white/10 bg-[#171821]">
						<div
							className={`absolute inset-x-0 bottom-0 rounded-t-[1rem] ${item.accent}`}
							style={{ height: `${Math.max(item.percent, item.value > 0 ? 18 : 0)}%` }}
						/>
					</div>
					<div className="mt-4 text-center">
						<p className="text-3xl font-semibold leading-none text-white tabular-nums">
							{item.value}
						</p>
						<p className="mt-2 text-base font-normal text-slate-300">{item.label}</p>
					</div>
				</div>
			))}
		</div>
	);
}

function OptionHorizontalBars({ items }) {
	return (
		<div className="grid gap-3">
			{items.map((item) => (
				<div
					key={item.key}
					className="rounded-[1rem] border border-white/10 bg-[#171821] px-5 py-4"
				>
					<div className="flex items-center justify-between gap-4">
						<p className="text-base font-normal text-slate-300">{item.label}</p>
						<p className="text-2xl font-semibold leading-none text-white tabular-nums">
							{item.value}
						</p>
					</div>
					<div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
						<div
							className={`h-full rounded-full ${item.accent}`}
							style={{ width: `${item.percent}%` }}
						/>
					</div>
				</div>
			))}
		</div>
	);
}

function OptionMetricCards({ items }) {
	return (
		<div className="grid gap-4 sm:grid-cols-3">
			{items.map((item, itemIndex) => {
				return (
					<div
						key={item.key}
						className="relative min-h-56 overflow-hidden rounded-[1rem] border border-white/10 bg-[#171821] p-5"
					>
						<div className="absolute inset-x-6 top-5 h-24">
							{Array.from({ length: 5 }).map((_, index) => {
								const isActive = index < Math.max(1, Math.ceil(item.percent / 20));
								return (
									<span
										key={index}
										className={`absolute h-11 rounded-[0.75rem] border border-white/10 shadow-[0_18px_34px_rgba(0,0,0,0.22)] ${
											isActive ? item.accent : "bg-white/[0.055]"
										}`}
										style={{
											left: `${index * 13}%`,
											right: `${Math.max(0, 40 - index * 7)}%`,
											top: `${index * 9}px`,
											opacity: isActive ? 1 : 0.55,
											transform: `rotate(${(index - 2) * 1.2 + itemIndex}deg)`,
										}}
									/>
								);
							})}
						</div>

						<div className="relative z-10 mt-28 flex items-end justify-between gap-4">
							<div>
								<p className="text-base font-normal text-slate-300">
									{item.shortLabel}
								</p>
								<p className={`mt-2 text-sm font-semibold ${item.text}`}>
									{item.label}
								</p>
							</div>
							<div className={`rounded-[0.9rem] px-4 py-3 ${item.soft}`}>
								<p className="text-3xl font-semibold leading-none text-white tabular-nums">
									{item.value}
								</p>
							</div>
						</div>

						<div className="relative z-10 mt-5 grid grid-cols-5 gap-1.5">
							{Array.from({ length: 5 }).map((_, index) => (
								<span
									key={index}
									className={`h-1.5 rounded-full ${
										index < Math.ceil(item.percent / 20)
											? item.accent
											: "bg-white/[0.06]"
									}`}
								/>
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
}

function OptionPills({ items }) {
	return (
		<div className="grid gap-3">
			{items.map((item) => (
				<div
					key={item.key}
					className="flex min-h-16 items-center justify-between gap-4 rounded-full border border-white/10 bg-[#171821] py-2 pl-5 pr-2"
				>
					<div className="flex items-center gap-3">
						<span className={`size-3 rounded-full ${item.accent}`} />
						<p className="text-base font-normal text-slate-300">{item.label}</p>
					</div>
					<span
						className={`flex h-12 min-w-16 items-center justify-center rounded-full px-5 text-xl font-semibold leading-none tabular-nums ${item.accent} text-[#08090d]`}
					>
						{item.value}
					</span>
				</div>
			))}
		</div>
	);
}

function OptionSoftPanel({ items }) {
	const totalValue = items.reduce((sum, item) => sum + item.value, 0);

	return (
		<div className="mx-auto max-w-2xl rounded-[1.75rem] border border-white/10 bg-[#171821] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-7">
			<div>
				<div>
					<h3 className="text-3xl font-normal leading-none">Progresso</h3>
					<p className="mt-3 text-sm font-normal text-slate-500">
						Blocos da rodada
					</p>
				</div>
			</div>

			<div className="mt-9">
				<div className="mb-3 flex">
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
									{item.shortLabel}
								</p>
								<p className="truncate text-xs font-normal text-slate-600 tabular-nums">
									{item.value}
								</p>
							</div>
						);
					})}
				</div>

				<div className="flex h-16 overflow-hidden rounded-[1.1rem]">
				{items.map((item) => {
					const segmentColorClassNames = {
						known: "bg-[#8b6cf4]",
						learning: "bg-[#f4b63f]",
						review: "bg-lime-300",
					};
					const segmentWidth =
						totalValue > 0 ? (item.value / totalValue) * 100 : 100 / items.length;

					return (
						<div
							key={item.key}
							className={`min-w-0 ${segmentColorClassNames[item.key]}`}
							style={{ width: `${segmentWidth}%` }}
							aria-label={item.valueLabel}
						/>
					);
				})}
				</div>
			</div>
		</div>
	);
}

function ProgressExamplesScreen({
	user,
	learningLanguage = "en",
	knownCount = 0,
	learningCount = 0,
	flashcardCount = 0,
	onSelectLanguage,
	onSignOut,
}) {
	const items = getMetricItems({ knownCount, learningCount, flashcardCount });

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

				<main className="mx-auto mt-8 max-w-6xl">
					<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<p className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-sm font-normal text-slate-400">
								<Clock className="size-4 stroke-[2.1]" />
								Exploração visual
							</p>
							<h1 className="mt-4 text-4xl font-semibold leading-tight text-white sm:text-5xl">
								Progresso
							</h1>
						</div>
						<a
							href="#dashboard"
							className="inline-flex h-12 items-center justify-center rounded-full bg-white/[0.06] px-5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
						>
							Voltar ao dashboard
						</a>
					</div>

					<div className="rounded-[1.5rem] bg-[#11131b] p-5 sm:p-7">
						<div className="mb-8 flex items-center gap-3 text-slate-500">
							<Layers3 className="size-5 stroke-[2.1]" />
							<p className="text-base font-normal">
									Mesmos dados, seis tratamentos visuais.
							</p>
						</div>

						<ExampleShell
							number="1"
							title="Sem número no card"
							note="Mais minimalista, mas depende de outro lugar para mostrar os valores exatos."
						>
							<OptionNoNumbers items={items} />
						</ExampleShell>

						<ExampleShell
							number="2"
							title="Número abaixo do gráfico"
							note="Mantém o gráfico limpo e deixa a métrica legível fora da área colorida."
						>
							<OptionNumberBelow items={items} />
						</ExampleShell>

						<ExampleShell
							number="3"
							title="Barras horizontais"
							note="A opção mais clara para comparar valores sem ocupar tanta presença visual."
						>
							<OptionHorizontalBars items={items} />
						</ExampleShell>

						<ExampleShell
							number="4"
							title="Pilha de blocos"
							note="Mais próprio do Linguasimp: o progresso aparece como peças acumuladas, não como painel genérico."
						>
							<OptionMetricCards items={items} />
						</ExampleShell>

						<ExampleShell
							number="5"
							title="Pílulas coloridas"
							note="Leve, compacto e fácil de escanear em mobile."
						>
							<OptionPills items={items} />
						</ExampleShell>

						<ExampleShell
							number="6"
							title="Painel segmentado"
							note="Inspirado em cards editoriais: porcentagem no topo e segmentos grandes para mostrar composição."
						>
							<OptionSoftPanel items={items} />
						</ExampleShell>
					</div>
				</main>
			</div>
		</div>
	);
}

export default ProgressExamplesScreen;
