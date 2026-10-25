# CareerFlow — Job Application Tracker & Career Dashboard

CareerFlow is a full-stack workspace for organizing a job search across India and Gulf countries. It brings application tracking, interviews, reminders, notes, private CVs, and search analytics together in one responsive app.

## Features

- Register, sign in, sign out, edit a profile, and change a password with JWT authentication.
- Create, search, filter, sort, paginate, edit, and delete job applications; switch between card and table views, move applications on a Kanban board, and export the user's records to CSV.
- Track application details, status history, related interviews, reminders, notes, and CV documents.
- Schedule interviews and recruiter follow-ups, mark reminders complete, and keep general or application-specific notes.
- Upload PDF resumes (5 MB maximum), mark one as the default, and download them through an authenticated endpoint.
- View dashboard metrics and charts for status, monthly activity, location, role, and conversion rates. Date ranges include the last 7 days, last 30 days, 6 months, and all time.
- Use the responsive interface with a light/dark appearance toggle and quick-add actions.

Email and browser push reminders are not included; reminders are shown in the app.

## Architecture

The React/Vite frontend calls the Django REST Framework API over HTTP. During local development, Vite proxies `/api` to Django at `http://127.0.0.1:8000`. Django authenticates requests with short-lived JWT access tokens and refresh tokens. The API derives the current owner from the authenticated request and scopes each user's records on the backend. SQLite is used locally; Django can be configured for PostgreSQL with environment variables.

```text
Browser (React + Vite :5173)
          │ /api requests, JWT
          ▼
Django REST Framework (:8000)
  ├── accounts and JWT auth
  ├── applications and dashboard analytics
  ├── interviews, reminders, notes, activity
  └── private resume document endpoints
          │
          ▼
SQLite (local) / PostgreSQL (configured for production)
```

## Requirements

- Windows 10/11 and PowerShell
- Python 3.11
- Node.js 20.19+ or 22.12+ (Vite 7 requirement)
- npm (included with Node.js)

## Run locally

Open the project folder in VS Code. Run the backend and frontend in two separate VS Code terminals.

### 1. Backend terminal

From the repository root, create and activate the virtual environment and install the Python dependencies:

```powershell
py -3.11 -m venv backend\.venv
.\backend\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
```

If PowerShell blocks activating the virtual environment, allow it for this terminal only:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\backend\.venv\Scripts\Activate.ps1
```

Create the local environment file and generate a development-only secret:

```powershell
Copy-Item .env.example .env
$secret = python -c "import secrets; print(secrets.token_urlsafe(48))"
(Get-Content .env) -replace '^DJANGO_SECRET_KEY=.*$', "DJANGO_SECRET_KEY=$secret" |
    Set-Content .env -Encoding ascii
