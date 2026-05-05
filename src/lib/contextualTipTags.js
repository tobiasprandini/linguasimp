const CONTEXTUAL_TIP_TAG_PREFIX = "contextual_tip:";

export function extractContextualTipFromTags(tags) {
	return (
		(Array.isArray(tags) ? tags : [])
			.find((tag) => String(tag).startsWith(CONTEXTUAL_TIP_TAG_PREFIX))
			?.slice(CONTEXTUAL_TIP_TAG_PREFIX.length)
			.trim() ?? ""
	);
}
