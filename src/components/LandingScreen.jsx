import { ArrowRight, Play } from "lucide-react";
import PublicHeader from "./PublicHeader";

function LandingScreen() {
	return (
		<div
			id="landing"
			className="relative h-screen overflow-hidden bg-[#050507] px-5 py-4 text-white sm:px-8 lg:px-16"
		>
			<div className="relative z-10 mx-auto flex h-full max-w-[108rem] flex-col overflow-visible">
				<PublicHeader />

				<main className="grid flex-1 place-items-center pb-10 pt-2">
					<section className="mx-auto max-w-[48rem] -translate-y-3 text-center">
						<h1 className="mx-auto max-w-[44rem] text-5xl font-semibold leading-[1.1] tracking-normal text-white sm:text-[3.25rem] lg:text-[3.7rem] xl:text-[4rem]">
							Aprenda idiomas
							<br />
							<span className="text-[#7c4dff]">por blocos</span>
						</h1>
						<p className="mx-auto mt-8 max-w-[42rem] text-base font-normal leading-relaxed text-slate-400 sm:text-lg lg:text-xl">
							O LinguaSimp transforma frases reais em blocos de sentido.
							Você lê, escuta, traduz e marca o que já sabe, aprendendo com
							frases reais, bloco por bloco.
						</p>
						<div className="mt-9 flex flex-wrap items-center justify-center gap-5">
							<a
								href="#signup"
								className="inline-flex h-16 w-full max-w-[21rem] items-center justify-center gap-4 rounded-[1.1rem] bg-[#6e46e8] px-7 text-lg font-normal text-white shadow-[0_22px_55px_rgba(110,70,232,0.34)] transition hover:-translate-y-0.5 hover:bg-[#8b6cf4] sm:w-[21rem] sm:text-xl"
							>
								<span className="whitespace-nowrap">Começar agora</span>
								<ArrowRight className="size-6 stroke-[2.1]" />
							</a>
							<a
								href="#signup"
								className="inline-flex h-16 w-full max-w-[21rem] items-center justify-center gap-4 rounded-[1.1rem] border border-white/15 bg-black/25 px-7 text-lg font-normal text-slate-200 transition hover:border-[#8b6cf4]/55 hover:bg-white/5 sm:w-[21rem] sm:text-xl"
							>
								<span className="grid size-10 place-items-center rounded-full border border-[#8b6cf4]/60 text-[#8b6cf4]">
									<Play className="ml-0.5 size-5 fill-current stroke-[2.1]" />
								</span>
								<span className="whitespace-nowrap">Ver como funciona</span>
							</a>
						</div>

					</section>

				</main>
			</div>
		</div>
	);
}

export default LandingScreen;
