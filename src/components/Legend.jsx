function Legend() {
	return (
		<div className="mb-8 flex items-center justify-center gap-8 text-sm md:text-base">
			<div className="flex items-center gap-2 text-white/70">
				<span className="h-2 w-2 rounded-full bg-white/70" />
				<span>conhecida</span>
			</div>

			<div className="flex items-center gap-2 text-[#d4a93a]/90">
				<span className="h-2 w-2 rounded-full bg-[#d4a93a]/90" />
				<span>aprendendo</span>
			</div>

			<div className="flex items-center gap-2 text-[#7c8bb8]/50">
				<span className="h-2 w-2 rounded-full bg-[#7c8bb8]/50" />
				<span>desconhecida</span>
			</div>
		</div>
	);
}

export default Legend;
