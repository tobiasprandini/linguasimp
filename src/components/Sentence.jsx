import { useState } from "react";
import WordBlock from "./WordBlock";

const CARD_WIDTH = 352;
const VIEWPORT_MARGIN = 16;

function Sentence({
	blocks,
	selectedBlock,
	blockStatuses,
	onSelectBlock,
	selectedBlockDetails = null,
}) {
	const [cardPlacement, setCardPlacement] = useState("center");

	function getCardPlacement(target) {
		const rect = target.getBoundingClientRect();
		const width = Math.min(CARD_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
		const centeredLeft = rect.left + rect.width / 2 - width / 2;
		const centeredRight = centeredLeft + width;

		if (centeredLeft < VIEWPORT_MARGIN) {
			return "left";
		}

		if (centeredRight > window.innerWidth - VIEWPORT_MARGIN) {
			return "right";
		}

		return "center";
	}

	function handleSelectBlock(blockId, event) {
		setCardPlacement(getCardPlacement(event.currentTarget));
		onSelectBlock(blockId);
	}

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-wrap justify-center gap-x-1.5 gap-y-3 text-center sm:gap-x-2 sm:gap-y-4">
			{blocks.map((block) => {
				const isSelected = selectedBlock?.id === block.id;

				return (
					<div key={block.id} className="relative inline-flex">
						<WordBlock
							block={block}
							status={blockStatuses?.[block.blockId] ?? "unknown"}
							isSelected={isSelected}
							onClick={(event) => handleSelectBlock(block.id, event)}
						/>

						{isSelected && selectedBlockDetails ? (
							<div
								className={`absolute top-[calc(100%+1.35rem)] z-[70] w-[min(22rem,calc(100vw-2rem))] ${
									cardPlacement === "left"
										? "left-0"
										: cardPlacement === "right"
											? "right-0"
											: "left-1/2 -translate-x-1/2"
								}`}
							>
								{selectedBlockDetails}
							</div>
						) : null}
					</div>
				);
			})}
		</div>
	);
}

export default Sentence;
