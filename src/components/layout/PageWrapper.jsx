export default function PageWrapper({ children }) {
  return (
    <div className="app-shell">
      <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden pb-24">{children}</div>
    </div>
  );
}
