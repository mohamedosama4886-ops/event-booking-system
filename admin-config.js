/**
 * Admin panel settings (edit as needed).
 * Login email/password are defined on the server in application.properties (app.admin.email, app.admin.password)
 * for the first admin account, or use any account you created via POST /api/admin with a strong password.
 */
window.ADMIN_CONFIG = {
    API_BASE_URL: 'http://localhost:5000',
    /**
     * Base URL where the frontend pages are hosted (used to build QR links).
     * Example: 'http://localhost:5500' or 'https://your-domain.com'
     *
     * If left empty, the admin page will auto-detect when running on http(s).
     */
    SITE_BASE_URL: ''
};
