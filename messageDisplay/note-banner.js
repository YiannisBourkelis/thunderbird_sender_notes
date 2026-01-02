// Content script for displaying note banner in message pane
// This script runs in the message display context

(function() {
  console.log("Mail Note: Content script loaded in message display");
  
  // Avoid duplicate initialization
  if (window.mailNoteInitialized) {
    console.log("Mail Note: Already initialized, skipping");
    return;
  }
  window.mailNoteInitialized = true;

  let bannerElement = null;

  // Create the banner element
  function createBanner() {
    if (bannerElement && document.body.contains(bannerElement)) {
      return bannerElement;
    }

    bannerElement = document.createElement('div');
    bannerElement.id = 'mail-note-banner';
    bannerElement.className = 'mail-note-banner';
    
    const noteIcon = document.createElement('span');
    noteIcon.className = 'mail-note-icon';
    noteIcon.textContent = '📝';
    
    const noteText = document.createElement('span');
    noteText.className = 'mail-note-text';
    noteText.id = 'mail-note-text';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'mail-note-close';
    closeBtn.textContent = '×';
    closeBtn.title = 'Dismiss';
    closeBtn.addEventListener('click', () => {
      hideBanner();
    });
    
    bannerElement.appendChild(noteIcon);
    bannerElement.appendChild(noteText);
    bannerElement.appendChild(closeBtn);
    
    return bannerElement;
  }

  // Show the banner with note content
  function showBanner(note, pattern, matchType) {
    console.log("Mail Note: Showing banner:", note);
    const banner = createBanner();
    const noteText = banner.querySelector('#mail-note-text');
    noteText.textContent = note;
    
    // Insert at the beginning of the body
    if (!document.body.contains(banner)) {
      document.body.insertBefore(banner, document.body.firstChild);
    }
    
    banner.style.display = 'flex';
  }

  // Hide the banner
  function hideBanner() {
    console.log("Mail Note: Hiding banner");
    if (bannerElement) {
      bannerElement.style.display = 'none';
    }
  }

  // Listen for messages from background script
  messenger.runtime.onMessage.addListener((message, sender) => {
    console.log("Mail Note: Content script received message:", message);
    
    if (message.action === 'showNoteBanner') {
      showBanner(message.note, message.pattern, message.matchType);
      return Promise.resolve({ success: true });
    } else if (message.action === 'hideNoteBanner') {
      hideBanner();
      return Promise.resolve({ success: true });
    }
    
    return false;
  });

  // On load, request the note for the current message
  async function checkForNote() {
    try {
      console.log("Mail Note: Checking for note on page load...");
      
      // Ask background script if there's a note for current message
      const result = await messenger.runtime.sendMessage({
        action: 'checkCurrentMessageNote'
      });
      
      console.log("Mail Note: checkCurrentMessageNote result:", result);
      
      if (result && result.hasNote) {
        showBanner(result.note, result.pattern, result.matchType);
      }
    } catch (e) {
      console.log("Mail Note: Error checking for note:", e);
    }
  }

  // Check for note when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkForNote);
  } else {
    // Small delay to ensure message info is available
    setTimeout(checkForNote, 100);
  }
})();
