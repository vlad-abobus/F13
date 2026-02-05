# PR 6: Image Optimization & Lazy Loading

## Branch
`feat/ui/images`

## Summary
Implements image optimization patterns including native lazy loading, async decoding, and WebP support. Improves page load performance by deferring off-screen image loading.

## Files Changed
- `client/src/components/SafeImage.tsx` - Added lazy loading and async decoding support
- `client/src/components/OptimizedImage.tsx` (new) - New component with WebP support
- `client/src/components/Layout.tsx` - Logo uses eager loading (above the fold)

## Features

### SafeImage Improvements
- **Lazy Loading**: All images load lazily by default (`loading="lazy"`)
- **Async Decoding**: Images decode asynchronously (`decoding="async"`)
- **Eager Option**: Can be set to `loading="eager"` for above-the-fold images
- **Backward Compatible**: Existing usage continues to work

### OptimizedImage Component
- **WebP Support**: Uses `<picture>` element with WebP fallback
- **Automatic Fallback**: Falls back to original format if WebP fails
- **Lazy Loading**: Native browser lazy loading
- **Error Handling**: Graceful error handling with placeholder

### Image Loading Strategy
- **Above the Fold**: Logo in Layout uses `loading="eager"` (visible immediately)
- **Below the Fold**: All other images use `loading="lazy"` (deferred loading)
- **Gallery Images**: Lazy loaded for better performance
- **Post Images**: Lazy loaded to improve initial page load

## Performance Benefits

1. **Faster Initial Load**: Images below the fold don't block page rendering
2. **Reduced Bandwidth**: Only visible images are loaded
3. **Better Core Web Vitals**: Improves Largest Contentful Paint (LCP)
4. **Battery Savings**: Mobile devices save battery by not loading off-screen images

## Usage Examples

### SafeImage (Default - Lazy)
```tsx
<SafeImage
  src={post.image_url}
  alt="Post image"
  className="w-full"
/>
```

### SafeImage (Eager - Above the Fold)
```tsx
<SafeImage
  src="/logo.png"
  alt="Logo"
  loading="eager"
  className="h-12"
/>
```

### OptimizedImage (WebP Support)
```tsx
<OptimizedImage
  src="/image.jpg"
  webpSrc="/image.webp"
  alt="Description"
  loading="lazy"
/>
```

## Testing Steps

### Visual Testing
1. Start dev server: `cd client && npm run dev`
2. Open browser DevTools → Network tab
3. Navigate to home page:
   - Verify logo loads immediately (eager)
   - Scroll down to see posts
   - Verify post images load lazily (check Network tab)
4. Navigate to Gallery:
   - Scroll through gallery
   - Verify images load as you scroll (lazy loading)
5. Check Performance:
   - Open DevTools → Performance tab
   - Record page load
   - Verify images don't block initial render

### Performance Testing
```bash
# Use Lighthouse to test performance
# In Chrome DevTools: Lighthouse tab → Run audit
# Check:
# - Largest Contentful Paint (LCP)
# - Total Blocking Time
# - Cumulative Layout Shift (CLS)
```

### Manual Testing
1. **Slow Network**: Use Chrome DevTools → Network → Throttling → Slow 3G
2. **Scroll Test**: Scroll quickly through gallery
3. **Verify**: Images should load progressively as you scroll

## Migration Notes
- **No breaking changes** - All existing SafeImage usage continues to work
- **Default behavior**: All images now lazy load by default
- **Logo exception**: Layout logo uses eager loading (visible immediately)
- **WebP optional**: OptimizedImage can be adopted gradually

## Image Optimization Recommendations

### Current Implementation
- ✅ Native lazy loading (browser-native, no JS overhead)
- ✅ Async decoding (non-blocking)
- ✅ Error handling with fallbacks

### Future Enhancements (Optional)
- Add image CDN (Cloudinary already in use)
- Implement responsive images with `srcset`
- Add blur-up placeholder technique
- Convert existing images to WebP format
- Add image compression pipeline

### WebP Conversion (Future)
If you want to add WebP support:
1. Convert images to WebP format
2. Store both formats (original + WebP)
3. Use OptimizedImage component with webpSrc prop
4. Backend can serve WebP based on Accept header

## Browser Support
- **Lazy Loading**: Supported in all modern browsers (Chrome 76+, Firefox 75+, Safari 15.4+)
- **WebP**: Supported in all modern browsers (Chrome 23+, Firefox 65+, Safari 14+)
- **Fallback**: Older browsers will load images normally (no lazy loading, but still works)

## Performance Metrics

### Before
- All images load on page load
- Slower initial page render
- Higher bandwidth usage

### After
- Only visible images load initially
- Faster initial page render
- Reduced bandwidth usage
- Better mobile performance

## Next Steps
- PR 7: Bundle analysis with vite-plugin-visualizer
- Future: Add responsive images with srcset
- Future: Implement blur-up placeholders
- Future: Add image compression pipeline
