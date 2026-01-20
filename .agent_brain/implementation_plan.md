# UI Polish & Button Styling - Phase 3

## Goal Description
Implement white border hover effects across the remaining interactive elements in the application, including bulk action bars, action dropdowns, and layout selectors. This phase also includes adding a bulk "Export Zip" feature to the Project Documents table to ensure consistency with the global Documents view and fulfill user expectations.

## Proposed Changes

### 1. Project Documents Section
#### [MODIFY] [DocumentTable.tsx](file:///home/samoilamihai23/Desktop/Things/Startups/BuildForge%20AI/BuildForge%20AI%20MVP/components/documents/DocumentTable.tsx)
-   [NEW] Add `JSZip` and `saveAs` imports.
-   [NEW] Implement `handleBulkDownload` (Export Zip) logic.
-   [MODIFY] Add "Export Selected" button to the bulk actions bar with `border border-transparent hover:border-white transition-all`.
-   [MODIFY] Add white border hover effect to the "Delete Selected" button in the bulk bar.
-   [MODIFY] Add `className="border border-transparent hover:border-white transition-all"` to the `MoreHorizontal` action trigger.
-   [MODIFY] Add white border hover effect to "View Original", "Download PDF", and "Delete" items in the dropdown menu.

### 2. Budget Section
#### [MODIFY] [BudgetManager.tsx](file:///home/samoilamihai23/Desktop/Things/Startups/BuildForge%20AI/BuildForge%20AI%20MVP/components/projects/BudgetManager.tsx)
-   [MODIFY] Add `className="border border-transparent hover:border-white transition-all"` to the expenses action trigger (three dots).
-   [MODIFY] Add white border hover effect to "Edit" and "Delete" items in the expenses dropdown.

### 3. Notes Section
#### [MODIFY] [ProjectNotes.tsx](file:///home/samoilamihai23/Desktop/Things/Startups/BuildForge%20AI/BuildForge%20AI%20MVP/components/projects/ProjectNotes.tsx)
-   [MODIFY] Add `className="border border-transparent hover:border-white transition-all"` to the individual note action trigger (three dots).
-   [MODIFY] Add white border hover effect to "Edit" and "Delete" items in the note dropdown.
-   [MODIFY] Add white border hover effect to the standalone trash icon button (for image notes).
- [MODIFY] Add glassmorphism hover effect and themed borders to "Export" and "Delete" buttons in the bulk actions bar.

### 4. Permits & Documents Section
#### [MODIFY] [DocumentsClient.tsx](file:///home/samoilamihai23/Desktop/Things/Startups/BuildForge%20AI/BuildForge%20AI%20MVP/components/documents/DocumentsClient.tsx)
-   [MODIFY] Add `className="border border-transparent hover:border-white transition-all"` to the Grid and List layout selection buttons.
-   [MODIFY] Add white border hover effect to "Export Zip" and "Delete" buttons in the bulk actions bar.

### 5. Project Timeline Section
#### [MODIFY] [ProjectTimeline.tsx](file:///home/samoilamihai23/Desktop/Things/Startups/BuildForge%20AI/BuildForge%20AI%20MVP/components/projects/ProjectTimeline.tsx)
-   [MODIFY] Add `className="border border-transparent hover:border-white transition-all"` to the milestone action trigger (three dots).
-   [MODIFY] Add white border hover effect to "Mark as Completed", "Edit Details", and "Delete" items in the dropdown.
-   [MODIFY] Add white border hover effect to "Mark Complete", "Mark Pending", and "Delete" buttons in the bulk actions bar.

# Project Status Badge Refinement

Refine the project status badges across the application to provide clear visual distinction between different project phases (Planning, Active, Completed).

## Proposed Changes

### [Component Name]

#### [MODIFY] [ProjectsClientWrapper.tsx](file:///home/samoilamihai23/Desktop/Things/Startups/BuildForge%20AI/BuildForge%20AI%20MVP/components/projects/ProjectsClientWrapper.tsx)
- Update `Badge` variant and styling logic to apply unique colors based on `project.status`:
  - **Planning**: Amber (`bg-amber-500/10 text-amber-500 border-amber-500/20`)
  - **Active**: Blue (`bg-blue-500/10 text-blue-400 border-blue-500/20`)
  - **Completed**: Emerald (`bg-emerald-500/10 text-emerald-500 border-emerald-500/20`)

