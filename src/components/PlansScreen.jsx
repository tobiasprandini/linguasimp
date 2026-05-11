import {
	Check,
	Leaf,
	LockKeyhole,
	Music2,
	RefreshCcw,
	Share2,
	ShieldCheck,
	Sparkles,
	Sprout,
} from "lucide-react";
import PublicHeader from "./PublicHeader";

const plans = [
	{
		name: "Grátis",
		icon: Sprout,
		iconColor: "text-[#8bcd68]",
		iconBg: "bg-[#8bcd68]/10",
		description: "Para começar sua jornada.",
		price: "0",
		cents: "",
		period: "/mês",
		features: [
			"Acesso a lições básicas",
			"Frases e exemplos reais",
			"1 idioma disponível",
			"Revisões diárias limitadas",
			"Anúncios no app",
		],
		cta: "Começar grátis",
		href: "#signup",
		accent: "green",
	},
	{
		name: "Premium",
		icon: Sparkles,
		iconColor: "text-[#9b7cff]",
		iconBg: "bg-[#9b7cff]/13",
		description: "Para aprender sem limites.",
		price: "24",
		cents: ",90",
		period: "/mês",
		features: [
			"Acesso ilimitado a todas as lições",
			"Todos os idiomas disponíveis",
			"Áudios naturais de nativos",
			"Revisões diárias ilimitadas",
			"Modo offline",
			"Sem anúncios",
			"Novos conteúdos toda semana",
		],
		cta: "Assinar Premium",
		href: "#signup",
		accent: "purple",
		highlighted: true,
	},
	{
		name: "Anual",
		icon: Leaf,
		iconColor: "text-[#8bcd68]",
		iconBg: "bg-[#8bcd68]/10",
		description: "O melhor custo para quem é constante.",
		price: "199",
		cents: ",90",
		period: "/ano",
		features: [
			"Todos os benefícios do Premium",
			"Desconto exclusivo",
			"Prioridade em novidades",
			"Acesso antecipado a recursos",
		],
		cta: "Assinar anual",
		href: "#signup",
		accent: "green",
	},
];

const safetyItems = [
	{
		icon: LockKeyhole,
		title: "Cancelamento fácil",
		text: "Cancele quando quiser. Sem burocracia.",
	},
	{
		icon: RefreshCcw,
		title: "7 dias de garantia",
		text: "Experimente o Premium sem risco.",
	},
	{
		icon: ShieldCheck,
		title: "Seus dados seguros",
		text: "Privacidade é prioridade por aqui.",
	},
];

function LanguageIllustration() {
	const bubbles = [
		{ text: "¡Hola!", className: "left-[6%] top-[20%]" },
		{ text: "Bonjour", className: "right-[2%] top-[4%]" },
		{ text: "Hello", className: "left-[14%] bottom-[20%]" },
		{ text: "こんにちは", className: "right-[0%] bottom-[16%]" },
	];

	return (
		<div className="relative mx-auto h-[18rem] w-full max-w-[35rem] text-[#8b6cf4]">
			<div className="absolute left-1/2 top-1/2 size-36 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#8b6cf4] shadow-[0_0_42px_rgba(139,108,244,0.16)] sm:size-44">
				<svg
					viewBox="0 0 200 200"
					className="h-full w-full"
					aria-hidden="true"
				>
					<path
						d="M54 49c19-24 45-18 51-8 4 7-7 11-1 19 5 7 22 1 30 12 5 8-2 19-12 21-12 3-18-7-29-2-13 5-7 19-22 25-13 5-28-5-30-20-3-18 16-23 13-47Z"
						fill="none"
						stroke="currentColor"
						strokeWidth="3"
					/>
					<path
						d="M124 42c28 6 46 30 45 59-1 35-29 61-64 61 12-12 13-26 7-35-8-12-24-9-27-21-3-11 9-15 7-28-1-9-9-18 4-25 7-4 16-7 28-11Z"
						fill="none"
						stroke="currentColor"
						strokeWidth="3"
					/>
					<path
						d="M53 128c12 4 26 6 38 19"
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeWidth="3"
					/>
				</svg>
			</div>
			<div className="absolute left-[18%] top-[36%] h-14 w-28 rounded-full border border-[#8b6cf4]/25 border-dashed opacity-60" />
			<div className="absolute right-[11%] top-[41%] h-16 w-32 rounded-full border border-[#8b6cf4]/25 border-dashed opacity-60" />

			{bubbles.map((bubble) => (
				<div
					key={bubble.text}
					className={`absolute rounded-[0.75rem] border border-[#8b6cf4]/70 bg-[#11131b] px-5 py-3 text-sm font-semibold text-[#9b7cff] shadow-[0_0_28px_rgba(139,108,244,0.13)] ${bubble.className}`}
				>
					{bubble.text}
					<span className="absolute -bottom-2 left-7 h-4 w-4 rotate-45 border-b border-r border-[#8b6cf4]/70 bg-[#11131b]" />
				</div>
			))}
		</div>
	);
}

