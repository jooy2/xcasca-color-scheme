// The color tones the gallery filters by, worked out from a scheme's colors rather than written by
// hand, so a new scheme gets its tones without anybody choosing them.
//
//   red, warm, green, blue, purple   the hue of the background, or of the text on a gray background
//   neutral                          a black, gray or white background
//   vivid                            saturated colors: the ANSI colors, the background, or bright
//                                    text on a dark background
//
// A scheme can have several tones. Hues are measured in OKLCH, where equal steps look equal.

import { ANSI, BRIGHT, isDark } from './schemes.mjs'

export const TONES = ['red', 'warm', 'green', 'blue', 'purple', 'neutral', 'vivid']

// Where each hue range starts, in degrees; each runs to where the next one starts
const HUES = [
  ['red', 340],
  ['warm', 30],
  ['green', 118],
  ['blue', 195],
  ['purple', 280],
]
// A background this close to the edge of a range counts for the range next to it too, so a
// blue-violet such as Dracula's shows under both blue and purple
const EDGE = 6
// Under this chroma a background reads as black, gray or white
const GRAY = 0.01
// The text adds its own hue at this chroma: weaker on a gray background, where it is the only tint
const TEXT_ON_GRAY = 0.02
const TEXT_ON_TINT = 0.05
// Vivid: the mean chroma of the twelve ANSI colors other than black and white, a background, or
// the text on a dark background
const VIVID_ACCENTS = 0.155
const VIVID_BACKGROUND = 0.1
const VIVID_TEXT = 0.15

const ACCENTS = [...ANSI, ...BRIGHT].filter((key) => !/black|white/i.test(key))

// Chroma and hue in OKLCH, from https://bottosson.github.io/posts/oklab/
export const oklch = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255

    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s

  return { chroma: Math.hypot(a, bb), hue: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360 }
}

// The hue ranges a hue falls in, counting those within `edge` degrees of it
const hueRanges = (hue, edge) =>
  HUES.filter(([, start], index) => {
    const end = HUES[(index + 1) % HUES.length][1]
    const span = (end - start + 360) % 360
    const offset = (hue - start + 360) % 360

    return offset < span + edge || offset > 360 - edge
  }).map(([name]) => name)

export const tones = (data) => {
  const background = oklch(data.background)
  const text = oklch(data.foreground)
  const gray = background.chroma < GRAY
  const found = new Set(gray ? ['neutral'] : hueRanges(background.hue, EDGE))

  if (text.chroma >= (gray ? TEXT_ON_GRAY : TEXT_ON_TINT)) {
    hueRanges(text.hue, 0).forEach((tone) => found.add(tone))
  }

  const accents = ACCENTS.reduce((sum, key) => sum + oklch(data[key]).chroma, 0) / ACCENTS.length

  if (
    accents >= VIVID_ACCENTS ||
    background.chroma >= VIVID_BACKGROUND ||
    (isDark(data) && text.chroma >= VIVID_TEXT)
  ) {
    found.add('vivid')
  }

  return TONES.filter((tone) => found.has(tone))
}
