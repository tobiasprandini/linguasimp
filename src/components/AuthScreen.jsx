import { createElement, useState } from "react";
import { ArrowRight, Check, Lock, Mail, UserRound } from "lucide-react";
import { supabase } from "../lib/supabase";

const AUTH_REDIRECT_STORAGE_KEY = "linguasimp-auth-redirect";

function AuthInput({ icon: Icon, label, type = "text", value, onChange }) {
	return (
		<label className="block">
			<span className="text-sm font-normal text-slate-400">{label}</span>
			<span className="mt-2 flex h-13 items-center gap-3 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-slate-400 transition focus-within:border-[#8b6cf4]/65 focus-within:bg-white/[0.075]">
				{createElement(Icon, { className: "size-4 stroke-[2.1]" })}
				<input
					type={type}
					value={value}
					onChange={(event) => onChange(event.target.value)}
					className="h-full min-w-0 flex-1 bg-transparent text-base font-normal text-white outline-none placeholder:text-slate-600"
					autoComplete={type === "password" ? "current-password" : "email"}
				/>
			</span>
		</label>
	);
}

function AuthScreen({ mode = "login", onAuthenticated, redirectHash = "profile" }) {
	const isSignup = mode === "signup";
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [message, setMessage] = useState("");

	async function handleSubmit(event) {
		event.preventDefault();
		setIsSubmitting(true);
		setMessage("");

		try {
			if (isSignup) {
				const signupResponse = await supabase.auth.signUp({
					email,
					password,
					options: {
						data: {
							name,
							full_name: name,
						},
						emailRedirectTo:
							typeof window === "undefined"
								? undefined
								: window.location.origin,
					},
				});

				if (signupResponse.error) {
					throw signupResponse.error;
				}

				if (!signupResponse.data.session) {
					setMessage("Conta criada. Confira seu email para confirmar o cadastro.");
					return;
				}

				onAuthenticated?.(signupResponse.data.user);
				return;
			}

			const authResponse = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (authResponse.error) {
				throw authResponse.error;
			}

			if (authResponse.data.session) {
				onAuthenticated?.(authResponse.data.user);
				return;
			}

			setMessage("Entramos na sua conta.");
		} catch (error) {
			setMessage(
				error.message === "Invalid login credentials"
					? "Email ou senha inválidos."
					: error.message,
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleGoogleSignIn() {
		setIsSubmitting(true);
		setMessage("");

		try {
			if (typeof window !== "undefined") {
				window.localStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, "dashboard");
			}

			const redirectTo =
				typeof window === "undefined" ? undefined : window.location.origin;
			const { error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo,
				},
			});

			if (error) {
				throw error;
			}
		} catch (error) {
			setMessage(error.message);
			setIsSubmitting(false);
		}
	}

	return (
		<div className="min-h-screen bg-[#121212] px-4 py-5 text-white sm:px-6 lg:px-8">
			<main className="mx-auto grid min-h-[calc(100svh-2.5rem)] w-full max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
				<section className="relative overflow-hidden py-6 lg:min-h-[42rem]">
					<div className="relative z-10 flex h-full flex-col justify-center gap-9 lg:translate-y-20">
						<a
							href="/"
							className="inline-flex"
							aria-label="LinguaSimp inicio"
						>
							<img
								src="/linguasimp-logo-current.png"
								alt="LinguaSimp"
								className="block w-72 object-contain sm:w-96 lg:w-[30rem]"
							/>
						</a>

						<div>
							<h1 className="max-w-xl text-5xl font-semibold leading-[1.08] tracking-normal text-white sm:text-6xl lg:text-7xl">
								{isSignup
									? "Comece sua jornada com"
									: "Continue sua jornada com"}{" "}
								<span className="text-[#8b6cf4]">idiomas.</span>
							</h1>
							<p className="mt-7 max-w-xl text-lg font-normal leading-relaxed text-slate-400 sm:text-xl">
								Lições curtas, blocos práticos e revisão no ritmo
								certo para o seu dia a dia.
							</p>
						</div>
					</div>
				</section>

				<section className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-8">
					<div>
						<h2 className="text-3xl font-semibold text-white sm:text-4xl">
							{isSignup ? "Criar conta" : "Entrar"}
						</h2>
						<p className="mt-3 text-base font-normal leading-relaxed text-slate-400">
							{isSignup
								? "Crie sua conta para salvar seus blocos, revisões e progresso."
								: "Entre para continuar estudando de onde parou."}
						</p>
					</div>

					<form onSubmit={handleSubmit} className="mt-8 grid gap-4">
						<button
							type="button"
							onClick={handleGoogleSignIn}
							disabled={isSubmitting}
							className="flex h-13 cursor-pointer items-center justify-center gap-3 rounded-[1rem] border border-white/10 bg-white/[0.055] px-5 text-base font-semibold text-slate-100 transition hover:border-[#8b6cf4]/45 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
						>
							<span className="flex size-7 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#1f1f1f]">
								G
							</span>
							Continuar com Google
						</button>

						<div className="flex items-center gap-3 text-xs font-normal uppercase text-slate-600">
							<span className="h-px flex-1 bg-white/10" />
							ou
							<span className="h-px flex-1 bg-white/10" />
						</div>

						{isSignup ? (
							<AuthInput
								icon={UserRound}
								label="Nome"
								value={name}
								onChange={setName}
							/>
						) : null}
						<AuthInput
							icon={Mail}
							label="Email"
							type="email"
							value={email}
							onChange={setEmail}
						/>
						<AuthInput
							icon={Lock}
							label="Senha"
							type="password"
							value={password}
							onChange={setPassword}
						/>

						<button
							type="submit"
							disabled={isSubmitting}
							className="mt-2 flex h-13 cursor-pointer items-center justify-center gap-3 rounded-[1rem] bg-[#6e46e8] px-5 text-base font-semibold text-white shadow-[0_18px_45px_rgba(110,70,232,0.34)] transition hover:-translate-y-0.5 hover:bg-[#8b6cf4] disabled:cursor-not-allowed disabled:opacity-60"
						>
							{isSubmitting
								? "Aguarde..."
								: isSignup
									? "Criar conta"
									: "Entrar"}
							<ArrowRight className="size-5 stroke-[2.2]" />
						</button>
					</form>

					{message ? (
						<div className="mt-5 rounded-[1rem] border border-white/10 bg-white/[0.055] px-4 py-3 text-sm font-normal text-slate-400">
							<p>{message}</p>
						</div>
					) : null}

					<div className="mt-7 flex items-center justify-between gap-4 rounded-[1rem] bg-white/[0.045] px-4 py-4">
						<div className="flex items-center gap-3 text-sm font-normal text-slate-400">
							<span className="flex size-8 items-center justify-center rounded-full bg-[#8b6cf4] text-white">
								<Check className="size-4 stroke-[2.5]" />
							</span>
							{isSignup ? "Já tem conta?" : "Ainda não tem conta?"}
						</div>
						<a
							href={
								isSignup
									? `#login?next=${redirectHash}`
									: `#cadastro?next=${redirectHash}`
							}
							className="text-sm font-semibold text-[#a992ff] transition hover:text-white"
						>
							{isSignup ? "Entrar" : "Criar conta"}
						</a>
					</div>
				</section>
			</main>
		</div>
	);
}

export default AuthScreen;
