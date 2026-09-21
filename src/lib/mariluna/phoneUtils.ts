export interface CountryPhoneConfig {
  iso: string;
  nameNl: string;
  nameEn: string;
  code: string;
  flag: string;
  example: string;
}

export const COUNTRY_PHONE_CODES: CountryPhoneConfig[] = [
  // Primary core European / Portuguese connections for Patricia & Mariluna
  { iso: 'BE', nameNl: 'België', nameEn: 'Belgium', code: '+32', flag: '🇧🇪', example: '0470 12 34 56' },
  { iso: 'NL', nameNl: 'Nederland', nameEn: 'Netherlands', code: '+31', flag: '🇳🇱', example: '06 12345678' },
  { iso: 'PT', nameNl: 'Portugal', nameEn: 'Portugal', code: '+351', flag: '🇵🇹', example: '912 345 678' },
  { iso: 'FR', nameNl: 'Frankrijk', nameEn: 'France', code: '+33', flag: '🇫🇷', example: '06 12 34 56 78' },
  { iso: 'DE', nameNl: 'Duitsland', nameEn: 'Germany', code: '+49', flag: '🇩🇪', example: '0151 1234567' },
  { iso: 'LU', nameNl: 'Luxemburg', nameEn: 'Luxembourg', code: '+352', flag: '🇱🇺', example: '621 123 456' },
  { iso: 'GB', nameNl: 'Verenigd Koninkrijk', nameEn: 'United Kingdom', code: '+44', flag: '🇬🇧', example: '07123 456789' },
  { iso: 'ES', nameNl: 'Spanje', nameEn: 'Spain', code: '+34', flag: '🇪🇸', example: '612 34 56 78' },
  { iso: 'IT', nameNl: 'Italië', nameEn: 'Italy', code: '+39', flag: '🇮🇹', example: '312 345 6789' },
  // Additional common international countries
  { iso: 'CH', nameNl: 'Zwitserland', nameEn: 'Switzerland', code: '+41', flag: '🇨🇭', example: '079 123 45 67' },
  { iso: 'AT', nameNl: 'Oostenrijk', nameEn: 'Austria', code: '+43', flag: '🇦🇹', example: '0664 1234567' },
  { iso: 'IE', nameNl: 'Ierland', nameEn: 'Ireland', code: '+353', flag: '🇮🇪', example: '087 123 4567' },
  { iso: 'DK', nameNl: 'Denemarken', nameEn: 'Denmark', code: '+45', flag: '🇩🇰', example: '20 12 34 56' },
  { iso: 'SE', nameNl: 'Zweden', nameEn: 'Sweden', code: '+46', flag: '🇸🇪', example: '070 123 45 67' },
  { iso: 'NO', nameNl: 'Noorwegen', nameEn: 'Norway', code: '+47', flag: '🇳🇴', example: '412 34 567' },
  { iso: 'FI', nameNl: 'Finland', nameEn: 'Finland', code: '+358', flag: '🇫🇮', example: '040 1234567' },
  { iso: 'US', nameNl: 'Verenigde Staten', nameEn: 'United States', code: '+1', flag: '🇺🇸', example: '(555) 123-4567' },
  { iso: 'CA', nameNl: 'Canada', nameEn: 'Canada', code: '+1', flag: '🇨🇦', example: '(555) 123-4567' },
  { iso: 'BR', nameNl: 'Brazilië', nameEn: 'Brazil', code: '+55', flag: '🇧🇷', example: '11 91234-5678' },
  { iso: 'AU', nameNl: 'Australië', nameEn: 'Australia', code: '+61', flag: '🇦🇺', example: '0412 345 678' },
  { iso: 'AE', nameNl: 'Verenigde Arabische Emiraten', nameEn: 'UAE', code: '+971', flag: '🇦🇪', example: '050 123 4567' },
];

/**
 * Normalizes a country code and phone number into clean E.164 and display formats.
 */
export function normalizePhoneNumber(
  countryCode: string,
  rawPhone: string
): { phoneE164?: string; formattedDisplay?: string; rawNumber: string } {
  const trimmed = (rawPhone || '').trim();
  if (!trimmed) {
    return { rawNumber: '' };
  }

  // If user already typed leading +, let's extract that country code or use provided
  let cleanDigits = trimmed.replace(/[^\d+]/g, '');
  let code = (countryCode || '').trim();
  if (!code.startsWith('+')) {
    code = `+${code.replace(/[^\d]/g, '')}`;
  }

  // If user pasted a full number with +
  if (cleanDigits.startsWith('+')) {
    // Already has +
    const e164 = cleanDigits;
    return {
      phoneE164: e164,
      formattedDisplay: formatE164ForDisplay(e164),
      rawNumber: trimmed,
    };
  }

  // Remove leading 00 international prefix if present
  if (cleanDigits.startsWith('00')) {
    const e164 = `+${cleanDigits.slice(2)}`;
    return {
      phoneE164: e164,
      formattedDisplay: formatE164ForDisplay(e164),
      rawNumber: trimmed,
    };
  }

  // Remove national trunk prefix '0' (e.g. 0470 -> 470) if country code is supplied
  let significantDigits = cleanDigits.replace(/^[0]+/, '');
  if (!significantDigits) {
    return { rawNumber: trimmed };
  }

  const phoneE164 = `${code}${significantDigits}`;
  const formattedDisplay = `${code} ${formatLocalDigits(significantDigits)}`;

  return {
    phoneE164,
    formattedDisplay,
    rawNumber: trimmed,
  };
}

/**
 * Basic plausibility check:
 * - Empty string is valid (phone is optional)
 * - Digits count between 4 and 15
 * - No invalid characters
 */
export function validatePhoneNumber(
  countryCode: string,
  rawPhone: string
): { isValid: boolean; errorMessage?: string } {
  const trimmed = (rawPhone || '').trim();
  if (!trimmed) {
    return { isValid: true };
  }

  // Disallow alphabetic characters
  if (/[a-zA-Z]/.test(trimmed)) {
    return {
      isValid: false,
      errorMessage: 'Controleer het telefoonnummer (geen letters toegestaan).',
    };
  }

  const digitsOnly = trimmed.replace(/[^\d]/g, '');
  if (digitsOnly.length < 5 || digitsOnly.length > 15) {
    return {
      isValid: false,
      errorMessage: 'Controleer het telefoonnummer (te kort of te lang).',
    };
  }

  if (!countryCode || !countryCode.trim()) {
    return {
      isValid: false,
      errorMessage: 'Selecteer een geldige landcode.',
    };
  }

  return { isValid: true };
}

/**
 * Formats E.164 string with calm grouping for readability
 */
export function formatE164ForDisplay(e164: string): string {
  if (!e164) return '';
  // e.g. +32470123456 -> +32 470 12 34 56
  // Match standard prefix
  const match = e164.match(/^(\+\d{1,4})(\d+)$/);
  if (match) {
    const prefix = match[1];
    const rest = match[2];
    return `${prefix} ${formatLocalDigits(rest)}`;
  }
  return e164;
}

function formatLocalDigits(digits: string): string {
  if (digits.length <= 4) return digits;
  if (digits.length <= 8) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`.trim();
  }
  // 9-10 digits: typical mobile e.g. 470 12 34 56
  if (digits.length === 9) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
  }
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}
