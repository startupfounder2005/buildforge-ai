# Switching from Default Supabase Email to SendGrid SMTP

Since Supabase's free tier limits email sending (3/hour), switching to a dedicated provider like SendGrid is the best solution. Supabase allows you to bring your own SMTP credentials easily.

## Phase 1: Configure SendGrid

1.  **Create Account**: Log in to [SendGrid](https://sendgrid.com/).
2.  **Sender Authentication**:
    *   Go to **Settings** -> **Sender Authentication**.
    *   Click **Verify a Single Sender**.
    *   Fill in your details.
        *   **From Name**: Obsidian (or your app name)
        *   **From Email**: `no-reply@yourdomain.com` (or your personal email for testing).
    *   Check your inbox and verify this email addresses. **You cannot send emails until this is verified.**
3.  **Generate API Key**:
    *   Go to **Settings** -> **API Keys**.
    *   Click **Create API Key**.
    *   Name it (e.g., "Supabase SMTP").
    *   Select **Restricted Access**.
    *   Scroll down to **Mail Send** and click the slider to enable it (Full Access is also fine for testing).
    *   Click **Create & View**.
    *   **COPY THIS KEY IMMEDIATELY**. You will never see it again. It starts with `SG.`.

## Phase 2: Configure Supabase

1.  Go to your **Supabase Dashboard**.
2.  Navigate to **Project Settings** (cog icon at bottom left) -> **Authentication**.
3.  Scroll down to the **SMTP Settings** section.
4.  Toggle **Enable Custom SMTP** to **ON**.
5.  Fill in the details:
    *   **Sender Email**: The exact email you verified in SendGrid (Step 2 above).
    *   **Sender Name**: Obsidian
    *   **Host**: `smtp.sendgrid.net`
    *   **Port**: `587`
    *   **Username**: `apikey` (Type this exactly. Do not put your email here. The username is literally the string `apikey`).
    *   **Password**: Paste your SendGrid API Key (starts with `SG.`).
    *   **Minimum encryption**: `STARTTLS` (recommended) or `None`.
6.  Click **Save**.

## Phase 3: Test It

1.  Go to your App's Login screen.
2.  Try to Sign Up with a new email address.
3.  Check that email's inbox. You should receive the confirmation email instantly, sent via SendGrid.
