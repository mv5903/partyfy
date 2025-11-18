# i18n + Playwright Migration Guide

This guide shows you how to migrate your existing components to use i18n with Playwright test IDs.

## Migration Strategy

### Phase 1: New Components (Immediate)
- All new components should use translations + test IDs from the start
- Follow the examples in TRANSLATION_EXAMPLES.md

### Phase 2: High-Priority Components (Week 1-2)
- Landing page
- Login/Auth flows
- Critical user paths (requesting songs, adding friends)

### Phase 3: Remaining Components (Week 3+)
- Settings
- Host view
- Admin features

## Step-by-Step Migration

### 1. Identify Component to Migrate

Let's migrate the ClearTable button as an example.

**Before:**
```tsx
// components/host/ClearTable.tsx
export default function ClearTable({ table }) {
  const handleClear = async () => {
    let result = await alert.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      confirmButtonText: 'Yes, clear it!',
    });

    if (result.isConfirmed) {
      await alert.fire({
        title: 'Cleared!',
        text: 'The table has been cleared.',
      });
    }
  };

  return (
    <Button onClick={handleClear}>
      Clear {table}
    </Button>
  );
}
```

### 2. Add 'use client' Directive (if not present)

```tsx
'use client';

import { useTranslationWithTestId } from '@/hooks/useTranslationWithTestId';
// ... other imports
```

### 3. Import and Use Translation Hook

```tsx
'use client';

import { useTranslationWithTestId } from '@/hooks/useTranslationWithTestId';
import { useTranslations } from 'next-intl';

export default function ClearTable({ table }) {
  const tAlerts = useTranslations('alerts.clearTable');
  const { t, testId } = useTranslationWithTestId('components.host');

  const handleClear = async () => {
    let result = await alert.fire({
      title: tAlerts('confirmTitle'),
      text: tAlerts('confirmText'),
      confirmButtonText: tAlerts('confirmButton'),
    });

    if (result.isConfirmed) {
      await alert.fire({
        title: tAlerts('successTitle'),
        text: tAlerts('successText'),
      });
    }
  };

  return (
    <Button
      onClick={handleClear}
      data-testid={testId(table === 'Queue' ? 'clearQueue' : 'clearRecentlyPlayed')}
    >
      {table === 'Queue' ? t('clearQueue') : t('clearRecentlyPlayed')}
    </Button>
  );
}
```

### 4. Update Selector Helper

Add to `test/helpers/selectors.ts`:

```typescript
export const selectors = {
  // ... existing selectors
  host: {
    clearQueue: 'components.host.clearQueue',
    clearRecentlyPlayed: 'components.host.clearRecentlyPlayed',
  },
};
```

### 5. Write Test

Create `test/host.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { selectors } from './helpers/selectors';

test.describe('Host Controls', () => {
  test('should show confirmation before clearing queue', async ({ page }) => {
    await page.goto('/dashboard'); // Adjust based on your routing

    const clearButton = page.getByTestId(selectors.host.clearQueue);

    // Set up dialog handler
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Are you sure?');
      await dialog.accept();
    });

    await clearButton.click();
  });
});
```

## Real-World Example: RequestSong Component

### Original Component (Partial)

```tsx
// Before
<h3 className="text-xl">
  Controlling: <strong>{currentFriend.Username}</strong>
</h3>
{queueUsage && queueUsage.hasRestriction && (
  <div className="text-center mb-4 text-white">
    {queueUsage.timeUntilNextQueue ? (
      <h3 className="text-yellow-400">
        <strong>{queueUsage.timeUntilNextQueue}</strong> remaining until your next queue
      </h3>
    ) : (
      <h3>
        <strong>{queueUsage.maxQueueCount - queueUsage.currentQueueCount}</strong> of <strong>{queueUsage.maxQueueCount}</strong> queues remaining in {currentFriend.Username}'s quota
      </h3>
    )}
  </div>
)}
```

### Migrated Component

```tsx
'use client';

import { useTranslationWithTestId } from '@/hooks/useTranslationWithTestId';
import { useTranslations } from 'next-intl';

export default function RequestSong({ currentFriend, queueUsage }) {
  const { t, testId } = useTranslationWithTestId('components.request');

  return (
    <>
      <h3 className="text-xl" data-testid={testId('controlling')}>
        {t('controlling')} <strong>{currentFriend.Username}</strong>
      </h3>
      {queueUsage && queueUsage.hasRestriction && (
        <div className="text-center mb-4 text-white">
          {queueUsage.timeUntilNextQueue ? (
            <h3
              className="text-yellow-400"
              data-testid={testId('queueQuotaTimeRemaining')}
            >
              {t('queueQuotaTimeRemaining', {
                time: queueUsage.timeUntilNextQueue
              })}
            </h3>
          ) : (
            <h3 data-testid={testId('queueQuotaRemaining')}>
              {t('queueQuotaRemaining', {
                remaining: queueUsage.maxQueueCount - queueUsage.currentQueueCount,
                max: queueUsage.maxQueueCount,
                username: currentFriend.Username
              })}
            </h3>
          )}
        </div>
      )}
    </>
  );
}
```

