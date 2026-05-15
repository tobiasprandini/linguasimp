export function withTimeout(promise, timeoutMs, message) {
	let timeoutId;

	const timeoutPromise = new Promise((_, reject) => {
		timeoutId = window.setTimeout(() => {
			reject(new Error(message));
		}, timeoutMs);
	});

	return Promise.race([promise, timeoutPromise]).finally(() => {
		window.clearTimeout(timeoutId);
	});
}
