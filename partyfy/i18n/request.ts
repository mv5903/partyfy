import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // For now, we'll use a single locale (en-US)
  // You can expand this to support multiple locales later
  const locale = 'en-US';

  return {
    locale,
    messages: (await import(`./en-US.json`)).default
  };
});
