 # Dialogon
 
 Dialogon is an end-to-end meeting copilot that **collects calendar events, joins Google Meet calls on your behalf, records the conversation, transcribes the audio with Google Cloud Speech-to-Text, and distills the transcript with Gemini 1.5**. The project combines:
 
 - A Django + DRF backend that handles authentication, event management, and meeting automation.
 - A Vite/React frontend for scheduling and monitoring meetings.
 - Standalone AI workers for speech-to-text and summarisation.
 
 > ⚠️ **Platform note:** automated meeting joining and loopback recording currently target Windows + Google Chrome because Selenium is configured with the Chrome user-data layout in `Backend/chrome_user_data`.
 
 ---
 
 ## Core Features
 
 - **Auth & onboarding** – email/password + Google Sign-In (Firebase) with MongoDB persistence.
 - **Calendar-style dashboard** – create, edit, delete, and manually trigger meetings from the React UI.
 - **Autonomous meet joining** – `meeting_scheduler.py` polls MongoDB and launches `meeting_joiner.py` via Selenium when an event is about to start.
 - **Audio capture & transcription** – optional system loopback recording (`record_meet.py`), storage in Google Cloud Storage, and transcription using the Speech-to-Text API.
 - **Summaries** – Gemini-powered abstractive summaries (`ai-api/summarise`) or fallback to the raw transcript.
 - **Manual overrides** – REST endpoint (`/api/auth/manual-join/`) to trigger the bot for ad-hoc calls.
 
 ---
 
 ## Repository Layout
 
 | Path | Contents |
 | --- | --- |
 | `Backend/` | Django project (`backend/`), REST endpoints (`authapp/`), meeting automation scripts, STT helpers, Selenium Chrome profile. |
 | `Frontend/` | Vite + React SPA with Tailwind styling, auth pages, dashboard, and API client. |
 | `ai-api/` | Standalone scripts that call Google STT + Gemini summariser for pre-recorded meetings. |
 
 ---
 
 ## Prerequisites
 
 - **Python** 3.11+ (tested with Django 5)
 - **Node.js** 18+ (Vite 6 requires modern Node)
 - **MongoDB Atlas or self-hosted Mongo instance**
 - **Google Chrome** (stable) + chromedriver (pulled automatically via `webdriver-manager`)
 - **Google Cloud project** with Speech-to-Text + Cloud Storage enabled
 - **Google Gemini API key** for summarisation
 - (Optional) **Firebase project** for client-side Google OAuth (already configured in `Frontend/src/utils/firebase.js`; replace with your own keys for production)
 
 ---
 
 ## Backend Setup (Django + Automation)
 
 ```powershell
 cd Backend
 python -m venv .venv
 .venv\Scripts\activate
 pip install -r requirements.txt
 python manage.py migrate   # SQLite migrations for Django internals
 python manage.py runserver
 ```
 
 ### Required environment variables (`Backend/.env`)
 
 ```dotenv
 DB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/user
 
 # Firebase Admin credentials (used to validate Google tokens server-side)
 FIREBASE_CREDENTIALS_JSON=C:\path\to\firebase-adminsdk.json
 FIREBASE_API_KEY=<firebase-web-key>
 FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
 FIREBASE_PROJECT_ID=<project-id>
 FIREBASE_STORAGE_BUCKET=<bucket>
 FIREBASE_MESSAGING_SENDER_ID=<sender>
 FIREBASE_APP_ID=<app-id>
 
 # Google Cloud – Speech-to-Text
 GOOGLE_API_KEY=<gemini-or-gcloud-key>              # optional fallback
 GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\gcloud-service-account.json
 
 # Meeting automation
 CHROME_EXE=C:\Program Files\Google\Chrome\Application\chrome.exe
 ```
 
 Create the Cloud Storage bucket referenced in `stt/stt.py` (default: `dialogon-audio-bucket`) or change the constant to match your bucket name.
 
 ### Key backend services
 
 - **REST API** – served via `manage.py runserver` on `http://localhost:8000/api/...`
 - **Meeting scheduler** – polls MongoDB every 30 s to auto-launch meetings:
   ```powershell
   cd Backend
   .venv\Scripts\activate
   python meeting_scheduler.py
   ```
 - **Manual join API** – POST `meeting_link`, `user_email`, `event_index` to `/api/auth/manual-join/` (handled by `authapp/manual_join.py`).
 - **Recording + transcription** – `meeting_joiner.py` imports `record_meet` and `summarize_meet` if dependencies and credentials are present. Missing modules are handled gracefully and logged.
 
 > 💡 The scheduler and manual join route both invoke `meeting_joiner.py`, which opens a Chrome window via remote debugging, enters the configured bot name, and (optionally) records system audio to `Backend/Recordings/`.
 
 ---
 
 ## Frontend Setup (Vite + React)
 
 ```powershell
 cd Frontend
 npm install
 npm run dev      # launches on http://localhost:5173 by default
 ```
 
 - API calls target `http://localhost:8000/api` (see `src/utils/api.js`). Update `API_BASE_URL` when deploying.
 - Firebase config lives in `src/utils/firebase.js`. Replace the sample keys with your Firebase project's client keys for production.
 
 ### Using the dashboard
 
 1. Register or login via email/password, or click “Continue with Google”.
 2. Create calendar events from the left panel; they are stored in MongoDB under the authenticated user.
 3. Keep `meeting_scheduler.py` running to auto-join meetings 0–2 minutes before the scheduled time, or click **Launch Agent Manually** / the `Launch Assistant` button next to an event to fire the bot immediately.
 4. Completed meetings will appear in the “Completed Events” column once the automation updates the Mongo document with `status: "completed"` and the summary pipeline finishes.
 
 ---
 
 ## AI Worker Utilities (`ai-api/`)
 
 These scripts are handy when you already have a `.wav` recording and simply want to generate a transcript + summary without running the full meeting automation stack.
 
 ```powershell
 cd ai-api
 python -m venv .venv
 .venv\Scripts\activate
 pip install -r ..\Backend\requirements.txt  # or create a minimal requirements set
 python process_meeting.py path\to\file.wav
 ```
 
 - `stt.py` uploads audio to Google Cloud Storage and runs Speech-to-Text.
 - `summarise/summarise.py` calls the Gemini 1.5 Pro API using `GOOGLE_API_KEY`.
 - `process_meeting.py` chains both steps and writes `<audio>_summary.txt`.
 
 ---
 
 ## API Snapshot
 
 | Method | Route | Description |
 | --- | --- | --- |
 | `POST` | `/api/auth/register/` | Create a user (email/password). |
 | `POST` | `/api/auth/login/` | Login and receive Mongo `_id` token surrogate. |
 | `POST` | `/api/auth/google-auth/` | Exchange Firebase ID token for a Dialogon user record. |
 | `POST` | `/api/auth/events/create/` | Append a meeting event to the user's array. |
 | `GET` | `/api/auth/events/<email>/` | Fetch stored events for the email. |
 | `PUT` / `DELETE` | `/api/auth/events/<email>/<index>/` | Update or remove a specific event. |
 | `POST` | `/api/auth/manual-join/` | Launch the Selenium bot immediately. |
 
 The backend stores users and event arrays inside MongoDB (`db.user.users`). Django’s built-in SQLite database is only used for admin/auth scaffolding; most business data lives in Mongo.
 
 ---
 
 ## Troubleshooting & Tips
 
 - **Chrome won’t launch** – ensure `CHROME_EXE` points to a valid path and that no other Chrome instance is already using the debugging port `9222`.
 - **`record_meet` fails** – install the audio stack from `requirements.txt` (`soundcard`, `sounddevice`, etc.) and confirm Windows loopback capture is allowed.
 - **Google Cloud auth errors** – verify `GOOGLE_APPLICATION_CREDENTIALS` points to a readable service-account JSON with Speech + Storage permissions, and that your bucket exists.
 - **Gemini quota** – `ai-api/summarise` uses `gemini-1.5-pro`. Set `GOOGLE_API_KEY` to a key with sufficient quota or adjust the model name.
 - **Production hardening** – replace token handling with JWT, lock down CORS, move secrets out of source control, and consider running Selenium in headless Chrome with user consent policies.
 
 ---
 
 ## Contributing
 
 1. Fork and clone the repository.
 2. Create a feature branch.
 3. Run linting/tests (`npm run lint`, Django unit tests, etc.).
 4. Open a pull request with context on the scenario you tested (manual join, scheduler, transcription).
 
 ---
 
 ## License
 
 No license file has been provided yet. If you plan to open-source Dialogon, add a license (MIT, Apache 2.0, etc.) that matches your intended use.
 
