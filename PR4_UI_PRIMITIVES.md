# PR 4: UI Primitives + Design System

## Branch
`feat/ui/primitives`

## Summary
Creates a foundational UI component library with reusable primitives (Button, Input, Modal, Icon) and integrates them into Login and Register pages as examples.

## Files Changed
- `client/src/components/ui/Button.tsx` (new) - Button component with variants and sizes
- `client/src/components/ui/Input.tsx` (new) - Input component with label and error support
- `client/src/components/ui/Modal.tsx` (new) - Modal component with portal rendering
- `client/src/components/ui/Icon.tsx` (new) - Icon component with SVG paths
- `client/src/components/ui/index.ts` (new) - Barrel export for UI components
- `client/src/pages/Login.tsx` - Updated to use Button and Input components
- `client/src/pages/Register.tsx` - Updated to use Button and Input components

## Features

### Button Component
- **Variants**: `primary`, `secondary`, `danger`, `success`, `warning`
- **Sizes**: `sm`, `md`, `lg`
- **Loading State**: Shows spinner and "Загрузка..." text
- **Full Width**: Optional `fullWidth` prop
- **Type-safe**: Full TypeScript support

### Input Component
- **Label Support**: Optional label prop
- **Error Display**: Shows error message below input
- **Helper Text**: Optional helper text
- **Full Width**: Optional `fullWidth` prop (default: true)
- **Forward Ref**: Supports ref forwarding for form libraries
- **Type-safe**: Full TypeScript support

### Modal Component
- **Portal Rendering**: Renders in document.body via React Portal
- **Backdrop**: Clickable backdrop to close
- **Escape Key**: Closes on Escape key press
- **Body Scroll Lock**: Prevents body scrolling when open
- **Sizes**: `sm`, `md`, `lg`, `xl`
- **Close Button**: Optional close button in header

### Icon Component
- **SVG Icons**: Uses Heroicons-style SVG paths
- **Available Icons**: home, user, settings, logout, close, check, error, warning, info, loading
- **Customizable Size**: Size prop (default: 24)
- **Type-safe**: IconName type for autocomplete

## Usage Examples

### Button
```tsx
import { Button } from '@/components/ui'

<Button variant="primary" size="md" onClick={handleClick}>
  Click me
</Button>

<Button variant="danger" size="lg" fullWidth isLoading={isSubmitting}>
  Delete
</Button>
```

### Input
```tsx
import { Input } from '@/components/ui'

<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
  error={errors.email}
  {...register('email')}
/>
```

### Modal
```tsx
import { Modal } from '@/components/ui'

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Confirm">
  <p>Are you sure?</p>
</Modal>
```

### Icon
```tsx
import { Icon } from '@/components/ui'

<Icon name="home" size={24} className="text-white" />
```

## Testing Steps

### Visual Testing
1. Start dev server: `cd client && npm run dev`
2. Navigate to `/login`:
   - Verify Input components render with labels
   - Verify Button shows loading state when submitting
   - Verify error messages display correctly
3. Navigate to `/register`:
   - Verify all Input fields use new components
   - Verify Button works correctly
4. Test Modal (if integrated elsewhere):
   - Open modal
   - Click backdrop to close
   - Press Escape to close
   - Verify body scroll is locked

### Type Check
```bash
cd client
npm run typecheck
```

## Migration Notes
- **No breaking changes** - Old components still work
- Login and Register pages now use new UI primitives
- Other pages can be migrated incrementally
- All components are fully typed and support standard HTML attributes

## Design System Benefits
1. **Consistency**: All buttons/inputs look the same across the app
2. **Maintainability**: Change styles in one place
3. **Type Safety**: TypeScript ensures correct usage
4. **Reusability**: Easy to use across the codebase
5. **Accessibility**: Built-in support for labels, errors, etc.

## Future Enhancements
- Add more icon variants
- Add Textarea component
- Add Select/Dropdown component
- Add Checkbox and Radio components
- Add Toast/Notification component
- Add Card component
- Add Spinner/Loading component
- Add Tooltip component

## Next Steps
- PR 5: Lint/type/test CI setup
