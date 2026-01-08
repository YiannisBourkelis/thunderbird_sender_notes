# Feature: Tagged Note Indicator in Message List

## Goal
Add a visual indicator in the message list when an email’s sender matches a saved note by applying a custom Thunderbird tag (e.g., `sender-notes`). This uses Thunderbird’s native tag UI (color dot / tag column) for minimal UI overhead.

## Considerations
- **Rule changes (pattern/type edits)**: If a note’s match rule changes, previously tagged messages might no longer qualify. To keep tags accurate, run a lightweight retag on the current/visible slice after note edits. Avoid full-folder rescans.
- **Note deletion**: When a note is deleted, any tags applied because of it should be removed where practical. If multiple notes match the same sender, only remove the tag when no remaining matching notes exist. This requires re-evaluating affected messages against all remaining notes.
- **Multiple rules per sender**: If several notes match the same sender, the presence of any matching note should keep the tag. Removal logic must confirm that *all* matching rules are absent before clearing the tag.
- **Risk of breakage**: Deletion or rule changes can make tag maintenance complex and error-prone. If retagging isn’t reliable or affordable (no safe small-slice strategy), this idea might not be worth shipping.

## Rationale
- Leverages built-in tagging; no custom columns or DOM injection in the thread pane.
- Lightweight: work happens once per delivered message in the background script.
- Immediate feedback: new messages show the indicator without opening the message.

## High-Level Design
1. **Tag definition**: Ensure a tag exists on install/update with a stable key (e.g., `sender-notes`) and a visible color.
2. **Matcher cache**: Keep an in-memory matcher of note patterns, refreshed when notes change.
3. **New mail hook**: On `messages.onNewMailReceived`, for each new message:
   - Skip if sender is one of the user’s own addresses.
   - Match sender email against cached note patterns.
   - If matches exist, add the tag (dedupe existing tags).
   - If no matches but tag present (e.g., note removed), remove the tag (optional immediate cleanup).
4. **Optional sync on note changes**: On note add/edit/delete, do a small batch retag of recent/visible messages in the current folder (avoid full-folder scans).
5. **Moves/copies (optional)**: On `messages.onMoved`/`onCopied`, re-evaluate and re-apply/remove the tag for affected messages.

## Pseudocode Sketch (background.js)
```js
const TAG_KEY = 'sender-notes';
const TAG_LABEL = 'Sender Notes';
const TAG_COLOR = '#f1c232'; // visible yellow

async function ensureTagExists() {
  const tags = await messenger.tags.list();
  if (!tags.find(t => t.key === TAG_KEY)) {
    await messenger.tags.create({ key: TAG_KEY, tag: TAG_LABEL, color: TAG_COLOR });
  }
}

let matcher = null; // precompiled patterns from notes
async function refreshMatcher() {
  const repo = await getStorage();
  matcher = await repo.getMatcher(); // e.g., returns an object with findNotesByEmail()
}

async function handleNewMail(folder, messages) {
  if (!matcher) await refreshMatcher();
  const userEmails = await getUserEmailAddresses();

  for (const msg of messages.messages || []) {
    const senderEmail = extractEmail(msg.author);
    if (userEmails.has(senderEmail)) continue; // skip own mail

    const matches = matcher.findNotesByEmail(senderEmail);
    const hasTag = (msg.tags || []).includes(TAG_KEY);

    if (matches.length && !hasTag) {
      await messenger.messages.update(msg.id, { tags: [...new Set([...(msg.tags || []), TAG_KEY])] });
    } else if (!matches.length && hasTag) {
      await messenger.messages.update(msg.id, { tags: (msg.tags || []).filter(t => t !== TAG_KEY) });
    }
  }
}

messenger.runtime.onInstalled.addListener(async () => {
  await ensureTagExists();
  await refreshMatcher();
});

messenger.messages.onNewMailReceived.addListener(handleNewMail);

// On notes changed, refresh matcher and (optionally) retag a small visible batch
async function onNotesChanged() {
  await refreshMatcher();
  // Optionally retag current folder’s visible slice to reflect deletions/edits
}
```

## Performance Considerations
- **Scope**: Only new messages processed; no per-row DOM work in the thread pane.
- **Batching**: `onNewMailReceived` provides messages in batches; update tags per message.
- **Avoid full scans**: Do not iterate entire folders. If syncing after note changes, limit to a small slice (e.g., current view).
- **Caching**: Cache user emails and the note matcher to avoid repeated lookups.

## Edge Cases & Decisions
- **Own emails**: Do not tag messages sent by the user.
- **Note removal**: Choose whether to immediately remove tags (light batch) or let future arrivals overwrite; recommended: remove if easily reachable (small slice).
- **Moved/copied messages**: Optionally re-evaluate on move/copy events if folder workflows demand it.

## Testing Plan
- Install from clean profile → ensure tag auto-created.
- Receive new mail with a matching sender → tag appears in list.
- Receive new mail without matching sender → no tag.
- Edit/delete a note → (optional) retag current folder slice to remove tag where no longer applicable.
- Own account mail → no tag applied.
- Dark/light themes → relies on native tag UI.
