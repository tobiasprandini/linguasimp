import { supabase } from "./supabase";

export function getAudioUrl(bucket, path) {
	if (!path) {
		return null;
	}

	const { data } = supabase.storage.from(bucket).getPublicUrl(path);
	return data.publicUrl;
}
