import fs from 'fs'
import path from 'path'

// Colors must come from the design tokens in globals.css / tailwind.config.js.
// This guard fails for any source file that reaches for a raw Tailwind palette
// class, a hex color, a gradient or a decorative animation.

const SRC = path.join(__dirname, '..')

const RAW_PALETTE =
  /\b(?:bg|text|border(?:-[trblxy])?|ring|ring-offset|from|via|to|fill|stroke|outline|divide|placeholder|shadow|decoration|accent|caret)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/
const HEX_COLOR =
  /(?:['"`[(]|:\s*)#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/
const DECORATION =
  /\bbg-gradient-|\banimate-(?:float|gradient-x|pulse|bounce)\b/

// Files exempt from the guard. Keep this empty; fix violations instead.
const LEGACY_FILES: string[] = []

const listSourceFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return listSourceFiles(full)
    if (!/\.(ts|tsx)$/.test(entry.name)) return []
    if (/\.test\.(ts|tsx)$/.test(entry.name)) return []
    if (entry.name === 'database.types.ts') return []
    return [path.relative(SRC, full)]
  })

const findViolations = (file: string): string[] =>
  fs
    .readFileSync(path.join(SRC, file), 'utf8')
    .split('\n')
    .flatMap((line, index) =>
      [RAW_PALETTE, HEX_COLOR, DECORATION]
        .map((pattern) => line.match(pattern)?.[0])
        .filter((match): match is string => Boolean(match))
        .map((match) => `${file}:${index + 1} ${match}`),
    )

describe('design tokens', () => {
  const files = listSourceFiles(SRC)

  it('uses no raw colors, gradients or decorative animations', () => {
    const violations = files
      .filter((file) => !LEGACY_FILES.includes(file))
      .flatMap(findViolations)
    expect(violations).toEqual([])
  })

  it('has no legacy exemptions left', () => {
    expect(LEGACY_FILES).toEqual([])
  })

  it('only lists legacy files that still violate', () => {
    const clean = LEGACY_FILES.filter(
      (file) => !files.includes(file) || findViolations(file).length === 0,
    )
    expect(clean).toEqual([])
  })
})
