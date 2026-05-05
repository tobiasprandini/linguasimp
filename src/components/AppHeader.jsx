import { useEffect, useMemo, useState } from "react";
import { LogOut } from "lucide-react";

const RECENT_LANGUAGES_STORAGE_KEY = "linguasimp-recent-languages";
const COLLAPSED_LANGUAGE_COUNT = 3;

const languages = [
	{
		id: "en",
		shortName: "Inglês",
	},
	{
		id: "es",
		shortName: "Espanhol",
	},
	{
		id: "fr",
		shortName: "Francês",
	},
	{
		id: "de",
		shortName: "Alemão",
	},
	{
		id: "it",
		shortName: "Italiano",
	},
	{
		id: "ru",
		shortName: "Russo",
	},
	{
		id: "no",
		shortName: "Norueguês",
	},
	{
		id: "el",
		shortName: "Grego",
	},
	{
		id: "zh",
		shortName: "Chinês",
	},
	{
		id: "ja",
		shortName: "Japonês",
	},
];

const legacyLanguageAliases = {
	jp: "ja",
	cn: "zh",
	gr: "el",
};

function normalizeLanguageId(languageId) {
	return legacyLanguageAliases[languageId] ?? languageId;
}

function loadRecentLanguages(selectedLanguage) {
	const normalizedSelectedLanguage = normalizeLanguageId(selectedLanguage);
	const fallbackLanguages = [
		normalizedSelectedLanguage,
		"en",
		"es",
		"fr",
	].filter(Boolean);

	if (typeof window === "undefined") {
		return fallbackLanguages;
	}

	try {
		const storedLanguages = JSON.parse(
			window.localStorage.getItem(RECENT_LANGUAGES_STORAGE_KEY) ?? "[]",
		);

		return Array.isArray(storedLanguages)
			? [...storedLanguages, ...fallbackLanguages]
			: fallbackLanguages;
	} catch {
		return fallbackLanguages;
	}
}

function buildRecentLanguages(selectedLanguage, currentRecentLanguages = []) {
	const availableLanguageIds = new Set(languages.map((language) => language.id));
	const seenLanguageIds = new Set();

	return [
		normalizeLanguageId(selectedLanguage),
		...currentRecentLanguages.map(normalizeLanguageId),
		"en",
		"es",
		"fr",
	]
		.filter((languageId) => {
			if (!availableLanguageIds.has(languageId) || seenLanguageIds.has(languageId)) {
				return false;
			}

			seenLanguageIds.add(languageId);
			return true;
		})
		.slice(0, COLLAPSED_LANGUAGE_COUNT);
}

