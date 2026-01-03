// DOM elements
const searchInput = document.getElementById('search-input');
const notesCount = document.getElementById('notes-count');
const notesTableContainer = document.getElementById('notes-table-container');
const notesTbody = document.getElementById('notes-tbody');
const noNotesDiv = document.getElementById('no-notes');
const statusMessage = document.getElementById('status-message');

let allNotes = [];
let sortColumn = 'updatedAt';
let sortDirection = 'desc';

// Format date for display
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Get match type badge class
function getMatchTypeBadgeClass(matchType) {
  return `match-type-badge match-type-${matchType}`;
}

// Get match type display name
function getMatchTypeDisplay(matchType) {
  const names = {
    'exact': 'Exact',
    'startsWith': 'Starts With',
    'endsWith': 'Ends With',
    'contains': 'Contains'
  };
  return names[matchType] || matchType;
}

// Load all notes
async function loadNotes() {
  try {
    const notesData = await messenger.runtime.sendMessage({ action: 'getAllNotes' });
    
    // Convert object to array with IDs
    allNotes = Object.entries(notesData || {}).map(([id, note]) => ({
      id,
      ...note
    }));
    
    renderNotes();
  } catch (error) {
    console.error('Error loading notes:', error);
    showStatus('Error loading notes: ' + error.message, 'error');
  }
}

// Filter notes based on search
function filterNotes(notes) {
  const searchTerm = searchInput.value.toLowerCase().trim();
  if (!searchTerm) return notes;
  
  return notes.filter(note => 
    note.pattern.toLowerCase().includes(searchTerm) ||
    note.note.toLowerCase().includes(searchTerm) ||
    note.matchType.toLowerCase().includes(searchTerm)
  );
}

// Sort notes
function sortNotes(notes) {
  return [...notes].sort((a, b) => {
    let aVal = a[sortColumn];
    let bVal = b[sortColumn];
    
    // Handle dates
    if (sortColumn === 'createdAt' || sortColumn === 'updatedAt') {
      aVal = aVal ? new Date(aVal).getTime() : 0;
      bVal = bVal ? new Date(bVal).getTime() : 0;
    } else if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
}

// Render notes table
function renderNotes() {
  const filteredNotes = filterNotes(allNotes);
  const sortedNotes = sortNotes(filteredNotes);
  
  // Update count
  if (allNotes.length === 0) {
    notesCount.textContent = '';
  } else if (filteredNotes.length === allNotes.length) {
    notesCount.textContent = `${allNotes.length} note${allNotes.length !== 1 ? 's' : ''}`;
  } else {
    notesCount.textContent = `${filteredNotes.length} of ${allNotes.length} notes`;
  }
  
  // Show/hide table vs empty state
  if (allNotes.length === 0) {
    notesTableContainer.style.display = 'none';
    noNotesDiv.style.display = 'block';
    return;
  }
  
  notesTableContainer.style.display = 'block';
  noNotesDiv.style.display = 'none';
  
  // Update sort indicators
  document.querySelectorAll('.notes-table th.sortable').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.sort === sortColumn) {
      th.classList.add(sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  });
  
  // Render rows
  notesTbody.innerHTML = '';
  
  if (sortedNotes.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="6" style="text-align: center; color: #737373; padding: 20px;">No notes match your search.</td>';
    notesTbody.appendChild(row);
    return;
  }
  
  sortedNotes.forEach(note => {
    const row = document.createElement('tr');
    row.dataset.noteId = note.id;
    
    row.innerHTML = `
      <td><span class="note-pattern">${escapeHtml(note.pattern)}</span></td>
      <td><span class="${getMatchTypeBadgeClass(note.matchType)}">${getMatchTypeDisplay(note.matchType)}</span></td>
      <td><div class="note-preview" title="${escapeHtml(note.note)}">${escapeHtml(note.note)}</div></td>
      <td class="date-cell">${formatDate(note.createdAt)}</td>
      <td class="date-cell">${formatDate(note.updatedAt)}</td>
      <td class="action-buttons">
        <button class="btn-small primary edit-btn">Edit</button>
        <button class="btn-small danger delete-btn">Delete</button>
      </td>
    `;
    
    // Add event listeners
    row.querySelector('.edit-btn').addEventListener('click', () => editNote(note));
    row.querySelector('.delete-btn').addEventListener('click', () => deleteNote(note));
    
    notesTbody.appendChild(row);
  });
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Edit note
async function editNote(note) {
  try {
    const result = await messenger.runtime.sendMessage({
      action: 'openAddNotePopup',
      email: note.pattern,
      author: note.pattern,
      noteId: note.id
    });
    
    if (result && result.success) {
      // Reload notes after a short delay to allow edit window to save
      setTimeout(loadNotes, 500);
    }
  } catch (error) {
    console.error('Error opening edit popup:', error);
    showStatus('Error: ' + error.message, 'error');
  }
}

// Delete note
async function deleteNote(note) {
  if (!confirm(`Are you sure you want to delete the note for "${note.pattern}"?`)) {
    return;
  }
  
  try {
    await messenger.runtime.sendMessage({
      action: 'deleteNote',
      noteId: note.id
    });
    
    // Refresh banner in message display
    await messenger.runtime.sendMessage({
      action: 'refreshBanner',
      email: note.pattern
    });
    
    showStatus('Note deleted successfully!', 'success');
    
    // Reload notes
    await loadNotes();
    
    // Hide status after a moment
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 2000);
  } catch (error) {
    console.error('Error deleting note:', error);
    showStatus('Error: ' + error.message, 'error');
  }
}

// Show status message
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = 'status-message ' + type;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Load notes
  loadNotes();
  
  // Search handler
  searchInput.addEventListener('input', () => {
    renderNotes();
  });
  
  // Sort handlers
  document.querySelectorAll('.notes-table th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const column = th.dataset.sort;
      if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn = column;
        sortDirection = 'asc';
      }
      renderNotes();
    });
  });
});

// Listen for storage changes to refresh the list
messenger.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.notes) {
    loadNotes();
  }
});
