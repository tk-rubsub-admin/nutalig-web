import { useTranslation } from 'react-i18next';

const capitalized = (word: string) =>
  word.charAt(0).toUpperCase() + word.slice(1).toLocaleLowerCase();

type usePropLocalizerOptions = {
  capitalizeLocal?: boolean;
  fallbackAsPropName?: boolean;
};

export function usePropLocalizer(options: usePropLocalizerOptions = {}) {
  const { capitalizeLocal = true, fallbackAsPropName = false } = options;
  const { i18n } = useTranslation();
  const locale = i18n.language;

  return <T extends Record<string, any>>(object: T | undefined, prop: string) => {
    if (!object) return undefined;

    const localizedPropName = prop + (capitalizeLocal ? capitalized(locale) : locale);

    return object[localizedPropName] ?? (fallbackAsPropName ? localizedPropName : undefined);
  };
}
