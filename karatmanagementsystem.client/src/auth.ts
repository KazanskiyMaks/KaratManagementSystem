const AUTH_TOKEN_KEY = 'kms.auth.token';
const AUTH_LOGIN_KEY = 'kms.auth.login';

export interface AuthSession {
    token: string;
    login: string;
}

export function getAuthSession(): AuthSession | null {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const login = localStorage.getItem(AUTH_LOGIN_KEY);

    if (!token || !login) {
        return null;
    }

    return { token, login };
}

export function saveAuthSession(session: AuthSession) {
    localStorage.setItem(AUTH_TOKEN_KEY, session.token);
    localStorage.setItem(AUTH_LOGIN_KEY, session.login);
}

export function clearAuthSession() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_LOGIN_KEY);
}

let isFetchInitialized = false;

export function initializeAuthFetch() {
    if (isFetchInitialized) {
        return;
    }

    const originalFetch = window.fetch.bind(window);

    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) {
            return originalFetch(input, init);
        }

        const url = typeof input === 'string'
            ? input
            : input instanceof URL
                ? input.toString()
                : input.url;

        const isApiRequest = url.startsWith('api/') || url.includes('/api/');
        if (!isApiRequest) {
            return originalFetch(input, init);
        }

        const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
        headers.set('Authorization', `Bearer ${token}`);

        return originalFetch(input, { ...init, headers });
    };

    isFetchInitialized = true;
}
