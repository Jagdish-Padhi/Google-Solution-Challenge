# UI Components Library

A comprehensive, modular, and reusable component library for SportShield built with React, Vite, and Tailwind CSS.

## Overview

This component library provides a complete set of UI components following a consistent design system based on the central theme defined in `theme.css`. All components are:

- **Modular**: Each component is independent and can be used standalone
- **Reusable**: Designed for maximum reusability across the application
- **Theme-integrated**: All colors and styles come from the central theme variables
- **Accessible**: Built with accessibility in mind (ARIA, keyboard navigation, etc.)
- **TypeScript-ready**: Can be extended with type definitions

## Theme Variables

All components use the following CSS variables from the central theme:

```css
--app-font-sans: "Plus Jakarta Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif
--app-color-bg: #f8fafc
--app-color-surface: #ffffff
--app-color-surface-elevated: #f1f5f9
--app-color-text: #0f172a
--app-color-text-muted: #475569
--app-color-border: #cbd5e1
--app-color-primary: #0f766e (Teal)
--app-color-primary-hover: #115e59
--app-color-primary-soft: #ccfbf1
--app-color-accent: #2563eb (Blue)
--app-color-canvas-glow: #e2e8f0
```

## Component Categories

### Basic UI Components

#### Button
Multi-variant button component for various use cases.
```jsx
import { Button } from '@components';

<Button variant="primary" size="md">Click me</Button>
<Button variant="secondary" size="lg" loading={true}>Loading...</Button>
<Button variant="danger" disabled>Delete</Button>
```

**Props**:
- `variant`: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success'
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `disabled`: boolean
- `loading`: boolean
- `onClick`: function

#### Input
Text input with label, error handling, and optional icon.
```jsx
import { Input } from '@components';

<Input 
  label="Email" 
  type="email" 
  placeholder="user@example.com"
  error={emailError}
/>
```

**Props**:
- `label`: string
- `type`: 'text' | 'email' | 'password' | 'number' | etc.
- `value`: string
- `onChange`: function
- `error`: string
- `disabled`: boolean
- `required`: boolean
- `icon`: React Component
- `helperText`: string

#### Card
Flexible container for grouping content.
```jsx
import { Card } from '@components';

<Card 
  title="Card Title"
  subtitle="Optional subtitle"
  elevated={true}
  footer={<Button>Action</Button>}
>
  Card content here
</Card>
```

**Props**:
- `title`: string
- `subtitle`: string
- `header`: React node
- `footer`: React node
- `elevated`: boolean
- `onClick`: function

#### Badge
Small label for status, tags, or categories.
```jsx
import { Badge } from '@components';

<Badge variant="success">Active</Badge>
<Badge variant="warning" size="lg">Warning</Badge>
<Badge variant="danger">Error</Badge>
```

**Props**:
- `variant`: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
- `size`: 'sm' | 'md' | 'lg'
- `icon`: React Component

#### Alert
Dismissible alert messages.
```jsx
import { Alert } from '@components';

<Alert 
  type="success" 
  title="Success!" 
  message="Operation completed successfully."
  dismissible={true}
  onClose={handleClose}
/>
```

**Props**:
- `type`: 'success' | 'error' | 'warning' | 'info'
- `title`: string
- `message`: string
- `dismissible`: boolean
- `onClose`: function
- `icon`: React Component

#### Spinner
Loading indicator.
```jsx
import { Spinner } from '@components';

<Spinner size="lg" variant="primary" label="Loading..." />
<Spinner fullScreen={true} />
```

**Props**:
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `variant`: 'primary' | 'secondary' | 'white'
- `label`: string
- `fullScreen`: boolean

### Form Components

#### TextArea
Multi-line text input with character count.
```jsx
import { TextArea } from '@components';

<TextArea 
  label="Description" 
  rows={4} 
  maxLength={500}
  helperText="Maximum 500 characters"
/>
```

#### Select
Dropdown select with label and error handling.
```jsx
import { Select } from '@components';

<Select 
  label="Category"
  options={[
    { value: 'sports', label: 'Sports' },
    { value: 'health', label: 'Health' }
  ]}
  value={selected}
  onChange={(e) => setSelected(e.target.value)}
/>
```

#### Checkbox
Single or multiple selection checkboxes.
```jsx
import { Checkbox } from '@components';

<Checkbox 
  label="I agree to terms" 
  checked={agreed}
  onChange={(e) => setAgreed(e.target.checked)}
/>
```

#### Toggle
Switch/toggle button for boolean states.
```jsx
import { Toggle } from '@components';

<Toggle 
  label="Enable notifications"
  checked={enabled}
  onChange={setEnabled}
/>
```

#### RadioButton
Single selection from a group.
```jsx
import { RadioButton } from '@components';

<RadioButton 
  label="Option 1" 
  value="opt1"
  checked={selected === 'opt1'}
  onChange={(e) => setSelected(e.target.value)}
/>
```

