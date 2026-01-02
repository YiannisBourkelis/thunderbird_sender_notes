let currentSender = null;

// DOM elements
const noNoteDiv = document.getElementById('no-note');
const hasNoteDiv = document.getElementById('has-note');
const senderEmailSpan = document.getElementById('sender-email');
const noteContent = document.getElementById('note-content');
const addNoteBtn = document.getElementById('add-note-btn');
const editNoteBtn = document.getElementById('edit-note-btn');
const deleteNoteBtn = document.getElementById('delete-note-btn');
const statusMessage = document.getElementById('status-message');

// Helper function to extract email from author string
function extractEmail(author) {
  const match = author.match(/<([^>]+)>/);
  if (match) {
    return match[1].toLowerCase();
  }
  return author.toLowerCase().trim();
}

// Get current message sender using multiple methods
async function getCurrentSenderFromPopup() {
  console.log("Mail Note: Getting current sender...");
  console.log("Mail Note: Available APIs - mailTabs:", !!messenger.mailTabs, 
              "messageDisplay:", !!messenger.messageDisplay,
              "messages:", !!messenger.messages);
  
  try {
    // Method 1: Try mailTabs.getSelectedMessages() - works for mail tabs
    if (messenger.mailTabs) {
      try {
        // Get all mail tabs
        const mailTabs = await messenger.mailTabs.query({});
        console.log("Mail Note: Found mail tabs:", mailTabs.length);
        
        for (const tab of mailTabs) {
          try {
            const messageList = await messenger.mailTabs.getSelectedMessages(tab.id);
            console.log("Mail Note: Selected messages in tab", tab.id, ":", messageList);
            
            if (messageList && messageList.messages && messageList.messages.length > 0) {
              const message = messageList.messages[0];
              console.log("Mail Note: Found selected message:", message.author);
              return {
                email: extractEmail(message.author),
                author: message.author
              };
            }
          } catch (e) {
            console.log("Mail Note: Could not get messages from tab", tab.id, ":", e.message);
          }
        }
      } catch (e) {
        console.log("Mail Note: mailTabs.query failed:", e.message);
      }
    }
    
    // Method 2: Try getting the current window and finding displayed message
    if (messenger.windows) {
      try {
        const windows = await messenger.windows.getAll({ populate: true });
        console.log("Mail Note: Found windows:", windows.length);
        
        for (const win of windows) {
          if (win.type === 'normal' || win.type === 'messageDisplay') {
            console.log("Mail Note: Checking window", win.id, "type:", win.type);
            
            // Try to get tabs in this window
            if (win.tabs) {
              for (const tab of win.tabs) {
                console.log("Mail Note: Tab", tab.id, "type:", tab.type, "mailTab:", tab.mailTab);
                
                // Try mailTabs.getSelectedMessages on this tab
                if (messenger.mailTabs && tab.mailTab) {
                  try {
                    const messageList = await messenger.mailTabs.getSelectedMessages(tab.id);
                    if (messageList && messageList.messages && messageList.messages.length > 0) {
                      const message = messageList.messages[0];
                      console.log("Mail Note: Found message in window tab:", message.author);
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
            }
          }
        }
      } catch (e) {
        console.log("Mail Note: windows.getAll failed:", e.message);
      }
    }
    
    // Method 3: Fallback to background script
    console.log("Mail Note: Trying background script fallback...");
    const result = await messenger.runtime.sendMessage({
      action: 'getCurrentMessageSender'
    });
    if (result) {
      console.log("Mail Note: Got sender from background:", result);
      return result;
    }
    
  } catch (e) {
    console.error("Mail Note: Error getting sender:", e);
  }
  
  console.log("Mail Note: Could not find any message");
  return null;
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  console.log("Mail Note: view-note.js loaded");
  
  try {
    // Get current message sender
    currentSender = await getCurrentSenderFromPopup();
    
    console.log("Mail Note: currentSender =", currentSender);
    
    if (!currentSender || !currentSender.email) {
      showStatus('No message selected. Please select an email first.', 'error');
      return;
    }
    
    senderEmailSpan.textContent = currentSender.author || currentSender.email;
    
    // Load existing note
    const existingNote = await messenger.runtime.sendMessage({
      action: 'getNote',
      email: currentSender.email
    });
    
    console.log("Mail Note: existingNote =", existingNote);
    
    if (existingNote) {
      noteContent.textContent = existingNote.note;
      noNoteDiv.style.display = 'none';
      hasNoteDiv.style.display = 'block';
    } else {
      noNoteDiv.style.display = 'block';
      hasNoteDiv.style.display = 'none';
    }
  } catch (error) {
    console.error("Mail Note: Error initializing view-note:", error);
    showStatus('Error: ' + error.message, 'error');
  }
});

// Add note button
addNoteBtn.addEventListener('click', async () => {
  console.log("Mail Note: Add Note button clicked, currentSender =", currentSender);
  
  if (!currentSender || !currentSender.email) {
    showStatus('No sender information available.', 'error');
    return;
  }
  
  try {
    await openNoteEditor();
  } catch (error) {
    console.error("Mail Note: Error opening note editor:", error);
    showStatus('Error: ' + error.message, 'error');
  }
});

// Edit note button
editNoteBtn.addEventListener('click', async () => {
  console.log("Mail Note: Edit button clicked");
  
  if (!currentSender || !currentSender.email) {
    showStatus('No sender information available.', 'error');
    return;
  }
  
  try {
    await openNoteEditor();
  } catch (error) {
    console.error("Mail Note: Error opening note editor:", error);
    showStatus('Error: ' + error.message, 'error');
  }
});

// Delete note button
deleteNoteBtn.addEventListener('click', async () => {
  console.log("Mail Note: Delete button clicked");
  
  if (!currentSender || !currentSender.email) {
    showStatus('No sender information available.', 'error');
    return;
  }
  
  if (confirm('Are you sure you want to delete this note?')) {
    try {
      await messenger.runtime.sendMessage({
        action: 'deleteNote',
        email: currentSender.email
      });
      
      showStatus('Note deleted!', 'success');
      
      // Update UI
      noNoteDiv.style.display = 'block';
      hasNoteDiv.style.display = 'none';
    } catch (error) {
      console.error("Mail Note: Error deleting note:", error);
      showStatus('Error: ' + error.message, 'error');
    }
  }
});

// Open note editor - sends message to background to open popup window
async function openNoteEditor() {
  console.log("Mail Note: Opening note editor for", currentSender);
  
  // Send message to background script to open popup
  const result = await messenger.runtime.sendMessage({
    action: 'openAddNotePopup',
    email: currentSender.email,
    author: currentSender.author
  });
  
  console.log("Mail Note: openAddNotePopup result:", result);
  
  if (result && result.success) {
    // Close this popup
    window.close();
  }
}

// Show status message
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = 'status-message ' + type;
  statusMessage.style.display = 'block';
}
