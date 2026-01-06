/**
 * Storage Adapter Interface
 * All storage backends must implement these methods
 * 
 * @typedef {Object} Note
 * @property {number} [id] - Auto-increment ID (undefined for new notes)
 * @property {string} pattern
 * @property {string} matchType - 'exact' | 'startsWith' | 'endsWith' | 'contains'
 * @property {string} note
 * @property {string} originalEmail
 * @property {string} createdAt - ISO date string
 * @property {string} updatedAt - ISO date string
 */

class StorageAdapter {
  /**
   * Get all notes
   * @returns {Promise<Object<string, Note>>} Object with note IDs as keys
   */
  async getAllNotes() { 
    throw new Error('Not implemented'); 
  }
  
  /**
   * Get a single note by ID
   * @param {string} id 
   * @returns {Promise<Note|null>}
   */
  async getNoteById(id) { 
    throw new Error('Not implemented'); 
  }
  
  /**
   * Save a note (create or update)
   * @param {Note} note 
   * @returns {Promise<Note>}
   */
  async saveNote(note) { 
    throw new Error('Not implemented'); 
  }
  
  /**
   * Delete a note by ID
   * @param {string} id 
   * @returns {Promise<void>}
   */
  async deleteNote(id) { 
    throw new Error('Not implemented'); 
  }
  
  /**
   * Find all notes that match an email address
   * @param {string} email 
   * @returns {Promise<Note[]>} Array of matching notes, ordered by priority
   */
  async findNotesByEmail(email) { 
    throw new Error('Not implemented'); 
  }
  
  /**
   * Check if a duplicate pattern+matchType exists
   * @param {string} pattern 
   * @param {string} matchType 
   * @param {string|null} excludeId - Note ID to exclude from check
   * @returns {Promise<Note|null>} The duplicate note or null
   */
  async findDuplicate(pattern, matchType, excludeId) { 
    throw new Error('Not implemented'); 
  }
  
  // Templates
  
  /**
   * @typedef {Object} Template
   * @property {number} [id] - Auto-increment ID (undefined for new templates)
   * @property {string} text - Template content
   * @property {number} order - Sort order (lower = first)
   * @property {string} createdAt - ISO date string
   * @property {string} updatedAt - ISO date string
   */

  /**
   * Get all templates ordered by their order field
   * @returns {Promise<Template[]>}
   */
  async getTemplates() { 
    throw new Error('Not implemented'); 
  }
  
  /**
   * Get a single template by ID
   * @param {string} id 
   * @returns {Promise<Template|null>}
   */
  async getTemplateById(id) { 
    throw new Error('Not implemented'); 
  }
  
  /**
   * Add a new template
   * @param {string} text - Template content
   * @returns {Promise<Template>} The created template
   */
  async addTemplate(text) { 
    throw new Error('Not implemented'); 
  }
  
  /**
   * Update a single template's text
   * @param {string} id 
   * @param {string} text - New template content
   * @returns {Promise<Template>} The updated template
   */
  async updateTemplate(id, text) { 
    throw new Error('Not implemented'); 
  }
  
  /**
   * Delete a single template
   * @param {string} id 
   * @returns {Promise<void>}
   */
  async deleteTemplate(id) { 
    throw new Error('Not implemented'); 
  }
  
  /**
   * Move a template to a new position
   * @param {string} id - Template ID to move
   * @param {string|null} afterId - ID of template to place after, or null to move to first position
   * @returns {Promise<void>}
   */
  async moveTemplate(id, afterId) { 
    throw new Error('Not implemented'); 
  }
  
  // Settings
  
  /**
   * Get settings object
   * @returns {Promise<Object>}
   */
  async getSettings() { 
    throw new Error('Not implemented'); 
  }
  
  /**
   * Save settings object
   * @param {Object} settings 
   * @returns {Promise<void>}
   */
  async saveSettings(settings) { 
    throw new Error('Not implemented'); 
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageAdapter;
}
