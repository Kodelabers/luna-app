import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-side Supabase client with service role key
// Used for Storage operations where we need admin access
function createServerClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Singleton pattern for server client
let serverClient: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
  if (!serverClient) {
    serverClient = createServerClient();
  }
  return serverClient;
}

// Storage bucket name for organization assets
const STORAGE_BUCKET = "luna-assets";

/**
 * Upload a file to Supabase Storage
 * @param file - File buffer or Blob
 * @param path - Path in the bucket (e.g., "logos/org_123_logo.png")
 * @param contentType - MIME type of the file
 * @returns Public URL of the uploaded file
 */
export async function uploadFile(
  file: Buffer | Blob,
  path: string,
  contentType: string
): Promise<string> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Delete a file from Supabase Storage
 * @param path - Path in the bucket
 */
export async function deleteFile(path: string): Promise<void> {
  const supabase = getSupabaseServerClient();

  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Generate a unique file path for organization assets
 * @param organisationId - Organisation ID
 * @param prefix - File prefix (e.g., "logo", "document")
 * @param extension - File extension (e.g., "png", "pdf")
 */
export function generateFilePath(
  organisationId: number,
  prefix: string,
  extension: string
): string {
  const uniqueId = crypto.randomUUID();
  return `${organisationId}_${prefix}_${uniqueId}.${extension}`;
}

/**
 * Extract file path from a Supabase Storage URL
 * Used when we need to delete a file by its URL
 */
export function extractPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(
      new RegExp(`/storage/v1/object/public/${STORAGE_BUCKET}/(.+)`)
    );
    return pathMatch ? pathMatch[1] : null;
  } catch {
    return null;
  }
}

