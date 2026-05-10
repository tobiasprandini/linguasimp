import { ArrowLeft, ArrowRight, Eye, EyeOff, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function BottomControls({
	onPrevious,
	canGoBack = false,
	onNext,
	onPlayAudio,
	isAudioPlaying,
	onToggleTranslation,
	isTranslationVisible,
	translationSlot = null,
}) {
	return (
		<div className="flex flex-col items-center">
			<div className="flex items-center justify-center gap-5">
				<Button
					type="button"
					onClick={onPlayAudio}
					className="flex h-10 min-w-[6.5rem] cursor-pointer items-center justify-center gap-2 rounded-[1.15rem] border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-300 shadow-none transition-colors duration-150 hover:bg-white/10 hover:text-slate-100 active:!translate-y-0 active:bg-white/[0.08] sm:h-11 sm:min-w-[7rem] sm:text-base"
					aria-label={
						isAudioPlaying
							? "Pausar audio da frase"
							: "Tocar audio da frase"
					}
				>
					{isAudioPlaying ? (
						<Pause className="size-4 fill-current" />
					) : (
						<Volume2 className="size-4 stroke-[2]" />
					)}
					{isAudioPlaying ? "Pausar" : "Ouvir"}
				</Button>

				<Button
					type="button"
					onClick={onToggleTranslation}
					className="flex h-10 min-w-[7rem] cursor-pointer items-center justify-center gap-2 rounded-[1.15rem] border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-300 shadow-none transition-colors duration-150 hover:bg-white/10 hover:text-slate-100 active:!translate-y-0 active:bg-white/[0.08] sm:h-11 sm:min-w-[7.75rem] sm:text-base"
					aria-label={
						isTranslationVisible ? "Ocultar traducao" : "Mostrar traducao"
					}
				>
					{isTranslationVisible ? (
						<EyeOff className="size-4 stroke-[2]" />
					) : (
						<Eye className="size-4 stroke-[2]" />
					)}
					{isTranslationVisible ? "Esconder" : "Traduzir"}
				</Button>
			</div>

				{translationSlot}

				<div className="mt-20 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
					<Button
						onClick={onPrevious}
						disabled={!canGoBack}
						className="flex h-16 min-w-[12.5rem] cursor-pointer items-center justify-center gap-3 rounded-[1.75rem] border border-white/10 bg-white/5 px-9 text-xl font-semibold text-slate-300 shadow-none transition-all duration-200 hover:bg-white/10 hover:text-slate-100 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-35 sm:h-[4.25rem] sm:min-w-[13.75rem] sm:text-[1.35rem]"
					>
						<ArrowLeft className="size-6 stroke-[2]" />
						Voltar
					</Button>
					<Button
						onClick={onNext}
						className="flex h-16 min-w-[12.5rem] cursor-pointer items-center justify-center gap-3 rounded-[1.75rem] bg-[#7c5ce8] px-9 text-xl font-semibold text-[#070914] shadow-none transition-all duration-200 hover:scale-[1.02] hover:bg-[#8b6cf4] sm:h-[4.25rem] sm:min-w-[13.75rem] sm:text-[1.35rem]"
					>
						Continuar
						<ArrowRight className="size-6 stroke-[2]" />
					</Button>
				</div>
			</div>
		);
	}

export default BottomControls;
