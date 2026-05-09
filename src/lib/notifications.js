// Notification quotidienne — pragmatique pour MVP :
// - on stocke notifyAt = "HH:mm"
// - tant que l'app est ouverte/installée, un setTimeout planifie la prochaine notif
// - on n'utilise PAS Push API (nécessite backend)
// - on ne demande la permission qu'au moment où l'utilisateur active l'option

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export async function requestPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  const r = await Notification.requestPermission();
  return r;
}

export function parseHHmm(s) {
  if (typeof s !== 'string') return null;
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { h, m: min };
}

// Renvoie le timestamp de la prochaine occurrence de HH:mm à partir de `now`.
// Si l'heure d'aujourd'hui est déjà passée → demain.
export function nextOccurrenceAt(hhmm, now = new Date()) {
  const t = parseHHmm(hhmm);
  if (!t) return null;
  const next = new Date(now);
  next.setHours(t.h, t.m, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime();
}

// Affiche une notif si la permission est accordée. Ne jette jamais.
export function showNotification(title, options = {}) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return false;
  try {
    new Notification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      ...options,
    });
    return true;
  } catch {
    return false;
  }
}
