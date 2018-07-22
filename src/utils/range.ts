export function range(from: number, to: number, step: number = 1): number[] {
  const array: number[] = []
  for (let i = from; i < to; i = i + step) {
    array.push(i)
  }
  return array
}

export function rangeInc(from: number, to: number, step: number = 1): number[] {
  return range(from, to + 1, step)
}
