function Translationbox({ selectedBlock }) {
	if (!selectedBlock) {
		return null;
	}

	return (
		<div className="mt-8">
			<p className="text-sm text-white/30">Tradução do bloco</p>
			<p className="mt-1 text-lg text-white/75">
				{selectedBlock.translation}
			</p>
		</div>
	);
}

export default Translationbox;
