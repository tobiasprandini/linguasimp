import { useEffect, useState } from "react";
import {
	Bell,
	CalendarDays,
	Camera,
	Check,
	ChevronRight,
	Clock3,
	Flame,
	Globe2,
	Headphones,
	Lock,
	MessageSquare,
	Pencil,
	Plus,
	RotateCcw,
	Save,
	Settings,
	Star,
	Target,
	Volume2,
} from "lucide-react";
import AppHeader from "./AppHeader";
import { supabase } from "@/lib/supabase";

const languageMeta = {
	en: { name: "Inglês", level: "Avançado", progress: 80 },
	es: { name: "Espanhol", level: "Intermediário", progress: 45 },
	fr: { name: "Francês", level: "Intermediário", progress: 52 },
	de: { name: "Alemão", level: "Intermediário", progress: 38 },
	it: { name: "Italiano", level: "Intermediário", progress: 42 },
	ru: { name: "Russo", level: "Intermediário", progress: 33 },
	no: { name: "Norueguês", level: "Intermediário", progress: 36 },
	el: { name: "Grego", level: "Intermediário", progress: 29 },
	zh: { name: "Chinês", level: "Intermediário", progress: 41 },
	ja: { name: "Japonês", level: "Intermediário", progress: 67 },
};

function getUserDisplayName(user) {
	return (
		user?.user_metadata?.name ??
		user?.user_metadata?.full_name ??
		user?.email?.split("@")[0] ??
		"Você"
	);
}

function getUserAvatarUrl(user) {
	return user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? "";
}

function getMemberSince(user) {
	const createdAt = user?.created_at ? new Date(user.created_at) : null;

	if (!createdAt || Number.isNaN(createdAt.getTime())) {
		return "março de 2024";
	}

	return createdAt.toLocaleDateString("pt-BR", {
		month: "long",
		year: "numeric",
	});
}

function readImageAsDataUrl(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = () => {
			const image = new Image();

			image.onload = () => {
				const maxSize = 512;
				const scale = Math.min(
					1,
					maxSize / Math.max(image.width, image.height),
				);
				const canvas = document.createElement("canvas");
				canvas.width = Math.max(1, Math.round(image.width * scale));
				canvas.height = Math.max(1, Math.round(image.height * scale));
				const context = canvas.getContext("2d");

				context.drawImage(image, 0, 0, canvas.width, canvas.height);
				resolve(canvas.toDataURL("image/jpeg", 0.86));
			};

			image.onerror = () => reject(new Error("Nao foi possivel ler a imagem."));
			image.src = reader.result;
		};

		reader.onerror = () => reject(new Error("Nao foi possivel carregar a imagem."));
		reader.readAsDataURL(file);
	});
}

function Flag({ languageId, className = "size-12" }) {
	if (languageId === "en") {
		return (
			<span className={`relative overflow-hidden rounded-full bg-white ${className}`}>
				<span className="absolute inset-x-0 top-0 h-[14%] bg-red-500" />
				<span className="absolute inset-x-0 top-[28%] h-[14%] bg-red-500" />
				<span className="absolute inset-x-0 top-[56%] h-[14%] bg-red-500" />
				<span className="absolute inset-x-0 bottom-0 h-[16%] bg-red-500" />
				<span className="absolute left-0 top-0 h-[54%] w-[54%] bg-blue-700" />
			</span>
		);
	}

	if (languageId === "es") {
		return (
			<span className={`relative overflow-hidden rounded-full ${className}`}>
				<span className="absolute inset-x-0 top-0 h-1/3 bg-red-500" />
				<span className="absolute inset-x-0 top-1/3 h-1/3 bg-yellow-300" />
				<span className="absolute inset-x-0 bottom-0 h-1/3 bg-red-500" />
			</span>
		);
	}

	if (languageId === "de") {
		return (
			<span className={`relative overflow-hidden rounded-full ${className}`}>
				<span className="absolute inset-x-0 top-0 h-1/3 bg-black" />
				<span className="absolute inset-x-0 top-1/3 h-1/3 bg-red-600" />
				<span className="absolute inset-x-0 bottom-0 h-1/3 bg-yellow-400" />
			</span>
		);
	}

	if (languageId === "zh") {
		return (
			<span className={`relative overflow-hidden rounded-full bg-red-600 ${className}`}>
				<span className="absolute left-[18%] top-[16%] size-2 rotate-45 bg-yellow-300" />
			</span>
		);
	}

	return (
		<span className={`relative overflow-hidden rounded-full bg-white ${className}`}>
			<span className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600" />
		</span>
	);
}

