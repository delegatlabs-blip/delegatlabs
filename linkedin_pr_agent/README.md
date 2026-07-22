# Autonomous LinkedIn PR and Lead Agent Suite

An autonomous, lightweight background daemon suite designed to run continuously on a cloud server or local machine. The suite contains two independent agents:

1.  **LinkedIn PR Agent (`main.py`)**: Gathers trending tech and HR news using RSS feeds, writes visionary LinkedIn post copies, searches Unsplash for matching high-resolution professional photos, and publishes text posts via the official LinkedIn Posts API.
2.  **Lead Generation Agent (`lead_agent.py`)**: Programmatically searches for HR and Talent Acquisition prospects, scores leads based on company size/role, deduplicates contacts, and emails a CSV report daily.

---

## 📁 Project Directory Manifest

| File | Type | Description |
| :--- | :--- | :--- |
| **`main.py`** | Script | Entrypoint and scheduler for the PR Posting Agent. |
| **`lead_agent.py`** | Script | Entrypoint and scheduler for the Lead Generation Agent. |
| **`linkedin_api.py`** | Module | Handles LinkedIn REST API operations (`/rest/posts`, `userinfo`, token checks). |
| **`oauth_server.py`** | Module | Local FastAPI dashboard and LinkedIn OAuth callback handler. |
| **`supabase_store.py`** | Module | Stores and retrieves encrypted LinkedIn OAuth tokens through Supabase RPC. |
| **`supabase_schema.sql`** | Setup | Supabase table and RPC functions for encrypted token storage. |
| **`search_agent.py`** | Module | Queries news sources and RSS feeds for trending articles. |
| **`content_generator.py`** | Module | Calls Groq API (llama-3.3-70b-versatile) for copywriting and Unsplash image downloads. |
| **`memory_manager.py`** | Module | Saves posts, checks 7-day rule, adjusts weights, compiles report. |
| **`memory.json`** | Data | Local database containing logged posts and current topic weights. |
| **`lead_searcher.py`** | Module | Handles scraping operations to extract contact data. |
| **`lead_memory.py`** | Module | Checks for duplicate leads and stores entries in JSON/CSV formats. |
| **`lead_notifier.py`** | Module | Formats lead records and sends HTML summary emails. |
| **`leads.json` / `leads.csv`**| Data | Database containing extracted prospect contacts. |
| **`notifier.py`** | Module | Low-level SMTP client library for sending post and warning notifications. |
| **`config.py`** | Module | Configures credentials and environment settings. |
| **`requirements.txt`** | Setup | Python dependency packages requirement list. |
| **`test_linkedin_bot.py`** | Test | Unit tests for LinkedIn REST API calls and token expiry checks. |
| **`test_lead_agent.py`** | Test | Unit tests for the Lead search and log pipeline. |
| **`test_phase2.py`** | Test | Unit tests for topic weights tuning and SMTP report compiler. |
| **`.agents/`** | Config | Project-scoped guidelines and skill references. |

---

## 🛠️ Installation & Setup

Follow these steps to set up and run the agent suite on your local machine or cloud server:

### Step 1: Clone the Repository
```bash
git clone https://github.com/anu007lko/linkedin_pr_agent.git
cd linkedin_pr_agent
```

### Step 2: Create a Virtual Environment & Install Dependencies
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env` and fill in your actual API tokens and SMTP credentials:
```bash
cp .env.example .env
nano .env
```

Ensure the following variables are configured:
*   `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI`: LinkedIn OAuth app settings.
*   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `LINKEDIN_TOKEN_ENCRYPTION_KEY`: Supabase token storage settings.
*   `GROQ_API_KEY`: Groq API token (uses free-tier `llama-3.3-70b-versatile` model).
*   `UNSPLASH_ACCESS_KEY`: Unsplash developer access token.
*   `NOTIFICATION_EMAIL`: Recipient address for job confirmation and warning summaries.
*   `GMAIL_ADDRESS`, `GMAIL_APP_PASSWORD`: Credentials for the sending Gmail address (requires App Passwords).

### Step 4: Configure Supabase LinkedIn Token Storage
Run `supabase_schema.sql` once in the Supabase SQL editor. It creates `linkedin_accounts` plus RPC functions that encrypt/decrypt the access token with `pgcrypto`.

Use the Supabase `service_role` key only on this backend. Never expose it in browser code.

### Step 5: Configure LinkedIn Redirect URL
In the LinkedIn Developer Portal, add this redirect URL:

```text
http://localhost:8000/oauth/linkedin/callback
```

Your app must have access to these OAuth scopes:

```text
openid profile email w_member_social
```

---

## 🧪 Run Unit Tests

Confirm everything is configured correctly by running the test suites:

```bash
    # Test LinkedIn URN retrieval, token expiry logic, and Posts API publishing
python3 test_linkedin_bot.py

# Test dynamic weight adjustments and Unsplash downloading mocks
python3 test_phase2.py

# Test contact search APIs (Hunter, Prospeo, Snov) and lead scoring
python3 test_lead_agent.py
```

---

## 🚀 Running the Agents

Run the local OAuth dashboard:

```bash
python3 -m uvicorn oauth_server:app --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000/dashboard`, click **Connect LinkedIn**, then run the agent once from the dashboard or start the scheduler below.

Both agents run as infinite scheduler loops:

```bash
# Run the PR Posting Scheduler
python3 main.py

# Run the Lead Generation Scheduler
python3 lead_agent.py
```

---

## ☁️ Cloud VM Deployment (Systemd Services)

For continuous 24/7 execution, deploy on a Linux VM (e.g., GCP Compute Engine, AWS EC2, or DigitalOcean) using `systemd` daemon configurations:

### 1. Create PR Agent Service
Create the configuration file:
`sudo nano /etc/systemd/system/linkedin-pr-agent.service`

Add the following configuration (replace `anu007lko` with your VM username):
```ini
[Unit]
Description=LinkedIn PR Posting Agent Service
After=network.target

[Service]
Type=simple
User=anu007lko
WorkingDirectory=/home/anu007lko/linkedin_pr_agent
ExecStart=/home/anu007lko/linkedin_pr_agent/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 2. Create Lead Agent Service
Create the configuration file:
`sudo nano /etc/systemd/system/linkedin-lead-agent.service`

Add the following:
```ini
[Unit]
Description=LinkedIn Lead Generation Agent Service
After=network.target

[Service]
Type=simple
User=anu007lko
WorkingDirectory=/home/anu007lko/linkedin_pr_agent
ExecStart=/home/anu007lko/linkedin_pr_agent/venv/bin/python lead_agent.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 3. Start and Enable Daemons
Reload systemctl configurations, enable the background processes, and start them:
```bash
sudo systemctl daemon-reload
sudo systemctl enable linkedin-pr-agent linkedin-lead-agent
sudo systemctl start linkedin-pr-agent linkedin-lead-agent
```

### 4. Monitor Daemon Status and Read Logs
```bash
# Check status
sudo systemctl status linkedin-pr-agent
sudo systemctl status linkedin-lead-agent

# Monitor real-time logs (tail -f equivalent)
journalctl -u linkedin-pr-agent -n 100 -f
journalctl -u linkedin-lead-agent -n 100 -f
```