### Corresponding Test

```typescript
test.describe('Request Song - Queue Quota', () => {
  test('should display remaining queues', async ({ page }) => {
    await page.goto('/request/friend123');

    const quota = page.getByTestId(selectors.request.queueQuotaRemaining);
    await expect(quota).toBeVisible();
    await expect(quota).toMatch(/\d+ of \d+ queues remaining/);
  });

  test('should display time remaining when exhausted', async ({ page }) => {
    await page.goto('/request/friend123');

    const timeRemaining = page.getByTestId(selectors.request.queueQuotaTimeRemaining);

    if (await timeRemaining.isVisible()) {
      await expect(timeRemaining).toHaveClass(/text-yellow-400/);
      await expect(timeRemaining).toContainText('remaining until your next queue');
    }
  });
});
```

## Common Patterns

### Pattern 1: Simple Text

**Before:**
```tsx
<h1>Friends</h1>
```

**After:**
```tsx
const { t, testId } = useTranslationWithTestId('components.friends');

<h1 data-testid={testId('title')}>{t('title')}</h1>
```

### Pattern 2: Buttons with Icons

**Before:**
```tsx
<Button onClick={handleSave}>
  <FaSave className="mr-2" />
  Save
</Button>
```

**After:**
```tsx
const { t, testId } = useTranslationWithTestId('common.buttons');

<Button onClick={handleSave} data-testid={testId('save')}>
  <FaSave className="mr-2" />
  {t('save')}
</Button>
```

### Pattern 3: Dynamic Content

**Before:**
```tsx
<p>Welcome, {username}!</p>
```

**After:**
```tsx
// In en-US.json:
{
  "pages": {
    "dashboard": {
      "welcome": "Welcome, {username}!"
    }
  }
}

// In component:
const t = useTranslations('pages.dashboard');

<p data-testid="pages.dashboard.welcome">
  {t('welcome', { username })}
</p>
```

### Pattern 4: Conditional Text

**Before:**
```tsx
<p>
  {isOnline ? 'User is online' : 'User is offline'}
</p>
```

**After:**
```tsx
// In en-US.json:
{
  "components": {
    "status": {
      "online": "User is online",
      "offline": "User is offline"
    }
  }
}

// In component:
const { t, testId } = useTranslationWithTestId('components.status');

<p data-testid={testId(isOnline ? 'online' : 'offline')}>
  {t(isOnline ? 'online' : 'offline')}
</p>
```

### Pattern 5: Lists

**Before:**
```tsx
{items.map((item, index) => (
  <li key={index}>{item.name}</li>
))}
```

**After:**
```tsx
{items.map((item, index) => (
  <li
    key={index}
    data-testid={`components.list.item-${index}`}
  >
    {item.name}
  </li>
))}

// In test:
const firstItem = page.getByTestId('components.list.item-0');
```

## Checklist for Each Component

- [ ] Add `'use client'` directive (if client component)
- [ ] Import translation hooks
- [ ] Replace all hardcoded strings with `t()` calls
- [ ] Add corresponding keys to `en-US.json`
- [ ] Add `data-testid` to all interactive elements
- [ ] Update `test/helpers/selectors.ts`
- [ ] Write Playwright tests
- [ ] Run tests to verify
- [ ] Update documentation if needed

## Automated Migration Tools

### Find Hardcoded Strings

```bash
# Find JSX strings
grep -r ">[A-Z][^<]*<" partyfy/components --include="*.tsx"

# Find string literals in JSX
grep -r '{"[^"]*"}' partyfy/components --include="*.tsx"
```

### Batch Replace (Use with caution!)

```bash
# Replace specific strings
find partyfy/components -type f -name "*.tsx" -exec sed -i 's/Save/{t("save")}/g' {} \;
```

## Testing Your Migration

### 1. Visual Check
```bash
npm run dev
# Navigate to migrated component
# Verify text displays correctly
```

### 2. Run Translation Tests
```bash
# Create a simple test that checks if translations load
npx playwright test --grep "translation"
```

### 3. Run Component Tests
```bash
npx playwright test test/your-component.spec.ts
```

### 4. Check for Missing Keys
```typescript
// Create a script to validate all translation keys exist
// tools/validate-translations.ts
```

## Rollback Plan

If something goes wrong:

1. **Git**: Revert the commit
   ```bash
   git revert HEAD
   ```

2. **Manual**: Keep backup of original component
   ```tsx
   // ComponentName.backup.tsx
   ```

3. **Feature Flag**: Use conditional rendering
   ```tsx
   const useTranslations = process.env.NEXT_PUBLIC_USE_I18N === 'true';

   return useTranslations ? (
     <NewComponent />
   ) : (
     <OldComponent />
   );
   ```

## Support

- See `TRANSLATION_EXAMPLES.md` for more examples
- See `test/README.md` for testing guide
- Check [next-intl docs](https://next-intl-docs.vercel.app/)
- Check [Playwright docs](https://playwright.dev)