#### [MODIFY] [ProjectDetailsClient.tsx](file:///home/samoilamihai23/Desktop/Things/Startups/BuildForge%20AI/BuildForge%20AI%20MVP/components/projects/ProjectDetailsClient.tsx)
- Replace plain text status display with a `Badge` component using the same status-specific styling as above.

#### [MODIFY] [UpcomingDeadlines.tsx](file:///home/samoilamihai23/Desktop/Things/Startups/BuildForge%20AI/BuildForge%20AI%20MVP/components/dashboard/UpcomingDeadlines.tsx)
- Replace plain text status display with a mini `Badge` or color-coded text using the established status colors.

#### [MODIFY] [LandingButtons.tsx](file:///home/samoilamihai23/Desktop/Things/Startups/BuildForge%20AI/BuildForge%20AI%20MVP/components/landing/LandingButtons.tsx)
- Update "Login" button classes to include `hover:border-white` for a consistent hover effect.

#### [MODIFY] [layout.tsx](file:///home/samoilamihai23/Desktop/Things/Startups/BuildForge%20AI/BuildForge%20AI%20MVP/app/dashboard/layout.tsx)
- Change profile circle hover ring from `hover:ring-2` to `hover:ring-1` and set `hover:ring-offset-1` for a more subtle look.

#### [MODIFY] [NewDocumentWizard.tsx](file:///home/samoilamihai23/Desktop/Things/Startups/BuildForge%20AI/BuildForge%20AI%20MVP/components/documents/NewDocumentWizard.tsx)
- Ensure the `incidentTime` input has the correct attributes to allow browser-native time picking.

#### [MODIFY] [BillingTab.tsx](file:///home/samoilamihai23/Desktop/Things/Startups/BuildForge%20AI/BuildForge%20AI%20MVP/components/account/BillingTab.tsx)
- Add `border border-transparent hover:border-white transition-all` to the "Upgrade to Pro" button.

#### [MODIFY] [DocumentsClient.tsx](file:///home/samoilamihai23/Desktop/Things/Startups/BuildForge%20AI/BuildForge%20AI%20MVP/components/documents/DocumentsClient.tsx)
- Update `typeFilter` logic and the filter dropdown items to match the requested categories:
  - **Permit**: Matches 'building_permit', 'electrical_permit', 'plumbing_permit', 'mechanical_permit'.
  - **Contract**: Matches 'subcontractor_agreement'.
  - **Safety Report**: Matches 'safety_report'.
  - **Project Bid**: Matches 'bid'.
  - **Invoice**: Matches 'invoice'.
  - **Change Order**: Matches 'change_order'.
  - **Daily Log**: Matches 'daily_log'.

## Verification Plan

### Manual Verification
- **Safety Report**: Go to the document wizard, select "Safety Report", and verify the Time field opens the time picker.
- **Billing Tab**: Navigate to Account > Billing and verify "Upgrade to Pro" has a white border on hover.
- **Document Filters**: In the Permits & Documents tab, test each filter category and ensure it returns the correct documents based on the new grouping logic.

#### [MODIFY] [actions.ts](file:///home/samoilamihai23/Desktop/Things/Startups/BuildForge%20AI/BuildForge%20AI%20MVP/app/dashboard/projects/actions.ts)
- Add `deleteProjects(ids: string[])` server action.

#### [MODIFY] [ProjectsClientWrapper.tsx](file:///home/samoilamihai23/Desktop/Things/Startups/BuildForge%20AI/BuildForge%20AI%20MVP/components/projects/ProjectsClientWrapper.tsx)
- Integrate bulk selection using `Checkbox`.
- Implement `viewMode` toggling between 'table' and 'grid'.
- Implement `sortOption` logic (Newest, Oldest, Name A-Z, Name Z-A).
- Create Grid view layout for projects.
- Add bulk actions bar for deleting multiple projects.

## Verification Plan

### Manual Verification
- **Projects Bulk Deletion**: Select multiple projects and verify they are deleted after confirmation.
- **View Modes**: Switch between Grid and Table views and ensure layout is correct in both.
- **Sorting**: Test all sorting options (Newest, Oldest, Name A-Z, Name Z-A) and verify the order is correct.
- **Bulk Action Bar**: Ensure the bar appears/disappears correctly based on selection.
