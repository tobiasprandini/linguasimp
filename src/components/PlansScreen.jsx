import { ArrowRight, Check, GraduationCap, ShieldCheck, Zap } from "lucide-react";

const plans = [
	{
		name: "Grátis",
		price: "R$ 0",
		description: "Para começar a estudar e testar o método.",
		features: ["Acesso ao estudo por blocos", "Revisão com cards", "Progresso local"],
		cta: "Começar grátis",
		href: "#signup",
		highlighted: false,
	},
	{
		name: "Pro",
		price: "Em breve",
		description: "Para quem quer estudar com mais recursos e rotina.",
		features: [
			"Mais idiomas e lições",
			"Revisão por escrita, fala e desenho",
			"Histórico de aprendizado",
		],
		cta: "Entrar na lista",
		href: "#signup",
		highlighted: true,
	},
	{
		name: "Escolas",
		price: "Sob consulta",
		description: "Para turmas, professores e projetos de idioma.",
		features: ["Painel para turmas", "Acompanhamento de alunos", "Conteúdo personalizado"],
		cta: "Falar sobre escolas",
		href: "#signup",
		highlighted: false,
	},
];

function PlansScreen() {
	return (
		<div className="min-h-screen bg-[#050507] text-white">
			<div className="relative mx-auto flex min-h-screen max-w-[86rem] flex-col px-5 py-6 sm:px-8 lg:px-12">
				<header className="flex shrink-0 flex-wrap items-center justify-between gap-5">
					<a href="#landing" aria-label="LinguaSimp inicio" className="inline-flex">
						<img
							src="/linguasimp-logo-current.png"
							alt="LinguaSimp"
							className="block w-52 object-contain object-left sm:w-60"
						/>
					</a>
					<nav className="flex items-center gap-6 text-base text-slate-300 sm:text-lg">
						<a href="#sobre" className="transition hover:text-white">
							Sobre
						</a>
						<a href="#planos" className="text-white">
							Planos
						</a>
						<a href="#login" className="transition hover:text-white">
							Entrar
						</a>
					</nav>
				</header>

				<main className="flex flex-1 flex-col py-14 sm:py-16">
					<section className="max-w-4xl">
						<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#74e0bd]">
							Planos
						</p>
						<h1 className="mt-5 text-5xl font-semibold leading-[1.05] text-white sm:text-6xl lg:text-7xl">
							Escolha o plano certo para sua rotina.
						</h1>
						<p className="mt-7 max-w-3xl text-lg leading-relaxed text-slate-400 sm:text-xl">
							Comece de graça e acompanhe a evolução do LinguaSimp conforme
							novos recursos forem liberados.
						</p>
					</section>

					<section className="mt-12 grid gap-5 lg:grid-cols-3">
						{plans.map((plan) => (
							<article
								key={plan.name}
								className={`flex min-h-[31rem] flex-col rounded-[1.5rem] border p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] ${
									plan.highlighted
										? "border-[#8b6cf4]/70 bg-[#1c1830]"
										: "border-white/10 bg-[#171a24]"
								}`}
							>
								<div className="flex items-start justify-between gap-4">
									<div>
										<h2 className="text-2xl font-semibold text-white">
											{plan.name}
										</h2>
										<p className="mt-3 text-sm leading-relaxed text-slate-400">
											{plan.description}
										</p>
									</div>
									{plan.highlighted ? (
										<span className="rounded-full bg-[#f4b63f] px-3 py-1 text-xs font-semibold text-[#141015]">
											Popular
										</span>
									) : null}
								</div>

								<p className="mt-8 text-4xl font-semibold text-white">
									{plan.price}
								</p>

								<ul className="mt-8 grid gap-4">
									{plan.features.map((feature) => (
										<li key={feature} className="flex items-start gap-3 text-slate-300">
											<span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[#24885b] text-white">
												<Check className="size-4 stroke-[2.4]" />
											</span>
											<span>{feature}</span>
										</li>
									))}
								</ul>

								<a
									href={plan.href}
									className={`mt-auto inline-flex h-13 items-center justify-center gap-3 rounded-[1rem] px-5 text-base font-semibold transition ${
										plan.highlighted
											? "bg-[#8b6cf4] text-[#070914] hover:bg-[#9b7cff]"
											: "border border-white/12 bg-white/[0.04] text-slate-200 hover:bg-white/[0.075]"
									}`}
								>
									{plan.cta}
									<ArrowRight className="size-5 stroke-[2.1]" />
								</a>
							</article>
						))}
					</section>

					<section className="mt-8 grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 sm:grid-cols-3 sm:p-6">
						{[
							{ icon: Zap, text: "Sem instalação complicada" },
							{ icon: ShieldCheck, text: "Conta com login seguro" },
							{ icon: GraduationCap, text: "Pensado para estudo diário" },
						].map((item) => {
							const Icon = item.icon;

							return (
								<div key={item.text} className="flex items-center gap-3 text-slate-300">
									<span className="grid size-10 place-items-center rounded-[0.85rem] bg-[#232736] text-[#ffd782]">
										<Icon className="size-5 stroke-[2.1]" />
									</span>
									<span className="font-semibold">{item.text}</span>
								</div>
							);
						})}
					</section>
				</main>
			</div>
		</div>
	);
}

export default PlansScreen;
