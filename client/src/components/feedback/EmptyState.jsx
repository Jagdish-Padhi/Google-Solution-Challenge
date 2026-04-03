// Shared empty-state component for no-data screens.
export default function EmptyState({ title = 'Nothing here yet.' }) {
  return <div>{title}</div>;
}
