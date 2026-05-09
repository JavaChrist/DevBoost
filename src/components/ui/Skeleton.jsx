export default function Skeleton({ className = '', as: Tag = 'div' }) {
  return (
    <Tag
      aria-hidden
      className={['animate-pulse rounded-md bg-slate-800/70', className].join(' ')}
    />
  );
}
