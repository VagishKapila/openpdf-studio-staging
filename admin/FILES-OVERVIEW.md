# Admin Dashboard - Files Overview

Complete guide to every file in the analytics admin dashboard.

## Directory Structure

```
admin/
├── server.js                      # Express.js backend server
├── package.json                   # Node.js dependencies and scripts
├── Dockerfile                     # Docker container configuration
├── railway.json                   # Railway deployment settings
├── .env.example                   # Environment variables template
├── README.md                      # Full documentation
├── DEPLOYMENT.md                  # Deployment guide (all platforms)
├── QUICKSTART.md                  # 5-minute quick start guide
├── FILES-OVERVIEW.md              # This file
│
├── public/
│   └── index.html                 # Dashboard UI (HTML + CSS + JavaScript)
│
└── scripts/
    └── seed-data.js               # Sample data generator for testing
```

## File Descriptions

### Core Files

#### `server.js` (470 lines)
**Purpose:** Express.js backend server with SQLite database and analytics API endpoints

**Key features:**
- SQLite database initialization with schema
- Basic HTTP authentication for admin endpoints
- Event tracking endpoints
- Statistics API endpoints (downloads, users, features, crashes, geo, versions)
- CSV data export
- CORS support and compression
- Error handling

**APIs provided:**
- `POST /api/track` - Track analytics events (public)
- `GET /api/stats` - Overview statistics (admin)
- `GET /api/stats/downloads` - Download analytics (admin)
- `GET /api/stats/users` - User activity (admin)
- `GET /api/stats/features` - Feature usage (admin)
- `GET /api/stats/crashes` - Crash reports (admin)
- `GET /api/stats/geo` - Geographic data (admin)
- `GET /api/stats/versions` - Version adoption (admin)
- `PATCH /api/stats/crashes/:id` - Update crash status (admin)
- `GET /api/export/csv` - Export data (admin)
- `GET /health` - Health check (public)

**Environment variables used:**
- `PORT` - Server port (default: 3001)
- `ADMIN_USERNAME` - Admin login username
- `ADMIN_PASSWORD` - Admin login password
- `DB_PATH` - SQLite database file path

#### `package.json` (40 lines)
**Purpose:** Node.js project configuration

**Dependencies:**
- `express` (4.18.2) - Web server framework
- `cors` (2.8.5) - Cross-origin request handling
- `better-sqlite3` (9.2.2) - SQLite database driver
- `dotenv` (16.3.1) - Environment variable loader
- `uuid` (9.0.1) - Unique ID generation
- `compression` (1.7.4) - Response compression

**Scripts:**
- `npm start` - Run production server
- `npm run dev` - Run development server with auto-reload
- `npm run seed` - Load sample analytics data

#### `Dockerfile` (25 lines)
**Purpose:** Docker container configuration

**What it does:**
- Uses Node.js 20 Alpine as base image
- Installs build dependencies for better-sqlite3
- Copies application files
- Creates data directory for persistent storage
- Sets health check endpoint
- Exposes port 3001

**Use cases:**
- Local Docker development
- Production containerized deployment
- Docker Compose integration
- Docker registry (Docker Hub, ECR)

#### `railway.json` (35 lines)
**Purpose:** Railway platform deployment configuration

**Configured:**
- Docker builder (uses Dockerfile)
- Start command
- Restart policy
- Health check path
- Environment variables with descriptions
- Port configuration

**Benefits:**
- One-click deployment to Railway
- Automatic HTTPS
- Persistent storage volume
- Environment variable management
- Auto-scaling capabilities

#### `.env.example` (12 lines)
**Purpose:** Template for environment variables

**Variables:**
- `PORT` - Server port for local development
- `ADMIN_USERNAME` - Dashboard login username
- `ADMIN_PASSWORD` - Dashboard login password
- `DB_PATH` - SQLite database location
- `NODE_ENV` - Runtime environment (development/production)
- `CORS_ORIGIN` - CORS allowed origins

**Usage:**
```bash
cp .env.example .env
# Edit .env with your values
```

### Documentation Files

#### `README.md` (320 lines)
**Content:**
- Feature overview
- Installation instructions
- Configuration guide
- API endpoint documentation
- Database schema explanation
- Railway deployment guide
- Docker deployment guide
- Security best practices
- Performance considerations
- Troubleshooting guide

**Audience:** Developers, DevOps engineers, system administrators

