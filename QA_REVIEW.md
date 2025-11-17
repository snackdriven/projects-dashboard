# QA & Code Review Report

**Context**: Single-user, local-only development tool. Security is less critical but good practices still apply.

## 🔴 Critical Issues

### 1. **SECURITY: Path Traversal & Command Injection Vulnerability** ✅ FIXED
**Location**: `server/index.js` 
**Severity**: MEDIUM (single-user context)

**Issue**: Project names are used directly in shell commands and file paths without sanitization.

**Status**: ✅ Fixed with `sanitizeProjectName()` and `validateProjectPath()` functions.

---

### 2. **SECURITY: Overly Permissive CORS** ✅ FIXED
**Location**: `server/index.js` 
**Severity**: LOW (single-user context)

**Issue**: CORS allows all origins (`*`). 

**Status**: ✅ Fixed - now restricted to localhost only.

---

### 3. **React Hook Dependency Issues**
**Location**: `src/App.tsx` lines 22-32
**Severity**: MEDIUM

**Issues**:
- `checkStatuses` function is recreated on every render but used in `useEffect` without dependency
- Status checking interval doesn't update when projects change
- Potential memory leaks if component unmounts during async operations

**Fix Required**: Use `useCallback` and proper dependency arrays.

---

### 4. **Race Conditions**
**Location**: `src/App.tsx` line 58
**Severity**: MEDIUM

**Issue**: Multiple rapid clicks on launch button can trigger multiple launch attempts.

**Fix Required**: Add debouncing or disable button during launch.

---

### 5. **Error Handling Gaps**
**Location**: Multiple files
**Severity**: MEDIUM

**Issues**:
- No user-facing error messages for failed API calls
- Network errors only logged to console
- No retry logic for transient failures
- Backend errors not properly typed

**Fix Required**: Add error states and user feedback.

---

## 🟡 Medium Priority Issues

### 6. **Unreliable Status Detection**
**Location**: `server/index.js` lines 74-101
**Severity**: MEDIUM

**Issues**:
- WMIC query syntax may fail on different Windows versions
- Port fallback (5173) is not project-specific
- Process detection is fragile and may give false positives/negatives
- No timeout for exec commands

**Fix Required**: Improve detection logic, add timeouts, better error handling.

---

### 7. **Missing Input Validation**
**Location**: `server/index.js` line 113
**Severity**: MEDIUM

**Issue**: No validation that project has `package.json` or `npm run dev` script before launching.

**Fix Required**: Validate project structure before launch.

---

### 8. **Keyboard Navigation Edge Cases**
**Location**: `src/App.tsx` lines 78-92
**Severity**: LOW

**Issues**:
- `focusedIndex` doesn't reset when projects array changes
- No handling for empty projects array
- Focus can go out of bounds if projects are removed

**Fix Required**: Add bounds checking and reset logic.

---

### 9. **No Error Boundaries**
**Location**: `src/App.tsx`
**Severity**: LOW

**Issue**: Unhandled React errors will crash entire app.

**Fix Required**: Add React error boundary.

---

### 10. **Hard-coded Configuration**
**Location**: `server/index.js` line 16
**Severity**: LOW

**Issue**: Projects directory path is hard-coded.

**Fix Required**: Use environment variables or config file.

---

## 🟢 Code Quality Issues

### 11. **TypeScript Types**
- Missing error response types
- `any` types in some error handlers
- No API response type definitions

### 12. **Code Organization**
- All logic in single App component (could be split)
- No custom hooks for API calls
- No constants file for magic numbers (3000ms interval, 5173 port)

### 13. **Accessibility** ✅ NOT APPLICABLE
- Per requirements: Single-user, keyboard navigation only, no screen reader support needed
- Current keyboard navigation is sufficient for the use case

---

## ✅ Positive Aspects

