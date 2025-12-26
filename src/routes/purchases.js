/**
 * Tunnel GMAO - Purchases API Routes
 * Copyright (C) 2024 ProtoGulix
 * Licensed under AGPL-3.0
 */

const express = require('express');
const router = express.Router();
const { query, run } = require('../db/connection');

// Get all purchases
router.get('/', async (req, res) => {
  try {
    const purchases = await query(`
      SELECT p.*, m.name as machine_name, i.title as intervention_title
      FROM purchases p
      LEFT JOIN machines m ON p.machine_id = m.id
      LEFT JOIN interventions i ON p.intervention_id = i.id
      ORDER BY p.created_at DESC
    `);
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single purchase
router.get('/:id', async (req, res) => {
  try {
    const purchases = await query(`
      SELECT p.*, m.name as machine_name, i.title as intervention_title
      FROM purchases p
      LEFT JOIN machines m ON p.machine_id = m.id
      LEFT JOIN interventions i ON p.intervention_id = i.id
      WHERE p.id = ?
    `, [req.params.id]);
    if (purchases.length === 0) {
      return res.status(404).json({ error: 'Purchase not found' });
    }
    res.json(purchases[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new purchase
router.post('/', async (req, res) => {
  try {
    const { 
      intervention_id, machine_id, item_name, description,
      quantity, unit_price, total_price, supplier, status 
    } = req.body;
    const result = await run(
      `INSERT INTO purchases 
       (intervention_id, machine_id, item_name, description, quantity,
        unit_price, total_price, supplier, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [intervention_id, machine_id, item_name, description, quantity || 1,
       unit_price, total_price, supplier, status || 'requested']
    );
    res.status(201).json({ id: result.id, message: 'Purchase created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a purchase
router.put('/:id', async (req, res) => {
  try {
    const { 
      item_name, description, quantity, unit_price, total_price,
      supplier, status, ordered_date, received_date, notes 
    } = req.body;
    await run(
      `UPDATE purchases 
       SET item_name = ?, description = ?, quantity = ?, unit_price = ?,
           total_price = ?, supplier = ?, status = ?, ordered_date = ?,
           received_date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [item_name, description, quantity, unit_price, total_price,
       supplier, status, ordered_date, received_date, notes, req.params.id]
    );
    res.json({ message: 'Purchase updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a purchase
router.delete('/:id', async (req, res) => {
  try {
    await run('DELETE FROM purchases WHERE id = ?', [req.params.id]);
    res.json({ message: 'Purchase deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
