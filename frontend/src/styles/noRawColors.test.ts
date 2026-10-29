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

// Files not yet migrated to the design system. Shrinks to empty.
const LEGACY_FILES: string[] = [
  'app/about/page.tsx',
  'app/aspc-delay/[rideId]/page.tsx',
  'app/aspc-delay/page.tsx',
  'app/aspc-fees/page.tsx',
  'app/aspc-info/page.tsx',
  'app/aspc-policy/page.tsx',
  'app/aspc-ready/page.tsx',
  'app/contact/page.tsx',
  'app/editForm/[flight_id]/page.tsx',
  'app/faq/page.tsx',
  'app/feedback/page.tsx',
  'app/matchForm/page.tsx',
  'app/MatchRequestsPage/page.tsx',
  'app/page.tsx',
  'app/profile/page.tsx',
  'app/questionnaires/page.tsx',
  'app/results/page.tsx',
  'app/unmatched/page.tsx',
  'components/admin/AddRider.tsx',
  'components/admin/AdminDashboard.tsx',
  'components/admin/EmailComposerModal.tsx',
  'components/admin/groups-management/ChangeLogPanel.tsx',
  'components/admin/groups-management/ChangesPanel.tsx',
  'components/admin/groups-management/CorralPanel.tsx',
  'components/admin/groups-management/CreateGroupPanel.tsx',
  'components/admin/groups-management/FiltersPanel.tsx',
  'components/admin/groups-management/GroupsManagementModals.tsx',
  'components/admin/groups-management/MatchedGroupsPanel.tsx',
  'components/admin/groups-management/UnmatchedRidersPanel.tsx',
  'components/admin/groups-management/utils/rules.ts',
  'components/admin/GroupsManagement.tsx',
  'components/aspc-delay/DelayInfoStep.tsx',
  'components/aspc-delay/FlightConfirmStep.tsx',
  'components/aspc-delay/NewFlightStep.tsx',
  'components/aspc-delay/ReasonForDelayStep.tsx',
  'components/buttons/RedirectButton.tsx',
  'components/buttons/SimpleRedirectButton.tsx',
  'components/feedback/StarRating.tsx',
  'components/forms/FlightForm.tsx',
  'components/questionnaires/ConfirmCancel.tsx',
  'components/questionnaires/ManyBagsNotice.tsx',
  'components/questionnaires/SubmitSuccess.tsx',
  'components/results/CommentSection.tsx',
  'components/results/ConfirmCancelMatch.tsx',
  'components/results/EmptyState.tsx',
  'components/results/MatchCard.tsx',
]

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

  it('only lists legacy files that still violate', () => {
    const clean = LEGACY_FILES.filter(
      (file) => !files.includes(file) || findViolations(file).length === 0,
    )
    expect(clean).toEqual([])
  })
})
