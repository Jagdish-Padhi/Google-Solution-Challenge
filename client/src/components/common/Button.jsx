// Reusable button component for consistent actions across the app.
export default function Button({ children = 'Button', type = 'button' }) {
  return <button type={type}>{children}</button>;
}
