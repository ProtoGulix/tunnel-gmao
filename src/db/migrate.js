/**
 * Tunnel GMAO - Database Migration Script
 * Copyright (C) 2024 ProtoGulix
 * Licensed under AGPL-3.0
 */

require('dotenv').config();
const { run, close } = require('./connection');

async function migrate() {
  console.log('🔄 Starting database migration...');

  try {
    // Create machines table
    await run(`
      CREATE TABLE IF NOT EXISTS machines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        reference TEXT,
        location TEXT,
        status TEXT DEFAULT 'active',
        installation_date DATE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Machines table created');

    // Create requests table (demandes d'intervention)
    await run(`
      CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        machine_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT DEFAULT 'normal',
        status TEXT DEFAULT 'pending',
        requested_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (machine_id) REFERENCES machines(id)
      )
    `);
    console.log('✅ Requests table created');

    // Create interventions table
    await run(`
      CREATE TABLE IF NOT EXISTS interventions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER,
        machine_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        intervention_type TEXT DEFAULT 'corrective',
        status TEXT DEFAULT 'planned',
        assigned_to TEXT,
        scheduled_date DATETIME,
        start_time DATETIME,
        end_time DATETIME,
        duration_minutes INTEGER,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (request_id) REFERENCES requests(id),
        FOREIGN KEY (machine_id) REFERENCES machines(id)
      )
    `);
    console.log('✅ Interventions table created');

    // Create purchases table
    await run(`
      CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        intervention_id INTEGER,
        machine_id INTEGER,
        item_name TEXT NOT NULL,
        description TEXT,
        quantity INTEGER DEFAULT 1,
        unit_price REAL,
        total_price REAL,
        supplier TEXT,
        status TEXT DEFAULT 'requested',
        ordered_date DATE,
        received_date DATE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (intervention_id) REFERENCES interventions(id),
        FOREIGN KEY (machine_id) REFERENCES machines(id)
      )
    `);
    console.log('✅ Purchases table created');

    // Create action_types table for time analysis
    await run(`
      CREATE TABLE IF NOT EXISTS action_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        color TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Action types table created');

    // Insert default action types
    await run(`
      INSERT OR IGNORE INTO action_types (name, description, color) VALUES
        ('diagnostic', 'Diagnostic et analyse', '#3B82F6'),
        ('reparation', 'Réparation', '#EF4444'),
        ('preventive', 'Maintenance préventive', '#10B981'),
        ('nettoyage', 'Nettoyage', '#F59E0B'),
        ('reglage', 'Réglage', '#8B5CF6'),
        ('attente', 'Attente de pièces/information', '#6B7280')
    `);
    console.log('✅ Default action types inserted');

    console.log('🎉 Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    throw error;
  } finally {
    close();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

module.exports = { migrate };
