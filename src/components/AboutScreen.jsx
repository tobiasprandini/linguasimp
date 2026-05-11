import { ArrowRight, Blocks, Headphones, Sparkles } from "lucide-react";
import PublicHeader from "./PublicHeader";

function AboutScreen() {
	return (
		<div className="min-h-screen overflow-hidden bg-[#050507] text-white">
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(124,92,232,0.18),transparent_34%),linear-gradient(180deg,rgba(5,5,7,0)_0%,#050507_72%)]" />
			<div className="relative mx-auto flex min-h-screen max-w-[86rem] flex-col px-5 py-6 sm:px-8 lg:px-12">
				<PublicHeader />

				<main className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,34rem)]">
					<section>
						<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ffd782]">
							Sobre o LinguaSimp
						</p>
						<h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.05] text-white sm:text-6xl lg:text-7xl">
							Um jeito mais direto de entender frases reais.
						</h1>
						<p className="mt-7 max-w-3xl text-lg leading-relaxed text-slate-400 sm:text-xl">
							O LinguaSimp quebra cada frase em blocos de sentido para você
							entender o idioma como ele aparece de verdade: ouvindo,
							comparando, marcando o que já sabe e revisando o que ainda está
							em construção.
						</p>
						<div className="mt-9 flex flex-wrap gap-4">
							<a
								href="#signup"
								className="inline-flex h-14 items-center justify-center gap-3 rounded-[1rem] bg-[#7c5ce8] px-7 text-base font-semibold text-white transition hover:bg-[#8b6cf4]"
							>
								Começar grátis
								<ArrowRight className="size-5 stroke-[2.1]" />
							</a>
							<a
								href="#planos"
								className="inline-flex h-14 items-center justify-center rounded-[1rem] border border-white/12 bg-white/[0.04] px-7 text-base font-semibold text-slate-200 transition hover:bg-white/[0.075]"
							>
								Ver planos
							</a>
						</div>
					</section>

					<section className="rounded-[1.5rem] border border-white/10 bg-[#171a24]/90 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.34)] sm:p-6">
						<img
							src="/landing-background.png"
							alt="Estudante usando o LinguaSimp"
							className="aspect-[4/3] w-full rounded-[1rem] object-cover object-right"
						/>
						<div className="mt-5 grid gap-3">
							{[
								{
									icon: Blocks,
									title: "Blocos de sentido",
									text: "Palavras e expressões aparecem dentro da frase, não isoladas.",
								},
								{
									icon: Headphones,
									title: "Escuta no contexto",
									text: "Áudios ajudam a ligar significado, som e memória.",
								},
								{
									icon: Sparkles,
									title: "Revisão ativa",
									text: "Cards, escrita, fala e desenho mantêm o estudo prático.",
								},
							].map((item) => {
								const Icon = item.icon;

								return (
									<div
										key={item.title}
										className="flex gap-4 rounded-[1rem] bg-white/[0.045] p-4"
									>
										<span className="grid size-11 shrink-0 place-items-center rounded-[0.85rem] bg-[#f4b63f] text-[#141015]">
											<Icon className="size-5 stroke-[2.2]" />
										</span>
										<div>
											<h2 className="text-base font-semibold text-white">
												{item.title}
											</h2>
											<p className="mt-1 text-sm leading-relaxed text-slate-400">
												{item.text}
											</p>
										</div>
									</div>
								);
							})}
						</div>
					</section>
				</main>
			</div>
		</div>
	);
}

export default AboutScreen;
