import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zjvlwabxegowsqfcdxxq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_h0uQmHLy7e85_ajUdO4G7Q_7jWm6su9";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLE = "org_data";

export async function cloudSave(id: string, data: unknown): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(TABLE)
      .upsert({ id, data, updated_at: new Date().toISOString() }, { onConflict: "id" });
    if (error) {
      console.warn("[cloudSave] error:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[cloudSave] exception:", e);
    return false;
  }
}

export async function cloudLoad(id: string): Promise<unknown | null> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("data")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return data.data;
  } catch {
    return null;
  }
}


export async function cloudDelete(id: string): Promise<void> {
  try {
    await supabase.from(TABLE).delete().eq("id", id);
  } catch {}
}

