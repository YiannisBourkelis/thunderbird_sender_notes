/**
 * Reusable Alert Component
 * 
 * URL Parameters:
 *   titleKey    - i18n key for title (e.g., "ownEmailWarningTitle")
 *   messageKey  - i18n key for message (e.g., "ownEmailWarningMessage")
 *   title       - Static title text (fallback if titleKey not found)
 *   message     - Static message text (fallback if messageKey not found)
 *   icon        - Icon type: "warning", "error", "info", "success" (optional)
 *   okKey       - i18n key for OK button (default: "buttonOk")
 * 
 * Usage from background.js:
 *   messenger.windows.create({
 *     type: "popup",
 *     url: "popup/alert.html?titleKey=myTitle&messageKey=myMessage&icon=warning",
 *     width: 340,
 *     height: 140
 *   });
 */

(function() {
  // Get the API (browser or messenger)
  const api = typeof browser !== 'undefined' ? browser : 
              (typeof messenger !== 'undefined' ? messenger : null);
  
  // Get i18n message with fallback
  function i18n(key, fallback = '') {
    if (!api || !api.i18n) return fallback;
    const msg = api.i18n.getMessage(key);
    return msg || fallback;
  }
  
  // Parse URL parameters
  function getParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      titleKey: params.get('titleKey'),
      messageKey: params.get('messageKey'),
      title: params.get('title'),
      message: params.get('message'),
      icon: params.get('icon'),
      okKey: params.get('okKey') || 'buttonOk'
    };
  }
  
  // Icon mapping
  const icons = {
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️',
    success: '✅'
  };
  
  // Initialize the alert
  function init() {
    const params = getParams();
    
    // Set icon if specified
    const iconEl = document.getElementById('alert-icon');
    if (params.icon && icons[params.icon]) {
      iconEl.textContent = icons[params.icon];
      iconEl.className = 'alert-icon ' + params.icon;
      iconEl.style.display = 'block';
    } else {
      iconEl.style.display = 'none';
    }
    
    // Set title
    const titleEl = document.getElementById('alert-title');
    if (params.titleKey) {
      titleEl.textContent = i18n(params.titleKey, params.title || 'Alert');
    } else if (params.title) {
      titleEl.textContent = params.title;
    }
    
    // Set message
    const messageEl = document.getElementById('alert-message');
    if (params.messageKey) {
      messageEl.textContent = i18n(params.messageKey, params.message || '');
    } else if (params.message) {
      messageEl.textContent = params.message;
    }
    
    // Set OK button text
    const okBtn = document.getElementById('alert-ok');
    okBtn.textContent = i18n(params.okKey, 'OK');
    
    // Event listeners
    okBtn.addEventListener('click', () => window.close());
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        window.close();
      }
    });
    
    // Focus the OK button
    okBtn.focus();
  }
  
  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