function LanguageFlag({ language }) {
	if (language.id === "en") {
		return (
			<span className="relative size-6 overflow-hidden rounded-full bg-white" aria-hidden="true">
				<span className="absolute inset-x-0 top-0 h-[14%] bg-red-500" />
				<span className="absolute inset-x-0 top-[28%] h-[14%] bg-red-500" />
				<span className="absolute inset-x-0 top-[56%] h-[14%] bg-red-500" />
				<span className="absolute inset-x-0 bottom-0 h-[16%] bg-red-500" />
				<span className="absolute left-0 top-0 h-[54%] w-[54%] bg-blue-700" />
			</span>
		);
	}

	if (language.id === "es") {
		return (
			<span className="relative size-6 overflow-hidden rounded-full" aria-hidden="true">
				<span className="absolute inset-x-0 top-0 h-1/3 bg-red-500" />
				<span className="absolute inset-x-0 top-1/3 h-1/3 bg-yellow-300" />
				<span className="absolute inset-x-0 bottom-0 h-1/3 bg-red-500" />
			</span>
		);
	}

	if (language.id === "fr") {
		return (
			<span className="relative size-6 overflow-hidden rounded-full" aria-hidden="true">
				<span className="absolute inset-y-0 left-0 w-1/3 bg-blue-600" />
				<span className="absolute inset-y-0 left-1/3 w-1/3 bg-white" />
				<span className="absolute inset-y-0 right-0 w-1/3 bg-red-500" />
			</span>
		);
	}

	if (language.id === "de") {
		return (
			<span className="relative size-6 overflow-hidden rounded-full" aria-hidden="true">
				<span className="absolute inset-x-0 top-0 h-1/3 bg-black" />
				<span className="absolute inset-x-0 top-1/3 h-1/3 bg-red-600" />
				<span className="absolute inset-x-0 bottom-0 h-1/3 bg-yellow-400" />
			</span>
		);
	}

	if (language.id === "it") {
		return (
			<span className="relative size-6 overflow-hidden rounded-full" aria-hidden="true">
				<span className="absolute inset-y-0 left-0 w-1/3 bg-emerald-600" />
				<span className="absolute inset-y-0 left-1/3 w-1/3 bg-white" />
				<span className="absolute inset-y-0 right-0 w-1/3 bg-red-600" />
			</span>
		);
	}

	if (language.id === "ru") {
		return (
			<span className="relative size-6 overflow-hidden rounded-full" aria-hidden="true">
				<span className="absolute inset-x-0 top-0 h-1/3 bg-white" />
				<span className="absolute inset-x-0 top-1/3 h-1/3 bg-blue-600" />
				<span className="absolute inset-x-0 bottom-0 h-1/3 bg-red-600" />
			</span>
		);
	}

	if (language.id === "no") {
		return (
			<span className="relative size-6 overflow-hidden rounded-full bg-red-600" aria-hidden="true">
				<span className="absolute inset-y-0 left-[30%] w-[28%] bg-white" />
				<span className="absolute inset-x-0 top-[34%] h-[28%] bg-white" />
				<span className="absolute inset-y-0 left-[38%] w-[12%] bg-blue-800" />
				<span className="absolute inset-x-0 top-[42%] h-[12%] bg-blue-800" />
			</span>
		);
	}

	if (language.id === "el") {
		return (
			<span className="relative size-6 overflow-hidden rounded-full bg-white" aria-hidden="true">
				<span className="absolute inset-x-0 top-0 h-[11%] bg-blue-600" />
				<span className="absolute inset-x-0 top-[22%] h-[11%] bg-blue-600" />
				<span className="absolute inset-x-0 top-[44%] h-[11%] bg-blue-600" />
				<span className="absolute inset-x-0 top-[66%] h-[11%] bg-blue-600" />
				<span className="absolute inset-x-0 bottom-0 h-[11%] bg-blue-600" />
				<span className="absolute left-0 top-0 size-[56%] bg-blue-600" />
				<span className="absolute left-[22%] top-0 h-[56%] w-[12%] bg-white" />
				<span className="absolute left-0 top-[22%] h-[12%] w-[56%] bg-white" />
			</span>
		);
	}

	if (language.id === "zh") {
		return (
			<span className="relative size-6 overflow-hidden rounded-full bg-red-600" aria-hidden="true">
				<span className="absolute left-[18%] top-[16%] size-1.5 rotate-45 bg-yellow-300" />
			</span>
		);
	}

	return (
		<span className="relative size-6 overflow-hidden rounded-full bg-white" aria-hidden="true">
			<span className="absolute left-1/2 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600" />
		</span>
	);
}

function getFirstName(user) {
	const metadataName =
		user?.user_metadata?.name || user?.user_metadata?.full_name || "";
	const emailName = user?.email?.split("@")[0] ?? "";
	return (metadataName || emailName || "Estudante").split(" ")[0];
}

