/**
 * Migration Definitions
 * All database migrations for the Sender Notes addon
 * 
 * Migration ID format: "XXX_description" where XXX is a 3-digit number
 * Migrations are run in order by ID.
 * 
 * Each migration must have:
 *   - id: Unique identifier
 *   - description: Human-readable description
 *   - up: Async function to apply the migration
 *   - down: (Optional) Async function to rollback the migration
 */

const MIGRATIONS = [
  // Migrations will be added here as the addon evolves
];

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MIGRATIONS;
}
