/**
 * Shared form control styles for DARK surfaces only.
 *
 * Do not use this on light panels (for example the project workspace Files
 * tab and task board, which render on theme.bg.card = #FFFFFF). Forcing
 * color-scheme: dark there produces a white control with a dark option popup,
 * which is the same class of bug this file exists to prevent.
 */

/**
 * Why this exists: a native select inside a dark UI has two separate problems,
 * and both have to be fixed or the control looks broken.
 *
 * 1. The closed control. Left alone, the browser draws its own native widget
 *    (system arrow, platform-specific chrome) which does not match the custom
 *    text inputs sitting next to it. `appearance: none` removes it and a
 *    custom chevron puts it back in the app's own style.
 *
 * 2. The open popup. The list of options is drawn by the operating system, not
 *    by the page, so it inherits nothing from our styles. Without
 *    `colorScheme: 'dark'` it renders as a white list with dark text on
 *    Windows, which is unreadable against a dark form. `colorScheme: 'dark'`
 *    is what tells the browser to draw that OS popup dark, and
 *    `darkOptionStyle` covers engines that ignore it.
 *
 * Note: use `backgroundColor` (never the `background` shorthand) when adding
 * these on top of a style that already sets `background`, otherwise the
 * shorthand resets the chevron image away.
 */

const CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='none' stroke='%2394A3B8' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' d='M1 1.5L6 6.5L11 1.5'/%3E%3C/svg%3E")`

/**
 * Dropdown styling to spread over an existing dark input style.
 *
 * @param {object} [overrides] additional styles, applied last.
 */
export function darkSelectStyle(overrides = {}) {
  return {
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    colorScheme: 'dark',
    cursor: 'pointer',
    // Room for the custom chevron so the longest option is never clipped.
    paddingRight: '40px',
    backgroundImage: CHEVRON,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    ...overrides,
  }
}

/**
 * Per-option styling. `colorScheme: 'dark'` on the select handles most
 * engines; this covers the rest and keeps the popup readable either way.
 */
export const darkOptionStyle = {
  backgroundColor: '#131A2E',
  color: '#ffffff',
}