function PlanCard({ plan }) {
	const Icon = plan.icon;
	const checkColor = plan.accent === "purple" ? "text-[#9b7cff]" : "text-[#8bcd68]";

	return (
		<article
			className={`relative flex min-h-[31.5rem] flex-col rounded-[1rem] border p-7 shadow-[0_28px_90px_rgba(0,0,0,0.34)] backdrop-blur ${
				plan.highlighted
					? "border-[#8b6cf4] bg-[#171922]/92"
					: "border-white/10 bg-[#171922]/82"
			}`}
		>
			{plan.highlighted ? (
				<div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-[0.55rem] bg-[#46306f] px-5 py-2 text-xs font-bold uppercase tracking-[0.06em] text-slate-200">
					Mais escolhido
				</div>
			) : null}

			<div className="flex items-center gap-4">
				<span className={`grid size-11 place-items-center rounded-full ${plan.iconBg} ${plan.iconColor}`}>
					<Icon className="size-5 stroke-[2.3]" />
				</span>
				<h2 className="text-2xl font-semibold text-white">{plan.name}</h2>
			</div>

			<p className="mt-6 min-h-[3.5rem] max-w-48 text-base leading-relaxed text-slate-400">
				{plan.description}
			</p>

			<div className="mt-5 flex items-end gap-1 text-white">
				<span className="mb-1 text-xl font-medium">R$</span>
				<span className="text-5xl font-semibold leading-none">{plan.price}</span>
				{plan.cents ? (
					<span className="mb-5 text-2xl font-semibold leading-none">
						{plan.cents}
					</span>
				) : null}
				<span className="mb-1 text-lg text-slate-300">{plan.period}</span>
			</div>

			<ul className="mt-8 grid gap-4 text-sm text-slate-300">
				{plan.features.map((feature) => (
					<li key={feature} className="flex items-start gap-3">
						<Check className={`mt-0.5 size-4 shrink-0 stroke-[2.4] ${checkColor}`} />
						<span>{feature}</span>
					</li>
				))}
			</ul>

			<a
				href={plan.href}
				className={`mt-auto inline-flex h-12 items-center justify-center rounded-[0.8rem] border px-5 text-sm font-bold transition ${
					plan.highlighted
						? "border-transparent bg-[#7c4dff] text-white shadow-[0_18px_46px_rgba(124,77,255,0.35)] hover:bg-[#8b6cf4]"
						: "border-[#6ea33e]/55 bg-transparent text-slate-200 hover:bg-[#6ea33e]/10"
				}`}
			>
				{plan.cta}
			</a>
		</article>
	);
}

function PlansScreen() {
	return (
		<div className="min-h-screen bg-[#05090a] text-white">
			<div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_54%_6%,rgba(124,77,255,0.17),transparent_28%),radial-gradient(circle_at_8%_18%,rgba(116,224,189,0.08),transparent_26%)]" />
			<div className="relative mx-auto flex min-h-screen max-w-[86rem] flex-col px-5 py-6 sm:px-8 lg:px-12">
				<PublicHeader />

				<main className="flex flex-1 flex-col py-12 sm:py-14">
					<section className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(24rem,0.9fr)]">
						<div>
							<h1 className="max-w-[37rem] text-5xl font-semibold leading-[1.08] text-white sm:text-6xl">
								Escolha o plano que combina com{" "}
								<span className="text-[#7c4dff]">sua jornada.</span>
							</h1>
							<p className="mt-8 max-w-[31rem] text-lg font-normal leading-relaxed text-slate-400">
								Mais compreensão, mais conexão e mais idiomas na sua rotina.
							</p>
						</div>
						<LanguageIllustration />
					</section>

					<section className="mt-12 grid gap-5 lg:grid-cols-3">
						{plans.map((plan) => (
							<PlanCard key={plan.name} plan={plan} />
						))}
					</section>

					<section className="mt-10 grid gap-6 rounded-[1rem] border border-white/10 bg-[#151820]/82 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.3)] sm:grid-cols-3 lg:p-8">
						{safetyItems.map((item) => {
							const Icon = item.icon;

							return (
								<div key={item.title} className="flex gap-4">
									<span className="grid size-12 shrink-0 place-items-center rounded-[0.85rem] border border-[#8b6cf4]/35 text-[#9b7cff]">
										<Icon className="size-6 stroke-[2.1]" />
									</span>
									<div>
										<h2 className="text-sm font-bold text-[#9b7cff]">
											{item.title}
										</h2>
										<p className="mt-2 text-sm leading-relaxed text-slate-400">
											{item.text}
										</p>
									</div>
								</div>
							);
						})}
					</section>
				</main>

				<footer className="flex flex-col gap-7 pb-6 pt-4 text-slate-500">
					<div className="flex flex-wrap items-center justify-between gap-6">
						<a href="#landing" aria-label="LinguaSimp inicio" className="inline-flex">
							<img
								src="/linguasimp-logo-current.png"
								alt="LinguaSimp"
								className="block w-36 object-contain object-left"
							/>
						</a>
						<nav className="flex flex-wrap items-center justify-center gap-8 text-sm font-medium">
							<a href="#sobre" className="transition hover:text-white">
								Sobre
							</a>
							<a href="#planos" className="transition hover:text-white">
								Planos
							</a>
							<a href="#signup" className="transition hover:text-white">
								Começar
							</a>
						</nav>
						<div className="flex items-center gap-5">
							<Share2 className="size-5" />
							<Music2 className="size-5" />
						</div>
					</div>
					<p className="text-center text-sm">
						© 2026 LinguaSimp. Todos os direitos reservados.
					</p>
				</footer>
			</div>
		</div>
	);
}

export default PlansScreen;
