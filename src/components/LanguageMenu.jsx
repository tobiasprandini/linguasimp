const languages = [
	{
		id: "en",
		flag: "🇺🇸",
		name: "Inglês",
		description: "Inglês americano",
	},
	{
		id: "es",
		flag: "🇲🇽",
		name: "Espanhol",
		description: "Espanhol latino-americano",
	},
	{
		id: "fr",
		flag: "🇫🇷",
		name: "Francês",
		description: "Francês parisiense",
	},
	{
		id: "de",
		flag: "🇩🇪",
		name: "Alemão",
		description: "Alemão padrão",
	},
	{
		id: "it",
		flag: "🇮🇹",
		name: "Italiano",
		description: "Italiano padrão",
	},
	{
		id: "ru",
		flag: "🇷🇺",
		name: "Russo",
		description: "Russo padrão",
	},
	{
		id: "no",
		flag: "🇳🇴",
		name: "Norueguês",
		description: "Norueguês padrão",
	},
	{
		id: "el",
		flag: "🇬🇷",
		name: "Grego",
		description: "Grego moderno",
	},
	{
		id: "zh",
		flag: "🇨🇳",
		name: "Chinês",
		description: "Mandarim",
	},
	{
		id: "ja",
		flag: "🇯🇵",
		name: "Japonês",
		description: "Japonês padrão",
	},
];

function LanguageMenu({ onSelectLanguage, topSlot = null }) {
	return (
		<main className="min-h-screen bg-[#05080f] px-4 text-white sm:px-6">
			<div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center pb-[10svh] pt-10">
				<div className="text-center">
					<img
						src="/linguasimp-logo-current.png"
						alt="LinguaSimp"
						className="mx-auto block h-20 max-w-[24rem] object-contain sm:h-24 sm:max-w-[30rem]"
					/>
					<p className="mt-4 text-xl font-normal text-slate-500 sm:text-2xl">
						Aprenda naturalmente. Um bloco por vez.
					</p>
				</div>

				{topSlot ? <div className="mt-10 w-full">{topSlot}</div> : null}

				<section className="mt-20 w-full">
					<h2 className="text-center text-lg font-normal text-slate-500 sm:text-xl">
						Escolha um idioma para começar
					</h2>

					<div className="mt-7 grid gap-4 md:grid-cols-2">
						{languages.map((language) => (
							<button
								key={language.id}
								type="button"
								onClick={() => onSelectLanguage(language.id)}
								className="group flex min-h-24 w-full cursor-pointer items-center gap-6 rounded-[1rem] border border-white/10 bg-[#11141d] px-6 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#8b6cf4]/45 hover:bg-[#171a24]"
							>
								<span className="text-3xl leading-none" aria-hidden="true">
									{language.flag}
								</span>
								<span className="min-w-0">
									<span className="block text-xl font-normal leading-tight text-slate-100 transition group-hover:text-white sm:text-2xl">
										{language.name}
									</span>
									<span className="mt-2 block text-base font-normal leading-tight text-slate-500 sm:text-lg">
										{language.description}
									</span>
								</span>
							</button>
						))}
					</div>
				</section>
			</div>
		</main>
	);
}

export default LanguageMenu;
