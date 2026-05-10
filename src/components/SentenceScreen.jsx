import { useEffect, useRef, useState } from "react";
import Sentence from "./Sentence";
import BlockDetailsCard from "./BlockDetailsCard";
import BottomControls from "./BottomControls";
import AppHeader from "./AppHeader";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

const MotionDiv = motion.div;
const progressTextTransition = {
	duration: 0.32,
	ease: [0.22, 1, 0.36, 1],
};

function SentenceScreen({
	sentence,
	selectedBlock,
	blockStatuses,
	onSelectBlock,
	onMarkKnown,
	onStudyBlock,
	onPlayBlockAudio,
	onPrevious,
	canGoBack = false,
	onNext,
	onPlaySentenceAudio,
	isSentenceAudioPlaying,
	currentSentenceIndex,
	totalSentences,
	progressValue,
	reviewedProgressValue = progressValue,
	topSlot = null,
	user,
	learningLanguage = "en",
	onSelectLanguage,
	onSignOut,
}) {
	const mainContentRef = useRef(null);
	const selectedBlockAreaRef = useRef(null);
	const [translationState, setTranslationState] = useState({
		sentenceId: null,
		isVisible: false,
	});
	const isTranslationVisible =
		translationState.sentenceId === sentence.id && translationState.isVisible;

	useEffect(() => {
		if (!topSlot || !mainContentRef.current) {
			return;
		}

		mainContentRef.current.scrollIntoView({ block: "start" });
	}, [topSlot]);

	useEffect(() => {
		if (!selectedBlock) {
			return;
		}

		function handlePointerDown(event) {
			if (selectedBlockAreaRef.current?.contains(event.target)) {
				return;
			}

			onSelectBlock(null);
		}

		document.addEventListener("pointerdown", handlePointerDown);
		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
		};
	}, [onSelectBlock, selectedBlock]);

	const translationSlot = (
		<MotionDiv
			animate={{
				height: isTranslationVisible ? "auto" : 0,
				marginTop: isTranslationVisible ? 24 : 0,
				opacity: isTranslationVisible ? 1 : 0,
			}}
			transition={{
				duration: 0.48,
				ease: [0.16, 1, 0.3, 1],
			}}
			className="overflow-hidden"
		>
			<AnimatePresence initial={false}>
				{isTranslationVisible ? (
					<MotionDiv
						key={sentence.id}
						initial={{ opacity: 0, y: -3, filter: "blur(3px)" }}
						animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
						exit={{ opacity: 0, y: -3, filter: "blur(3px)" }}
						transition={{
							duration: 0.36,
							ease: [0.16, 1, 0.3, 1],
						}}
						className="max-w-4xl px-4 text-center text-base font-normal italic leading-relaxed text-slate-400 sm:text-lg"
					>
						&quot;{sentence.translation}&quot;
					</MotionDiv>
				) : null}
			</AnimatePresence>
		</MotionDiv>
	);

	return (
		<div className="h-svh overflow-hidden bg-[#08090d] text-white">
			<header className="p-4 sm:p-6 lg:p-8">
				<div className="w-full">
					<AppHeader
						user={user}
						activePage="study"
						learningLanguage={learningLanguage}
						onSelectLanguage={onSelectLanguage}
						onSignOut={onSignOut}
						showLogo={false}
						centerSlot={
							<div className="mx-auto w-full max-w-[32rem]">
								<div className="mb-3 flex items-center justify-between text-[0.68rem] font-normal text-slate-500 sm:text-sm">
									<MotionDiv
										key={`${currentSentenceIndex}-${totalSentences}`}
										initial={{ opacity: 0, y: 5 }}
										animate={{ opacity: 1, y: 0 }}
										transition={progressTextTransition}
										className="tabular-nums"
									>
										{currentSentenceIndex} / {totalSentences} blocos
									</MotionDiv>
									<MotionDiv
										key={Math.round(progressValue)}
										initial={{ opacity: 0, y: 5 }}
										animate={{ opacity: 1, y: 0 }}
										transition={progressTextTransition}
										className="tabular-nums"
									>
										{Math.round(progressValue)}% dominado
									</MotionDiv>
								</div>
								<Progress
									value={progressValue}
									secondaryValue={reviewedProgressValue}
									className="h-2 bg-[#20232d]"
								/>
							</div>
						}
					/>
				</div>
			</header>

			<div className="flex h-[calc(100svh-7.5rem)] w-full flex-col px-4 sm:h-[calc(100svh-8.5rem)] sm:px-6 lg:h-[calc(100svh-8rem)]">
				<div
					ref={mainContentRef}
					className="flex min-h-0 flex-1 flex-col"
				>
					<div className="flex min-h-0 flex-1 flex-col items-center justify-center">
						{topSlot ? <div className="mb-6 w-full max-w-3xl">{topSlot}</div> : null}

						<div className="mx-auto flex w-full flex-col items-center text-center">
							<AnimatePresence mode="wait">
								<MotionDiv
									key={sentence.id}
									initial={{ opacity: 0, y: 12 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -12 }}
									transition={{
										duration: 0.7,
										ease: [0.22, 1, 0.36, 1],
									}}
									className="flex w-full flex-col items-center"
								>
									{sentence.blocks?.length > 0 ? (
										<div
											ref={selectedBlockAreaRef}
											className="w-full"
										>
											<Sentence
												blocks={sentence.blocks}
												selectedBlock={selectedBlock}
												blockStatuses={blockStatuses}
												onSelectBlock={onSelectBlock}
												selectedBlockDetails={
													selectedBlock ? (
														<div>
															<AnimatePresence mode="wait">
																<MotionDiv
																	key={selectedBlock.id}
																	initial={{ opacity: 0, y: 8, scale: 0.98 }}
																	animate={{ opacity: 1, y: 0, scale: 1 }}
																	exit={{ opacity: 0, y: 8, scale: 0.98 }}
																	transition={{ duration: 0.12 }}
																>
																	<BlockDetailsCard
																		block={selectedBlock}
																		blockStatus={
																			blockStatuses?.[selectedBlock.blockId] ?? "unknown"
																		}
																		onMarkKnown={onMarkKnown}
																		onStudyBlock={onStudyBlock}
																		onPlayAudio={onPlayBlockAudio}
																	/>
																</MotionDiv>
															</AnimatePresence>
														</div>
													) : null
												}
											/>
										</div>
									) : (
										<div className="w-full max-w-4xl rounded-[1.75rem] border border-white/10 bg-[#11141d] px-5 py-6 text-left shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:px-7 sm:py-7">
											<p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">
												Licao em texto longo
											</p>
											<div className="mt-4 max-h-[55svh] overflow-y-auto pr-2 text-base leading-relaxed whitespace-pre-wrap text-slate-100 sm:text-lg">
												{sentence.text}
											</div>
										</div>
									)}

								</MotionDiv>
							</AnimatePresence>
						</div>

							<div className="mt-20 sm:mt-24">
								<BottomControls
									onPrevious={onPrevious}
									canGoBack={canGoBack}
									onNext={onNext}
									onPlayAudio={onPlaySentenceAudio}
								isAudioPlaying={isSentenceAudioPlaying}
								onToggleTranslation={() =>
									setTranslationState((current) => ({
										sentenceId: sentence.id,
										isVisible:
											current.sentenceId === sentence.id
												? !current.isVisible
												: true,
									}))
								}
								isTranslationVisible={isTranslationVisible}
								translationSlot={translationSlot}
							/>
						</div>

					</div>
				</div>
			</div>
		</div>
	);
}

export default SentenceScreen;
