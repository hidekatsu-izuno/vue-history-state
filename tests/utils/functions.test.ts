import { isObjectEqual, isObjectMatch } from '../../src/utils/functions'

describe('test functions', () => {
  it('test isObjectEqual', () => {
    expect(isObjectEqual(null, null)).toBe(true)
  })

  it('test isObjectMatch', () => {
    expect(isObjectMatch(null, null)).toBe(true)
  })
})
