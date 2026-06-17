import type { Palette, ColorShades } from "@/hooks/use-palette"

export type ColorToken =
  | "blue"
  | "green"
  | "red"
  | "yellow"
  | "orange"
  | "teal"
  | "purple"

export const SELECTABLE_COLORS: ColorToken[] = [
  "blue",
  "green",
  "red",
  "yellow",
  "orange",
  "teal",
  "purple",
]

export const GREY_FALLBACK_HEX = "#B2B2B2"

export interface ResolvedColor {
  dark: string
  normal: string
  light: string
}

/**
 * Resolves the display color for an activity or tag.
 * Priority: override → tag color → grey.
 * Returns hex shades from the palette.
 */
export function resolveColor(
  palette: Palette | undefined,
  override: string | null | undefined,
  tagColor: string | null | undefined
): ResolvedColor {
  if (!palette) {
    return { dark: GREY_FALLBACK_HEX, normal: GREY_FALLBACK_HEX, light: GREY_FALLBACK_HEX }
  }

  const token = override ?? tagColor ?? "grey"
  const shades: ColorShades | undefined = palette[token]

  if (!shades) {
    const grey = palette.grey
    return { dark: grey.dark, normal: grey.normal, light: grey.light }
  }

  return { dark: shades.dark, normal: shades.normal, light: shades.light }
}

/**
 * Resolves a single tag color to hex shades.
 */
export function resolveTagColor(
  palette: Palette | undefined,
  tagColor: string | null | undefined
): ResolvedColor {
  return resolveColor(palette, undefined, tagColor)
}
