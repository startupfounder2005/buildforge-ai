# UI Styling & Button Hover Effects

## Changes

### Projects Tab
- **Grid/Table View**: Added layout toggles to the project overview for flexible project management.
- **Project Sorting**: Implemented sorting options (Newest, Oldest, Name A-Z, Name Z-A) with premium hover effects on dropdown items.
- **Business Day Deadlines**: Accurate "Next Milestone" countdowns that reflect working days (e.g., correctly showing 7 days instead of 9 when excluding weekends).

### Aesthetic Refinements (Glassmorphism)
- **Themed Bulk Actions**: Standardized glassmorphism hover effects with themed borders across the application, now featuring a clean **white-text base state** that matches the Documents section:
    - **Documents**: Blue (Export), Red (Delete).
    - **Project Notes**: Added a dedicated **light blue bulk action bar** that shows the selection count (e.g., "1 note selected") for better visibility and usability. [Refined]
    - **Timeline**: Blue (Mark Complete/Pending), Red (Delete) - [Refined].
- **Obsidian Purple Accents**:
    - **Set Budget**: Premium dark obsidian purple hover background.
    - **Login Button**: Obsidian dark purple hover background on the landing page for brand consistency.

### Navigation & Interaction
- **Sidebar**: Refined hover states for a more responsive feel.
- **Global Search**: Improved search results layout and interaction.
- **Document Wizard**: Cleaned up navigation and back-button behavior.

### Auth & Security
- **Forgot Password Flow**: Implemented a complete password reset process using Supabase Auth:
    - Dedicated "Forgot Password" dialog on the login page with **loading states**.
    - Automated reset email delivery with a **highly-compatible table-based design**.
    - Secure `/auth/reset-password` page with **robust password validation** (strength meter, regex requirements).

## Validation Results
- **Milestone Precision**: Verified that "Due in X days" now correctly excludes non-working days for business-aligned tracking.
- **Visual Consistency**: Confirmed that all bulk action bars and buttons follow the new glassmorphism and themed border design system.
- **Brand Identity**: The obsidian dark purple accents successfully reinforce the new brand throughout the user journey (from landing to budget management).