#### `DEPLOYMENT.md` (450 lines)
**Content:**
- Local development setup
- Docker deployment (standalone and Compose)
- Railway deployment (GitHub and CLI methods)
- Vercel/Netlify deployment
- Heroku deployment with add-ons
- AWS deployment (EC2 and ECS)
- Environment variables best practices
- Database management and backups
- Monitoring and maintenance
- Troubleshooting common issues

**Audience:** DevOps engineers, system administrators, deployment specialists

#### `QUICKSTART.md` (200 lines)
**Content:**
- 30-second local setup
- App integration steps
- Common tasks (load data, change password, export)
- Deploy to Railway
- Docker quick start
- API quick reference
- Debugging tips
- File structure overview
- FAQ
- Useful commands

**Audience:** Developers, new users

#### `FILES-OVERVIEW.md` (This file)
**Content:** Detailed description of every file in the project

**Audience:** Developers, contributors

### Interface Files

#### `public/index.html` (800 lines)
**Purpose:** Complete analytics dashboard UI

**Structure:**
- Header with refresh button and export option
- Statistics cards (4 main metrics)
- Downloads analytics section with charts
- User activity section with daily/weekly/monthly charts
- Feature usage section with heatmap
- Version adoption section with table
- Geographic distribution table
- Crash reports with error details
- Responsive dark theme

**Features:**
- Real-time data updates
- Auto-refresh every 5 minutes
- CSV export functionality
- Responsive design (mobile-friendly)
- Chart.js for visualizations
- Dark theme matching app branding
- Performance monitoring with animated counters

**Charts included:**
- Downloads by platform (doughnut)
- Top versions (bar)
- Download trend (line)
- Daily active users (line)
- Weekly active users (bar)
- Monthly active users (bar)
- Feature usage (bar)
- Crashes by version (bar)
- Crashes by platform (doughnut)
- Version adoption (bar)

**Authentication:**
- Browser-based Basic Auth (username/password)
- Prompted on dashboard load
- Credentials persisted in current session

### Script Files

#### `scripts/seed-data.js` (250 lines)
**Purpose:** Generate sample analytics data for testing and demonstration

**Data generated (500+ records):**
- 500 download records across platforms/versions
- 150 active user records
- 1000 feature usage events
- 30 crash reports with error messages
- 200 geographic data records
- 500 general events (app open, active, page view)

**Platforms included:**
- Windows, macOS, Linux, iOS, Android, Web

**Features tracked:**
- pdf_to_image, pdf_to_word, pdf_compression, pdf_merge
- pdf_split, pdf_rotation, pdf_watermark, pdf_extraction
- batch_convert, ocr_processing

**Usage:**
```bash
npm run seed
# Populates database with realistic test data
```

**Use cases:**
- Testing dashboard functionality
- Demonstrating features to stakeholders
- Development without real analytics data
- Performance testing with realistic data volume

## Analytics Client File

### `../src/analytics.js` (400 lines)
**Purpose:** Lightweight analytics client for the main app

**Key classes:**
- `AnalyticsClient` - Main analytics tracker class

**Key methods:**
- `trackEvent(type, data)` - Track any event
- `trackFeature(name, action)` - Track feature with timing
- `trackCrash(error)` - Track errors
- `trackGeo()` - Track geographic location
- `trackActivity()` - Track periodic activity
- `setOptOut(optOut)` - Enable/disable analytics
- `flush()` - Send queued events
- `sendEvents(events)` - Send to server

**Features:**
- Event batching (10 events or 30 seconds)
- Offline queue with localStorage persistence
- No PII collection
- Privacy-respecting opt-out support
- Performance timing
- Geographic location tracking
- Device info collection
- Debug logging mode
- Session and user ID tracking

**Integration:**
- Copy to your app's src directory
- Initialize at app startup
- Use getAnalytics() to access singleton
- Track features throughout your app

## Configuration Files

### Docker Configuration

**Dockerfile:**
- Node.js 20 Alpine base
- Python + build tools for better-sqlite3
- Persistent volume at /app/data
- Health check on /health endpoint
- Port 3001 exposed

### Railway Configuration

**railway.json:**
- Dockerfile build
- npm start command
- Environment variables with descriptions
- Health check configured
- Auto-scaling ready

### Git Configuration

**.env.example:**
- Never commit .env files
- Only commit .env.example
- Document all variables needed
- Provide sensible defaults

## Database Schema

### Tables Created

