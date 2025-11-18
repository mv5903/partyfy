const withPWA = require('next-pwa')({
  dest: 'public',
})

const withNextIntl = require('next-intl/plugin')(
  './i18n/request.ts'
);

module.exports = withPWA(withNextIntl({
  reactStrictMode: false,
}))
