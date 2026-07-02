const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const isBrowser = () => typeof window !== 'undefined';

function getCookie(name: string) {
  if (!isBrowser()) {
    return null;
  }

  const prefix = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(prefix));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(prefix.length));
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (!isBrowser()) {
    return;
  }

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `Max-Age=${maxAgeSeconds}`,
    'Path=/',
    'SameSite=Lax',
    secure,
  ].join('; ');
}

function deleteCookie(name: string) {
  if (!isBrowser()) {
    return;
  }

  document.cookie = `${encodeURIComponent(name)}=; Max-Age=0; Path=/; SameSite=Lax`;
}

export function getStoredToken() {
  if (!isBrowser()) {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY) || getCookie(TOKEN_KEY);
}

export function getStoredUser() {
  if (!isBrowser()) {
    return null;
  }

  return localStorage.getItem(USER_KEY) || getCookie(USER_KEY);
}

export function storeAuthSession(
  token: string,
  user: unknown,
  maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS,
) {
  const serializedUser = JSON.stringify(user);

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, serializedUser);
  setCookie(TOKEN_KEY, token, maxAgeSeconds);
  setCookie(USER_KEY, serializedUser, maxAgeSeconds);
}

export function clearAuthSession() {
  if (isBrowser()) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  deleteCookie(TOKEN_KEY);
  deleteCookie(USER_KEY);
}
