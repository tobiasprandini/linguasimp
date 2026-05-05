import { blocks } from "../data/blocks";

const blocksById = Object.fromEntries(
	blocks.map((block) => [block.id, block]),
);

export function getBlockDetails(blockId) {
	return blocksById[blockId] ?? null;
}
