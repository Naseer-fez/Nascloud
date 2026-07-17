# NasCloud — Frontend Design Structure & UI Specification

This document details the visual style, layouts, component architecture, and interaction design of **NasCloud**. It outlines how the application looks, responds, and functions from a user experience perspective, excluding API/endpoint details.

---

## 1. Visual Theme & Styling Guidelines

NasCloud uses a **premium, dark-themed, glassmorphic aesthetic** designed to look state-of-the-art.

### Color Palette
*   **Base Background**: Deep navy-slate (`#0a0f1d` to `#0d1326` gradient) for depth.
*   **Surfaces/Panels**: Semitransparent charcoal-gray (`rgba(22, 28, 45, 0.6)`) with a backdrop-blur (`12px`) and thin borders (`rgba(255, 255, 255, 0.08)`).
*   **Accent Gradients**: Vibrant cyan-to-purple (`linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)` and `linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)`).
*   **Text Hierarchy**:
    *   Primary: Crisp white (`#ffffff`, `opacity: 0.95`)
    *   Secondary: Muted gray-blue (`#94a3b8`, `opacity: 0.8`)
    *   Accent/Link: Electric cyan (`#38bdf8`)
*   **Semantic Colors**:
    *   Success: Emerald Green (`#34d399`)
    *   Error/Danger: Coral Red (`#f87171`)
    *   Warning: Amber Yellow (`#fbbf24`)

### Typography
*   **Headings**: *Outfit* (Google Fonts) – Geometric, clean, and distinct.
*   **Body & UI Text**: *Inter* (Google Fonts) – Neutral, highly readable at small sizes.
*   **Fallback Stack**: System fonts (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`) to ensure instant loading and offline usability.

---

## 2. Layout Architecture

The application uses a responsive **three-pane framework**:

```
+-----------------------------------------------------------+
|             |  Breadcrumbs / Search / Action Icons  [User]| <- Top Toolbar
|  NasCloud   |---------------------------------------------|
|             |                                             |
|  [+] Upload |                                             |
|  [+] New Fld|                                             |
|             |                                             |
|  Folder     |                                             |
|  Tree       |          Main Viewport                      |
|  Navigation |          (List or Grid of Files)            |
|             |                                             |
|             |                                             |
|  Trash      |                                             |
|  [Storage]  |                                 [Uploads]   | <- Queue Panel
+-------------+---------------------------------------------+
   Sidebar
```

### Collapsible Left Sidebar
*   **Branding Header**: Sleek "NasCloud" logo with a subtle neon glow.
*   **Action Buttons**: Prominent "Upload" and "New Folder" trigger buttons.
*   **Recursive Folder Tree**: Expandable/collapsible folder structure. Clicking a folder navigates deep into it.
*   **Secondary Links**: Shortcuts to "Trash" and "Settings".
*   **Compact Storage Progress Bar**: Small, colored bar at the bottom showing quota usage (e.g. `2.4 GB of 5 GB used`).
*   *Responsive Behavior*: Collapses into a thin icon strip on tablet screens and hides completely on mobile (revealed via swipe or hamburger menu).

### Top Toolbar
*   **Breadcrumb Navigation**: Interactive, clickable breadcrumbs showing the current path (e.g., `Home > Projects > Frontend`).
*   **Search Bar**: Medium-width input with a debounced search function and an integrated dropdown container for instant results.
*   **View Toggle**: Small icon-button to switch between **List View** (detailed rows) and **Grid View** (visual tiles).
*   **User Menu Dropdown**: Profile avatar displaying a dropdown menu for "Settings" and "Logout".

### Main Viewport
*   The primary workspace rendering the contents of the current folder.
*   Includes a drop-zone overlay that highlights visually when files/folders are dragged over the window.

---

## 3. UI Components

### File & Folder Lists

#### List View (Default)
*   Rendered as a clean table/list.
*   Columns: Name (with file/folder icon), Type, Size, Date Modified, and Action Trigger (⋮).
*   *Hover State*: Row highlights with a subtle light-gray tint, displaying inline action shortcuts (e.g. download, share) before the ⋮ menu.

#### Grid View
*   Rendered as an auto-fitting grid of square cards.
*   Folders show standard folder icons with a gradient tint; files display specific icons based on extension (images, documents, code, etc.) or mini-previews for images.
*   Card shows name and small size badge at the bottom.

### Action Context Menu
*   Appears when right-clicking anywhere on a file/folder row, or clicking the ⋮ button.
*   Contains options: **Open**, **Download**, **Rename**, **Move to...**, **Share Link**, **Move to Trash**.
*   *Visuals*: Glassmorphic background, subtle border, smooth hover transitions on options.

### Upload Queue Panel
*   Slides up from the bottom-right corner of the screen.
*   Non-blocking: Allows the user to browse folders and operate the app while uploads run.
*   Shows a list of files being uploaded, each with:
    *   File name
    *   Size
    *   Visual progress bar
    *   Percentage complete
    *   Cancel button (✖)

### Modals & Dialogs

*   **Move Modal**: Mini folder tree picker. Users click through their directory hierarchy to select a destination, confirming with a highlighted "Move Here" button.
*   **Rename Modal**: Clean input pre-filled with the current item name, auto-selecting the name text (excluding extension).
*   **Share Modal**: Generates and displays the public URL with a large, animated "Copy Link" button.
*   **Delete Confirmation**: Pop-up dialog with distinct warning alerts. "Move to Trash" is styled as an orange warning, while "Delete Permanently" uses a stark red caution badge with a checkbox confirmation.

### Toast Notification System
*   Appears in the bottom-left/bottom-right corner.
*   Displays messages like *"Moved 'document.pdf' to Trash"* or *"Link copied to clipboard!"*.
*   Color-coded: Teal for success, red for errors, blue for info.

---

## 4. Interaction States & Transitions

### Loading State (Skeletons)
*   Rather than using loading spinners, NasCloud uses **skeleton UI elements** (gray pulsing boxes that mimic the shape of lists, folders, and cards) to maintain layout consistency during data fetching.

### Empty States
*   **Empty Folder**: Soft vector illustration of an open box with text: *"This folder is empty. Drag files here or use the Upload button to get started."*
*   **Empty Trash**: Illustration of a clean trash bin with text: *"Your trash is empty. Items moved here will be stored until permanently deleted."*
*   **No Search Results**: Magnifying glass graphic with text: *"No files match your search. Check your spelling or try another keyword."*

### Micro-Animations
*   **Button Hover**: Scale up slightly (`transform: scale(1.02)`) with a soft glow effect.
*   **Sidebars & Panels**: Smooth ease-in-out slide transitions (`transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)`).
*   **Route Navigation**: Route transitions trigger a subtle fade-in effect to feel native.
*   **Checkbox / Toggle Select**: Smooth color transitions when toggled.
