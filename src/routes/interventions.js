/**
 * Tunnel GMAO - Interventions API Routes
 * Copyright (C) 2024 ProtoGulix
 * Licensed under AGPL-3.0
 */

const express = require('express');
const router = express.Router();
const { query, run } = require('../db/connection');

// Get all interventions
router.get('/', async (req, res) => {
  try {
    const interventions = await query(`
      SELECT i.*, m.name as machine_name, r.title as request_title
      FROM interventions i
      LEFT JOIN machines m ON i.machine_id = m.id
      LEFT JOIN requests r ON i.request_id = r.id
      ORDER BY i.scheduled_date DESC
    `);
    res.json(interventions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get delayed interventions
router.get('/delayed', async (req, res) => {
  try {
    const delayed = await query(`
      SELECT i.*, m.name as machine_name
      FROM interventions i
      LEFT JOIN machines m ON i.machine_id = m.id
      WHERE i.status IN ('planned', 'in_progress')
        AND i.scheduled_date < datetime('now')
      ORDER BY i.scheduled_date
    `);
    res.json(delayed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get time analysis by intervention type
router.get('/stats/by-type', async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        intervention_type,
        COUNT(*) as count,
        SUM(duration_minutes) as total_minutes,
        AVG(duration_minutes) as avg_minutes
      FROM interventions
      WHERE duration_minutes IS NOT NULL
      GROUP BY intervention_type
      ORDER BY total_minutes DESC
    `);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single intervention
router.get('/:id', async (req, res) => {
  try {
    const interventions = await query(`
      SELECT i.*, m.name as machine_name, r.title as request_title
      FROM interventions i
      LEFT JOIN machines m ON i.machine_id = m.id
      LEFT JOIN requests r ON i.request_id = r.id
      WHERE i.id = ?
    `, [req.params.id]);
    if (interventions.length === 0) {
      return res.status(404).json({ error: 'Intervention not found' });
    }
    res.json(interventions[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new intervention
router.post('/', async (req, res) => {
  try {
    const { 
      request_id, machine_id, title, description, intervention_type,
      status, assigned_to, scheduled_date, notes 
    } = req.body;
    const result = await run(
      `INSERT INTO interventions 
       (request_id, machine_id, title, description, intervention_type, 
        status, assigned_to, scheduled_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [request_id, machine_id, title, description, intervention_type || 'corrective',
       status || 'planned', assigned_to, scheduled_date, notes]
    );
    res.status(201).json({ id: result.id, message: 'Intervention created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update an intervention
router.put('/:id', async (req, res) => {
  try {
    const { 
      title, description, intervention_type, status, assigned_to,
      scheduled_date, start_time, end_time, duration_minutes, notes 
    } = req.body;
    await run(
      `UPDATE interventions 
       SET title = ?, description = ?, intervention_type = ?, status = ?,
           assigned_to = ?, scheduled_date = ?, start_time = ?, end_time = ?,
           duration_minutes = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [title, description, intervention_type, status, assigned_to,
       scheduled_date, start_time, end_time, duration_minutes, notes, req.params.id]
    );
    res.json({ message: 'Intervention updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an intervention
router.delete('/:id', async (req, res) => {
  try {
    const result = await run('DELETE FROM interventions WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Intervention not found' });
    }
    res.json({ message: 'Intervention deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
