# Shared Configuration

Centralized configuration files for all monorepo projects.

## Available Configurations

### TypeScript

- `typescript/base.json` - Base TypeScript configuration
- `typescript/react.json` - React-specific TypeScript configuration

**Usage:**

```json
{
  "extends": "@projects-dashboard/shared-config/typescript/react.json",
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo"
  },
  "include": ["src"]
}
```

### Tailwind CSS

- `tailwind/base.js` - Base Tailwind configuration with common animations

**Usage:**

```js
import baseConfig from '@projects-dashboard/shared-config/tailwind/base.js';

export default {
  ...baseConfig,
  theme: {
    ...baseConfig.theme,
    extend: {
      ...baseConfig.theme.extend,
      // Your custom theme extensions
    },
  },
};
```

## Benefits

1. **Consistency** - All projects use the same base configuration
2. **Maintainability** - Update once, applies everywhere
3. **Type Safety** - Shared TypeScript settings across projects
4. **DRY** - Don't repeat yourself