```

Then prepare the database, run checks and tests, and start the API server:

```powershell
python backend\manage.py migrate
python backend\manage.py check
python backend\manage.py test accounts applications productivity documents
python backend\manage.py runserver 127.0.0.1:8000
```

Confirm the API is running at <http://127.0.0.1:8000/api/health/>. A healthy response is `{"status":"ok"}`.

### 2. Frontend terminal

Open a second terminal at the repository root:

```powershell
Set-Location .\frontend
npm install
npm run dev
```

Open <http://127.0.0.1:5173/> and create an account in your local development app. Keep both terminals running while using CareerFlow. Stop a server with `Ctrl+C` in its terminal.

Vite uses port 5173 when available and automatically chooses the next available port if it is occupied. Open the exact `Local` URL printed in the terminal; the `/api` proxy works on that port too.

## Environment variables

Copy `.env.example` to `.env` at the repository root. `.env` is ignored by Git and must never contain production secrets in a commit.

| Variable | Purpose |
| --- | --- |
| `DJANGO_SECRET_KEY` | Django signing key; generate a private value for each environment. |
| `DJANGO_DEBUG` | `True` for local development; use `False` in production. |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated backend host names. |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins allowed to call the API. |
| `DB_ENGINE` | Defaults to SQLite; set to `django.db.backends.postgresql` for PostgreSQL. |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | PostgreSQL connection settings when PostgreSQL is selected. |
| `VITE_API_URL` | Optional frontend API base URL. Leave blank locally to use the Vite `/api` proxy; set the deployed backend API base URL for a hosted frontend. |

The committed `.env.example` contains placeholders only. The real `.env`, local database, uploaded CVs, virtual environment, `node_modules`, and build output are ignored.

## Backend API

All endpoints below are prefixed with `/api`. Except registration, login, token refresh, and the health check, endpoints require `Authorization: Bearer <access-token>`.

| Area | Endpoints |
| --- | --- |
| Health | `GET /health/` |
| Authentication | `POST /auth/register/`, `POST /auth/login/`, `POST /auth/token/refresh/`, `POST /auth/logout/`, `GET/PATCH /auth/profile/`, `POST /auth/change-password/` |
| Applications | `GET/POST /applications/`, `GET/PATCH/DELETE /applications/{id}/`, `GET /applications/{id}/timeline/`, `GET /applications/export/` |
| Dashboard | `GET /dashboard/stats/?range=7d\|30d\|6m\|all` |
| Interviews | `GET/POST /interviews/`, `GET/PATCH/DELETE /interviews/{id}/` |
| Reminders | `GET/POST /reminders/`, `GET/PATCH/DELETE /reminders/{id}/` |
| Notes | `GET/POST /notes/`, `GET/PATCH/DELETE /notes/{id}/` |
| Documents | `GET/POST /documents/`, `GET/PATCH/DELETE /documents/{id}/`, `GET /documents/{id}/download/` |

Application list filters include status, country, job type, work mode, sector, location category, salary range, search, and ordering. List endpoints are paginated. Use the download endpoint for private PDFs; uploaded files are not served as public media URLs.

## Data model

- A Django user owns each application, interview, reminder, note, resume, and activity event.
- Interviews belong to both their owner and an application. Reminders, notes, and resumes may be linked to an application or kept general.
- Application deletion cascades to interviews and activity, while general-purpose notes, reminders, and resumes remain and have their application link cleared.
- Salary bounds are checked in the serializer and database. One default resume per user is enforced with a database constraint.
- Dashboard conversion rates exclude saved applications from the denominator and use each record's current status.

## Verification

From the repository root, with the backend virtual environment active:

```powershell
python backend\manage.py check
python backend\manage.py test accounts applications productivity documents
```

For the frontend production build:

```powershell
Set-Location .\frontend
npm test
npm run build
npm audit
```

For API exploration, import or create requests in Postman using `http://127.0.0.1:8000/api` as the base URL. Register or log in to obtain an access token, then set it as a Bearer token for protected requests. The `Authorization` header should contain the access token, not the refresh token.

## Deployment checklist

Deployment has not been performed. Before publishing:

1. Provision PostgreSQL and set the database variables in the hosting provider's secret manager.
2. Set a strong private `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=False`, the backend `DJANGO_ALLOWED_HOSTS`, and the exact frontend origin in `CORS_ALLOWED_ORIGINS`.
3. Set the frontend `VITE_API_URL` to the deployed backend API base URL, including `/api`.
4. Configure HTTPS and a persistent private media backend for uploaded resumes. The included local `MEDIA_ROOT` is suitable for development; production deployments should use private object storage and keep the authenticated download authorization check.
5. Run migrations and `collectstatic` as part of the backend deployment, then verify registration, login, CRUD, dashboard data, CSV export, and private document access against the hosted services.
6. Deploy the frontend to Vercel or another static frontend host and test the deployed site end to end.

Do not use the development secret or commit `.env`, database credentials, or private CV files.

## Screenshots

Add current screenshots here after capturing the running application (for example, the landing page, dashboard, applications table, and Kanban board).

## Future enhancements

Potential extensions include calendar integration, optional email or browser notifications, salary comparisons by currency, resume/job matching, interview practice prompts, and progressive web app support.
