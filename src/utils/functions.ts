
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
