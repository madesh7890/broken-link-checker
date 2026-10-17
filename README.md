# Broken Link Checker — URL & APK Security Suite

A secure, complete, and responsive web application engineered to check HTTP/HTTPS links, classify availability, analyze suspicious links, and perform isolated static security inspection of Android APK packages.

---

## 1. System Overview & Key Capabilities

- **HTTP & HTTPS Link Checker**: Inspect single or multi-URL batches with hop-by-hop redirect tracking, TLS certificate checks, response latencies, and availability classification (`WORKING`, `REDIRECTED`, `BROKEN`, `ACCESS_RESTRICTED`, `SERVER_ERROR`, `CONNECTION_FAILED`, `UNKNOWN`).
- **Server-Side Request Forgery (SSRF) Guard**: Proactively resolves hostnames before making outbound requests, strictly blocking loopback addresses (`127.0.0.0/8`, `::1`), private RFC1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local IPs, cloud metadata endpoints (`169.254.169.254`), and validates every redirect hop against SSRF.
- **Suspicious Link Scanner**: Safely probes suspicious URLs without rendering them in the user's browser, providing heuristic threat checks (IP hostnames, authentication keyword lures, deep subdomains, non-standard ports) alongside external reputation intelligence.
- **APK Malware Static Analysis**: Statically audits uploaded Android APK archives without execution. Calculates SHA-256 hashes, extracts package metadata (`AndroidManifest.xml`), categorizes dangerous/risky permissions (SMS, Camera, Location, Contacts, Accessibility, Overlay), and extracts discoverable embedded URLs from DEX bytecode and XML assets.
- **APK Embedded URL Report**: Extracts, deduplicates, and reports all discoverable web links found within APK packages with source file traceability and safe live validation.
- **Offline Fallback & Error Redundancy**: If an external reputation API (Google Safe Browsing or VirusTotal) is unconfigured, rate-limited, or unavailable, the system transparently falls back to local HTTP, DNS, and static analysis. It **never fabricates results** or claims complete safety without verification.
- **User Authentication & Private History**: Registration, login with username or email, session tokens (JWT), bcrypt password hashing, profile management, and private MongoDB scan history isolated to each user.

---

## 2. Technology Stack

- **Frontend**: React.js, Vite, React Router v6, Axios, Lucide React Icons, Custom Glassmorphism Theme.
- **Backend**: Python Flask 3.1+, PyMongo, Requests, pyaxmlparser, bcrypt, PyJWT, dnspython.
- **Database**: MongoDB 8.0+ with indexed collections (`users`, `url_scans`, `apk_scans`, `embedded_urls`, `reputation_cache`).
- **Testing**: Pytest automated test suite.

---

## 3. Project Structure

