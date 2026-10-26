// "Latest request wins": a slow load that finishes after a newer one must not apply its result.
export function createLatest() {
  let last = 0
  return {
    begin: () => ++last,
    isCurrent: token => token === last,
  }
}
