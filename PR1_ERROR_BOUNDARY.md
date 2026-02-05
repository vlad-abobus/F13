# PR 1: ErrorBoundary + Integration

## Branch
`feat/ui/error-boundary`

## Summary
Adds a global ErrorBoundary component to catch React errors and display a user-friendly fallback UI. Integrates ErrorBoundary into the root App component and adds Suspense for route-level code splitting preparation.

## Files Changed
- `client/src/components/ErrorBoundary.tsx` (new) - Error boundary class component with fallback UI
- `client/src/App.tsx` - Integrated ErrorBoundary and Suspense wrapper
- `client/src/components/__tests__/ErrorBoundary.spec.tsx` (new) - Unit tests for ErrorBoundary
- `client/src/test/setup.ts` (new) - Test setup file for Vitest
- `client/vite.config.ts` - Added Vitest configuration
- `client/package.json` - Added testing dependencies (vitest, @testing-library/react, etc.) and test scripts
- `client/tsconfig.json` - Updated to include test files

## Features
- **ErrorBoundary Component**: Class component that catches React errors and displays fallback UI
- **Custom Fallback Support**: Accepts optional `fallback` prop for custom error UI
- **Error Callback**: Optional `onError` prop for error reporting integration (ready for Sentry)
- **Development Mode**: Shows error details in development, hides in production
- **Reset Functionality**: "Try again" button to reset error state
- **Suspense Integration**: Added Suspense wrapper around Routes with loading fallback

## Testing Steps

### Run Tests
```bash
cd client
npm install  # Install new dependencies
npm run test
```

### Manual Testing
1. Start dev server: `npm run dev`
2. Visit any page - should load normally
3. To test error boundary, temporarily add this to any component:
   ```tsx
   throw new Error('Test error')
   ```
4. Verify error boundary UI appears with "Что-то пошло не так" message
5. Click "Попробовать снова" button - should reset (if component no longer throws)

### Test Coverage
- ✅ Renders children when no error
- ✅ Shows fallback UI when error occurs
- ✅ Supports custom fallback prop
- ✅ Calls onError callback
- ✅ Reset button functionality
- ✅ Development mode error details

## Migration Notes
- No breaking changes - ErrorBoundary wraps existing routes
- All existing functionality preserved
- Suspense fallback is minimal and non-intrusive

## Next Steps
- PR 2: Centralize QueryClient configuration
- Future: Integrate with error reporting service (Sentry) in production
