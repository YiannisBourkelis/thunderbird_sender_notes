// Background script for Mail Note addon

// Default quick note templates
const DEFAULT_TEMPLATES = [
  "Important client - always respond within 24 hours! 🔥",
  "VIP customer - handle with care ⭐",
  "Potential spam - verify before responding ⚠️",
  "Slow payer - request upfront payment 💰",
  "Old colleague / friend 👋",
  "Newsletter - low priority 📰"
];

// Initialize storage on first install
messenger.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    await messenger.storage.local.set({ 
      notes: {},
      templates: DEFAULT_TEMPLATES
    });
    console.log("Mail Note addon installed successfully");
  }
});

// Create context menu item for adding notes
messenger.menus.create({
  id: "add-sender-note",
  title: "Add Note to Sender",
  contexts: ["message_list"]
});

// Handle context menu clicks
messenger.menus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "add-sender-note") {
    const messageId = info.selectedMessages?.messages?.[0]?.id;
    if (messageId) {
      const message = await messenger.messages.get(messageId);
      const senderEmail = extractEmail(message.author);
      
      // Open popup to add/edit note
      await messenger.windows.create({
        type: "popup",
        url: `popup/add-note.html?email=${encodeURIComponent(senderEmail)}&author=${encodeURIComponent(message.author)}`,
        width: 500,
        height: 500
      });
    }
  }
});

// Listen for message display to show banner (wrapped in try-catch for compatibility)
async function setupMessageDisplayListener() {
  try {
    if (messenger.messageDisplay && messenger.messageDisplay.onMessagesDisplayed) {
      messenger.messageDisplay.onMessagesDisplayed.addListener(async (tab, messageList) => {
        // In MV3, onMessagesDisplayed returns a MessageList
        const messages = messageList.messages || [];
        if (messages.length === 0) return;
        
        const message = messages[0];
        const senderEmail = extractEmail(message.author);
        const matchingNote = await findMatchingNote(senderEmail);
        
        if (matchingNote) {
          // Use scripting.messageDisplay API for MV3
          try {
            await messenger.scripting.messageDisplay.registerScripts([{
              id: "note-banner-script",
              js: ["messageDisplay/note-banner.js"],
              css: ["messageDisplay/note-banner.css"]
            }]);
          } catch (e) {
            // Script might already be registered
            if (!e.message?.includes("already registered")) {
              console.log("Script registration:", e.message);
            }
          }
          
          // Send the note data to the content script
          try {
            await messenger.tabs.sendMessage(tab.id, {
              action: "showNoteBanner",
              note: matchingNote.note,
              pattern: matchingNote.pattern,
              matchType: matchingNote.matchType,
              senderEmail: senderEmail
            });
          } catch (e) {
            console.log("Could not send message to tab:", e.message);
          }
        } else {
          // Hide banner if no note exists
          try {
            await messenger.tabs.sendMessage(tab.id, {
              action: "hideNoteBanner"
            });
          } catch (e) {
            // Tab might not have the script yet
          }
        }
      });
      console.log("Mail Note: messageDisplay listener registered");
    } else {
      console.log("Mail Note: messageDisplay API not available");
    }
  } catch (e) {
    console.error("Mail Note: Error setting up messageDisplay listener:", e);
  }
}

// Initialize the listener
setupMessageDisplayListener();

// Handle messages from popups and content scripts
messenger.runtime.onMessage.addListener(async (message, sender) => {
  switch (message.action) {
    case "saveNote":
      return await saveNote(message.pattern || message.email, message.matchType || 'exact', message.note);
    
    case "getNote":
      return await getNote(message.email);
    
    case "findMatchingNote":
      return await findMatchingNote(message.email);
    
    case "deleteNote":
      return await deleteNote(message.noteId, message.email);
    
    case "getAllNotes":
      return await getAllNotes();
    
    case "getCurrentMessageSender":
      return await getCurrentMessageSender(sender.tab?.id);
    
    case "getTemplates":
      return await getTemplates();
    
    case "saveTemplates":
      return await saveTemplates(message.templates);
    
    case "addTemplate":
      return await addTemplate(message.template);
    
    case "deleteTemplate":
      return await deleteTemplate(message.index);
    
    case "validatePattern":
      return validatePattern(message.email, message.pattern, message.matchType);
    
    case "openAddNotePopup":
      await messenger.windows.create({
        type: "popup",
        url: `popup/add-note.html?email=${encodeURIComponent(message.email)}&author=${encodeURIComponent(message.author)}`,
        width: 500,
        height: 500
      });
      return { success: true };
    
    case "checkCurrentMessageNote":
      // Called by content script to check if current message sender has a note
      return await checkCurrentMessageNote(sender.tab?.id);
      
    default:
      return null;
  }
});

// Helper function to extract email from author string
function extractEmail(author) {
  const match = author.match(/<([^>]+)>/);
  if (match) {
    return match[1].toLowerCase();
  }
  return author.toLowerCase().trim();
}

// Generate unique ID for notes
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Validate if a pattern matches an email
function validatePattern(email, pattern, matchType) {
  const emailLower = email.toLowerCase();
  const patternLower = pattern.toLowerCase();
  
  switch (matchType) {
    case 'exact':
      return emailLower === patternLower;
    case 'startsWith':
      return emailLower.startsWith(patternLower);
    case 'endsWith':
      return emailLower.endsWith(patternLower);
    case 'contains':
      return emailLower.includes(patternLower);
    default:
      return false;
  }
}

