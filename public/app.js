/**
 * Tunnel GMAO - Frontend Application
 * Copyright (C) 2024 ProtoGulix
 * Licensed under AGPL-3.0
 */

// API Base URL
const API_URL = '/api';

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    loadDashboard();
});

// Tab switching
function setupTabs() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    
    // Load data for the tab
    switch(tabName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'machines':
            loadMachines();
            break;
        case 'requests':
            loadRequests();
            break;
        case 'interventions':
            loadInterventions();
            break;
        case 'purchases':
            loadPurchases();
            break;
    }
}

// Dashboard functions
async function loadDashboard() {
    try {
        // Load delayed interventions
        const delayed = await fetch(`${API_URL}/interventions/delayed`).then(r => r.json());
        document.getElementById('delayed-count').textContent = delayed.length;
        
        // Load pending requests
        const requests = await fetch(`${API_URL}/requests`).then(r => r.json());
        const pending = requests.filter(r => r.status === 'pending');
        document.getElementById('pending-requests').textContent = pending.length;
        
        // Load active machines
        const machines = await fetch(`${API_URL}/machines`).then(r => r.json());
        const active = machines.filter(m => m.status === 'active');
        document.getElementById('active-machines').textContent = active.length;
        
        // Load time stats
        const stats = await fetch(`${API_URL}/interventions/stats/by-type`).then(r => r.json());
        displayTimeStats(stats);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function displayTimeStats(stats) {
    const container = document.getElementById('time-stats');
    if (stats.length === 0) {
        container.innerHTML = '<p>Aucune donnée disponible</p>';
        return;
    }
    
    const html = stats.map(stat => `
        <div class="stat-item">
            <strong>${stat.intervention_type}:</strong> 
            ${Math.round(stat.total_minutes / 60)}h (${stat.count} interventions)
        </div>
    `).join('');
    container.innerHTML = html;
}

async function showDelayed() {
    const delayed = await fetch(`${API_URL}/interventions/delayed`).then(r => r.json());
    if (delayed.length === 0) {
        alert('Aucune intervention en retard');
        return;
    }
    
    const html = `
        <h2>Interventions en retard</h2>
        <div class="items-list">
            ${delayed.map(i => `
                <div class="item-card urgent">
                    <h3>${i.title}</h3>
                    <p><strong>Machine:</strong> ${i.machine_name || 'N/A'}</p>
                    <p><strong>Date prévue:</strong> ${formatDate(i.scheduled_date)}</p>
                    <p><strong>Statut:</strong> ${i.status}</p>
                </div>
            `).join('')}
        </div>
    `;
    showModal(html);
}

// Machines functions
async function loadMachines() {
    try {
        const machines = await fetch(`${API_URL}/machines`).then(r => r.json());
        const container = document.getElementById('machines-list');
        
        if (machines.length === 0) {
            container.innerHTML = '<p class="empty-message">Aucune machine enregistrée</p>';
            return;
        }
        
        container.innerHTML = machines.map(machine => `
            <div class="item-card">
                <h3>${machine.name}</h3>
                <p><strong>Référence:</strong> ${machine.reference || 'N/A'}</p>
                <p><strong>Emplacement:</strong> ${machine.location || 'N/A'}</p>
                <p><strong>Statut:</strong> <span class="badge status-${machine.status}">${machine.status}</span></p>
                ${machine.notes ? `<p><strong>Notes:</strong> ${machine.notes}</p>` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading machines:', error);
    }
}

function showMachineForm() {
    const html = `
        <h2>Ajouter une machine</h2>
        <form onsubmit="saveMachine(event)">
            <label>Nom: <input type="text" name="name" required></label>
            <label>Référence: <input type="text" name="reference"></label>
            <label>Emplacement: <input type="text" name="location"></label>
            <label>Date d'installation: <input type="date" name="installation_date"></label>
            <label>Notes: <textarea name="notes"></textarea></label>
            <button type="submit">Enregistrer</button>
        </form>
    `;
    showModal(html);
}

async function saveMachine(event) {
    event.preventDefault();
    const form = event.target;
    const data = {
        name: form.name.value,
        reference: form.reference.value,
        location: form.location.value,
        installation_date: form.installation_date.value,
        notes: form.notes.value
    };
    
    try {
        await fetch(`${API_URL}/machines`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        closeModal();
        loadMachines();
    } catch (error) {
        alert('Erreur lors de l\'enregistrement');
        console.error(error);
    }
}

// Requests functions
async function loadRequests() {
    try {
        const requests = await fetch(`${API_URL}/requests`).then(r => r.json());
        const container = document.getElementById('requests-list');
        
        if (requests.length === 0) {
            container.innerHTML = '<p class="empty-message">Aucune demande enregistrée</p>';
            return;
        }
        
        container.innerHTML = requests.map(request => `
            <div class="item-card">
                <h3>${request.title}</h3>
                <p><strong>Machine:</strong> ${request.machine_name || 'N/A'}</p>
                <p><strong>Priorité:</strong> <span class="badge priority-${request.priority}">${request.priority}</span></p>
                <p><strong>Statut:</strong> <span class="badge status-${request.status}">${request.status}</span></p>
                ${request.description ? `<p>${request.description}</p>` : ''}
                <p class="date-info">Créée le ${formatDate(request.created_at)}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading requests:', error);
    }
}

function showRequestForm() {
    fetch(`${API_URL}/machines`).then(r => r.json()).then(machines => {
        const html = `
            <h2>Nouvelle demande d'intervention</h2>
            <form onsubmit="saveRequest(event)">
                <label>Titre: <input type="text" name="title" required></label>
                <label>Machine:
                    <select name="machine_id">
                        <option value="">Sélectionner...</option>
                        ${machines.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
                    </select>
                </label>
                <label>Priorité:
                    <select name="priority">
                        <option value="low">Basse</option>
                        <option value="normal" selected>Normale</option>
                        <option value="high">Haute</option>
                        <option value="urgent">Urgente</option>
                    </select>
                </label>
                <label>Description: <textarea name="description"></textarea></label>
                <label>Demandeur: <input type="text" name="requested_by"></label>
                <button type="submit">Enregistrer</button>
            </form>
        `;
        showModal(html);
    });
}

async function saveRequest(event) {
    event.preventDefault();
    const form = event.target;
    const data = {
        title: form.title.value,
        machine_id: form.machine_id.value || null,
        priority: form.priority.value,
        description: form.description.value,
        requested_by: form.requested_by.value
    };
    
    try {
        await fetch(`${API_URL}/requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        closeModal();
        loadRequests();
    } catch (error) {
        alert('Erreur lors de l\'enregistrement');
        console.error(error);
    }
}

// Interventions functions
async function loadInterventions() {
    try {
        const interventions = await fetch(`${API_URL}/interventions`).then(r => r.json());
        const container = document.getElementById('interventions-list');
        
        if (interventions.length === 0) {
            container.innerHTML = '<p class="empty-message">Aucune intervention enregistrée</p>';
            return;
        }
        
        container.innerHTML = interventions.map(intervention => `
            <div class="item-card">
                <h3>${intervention.title}</h3>
                <p><strong>Machine:</strong> ${intervention.machine_name || 'N/A'}</p>
                <p><strong>Type:</strong> <span class="badge type-${intervention.intervention_type}">${intervention.intervention_type}</span></p>
                <p><strong>Statut:</strong> <span class="badge status-${intervention.status}">${intervention.status}</span></p>
                ${intervention.assigned_to ? `<p><strong>Assigné à:</strong> ${intervention.assigned_to}</p>` : ''}
                ${intervention.scheduled_date ? `<p><strong>Date prévue:</strong> ${formatDate(intervention.scheduled_date)}</p>` : ''}
                ${intervention.duration_minutes ? `<p><strong>Durée:</strong> ${Math.round(intervention.duration_minutes / 60)}h ${intervention.duration_minutes % 60}min</p>` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading interventions:', error);
    }
}

function showInterventionForm() {
    Promise.all([
        fetch(`${API_URL}/machines`).then(r => r.json()),
        fetch(`${API_URL}/requests`).then(r => r.json())
    ]).then(([machines, requests]) => {
        const html = `
            <h2>Nouvelle intervention</h2>
            <form onsubmit="saveIntervention(event)">
                <label>Titre: <input type="text" name="title" required></label>
                <label>Machine:
                    <select name="machine_id">
                        <option value="">Sélectionner...</option>
                        ${machines.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
                    </select>
                </label>
                <label>Type:
                    <select name="intervention_type">
                        <option value="corrective">Corrective</option>
                        <option value="preventive">Préventive</option>
                        <option value="improvement">Amélioration</option>
                    </select>
                </label>
                <label>Date prévue: <input type="datetime-local" name="scheduled_date"></label>
                <label>Assigné à: <input type="text" name="assigned_to"></label>
                <label>Description: <textarea name="description"></textarea></label>
                <button type="submit">Enregistrer</button>
            </form>
        `;
        showModal(html);
    });
}

async function saveIntervention(event) {
    event.preventDefault();
    const form = event.target;
    const data = {
        title: form.title.value,
        machine_id: form.machine_id.value || null,
        intervention_type: form.intervention_type.value,
        scheduled_date: form.scheduled_date.value,
        assigned_to: form.assigned_to.value,
        description: form.description.value
    };
    
    try {
        await fetch(`${API_URL}/interventions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        closeModal();
        loadInterventions();
    } catch (error) {
        alert('Erreur lors de l\'enregistrement');
        console.error(error);
    }
}

// Purchases functions
async function loadPurchases() {
    try {
        const purchases = await fetch(`${API_URL}/purchases`).then(r => r.json());
        const container = document.getElementById('purchases-list');
        
        if (purchases.length === 0) {
            container.innerHTML = '<p class="empty-message">Aucune demande d\'achat enregistrée</p>';
            return;
        }
        
        container.innerHTML = purchases.map(purchase => `
            <div class="item-card">
                <h3>${purchase.item_name}</h3>
                <p><strong>Quantité:</strong> ${purchase.quantity}</p>
                ${purchase.unit_price ? `<p><strong>Prix unitaire:</strong> ${purchase.unit_price}€</p>` : ''}
                ${purchase.total_price ? `<p><strong>Prix total:</strong> ${purchase.total_price}€</p>` : ''}
                ${purchase.supplier ? `<p><strong>Fournisseur:</strong> ${purchase.supplier}</p>` : ''}
                <p><strong>Statut:</strong> <span class="badge status-${purchase.status}">${purchase.status}</span></p>
                ${purchase.machine_name ? `<p><strong>Machine:</strong> ${purchase.machine_name}</p>` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading purchases:', error);
    }
}

function showPurchaseForm() {
    fetch(`${API_URL}/machines`).then(r => r.json()).then(machines => {
        const html = `
            <h2>Nouvelle demande d'achat</h2>
            <form onsubmit="savePurchase(event)">
                <label>Article: <input type="text" name="item_name" required></label>
                <label>Quantité: <input type="number" name="quantity" value="1" required></label>
                <label>Prix unitaire: <input type="number" step="0.01" name="unit_price"></label>
                <label>Fournisseur: <input type="text" name="supplier"></label>
                <label>Machine:
                    <select name="machine_id">
                        <option value="">Sélectionner...</option>
                        ${machines.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
                    </select>
                </label>
                <label>Description: <textarea name="description"></textarea></label>
                <button type="submit">Enregistrer</button>
            </form>
        `;
        showModal(html);
    });
}

async function savePurchase(event) {
    event.preventDefault();
    const form = event.target;
    const quantity = parseFloat(form.quantity.value);
    const unitPrice = parseFloat(form.unit_price.value) || 0;
    const data = {
        item_name: form.item_name.value,
        quantity: quantity,
        unit_price: unitPrice,
        total_price: quantity * unitPrice,
        supplier: form.supplier.value,
        machine_id: form.machine_id.value || null,
        description: form.description.value
    };
    
    try {
        await fetch(`${API_URL}/purchases`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        closeModal();
        loadPurchases();
    } catch (error) {
        alert('Erreur lors de l\'enregistrement');
        console.error(error);
    }
}

// Modal functions
function showModal(html) {
    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        closeModal();
    }
}
