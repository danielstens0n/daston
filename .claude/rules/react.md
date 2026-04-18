---
patterns:
  - 'src/web/**/*'
---

# React Best Practices

## useEffect Usage

**Only use `useEffect` to synchronize with external systems (APIs, subscriptions, DOM).**

Do not use it for derived data, computations, event logic, or state management.

Good:

```javascript
// Derived data in render
const fullName = first + ' ' + last;

// Event logic in handlers
const handleClick = () => setState(newValue);

// External sync in Effect
useEffect(() => {
  const unsubscribe = api.subscribe(onData);
  return () => unsubscribe();
}, []);
```

Bad:

```javascript
// Derived data in Effect
useEffect(() => {
  setFullName(first + ' ' + last);
}, [first, last]);

// Event logic in Effect
useEffect(() => {
  setState(newValue);
}, [trigger]);
```

## Encapsulate API calls in hooks

All data fetching and mutations must live in reusable hooks built on TanStack Query. Hooks should expose their query key to allow consistent cache invalidation across the app.

## Avoiding prop-drilling with Tanstack Query

**Call query hooks directly in the components that need the data, rather than fetching in a parent and passing down as props.**

TanStack Query deduplicates requests and caches results — multiple components calling the same hook won't trigger multiple network requests. This eliminates prop-drilling while keeping components self-contained. Parent components can therefore just pass down id's and components that care about the object can use the appropriate hook to fetch the cached data.

Good:

```typescript
function CustomerPage() {
  return <><CustomerHeader /><CustomerInvoices /></>
}

function CustomerHeader() {
  const { data: customer } = useCustomer(customerId);
  return <h1>{customer.name}</h1>;
}

function CustomerInvoices() {
  const { data: customer } = useCustomer(customerId);
  return <InvoiceList invoices={customer.invoices} />;
}
```

Bad:

```typescript
function CustomerPage() {
  const { data: customer } = useCustomer(customerId);
  return <><CustomerHeader customer={customer} /><CustomerInvoices customer={customer} /></>
}

function CustomerHeader({ customer }: { customer: Customer }) {
  return <h1>{customer.name}</h1>;
}

function CustomerInvoices({ customer }: { customer: Customer }) {
  return <InvoiceList invoices={customer.invoices} />;
}
```

## Component ordering in TSX files

In files with multiple components, order them top-down by hierarchy: the top-level (page/container) component first, followed by its sub-components. This matches natural reading order — readers see the big picture before drilling into details.

Good:

```typescript
export function CustomerPage() { return <CustomerTable /> }
export function CustomerTable() { return customers.map(c => <CustomerRow />) }
export function CustomerRow() { ... }
```

Bad:

```typescript
export function CustomerRow() { ... }
export function CustomerTable() { ... }
export function CustomerPage() { ... }
```

## Use semantic CSS variables for colors

Never use hardcoded Tailwind palette classes like `text-red-600` or `bg-yellow-100`. Use semantic tokens from `globals.css` so colors adapt to dark mode.

```tsx
// Good
<span className="text-destructive">Delete</span>
<span className="text-success-text">Saved</span>
<span className="text-warning-text">Expiring soon</span>
<span className="text-muted-foreground">Optional</span>

// Bad
<span className="text-red-600">Delete</span>
<span className="text-green-600">Saved</span>
<span className="text-orange-600">Expiring soon</span>
<span className="text-gray-400">Optional</span>
```
