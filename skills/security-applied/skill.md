# Security Fixes Applied - workout-app-web

## Scope

- `server/index.js` — Express, auth, validation, rate limit, helmet, CSRF
- Frontend: ensure `X-Requested-With` header on state-changing requests

## Countermeasures Addressed (SD Elements Project 31739)

### Authentication & Access (T338, T70, T20, T76, T29, T1539)

| Task | Title | Status |
|------|--------|--------|
| T338 | Control access through user authentication | ✅ requireAuth on all /api except auth routes |
| T70 | Account lockout / authentication throttling | ✅ loginLimiter (10/15min) on login, register, recover |
| T20 | Unique session IDs | ✅ JWT per login; stateless |
| T76 | Do not hardcode passwords | ✅ JWT_SECRET from env; exit if missing in prod |
| T29 | Anti-CSRF tokens | ✅ X-Requested-With + Content-Type application/json on POST/PUT/PATCH/DELETE; SameSite=strict cookie |
| T1539 | Clear browser data on logout | ✅ Clear-Site-Data: cookies, storage |

### Authorization (T17, T378)

| Task | Title | Status |
|------|--------|--------|
| T17 | Do not only rely on client-side authorization | ✅ All sensitive ops gated by requireAuth, requireAdmin, requireSessionOwner |
| T378 | Authorize every request for data objects | ✅ Sessions, entries, sets, templates scoped to req.user.id |

### Input & HTTP (T35, T2139, T42)

| Task | Title | Status |
|------|--------|--------|
| T35 | Fine-tune HTTP server settings | ✅ express.json({ limit: "1mb" }); rate limits on /api and login |
| T2139 | Prevent information exposure through APIs | ✅ Cache-Control: no-store on /api; no sensitive data in responses |
| T42 | Avoid untrusted data for server-side selection | ✅ requireEnum, requirePositiveInt, validateEmail; no user input in SQL/redirects |

### Crypto & Secrets (T76, T151, T60, T59)

| Task | Title | Status |
|------|--------|--------|
| T76 | Do not hardcode passwords | ✅ JWT_SECRET, ADMIN_EMAIL, ADMIN_RECOVERY_TOKEN from env |
| T151 | Cryptographically secure random numbers | ✅ crypto.randomBytes for invite codes |
| T60 | Correct cryptographic algorithms | ✅ bcrypt for passwords, JWT with HS256 |
| T59 | Standard libraries for cryptography | ✅ crypto, bcryptjs, jsonwebtoken |

### Process / Infra (DOCUMENTED)

| Task | Title | Status |
|------|--------|--------|
| T2348 | Perform code reviews | Documented — follow org process |
| T327 | Review security of Node.js modules | Documented — npm audit, review before install |
| T21 / T5510 | TLS / SSL | Documented — enforce HTTPS in production (reverse proxy) |
| T4746 / T4751 | Container images | Documented — use minimal base, scan in CI |

## Privacy compliance (GDPR, PIPEDA, CCPA)

| Task | Title | Status |
|------|--------|--------|
| T178 | Obtain consent from users prior to collecting personal information | Implemented: consent checkbox at registration, privacy notice at /privacy, consent_accepted_at and privacy_notice_version stored |
| T194 | Obtain user consent for tracking cookies | Implemented: only strictly necessary auth cookie; no tracking cookies. Note in SD Elements for future non-essential cookies |
| Data subject rights | Access, erasure, portability | Implemented: GET /api/privacy/export, POST /api/auth/delete-account, Settings page with Export my data and Delete account |

## Remaining Recommendations

1. **Frontend:** Ensure all API calls (fetch/axios) send `X-Requested-With: XMLHttpRequest` (or similar) for CSRF.
2. **Production:** Run behind HTTPS; set NODE_ENV=production, JWT_SECRET, ADMIN_EMAIL.
3. **Optional:** Add request timeout (e.g. 30s) to mitigate slowloris (T35).