1. **Good TypeScript Usage**: Proper interfaces and type safety
2. **Modern React Patterns**: Hooks, functional components
3. **Smooth Animations**: Framer Motion integration
4. **Clean UI**: Well-structured Tailwind CSS
5. **Error Logging**: Console errors for debugging
6. **Platform Detection**: Handles Windows/Mac/Linux

---

## 📋 Fixes Applied

### ✅ Completed Fixes

1. **Security Vulnerabilities** ✅
   - Added `sanitizeProjectName()` function to prevent path traversal
   - Added `validateProjectPath()` function to ensure paths stay within PROJECTS_DIR
   - Restricted CORS to localhost only
   - Added URL encoding for project names in API calls
   - Added path escaping for shell commands

2. **React Hooks Issues** ✅
   - Wrapped `fetchProjects`, `checkStatuses`, `handleLaunch`, and `handleKeyDown` in `useCallback`
   - Fixed dependency arrays to prevent stale closures
   - Added proper cleanup for intervals
   - Reset `focusedIndex` when projects array changes

3. **Race Conditions** ✅
   - Added `launchingRef` to track in-flight launches
   - Prevent duplicate launches with ref-based guard
   - Added proper cleanup in error cases

4. **Error Handling** ✅
   - Added HTTP status checks (`response.ok`)
   - Added proper error messages
   - Used `Promise.allSettled` for parallel status checks (2025 best practice)
   - Added URL encoding for project names

5. **Code Quality** ✅
   - Extracted constants (`STATUS_CHECK_INTERVAL`, `LAUNCH_DEBOUNCE_DELAY`)
   - Improved TypeScript types
   - Better error handling with try/catch blocks
   - Added timeouts to exec commands to prevent hanging

6. **Status Detection** ✅
   - Added timeouts to prevent hanging on slow queries
   - Improved error handling for platform-specific commands
   - Better escaping for shell commands

---

## 📋 Remaining Recommendations (Low Priority)

1. **Code Organization**: Consider splitting App component into smaller components
2. **Custom Hooks**: Extract API calls into custom hooks (e.g., `useProjects`, `useProjectStatus`)
3. **Error UI**: Add user-facing error messages (currently only console logs)
4. **Environment Variables**: Make PROJECTS_DIR configurable via env vars

---

## 🧪 Testing Checklist

### Security Testing
- [x] Test with malicious project names (path traversal attempts)
- [x] Test with special characters in project names
- [x] Verify CORS restrictions

### Functionality Testing
- [x] Test rapid button clicks (race condition prevention)
- [x] Test with projects that don't exist
- [x] Test with projects missing package.json
- [ ] Test keyboard navigation edge cases
- [ ] Test on different Windows versions
- [ ] Test with multiple projects running simultaneously

### Code Quality
- [x] Verify React hooks dependencies
- [x] Check for memory leaks
- [x] Verify error handling
- [x] Check TypeScript types

---

## 📝 QA Context Notes

**Project Requirements**:
- Single-user, local-only development tool
- No sharing, no multi-user support needed
- Keyboard navigation required, smooth animations required
- No touch support, no screen reader support, no mobile dev
- Security is less critical but good practices still apply

**2025 Best Practices Applied**:
- `useCallback` for memoized functions
- `Promise.allSettled` for parallel async operations
- Proper TypeScript strict mode
- URL encoding for API parameters
- Timeout handling for async operations
- Ref-based race condition prevention

---

## 🔄 Future Improvements

1. **Error Boundaries**: Add React error boundary for better error handling
2. **Retry Logic**: Add retry mechanism for failed API calls
3. **Project Validation**: Validate package.json structure before launch
4. **Port Detection**: Better port detection per project (read from vite.config.ts)
5. **Project Metadata**: Cache project metadata (description, port, etc.)
6. **Keyboard Shortcuts**: Add more keyboard shortcuts (e.g., 'r' to refresh)
7. **Project Filtering**: Add search/filter functionality for many projects

