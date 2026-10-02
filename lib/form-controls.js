/**
 * Shared form control styles for DARK surfaces, plus the matching LIGHT
 * variant so dropdowns look the same everywhere.
 *
 * Never mix the two: `colorScheme: 'dark'` on a light panel produces a white
 * control with a dark option popup, and `colorScheme: 'light'` on a dark panel
 * produces a dark control with a white popup. Match the scheme to the surface
 * the control actually sits on.
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

const CHEVRON_DARK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='none' stroke='%2364748B' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' d='M1 1.5L6 6.5L11 1.5'/%3E%3C/svg%3E")`

/**
 * Dropdown styling for LIGHT surfaces, to match darkSelectStyle().
 *
 * `colorScheme: 'light'` is required so the OS-drawn option list stays light.
 * Without it Windows paints the popup using its own default, which is what
 * made these controls look like an unstyled native dropdown next to the
 * custom inputs around them.
 *
 * @param {object} [overrides] additional styles, applied last.
 */
export function lightSelectStyle(overrides = {}) {
  return {
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    colorScheme: 'light',
    cursor: 'pointer',
    paddingRight: '40px',
    backgroundImage: CHEVRON_DARK,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    ...overrides,
  }
}

/**
 * Per-option styling for light surfaces.
 */
export const lightOptionStyle = {
  backgroundColor: '#FFFFFF',
  color: '#111827',
}

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