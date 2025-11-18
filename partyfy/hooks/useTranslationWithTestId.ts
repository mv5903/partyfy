import { useTranslations } from 'next-intl';

/**
 * Custom hook that returns both the translation and a test ID based on the translation key.
 * This allows for consistent identification of elements in both UI and E2E tests.
 *
 * @example
 * const { t, testId } = useTranslationWithTestId('common.buttons');
 * <button data-testid={testId('save')}>{t('save')}</button>
 */
export function useTranslationWithTestId(namespace: string) {
  const t = useTranslations(namespace);

  /**
   * Generate a test ID from a translation key
   * @param key - The translation key (e.g., 'save', 'cancel')
   * @returns A test ID string (e.g., 'common.buttons.save')
   */
  const testId = (key: string): string => {
    return `${namespace}.${key}`;
  };

  /**
   * Get both the translation and test ID for a key
   * @param key - The translation key
   * @returns Object with text and testId
   */
  const get = (key: string) => ({
    text: t(key),
    testId: testId(key)
  });

  return { t, testId, get };
}

/**
 * Helper function to create a test ID without using the hook (for server components)
 * @param namespace - The translation namespace
 * @param key - The translation key
 * @returns A test ID string
 */
export function createTestId(namespace: string, key: string): string {
  return `${namespace}.${key}`;
}
