import { ArrowRight, CheckCircle2, Ear, MessageSquareText } from "lucide-react";

const onboardingSteps = [
	{
		number: "1",
		title: "Escute.",
		description: "Ouça a frase primeiro.",
		icon: Ear,
		barWidth: "34%",
	},
	{
		number: "2",
		title: "Marque.",
		description: "Toque nos blocos que você já sabe.",
		icon: CheckCircle2,
		barWidth: "66%",
	},
	{
		number: "3",
		title: "Aprenda.",
		description: "O app foca no que falta.",
		icon: MessageSquareText,
		barWidth: "100%",
	},
];

function OnboardingCard({ step }) {
	const Icon = step.icon;

	return (
		<article className="relative flex min-h-[18rem] flex-col overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#0d111c]/88 p-7 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
			<span className="grid size-10 place-items-center rounded-full bg-[#7c4dff] text-lg font-semibold text-white shadow-[0_0_28px_rgba(124,77,255,0.45)]">
				{step.number}
			</span>

			<div className="grid flex-1 place-items-center py-7 text-center">
				<div>
					<Icon className="mx-auto size-16 text-[#7c4dff]" strokeWidth={1.8} />
					<h2 className="mt-7 text-2xl font-semibold text-white">
						{step.title}
					</h2>
					<p className="mx-auto mt-3 max-w-[13rem] text-base font-normal leading-relaxed text-slate-300">
						{step.description}
					</p>
				</div>
			</div>

			<div className="h-1.5 overflow-hidden rounded-full bg-white/8">
				<div
					className="h-full rounded-full bg-[#7c4dff]"
					style={{ width: step.barWidth }}
				/>
			</div>
		</article>
	);
}

function OnboardingScreen() {
	return (
		<main className="min-h-screen bg-[#05070d] px-5 py-6 text-white sm:px-8 lg:px-12">
			<div className="mx-auto flex min-h-[calc(100svh-3rem)] max-w-7xl flex-col">
				<header className="flex items-center justify-between">
					<a href="#landing" aria-label="LinguaSimp inicio" className="inline-flex">
						<img
							src="/linguasimp-logo-current.png"
							alt="LinguaSimp"
							className="block w-48 object-contain object-left sm:w-56"
						/>
					</a>
					<a
						href="#login"
						className="hidden h-12 items-center justify-center rounded-[0.85rem] border border-white/12 px-6 text-base font-semibold text-slate-200 transition hover:border-[#8b6cf4]/55 hover:bg-white/5 sm:inline-flex"
					>
						Entrar
					</a>
				</header>

				<section className="flex flex-1 flex-col justify-center py-10">
					<div className="max-w-3xl">
						<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
							Onboarding
						</p>
						<h1 className="mt-4 text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
							Como o LinguaSimp funciona
						</h1>
						<p className="mt-5 max-w-2xl text-lg font-normal leading-relaxed text-slate-400 sm:text-xl">
							Você aprende com frases reais em blocos curtos, sem decorar
							palavras soltas.
						</p>
					</div>

					<div className="mt-10 grid gap-5 md:grid-cols-3">
						{onboardingSteps.map((step) => (
							<OnboardingCard key={step.number} step={step} />
						))}
					</div>

					<div className="mt-9 flex flex-wrap items-center gap-4">
						<a
							href="#login"
							className="inline-flex h-15 w-full max-w-[22rem] items-center justify-center gap-4 rounded-[1rem] bg-[#6e46e8] px-8 text-lg font-semibold text-white shadow-[0_22px_55px_rgba(110,70,232,0.34)] transition hover:-translate-y-0.5 hover:bg-[#8b6cf4] sm:w-auto sm:min-w-[20rem]"
						>
							Começar agora
							<ArrowRight className="size-6 stroke-[2.1]" />
						</a>
						<a
							href="#landing"
							className="inline-flex h-15 w-full max-w-[22rem] items-center justify-center rounded-[1rem] border border-white/12 px-8 text-lg font-semibold text-slate-300 transition hover:border-[#8b6cf4]/55 hover:bg-white/5 sm:w-auto"
						>
							Voltar
						</a>
					</div>
				</section>
			</div>
		</main>
	);
}

export default OnboardingScreen;
