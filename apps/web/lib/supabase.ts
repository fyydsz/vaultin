import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn(
        "Supabase credentials not found. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file."
      );
    }
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

export const supabase = getSupabaseClient();

export const AVATAR_BUCKET = "avatars";
export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export async function uploadAvatar(
  file: File,
  userId: string
): Promise<{ publicUrl: string; filePath: string }> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase credentials are missing. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file."
    );
  }

  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Please upload a JPG, PNG, WebP, or GIF image.");
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    throw new Error("File size exceeds 5MB limit. Please choose a smaller image.");
  }

  const client = getSupabaseClient();
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await client.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Failed to upload image to Supabase Storage");
  }

  const { data } = client.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);

  if (!data?.publicUrl) {
    throw new Error("Failed to generate public URL for uploaded avatar");
  }

  return { publicUrl: data.publicUrl, filePath };
}

export async function deleteAvatarFromStorage(filePathOrUrl: string): Promise<void> {
  if (!supabaseUrl || !supabaseAnonKey || !filePathOrUrl) return;

  const client = getSupabaseClient();
  let path = filePathOrUrl.trim();

  // If full public URL is provided, extract the file name
  if (filePathOrUrl.startsWith("http")) {
    const parts = filePathOrUrl.split(`/${AVATAR_BUCKET}/`);
    if (parts.length > 1) {
      path = parts[1].split("?")[0];
    } else {
      // Not a file in the avatars bucket
      return;
    }
  }

  if (!path) return;

  try {
    const { error } = await client.storage.from(AVATAR_BUCKET).remove([path]);
    if (error) {
      console.warn("Notice: could not delete old avatar from Supabase Storage:", error.message);
    }
  } catch (err) {
    console.warn("Notice: error deleting old avatar from Supabase Storage:", err);
  }
}
