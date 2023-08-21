import { describe, test, expect } from "vitest"
import { isObjectEqual, isObjectMatch } from '../../src/utils/functions'

describe('isObjectEqual', () => {
  test('compare undefineds', () => {
    expect(isObjectEqual(undefined, undefined)).toBe(true)
  })

  test('compare nulls', () => {
    expect(isObjectEqual(null, null)).toBe(true)
  })

  test('compare empty objects', () => {
    expect(isObjectEqual({}, {})).toBe(true)
  })

  test('compare object with empty object', () => {
    expect(isObjectEqual(
      { a: null },
      {},
    )).toBe(false)
  })

  test('compare empty object with object', () => {
    expect(isObjectEqual(
      {},
      { a: null },
    )).toBe(false)
  })

  test('compare objects', () => {
    expect(isObjectEqual(
      { a: null },
      { a: null },
    )).toBe(true)
  })

  test('compare objects', () => {
    expect(isObjectEqual(
      { a: null },
      { a: undefined },
    )).toBe(false)
  })

  test('compare objects', () => {
    expect(isObjectEqual(
      { a: undefined },
      { a: null },
    )).toBe(false)
  })

  test('compare nested objects', () => {
    expect(isObjectEqual(
      { a: 1, b: { c: "2", d: [true, false] }},
      { a: 1, b: { c: "2", d: [true, false] }},
    )).toBe(true)
  })

  test('compare nested objects', () => {
    expect(isObjectEqual(
      { a: 1, b: { c: "2", d: [true, false] }},
      { a: 1, b: { c: "2", d: [true] }},
    )).toBe(false)
  })

  test('compare nested objects', () => {
    expect(isObjectEqual(
      { a: 1, b: { c: "2", d: [true] }},
      { a: 1, b: { c: "2", d: [true, false] }},
    )).toBe(false)
  })
})

describe('isObjectMatch', () => {
  test('compare undefineds', () => {
    expect(isObjectMatch(undefined, undefined)).toBe(true)
  })

  test('compare nulls', () => {
    expect(isObjectMatch(null, null)).toBe(true)
  })

  test('compare empty objects', () => {
    expect(isObjectMatch({}, {})).toBe(true)
  })

  test('compare object with empty object', () => {
    expect(isObjectMatch(
      { a: null },
      {},
    )).toBe(true)
  })

  test('compare empty object with object', () => {
    expect(isObjectMatch(
      {},
      { a: null },
    )).toBe(false)
  })

  test('compare objects', () => {
    expect(isObjectMatch(
      { a: null },
      { a: null },
    )).toBe(true)
  })

  test('compare objects', () => {
    expect(isObjectMatch(
      { a: null },
      { a: undefined },
    )).toBe(false)
  })

  test('compare objects', () => {
    expect(isObjectMatch(
      { a: undefined },
      { a: null },
    )).toBe(false)
  })

  test('compare nested objects', () => {
    expect(isObjectMatch(
      { a: 1, b: { c: "2", d: [true, false] }},
      { a: 1, b: { c: "2", d: [true, false] }},
    )).toBe(true)
  })

  test('compare nested objects', () => {
    expect(isObjectMatch(
      { a: 1, b: { c: "2", d: [true, false] }},
      { a: 1, b: { c: "2", d: [true] }},
    )).toBe(true)
  })

  test('compare nested objects', () => {
    expect(isObjectMatch(
      { a: 1, b: { c: "2", d: [true] }},
      { a: 1, b: { c: "2", d: [true, false] }},
    )).toBe(false)
  })
})
