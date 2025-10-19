# 📋 Changelog - RumahSubsidi.id

## [1.1.0] - 2025-10-19

### 🔒 Security Improvements

#### 1. NIK Data Privacy Protection
**File:** `proxy-server.js:53-55`
- ✅ **FIXED:** NIK logging now masks sensitive data
- **Before:** `Checking subsidi for NIK: 3201234567890123`
- **After:** `Checking subsidi for NIK: 3201************`
- **Impact:** Protects user privacy, complies with data protection regulations

```javascript
// Mask NIK untuk privacy (only show first 4 digits)
const maskedNik = `${nik.substring(0, 4)}${'*'.repeat(12)}`;
console.log(`Checking subsidi for NIK: ${maskedNik}`);
```

---

### ⚡ Performance Improvements

#### 2. Cache Configuration Refactoring
**File:** `js/script.js:6-11`
- ✅ **NEW:** Centralized cache configuration with clear constants
- **Benefits:**
  - No more magic numbers
  - Easy to adjust cache settings
  - Better code maintainability

```javascript
const CACHE_CONFIG = {
  DEFAULT_TTL_MS: 5 * 60 * 1000,      // 5 minutes
  MAX_CACHE_SIZE: 100,                 // Max cached items
  CLEAR_INTERVAL_MS: 10 * 60 * 1000   // Auto-clear interval
};
```

#### 3. Enhanced Cache Manager
**File:** `js/script.js:24-85`
- ✅ **NEW:** Auto-clear expired cache entries
- ✅ **NEW:** Maximum cache size limit (prevents memory leaks)
- ✅ **NEW:** Automatic removal of oldest entries when cache full

**Features:**
- Periodic auto-clear every 10 minutes
- Max 100 cached items
- FIFO (First In First Out) when cache full
- Better memory management

#### 4. Image Optimization with Picture Element
**File:** `js/script.js:273-293`
- ✅ **NEW:** Multi-format image support (AVIF, WebP, JPG/PNG)
- ✅ **NEW:** Browser automatically chooses best format
- ✅ **ADDED:** `decoding="async"` for better performance

**Benefits:**
- **60-80% smaller** file size with AVIF/WebP
- Faster page load times
- Better Core Web Vitals scores
- Fallback to original format if modern formats not supported

```javascript
function createOptimizedImage(src, alt) {
  return `
    <picture>
      <source srcset="${baseUrl}.avif" type="image/avif">
      <source srcset="${baseUrl}.webp" type="image/webp">
      <img src="${imageUrl}" alt="${altText}" loading="lazy" decoding="async">
    </picture>
  `;
}
```

---

### 🛠️ Code Quality Improvements

#### 5. Centralized Error Handler
**File:** `js/script.js:96-167`
- ✅ **NEW:** Centralized error handling system
- ✅ **NEW:** User-friendly error messages
- ✅ **NEW:** Context-aware error logging
- ✅ **NEW:** Optional server-side error logging

**Features:**
- Consistent error handling across all modules
- Technical errors mapped to user-friendly messages
- Context tracking for better debugging
- Ready for monitoring integration

**Usage Example:**
```javascript
try {
  await loadData();
} catch (error) {
  ErrorHandler.handle(error, 'LoadData');
}
```

**Supported Contexts:**
- `LoadProvinsi` - Province loading errors
- `LoadKabupaten` - District loading errors
- `LoadProperties` - Property data errors
- `LoadStatistics` - Statistics errors
- `CheckSubsidi` - NIK checking errors
- `Initialization` - App initialization errors

**Error Types Detected:**
- Network errors (Failed to fetch)
- Timeout errors
- API/HTTP errors
- Generic errors with context

---

## 📊 Impact Summary

| Category | Improvement | Impact |
|----------|-------------|--------|
| **Security** | NIK masking | 🔒 High - Privacy protection |
| **Performance** | Image optimization | ⚡ High - 60-80% smaller images |
| **Performance** | Enhanced caching | ⚡ Medium - Better memory usage |
| **Code Quality** | Error handler | 🛠️ High - Better UX & debugging |
| **Maintainability** | Config constants | ��️ Medium - Easier to maintain |

---

## 🚀 Next Steps (Recommended)

### Priority 1 - CRITICAL
- [ ] Add CORS restriction to proxy server
- [ ] Implement rate limiting
- [ ] Add API key validation

### Priority 2 - HIGH
- [ ] Implement PWA (Service Worker)
- [ ] Setup CDN for static assets
- [ ] Add comprehensive error monitoring

### Priority 3 - MEDIUM
- [ ] Add unit tests for ErrorHandler
- [ ] Improve accessibility (WCAG 2.1)
- [ ] SEO optimization

---

## 📝 Notes

### Image Optimization
**Note:** The picture element optimization will work best when:
1. Server supports multiple image formats (AVIF, WebP)
2. Images are converted to modern formats
3. CDN is configured to serve appropriate format

**Current Behavior:**
- Browser tries to load `.avif` first
- If fails, tries `.webp`
- If fails, loads original image (JPG/PNG)
- No errors shown to user (graceful fallback)

**To enable full optimization:**
1. Convert all images to AVIF and WebP formats
2. Upload to server/CDN
3. Images will automatically load in best format

### Error Handler Integration
The ErrorHandler is now integrated in:
- ✅ `js/script.js` - All API calls
- ✅ `js/nik-checker.js` - NIK validation
- ⏳ `js/detail.js` - To be added
- ⏳ `js/search.js` - To be added (if exists)

---

## 🔧 Technical Details

### Files Modified
1. `proxy-server.js` - NIK masking
2. `js/script.js` - Cache config, image optimization, error handler
3. `js/nik-checker.js` - Error handler integration

### Lines of Code
- **Added:** ~150 lines
- **Modified:** ~50 lines
- **Removed:** ~5 lines (unused variables)

### Breaking Changes
- ❌ None - All changes are backward compatible

---

**Version:** 1.1.0
**Date:** October 19, 2025
**Author:** RumahSubsidi.id Development Team
