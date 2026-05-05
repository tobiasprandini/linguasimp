import { useEffect, useState } from "react";
import {
	CalendarDays,
	Camera,
	RotateCcw,
	Save,
} from "lucide-react";
import AppHeader from "./AppHeader";
import { supabase } from "@/lib/supabase";

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

function ProfileHero({ user, knownCount, learningCount, onUserUpdated }) {
	const displayName = getUserDisplayName(user);
	const handle = user?.email?.split("@")[0] ?? "estudante";
	const avatarUrl = getUserAvatarUrl(user);
	const [name, setName] = useState(displayName);
	const [avatarPreview, setAvatarPreview] = useState(avatarUrl);
	const [message, setMessage] = useState("");
	const [isSaving, setIsSaving] = useState(false);

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
			setMessage("Perfil atualizado.");
		} catch (error) {
			setMessage(error.message);
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#24232d]">
			<div className="relative h-48 bg-[#1b1d27]">
				<label className="absolute left-8 top-8 block cursor-pointer">
					<span className="relative flex size-28 items-center justify-center overflow-hidden rounded-[2rem] bg-[#8b6cf4] text-5xl font-semibold text-[#08090d]">
						{avatarPreview ? (
							<img
								src={avatarPreview}
								alt={displayName}
								className="h-full w-full object-cover"
							/>
						) : (
							displayName.slice(0, 1).toUpperCase()
						)}
						<span className="absolute inset-x-0 bottom-0 flex h-9 items-center justify-center bg-black/45 text-white">
							<Camera className="size-4 stroke-[2.1]" />
						</span>
					</span>
					<input
						type="file"
						accept="image/*"
						onChange={handleAvatarChange}
						className="sr-only"
					/>
				</label>
				<div className="absolute bottom-6 right-8 flex gap-3">
					<span className="h-20 w-20 rounded-[1.1rem] bg-lime-300" />
					<span className="h-20 w-20 rounded-[1.1rem] bg-[#f4b63f]" />
					<span className="h-20 w-20 rounded-[1.1rem] bg-[#8b6cf4]" />
				</div>
			</div>
			<div className="p-7">
				<form
					onSubmit={handleSaveProfile}
					className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
				>
					<div className="min-w-0 flex-1">
						<label className="block max-w-md">
							<span className="sr-only">Nome</span>
							<input
								value={name}
								onChange={(event) => setName(event.target.value)}
								className="w-full rounded-[1rem] border border-white/10 bg-black/15 px-4 py-3 text-3xl font-semibold leading-tight text-white outline-none transition focus:border-[#8b6cf4]/55 sm:text-4xl"
								placeholder="Seu nome"
							/>
						</label>
						<p className="mt-2 text-base font-normal text-slate-500">@{handle}</p>
						<p className="mt-1 text-base font-normal text-slate-500">
							Construindo vocabulário por blocos.
						</p>
						{message ? (
							<p className="mt-3 text-sm text-cyan-100/85">{message}</p>
						) : null}
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<span className="inline-flex h-10 items-center gap-2 rounded-full bg-white/[0.05] px-4 text-sm font-normal text-slate-300">
							<CalendarDays className="size-4 stroke-[2.1]" />
							Hoje
						</span>
						<span className="inline-flex h-10 items-center rounded-full bg-lime-300 px-4 text-sm font-semibold text-[#10120f]">
							{knownCount} conhecidos
						</span>
						<span className="inline-flex h-10 items-center rounded-full bg-[#f4b63f] px-4 text-sm font-semibold text-[#141015]">
							{learningCount} estudando
						</span>
						<button
							type="submit"
							disabled={isSaving}
							className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-[#8b6cf4] px-4 text-sm font-semibold text-[#08090d] transition hover:bg-[#9b7cff] disabled:cursor-not-allowed disabled:opacity-60"
						>
							<Save className="size-4 stroke-[2.1]" />
							{isSaving ? "Salvando..." : "Salvar"}
						</button>
					</div>
				</form>
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

	function handleResetProgressClick() {
		const shouldReset = window.confirm(
			"Tem certeza que deseja zerar todo o seu progresso?",
		);

		if (shouldReset) {
			onResetProgress?.();
		}
	}

	return (
		<div className="min-h-screen bg-[#08090d] p-4 text-white sm:p-6 lg:p-8">
			<div className="w-full">
				<AppHeader
					user={user}
					activePage="profile"
					learningLanguage={learningLanguage}
					onSelectLanguage={onSelectLanguage}
					onSignOut={onSignOut}
				/>

				<main className="mx-auto mt-8 grid max-w-5xl gap-6">
					<ProfileHero
						user={user}
						knownCount={knownCount}
						learningCount={learningCount}
						onUserUpdated={onUserUpdated}
					/>

					<section className="rounded-[1.5rem] border border-white/10 bg-[#181922] p-6">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<h2 className="text-2xl font-semibold text-white">
									Progresso
								</h2>
								<p className="mt-2 max-w-xl text-base text-slate-400">
									Zere suas lições, revisões e blocos salvos para começar de novo.
								</p>
							</div>
							<button
								type="button"
								onClick={handleResetProgressClick}
								className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[1rem] border border-rose-300/25 bg-rose-300/10 px-5 text-base font-semibold text-rose-100 transition hover:border-rose-300/45 hover:bg-rose-300/15"
							>
								<RotateCcw className="size-4 stroke-[2.1]" />
								Zerar progresso
							</button>
						</div>
					</section>
				</main>
			</div>
		</div>
	);
}

export default ProfileScreen;
