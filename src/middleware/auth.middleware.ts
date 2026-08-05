import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { env } from '../config/env'
import type { Permisos } from '../modules/auth/auth.service'

export interface JwtPayload {
  sub: string
  email: string
  rol: string
  division?: string
  permisos?: Permisos
  iat: number
  exp: number
}

declare module 'hono' {
  interface ContextVariableMap {
    user: JwtPayload
  }
}

/** Decodifica y verifica un JWT manualmente para compatibilidad con Bun + Hono */
async function verifyJwt(token: string, secret: string): Promise<JwtPayload> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('JWT malformado')

  const [headerB64, payloadB64, signatureB64] = parts as [string, string, string]

  // Verificar firma con HMAC-SHA256
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )

  const data = encoder.encode(`${headerB64}.${payloadB64}`)
  const signature = Uint8Array.from(
    atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
    (c) => c.charCodeAt(0),
  )

  const valid = await crypto.subtle.verify('HMAC', key, signature, data)
  if (!valid) throw new Error('Firma JWT inválida')

  // Decodificar payload — atob() da una "binary string" (1 char = 1 byte),
  // no texto UTF-8; hay que reinterpretar esos bytes como UTF-8 antes del
  // JSON.parse o los caracteres acentuados quedan corruptos (ej. "división"
  // se decodifica mal si se usa atob() directo sobre JSON con texto en español).
  const payloadBytes = Uint8Array.from(
    atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')),
    (c) => c.charCodeAt(0),
  )
  const payload = JSON.parse(new TextDecoder('utf-8').decode(payloadBytes)) as JwtPayload

  // Verificar expiración
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('JWT expirado')
  }

  return payload
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Token de autorización requerido' })
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    const payload = await verifyJwt(token, env.JWT_SECRET)
    c.set('user', payload)
    await next()
  } catch {
    throw new HTTPException(401, { message: 'Token inválido o expirado' })
  }
})


