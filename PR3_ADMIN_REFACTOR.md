# PR 3: Admin Refactor (Split & Lazy Load)

## Branch
`refactor/admin/split-tabs`

## Summary
Refactors the large `Admin.tsx` component (640+ lines) by extracting each tab into separate lazy-loaded components. This improves code maintainability, enables code splitting, and reduces initial bundle size.

## Files Changed
- `client/src/pages/Admin.tsx` - Refactored to use lazy-loaded tab components
- `client/src/pages/admin/MainTab.tsx` (new) - Main dashboard tab
- `client/src/pages/admin/UsersTab.tsx` (new) - Users management tab
- `client/src/pages/admin/PostsTab.tsx` (new) - Posts moderation tab
- `client/src/pages/admin/IPBansTab.tsx` (new) - IP bans management tab
- `client/src/pages/admin/StatsTab.tsx` (new) - Detailed statistics tab
- `client/src/pages/admin/MikuTab.tsx` (new) - Miku auto-commenting settings tab
- `client/src/pages/admin/__tests__/UsersTab.spec.tsx` (new) - Unit tests for UsersTab

## Features
- **Code Splitting**: Each tab is lazy-loaded using `React.lazy()` and `Suspense`
- **Smaller Components**: Each tab is now a focused, maintainable component
- **Type Safety**: All components use TypeScript with proper prop interfaces
- **Preserved Functionality**: All existing behavior maintained, no breaking changes
- **Loading States**: Suspense fallback shows loading spinner while tab components load

## Component Structure

### MainTab
- Displays overview statistics cards
- Shows users, posts, pending moderation, and IP bans counts

### UsersTab
- Lists all users with avatar and status
- Ban/unban functionality
- Mute/unmute functionality with hours input
- Props: users array, mutation hooks

### PostsTab
- Lists posts pending moderation
- Approve/reject actions
- Props: posts array, mutation hooks

### IPBansTab
- Form to create new IP bans
- List of active IP bans
- Remove ban functionality
- Props: ipBans array, mutation hooks

### StatsTab
- Detailed statistics breakdown
- User statistics (total, banned, muted)
- Content statistics (posts, comments, pending)
- Props: stats object

### MikuTab
- Auto-commenting settings form
- Personality override options
- Day-of-week selection
- Test run functionality
- Statistics display
- Props: mikuSettings query, mutation hooks

## Testing Steps

### Run Tests
```bash
cd client
npm run test UsersTab
```

### Manual Testing
1. Start dev server: `cd client && npm run dev`
2. Log in as admin user
3. Navigate to `/admin`
4. Test each tab:
   - **Main**: Should show statistics cards
   - **Users**: Click ban/unban, mute/unmute buttons
   - **Posts**: Approve/reject pending posts
   - **IP Bans**: Create and remove IP bans
   - **Stats**: View detailed statistics
   - **Miku**: Update settings and test run
   - **Pages**: HTML page editor (unchanged)
5. Verify lazy loading:
   - Open DevTools → Network tab
   - Switch between tabs
   - Should see chunks loading for each tab component

### Test Coverage
- ✅ UsersTab renders users list
- ✅ Shows correct buttons based on user status
- ✅ Calls mutations with correct parameters
- ✅ Displays empty state

## Migration Notes
- **No breaking changes** - All functionality preserved
- Tab components are now lazy-loaded (better performance)
- Individual tab components can be tested in isolation
- Mutations are passed as props (maintains existing behavior)

## Performance Benefits
1. **Code Splitting**: Each tab loads only when needed
2. **Smaller Initial Bundle**: Admin page loads faster
3. **Better Caching**: Unused tabs don't affect bundle size
4. **Improved Maintainability**: Each tab is a focused component

## Next Steps
- PR 4: UI primitives (Button, Input, Modal, Icon)
- Future: Add more tests for other tab components
