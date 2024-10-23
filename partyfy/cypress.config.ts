import { defineConfig } from "cypress";
import installLogsPrinter from 'cypress-terminal-report/src/installLogsPrinter.js';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Install the logs printer
      installLogsPrinter(on, {
        printLogsToConsole: 'always', // Ensure logs are always printed to the console
      });

      // Other event listeners
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium' && browser.name !== 'electron') {
          launchOptions.args.push('--incognito');
        } else if (browser.family === 'firefox') {
          launchOptions.args.push('-private');
        }
        return launchOptions;
      });

      return config;
    },
    chromeWebSecurity: false,
    experimentalSessionAndOrigin: true,
    testIsolation: "off",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1"
  },
});
