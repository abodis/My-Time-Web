/**
 * Inline MD5 hash implementation (RFC 1321).
 * Used exclusively for Gravatar URL generation.
 */
export function md5(input: string): string {
  const msg = toUTF8Bytes(input)
  const bitLen = msg.length * 8

  // Padding: append 1-bit, zeros, then 64-bit length
  msg.push(0x80)
  while (msg.length % 64 !== 56) msg.push(0)
  msg.push(
    bitLen & 0xff,
    (bitLen >>> 8) & 0xff,
    (bitLen >>> 16) & 0xff,
    (bitLen >>> 24) & 0xff,
    0, 0, 0, 0 // high 32 bits (always 0 for strings < 512MB)
  )

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  for (let i = 0; i < msg.length; i += 64) {
    const M = new Array<number>(16)
    for (let j = 0; j < 16; j++) {
      const o = i + j * 4
      M[j] = msg[o] | (msg[o + 1] << 8) | (msg[o + 2] << 16) | (msg[o + 3] << 24)
    }

    let A = a0, B = b0, C = c0, D = d0

    for (let r = 0; r < 64; r++) {
      let F: number, g: number
      if (r < 16) {
        F = (B & C) | (~B & D)
        g = r
      } else if (r < 32) {
        F = (D & B) | (~D & C)
        g = (5 * r + 1) % 16
      } else if (r < 48) {
        F = B ^ C ^ D
        g = (3 * r + 5) % 16
      } else {
        F = C ^ (B | ~D)
        g = (7 * r) % 16
      }

      F = (F + A + K[r] + M[g]) >>> 0
      A = D
      D = C
      C = B
      B = (B + ((F << S[r]) | (F >>> (32 - S[r])))) >>> 0
    }

    a0 = (a0 + A) >>> 0
    b0 = (b0 + B) >>> 0
    c0 = (c0 + C) >>> 0
    d0 = (d0 + D) >>> 0
  }

  return toHex32(a0) + toHex32(b0) + toHex32(c0) + toHex32(d0)
}

function toHex32(n: number): string {
  let s = ''
  for (let i = 0; i < 4; i++) {
    s += ((n >>> (i * 8)) & 0xff).toString(16).padStart(2, '0')
  }
  return s
}

function toUTF8Bytes(str: string): number[] {
  const bytes: number[] = []
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i)
    if (c < 0x80) {
      bytes.push(c)
    } else if (c < 0x800) {
      bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f))
    } else if (c >= 0xd800 && c < 0xdc00) {
      const hi = c
      const lo = str.charCodeAt(++i)
      c = 0x10000 + ((hi - 0xd800) << 10) + (lo - 0xdc00)
      bytes.push(
        0xf0 | (c >> 18),
        0x80 | ((c >> 12) & 0x3f),
        0x80 | ((c >> 6) & 0x3f),
        0x80 | (c & 0x3f)
      )
    } else {
      bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f))
    }
  }
  return bytes
}

/* prettier-ignore */
const K = [
  0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
  0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
  0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
  0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
  0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
  0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
  0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
  0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
]

/* prettier-ignore */
const S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]