function ProfileHeaderCard({
	user,
	learningLanguage,
	onUserUpdated,
}) {
	const displayName = getUserDisplayName(user);
	const avatarUrl = getUserAvatarUrl(user);
	const languageName = languageMeta[learningLanguage]?.name ?? "Japonês";
	const [name, setName] = useState(displayName);
	const [avatarPreview, setAvatarPreview] = useState(avatarUrl);
	const [message, setMessage] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [isEditing, setIsEditing] = useState(false);

	useEffect(() => {
		setName(displayName);
		setAvatarPreview(avatarUrl);
	}, [avatarUrl, displayName]);

	async function handleAvatarChange(event) {
		const file = event.target.files?.[0];

		if (!file) {
			return;
		}

		try {
			setMessage("");
			const nextAvatarUrl = await readImageAsDataUrl(file);
			setAvatarPreview(nextAvatarUrl);
			setIsEditing(true);
		} catch (error) {
			setMessage(error.message);
		}
	}

	async function handleSaveProfile(event) {
		event.preventDefault();

		const trimmedName = name.trim();

		if (!trimmedName) {
			setMessage("Informe um nome.");
			return;
		}

		setIsSaving(true);
		setMessage("");

		try {
			const { data, error } = await supabase.auth.updateUser({
				data: {
					...(user?.user_metadata ?? {}),
					name: trimmedName,
					full_name: trimmedName,
					avatar_url: avatarPreview || null,
				},
			});

			if (error) {
				throw error;
			}

			onUserUpdated?.(data.user);
			setIsEditing(false);
			setMessage("Perfil atualizado.");
		} catch (error) {
			setMessage(error.message);
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<section className="rounded-[1.5rem] bg-[#171922]/88 p-7 shadow-[0_28px_90px_rgba(0,0,0,0.28)] ring-1 ring-white/5">
			<form
				onSubmit={handleSaveProfile}
				className="grid gap-7 md:grid-cols-[15rem_minmax(0,1fr)_12rem] md:items-center"
			>
				<label className="relative mx-auto block cursor-pointer md:mx-0">
					<span className="relative flex size-40 items-center justify-center overflow-hidden rounded-full bg-slate-700 text-6xl font-semibold text-white">
						{avatarPreview ? (
							<img
								src={avatarPreview}
								alt={displayName}
								className="h-full w-full object-cover"
							/>
						) : (
							displayName.slice(0, 1).toUpperCase()
						)}
					</span>
					<span className="absolute bottom-0 right-2 grid size-14 place-items-center rounded-full bg-[#8b6cf4] text-white shadow-[0_14px_38px_rgba(139,108,244,0.35)]">
						<Camera className="size-6 stroke-[2]" />
					</span>
					<input
						type="file"
						accept="image/*"
						onChange={handleAvatarChange}
						className="sr-only"
					/>
				</label>

				<div className="min-w-0 text-center md:text-left">
					<div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
						{isEditing ? (
							<input
								value={name}
								onChange={(event) => setName(event.target.value)}
								className="min-w-0 rounded-[1rem] border border-white/10 bg-black/20 px-4 py-2 text-3xl font-semibold text-white outline-none focus:border-[#8b6cf4]/65"
							/>
						) : (
							<h2 className="text-4xl font-semibold text-white">
								{displayName}
							</h2>
						)}
						<span className="rounded-full bg-[#8b6cf4]/14 px-4 py-2 text-base font-semibold text-[#a98cff]">
							Estudante
						</span>
					</div>
					<div className="mt-7 grid gap-4 text-lg text-slate-400">
						<p className="flex items-center justify-center gap-4 md:justify-start">
							<CalendarDays className="size-6 text-[#8b6cf4]" />
							Membro desde {getMemberSince(user)}
						</p>
						<p className="flex items-center justify-center gap-4 md:justify-start">
							<Globe2 className="size-6 text-[#8b6cf4]" />
							Foco atual: {languageName}
						</p>
						<p className="flex items-center justify-center gap-4 md:justify-start">
							<Target className="size-6 text-[#8b6cf4]" />
							Meta: Fluência
						</p>
					</div>
					{message ? (
						<p className="mt-4 text-sm font-medium text-[#a98cff]">{message}</p>
					) : null}
				</div>

				<div className="flex justify-center md:justify-end">
					{isEditing ? (
						<button
							type="submit"
							disabled={isSaving}
							className="inline-flex h-14 cursor-pointer items-center gap-3 rounded-[0.9rem] bg-[#8b6cf4] px-6 text-base font-semibold text-white transition hover:bg-[#9b7cff] disabled:cursor-not-allowed disabled:opacity-55"
						>
							<Save className="size-5" />
							{isSaving ? "Salvando..." : "Salvar"}
						</button>
					) : (
						<button
							type="button"
							onClick={() => setIsEditing(true)}
							className="inline-flex h-14 cursor-pointer items-center gap-3 rounded-[0.9rem] bg-white/[0.045] px-6 text-base font-semibold text-white transition hover:bg-white/10"
						>
							<Pencil className="size-5" />
							Editar perfil
						</button>
					)}
				</div>
			</form>
		</section>
	);
}

function LanguageCard({ languageId, progress, level }) {
	const meta = languageMeta[languageId] ?? languageMeta.ja;

	return (
		<div className="rounded-[1.25rem] bg-[#171922]/88 p-7 shadow-[0_20px_70px_rgba(0,0,0,0.24)] ring-1 ring-white/5">
			<div className="flex items-center gap-4">
				<Flag languageId={languageId} />
				<h3 className="text-xl font-semibold text-white">{meta.name}</h3>
			</div>
			<div className="mt-7 flex items-center gap-4">
				<div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10">
					<div
						className="h-full rounded-full bg-[#8b6cf4]"
						style={{ width: `${progress}%` }}
					/>
				</div>
				<span className="text-xl font-semibold text-slate-200">{progress}%</span>
			</div>
			<p className="mt-7 text-lg text-slate-400">{level}</p>
		</div>
	);
}

function StreakCard() {
	const days = ["S", "T", "Q", "Q", "S", "S", "D"];

	return (
		<section className="rounded-[1.5rem] bg-[#171922]/88 p-8 shadow-[0_28px_90px_rgba(0,0,0,0.28)] ring-1 ring-white/5">
			<h2 className="text-2xl font-semibold text-white">Sequência atual</h2>
			<div className="mt-8 flex items-center gap-7">
				<span className="text-6xl">🔥</span>
				<div>
					<p className="text-5xl font-semibold text-white">7</p>
					<p className="text-xl text-slate-300">dias seguidos</p>
				</div>
			</div>
			<div className="mt-9 grid grid-cols-7 gap-3 text-center">
				{days.map((day, index) => {
					const isToday = index === days.length - 1;

					return (
						<div key={`${day}-${index}`} className="grid gap-3">
							<span
								className={`grid size-10 place-items-center justify-self-center rounded-full ${
									isToday
										? "bg-[#f59e0b]/12 text-[#f59e0b] ring-2 ring-[#f59e0b]"
										: "bg-white/8 text-[#b8a6ff]"
								}`}
							>
								{isToday ? <Flame className="size-5" /> : <Check className="size-5" />}
							</span>
							<span className="text-sm font-medium text-slate-400">{day}</span>
						</div>
					);
				})}
			</div>
			<p className="mt-8 text-xl font-semibold text-[#a98cff]">
				Melhor sequência: 15 dias
			</p>
		</section>
	);
}

function StatsCard({ knownCount, learningCount }) {
	const learnedSentences = Math.max(knownCount + learningCount, 0);
	const stats = [
		{ icon: Clock3, label: "Tempo de estudo", value: "42h 30m" },
		{ icon: MessageSquare, label: "Frases aprendidas", value: learnedSentences.toLocaleString("pt-BR") },
		{ icon: Target, label: "Cards revisados", value: Math.max(learningCount * 3, 0).toLocaleString("pt-BR") },
		{ icon: Volume2, label: "Áudios ouvidos", value: Math.max(knownCount + 100, 0).toLocaleString("pt-BR") },
		{ icon: Globe2, label: "Idiomas estudados", value: "4" },
	];

	return (
		<section className="rounded-[1.5rem] bg-[#171922]/88 p-8 shadow-[0_28px_90px_rgba(0,0,0,0.28)] ring-1 ring-white/5">
			<div className="flex items-center justify-between gap-4">
				<h2 className="text-2xl font-semibold text-white">Estatísticas gerais</h2>
				<a href="#dashboard" className="text-lg font-semibold text-[#a98cff]">
					Ver todas
				</a>
			</div>
			<div className="mt-7 grid gap-5">
				{stats.map((item) => {
					const Icon = item.icon;

					return (
						<div key={item.label} className="flex items-center justify-between gap-5">
							<div className="flex items-center gap-4 text-lg text-slate-400">
								<Icon className="size-6 text-[#a98cff]" />
								<span>{item.label}</span>
							</div>
							<span className="text-lg font-semibold text-white">{item.value}</span>
						</div>
					);
				})}
			</div>
		</section>
	);
}

function AchievementBadge({ icon, title, text, color }) {
	return (
		<div className="text-center">
			<div
				className={`mx-auto grid size-24 place-items-center rounded-[1.3rem] border-4 bg-black/15 ${color}`}
				style={{ clipPath: "polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0 50%)" }}
			>
				{icon}
			</div>
			<h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
			<p className="mt-2 text-base leading-snug text-slate-400">{text}</p>
		</div>
	);
}

function AchievementsCard() {
	return (
		<section className="rounded-[1.5rem] bg-[#171922]/88 p-8 shadow-[0_28px_90px_rgba(0,0,0,0.28)] ring-1 ring-white/5">
			<div className="flex items-center justify-between gap-4">
				<h2 className="text-2xl font-semibold text-white">Conquistas</h2>
				<a href="#dashboard" className="text-lg font-semibold text-[#a98cff]">
					Ver todas
				</a>
			</div>
			<div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
				<AchievementBadge
					icon={<span className="text-4xl font-semibold text-[#a98cff]">7</span>}
					title="Uma semana"
					text="Estudou 7 dias seguidos"
					color="border-[#8b6cf4] text-[#8b6cf4]"
				/>
				<AchievementBadge
					icon={<Headphones className="size-11 text-[#65c466]" />}
					title="Ouvinte"
					text="Ouviu 100 áudios"
					color="border-[#65c466] text-[#65c466]"
				/>
				<AchievementBadge
					icon={<MessageSquare className="size-11 text-[#88b8ff]" />}
					title="Comunicador"
					text="Aprendeu 500 frases"
					color="border-[#88b8ff] text-[#88b8ff]"
				/>
				<AchievementBadge
					icon={<Flame className="size-11 text-[#f59e0b]" />}
					title="Foco total"
					text="Estudou 10 dias seguidos"
					color="border-[#f59e0b] text-[#f59e0b]"
				/>
				<AchievementBadge
					icon={<Star className="size-11 fill-current text-[#a98cff]" />}
					title="Explorador"
					text="Explorou 5 idiomas"
					color="border-[#8b6cf4] text-[#8b6cf4]"
				/>
			</div>
		</section>
	);
}

function SettingsCard({ onResetProgress }) {
	function handleResetProgressClick() {
		const shouldReset = window.confirm(
			"Tem certeza que deseja zerar todo o seu progresso?",
		);

		if (shouldReset) {
			onResetProgress?.();
		}
	}

	const settings = [
		{ icon: Settings, label: "Preferências de estudo" },
		{ icon: Bell, label: "Notificações" },
		{ icon: Lock, label: "Privacidade" },
		{ icon: Globe2, label: "Idioma do app", value: "Português" },
	];

	return (
		<section className="rounded-[1.5rem] bg-[#171922]/88 p-8 shadow-[0_28px_90px_rgba(0,0,0,0.28)] ring-1 ring-white/5">
			<h2 className="text-2xl font-semibold text-white">Configurações</h2>
			<div className="mt-7 grid gap-5">
				{settings.map((item) => {
					const Icon = item.icon;

					return (
						<button
							key={item.label}
							type="button"
							className="flex cursor-pointer items-center justify-between gap-4 text-left text-lg text-slate-400 transition hover:text-white"
						>
							<span className="flex items-center gap-4">
								<Icon className="size-6 text-slate-500" />
								{item.label}
							</span>
							<span className="flex items-center gap-3">
								{item.value ? (
									<span className="font-semibold text-[#a98cff]">{item.value}</span>
								) : null}
								<ChevronRight className="size-5" />
							</span>
						</button>
					);
				})}
				<button
					type="button"
					onClick={handleResetProgressClick}
					className="mt-2 flex cursor-pointer items-center justify-between gap-4 text-left text-lg text-rose-200 transition hover:text-rose-100"
				>
					<span className="flex items-center gap-4">
						<RotateCcw className="size-6" />
						Zerar progresso
					</span>
					<ChevronRight className="size-5" />
				</button>
			</div>
		</section>
	);
}

function ProfileScreen({
	user,
	learningLanguage = "en",
	knownBlocks = [],
	learningBlocks = [],
	onResetProgress,
	onSelectLanguage,
	onSignOut,
	onUserUpdated,
}) {
	const knownCount = knownBlocks.length;
	const learningCount = learningBlocks.length;
	const focusedMeta = languageMeta[learningLanguage] ?? languageMeta.ja;

	return (
		<div className="min-h-screen bg-[#08090d] text-white">
			<header className="p-4 sm:p-6 lg:p-8">
				<AppHeader
					user={user}
					activePage="profile"
					learningLanguage={learningLanguage}
					onSelectLanguage={onSelectLanguage}
					onSignOut={onSignOut}
				/>
			</header>

			<main className="mx-auto grid max-w-[118rem] gap-8 px-4 pb-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,36rem)] lg:px-8">
				<section className="min-w-0">
					<div className="mb-9">
						<h1 className="text-5xl font-semibold text-white">Meu perfil</h1>
						<p className="mt-4 text-2xl text-slate-400">
							Acompanhe sua jornada e conquistas.
						</p>
					</div>

					<ProfileHeaderCard
						user={user}
						learningLanguage={learningLanguage}
						onUserUpdated={onUserUpdated}
					/>

					<section className="mt-9">
						<div className="flex items-center justify-between gap-4">
							<h2 className="text-2xl font-semibold text-white">
								Idiomas em estudo
							</h2>
							<a href="#dashboard" className="text-lg font-semibold text-[#a98cff]">
								Ver todos
							</a>
						</div>
						<div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
							<LanguageCard
								languageId={learningLanguage}
								progress={focusedMeta.progress}
								level={focusedMeta.level}
							/>
							<LanguageCard languageId="en" progress={80} level="Avançado" />
							<LanguageCard languageId="es" progress={45} level="Intermediário" />
							<div className="grid min-h-[15rem] place-items-center rounded-[1.25rem] bg-[#171922]/88 p-7 text-center shadow-[0_20px_70px_rgba(0,0,0,0.24)] ring-1 ring-white/5">
								<div>
									<span className="mx-auto grid size-20 place-items-center rounded-full border border-dashed border-slate-500 text-slate-300">
										<Plus className="size-10" />
									</span>
									<p className="mt-5 text-xl leading-tight text-slate-300">
										Adicionar
										<br />
										idioma
									</p>
								</div>
							</div>
						</div>
					</section>

					<div className="mt-8">
						<AchievementsCard />
					</div>
				</section>

				<aside className="grid content-start gap-6">
					<StreakCard />
					<StatsCard knownCount={knownCount} learningCount={learningCount} />
					<SettingsCard onResetProgress={onResetProgress} />
				</aside>
			</main>
		</div>
	);
}

export default ProfileScreen;
