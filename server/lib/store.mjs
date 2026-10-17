/**
 * Tiny JSON-array file store for form submissions.
 *
 * - One file per collection under `server/data/<name>.json` (created on demand).
 * - Writes are atomic (temp file + rename) and serialised per file so that two
 *   concurrent POSTs cannot interleave a read-modify-write.
 * - IDs look like `ct_` / `cs_` + 10 random base36 chars.
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

export const DATA_DIR = fileURLToPath(new URL('../data/', import.meta.url))

/** per-file promise chain → serialised writes */
const locks = new Map()

function withLock(file, task) {
  const prev = locks.get(file) ?? Promise.resolve()
  const next = prev.catch(() => {}).then(task)
  locks.set(file, next)
  // Clean up the chain when it settles so the map does not grow forever.
  next.finally(() => { if (locks.get(file) === next) locks.delete(file) }).catch(() => {})
  return next
}

export function makeId(prefix) {
  // 8 random bytes → base36, pad/trim to 10 chars
  let s = ''
  while (s.length < 10) s += randomBytes(8).readBigUInt64BE().toString(36)
  return `${prefix}${s.slice(0, 10)}`
}

function fileFor(collection) {
  if (!/^[a-z][a-z0-9-]*$/.test(collection)) throw new Error(`invalid collection name: ${collection}`)
  return path.join(DATA_DIR, `${collection}.json`)
}

async function readArray(file) {
  try {
    const raw = await readFile(file, 'utf8')
    if (!raw.trim()) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    if (err && err.code === 'ENOENT') return []
    throw err
  }
}

async function writeArrayAtomic(file, items) {
  await mkdir(path.dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`
  await writeFile(tmp, JSON.stringify(items, null, 2) + '\n', 'utf8')
  await rename(tmp, file)
}

/**
 * Append a record to `<collection>.json`. Returns the stored record
 * (with `id` and `receivedAt` filled in).
 */
export async function appendRecord(collection, idPrefix, record) {
  const file = fileFor(collection)
  return withLock(file, async () => {
    const items = await readArray(file)
    const stored = { id: makeId(idPrefix), receivedAt: new Date().toISOString(), ...record }
    items.push(stored)
    await writeArrayAtomic(file, items)
    return stored
  })
}

/** Latest `limit` records, newest first. */
export async function listRecords(collection, limit = 50) {
  const file = fileFor(collection)
  const items = await readArray(file)
  return items.slice(-limit).reverse()
}
