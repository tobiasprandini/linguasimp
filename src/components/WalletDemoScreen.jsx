import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import AppHeader from "./AppHeader";

const MotionDiv = motion.div;

const blocks = [
	{ text: "a doctor", gloss: "um medico", color: "bg-[#8b6cf4]" },
	{ text: "at school", gloss: "na escola", color: "bg-[#f4b63f]" },
	{ text: "I would like", gloss: "eu gostaria", color: "bg-lime-300" },
];

function WalletDemoScreen({
	user,
	learningLanguage = "en",
	onSelectLanguage,
	onSignOut,
}) {
	const [replayKey, setReplayKey] = useState(0);

	return (
		<div className="min-h-screen bg-[#08090d] p-4 text-white sm:p-6 lg:p-8">
			<div className="w-full">
				<AppHeader
					user={user}
					activePage="wallet-demo"
					learningLanguage={learningLanguage}
					onSelectLanguage={onSelectLanguage}
					onSignOut={onSignOut}
				/>

				<main className="mx-auto mt-6 grid min-h-[calc(100svh-8rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[0.9fr_1.1fr]">
					<section className="rounded-[1.5rem] bg-[#1b1d27] p-7">
						<p className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-normal text-slate-300">
							Demo de animacao
						</p>
						<h1 className="mt-5 text-4xl font-semibold leading-tight text-white sm:text-5xl">
							Blocos entrando na carteira
						</h1>
						<p className="mt-4 max-w-xl text-base font-normal leading-relaxed text-slate-500">
							Um teste visual para quando o usuario marca palavras como conhecidas
							ou estudando.
						</p>
						<button
							type="button"
							onClick={() => setReplayKey((current) => current + 1)}
							className="mt-8 inline-flex h-14 cursor-pointer items-center justify-center gap-3 rounded-[1rem] bg-[#8b6cf4] px-8 text-lg font-semibold text-[#070914] transition hover:bg-[#9b7cff]"
						>
							Repetir
							<RotateCcw className="size-5 stroke-[2.1]" />
						</button>
					</section>

					<section className="relative flex min-h-[31rem] items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#171a24] p-8">
						<div className="absolute left-8 top-8 rounded-full bg-white/10 px-4 py-2 text-sm font-normal text-slate-300">
							carteira de blocos
						</div>

						<div className="relative h-[25rem] w-full max-w-[34rem]" key={replayKey}>
							<div className="absolute left-1/2 top-28 h-52 w-80 -translate-x-1/2 rounded-[2rem] bg-[#24232d] shadow-[0_28px_80px_rgba(0,0,0,0.28)]" />
							<div className="absolute left-1/2 top-24 h-24 w-80 -translate-x-1/2 origin-bottom rounded-t-[2rem] bg-[#30303b]" />
							<MotionDiv
								className="absolute left-1/2 top-24 h-24 w-80 -translate-x-1/2 origin-bottom rounded-t-[2rem] bg-[#3a3946]"
								initial={{ rotateX: 0 }}
								animate={{ rotateX: -58 }}
								transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
								style={{ transformPerspective: 700 }}
							/>

							<div className="absolute left-1/2 top-44 h-24 w-72 -translate-x-1/2 rounded-[1.5rem] border border-white/10 bg-black/20" />

							{blocks.map((block, index) => (
								<MotionDiv
									key={block.text}
									className={`absolute left-1/2 top-4 flex h-20 w-52 -translate-x-1/2 flex-col justify-center rounded-[1.15rem] px-5 text-[#08090d] shadow-[0_18px_40px_rgba(0,0,0,0.22)] ${block.color}`}
									initial={{
										x: -220 + index * 220,
										y: -40,
										rotate: -12 + index * 10,
										opacity: 0,
										scale: 0.88,
									}}
									animate={{
										x: 0,
										y: 210 - index * 18,
										rotate: -4 + index * 4,
										opacity: [0, 1, 1, 0.16],
										scale: [0.88, 1, 1, 0.92],
									}}
									transition={{
										delay: 0.35 + index * 0.42,
										duration: 1.45,
										ease: [0.22, 1, 0.36, 1],
									}}
								>
									<p className="text-lg font-semibold leading-tight">{block.text}</p>
									<p className="mt-1 text-xs font-normal opacity-65">{block.gloss}</p>
								</MotionDiv>
							))}

							<MotionDiv
								className="absolute left-1/2 top-72 h-3 w-48 -translate-x-1/2 rounded-full bg-[#8b6cf4]"
								initial={{ scaleX: 0, opacity: 0 }}
								animate={{ scaleX: 1, opacity: 1 }}
								transition={{ delay: 2.05, duration: 0.45 }}
							/>
						</div>
					</section>
				</main>
			</div>
		</div>
	);
}

export default WalletDemoScreen;