function LanguageSwitcher({ selectedLanguage, onSelectLanguage }) {
	const normalizedSelectedLanguage = normalizeLanguageId(selectedLanguage);
	const [isExpanded, setIsExpanded] = useState(false);
	const [recentLanguageIds, setRecentLanguageIds] = useState(() =>
		buildRecentLanguages(
			normalizedSelectedLanguage,
			loadRecentLanguages(normalizedSelectedLanguage),
		),
	);
	const collapsedLanguageIds = useMemo(
		() => buildRecentLanguages(normalizedSelectedLanguage, recentLanguageIds),
		[normalizedSelectedLanguage, recentLanguageIds],
	);
	const visibleLanguages = useMemo(() => {
		if (isExpanded) {
			return languages;
		}

		const recentLanguageIdSet = new Set(collapsedLanguageIds);
		return languages.filter((language) => recentLanguageIdSet.has(language.id));
	}, [collapsedLanguageIds, isExpanded]);
	const hiddenLanguageCount = Math.max(
		languages.length - visibleLanguages.length,
		0,
	);

	useEffect(() => {
		if (typeof window !== "undefined") {
			window.localStorage.setItem(
				RECENT_LANGUAGES_STORAGE_KEY,
				JSON.stringify(collapsedLanguageIds),
			);
		}
	}, [collapsedLanguageIds]);

	return (
		<div className="flex min-h-14 max-w-[min(100%,30rem)] items-center gap-2 overflow-x-auto rounded-full border border-white/10 bg-[#1d1d25] px-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
			{visibleLanguages.map((language) => (
				<button
					key={language.id}
					type="button"
					onClick={() => {
						const nextRecentLanguageIds = buildRecentLanguages(
							language.id,
							recentLanguageIds,
						);

						setRecentLanguageIds(nextRecentLanguageIds);
						onSelectLanguage?.(language.id);
						setIsExpanded(false);
					}}
					className={`flex shrink-0 cursor-pointer items-center justify-center rounded-full transition ${
						normalizedSelectedLanguage === language.id
							? "size-12 bg-[#8b6cf4] shadow-[0_0_24px_rgba(139,108,244,0.35)]"
							: "size-10 hover:bg-white/10"
					}`}
					aria-label={language.shortName}
				>
					<LanguageFlag language={language} />
				</button>
			))}
			{hiddenLanguageCount > 0 ? (
				<button
					type="button"
					onClick={() => setIsExpanded((current) => !current)}
					className={`flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full text-sm font-semibold text-white transition ${
						isExpanded
							? "bg-[#8b6cf4] shadow-[0_0_24px_rgba(139,108,244,0.35)]"
							: "bg-white/25 hover:bg-white/30"
					}`}
					aria-label={isExpanded ? "Recolher idiomas" : "Mostrar idiomas"}
					aria-expanded={isExpanded}
				>
					{isExpanded ? "−" : `+${hiddenLanguageCount}`}
				</button>
			) : null}
		</div>
	);
}

function NavLink({ href, isActive, children }) {
	return (
		<a
			href={href}
			className={`rounded-full px-5 py-3 transition ${
				isActive
					? "bg-[#8b6cf4] text-white"
					: "text-slate-400 hover:text-white"
			}`}
		>
			{children}
		</a>
	);
}

function AppHeader({
	user,
	activePage = "dashboard",
	learningLanguage = "en",
	onSelectLanguage,
	onSignOut,
}) {
	const firstName = getFirstName(user);

	return (
		<header className="grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
			<nav className="flex w-full rounded-full bg-white/[0.06] p-1 text-sm font-normal sm:w-fit sm:text-base">
				<NavLink
					href="#dashboard"
					isActive={activePage === "dashboard"}
				>
					Dashboard
				</NavLink>
				<NavLink href="#study" isActive={activePage === "study"}>
					Estudo
				</NavLink>
				<NavLink
					href="#flashcards"
					isActive={activePage === "flashcards"}
				>
					Revisão
				</NavLink>
			</nav>

			<a
				href="#dashboard"
				className="justify-self-center"
				aria-label="Linguasimp dashboard"
			>
				<img
					src="/linguasimp-logo-current.png"
					alt="LinguaSimp"
					className="block h-14 max-w-[16rem] object-contain sm:h-16 sm:max-w-[20rem]"
				/>
			</a>

			<div className="flex items-center justify-between gap-4 lg:justify-end">
				<LanguageSwitcher
					selectedLanguage={learningLanguage}
					onSelectLanguage={onSelectLanguage}
				/>
				<a
					href="#profile"
					className="text-right transition hover:opacity-85"
				>
					<p className="text-sm font-semibold text-white sm:text-base">
						{firstName}
					</p>
					<p className="text-xs font-normal text-slate-500">
						Estudante
					</p>
				</a>
				<button
					type="button"
					onClick={onSignOut}
					className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-white/[0.06] text-slate-400 transition hover:text-white"
					aria-label="Sair da conta"
				>
					<LogOut className="size-4 stroke-[2.1]" />
				</button>
			</div>
		</header>
	);
}

export default AppHeader;
