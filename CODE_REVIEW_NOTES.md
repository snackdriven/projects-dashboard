# Code Review Notes - Projects Dashboard

## Permanent QA Reference

This document serves as a permanent reference for code review and QA processes for the Projects Dashboard.

---

## 🎯 Project Context

**Type**: Single-user, local-only development tool  
**Security Model**: Low security requirements (local dev only)  
**Accessibility**: Keyboard navigation only, no screen reader support  
**Platform**: Desktop only, no mobile support  

---

## ✅ Code Review Checklist

### Security (Single-User Context)
- [ ] Project names sanitized before use in paths/commands
- [ ] Path validation prevents directory traversal
- [ ] CORS restricted to localhost
- [ ] URL encoding used for API parameters
- [ ] Shell command escaping implemented

### React Best Practices (2025)
- [ ] All functions used in effects wrapped in `useCallback`
- [ ] Dependency arrays complete and correct
- [ ] No stale closures
- [ ] Proper cleanup in `useEffect` return functions
- [ ] Race conditions prevented with refs/guards
- [ ] Parallel async operations use `Promise.allSettled`

### Error Handling
- [ ] HTTP status checks (`response.ok`)
- [ ] Try/catch blocks around async operations
- [ ] Error messages logged to console
- [ ] User-facing error states (if needed)

### TypeScript
- [ ] Proper type definitions
- [ ] No implicit `any` types
- [ ] Interfaces for API responses
- [ ] Strict mode enabled

### Performance
- [ ] Constants extracted (no magic numbers)
- [ ] Memoization where appropriate
- [ ] Efficient re-renders
- [ ] Timeouts on long-running operations

---

## 🔍 Common Issues to Watch For

### React Hooks
- **Issue**: Functions in dependency arrays causing infinite loops
- **Fix**: Use `useCallback` with proper dependencies
- **Example**: `checkStatuses` should depend on `projects`, not be recreated every render

### Race Conditions
- **Issue**: Multiple rapid clicks triggering duplicate operations
- **Fix**: Use refs to track in-flight operations
- **Example**: `launchingRef.current.has(project.name)` guard

### Path Security
- **Issue**: User input used directly in file paths
- **Fix**: Always sanitize and validate paths
- **Example**: `sanitizeProjectName()` + `validateProjectPath()`

### Async Operations
- **Issue**: Unhandled promise rejections
- **Fix**: Use `Promise.allSettled` or proper error handling
- **Example**: Status checks should not fail if one project fails

---

## 📚 2025 Best Practices Reference

### React Patterns
```typescript
// ✅ Good: Memoized callback with dependencies
const handleAction = useCallback(async () => {
  // ...
}, [dependency1, dependency2])

// ❌ Bad: Function recreated every render
const handleAction = async () => {
  // ...
}
```

### Async Operations
```typescript
// ✅ Good: Parallel with error handling
const results = await Promise.allSettled(promises)

// ❌ Bad: Sequential or unhandled
for (const promise of promises) {
  await promise // blocks
}
```

### Security
```typescript
// ✅ Good: Sanitize and validate
const safeName = sanitizeProjectName(userInput)
const safePath = validateProjectPath(join(baseDir, safeName))

// ❌ Bad: Direct use
const path = join(baseDir, userInput)
```

---

## 🧪 Testing Priorities

1. **Functionality**: Does it work as expected?
2. **Edge Cases**: Empty states, errors, rapid clicks
3. **Keyboard Navigation**: Arrow keys, Enter key
4. **Race Conditions**: Multiple simultaneous launches
5. **Error States**: Network failures, missing projects

---

## 📝 Review Process

1. **Read the code** - Understand what it does
2. **Check security** - Even for single-user, follow good practices
3. **Verify React patterns** - Hooks, dependencies, cleanup
4. **Test edge cases** - Empty states, errors, rapid actions
5. **Check performance** - No unnecessary re-renders
6. **Verify types** - TypeScript should catch issues

---

## 🔄 Maintenance Notes

- **Dependencies**: Keep React, TypeScript, and Vite updated
- **Security**: Review if project scope changes (multi-user, network access)
- **Performance**: Monitor if projects list grows large (100+ projects)
- **Features**: Consider extracting to custom hooks if App.tsx grows

---

**Last Updated**: 2025  
**Reviewer**: AI Code Review  
**Status**: Active Reference Document

