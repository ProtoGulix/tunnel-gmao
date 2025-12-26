/**
 * Tunnel GMAO - Requests API Routes
 * Copyright (C) 2024 ProtoGulix
 * Licensed under AGPL-3.0
 */

const express = require('express');
const router = express.Router();
const { query, run } = require('../db/connection');

// Get all requests
router.get('/', async (req, res) => {
  try {
    const requests = await query(`
      SELECT r.*, m.name as machine_name 
      FROM requests r
      LEFT JOIN machines m ON r.machine_id = m.id
      ORDER BY r.created_at DESC
    `);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single request
router.get('/:id', async (req, res) => {
  try {
    const requests = await query(`
      SELECT r.*, m.name as machine_name 
      FROM requests r
      LEFT JOIN machines m ON r.machine_id = m.id
      WHERE r.id = ?
    `, [req.params.id]);
    if (requests.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json(requests[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new request
router.post('/', async (req, res) => {
  try {
    const { machine_id, title, description, priority, requested_by } = req.body;
    const result = await run(
      `INSERT INTO requests (machine_id, title, description, priority, requested_by)
       VALUES (?, ?, ?, ?, ?)`,
      [machine_id, title, description, priority || 'normal', requested_by]
    );
    res.status(201).json({ id: result.id, message: 'Request created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a request
router.put('/:id', async (req, res) => {
  try {
    const { machine_id, title, description, priority, status } = req.body;
    await run(
      `UPDATE requests 
       SET machine_id = ?, title = ?, description = ?, priority = ?, 
           status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [machine_id, title, description, priority, status, req.params.id]
    );
    res.json({ message: 'Request updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a request
router.delete('/:id', async (req, res) => {
  try {
    const result = await run('DELETE FROM requests WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
