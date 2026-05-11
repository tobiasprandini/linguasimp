import { ArrowRight } from "lucide-react";

function PublicHeader() {
	return (
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
	);
}

export default PublicHeader;
