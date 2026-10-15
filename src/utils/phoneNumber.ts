const INTERNATIONAL_PHONE_FORMAT = /^\+?[0-9().\s-]+$/;

export const isValidPhoneNumber = (value?: string | null): boolean => {
  if (!value) return false;

  const trimmedValue = value.trim();
  if (!INTERNATIONAL_PHONE_FORMAT.test(trimmedValue)) return false;

  const digitCount = trimmedValue.replace(/\D/g, '').length;
  return digitCount >= 7 && digitCount <= 15;
};
