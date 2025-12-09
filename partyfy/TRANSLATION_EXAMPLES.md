# Translation + Playwright Test ID Examples

This guide shows how to use the i18n translation keys as Playwright test identifiers.

## Basic Usage

### 1. Using the Custom Hook (Client Components)

```tsx
'use client';

import { useTranslationWithTestId } from '@/hooks/useTranslationWithTestId';
import { Button } from '@/components/ui/button';

export default function SaveButton({ onSave }: { onSave: () => void }) {
  const { t, testId } = useTranslationWithTestId('common.buttons');

  return (
    <Button
      onClick={onSave}
      data-testid={testId('save')}
    >
      {t('save')}
    </Button>
  );
}
```

This generates:
- Text: "Save"
- Test ID: `common.buttons.save`

### 2. Using the `get` Helper

```tsx
'use client';

import { useTranslationWithTestId } from '@/hooks/useTranslationWithTestId';
import { Button } from '@/components/ui/button';

export default function ActionButtons() {
  const { get } = useTranslationWithTestId('common.buttons');

  const save = get('save');
  const cancel = get('cancel');

  return (
    <div>
      <Button data-testid={save.testId}>{save.text}</Button>
      <Button data-testid={cancel.testId}>{cancel.text}</Button>
    </div>
  );
}
```

### 3. Server Components

```tsx
import { useTranslations } from 'next-intl';
import { createTestId } from '@/hooks/useTranslationWithTestId';

export default function ServerButton() {
  const t = useTranslations('common.buttons');

  return (
    <button data-testid={createTestId('common.buttons', 'save')}>
      {t('save')}
    </button>
  );
}
```

## Real-World Example: RequestSong Component

### Before (hardcoded strings):
```tsx
<h3 className="text-xl">
  Controlling: <strong>{currentFriend.Username}</strong>
</h3>
```

### After (with translations + test IDs):
```tsx
'use client';

import { useTranslationWithTestId } from '@/hooks/useTranslationWithTestId';

export default function RequestSong({ currentFriend }) {
  const { t, testId } = useTranslationWithTestId('components.request');

  return (
    <h3
      className="text-xl"
      data-testid={testId('controlling')}
    >
      {t('controlling')} <strong>{currentFriend.Username}</strong>
    </h3>
  );
}
```

## Alert/Dialog Example

### Before:
```tsx
await alert.fire({
  title: 'Are you sure?',
  text: 'You won\'t be able to revert this!',
  confirmButtonText: 'Yes, clear it!',
});
```

### After:
```tsx
'use client';

import { useTranslations } from 'next-intl';

export default function ClearTable() {
  const t = useTranslations('alerts.clearTable');

  const handleClear = async () => {
    await alert.fire({
      title: t('confirmTitle'),
      text: t('confirmText'),
      confirmButtonText: t('confirmButton'),
    });
  };

  return (
    <button
      onClick={handleClear}
      data-testid="alerts.clearTable.trigger"
    >
      Clear
    </button>
  );
}
```

## Dynamic Content (Interpolation)

For strings with variables, use `t.rich()` or template literals:

### In en-US.json:
```json
{
  "components": {
    "request": {
      "queueQuotaRemaining": "{remaining} of {max} queues remaining in {username}'s quota"
    }
  }
}
```

### In Component:
```tsx
'use client';

import { useTranslations } from 'next-intl';

export default function QueueQuota({ remaining, max, username }) {
  const t = useTranslations('components.request');

  return (
    <h3 data-testid="components.request.queueQuotaRemaining">
      {t('queueQuotaRemaining', {
        remaining,
        max,
        username
      })}
    </h3>
  );
}
```

## Playwright Test Examples

### Basic Test:
```typescript
import { test, expect } from '@playwright/test';

test('should display save button', async ({ page }) => {
  await page.goto('/dashboard');

  // Using the translation key as test ID
  const saveButton = page.getByTestId('common.buttons.save');
  await expect(saveButton).toBeVisible();
  await expect(saveButton).toHaveText('Save');
});
```

### Testing Queue Quota Display:
```typescript
test('should show queue quota information', async ({ page }) => {
  await page.goto('/request/friend123');

  const quotaDisplay = page.getByTestId('components.request.queueQuotaRemaining');
  await expect(quotaDisplay).toBeVisible();
  await expect(quotaDisplay).toContainText('of');
  await expect(quotaDisplay).toContainText('queues remaining');
});
```

### Testing Alerts:
```typescript
test('should show confirmation dialog on clear', async ({ page }) => {
  await page.goto('/dashboard');

  const clearButton = page.getByTestId('host.clearQueue');
  await clearButton.click();

  // Alert appears (you might need to use dialog handler)
  page.on('dialog', async dialog => {
    expect(dialog.message()).toContain('Are you sure?');
    await dialog.accept();
  });
});
```

### Testing Forms:
```typescript
test('should submit friend request', async ({ page }) => {
  await page.goto('/dashboard');

  const usernameInput = page.getByTestId('friends.usernameInput');
  const submitButton = page.getByTestId('friends.submitRequest');

  await usernameInput.fill('testuser123');
  await submitButton.click();

  const successMessage = page.getByTestId('alerts.friends.requestSent');
  await expect(successMessage).toBeVisible();
});
```

## Best Practices

### 1. Use Consistent Naming
- Test IDs should match translation keys exactly
- Use dot notation: `namespace.component.element`

### 2. Add Test IDs to Interactive Elements
```tsx
// ✅ Good
<Button data-testid={testId('save')} onClick={handleSave}>
  {t('save')}
</Button>

// ❌ Bad (no test ID)
<Button onClick={handleSave}>
  {t('save')}
</Button>
```

### 3. Use Semantic Test IDs
```tsx
// ✅ Good - describes what it is
data-testid="components.request.controlling"

// ❌ Bad - too generic
data-testid="heading1"
```

### 4. Create Helper Functions for Complex Selectors
```typescript
// tests/helpers/selectors.ts
export const selectors = {
  buttons: {
    save: 'common.buttons.save',
    cancel: 'common.buttons.cancel',
  },
  request: {
    controlling: 'components.request.controlling',
    queueQuota: 'components.request.queueQuotaRemaining',
  },
};

// In test:
await page.getByTestId(selectors.buttons.save).click();
```

### 5. Type Safety
Create a TypeScript helper for type-safe test IDs:

```typescript
// tests/helpers/testIds.ts
type TranslationKey =
  | 'common.buttons.save'
  | 'common.buttons.cancel'
  | 'components.request.controlling'
  // ... add all your test IDs here

export function getTestId(key: TranslationKey): string {
  return key;
}

// Usage in tests:
await page.getByTestId(getTestId('common.buttons.save')).click();
```

## Migration Strategy

1. **Start with new components**: Use translations + test IDs from the beginning
2. **Gradually migrate existing components**: Update one component at a time
3. **Update tests as you go**: When you add test IDs to a component, update its tests
4. **Use Find & Replace carefully**: Search for hardcoded strings and replace with translation keys

## Next Steps

1. Install Playwright: `npm init playwright@latest`
2. Start migrating components to use `useTranslationWithTestId`
3. Write tests using the translation keys as selectors
4. Run tests: `npx playwright test`
