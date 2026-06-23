import bcrypt from 'bcryptjs'
import { queryOne } from '../db'

export interface Usuario {
  id: number
  nombre: string
  perfil: 'vendedor' | 'admin'
}

interface UsuarioRow {
  id: number
  nombre: string
  password_hash: string
  perfil: 'vendedor' | 'admin'
  activo: number
}

export async function login(nombre: string, password: string): Promise<Usuario> {
  const row = await queryOne<UsuarioRow>(
    'SELECT * FROM usuarios WHERE nombre = $1 AND activo = 1',
    [nombre.trim()]
  )
  if (!row) throw new Error('Usuario no encontrado')
  const ok = await bcrypt.compare(password, row.password_hash)
  if (!ok) throw new Error('Contraseña incorrecta')
  return { id: row.id, nombre: row.nombre, perfil: row.perfil }
}
