import * as React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Progress({ className, value, secondaryValue = 0, ...props }) {
	const primaryValue = Math.max(0, Math.min(value || 0, 100));
	const secondaryProgressValue = Math.max(
		primaryValue,
		Math.min(secondaryValue || 0, 100),
	);

	return (
		<ProgressPrimitive.Root
			data-slot="progress"
			className={cn(
				"relative h-1 w-full overflow-hidden rounded-full bg-muted",
				className,
			)}
			{...props}
		>
			<ProgressPrimitive.Indicator
				data-slot="progress-secondary-indicator"
				className="absolute inset-y-0 left-0 w-full origin-left bg-[#f4b63f] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-[0_0_10px_rgba(244,182,63,0.2)]"
				style={{
					transform: `scaleX(${secondaryProgressValue / 100})`,
				}}
			/>
			<ProgressPrimitive.Indicator
				data-slot="progress-indicator"
				className="absolute inset-y-0 left-0 w-full origin-left bg-[#8b6cf4] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-[0_0_10px_rgba(139,108,244,0.24)]"
				style={{ transform: `scaleX(${primaryValue / 100})` }}
			/>
		</ProgressPrimitive.Root>
	);
}

export { Progress };
