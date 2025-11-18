# Playwright E2E Tests

This directory contains end-to-end tests for Partyfy using Playwright and translation-based test IDs.

## Quick Start

### Run all tests (headless):
```bash
npx playwright test
```

### Run all tests with UI mode (recommended for development):
```bash
npx playwright test --ui
```

### Run all tests with visible browser:
```bash
npx playwright test --headed
```

### Run specific test file:
```bash
npx playwright test test/landing.spec.ts
```

### Run tests in a specific browser:
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Debug a test:
```bash
npx playwright test --debug
```

### Generate test report:
```bash
npx playwright show-report
```

## Test Strategy

### Translation-Based Test IDs

All tests use translation keys as test IDs, which provides:

1. **Consistency**: Same identifiers for i18n and testing
2. **Maintainability**: Changes to text don't break tests
3. **Language Independence**: Tests work across all locales
4. **Semantic Meaning**: Test IDs describe what they identify

### Example:

```tsx
// Component
<Button data-testid="common.buttons.save">{t('save')}</Button>

// Test
import { selectors } from './helpers/selectors';
await page.getByTestId(selectors.buttons.save).click();
```

## Test Organization

```
test/
├── helpers/
│   └── selectors.ts          # Translation-based selector definitions
├── landing.spec.ts            # Landing page tests
├── request-song.spec.ts       # Request song functionality tests
├── buttons.spec.ts            # Button interaction tests
└── README.md                  # This file
```

## Writing Tests

### 1. Use the Selector Helper

Always import and use selectors from `test/helpers/selectors.ts`:

```typescript
import { selectors } from './helpers/selectors';

test('example test', async ({ page }) => {
  const button = page.getByTestId(selectors.buttons.save);
  await button.click();
});
```

### 2. Add New Selectors

When adding test IDs to new components, update `test/helpers/selectors.ts`:

```typescript
export const selectors = {
  // ... existing selectors
  newComponent: {
    newElement: 'components.newComponent.newElement',
  },
};
```

### 3. Test Structure

Follow this structure for test files:

```typescript
import { test, expect } from '@playwright/test';
import { selectors } from './helpers/selectors';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/path');
  });

  test('should do something', async ({ page }) => {
    const element = page.getByTestId(selectors.component.element);
    await expect(element).toBeVisible();
  });
});
```

## Authentication

Many tests require authenticated state. Set up authentication:

### Option 1: Global Setup (Recommended)

Create `test/auth.setup.ts`:

```typescript
import { test as setup } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Perform authentication steps
  await page.goto('/api/auth/login');
  // ... login flow

  // Save auth state
  await page.context().storageState({ path: authFile });
});
```

Update `playwright.config.ts`:

```typescript
export default defineConfig({
  // ... other config
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
```

### Option 2: Before Each Test

```typescript
test.beforeEach(async ({ page }) => {
  // Load cookies, localStorage, etc.
  await page.context().addCookies([
    { name: 'auth-token', value: 'xxx', domain: 'localhost', path: '/' }
  ]);
});
```

## Best Practices

### 1. Use Descriptive Test Names
```typescript
// ✅ Good
test('should display queue quota when user has remaining queues', ...)

// ❌ Bad
test('quota test', ...)
```

### 2. Wait for Elements Properly
```typescript
// ✅ Good - Playwright auto-waits
await expect(element).toBeVisible();

// ❌ Bad - Manual waits
await page.waitForTimeout(1000);
```

### 3. Use Proper Assertions
```typescript
// ✅ Good - Specific assertions
await expect(button).toHaveText('Save');
await expect(button).toBeEnabled();

// ❌ Bad - Weak assertions
await expect(button).toBeTruthy();
```

### 4. Group Related Tests
```typescript
test.describe('User Settings', () => {
  test.describe('Username Change', () => {
    // Username-related tests
  });

  test.describe('Account Deletion', () => {
    // Deletion-related tests
  });
});
```

### 5. Skip Tests That Need Setup
```typescript
test.describe.skip('Authenticated Tests', () => {
  // Tests that need auth setup
});
```

## Debugging

### Visual Debugging with UI Mode
```bash
npx playwright test --ui
```

### Debug Specific Test
```bash
npx playwright test --debug test/landing.spec.ts
```

### Playwright Inspector
```bash
PWDEBUG=1 npx playwright test
```

### View Trace
```bash
npx playwright show-trace trace.zip
```

### Screenshots on Failure
Already configured! Check `test-results/` after test failures.

## CI/CD Integration

The project includes a GitHub Actions workflow (`.github/workflows/playwright.yml`).

Tests run automatically on:
- Pull requests
- Pushes to main

View results in the Actions tab of your GitHub repository.

## Useful Commands

### Update Playwright
```bash
npm install -D @playwright/test@latest
```

### Install/Update Browsers
```bash
npx playwright install
```

### Generate Tests (Record)
```bash
npx playwright codegen http://localhost:3000
```

### Run Tests in Specific Directory
```bash
npx playwright test test/
```

### Run Tests Matching Pattern
```bash
npx playwright test --grep "button"
```

### Run Tests in Parallel
```bash
npx playwright test --workers=4
```

## Troubleshooting

### Tests Timing Out
- Increase timeout in `playwright.config.ts`
- Check if dev server is running
- Verify baseURL is correct

### Elements Not Found
- Check if test ID matches selector
- Verify component has `data-testid` attribute
- Use `await page.pause()` to inspect page

### Authentication Issues
- Verify auth cookies/tokens are set correctly
- Check if session expires during tests
- Use `storageState` for persistent auth

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Selectors Guide](https://playwright.dev/docs/selectors)
- [Debugging Guide](https://playwright.dev/docs/debug)
