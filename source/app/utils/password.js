/**
 * Password policy: at least 8 characters, one uppercase letter, one digit.
 *
 * Mirrored server-side by wordpress/mu-plugins/sab-password-policy.php (keep
 * both in sync). Accented capitals (É, À…) count as uppercase.
 */
export const PASSWORD_MIN_LENGTH = 8;

/** @returns {{length: boolean, uppercase: boolean, digit: boolean}} */
export const checkPassword = (password = '') => ({
  length: password.length >= PASSWORD_MIN_LENGTH,
  uppercase: /[A-ZÀ-ÖØ-Þ]/.test(password),
  digit: /[0-9]/.test(password),
});

export const isPasswordValid = password => {
  const rules = checkPassword(password);
  return rules.length && rules.uppercase && rules.digit;
};
