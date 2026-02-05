# PR 2: QueryClient Centralization

## Branch
`chore/ui/query-client`

## Summary
Centralizes React Query configuration into a dedicated `lib/queryClient.ts` file with improved defaults for retry logic, cache times, and error handling.

## Files Changed
- `client/src/lib/queryClient.ts` (new) - Centralized QueryClient configuration
- `client/src/App.tsx` - Updated to import queryClient from lib

## Features
- **Centralized Configuration**: All React Query defaults in one place
- **Smart Retry Logic**: 
  - Doesn't retry on 4xx client errors
  - Retries up to 3 times for server errors with exponential backoff
- **Improved Cache Management**: 
  - 5 minutes stale time
  - 10 minutes garbage collection time
- **Mutation Retries**: Retries mutations once on failure
- **Window Focus Refetch**: Automatically refetches stale data when window regains focus

## Configuration Details

### Queries Defaults
- `staleTime`: 5 minutes (data considered fresh)
- `gcTime`: 10 minutes (cache retention)
- `retry`: Smart retry (no retry for 4xx, up to 3 retries for other errors)
- `retryDelay`: Exponential backoff (1s, 2s, 4s, max 30s)
- `refetchOnWindowFocus`: true (keeps data fresh)
- `refetchOnMount`: true

### Mutations Defaults
- `retry`: 1 attempt
- `retryDelay`: 1 second

## Testing Steps

### Verify Configuration
1. Start dev server: `cd client && npm run dev`
2. Open browser DevTools → Network tab
3. Trigger a failed API request (e.g., disconnect network, invalid endpoint)
4. Verify retry behavior:
   - 4xx errors should not retry
   - 5xx errors should retry up to 3 times with delays
5. Verify cache behavior:
   - Navigate away and back to a page with queries
   - Data should be cached and not refetch immediately if fresh

### Type Check
```bash
cd client
npm run typecheck
```

## Migration Notes
- **No breaking changes** - All existing queries continue to work
- Individual queries can still override these defaults if needed
- Example override:
  ```tsx
  useQuery({
    queryKey: ['special'],
    queryFn: fetchSpecial,
    staleTime: Infinity, // Override default
  })
  ```

## Benefits
1. **Consistency**: All queries use the same retry/cache strategy
2. **Better UX**: Smart retries prevent unnecessary requests for client errors
3. **Performance**: Appropriate cache times reduce unnecessary refetches
4. **Maintainability**: Single source of truth for Query configuration

## Next Steps
- PR 3: Admin refactor (split & lazy load)
