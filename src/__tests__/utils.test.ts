import { describe, it, expect } from 'vitest'
import { ref, reactive } from 'vue'
import { toSerializable } from '../data/utils'

describe('toSerializable', () => {
  it('deep-clones a plain object', () => {
    const original = { id: '1', name: 'test', nested: { a: 1 } }
    const result = toSerializable(original)
    expect(result).toEqual(original)
    expect(result).not.toBe(original)
    expect(result.nested).not.toBe(original.nested)
  })

  it('unwraps Vue ref values', () => {
    const r = ref({ id: '1', name: 'test' })
    const result = toSerializable(r.value)
    expect(result).toEqual({ id: '1', name: 'test' })
  })

  it('unwraps Vue reactive objects', () => {
    const r = reactive({ id: '1', items: [1, 2, 3] })
    const result = toSerializable(r)
    expect(result).toEqual({ id: '1', items: [1, 2, 3] })
  })

  it('strips undefined values (JSON serialization behavior)', () => {
    const obj = { id: '1', name: undefined, value: null }
    const result = toSerializable(obj)
    expect(result).toEqual({ id: '1', value: null })
    expect('name' in result).toBe(false)
  })
})
