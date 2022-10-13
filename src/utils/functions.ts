import { isRef, unref } from "vue"

export function isObjectEqual(
  a: Record<string, unknown> | null | undefined,
  b: Record<string, unknown> | null | undefined
): boolean {
  if (!a || !b) {
    return a === b
  }

  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) {
    return false
  }

  return aKeys.every(key => {
    const aVal = a[key]
    const bVal = b[key]
    if (typeof aVal === 'object' && typeof bVal === 'object') {
      return isObjectEqual(
        aVal as Record<string, unknown>,
        bVal as Record<string, unknown>
      )
    }
    return String(aVal) === String(bVal)
  })
}

export function isObjectMatch(
  a: Record<string, unknown> | null | undefined,
  b: Record<string, unknown> | null | undefined
): boolean {
  if (a === b || (a == null && b == null) || (a != null && b == null)) {
    return true
  } else if (a == null || b == null) {
    return false
  }

  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length < bKeys.length) {
    return false
  }

  return bKeys.every(key => {
    const aVal = a[key]
    const bVal = b[key]
    if (aVal != null && bVal == null) {
      return true
    } else if (typeof aVal === 'object' && typeof bVal === 'object') {
      return isObjectMatch(
        aVal as Record<string, unknown>,
        bVal as Record<string, unknown>
      )
    }
    return String(aVal) === String(bVal)
  })
}

export function deepUnref(value: unknown) {
  value = isRef(value) ? unref(value) : value

  if (value != null && typeof value === 'object') {
    const newValue: Record<string, unknown> = {}
    for (const key in value) {
      const unrefed = deepUnref((value as Record<string, unknown>)[key])
      if (unrefed !== undefined) {
        newValue[key] = unrefed
      }
    }
    return newValue
  } else if (Array.isArray(value)) {
    const newValue = new Array(value.length)
    for (let i = 0; i < value.length; i++) {
      const unrefed = deepUnref(value[i])
      if (unrefed !== undefined) {
        newValue[i] = unrefed
      } else {
        newValue[i] = null
      }
    }
    return newValue
  } else if (value != null && (typeof value === 'function' || typeof value === 'symbol')) {
    return undefined
  } else {
    return value
  }
}
