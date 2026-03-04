# Inquisia v2 - Comprehensive QA Testing Protocol

This document outlines the complete testing protocol to verify all features, roles, and workflows within the Inquisia platform before proceeding with advanced features like the plagiarism checker.

Testers should follow these steps using at least four different accounts representing the core roles: **Student**, **Supervisor**, **Admin**, and **Public** user.

---

## 1. Authentication & Account Management

### 1.1 Registration & Login
- [ ] **Register Student:** Create a new student account. Verify department selection is required and matriculation number is collected.
- [ ] **Register Supervisor:** Create a supervisor account. Verify department selection is optional and staff ID is collected.
- [ ] **Register Public:** Create a public user account.
- [ ] **Login/Logout:** Test logging in and out with all account types. Verify the session persists across page reloads and terminates immediately on logout.

### 1.2 Profiles
- [ ] **View Own Profile:** Navigate to the profile page from the navbar. Verify user details are correct.
- [ ] **Edit Profile:** Update display name, bio, links, degrees, and level. Save and verify changes persist.
- [ ] **View Other Profiles:** As a user, click on another user's avatar (e.g., in the comment section) to view their profile modal/page.

---

## 2. Project Lifecycle (Core Workflow)

### 2.1 Project Submission (Student)
- [ ] **Access:** Log in as a Student. Navigate to "Submit Project".
- [ ] **Validation:** Try submitting without a PDF, without a title, or with missing metadata. Verify form validation catches errors.
- [ ] **Upload:** Submit a valid PDF with all metadata (title, abstract, supervisor selection).
- [ ] **Dashboard State:** After submission, navigate to the Dashboard. Verify the project appears with a `pending` status.
- [ ] **Notification Check (Supervisor):** Log in as the selected Supervisor. Check the notification bell. Verify a "New Project Submitted" notification exists.

### 2.2 Project Review (Supervisor)
- [ ] **Access Queue:** Log in as the Supervisor. Navigate to the Supervisor Dashboard/Queue.
- [ ] **View Pending:** Verify the student's submitted project appears in the queue.
- [ ] **Review Actions:**
    - [ ] **Reject:** Reject the project with feedback. (Verify student receives "Project Rejected" notification).
    - [ ] **Request Changes:** Update status to "Changes Requested" with feedback. (Verify student receives "Changes Requested" notification).
    - [ ] **Approve:** Approve the project. (Verify student receives "Project Approved" notification).

### 2.3 Resubmission (Student)
- [ ] **Access:** As a Student, find a `rejected` or `changes_requested` project in the dashboard.
- [ ] **Resubmit:** Use the resubmit flow to upload a new version of the PDF and updated metadata.
- [ ] **Notification Check:** Verify the Supervisor receives a "Project Resubmitted" notification.

### 2.4 Change Requests (Student & Supervisor)
- [ ] **Submit CR:** As a student with an `approved` project, submit a Change Request (e.g., asking to fix a typo in the abstract).
- [ ] **Notify Supervisor:** Verify the Supervisor receives a "Change Request Submitted" notification.
- [ ] **Resolve CR:** Log in as the Supervisor, find the change request, and Approve or Deny it.
- [ ] **Notify Student:** Verify the Student receives a notification regarding the change request resolution.

---

## 3. Discovery & Viewing

### 3.1 Public Discovery
- [ ] **Access:** Navigate to `/projects` (Discover page) as an unauthenticated or public user.
- [ ] **Visibility:** Verify *only* `approved` projects are visible. Pending or rejected projects must not appear.
- [ ] **Search:** Test the search bar with known keywords from project titles or abstracts.
- [ ] **Filters:** Test filtering by Department, Year, and AI Category. 

### 3.2 Project Details
- [ ] **Access Details:** Click on an approved project to view its full details.
- [ ] **Metadata:** Verify title, authors, abstract, tags, category, and department are displayed correctly.
- [ ] **Report Access:** Click the URL to view/download the PDF report.

---

## 4. Discussion & Interaction (Comments)

### 4.1 Threading & Tiers
- [ ] **Post Comment:** Log in and post a top-level comment on an approved project.
- [ ] **Reply to Comment:** Reply to the top-level comment.
- [ ] **Reply to Reply:** Reply to the reply. Verify the thread remains "flat" (one level deep) and points back to the top-level parent.
- [ ] **Badges:** Verify that if the project author comments, they get an "Author" badge. If a supervisor comments, they get a "Supervisor" badge. Admins get "📌 Official".

### 4.2 Comment Management
- [ ] **Edit:** Edit your own comment. Verify the "(Edited)" tag appears.
- [ ] **Delete:** Delete your own comment. Verify it changes to "[comment deleted]" (soft delete) to preserve thread history.
- [ ] **Admin Delete:** Log in as an Admin. Verify the ability to delete any user's comment.

### 4.3 Comment Notifications
- [ ] **Reply Alert:** Verify that when User B replies to User A's comment, User A receives a notification in the bell. 
- [ ] **Self-Reply:** Reply to your *own* comment. Verify you do *not* receive a notification.

---

## 5. Elara (AI Integrations)

### 5.1 Repository Elara (`/elara`)
- [ ] **Auth Gate:** Try accessing `/elara` while logged out. Verify it redirects to `/login`.
- [ ] **Knowledge Base:** Log in and ask Elara "What projects do you have about [Topic]?" Verify Elara responds accurately based on the currently approved projects.
- [ ] **Session Rule:** Refresh the page. Verify the chat history disappears (session-only).

### 5.2 Contextual Elara (Floating Widget)
- [ ] **Visibility:** Verify the floating Elara widget appears on the Home, Discover, and Dashboard pages.
- [ ] **Suppression:** Verify the floating widget *does not* appear on `/elara` or `/projects/[id]` (preventing duplicate chats).
- [ ] **Interaction:** Ask the floating widget a general question about navigating the site.

### 5.3 Project AI Features
- [ ] **Generate Summary:** On a project detail page, use the AI Summary button. Verify it generates a concise summary.
- [ ] **Project Chat:** Use the contextual chat on the project page to ask a specific question about the project's abstract or contents.

---

## 6. Admin Capabilities

### 6.1 User Management
- [ ] **Access:** Log in as Admin and navigate to the Admin Panel.
- [ ] **Status Update:** Change a user's status from `active` to `warned`.
- [ ] **Notification:** Verify the affected user receives an "Account Status Updated" notification.
- [ ] **Restriction:** Change a user's status to `restricted`. Log in as that user and verify they cannot use AI features (Elara/Summaries).

### 6.2 Project Oversight
- [ ] Verify the Admin project view can see *all* projects regardless of status (pending, approved, rejected).

---

## 7. Global UI / UX Checks
- [ ] **Notification Bell:** Verify the unread badge updates instantly when notifications arrive. Test the "Mark all read" functionality and clicking individual notifications (auto-read and routing).
- [ ] **Mobile Responsiveness:** Resize the window or use a mobile device emulator to ensure the Navbar, Dashboard, Discover page, and Elara UI are readable and functional on small screens. 
- [ ] **Dark Mode (If applicable):** Check UI elements in dark mode for contrast issues.
