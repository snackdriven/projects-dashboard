# @projects-dashboard/ui

Shared React UI components for all monorepo projects.

## Components

### Button

A reusable button component with variants, sizes, and loading states.

```tsx
import { Button } from '@projects-dashboard/ui';

<Button variant="primary" size="md" onClick={handleClick}>
  Click me
</Button>

<Button variant="danger" isLoading>
  Loading...
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'ghost' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `isLoading`: boolean

### Card

A container component with optional hover effects and gradient backgrounds.

```tsx
import { Card } from '@projects-dashboard/ui';

<Card hover gradient>
  <h2>Card Title</h2>
  <p>Card content</p>
</Card>
```

**Props:**
- `hover`: boolean - Enable hover animation
- `gradient`: boolean - Use gradient background

## Installation

Add to your project's `package.json`:

```json
{
  "dependencies": {
    "@projects-dashboard/ui": "workspace:*"
  }
}
```

Then run:
```bash
pnpm install
```

## Development

```bash
# Type-check components
pnpm type-check

# Build components
pnpm build
```
