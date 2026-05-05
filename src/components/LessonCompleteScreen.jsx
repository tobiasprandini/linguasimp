import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AppHeader from "./AppHeader";

const MotionDiv = motion.div;
const MotionSpan = motion.span;

function CountUp({ value, delay = 0 }) {
	const [displayValue, setDisplayValue] = useState(0);

	useEffect(() => {
		setDisplayValue(0);

		if (value <= 0) {
			return;
		}

		let frameId;
		let startTime;
		const duration = 650;
		const delayTimer = window.setTimeout(() => {
			function tick(timestamp) {
				startTime ??= timestamp;
				const progress = Math.min((timestamp - startTime) / duration, 1);
				const easedProgress = 1 - (1 - progress) ** 3;

				setDisplayValue(Math.round(value * easedProgress));

				if (progress < 1) {
					frameId = window.requestAnimationFrame(tick);
				}
			}

			frameId = window.requestAnimationFrame(tick);
		}, delay * 1000);

		return () => {
			window.clearTimeout(delayTimer);
			if (frameId) {
				window.cancelAnimationFrame(frameId);
			}
		};
	}, [delay, value]);

	return <>{displayValue}</>;
}

function ResultPanel({
	label,
	value,
	accent = "purple",
	delay = 0,
}) {
	const accentStyles = {
		purple: {
			text: "text-[#b8a6ff]",
			soft: "bg-[#8b6cf4]/10",
			border: "border-[#8b6cf4]/25",
		},
		amber: {
			text: "text-[#ffd782]",
			soft: "bg-[#f4b63f]/10",
			border: "border-[#f4b63f]/25",
		},
	};
	const styles = accentStyles[accent] ?? accentStyles.purple;

	return (
		<MotionDiv
			initial={{ opacity: 0, y: 12, scale: 0.98 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.42, delay, ease: [0.16, 1, 0.3, 1] }}
			className={`rounded-full border bg-white/[0.035] px-4 py-3 ${styles.border}`}
		>
			<div className="flex items-center justify-between gap-3">
				<p className="text-sm font-normal text-slate-400">{label}</p>
				<MotionSpan
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ duration: 0.3, delay: delay + 0.35 }}
					className={`inline-flex min-w-10 justify-center rounded-full px-3 py-1.5 text-xl font-semibold leading-none tabular-nums ${styles.soft} ${styles.text}`}
				>
					<CountUp value={value} delay={delay + 0.18} />
				</MotionSpan>
			</div>
		</MotionDiv>
	);
}

function getBlockLabel(block) {
	return block?.surface || block?.canonicalText || block?.canonical_text || "bloco";
}

function LessonWalletAnimation({ knownBlocks = [] }) {
	const visibleBlocks = knownBlocks.slice(0, 3);

	return (
		<div className="relative mx-auto -mt-8 mb-8 h-[20rem] w-full max-w-3xl overflow-hidden">
			<div className="absolute left-1/2 top-36 h-40 w-[28rem] -translate-x-1/2 rounded-[2.25rem] bg-[#24232d] shadow-[0_30px_80px_rgba(0,0,0,0.34)]" />
			<div className="absolute left-1/2 top-[6.5rem] h-32 w-[28rem] -translate-x-1/2 rounded-t-[2.25rem] bg-[#343441]" />
			<MotionDiv
				className="absolute left-1/2 top-[6.5rem] h-32 w-[28rem] -translate-x-1/2 origin-bottom rounded-t-[2.25rem] bg-[#41404f]"
				initial={{ rotateX: 0 }}
				animate={{ rotateX: -62 }}
				transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
				style={{ transformPerspective: 700 }}
			/>

			{visibleBlocks.length > 0 ? (
				visibleBlocks.map((block, index) => (
					<MotionDiv
						key={`${block.blockId}-${index}`}
						className="absolute left-1/2 top-4 flex h-16 w-64 -translate-x-1/2 items-center justify-center rounded-[1.2rem] bg-[#8b6cf4] px-5 text-xl font-semibold text-[#08090d] shadow-[0_22px_55px_rgba(139,108,244,0.28)]"
						initial={{
							x: -230 + index * 230,
							y: -22,
							rotate: -10 + index * 8,
							opacity: 0,
							scale: 0.9,
						}}
						animate={{
							x: 0,
							y: 190 - index * 18,
							rotate: -3 + index * 3,
							opacity: [0, 1, 1, 0.2],
							scale: [0.9, 1, 1, 0.92],
						}}
						transition={{
							delay: 0.25 + index * 0.32,
							duration: 1.2,
							ease: [0.22, 1, 0.36, 1],
						}}
					>
						<span className="truncate">{getBlockLabel(block)}</span>
					</MotionDiv>
				))
			) : (
				<p className="absolute inset-x-0 top-12 text-center text-base font-normal text-slate-500">
					Nenhum bloco conhecido nesta rodada
				</p>
			)}

		</div>
	);
}

function LessonCompleteScreen({
	user,
	learningLanguage = "en",
	knownBlockCount = 0,
	learningBlockCount = 0,
	knownBlocks = [],
	onSelectLanguage,
	onSignOut,
	onContinue,
}) {
	return (
		<div className="min-h-screen bg-[#05080f] text-white">
			<header className="border-b border-white/[0.06] p-4 sm:p-6 lg:p-8">
				<div className="w-full">
					<AppHeader
						user={user}
						activePage="study"
						learningLanguage={learningLanguage}
						onSelectLanguage={onSelectLanguage}
						onSignOut={onSignOut}
					/>
				</div>
			</header>

			<main className="mx-auto flex w-full max-w-5xl -translate-y-4 flex-col items-center justify-center px-4 py-4 sm:px-6 lg:min-h-[calc(100svh-7rem)]">
				<section className="w-full text-center">
					<h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
						Lição concluída
					</h1>
					<p className="mx-auto mt-2 max-w-md text-sm font-normal leading-relaxed text-slate-500 sm:text-base">
						Os blocos conhecidos foram guardados na sua carteira.
					</p>
					<LessonWalletAnimation knownBlocks={knownBlocks} />
				</section>

				<section className="w-full max-w-lg">
					<div className="grid gap-2 sm:grid-cols-2">
						<ResultPanel
							label="Blocos conhecidos"
							value={knownBlockCount}
							delay={0.16}
						/>
						<ResultPanel
							label="Blocos estudando"
							value={learningBlockCount}
							accent="amber"
							delay={0.3}
						/>
					</div>

					<button
						type="button"
						onClick={onContinue}
						className="mx-auto mt-4 flex h-13 w-full max-w-lg cursor-pointer items-center justify-center rounded-[0.9rem] bg-[#8b6cf4] px-6 text-base font-semibold text-[#070914] shadow-none transition hover:bg-[#9b7cff]"
					>
						Continuar
					</button>
				</section>
			</main>
		</div>
	);
}

export default LessonCompleteScreen;
