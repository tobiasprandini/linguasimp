import { ArrowRight, Play } from "lucide-react";

function LandingScreen() {
	const avatarStyles = [
		"bg-[#7c5ce8]",
		"bg-[#2c8b7d]",
		"bg-[#c58a43]",
		"bg-[#c66d7a]",
	];

	return (
		<div
			id="landing"
			className="relative h-screen overflow-hidden bg-[#050507] bg-no-repeat px-5 py-4 text-white sm:px-8 lg:px-16"
			style={{
				backgroundImage: "url('/landing-background.png')",
				backgroundPosition: "calc(100% - 1.5rem) 52%",
				backgroundSize: "min(68vw, 76rem) auto",
			}}
		>
			<div className="absolute inset-0 bg-gradient-to-r from-black via-black/82 via-39% to-black/5" />
			<div className="relative z-10 mx-auto flex h-full max-w-[108rem] flex-col overflow-visible">
				<header className="grid shrink-0 items-center gap-5 py-5 md:grid-cols-[auto_1fr]">
					<a href="#landing" aria-label="LinguaSimp inicio" className="inline-flex">
						<img
							src="/linguasimp-logo-current.png"
							alt="LinguaSimp"
							className="block w-52 object-contain object-left sm:w-60 lg:w-64"
						/>
					</a>

					<nav
						aria-label="Menu principal"
						className="flex items-center justify-end gap-10"
					>
						<a
							href="#sobre"
							className="hidden text-lg font-normal text-slate-300 transition hover:text-white sm:inline-flex"
						>
							Sobre
						</a>
						<a
							href="#planos"
							className="hidden text-lg font-normal text-slate-300 transition hover:text-white sm:inline-flex"
						>
							Planos
						</a>
						<a
							href="#login"
							aria-label="Entrar na sua conta"
							className="hidden text-lg font-normal text-slate-300 transition hover:text-white sm:inline-flex"
						>
							Entrar
						</a>
						<a
							href="#signup"
							className="ml-2 inline-flex h-14 items-center justify-center gap-4 rounded-[0.9rem] bg-[#6e46e8] px-7 text-lg font-normal text-white shadow-[0_20px_55px_rgba(110,70,232,0.35)] transition hover:-translate-y-0.5 hover:bg-[#8b6cf4]"
						>
							Começar grátis
							<ArrowRight className="size-6 stroke-[2.1]" />
						</a>
					</nav>
				</header>

				<main className="grid flex-1 items-center pb-10 pt-2">
					<section className="max-w-[40rem] -translate-y-1 text-left">
						<h1 className="max-w-[40rem] text-5xl font-semibold leading-[1.1] tracking-normal text-white sm:text-[3.25rem] lg:text-[3.7rem] xl:text-[4rem]">
							Aprenda idiomas
							<br />
							<span className="text-[#7c4dff]">por blocos</span>
						</h1>
						<p className="mt-8 max-w-[39rem] text-base font-normal leading-relaxed text-slate-400 sm:text-lg lg:text-xl">
							O LinguaSimp transforma frases reais em blocos de sentido.
							Você lê, escuta, traduz e marca o que já sabe, aprendendo com
							frases reais, bloco por bloco.
						</p>
						<div className="mt-9 flex flex-wrap items-center gap-5">
							<a
								href="#signup"
								className="inline-flex h-16 w-full max-w-[18rem] items-center justify-center gap-4 rounded-[1.1rem] bg-[#6e46e8] px-8 text-xl font-normal text-white shadow-[0_22px_55px_rgba(110,70,232,0.34)] transition hover:-translate-y-0.5 hover:bg-[#8b6cf4] sm:w-[18rem]"
							>
								Começar agora
								<ArrowRight className="size-6 stroke-[2.1]" />
							</a>
							<a
								href="#signup"
								className="inline-flex h-16 w-full max-w-[18rem] items-center justify-center gap-4 rounded-[1.1rem] border border-white/15 bg-black/25 px-8 text-xl font-normal text-slate-200 transition hover:border-[#8b6cf4]/55 hover:bg-white/5 sm:w-[18rem]"
							>
								<span className="grid size-10 place-items-center rounded-full border border-[#8b6cf4]/60 text-[#8b6cf4]">
									<Play className="ml-0.5 size-5 fill-current stroke-[2.1]" />
								</span>
								Ver como funciona
							</a>
						</div>

						<div className="mt-11 flex flex-wrap items-center gap-6">
							<div className="flex -space-x-4">
								{["A", "M", "R", "L"].map((initial, index) => (
									<span
										key={initial}
										className={`grid size-12 place-items-center rounded-full border-2 border-[#050507] text-base font-semibold text-white ${avatarStyles[index]}`}
									>
										{initial}
									</span>
								))}
							</div>
							<div>
								<p className="text-xl leading-none text-[#ffd438]">
									★★★★★
								</p>
								<p className="mt-2 text-base font-normal text-slate-400 lg:text-lg">
									+25 mil alunos já estão aprendendo
								</p>
							</div>
						</div>
					</section>

				</main>
			</div>
		</div>
	);
}

export default LandingScreen;
