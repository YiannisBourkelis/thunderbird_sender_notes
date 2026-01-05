# Build Instructions

## Creating the XPI Package

To create a distributable `.xpi` file for Thunderbird Add-ons, zip the extension files **excluding** development-only files.

### Files to EXCLUDE from the XPI

Always exclude these files/folders when building:

| File/Folder | Reason |
|-------------|--------|
| `.git/` | Git repository data |
| `.gitignore` | Git configuration |
| `ARCHITECTURE.md` | Development architecture documentation |
| `BUILD.md` | This build instructions file |
| `REQUIREMENTS.md` | Development requirements/specs |
| `todo.md` | Development notes |
| `preview.html` | Development preview file |
| `*.md` (except README.md) | Development documentation |
| `node_modules/` | If present, npm dependencies |
| `.vscode/` | VS Code settings |
| `*.log` | Log files |
| `.DS_Store` | macOS system files |
| `Thumbs.db` | Windows system files |

### Files to INCLUDE in the XPI

```
manifest.json
background.js
LICENSE
README.md
_locales/
icons/
manage/
messageDisplay/
popup/
shared/
storage/
welcome/
```

### Build Command (Linux/macOS)

```bash
cd /home/yiannis/projects/thunderbird_sender_notes

# Create XPI (excluding development files)
zip -r sender-notes.xpi \
  manifest.json \
  background.js \
  LICENSE \
  README.md \
  _locales \
  icons \
  manage \
  messageDisplay \
  popup \
  shared \
  storage \
  welcome \
  -x "*.DS_Store" -x "*.log"
```

### Alternative: Exclude-based Build

```bash
cd /home/yiannis/projects/thunderbird_sender_notes

zip -r sender-notes.xpi . \
  -x ".git/*" \
  -x ".gitignore" \
  -x "ARCHITECTURE.md" \
  -x "BUILD.md" \
  -x "REQUIREMENTS.md" \
  -x "todo.md" \
  -x "preview.html" \
  -x "*.log" \
  -x ".DS_Store" \
  -x "Thumbs.db" \
  -x ".vscode/*" \
  -x "node_modules/*"
```

### Verify XPI Contents

After building, verify the package contains only production files:

```bash
unzip -l sender-notes.xpi
```

---

## Version Bumping

Before each release, update the version in `manifest.json`:

```json
{
  "version": "1.0.0"
}
```

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR.MINOR.PATCH** (e.g., 1.0.0 → 1.0.1 for bug fixes, 1.1.0 for new features)

---

## Submitting to Thunderbird Add-ons

1. Go to [addons.thunderbird.net](https://addons.thunderbird.net)
2. Sign in with your account
3. Click "Submit a New Add-on"
4. Upload the `.xpi` file
5. Fill in the listing details
6. Submit for review
