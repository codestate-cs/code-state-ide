# CodeState UI Design System

A modern, minimal VS Code webview UI design system inspired by codestate.dev with glassmorphism effects and three theme modes.

## Features

- **Three Theme Modes**: Match IDE (inherits VS Code theme), Light (soft grays), Dark (codestate.dev inspired)
- **Glassmorphism Effects**: Restrained transparency and blur for depth and layering
- **Smooth Animations**: Subtle micro-animations with purposeful transitions
- **Accessibility**: Full keyboard navigation and screen reader support
- **Responsive Design**: Adapts to different screen sizes
- **Modular Components**: Easy to scale and customize

## Components

### Accordion
Minimal headers with soft hover/focus glow, smooth expand/collapse with easing.

```tsx
import { Accordion } from './components';

<Accordion 
  items={[
    { id: 'item1', title: 'Title', content: 'Content', defaultOpen: true }
  ]} 
/>
```

### Card
Rounded corners, subtle glassmorphism with blurred background, soft shadows.

```tsx
import { Card, CardHeader, CardContent, CardFooter } from './components';

<Card variant="elevated" padding="md">
  <CardHeader>
    <h2>Title</h2>
  </CardHeader>
  <CardContent>
    <p>Content</p>
  </CardContent>
  <CardFooter>
    <button className="btn-primary">Action</button>
  </CardFooter>
</Card>
```

### Tabs
Simple pill-style or underline-style tabs with smooth transitions.

```tsx
import { Tabs } from './components';

<Tabs 
  items={[
    { id: 'tab1', label: 'Tab 1', content: 'Content 1' }
  ]}
  variant="underline"
/>
```

### ThemeSwitcher
Switch between the three theme modes with visual previews.

```tsx
import { ThemeSwitcher } from './components';

<ThemeSwitcher 
  currentTheme="dark"
  onThemeChange={(theme) => setTheme(theme)}
/>
```

## Design Principles

- **Muted Dark Neutrals**: Base colors inspired by codestate.dev
- **Subtle Gradients**: Light depth effects without heaviness
- **Single Accent Color**: Consistent interactivity (links, buttons, focus states)
- **Generous Spacing**: Breathable, balanced layout
- **Soft Rounded Corners**: Consistent across all components
- **Clean Typography**: Professional readability, native to VS Code
- **Calm Precision**: Understated elegance without distraction

## Color Palette

Based on codestate.dev colors:

```css
--background: hsl(240, 10%, 3.9%);
--foreground: hsl(0, 0%, 98%);
--muted: hsl(240, 3.7%, 15.9%);
--muted-foreground: hsl(240, 5%, 64.9%);
--primary: hsl(207, 90%, 54%);
--border: hsl(240, 3.7%, 15.9%);
--radius: 0.5rem;
```

## Usage

1. Import the design system CSS:
```tsx
import './styles/design-system.css';
```

2. Use components with consistent styling:
```tsx
import { Card, Accordion, Tabs } from './components';
```

3. Apply theme switching:
```tsx
document.documentElement.setAttribute('data-theme', 'light');
```

## Browser Support

- Modern browsers with CSS custom properties support
- Webkit browsers for backdrop-filter (glassmorphism)
- Responsive design for mobile and desktop