1. **events** (1000+ rows possible)
   - id (UUID, primary key)
   - type (TEXT: app_open, app_active, feature_use, crash, geo_update, download)
   - platform (TEXT: Windows, macOS, Linux, iOS, Android, Web)
   - version (TEXT: semantic version)
   - user_id (TEXT: anonymous user ID)
   - session_id (TEXT: session tracking)
   - timestamp (DATETIME)
   - data (JSON: event-specific data)

2. **downloads** (500+ rows)
   - id (UUID, primary key)
   - platform (TEXT)
   - version (TEXT)
   - timestamp (DATETIME)
   - geo_country (TEXT)
   - geo_region (TEXT)
   - user_agent (TEXT)

3. **active_users** (150+ rows)
   - id (UUID, primary key)
   - user_id (TEXT, unique)
   - platform (TEXT)
   - version (TEXT)
   - last_seen (DATETIME)
   - first_seen (DATETIME)
   - session_count (INTEGER)

4. **feature_usage** (1000+ rows)
   - id (UUID, primary key)
   - user_id (TEXT)
   - feature_name (TEXT)
   - feature_action (TEXT)
   - timestamp (DATETIME)
   - duration_ms (INTEGER)
   - success (INTEGER: 0 or 1)

5. **crashes** (30+ rows)
   - id (UUID, primary key)
   - user_id (TEXT)
   - version (TEXT)
   - platform (TEXT)
   - error_message (TEXT)
   - stack_trace (TEXT)
   - timestamp (DATETIME)
   - resolved (INTEGER: 0 or 1)

6. **geographic_data** (200+ rows)
   - id (UUID, primary key)
   - user_id (TEXT)
   - country_code (TEXT: US, GB, DE, etc)
   - country_name (TEXT)
   - region (TEXT)
   - city (TEXT)
   - timestamp (DATETIME)

7. **version_stats** (derived data)
   - version (TEXT, primary key)
   - download_count (INTEGER)
   - active_users (INTEGER)
   - last_updated (DATETIME)

## File Sizes and Metrics

```
server.js               ~15 KB   (470 lines)
public/index.html       ~32 KB   (800 lines)
scripts/seed-data.js    ~8 KB    (250 lines)
analytics.js            ~9 KB    (400 lines)
package.json            ~1 KB    (40 lines)
Dockerfile              ~1 KB    (25 lines)
railway.json            ~1 KB    (35 lines)
.env.example            ~0.5 KB  (12 lines)
README.md               ~15 KB   (320 lines)
DEPLOYMENT.md           ~25 KB   (450 lines)
QUICKSTART.md           ~8 KB    (200 lines)
FILES-OVERVIEW.md       ~12 KB   (300 lines)
───────────────────────────────
Total Documentation     ~61 KB
Total Code              ~65 KB
```

## Dependency Tree

```
express (4.18.2)
├── compression (1.7.4)
├── cors (2.8.5)
└── body-parser (included)

better-sqlite3 (9.2.2)
└── Node.js native module

uuid (9.0.1)

dotenv (16.3.1)
```

## Development Workflow

```
1. Development
   ├─ npm install
   ├─ cp .env.example .env
   ├─ npm run dev
   └─ Browser: http://localhost:3001

2. Testing
   ├─ npm run seed
   └─ Test with sample data

3. Production
   ├─ npm install --production
   ├─ Create .env with production values
   └─ npm start
```

## Deployment Options

```
Local
├─ npm start (direct)
└─ Docker build + run

Cloud
├─ Railway (recommended)
│  ├─ Push to GitHub
│  ├─ Connect in Railway
│  └─ Auto-deploy on push
├─ Heroku
│  └─ heroku create + git push
├─ AWS
│  ├─ EC2 (manual)
│  └─ ECS (containerized)
└─ Docker Registry
   ├─ Docker Hub
   └─ ECR
```

## Summary

This admin dashboard provides:
- ✅ Complete analytics server with SQLite database
- ✅ Beautiful, responsive web UI
- ✅ RESTful API for event tracking and data retrieval
- ✅ Docker containerization for easy deployment
- ✅ Railway platform integration for one-click deployment
- ✅ Comprehensive documentation for all use cases
- ✅ Sample data generator for testing
- ✅ Production-ready code with error handling
- ✅ Privacy-respecting analytics collection
- ✅ Real-time dashboard with multiple chart types

Every file serves a purpose and is well-documented. Start with QUICKSTART.md for a fast setup, or README.md for comprehensive documentation.
