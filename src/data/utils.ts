import { toRaw } from 'vue'

/**
 * Deep-clone a Vue reactive object into a plain serializable form
 * suitable for writing to IndexedDB via Dexie.
 */
export function toSerializable<T>(item: T): T {
  return JSON.parse(JSON.stringify(toRaw(item)))
}
