# Mozilla Add-on Submission Info

## Title
Sender Notes

## Short Description (250 characters max)

Add notes to email senders that appear as banners when you open their emails. Remember important context like "important client", "complaint history", or "slow payer". All data stays local—no external servers. (198 characters)

---

## Alternative Descriptions

**Option 2 (241 characters):**
Attach notes to email senders. When you open an email, your note appears as a banner—reminding you of important context. Match by exact email, domain, or pattern. Private and local—no external accounts required.

**Option 3 (248 characters):**
Never forget important context about your contacts. Add notes to email senders that display automatically as banners. Match by exact email, domain, or pattern. All notes stored locally in Thunderbird—no external servers.

---

## Files to Upload

- [ ] Extension XPI file: `sender-notes-1.0.0.xpi`
- [ ] Icon 48x48: `icons/icon-48.png`
- [ ] Icon 96x96: `icons/icon-96.png`
- [ ] Screenshots (add to this folder)

## Categories

- Message and News Reading
- Contacts

## Tags

notes, sender, contacts, email, context, productivity, reminder, banner, annotation, crm, workflow, organization

---

## Add-on Details (HTML Description)

```html
<strong>Sender Notes</strong> lets you attach notes to email senders. When you open an email, your note appears automatically as a banner at the top of the message—and it will appear on <em>every future email</em> from that sender.

<strong>Features:</strong>
<ul>
<li><b>Persistent notes</b> — Add a note once, see it on all emails from that sender</li>
<li><b>Flexible matching</b> — Match by exact email, domain pattern, or partial text</li>
<li><b>Quick templates</b> — Pre-defined notes for common situations</li>
<li><b>Visual banners</b> — Notes appear automatically when viewing emails</li>
<li><b>Multiple notes</b> — Apply several notes to the same sender</li>
<li><b>Dark mode support</b> — Adapts to your Thunderbird theme</li>
</ul>

<strong>Use cases:</strong>
<ul>
<li>Mark important clients who need fast responses</li>
<li>Flag contacts with complaint or payment history</li>
<li>Remember personal connections and preferences</li>
<li>Track spam senders or unsubscribe requests</li>
</ul>

<strong>Privacy:</strong>
All notes are stored locally in Thunderbird using IndexedDB. No data is ever sent to external servers. No accounts required.

<strong>How to use:</strong>
<ol>
<li>Right-click any email → "Add Note to Sender"</li>
<li>Choose a match type and enter your note</li>
<li>Your note will appear as a banner on all emails from that sender—past and future</li>
</ol>
```

---

## Notes to Reviewer

Quick testing guide:

1. Open any email in Thunderbird
2. Right-click → "Add Note to Sender"
3. Enter a note and save
4. The note appears as a yellow banner at the top of emails from that sender

Key points:

- No external network calls — all data stored locally in IndexedDB
- Uses `scripting` permission to inject the note banner into the message display panel
- Uses `messagesRead` to get sender email for pattern matching
- Uses `accountsRead` to detect user's own emails (notes only show on received mail)
- Manifest V3 compliant

Code structure:
- `background.js` — main extension logic
- `messageDisplay/note-banner.js` — injected banner script
- `storage/` — IndexedDB abstraction layer
- `popup/` — add/edit/view note dialogs

Thank you for reviewing!

---

## Files to Upload
