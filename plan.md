# NasCloud — Cloud File Storage & Sharing Frontend

Build a premium, dark-themed cloud file storage and sharing SPA against the Flask backend documented in [endpoints.md](file:///d:/CODE/PYTHON/CODE/test/Frontend/endpoints.md).

## Decisions from Interview

| Decision | Choice |
|---|---|
| Framework | React with Vite |
| Routing | React Router v7 |
| State management | React Context + useReducer |
| Styling | Vanilla CSS with CSS Modules |
| Theme | Dark mode — deep navy/charcoal, cyan-to-purple gradients, glassmorphic panels, glow effects |
| Layout | Collapsible left sidebar (folder tree) + top toolbar (breadcrumbs, search, upload, user menu) |
| File display | List view default with grid view toggle |
| Upload UX | Drag-and-drop zone + persistent bottom-right upload queue panel with per-file progress |
| Item actions | Right-click context menu + ⋮ overflow button |
| Share flow | Modal → calls API → displays raw backend `LINK` with copy button |
| Share page | No frontend share route; build a separate "Download via Link" page where users paste a share link |
| Trash | Trash items appear in `structure/` response; restore via `changefilelocation/`; permanent delete via `trash/` |
| Login | Toggle/tab to switch between username and email modes |
| Forgot password | 3-step flow (email → OTP → new password), all wired up, note that backend step 2 may not work yet |
| Account settings | Single page: Profile section, Storage section, Danger Zone |
| Search | Instant debounced search (300ms) with dropdown results |
| Notifications | Toast notifications (bottom-right), action-specific copy |
| Move UX | Modal with mini folder tree picker |
| Create folder | "New Folder" button in toolbar |
| Storage display | Visual bar on settings + compact indicator in sidebar |
| Auth storage | localStorage (token + userid) |
| Backend URL | `http://localhost:5000` in `.env` as `VITE_API_BASE_URL` |
| App name | NasCloud (placeholder) |
| Typography | Inter (body) + Outfit (headings) from Google Fonts, system font fallback |
| Loading states | Skeleton/shimmer animations + subtle route fade transitions |

---

## Proposed Changes

### Phase 1 — Project Setup & Design System

#### [NEW] `package.json`, `vite.config.js`, etc.
- Initialize React + Vite project with React Router v7
- Configure `.env` with `VITE_API_BASE_URL=http://localhost:5000`

#### [NEW] `src/styles/variables.css`
- CSS custom properties: color palette (navy base, charcoal surfaces, cyan-purple gradient accents), spacing scale, border-radius, shadows, glassmorphism tokens, font stacks (Inter/Outfit with system fallbacks)

#### [NEW] `src/styles/global.css`
- Reset, base typography (Google Fonts import with system fallback), body background, scrollbar styling, selection colors

#### [NEW] `src/styles/animations.css`
- Keyframes for shimmer/skeleton loading, fade-in route transitions, toast slide-in, panel slide-up (upload queue), micro-hover effects

---

### Phase 2 — Core Infrastructure

#### [NEW] `src/config.js`
- Exports `API_BASE_URL` from `import.meta.env.VITE_API_BASE_URL`

#### [NEW] `src/api/client.js`
- Central `apiCall(path, { method, body, isPublic, isFormData })` function
- Attaches `auth` header (JWT, no Bearer prefix) for non-public calls
- Handles JSON parsing, error extraction, 401 detection (clears auth, redirects to login)
- Special handling for file downloads (returns blob)

#### [NEW] `src/api/endpoints.js`
- Named functions for every endpoint: `login()`, `createAccount()`, `forgotPassword()`, `forgotCode()`, `verifyCode()`, `getStructure()`, `getFolders()`, `uploadFile()`, `uploadFolder()`, `downloadFile()`, `shareFile()`, `deleteFile()`, `deleteFromTrash()`, `renameFile()`, `createFolder()`, `moveFile()`, `searchFile()`, `getUserStats()`, `updateAccount()`, `deleteAccount()`
- Each matches the exact path and method from `endpoints.md`

#### [NEW] `src/context/AuthContext.jsx`
- React Context + useReducer for auth state (`token`, `userid`, `isAuthenticated`)
- Reads from / writes to localStorage
- `login`, `logout`, `updateAuth` actions
- `useAuth()` hook

#### [NEW] `src/context/ToastContext.jsx`
- Toast notification system — `addToast(message, type)` where type is `success`, `error`, `info`
- Auto-dismiss success/info after 4s, errors persist until dismissed

#### [NEW] `src/components/common/ProtectedRoute.jsx`
- Wraps authenticated routes, redirects to `/login` if no token

---

### Phase 3 — Auth Pages

#### [NEW] `src/pages/Login/Login.jsx` + `Login.module.css`
- Toggle tabs: "Username" / "Email" mode
- Password field with show/hide toggle
- "Forgot password?" link → `/forgot`
- "Create account" link → `/signup`
- Premium glassmorphic card centered on gradient background
- Calls `POST login/`, stores `token` + `userid`, redirects to `/`

#### [NEW] `src/pages/Signup/Signup.jsx` + `Signup.module.css`
- Fields: username, password, email (optional)
- Same glassmorphic card style as login
- Calls `POST createaccount/`, stores `token` + `userid`, redirects to `/`

#### [NEW] `src/pages/ForgotPassword/ForgotPassword.jsx` + `ForgotPassword.module.css`
- 3-step flow within one component (step state):
  1. Enter email → `POST forgot/`
  2. Enter OTP → `POST forgot/code/` (email in body, OTP in header)
  3. Enter new password → `POST verify/code/` (token in header, email + password in body)
- Visual step indicator
- Note badge on steps 2-3: "Backend may not support this yet"

---

### Phase 4 — Main Layout & File Browser

#### [NEW] `src/layouts/AppLayout.jsx` + `AppLayout.module.css`
- Persistent layout for authenticated pages
- Collapsible left sidebar with folder tree + storage indicator
- Top toolbar: breadcrumbs, search bar, "New Folder" button, "Upload" button, user avatar/menu dropdown
- Route fade transitions on the main content area

#### [NEW] `src/components/Sidebar/Sidebar.jsx` + `Sidebar.module.css`
- Recursive folder tree component rendering from `structure/` data
- Clicking a folder navigates to that path
- Collapse/expand toggle
- Trash shortcut at the bottom
- Compact storage usage bar at the bottom

#### [NEW] `src/components/Toolbar/Toolbar.jsx` + `Toolbar.module.css`
- Breadcrumb navigation (clickable path segments)
- Search input with debounced API calls
- "New Folder" button
- "Upload" dropdown (Files / Folder)
- View toggle (list / grid)
- User avatar → dropdown (Settings, Logout)

#### [NEW] `src/pages/FileBrowser/FileBrowser.jsx` + `FileBrowser.module.css`
- Fetches `structure/{userid}` or `structure/{userid}/{folderId}` based on route
- Renders files/folders in list or grid view
- Drag-and-drop zone overlay (activates on drag-over)
- Empty state: illustration + "This folder is empty" + upload prompt
- Skeleton loading while fetching

#### [NEW] `src/components/FileList/FileList.jsx` + `FileList.module.css`
- List view: rows with icon, name, type, size, date, ⋮ button
- Grid view: cards with icon, name, type badge

#### [NEW] `src/components/ContextMenu/ContextMenu.jsx` + `ContextMenu.module.css`
- Appears on right-click or ⋮ click
- Actions: Open (folders), Download, Rename, Move to…, Share, Move to Trash
- Positioned relative to click point, stays within viewport

---

### Phase 5 — File Operations

#### [NEW] `src/components/UploadPanel/UploadPanel.jsx` + `UploadPanel.module.css`
- Slides up from bottom-right corner
- Shows per-file upload progress (progress bar, filename, status icon)
- Cancel button per upload, "Clear completed" button
- Minimizable/closable
- Uses `XMLHttpRequest` for progress events (fetch doesn't support upload progress)

#### [NEW] `src/components/RenameModal/RenameModal.jsx` + `RenameModal.module.css`
- Input pre-filled with current name
- Calls `PUT updatefile/{userid}/` with `filename` and `newname`

#### [NEW] `src/components/MoveModal/MoveModal.jsx` + `MoveModal.module.css`
- Mini folder tree picker (fetches `structure/`)
- User clicks destination folder, confirms
- Calls `PUT changefilelocation/{userid}/` with `oldpath` and `newpath`

#### [NEW] `src/components/ShareModal/ShareModal.jsx` + `ShareModal.module.css`
- Calls `POST share/{userid}` with `filename`
- Displays the returned `LINK` with a copy-to-clipboard button
- "Copied!" animation on click

#### [NEW] `src/components/DeleteConfirmModal/DeleteConfirmModal.jsx` + module CSS
- Confirmation dialog for "Move to Trash" and "Delete Permanently"
- Distinct messaging: "Move to Trash" vs "This will permanently delete [name]. This action cannot be undone."
- Calls `DELETE deletefile/{userid}/` with `filepath` and optional `trash: 1`

---

### Phase 6 — Trash, Search, Share Download

#### [NEW] `src/pages/Trash/Trash.jsx` + `Trash.module.css`
- Reads trash folder contents from the `structure/` response
- Lists trashed items with actions: Restore (via `changefilelocation/`), Delete Permanently (via `DELETE trash/{userid}/`)
- Empty trash state: distinct illustration + "Trash is empty" message
- "Empty Trash" button to permanently delete all items (with confirmation)

#### [NEW] `src/components/SearchDropdown/SearchDropdown.jsx` + `SearchDropdown.module.css`
- Debounced search (300ms) calling `GET searchfile/{userid}/{filename}/`
- Dropdown below search bar showing matching files
- Click result → navigate to file's parent folder
- "No results found" empty state

#### [NEW] `src/pages/ShareDownload/ShareDownload.jsx` + `ShareDownload.module.css`
- Input field to paste a share link
- Parse button extracts `userid`, `filesharing`, `time`, `token` from the URL
- Calls `GET share/{userid}/{filesharing}/{time}/{token}`
- On success: triggers file/zip download
- On failure: shows error message (expired, invalid, etc.)
- No auth required — public page

---

### Phase 7 — Account & Settings

#### [NEW] `src/pages/Settings/Settings.jsx` + `Settings.module.css`
- **Profile section**: Update username, email, password via `PUT updateacc/`
  - Requires current credentials (username + password + email)
  - On success: stores new token from response
- **Storage section**: Visual bar from `GET userstats/{userid}/`
  - Shows `usedspace` / `remainingspace`
  - Format based on actual unit from API response
- **Danger Zone**: Delete account via `DELETE deleteacc/`
  - Confirmation dialog requiring re-entered credentials
  - On success: clears auth, redirects to login

---

### Phase 8 — Polish & Responsive

#### All components
- Responsive breakpoints: mobile (< 768px), tablet (768-1024px), desktop (> 1024px)
- Sidebar auto-collapses on mobile
- Touch-friendly context menus on mobile (long-press or ⋮ only, no right-click)
- All empty states have illustrations and helpful messaging
- All error states surface specific API error messages
- Skeleton shimmer on every data-loading state

---

## Routing Structure

| Path | Component | Auth Required |
|---|---|---|
| `/login` | Login | No |
| `/signup` | Signup | No |
| `/forgot` | ForgotPassword | No |
| `/share-download` | ShareDownload | No |
| `/` | FileBrowser (root) | Yes |
| `/folder/:folderId` | FileBrowser | Yes |
| `/trash` | Trash | Yes |
| `/settings` | Settings | Yes |

All authenticated routes wrapped in `AppLayout` (sidebar + toolbar).

---

## Ambiguity Resolutions

| # | Ambiguity | Resolution |
|---|---|---|
| 1 | Auth transport | Custom HTTP header `auth: <JWT>` — confirmed by `endpoints.md` line 213-215: "send JWT token through the header file", key is `auth`, send directly |
| 2 | GET with JSON body (download) | Send `filename` as a query parameter `?filename=...` for the GET download endpoint |
| 3 | Trash listing / restore | Trash items come from `structure/` endpoint; restore via `changefilelocation/`; permanent delete via `trash/{userid}/` — confirmed by user |
| 4 | Share link destination | Link points at the Flask backend directly. Frontend just displays/copies the URL. Separate "Download via Link" page for pasting share links — confirmed by user |
| 5 | Response key names | Log raw responses on first call; build UI against actual keys |
| 6 | `userstats` unit | API returns `usedspace` and `remainingspace` — format dynamically (auto-detect bytes/KB/MB/GB based on magnitude) |
| 7 | Folder-upload structure | Use `<input webkitdirectory>` to get `webkitRelativePath` for each file, send as form data with the directory field indicating the base upload path |
| 8 | Username-or-email login | Toggle/tab UI to switch between username and email mode — confirmed by user |
| 9 | `deleteacc`/`updateacc` credentials | Both require the `auth` header AND re-entered credentials in the body — treated as intentional re-auth pattern |

---

> [!IMPORTANT]
> **All file/folder paths sent to the backend must be relative paths.**
> Example: if the file is at `sample/hello.txt`, send `sample/hello.txt` — not an absolute path, not just the filename. This applies to every endpoint that accepts a path: `download` (`filename`), `deletefile` (`filepath`), `trash` (`filepath`), `updatefile` (`filename`/`newname`), `changefilelocation` (`oldpath`/`newpath`), `share` (`filename`), `createfolder` (`filename`), and `uploadfile`/`uploadfolder` (`directory`).

---

## Verification Plan

### Automated
- `npm run build` — ensure zero build errors
- `npm run dev` — visual inspection of all pages/states

### Manual Verification
- Hit every endpoint against the running backend at `localhost:5000`
- Verify auth header format works on first protected call
- Test upload progress with real files
- Test share link generation and copy
- Test all CRUD operations (create folder, rename, move, delete, restore from trash)
- Test forgot password flow (expect steps 2-3 to potentially fail)
- Verify responsive layout at mobile/tablet/desktop widths
- Verify empty and error states render correctly
