import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const missingSupabaseConfigError = new Error(
	"Supabase nao esta configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.",
);

function createMissingConfigQuery() {
	const query = {
		select: () => query,
		insert: () => query,
		upsert: () => query,
		update: () => query,
		delete: () => query,
		eq: () => query,
		neq: () => query,
		in: () => query,
		order: () => query,
		limit: () => query,
		single: () =>
			Promise.resolve({ data: null, error: missingSupabaseConfigError }),
		maybeSingle: () =>
			Promise.resolve({ data: null, error: missingSupabaseConfigError }),
		then: (resolve, reject) =>
			Promise.resolve({
				data: null,
				error: missingSupabaseConfigError,
			}).then(resolve, reject),
	};

	return query;
}

function createMissingConfigClient() {
	if (typeof console !== "undefined") {
		console.warn(missingSupabaseConfigError.message);
	}

	return {
		auth: {
			getUser: () => Promise.resolve({ data: { user: null }, error: null }),
			onAuthStateChange: () => ({
				data: {
					subscription: {
						unsubscribe: () => {},
					},
				},
			}),
			signInWithPassword: () =>
				Promise.resolve({ data: {}, error: missingSupabaseConfigError }),
			signInWithOAuth: () =>
				Promise.resolve({ data: {}, error: missingSupabaseConfigError }),
			signOut: () => Promise.resolve({ error: null }),
			updateUser: () =>
				Promise.resolve({ data: {}, error: missingSupabaseConfigError }),
		},
		from: () => createMissingConfigQuery(),
		storage: {
			from: () => ({
				getPublicUrl: (path) => ({ data: { publicUrl: path ?? "" } }),
			}),
		},
	};
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
	? createClient(supabaseUrl, supabaseAnonKey)
	: createMissingConfigClient();
