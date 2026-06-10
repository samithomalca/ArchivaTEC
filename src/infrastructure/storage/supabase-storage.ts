import { createClient } from '@supabase/supabase-js'
import { env } from '../../config/env'

function getSupabaseClient() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_URL y SUPABASE_SERVICE_KEY son requeridas para subir archivos. Verifica las variables de entorno en Vercel.')
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
}

export const storageService = {
  async uploadFile(bucket: string, path: string, file: ArrayBuffer, contentType: string) {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: true
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return publicUrl
  },

  async deleteFile(bucket: string, path: string) {
    const supabase = getSupabaseClient()
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) throw error
  }
}
