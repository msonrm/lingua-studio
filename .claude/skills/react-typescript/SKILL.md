# React TypeScript Best Practices

## Context

This skill provides best practices for React development with TypeScript in the lingua-studio project.

## Triggers

Apply this skill when:
- Creating new React components
- Fixing TypeScript type errors
- Refactoring existing components
- Adding new features to the UI

## Component Guidelines

### File Structure
```
src/components/ComponentName/
├── index.tsx          # Main component
├── ComponentName.css  # Styles (CSS Modules optional)
└── types.ts           # Type definitions (if complex)
```

### Functional Components
Always use functional components with hooks:
```tsx
interface Props {
  title: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export function ComponentName({ title, onClick, children }: Props) {
  const [state, setState] = useState<string>('');

  return (
    <div className="component-name">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

### State Management
- Use `useState` for local component state
- Use `useContext` for shared state (like LocaleContext in this project)
- Use `useMemo` for expensive computations
- Use `useCallback` for stable function references

### Type Safety
- Always define Props interface
- Use explicit return types for complex functions
- Avoid `any` - use `unknown` if type is truly unknown
- Use discriminated unions for complex state

## Project-Specific Patterns

### Locale Support
Use the existing locale system:
```tsx
import { useContext } from 'react';
import { LocaleContext } from '../locales';

function MyComponent() {
  const { ui } = useContext(LocaleContext);
  return <h1>{ui.SOME_LABEL}</h1>;
}
```

### AST Types
Import types from schema.ts:
```tsx
import { SentenceNode, ClauseNode, VerbPhraseNode } from '../types/schema';
```

### Renderer Pattern
Follow the existing renderer pattern in `src/renderer/`:
- Export main render function
- Use helper functions for sub-components
- Keep translations in separate mapping objects

## Best Practices

1. **Single Responsibility**: One component = one purpose
2. **Props Over State**: Lift state up when needed
3. **Explicit Types**: No implicit any
4. **CSS Organization**: Keep styles close to components
5. **Error Handling**: Use try/catch in async operations
