# Implement Forgot Password Flow

This plan outlines the steps to implement a functional "Forgot Password" flow using Supabase Auth.

## User Review Required

> [!IMPORTANT]
> The password reset flow requires valid email configuration in Supabase. Users will receive an email with a link to reset their password.

## Proposed Changes

### Auth Actions
#### [MODIFY] [actions.ts](file:///home/samoilamihai23/Desktop/Things/Startups/BuildForge%20AI/BuildForge%20AI%20MVP/app/auth/actions.ts)
- Add `requestPasswordReset` action to call `supabase.auth.resetPasswordForEmail`.
- Add `updatePassword` action to call `supabase.auth.updateUser` with a new password.

### Login Page
#### [MODIFY] [page.tsx](file:///home/samoilamihai23/Desktop/Things/Startups/BuildForge%20AI/BuildForge%20AI%20MVP/app/auth/login/page.tsx)
- Implement a "Forgot Password" dialog that appears when clicking the link.
- Use the `requestPasswordReset` action to send the reset email.

### Reset Password Page
#### [NEW] [page.tsx](file:///home/samoilamihai23/Desktop/Things/Startups/BuildForge%20AI/BuildForge%20AI%20MVP/app/auth/reset-password/page.tsx)
- Create a new page where users are redirected after clicking the reset link in their email.
- This page will contain a form to set a new password.

## Verification Plan

### Manual Verification
1. Navigate to the login page.
2. Click "Forgot your password?".
3. Enter a valid email address and submit.
4. Verify that a success message appears.
5. Check email for the reset link (this depends on Supabase email setup).
6. Click the link and verify redirect to `/auth/reset-password`.
7. Enter a new password and submit.
8. Verify successful password update and redirect to dashboard or login.