```text
broken project/
├── backend/
│   ├── app.py                     # Flask application factory, error handlers, and blueprints
│   ├── config.py                  # Environment config, timeouts, rate limits, upload restrictions
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example               # Template environment variables
│   ├── middleware/
│   │   └── auth_guard.py          # JWT verification, bcrypt hashing, rate limiting decorator
│   ├── services/
│   │   ├── db.py                  # MongoDB client & collection index initializer
│   │   ├── ssrf_guard.py          # IP/DNS SSRF filter blocking private/loopback/metadata destinations
│   │   ├── url_checker.py         # HTTP/HTTPS inspector with redirect hop tracing & TLS checks
│   │   ├── reputation_service.py  # Google Safe Browsing & VirusTotal with caching & offline fallback
│   │   └── apk_analyzer.py        # Static manifest parser, permission risk audit & URL extractor
│   ├── routes/
│   │   ├── auth.py                # Register, login, password reset
│   │   ├── profile.py             # User profile, preferences, password updates
│   │   ├── link_checker.py        # Single and batch URL scanning
│   │   ├── suspicious.py          # Suspicious URL scanner & heuristics
│   │   ├── apk_scanner.py         # APK upload, inspection, and embedded URL endpoints
│   │   ├── dashboard.py           # Real-time metrics computed from MongoDB
│   │   ├── history.py             # User private scan logs, pagination, report lookup, delete
│   │   └── integration.py         # Provider health checks and integration status
│   └── tests/
│       └── test_app.py            # Automated Pytest suite
└── frontend/
    ├── package.json
    ├── vite.config.js             # Dev server proxying /api to http://localhost:5000
    ├── src/
    │   ├── App.jsx                # Router with 14 page routes & ProtectedRoute guard
    │   ├── index.css              # Cyber-security dark aesthetic & design system
    │   ├── context/
    │   │   └── AuthContext.jsx    # React authentication context
    │   ├── services/
    │   │   └── api.js             # Axios client with JWT interceptor
    │   ├── components/
    │   │   ├── Navbar.jsx         # Header with offline fallback pill & user profile
    │   │   ├── Sidebar.jsx        # Navigation sidebar
    │   │   ├── StatusBadge.jsx    # Unified color-coded status badges
    │   │   └── Layout.jsx         # App shell layout
    │   └── pages/
    │       ├── Register.jsx       # 1. Create Account
    │       ├── Login.jsx          # 2. Login
    │       ├── ForgotPassword.jsx # 3. Password Reset Request
    │       ├── ResetPassword.jsx  # 4. Password Reset Confirm
    │       ├── Dashboard.jsx      # 5. Security Dashboard (11 metric cards)
    │       ├── LinkChecker.jsx    # 6. HTTP/HTTPS Single & Batch Checker
    │       ├── SuspiciousScanner.jsx # 7. Suspicious Link Scanner
    │       ├── ApkScanner.jsx     # 8. APK Malware & Static Analysis
    │       ├── ApkEmbeddedUrls.jsx# 9. APK Embedded URL Report
    │       ├── ScanHistory.jsx    # 10. Private Scan History & Filtering
    │       ├── ScanDetails.jsx    # 11. Individual Scan Audit Details
    │       ├── UserProfile.jsx    # 12. Profile & Password Management
    │       ├── Settings.jsx       # 13. Integrations, Consent & Preferences
    │       ├── AccessDenied.jsx   # 14. 403 Forbidden
    │       └── NotFound.jsx       # 15. 404 Endpoint Not Found
```

---

## 4. Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- MongoDB running locally or MongoDB Atlas connection URI

### Backend Setup
1. Open a terminal in `backend/`:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. Configure `.env` (optional, defaults connect to `mongodb://localhost:27017` with safe offline fallback):
   ```bash
   cp .env.example .env
   ```
3. Run the automated tests:
   ```bash
   python -m pytest tests/test_app.py -v
   ```
4. Start the backend server:
   ```bash
   python app.py
   ```
   *The Flask API will run on `http://localhost:5000`.*

### Frontend Setup
1. Open a second terminal in `frontend/`:
   ```bash
   cd frontend
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:3000` with requests to `/api` proxied to Flask.*

---

## 5. Security Principles & Disclaimers

1. **SSRF Guarding**: The backend checks each IP address before issuing sockets and refuses connections to non-public endpoints (e.g. `127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, AWS metadata `169.254.169.254`).
2. **Offline Fallback Guarantee**: If external threat keys are omitted or providers fail, results are honestly marked as `UNKNOWN` or `UNAVAILABLE`. No artificial results are generated.
3. **Static APK Non-Execution**: APKs are parsed in isolated temporary disk storage using static zip and AXML parsing, calculating cryptographic hashes and inspecting manifest permissions without binary execution.
#   b r o k e n - l i n k - c h e c k e r  
 #   b r o k e n - l i n k - c h e c k e r  
 #   b r o k e n - l i n k - c h e c k e r  
 #   b r o k e n - l i n k - c h e c k e r  
 #   b r o k e n - l i n k - c h e c k e r  
 #   b r o k e n - l i n k - c h e c k e r  
<<<<<<< HEAD
 #   b r o k e n - _ l i n k - _ c h e c k e r  
 #   b r o k e n - _ l i n k - _ c h e c k e r  
 #   b r o k e n - _ l i n k - _ c h e c k e r  
=======
 #   b r o k e n - l i n k - c h e c k e r  
>>>>>>> 70a135687e50620f9d69533f2929f691695147e5
 #   b r o k e n - _ l i n k - _ c h e c k e r  
 