// Find a matching note for an email
async function findMatchingNote(email) {
  const data = await messenger.storage.local.get("notes");
  const notes = data.notes || {};
  
  // Priority: exact > startsWith > endsWith > contains
  const priorities = ['exact', 'startsWith', 'endsWith', 'contains'];
  
  for (const matchType of priorities) {
    for (const [noteId, noteData] of Object.entries(notes)) {
      if (noteData.matchType === matchType && validatePattern(email, noteData.pattern, matchType)) {
        return { ...noteData, id: noteId };
      }
    }
  }
  
  return null;
}

// Save a note
async function saveNote(pattern, matchType, note) {
  const data = await messenger.storage.local.get("notes");
  const notes = data.notes || {};
  
  // Check if a note with this exact pattern and matchType already exists
  let existingId = null;
  for (const [id, noteData] of Object.entries(notes)) {
    if (noteData.pattern.toLowerCase() === pattern.toLowerCase() && noteData.matchType === matchType) {
      existingId = id;
      break;
    }
  }
  
  const now = new Date().toISOString();
  const noteId = existingId || generateId();
  
  notes[noteId] = {
    pattern: pattern.toLowerCase(),
    matchType: matchType,
    note: note,
    createdAt: notes[noteId]?.createdAt || now,
    updatedAt: now
  };
  
  await messenger.storage.local.set({ notes });
  return { success: true, noteId };
}

// Get a note for a specific email (finds matching note)
async function getNote(email) {
  return await findMatchingNote(email);
}

// Delete a note by ID or email
async function deleteNote(noteId, email) {
  const data = await messenger.storage.local.get("notes");
  const notes = data.notes || {};
  
  if (noteId && notes[noteId]) {
    delete notes[noteId];
  } else if (email) {
    // Find and delete by matching email
    const match = await findMatchingNote(email);
    if (match && match.id) {
      delete notes[match.id];
    }
  }
  
  await messenger.storage.local.set({ notes });
  return { success: true };
}

// Get all notes
async function getAllNotes() {
  const data = await messenger.storage.local.get("notes");
  return data.notes || {};
}

// Get the sender of the currently displayed message
async function getCurrentMessageSender(tabId) {
  try {
    console.log("getCurrentMessageSender called with tabId:", tabId);
    
    // Method 1: Try mailTabs.getSelectedMessages() - most reliable
    if (messenger.mailTabs) {
      try {
        const mailTabs = await messenger.mailTabs.query({});
        console.log("Found mail tabs:", mailTabs.length);
        
        for (const tab of mailTabs) {
          try {
            const messageList = await messenger.mailTabs.getSelectedMessages(tab.id);
            if (messageList && messageList.messages && messageList.messages.length > 0) {
              const message = messageList.messages[0];
              console.log("Found selected message in tab", tab.id, ":", message.author);
              return {
                email: extractEmail(message.author),
                author: message.author
              };
            }
          } catch (e) {
            // Continue to next tab
          }
        }
      } catch (e) {
        console.log("mailTabs.query failed:", e.message);
      }
    }
    
    // Method 2: Try messageDisplay API if available
    if (messenger.messageDisplay && typeof messenger.messageDisplay.getDisplayedMessage === 'function') {
      const tabs = await messenger.tabs.query({});
      for (const tab of tabs) {
        try {
          const message = await messenger.messageDisplay.getDisplayedMessage(tab.id);
          if (message) {
            console.log("Found displayed message in tab", tab.id, ":", message.author);
            return {
              email: extractEmail(message.author),
              author: message.author
            };
          }
        } catch (e) {
          // Continue
        }
      }
    }
    
    console.error("No message found in any tab");
  } catch (e) {
    console.error("Error getting current message sender:", e);
  }
  return null;
}

// Get note templates
async function getTemplates() {
  const data = await messenger.storage.local.get("templates");
  return data.templates || DEFAULT_TEMPLATES;
}

// Save all templates
async function saveTemplates(templates) {
  await messenger.storage.local.set({ templates });
  return { success: true };
}

// Add a new template
async function addTemplate(template) {
  const templates = await getTemplates();
  if (!templates.includes(template)) {
    templates.push(template);
    await messenger.storage.local.set({ templates });
  }
  return { success: true, templates };
}

// Delete a template by index
async function deleteTemplate(index) {
  const templates = await getTemplates();
  if (index >= 0 && index < templates.length) {
    templates.splice(index, 1);
    await messenger.storage.local.set({ templates });
  }
  return { success: true, templates };
}

// Check if the current message sender has a note (called by content script)
async function checkCurrentMessageNote(tabId) {
  try {
    console.log("checkCurrentMessageNote called for tabId:", tabId);
    
    // Get the sender of the currently displayed message
    const sender = await getCurrentMessageSender(tabId);
    
    if (!sender || !sender.email) {
      console.log("checkCurrentMessageNote: No sender found");
      return { hasNote: false };
    }
    
    console.log("checkCurrentMessageNote: Checking note for", sender.email);
    
    // Find matching note
    const matchingNote = await findMatchingNote(sender.email);
    
    if (matchingNote) {
      console.log("checkCurrentMessageNote: Found note:", matchingNote.note);
      return {
        hasNote: true,
        note: matchingNote.note,
        pattern: matchingNote.pattern,
        matchType: matchingNote.matchType,
        senderEmail: sender.email
      };
    }
    
    console.log("checkCurrentMessageNote: No matching note found");
    return { hasNote: false };
  } catch (e) {
    console.error("checkCurrentMessageNote error:", e);
    return { hasNote: false };
  }
}

console.log("Mail Note background script loaded");
