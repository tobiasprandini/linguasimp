import {
	Globe2,
	Heart,
	MessageCircle,
	Music2,
	Send,
	Share2,
	Sparkles,
} from "lucide-react";
import PublicHeader from "./PublicHeader";

const values = [
	{
		icon: Globe2,
		title: "Conexão real",
		text: "Idiomas aproximam pessoas, histórias e culturas.",
	},
	{
		icon: MessageCircle,
		title: "Contexto sempre",
		text: "Aprendizado com frases reais, do jeito que as pessoas realmente falam.",
	},
	{
		icon: Heart,
		title: "Prazer no processo",
		text: "Uma experiência leve, sem pressão, feita para fazer parte do seu dia.",
	},
	{
		icon: Sparkles,
		title: "Curiosidade diária",
		text: "Pequenas descobertas que tornam o mundo mais interessante.",
	},
];

function AboutScreen() {
	return (
		<div className="min-h-screen bg-[#05090a] text-white">
			<div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_5%_12%,rgba(116,224,189,0.08),transparent_30%),radial-gradient(circle_at_76%_4%,rgba(124,77,255,0.13),transparent_30%)]" />
			<div className="relative mx-auto flex min-h-screen max-w-[86rem] flex-col px-5 py-6 sm:px-8 lg:px-12">
				<PublicHeader />

				<main className="flex flex-1 flex-col py-12 sm:py-14">
					<section className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(25rem,0.95fr)]">
						<div>
							<h1 className="max-w-[35rem] text-5xl font-semibold leading-[1.08] text-white sm:text-6xl">
								Sobre o LinguaSimp
							</h1>
							<h2 className="mt-7 max-w-[35rem] text-3xl font-semibold leading-tight text-[#7c4dff] sm:text-4xl">
								Feito para quem ama idiomas e o que eles revelam sobre o mundo.
							</h2>
							<div className="mt-8 grid max-w-[38rem] gap-6 text-base leading-relaxed text-slate-400 sm:text-lg">
								<p>
									Acreditamos que aprender um idioma é muito mais do que
									decorar palavras. É descobrir novas culturas, entender
									diferentes jeitos de ver a vida e se conectar com pessoas de
									verdade.
								</p>
								<p>
									O LinguaSimp nasceu desse propósito: criar uma experiência de
									aprendizado leve, real e prazerosa para quem transforma
									curiosidade em rotina.
								</p>
							</div>
						</div>

						<div className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#171922] shadow-[0_28px_90px_rgba(0,0,0,0.36)]">
							<img
								src="/about-hero-student.png"
								alt="Pessoa estudando idiomas perto da janela"
								className="aspect-[4/3] w-full object-cover"
							/>
						</div>
					</section>

					<section className="mt-16">
						<h2 className="text-3xl font-semibold text-white">O que nos move</h2>
						<div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
							{values.map((item, index) => {
								const Icon = item.icon;

								return (
									<div
										key={item.title}
										className={`pr-8 ${
											index > 0 ? "lg:border-l lg:border-white/10 lg:pl-10" : ""
										}`}
									>
										<Icon className="size-10 text-[#8b6cf4] stroke-[1.8]" />
										<h3 className="mt-7 text-base font-semibold text-white">
											{item.title}
										</h3>
										<p className="mt-4 text-sm leading-relaxed text-slate-400">
											{item.text}
										</p>
									</div>
								);
							})}
						</div>
					</section>

					<section className="relative mt-14 overflow-hidden rounded-[1rem] border border-white/10 bg-[#151820]/82 p-7 shadow-[0_24px_80px_rgba(0,0,0,0.3)] sm:p-10">
						<div className="max-w-[48rem]">
							<p className="text-6xl font-semibold leading-none text-[#7c4dff]">
								“
							</p>
							<p className="mt-1 text-3xl font-normal leading-snug text-white sm:text-4xl">
								Não é sobre falar perfeito.
								<br />
								É sobre entender mais. E ser entendido.
								<br />
								É sobre viver novas perspectivas.
							</p>
						</div>
						<div className="pointer-events-none absolute bottom-8 right-10 hidden text-[#8b6cf4] md:block">
							<svg
								viewBox="0 0 280 140"
								className="h-32 w-72"
								aria-hidden="true"
							>
								<path
									d="M20 90c50 40 95 21 122 18 27-3 35 29 69 6"
									fill="none"
									stroke="currentColor"
									strokeDasharray="9 11"
									strokeLinecap="round"
									strokeWidth="3"
								/>
								<circle
									cx="158"
									cy="107"
									r="12"
									fill="none"
									stroke="currentColor"
									strokeDasharray="7 8"
									strokeWidth="3"
								/>
								<Send className="translate-x-[190px] translate-y-[8px] rotate-12" size={76} strokeWidth={1.8} />
							</svg>
						</div>
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

export default AboutScreen;
