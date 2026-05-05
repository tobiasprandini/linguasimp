import { Volume2 } from "lucide-react";
import { buildPronunciationHint } from "../lib/buildPronunciationHint";

function BlockDetailsCard({
	block,
	blockStatus = "unknown",
	onMarkKnown,
	onStudyBlock,
	onPlayAudio,
}) {
	if (!block) {
		return null;
	}

	const pronunciation = buildPronunciationHint(block);
	const contextualTip = String(
		block.contextualTip ?? block.contextual_tip ?? "",
	).trim();

	return (
		<div className="relative w-full max-w-[22rem] rounded-[18px] border border-[#2a2e3a] bg-[#171a24] px-6 py-5 text-left shadow-2xl shadow-black/30">
			<div className="absolute left-1/2 top-0 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-l border-t border-[#2a2e3a] bg-[#171a24]" />

			<div className="relative flex items-start justify-between gap-4">
				<div className="min-w-0">
					<h2 className="text-xl font-bold leading-tight text-[#f0f2f7]">
						{block.surface}
					</h2>
					<p className="mt-5 text-lg font-normal leading-tight text-[#8f98a7]">
						{block.contextualMeaning}
					</p>
					{pronunciation ? (
						<p className="mt-4 text-base font-normal leading-tight text-[#778191]">
							<span className="text-[#5f6878]">soa como </span>
							<span className="italic">{pronunciation}</span>
						</p>
					) : null}
					{contextualTip ? (
						<p className="mt-4 rounded-[14px] border border-[#8b6cf4]/20 bg-[#8b6cf4]/10 px-4 py-3 text-sm font-medium leading-snug text-[#c8bbff]">
							{contextualTip}
						</p>
					) : null}
				</div>

				<button
					type="button"
					onClick={() => onPlayAudio(block)}
					disabled={!block.audio}
					className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#7f8898] transition hover:bg-white/5 hover:text-[#f0f2f7] disabled:cursor-not-allowed disabled:opacity-40"
					aria-label={`Ouvir ${block.surface}`}
				>
					<Volume2 className="size-6 stroke-[1.7]" />
				</button>
			</div>

			<div className="relative mt-6 grid w-full grid-cols-2 gap-2.5">
				<button
					type="button"
					onClick={() => onMarkKnown(block)}
					className={`min-h-11 w-full cursor-pointer rounded-[14px] px-4 text-base font-bold transition hover:bg-white/10 ${
						blockStatus === "known"
							? "border border-[#2a2e3a] bg-[#222633] text-[#f0f2f7]"
							: "border border-transparent bg-[#151922] text-[#8f98a7] hover:text-[#f0f2f7]"
					}`}
				>
					Sei
				</button>

				<button
					type="button"
					onClick={() => onStudyBlock(block)}
					className={`min-h-11 w-full cursor-pointer rounded-[14px] px-4 text-base font-bold transition ${
						blockStatus === "learning"
							? "border border-[#9f7cff] bg-[#7c4dff] text-white shadow-[0_14px_34px_rgba(124,77,255,0.28)]"
							: "border border-[#8b6cf4] bg-[#7c4dff] text-white shadow-[0_14px_34px_rgba(124,77,255,0.22)] hover:bg-[#8b6cf4]"
					}`}
				>
					Aprender
				</button>
			</div>
		</div>
	);
}

export default BlockDetailsCard;
