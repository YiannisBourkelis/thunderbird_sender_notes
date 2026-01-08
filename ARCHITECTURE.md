# Sender Notes - Application Architecture

This document describes the complete architecture of the Sender Notes addon for Thunderbird. For storage-specific documentation, see [STORAGE_ARCHITECTURE.md](STORAGE_ARCHITECTURE.md).

---

## Table of Contents

1. [Overview](#overview)
2. [Lifecycle: From Installation to Usage](#lifecycle-from-installation-to-usage)
3. [File Structure](#file-structure)
4. [Manifest Configuration](#manifest-configuration)
5. [Background Script](#background-script)
6. [Message Display Integration](#message-display-integration)
7. [Popup Windows](#popup-windows)
8. [Settings Page](#settings-page)
9. [Internationalization (i18n)](#internationalization-i18n)
10. [Message Passing](#message-passing)
11. [Data Flow Diagrams](#data-flow-diagrams)

---

## Overview

Sender Notes is a Thunderbird WebExtension (Manifest V3) that allows users to attach persistent notes to email senders. When viewing an email, matching notes are displayed as yellow banners at the top of the message.

### Key Concepts

- **Notes**: User-created annotations linked to email patterns
- **Patterns**: Matching rules (exact email, starts with, ends with, contains)
- **Templates**: Pre-defined note snippets for quick insertion
- **Banners**: Visual UI elements injected into the message display

### Architecture Style

The addon follows a **message-passing architecture** where:
- The **background script** acts as the central hub (data access, business logic)
- **Content scripts** and **popup pages** communicate via `messenger.runtime.sendMessage()`
- **IndexedDB** provides persistent local storage via a Repository pattern

---

## Lifecycle: From Installation to Usage

### 1. Installation (`runtime.onInstalled`)

When the user installs the addon:

```
User installs addon
       ↓
background.js: runtime.onInstalled fires
       ↓
initializeStorage() creates IndexedDB database
       ↓
Opens welcome/welcome.html in a new tab
       ↓
User selects language and clicks "Get Started"
       ↓
Templates are saved in user's language
       ↓
Welcome tab closes, addon is ready
```

**Relevant files:**
- [background.js](background.js) - `runtime.onInstalled` listener (lines 68-82)
- [welcome/welcome.html](welcome/welcome.html) - Welcome page UI
- [welcome/welcome.js](welcome/welcome.js) - Language selection and template initialization

### 2. Viewing an Email (Note Banner Display)

When the user opens an email:

```
User clicks on an email
       ↓
Thunderbird loads message display
       ↓
messenger.scripting.messageDisplay injects:
  - messageDisplay/note-banner.js
  - messageDisplay/note-banner.css
       ↓
note-banner.js sends: { action: 'checkCurrentMessageNotes' }
       ↓
background.js extracts sender email from displayed message
       ↓
background.js queries IndexedDB for matching notes
       ↓
background.js sends: { action: 'showNoteBanners', notes: [...] }
       ↓
note-banner.js renders yellow banner(s) at top of message
```

**Relevant files:**
- [background.js](background.js) - `registerMessageDisplayScript()`, `checkCurrentMessageNotes()`
- [messageDisplay/note-banner.js](messageDisplay/note-banner.js) - Banner rendering
- [messageDisplay/note-banner.css](messageDisplay/note-banner.css) - Banner styling

### 3. Adding a Note (Context Menu)

When the user right-clicks an email and selects "Add Note to Sender":

```
User right-clicks email → "Add Note to Sender"
       ↓
background.js: menus.onClicked fires
       ↓
Extracts sender email from selected message
       ↓
Checks if sender is user's own email (blocks if true)
       ↓
Opens popup/add-note.html as popup window
       ↓
User enters note text and clicks Save
       ↓
add-note.js sends: { action: 'saveNote', ... }
       ↓
background.js saves to IndexedDB
       ↓
background.js broadcasts { action: 'notesChanged' } to all tabs
       ↓
background.js refreshes banners in all message displays
```

**Relevant files:**
- [background.js](background.js) - Context menu setup, `saveNote` handler
- [popup/add-note.html](popup/add-note.html) - Add/edit note UI
- [popup/add-note.js](popup/add-note.js) - Form handling and validation
- [popup/add-note.css](popup/add-note.css) - Popup styling

### 4. Viewing Notes for Current Sender (Toolbar Button)

When the user clicks the Sender Notes toolbar button:

```
User clicks Sender Notes button in message toolbar
       ↓
Thunderbird opens popup/view-note.html as popup
       ↓
view-note.js sends: { action: 'getCurrentMessageSender' }
       ↓
view-note.js sends: { action: 'findAllMatchingNotes', email: ... }
       ↓
Displays list of matching notes with Edit/Delete options
```

**Relevant files:**
- [popup/view-note.html](popup/view-note.html) - View notes popup UI
- [popup/view-note.js](popup/view-note.js) - Note listing and actions
- [popup/view-note.css](popup/view-note.css) - Popup styling

---

## File Structure

```
thunderbird_sender_notes/
├── manifest.json              # Extension configuration
├── background.js              # Main background script (central hub)
├── LICENSE                    # MIT License
├── README.md                  # User documentation
├── ARCHITECTURE.md            # This file
├── STORAGE_ARCHITECTURE.md    # Storage layer documentation
│
├── _locales/                  # Translations
│   ├── en/messages.json       # English (default)
│   └── el/messages.json       # Greek
│
├── icons/                     # Extension icons
│   ├── icon-48.png           # 48x48 icon
│   ├── icon-96.png           # 96x96 icon
│   └── logo.png              # Original logo
│
├── welcome/                   # First-run welcome page
│   ├── welcome.html          # Language selection UI
│   ├── welcome.js            # Setup logic
│   └── welcome.css           # Styles
│
├── popup/                     # Popup windows
│   ├── add-note.html         # Add/edit note form
│   ├── add-note.js           # Form logic, validation, templates
│   ├── add-note.css          # Form styles
│   ├── view-note.html        # View notes for current sender
│   ├── view-note.js          # Note listing, edit/delete
│   ├── view-note.css         # List styles
│   ├── alert.html            # Generic alert dialog
│   ├── alert.js              # Alert logic
│   ├── alert.css             # Alert styles
│   ├── own-email-warning.html # Warning for own email
│   └── own-email-warning.js   # Warning logic
│
├── manage/                    # Settings/options page
│   ├── manage-notes.html     # Full settings UI (notes, templates, settings)
│   ├── manage-notes.js       # CRUD operations, tab switching
│   └── manage-notes.css      # Settings page styles
│
├── messageDisplay/            # Injected into message view
│   ├── note-banner.js        # Banner rendering script
│   └── note-banner.css       # Banner styles (yellow theme)
│
├── shared/                    # Shared utilities
│   └── i18n.js               # Translation helper for content pages
│
└── storage/                   # Data access layer
    ├── StorageAdapter.js     # Abstract storage interface
    ├── IndexedDBAdapter.js   # IndexedDB implementation
    ├── NotesRepository.js    # Business logic for notes/templates
    ├── schema.js             # Database schema definitions
    ├── migrations.js         # Data migrations
    └── MigrationRunner.js    # Migration execution
```

---

## Manifest Configuration

The [manifest.json](manifest.json) defines:

### Permissions

| Permission | Purpose |
|------------|---------|
| `storage` | Access to `messenger.storage.local` for settings |
| `menus` | Create context menu entries |
| `messagesRead` | Read sender email from messages |
| `accountsRead` | Detect user's own email addresses |
| `scripting` | Inject banner script into message display |

### Background Scripts

```json
"background": {
  "scripts": [
    "storage/StorageAdapter.js",
    "storage/schema.js",
    "storage/IndexedDBAdapter.js",
    "storage/NotesRepository.js",
    "storage/MigrationRunner.js",
    "storage/migrations.js",
    "background.js"
  ]
}
```

Scripts are loaded in order. Storage layer classes are loaded before `background.js` so they're available when the main script runs.

### Message Display Action

```json
"message_display_action": {
  "default_title": "__MSG_viewNoteTitle__",
  "default_popup": "popup/view-note.html"
}
```

Adds a toolbar button when viewing a message. Clicking opens the view-note popup.

### Options UI

```json
"options_ui": {
  "page": "manage/manage-notes.html",
  "open_in_tab": true
}
```

The settings page opens in a full tab (not a popup).

---

## Background Script

[background.js](background.js) is the central hub of the extension. It runs persistently and handles:

### Initialization (lines 820-832)

```javascript
(async function initialize() {
  await initializeStorage();    // Create IndexedDB, run migrations
  await initBgI18n();           // Load user's language preference
  await setupContextMenus();    // Create context menus with translations
})();
```

### Storage Management (lines 7-40)

- `initializeStorage()` - Creates the IndexedDB database and runs migrations
- `getStorage()` - Returns the NotesRepository instance (lazy initialization)

### Context Menus (lines 153-169)

Creates two context menu items:
1. **"Add Note to Sender"** - In message list context
2. **"Manage Sender Notes"** - In tools menu

Menus are recreated when language settings change.

### Message Handlers (lines 297-468)

The `messenger.runtime.onMessage` listener handles all messages from popups and content scripts:

| Action | Purpose |
|--------|---------|
| `saveNote` | Create or update a note |
| `deleteNote` | Remove a note |
| `getAllNotes` | Get all notes (for settings page) |
| `getNoteById` | Get a specific note |
| `findAllMatchingNotes` | Find notes matching an email |
| `getTemplates` | Get all templates |
| `addTemplate` | Create a template |
| `updateTemplate` | Edit a template |
| `deleteTemplate` | Remove a template |
| `getCurrentMessageSender` | Get sender of displayed message |
| `checkCurrentMessageNotes` | Get notes for current message |
| `isOwnEmail` | Check if email belongs to user |
| `openAddNotePopup` | Open the add-note window |
| `openManageNotes` | Open settings page |
| `getSettings` / `saveSettings` | Settings operations |

### Banner Refresh (lines 470-560)

- `registerMessageDisplayScript()` - Registers the banner script with Thunderbird
- `refreshBannerForEmail()` - Updates banners in all tabs when a note changes
- `sendMessageToTabWithInjection()` - Sends message to tab, injecting script if needed

### User Email Detection (lines 565-635)

- `getUserEmailAddresses()` - Gets all user's configured email addresses (cached)
- `isSentByUser()` - Checks if a sender is the user themselves
- Notes are only shown for received emails, not sent emails

---

## Message Display Integration

The banner system works through Thunderbird's `scripting.messageDisplay` API.

### Registration

In [background.js](background.js) (lines 272-285):

```javascript
await messenger.scripting.messageDisplay.registerScripts([{
  id: "note-banner-script",
  js: ["messageDisplay/note-banner.js"],
  css: ["messageDisplay/note-banner.css"]
}]);
```

This tells Thunderbird to inject these files into every message display.

### note-banner.js

[messageDisplay/note-banner.js](messageDisplay/note-banner.js) is a content script that:

1. **On load**: Sends `checkCurrentMessageNotes` to background
2. **Receives notes**: Renders yellow banners for each note
3. **Click handling**: Sends `editNoteFromBanner` to open edit popup

Key functions:
- `createBannerContainer()` - Creates the container div
- `createBanner()` - Creates a single banner element
- `showBanners()` - Renders multiple banners
- `hideBanners()` - Removes all banners

### note-banner.css

[messageDisplay/note-banner.css](messageDisplay/note-banner.css) styles the banners:

- Yellow gradient background (similar to Thunderbird's junk warning)
- Hover effect for clickability
- Dark mode support via `@media (prefers-color-scheme: dark)`
- Max height of 10 lines with scroll

---

## Popup Windows

### add-note.html / add-note.js

The add/edit note form ([popup/add-note.html](popup/add-note.html), [popup/add-note.js](popup/add-note.js)):

**URL Parameters:**
- `email` - Sender's email address
- `author` - Full author string (e.g., "John Doe <john@example.com>")
- `noteId` - (Optional) ID of note to edit

**Features:**
- Pattern type selection (exact, starts with, ends with, contains)
- Pattern validation with preview
- Duplicate pattern detection
- Quick note templates (click to insert)
- Create/update/delete notes

**Template Tags:**
Templates are displayed as clickable tags. Clicking inserts the template text into the note field.

### view-note.html / view-note.js

The view notes popup ([popup/view-note.html](popup/view-note.html), [popup/view-note.js](popup/view-note.js)):

**Purpose:** Shows all notes matching the current email sender.

**Flow:**
1. Gets current message sender from background
2. Queries for all matching notes
3. Displays notes in a list with Edit/Delete buttons
4. "Add Note" button opens add-note popup

### alert.html / alert.js

A generic alert dialog ([popup/alert.html](popup/alert.html), [popup/alert.js](popup/alert.js)):

**URL Parameters:**
- `titleKey` - i18n key for title
- `messageKey` - i18n key for message
- `icon` - Icon type (warning, info, error)

Used for the "own email" warning when trying to add a note to yourself.

---

## Settings Page

[manage/manage-notes.html](manage/manage-notes.html) and [manage/manage-notes.js](manage/manage-notes.js) provide a full settings interface with three tabs:

### Notes Tab

- Lists all saved notes in a sortable table
- Columns: Pattern, Match Type, Note, Created, Updated
- Click column headers to sort
- Search/filter notes
- Edit/delete buttons per row

### Templates Tab

- Lists all quick note templates
- Drag-and-drop reordering
- Inline editing
- Add new templates
- Delete templates

### Settings Tab

- Language selection (Auto, English, Greek)
- Changing language reloads the page

### Real-time Updates

Listens for `notesChanged` broadcast messages to refresh the notes list when notes are modified elsewhere.

---

## Internationalization (i18n)

The addon supports multiple languages through two i18n systems:

### 1. Background Script i18n

In [background.js](background.js) (lines 89-150):

```javascript
function bgI18n(key, substitutions) { ... }
async function bgLoadMessages(lang) { ... }
async function initBgI18n() { ... }
```

Used for:
- Context menu labels
- Default template generation
- Any background script text

### 2. Content Page i18n

[shared/i18n.js](shared/i18n.js) provides translation for HTML pages:

```javascript
function i18n(key, substitutions) { ... }
async function translatePage() { ... }
```

**HTML Attributes:**
- `data-i18n="key"` - Translates element text content
- `data-i18n-placeholder="key"` - Translates placeholder attribute
- `data-i18n-title="key"` - Translates title attribute
- `data-i18n-sub="key1,key2"` - Substitution values from other i18n keys

### Language Files

Located in `_locales/{lang}/messages.json`:

```json
{
  "extensionName": {
    "message": "Sender Notes",
    "description": "Extension name"
  },
  "welcomeStep2": {
    "message": "Right-click any email and select \"$MENU_ITEM$\" to add a note",
    "placeholders": {
      "MENU_ITEM": {
        "content": "$1"
      }
    }
  }
}
```

### Language Flow

1. User selects language in welcome page or settings
2. Saved to `messenger.storage.local.settings.language`
3. Background script loads messages for that language
4. Context menus are recreated with new language
5. Content pages load messages on DOMContentLoaded

---

## Message Passing

All communication between components uses `messenger.runtime.sendMessage()`:

### From Content Script to Background

```javascript
// note-banner.js
const result = await messenger.runtime.sendMessage({
  action: 'checkCurrentMessageNotes'
});
```

### From Popup to Background

```javascript
// add-note.js
await messenger.runtime.sendMessage({
  action: 'saveNote',
  pattern: '@example.com',
  matchType: 'endsWith',
  note: 'Important domain'
});
```

### From Background to Content Script

```javascript
// background.js
await messenger.tabs.sendMessage(tabId, {
  action: 'showNoteBanners',
  notes: matchingNotes
});
```

### Broadcast to All Tabs

```javascript
// background.js
async function broadcastToTabs(message) {
  const tabs = await messenger.tabs.query({});
  for (const tab of tabs) {
    try {
      await messenger.tabs.sendMessage(tab.id, message);
    } catch (e) { /* Tab may not have listener */ }
  }
}

// Usage: notify all tabs that notes changed
broadcastToTabs({ action: 'notesChanged' });
```

---

## Data Flow Diagrams

### Adding a Note

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌───────────┐
│   User      │     │  Context     │     │ Background  │     │ IndexedDB │
│             │     │  Menu Click  │     │   Script    │     │           │
└─────┬───────┘     └──────┬───────┘     └──────┬──────┘     └─────┬─────┘
      │                    │                    │                  │
      │ Right-click email  │                    │                  │
      │───────────────────>│                    │                  │
      │                    │                    │                  │
      │                    │ menus.onClicked    │                  │
      │                    │───────────────────>│                  │
      │                    │                    │                  │
      │                    │     Open popup     │                  │
      │<───────────────────│<───────────────────│                  │
      │                    │                    │                  │
      │   Fill form        │                    │                  │
      │───────────────────>│                    │                  │
      │                    │                    │                  │
      │   Click Save       │  { action:         │                  │
      │───────────────────>│    'saveNote' }    │                  │
      │                    │───────────────────>│                  │
      │                    │                    │                  │
      │                    │                    │  repo.saveNote() │
      │                    │                    │─────────────────>│
      │                    │                    │                  │
      │                    │                    │    { id: 1 }     │
      │                    │                    │<─────────────────│
      │                    │                    │                  │
      │                    │ broadcastToTabs()  │                  │
      │                    │<───────────────────│                  │
      │                    │                    │                  │
```

### Displaying a Banner

```
┌──────────────┐     ┌────────────────┐     ┌─────────────┐     ┌───────────┐
│  Message     │     │  note-banner   │     │ Background  │     │ IndexedDB │
│  Display     │     │  (injected)    │     │   Script    │     │           │
└──────┬───────┘     └───────┬────────┘     └──────┬──────┘     └─────┬─────┘
       │                     │                     │                  │
       │  Email opened       │                     │                  │
       │────────────────────>│                     │                  │
       │                     │                     │                  │
       │                     │ checkCurrentMessage │                  │
       │                     │       Notes         │                  │
       │                     │────────────────────>│                  │
       │                     │                     │                  │
       │                     │                     │ getDisplayedMsg  │
       │                     │                     │─────────────────>│
       │                     │                     │                  │
       │                     │                     │ findNotesByEmail │
       │                     │                     │─────────────────>│
       │                     │                     │                  │
       │                     │                     │   [notes...]     │
       │                     │                     │<─────────────────│
       │                     │                     │                  │
       │                     │ { action:           │                  │
       │                     │   'showNoteBanners',│                  │
       │                     │   notes: [...] }    │                  │
       │                     │<────────────────────│                  │
       │                     │                     │                  │
       │   Yellow banner     │                     │                  │
       │<────────────────────│                     │                  │
       │                     │                     │                  │
```

---

## Related Documentation

- [STORAGE_ARCHITECTURE.md](STORAGE_ARCHITECTURE.md) - Detailed storage layer documentation
- [README.md](README.md) - User-facing documentation
- [BUILD.md](BUILD.md) - Build and development instructions
