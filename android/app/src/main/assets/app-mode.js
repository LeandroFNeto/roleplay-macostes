// Teste explícito somente no computador local. O site publicado mantém o login normal.
const AppMode = Object.freeze({
    localDemo: typeof window !== 'undefined'
        && ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
        && new URLSearchParams(window.location.search).get('demo') === '1'
});
