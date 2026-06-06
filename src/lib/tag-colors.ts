export interface BlockColor {
  name: string
  default: string
  light: string
  dark: string
}

export const BLOCK_COLORS: BlockColor[] = [
  { name: 'blue', default: '#12aaff', light: '#88d4ff', dark: '#0b6699' },
  { name: 'green', default: '#89e02d', light: '#c4ef96', dark: '#52861b' },
  { name: 'red', default: '#ff0000', light: '#ff7f7f', dark: '#990000' },
  { name: 'yellow', default: '#fbd31f', light: '#fde98f', dark: '#977f13' },
  { name: 'orange', default: '#ff9000', light: '#ffc77f', dark: '#995600' },
  { name: 'teal', default: '#2cdba5', light: '#95edd2', dark: '#1a8363' },
  { name: 'purple', default: '#8358ed', light: '#c1abf6', dark: '#4f358e' },
  { name: 'lavender', default: '#f75aff', light: '#fbacff', dark: '#943699' },
]

export function getBlockColor(index: number): BlockColor {
  return BLOCK_COLORS[index % BLOCK_COLORS.length]
}
