import { createClient } from '@supabase/supabase-js'
import { env } from '../../config/env'

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)

export const storageService = {
  async uploadFile(bucket: string, path: string, file: ArrayBuffer, contentType: string) {
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
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) throw error
  }
}
