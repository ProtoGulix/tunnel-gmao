/**
 * Tunnel GMAO - Machines API Routes
 * Copyright (C) 2024 ProtoGulix
 * Licensed under AGPL-3.0
 */

const express = require('express');
const router = express.Router();
const { query, run } = require('../db/connection');

// Get all machines
router.get('/', async (req, res) => {
  try {
    const machines = await query('SELECT * FROM machines ORDER BY name');
    res.json(machines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single machine
router.get('/:id', async (req, res) => {
  try {
    const machines = await query('SELECT * FROM machines WHERE id = ?', [req.params.id]);
    if (machines.length === 0) {
      return res.status(404).json({ error: 'Machine not found' });
    }
    res.json(machines[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new machine
router.post('/', async (req, res) => {
  try {
    const { name, reference, location, status, installation_date, notes } = req.body;
    const result = await run(
      `INSERT INTO machines (name, reference, location, status, installation_date, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, reference, location, status || 'active', installation_date, notes]
    );
    res.status(201).json({ id: result.id, message: 'Machine created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a machine
router.put('/:id', async (req, res) => {
  try {
    const { name, reference, location, status, installation_date, notes } = req.body;
    await run(
      `UPDATE machines 
       SET name = ?, reference = ?, location = ?, status = ?, 
           installation_date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, reference, location, status, installation_date, notes, req.params.id]
    );
    res.json({ message: 'Machine updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a machine
router.delete('/:id', async (req, res) => {
  try {
    await run('DELETE FROM machines WHERE id = ?', [req.params.id]);
    res.json({ message: 'Machine deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
