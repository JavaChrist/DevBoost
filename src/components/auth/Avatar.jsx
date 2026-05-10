// Avatar circulaire : affiche l'image si disponible, sinon les initiales
// (1re lettre du prénom, sinon 1re lettre de l'email, sinon "?").
//
// Usage : <Avatar user={user} size={40} />
//
// La taille est en pixels et contrôle aussi la taille de la typo.

const SIZE_TO_TEXT = {
  24: 'text-[10px]',
  32: 'text-xs',
  40: 'text-sm',
  56: 'text-lg',
  72: 'text-xl',
  96: 'text-2xl',
};

export default function Avatar({ user, size = 40, className = '' }) {
  const url = user?.avatarUrl || null;
  const initial = (user?.firstName || user?.email || '?').slice(0, 1).toUpperCase();
  const dim = `${size}px`;
  const textSize = SIZE_TO_TEXT[size] ?? 'text-base';

  if (url) {
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className={[
          'shrink-0 rounded-full object-cover ring-1 ring-emerald-400/30',
          className,
        ].join(' ')}
        style={{ width: dim, height: dim }}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={[
        'grid shrink-0 place-items-center rounded-full bg-emerald-500/15 font-bold text-emerald-300 ring-1 ring-emerald-400/30',
        textSize,
        className,
      ].join(' ')}
      style={{ width: dim, height: dim }}
    >
      {initial}
    </div>
  );
}
