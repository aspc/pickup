/**
 * Whether a click on the profile page would leave the page (and so should be
 * blocked while the profile is incomplete or has unsaved changes).
 */
export const isProfileExitClick = (target: Element | null): boolean => {
  if (!target) return false
  if (target.closest('button[type="submit"]')) return false
  // Typing, ticking and choosing inside a form never leaves the page.
  if (target.closest('input, select, textarea, label')) return false
  return Boolean(
    target.closest('a[href], button, [role="button"], .cursor-pointer'),
  )
}