#### FormGroup
Wrapper for grouping related form fields.
```jsx
import { FormGroup, Input } from '@components';

<FormGroup title="User Information" subtitle="Enter your details">
  <Input label="Full Name" />
  <Input label="Email" type="email" />
</FormGroup>
```

### Layout Components

#### Container
Centered wrapper with max-width and padding.
```jsx
import { Container } from '@components';

<Container size="lg">
  Page content
</Container>
```

#### Header
Top navigation bar.
```jsx
import { Header } from '@components';

<Header 
  logo="SportShield"
  navItems={[
    { label: 'Home', href: '/' },
    { label: 'Dashboard', href: '/dashboard' }
  ]}
  userMenu={<Avatar initials="JD" />}
/>
```

#### Sidebar
Collapsible navigation sidebar.
```jsx
import { Sidebar } from '@components';

<Sidebar 
  items={[
    { id: 'home', label: 'Home', href: '/' },
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard' }
  ]}
  activeItem={activeItem}
  onItemClick={handleItemClick}
  collapsible={true}
/>
```

#### PageHeader
Page title with optional action and breadcrumbs.
```jsx
import { PageHeader } from '@components';

<PageHeader 
  title="Dashboard"
  subtitle="Welcome back!"
  action={<Button>Export</Button>}
  breadcrumbs={[
    { label: 'Home', href: '/' },
    { label: 'Dashboard' }
  ]}
/>
```

#### Grid
Responsive grid layout.
```jsx
import { Grid, Card } from '@components';

<Grid>
  <Card title="Item 1">Content</Card>
  <Card title="Item 2">Content</Card>
</Grid>
```

#### Tabs
Tabbed interface for organizing content.
```jsx
import { Tabs } from '@components';

<Tabs 
  tabs={[
    { label: 'Tab 1', content: <div>Content 1</div> },
    { label: 'Tab 2', content: <div>Content 2</div> }
  ]}
/>
```

### Data Display Components

#### Table
Data table with sorting and responsive design.
```jsx
import { Table } from '@components';

<Table 
  columns={[
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' }
  ]}
  data={tableData}
  onRowClick={handleRowClick}
/>
```

#### StatCard
Display statistical data.
```jsx
import { StatCard } from '@components';

<StatCard 
  label="Total Users"
  value="1,234"
  trend="+12%"
  trendUp={true}
  trendLabel="vs last month"
/>
```

#### ListItem
Reusable list item.
```jsx
import { ListItem } from '@components';

<ListItem 
  title="Item Title"
  description="Item description"
  action={<Button size="sm">Action</Button>}
/>
```

#### Avatar
User avatars with initials or image.
```jsx
import { Avatar } from '@components';

<Avatar initials="JD" size="lg" />
<Avatar src="/image.jpg" alt="User" />
```

#### EmptyState
Display when no data is available.
```jsx
import { EmptyState, Button } from '@components';

<EmptyState 
  title="No data found"
  message="There are no items to display."
  action={<Button>Create new</Button>}
/>
```

#### Pagination
Navigate through paginated data.
```jsx
import { Pagination } from '@components';

<Pagination 
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
/>
```

### Modal

#### Modal
Overlay dialog for focused interactions.
```jsx
import { Modal, Button } from '@components';

<Modal 
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm action"
  size="md"
  footer={<Button onClick={handleConfirm}>Confirm</Button>}
>
  Are you sure?
</Modal>
```

## Usage Example

```jsx
import { 
  Container, 
  PageHeader, 
  Card, 
  Button, 
  Input, 
  FormGroup, 
  Grid 
} from '@components';

function App() {
  return (
    <Container>
      <PageHeader 
        title="My Page"
        action={<Button>Create</Button>}
      />
      
      <Grid>
        <Card title="Form">
          <FormGroup title="User Details">
            <Input label="Name" placeholder="Enter name" />
            <Input label="Email" type="email" />
          </FormGroup>
        </Card>
        
        <Card title="Info">
          <p>Card content here</p>
        </Card>
      </Grid>
    </Container>
  );
}
```

## Extending Components

All components accept a `className` prop for additional customization. You can also create wrapper components:

```jsx
import { Button } from '@components';

export const PrimaryButton = (props) => (
  <Button variant="primary" size="md" {...props} />
);
```

## Best Practices

1. **Component Composition**: Combine components to build larger UI patterns
2. **Props Interface**: Each component has a clear and minimal props interface
3. **Accessibility**: Always include proper labels and ARIA attributes
4. **Responsive**: Components are mobile-first and responsive
5. **Theme Consistency**: All colors and sizes come from the central theme

## Theme Customization

To customize colors globally, edit `src/app/styles/theme.css` and update the CSS variables. All components will automatically reflect the changes.

## Component Organization

```
components/
├── index.js              # Central export file
├── Button.jsx
├── Input.jsx
├── Card.jsx
├── ... (all other components)
└── README.md
```

## Contributing

When adding new components:

1. Follow the existing file structure
2. Use theme CSS variables for all styles
3. Add prop documentation in comments
4. Export in `index.js`
5. Update this README with examples

---

**Built with React, Tailwind CSS, and ❤️ for SportShield**
