function WordBlock({ block, status = "unknown", isSelected, onClick, inline = false }) {
	const statusStyles = {
		known: "text-[#9d7dff]",
		learning: "text-[#f4b63f]",
		unknown: "text-white",
	};

	return (
		<button
			onClick={onClick}
			className={`
				cursor-pointer px-0 py-1
				text-[2.15rem] font-normal leading-none tracking-normal sm:text-[2.7rem]
				transition-all duration-300 ease-out
				${inline ? "inline" : ""}
				${statusStyles[status] ?? statusStyles.unknown}
				${isSelected ? "font-medium text-[#b8a6ff] underline decoration-[#8b6cf4] decoration-2 underline-offset-[0.18em]" : ""}
				rounded-none bg-transparent shadow-none hover:-translate-y-0.5 hover:text-[#8b6cf4]
			`}
		>
			{block.surface}
		</button>
	);
}

export default WordBlock;
