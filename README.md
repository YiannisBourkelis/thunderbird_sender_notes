# Mail Note - Thunderbird Addon

A Thunderbird addon that allows you to attach notes to email senders. When viewing an email from a sender with a note, a banner displays the note at the top of the message pane.

## Features

- 📝 Add notes to email senders via right-click context menu
- 🔔 Automatic banner display when viewing emails from noted senders
- ✏️ Edit and delete notes easily
- 💾 Notes persist across sessions
- 🎨 Clean, non-intrusive UI

## Installation

### For Development/Testing

1. Open Thunderbird
2. Go to **Menu** → **Add-ons and Themes** (or press `Ctrl+Shift+A`)
3. Click the gear icon ⚙️ and select **Debug Add-ons**
4. Click **Load Temporary Add-on**
5. Navigate to this folder and select the `manifest.json` file

### For Production

1. Zip the contents of this folder (not the folder itself)
2. Rename the `.zip` to `.xpi`
3. In Thunderbird, go to **Add-ons and Themes**
4. Click the gear icon ⚙️ and select **Install Add-on From File**
5. Select the `.xpi` file

## Usage

### Adding a Note

1. Right-click on an email in your message list
2. Select **Add Note to Sender**
3. Enter your note in the popup window
4. Click **Save Note**

### Viewing/Editing Notes

- When viewing an email from a sender with a note, a yellow banner appears at the top of the message
- Click the note icon in the message toolbar to view, edit, or delete the note

### Deleting a Note

1. View an email from the sender
2. Click the note icon in the message toolbar
3. Click **Delete** and confirm

## Requirements

- Thunderbird 115 or later

## File Structure

```
thundirbird_mailnote/
├── manifest.json          # Extension manifest
├── background.js          # Background script (main logic)
├── messageDisplay/        # Content scripts for message display
│   ├── note-banner.js
│   └── note-banner.css
├── popup/                 # Popup windows
│   ├── add-note.html/js/css
│   └── view-note.html/js/css
├── icons/                 # Extension icons
│   ├── icon-48.png
│   └── icon-96.png
├── README.md
└── REQUIREMENTS.md
```

## License

MIT License
