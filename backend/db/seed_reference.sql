-- Données de référence de Tunnel (révision alembic 0002_donnees_reference).
-- Idempotent : ON CONFLICT DO NOTHING. Aucun référentiel propre à une usine.
-- Écart voulu avec le spike 0001 : intervention_status_ref.code = id (cf. migration 030 de l'ancienne chaîne).
--
-- PostgreSQL database dump
--


-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: action_category; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.action_category VALUES (21, 'Documentation / Schéma', 'DOC', '#FFC23B') ON CONFLICT DO NOTHING;
INSERT INTO public.action_category VALUES (22, 'Préventif / Vérification', 'PREV', '#2ECDA7') ON CONFLICT DO NOTHING;
INSERT INTO public.action_category VALUES (23, 'Support / Coordination', 'SUP', '#6644FF') ON CONFLICT DO NOTHING;
INSERT INTO public.action_category VALUES (24, 'Bâtiment / Travaux / Aménagement', 'BAT', '#A2B5CD') ON CONFLICT DO NOTHING;
INSERT INTO public.action_category VALUES (20, 'Fabrication / Modification', 'FAB', '#E35169') ON CONFLICT DO NOTHING;
INSERT INTO public.action_category VALUES (19, 'Dépannage', 'DEP', '#3399FF') ON CONFLICT DO NOTHING;


--
-- Data for Name: action_category_meta; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.action_category_meta VALUES ('BAT', true, true, 0.50, 2.00, '2026-01-07 12:55:15.320372+00', '2026-01-07 15:30:35.223191+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_category_meta VALUES ('SUP', true, true, 0.50, 3.00, '2026-01-07 12:55:15.320372+00', '2026-01-07 15:30:35.223191+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_category_meta VALUES ('DEP', false, false, 1.00, 6.00, '2026-01-07 12:55:15.320372+00', '2026-01-07 15:30:35.223191+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_category_meta VALUES ('PREV', false, false, 1.00, 4.00, '2026-01-07 12:55:15.320372+00', '2026-01-07 15:30:35.223191+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_category_meta VALUES ('FAB', false, false, 2.00, 8.00, '2026-01-07 12:55:15.320372+00', '2026-01-07 15:30:35.223191+00') ON CONFLICT DO NOTHING;


--
-- Data for Name: action_classification_probe; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.action_classification_probe VALUES (1, 'identif', 'keyword', 'SUP', 'warning', 'Action d''identification potentiellement administrative', true, '2026-01-07 12:55:15.324804+00', '2026-01-07 12:55:15.324804+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_classification_probe VALUES (2, 'tableur', 'keyword', 'SUP', 'warning', 'Travail sur tableur = tâche administrative', true, '2026-01-07 12:55:15.324804+00', '2026-01-07 12:55:15.324804+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_classification_probe VALUES (3, 'référence', 'keyword', 'SUP', 'warning', 'Recherche de référence = support', true, '2026-01-07 12:55:15.324804+00', '2026-01-07 12:55:15.324804+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_classification_probe VALUES (4, 'classement', 'keyword', 'SUP', 'warning', 'Classement = administratif', true, '2026-01-07 12:55:15.324804+00', '2026-01-07 12:55:15.324804+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_classification_probe VALUES (5, 'inventaire', 'keyword', 'SUP', 'warning', 'Inventaire = support/gestion', true, '2026-01-07 12:55:15.324804+00', '2026-01-07 12:55:15.324804+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_classification_probe VALUES (6, 'commande', 'keyword', 'SUP', 'warning', 'Commande = achat/administratif', true, '2026-01-07 12:55:15.324804+00', '2026-01-07 12:55:15.324804+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_classification_probe VALUES (7, 'rangement', 'keyword', 'BAT', 'warning', 'Rangement = bâtiment/nettoyage', true, '2026-01-07 12:55:15.324804+00', '2026-01-07 12:55:15.324804+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_classification_probe VALUES (8, 'tri', 'keyword', 'BAT', 'warning', 'Tri = bâtiment/organisation', true, '2026-01-07 12:55:15.324804+00', '2026-01-07 12:55:15.324804+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_classification_probe VALUES (9, 'nettoyage', 'keyword', 'BAT', 'info', 'Nettoyage = bâtiment', true, '2026-01-07 12:55:15.324804+00', '2026-01-07 12:55:15.324804+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_classification_probe VALUES (10, 'pneuma', 'keyword', 'DEP', 'warning', 'Pneumatique = dépannage probable', true, '2026-01-07 12:55:15.324804+00', '2026-01-07 12:55:15.324804+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_classification_probe VALUES (11, 'vis', 'keyword', 'DEP', 'info', 'Visserie = opération mécanique', true, '2026-01-07 12:55:15.324804+00', '2026-01-07 12:55:15.324804+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_classification_probe VALUES (12, 'fuite', 'keyword', 'DEP', 'warning', 'Fuite = dépannage urgent', true, '2026-01-07 12:55:15.324804+00', '2026-01-07 12:55:15.324804+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_classification_probe VALUES (13, 'panne', 'keyword', 'DEP', 'error', 'Panne = dépannage critique', true, '2026-01-07 12:55:15.324804+00', '2026-01-07 12:55:15.324804+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_classification_probe VALUES (14, 'identif', 'keyword', 'SUP', 'warning', 'Action d''identification potentiellement administrative', true, '2026-01-07 15:30:35.228638+00', '2026-01-07 15:30:35.228638+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_classification_probe VALUES (15, 'tableur', 'keyword', 'SUP', 'warning', 'Travail sur tableur = tâche administrative', true, '2026-01-07 15:30:35.228638+00', '2026-01-07 15:30:35.228638+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_classification_probe VALUES (16, 'référence', 'keyword', 'SUP', 'warning', 'Recherche de référence = support', true, '2026-01-07 15:30:35.228638+00', '2026-01-07 15:30:35.228638+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_classification_probe VALUES (17, 'classement', 'keyword', 'SUP', 'warning', 'Classement = administratif', true, '2026-01-07 15:30:35.228638+00', '2026-01-07 15:30:35.228638+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_classification_probe VALUES (18, 'inventaire', 'keyword', 'SUP', 'warning', 'Inventaire = support/gestion', true, '2026-01-07 15:30:35.228638+00', '2026-01-07 15:30:35.228638+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_classification_probe VALUES (19, 'commande', 'keyword', 'SUP', 'warning', 'Commande = achat/administratif', true, '2026-01-07 15:30:35.228638+00', '2026-01-07 15:30:35.228638+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_classification_probe VALUES (20, 'rangement', 'keyword', 'BAT', 'warning', 'Rangement = bâtiment/nettoyage', true, '2026-01-07 15:30:35.228638+00', '2026-01-07 15:30:35.228638+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_classification_probe VALUES (21, 'tri', 'keyword', 'BAT', 'warning', 'Tri = bâtiment/organisation', true, '2026-01-07 15:30:35.228638+00', '2026-01-07 15:30:35.228638+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_classification_probe VALUES (22, 'nettoyage', 'keyword', 'BAT', 'info', 'Nettoyage = bâtiment', true, '2026-01-07 15:30:35.228638+00', '2026-01-07 15:30:35.228638+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_classification_probe VALUES (23, 'pneuma', 'keyword', 'DEP', 'warning', 'Pneumatique = dépannage probable', true, '2026-01-07 15:30:35.228638+00', '2026-01-07 15:30:35.228638+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_classification_probe VALUES (24, 'vis', 'keyword', 'DEP', 'info', 'Visserie = opération mécanique', true, '2026-01-07 15:30:35.228638+00', '2026-01-07 15:30:35.228638+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_classification_probe VALUES (25, 'fuite', 'keyword', 'DEP', 'warning', 'Fuite = dépannage urgent', true, '2026-01-07 15:30:35.228638+00', '2026-01-07 15:30:35.228638+00') ON CONFLICT DO NOTHING;
INSERT INTO public.action_classification_probe VALUES (26, 'panne', 'keyword', 'DEP', 'error', 'Panne = dépannage critique', true, '2026-01-07 15:30:35.228638+00', '2026-01-07 15:30:35.228638+00') ON CONFLICT DO NOTHING;


--
-- Data for Name: action_subcategory; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.action_subcategory VALUES (29, 19, 'Dépannage électrique', 'DEP_ELC') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (30, 19, 'Dépannage mécanique', 'DEP_MEC') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (31, 19, 'Dépannage automatisme', 'DEP_AUT') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (32, 19, 'Dépannage fluides / air / eau', 'DEP_FLD') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (33, 19, 'Dépannage bâtiment / infrastructure', 'DEP_BAT') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (34, 20, 'Usinage / fabrication de pièces', 'FAB_USI') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (35, 20, 'Modification machine / retrofit', 'FAB_MOD') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (36, 20, 'Câblage / montage armoire', 'FAB_CAB') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (37, 20, 'Assemblage / montage mécanique', 'FAB_ASS') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (38, 21, 'Création / mise à jour de schéma', 'DOC_SCH') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (39, 21, 'Mise à jour nomenclature', 'DOC_NOM') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (40, 21, 'Procédure / rapport / consigne', 'DOC_PRO') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (41, 21, 'Classement / archivage documents', 'DOC_GES') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (42, 22, 'Préventif mécanique', 'PREV_MEC') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (43, 22, 'Préventif électrique', 'PREV_ELC') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (44, 22, 'Contrôle automate / sécurité', 'PREV_AUT') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (45, 22, 'Contrôle air / fluides', 'PREV_FLD') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (46, 22, 'Vérification périodique / inspection', 'PREV_VER') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (47, 23, 'Aide / support à un collègue', 'SUP_EQP') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (48, 23, 'Gestion / suivi d''intervention', 'SUP_GES') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (49, 23, 'Recherche de référence / achat', 'SUP_ACH') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (50, 23, 'Suivi prestataire / fournisseur', 'SUP_EXT') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (51, 23, 'Réunion / coordination / reporting', 'SUP_REU') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (52, 24, 'Déménagement / réaménagement', 'BAT_DEM') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (53, 24, 'Nettoyage / rangement', 'BAT_NET') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (54, 24, 'Travaux bâtiment / peinture / sol', 'BAT_TRA') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (55, 24, 'Installation matériel hors machine', 'BAT_INS') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (56, 24, 'Aide aux autres services / logistique', 'BAT_AID') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (57, 20, 'Création de programme / Support informatique', 'FAB_INF') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (59, 23, 'Catégorisation / Inventaire', 'SUP_INV') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (60, 20, 'Mise en service / Essais', 'FAB_MES') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (61, 20, 'Fabrication reseau fluide / air / eau', 'FAB_FLD') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (62, 22, 'Remplacement outil coupant', 'PREV_COUP') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (63, 20, 'Etude du projet, recherche', 'FAB_ETU') ON CONFLICT DO NOTHING;
INSERT INTO public.action_subcategory VALUES (64, 23, 'Réglage machine', 'SUP_REG') ON CONFLICT DO NOTHING;


--
-- Data for Name: amelioration_category_ref; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.amelioration_category_ref VALUES ('securite', 'Sécurité', '#EF4444', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.amelioration_category_ref VALUES ('productivite', 'Productivité / performance', '#3B82F6', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.amelioration_category_ref VALUES ('ergonomie', 'Ergonomie / qualité de vie au travail', '#10B981', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.amelioration_category_ref VALUES ('qualite', 'Qualité / fiabilité', '#F59E0B', 4) ON CONFLICT DO NOTHING;


--
-- Data for Name: amelioration_sous_statut_ref; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.amelioration_sous_statut_ref VALUES ('a_confirmer', 'À confirmer', '#F59E0B', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.amelioration_sous_statut_ref VALUES ('a_planifier', 'À planifier', '#8B5CF6', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.amelioration_sous_statut_ref VALUES ('en_cours', 'En cours', '#3B82F6', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.amelioration_sous_statut_ref VALUES ('realise', 'Réalisé', '#10B981', 4) ON CONFLICT DO NOTHING;


--
-- Data for Name: anomaly_threshold; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.anomaly_threshold VALUES (1, 'repetitive', 3, 'count', 6, '{"monthlyCount": 3, "highSeverityCount": 6}', 'Actions répétitives sur même machine par mois (A)', true, '2026-01-07 15:30:35.231507+00') ON CONFLICT DO NOTHING;
INSERT INTO public.anomaly_threshold VALUES (2, 'fragmented', 1, 'hours', 5, '{"maxDuration": 1, "minOccurrences": 5, "highSeverityCount": 10}', 'Actions fragmentées : courtes (<1h) et fréquentes (>5 occurrences) (B)', true, '2026-01-07 15:30:35.231507+00') ON CONFLICT DO NOTHING;
INSERT INTO public.anomaly_threshold VALUES (3, 'too_long', 4, 'hours', 8, '{"maxDuration": 4, "highSeverityDuration": 8}', 'Actions trop longues pour catégorie simple (>4h, sévère >8h) (C)', true, '2026-01-07 15:30:35.231507+00') ON CONFLICT DO NOTHING;
INSERT INTO public.anomaly_threshold VALUES (4, 'bad_classification', 1, 'keywords', 2, '{"minKeywords": 1, "highSeverityKeywords": 2}', 'Mauvaise classification détectée par mots-clés suspects (D)', true, '2026-01-07 15:30:35.231507+00') ON CONFLICT DO NOTHING;
INSERT INTO public.anomaly_threshold VALUES (5, 'back_to_back', 1, 'days', 0.5, '{"maxDaysDiff": 1, "highSeverityDays": 0.5}', 'Retours back-to-back : réintervention rapide (<1 jour, sévère <0.5 jour) (E)', true, '2026-01-07 15:30:35.231507+00') ON CONFLICT DO NOTHING;
INSERT INTO public.anomaly_threshold VALUES (6, 'low_value_high_load', 30, 'hours', 60, '{"minTotalHours": 30, "highSeverityHours": 60}', 'Faible valeur ajoutée + charge élevée (>30h cumulées, sévère >60h) (F)', true, '2026-01-07 15:30:35.231507+00') ON CONFLICT DO NOTHING;


--
-- Data for Name: audit_reason_code; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.audit_reason_code VALUES (1, 'PURCHASE_RECEIVED', 'Demande d''achat reçue', 'system', '{intervention}', NULL, '#10b981', 'Auto : toutes DA reçues', true, '2026-05-18 09:20:59.449181+00', '2026-05-18 09:20:59.449181+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_reason_code VALUES (2, 'HEALTH_THRESHOLD', 'Seuil santé atteint', 'system', '{intervention}', NULL, '#f59e0b', 'Auto : santé > seuil', true, '2026-05-18 09:20:59.449181+00', '2026-05-18 09:20:59.449181+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_reason_code VALUES (3, 'EQUIPMENT_FAILURE', 'Panne équipement', 'manual', '{intervention}', NULL, '#ef4444', 'Client signale panne', true, '2026-05-18 09:20:59.449181+00', '2026-05-18 09:20:59.449181+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_reason_code VALUES (4, 'CLIENT_REQUEST', 'Demande client', 'manual', '{intervention,task}', NULL, '#8b5cf6', 'Client demande priorité', true, '2026-05-18 09:20:59.449181+00', '2026-05-18 09:20:59.449181+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_reason_code VALUES (5, 'RECLASSIFICATION', 'Reclassification', 'manual', '{intervention}', NULL, '#ec4899', 'Erreur d''analyse', true, '2026-05-18 09:20:59.449181+00', '2026-05-18 09:20:59.449181+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_reason_code VALUES (6, 'TECHNICIAN_UNAVAILABLE', 'Technicien indisponible', 'manual', '{task}', NULL, '#6b7280', 'Congé / maladie', true, '2026-05-18 09:20:59.449181+00', '2026-05-18 09:20:59.449181+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_reason_code VALUES (7, 'SUPPLIER_DELAY', 'Délai fournisseur', 'manual', '{purchase_request}', NULL, '#f97316', 'Dépassement délai', true, '2026-05-18 09:20:59.449181+00', '2026-05-18 09:20:59.449181+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_reason_code VALUES (8, 'PRIORITY_BOOST', 'Accélération demandée', 'manual', '{intervention,task}', NULL, '#06b6d4', 'Nécessite plus vite', true, '2026-05-18 09:20:59.449181+00', '2026-05-18 09:20:59.449181+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_reason_code VALUES (9, 'RESOURCE_CONSTRAINT', 'Contrainte ressource', 'manual', '{task,intervention}', NULL, '#a855f7', 'Manque de ressource', true, '2026-05-18 09:20:59.449181+00', '2026-05-18 09:20:59.449181+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_reason_code VALUES (11, 'LEGACY_STATUS_CHANGE', 'Changement historique', 'manual', NULL, NULL, '#d1d5db', 'Logs migrés depuis les anciennes tables de statut', true, '2026-05-18 09:20:59.449181+00', '2026-05-18 09:20:59.449181+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_reason_code VALUES (12, 'TASK_CREATED', 'Tâche créée', 'system', '{task}', NULL, '#10b981', 'Création automatique ou manuelle d''une tâche', true, '2026-05-18 09:21:00.069731+00', '2026-05-18 09:21:00.069731+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_reason_code VALUES (13, 'TASK_UPDATED', 'Tâche modifiée', 'system', '{task}', NULL, '#6366f1', 'Modification d''un champ de la tâche (label, date, affectation…)', true, '2026-05-18 09:21:00.069731+00', '2026-05-18 09:21:00.069731+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_reason_code VALUES (14, 'TASK_STATUS', 'Changement de statut tâche', 'system', '{task}', NULL, '#f59e0b', 'Transition de statut : todo → in_progress → done / skipped', true, '2026-05-18 09:21:00.069731+00', '2026-05-18 09:21:00.069731+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_reason_code VALUES (15, 'TASK_DELETED', 'Tâche supprimée', 'system', '{task}', NULL, '#ef4444', 'Suppression d''une tâche manuelle', true, '2026-05-18 09:21:00.069731+00', '2026-05-18 09:21:00.069731+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_reason_code VALUES (17, 'PLANNING_CHANGE', 'Changement de planning', 'user', '{task}', NULL, '#3b82f6', 'La date ou le technicien a ete modifie suite a une reorganisation du planning', true, '2026-06-02 19:29:20.902622+00', '2026-06-02 19:29:20.902622+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_reason_code VALUES (18, 'TECH_UNAVAILABLE', 'Technicien indisponible', 'user', '{task}', NULL, '#f97316', 'Le technicien assigne nest plus disponible (absence, surcharge)', true, '2026-06-02 19:29:20.902622+00', '2026-06-02 19:29:20.902622+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_reason_code VALUES (19, 'PRIORITY_CHANGE', 'Changement de priorite', 'user', '{task}', NULL, '#8b5cf6', 'La tache est reprogrammee ou reassignee suite a une nouvelle priorite', true, '2026-06-02 19:29:20.902622+00', '2026-06-02 19:29:20.902622+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_reason_code VALUES (10, 'OTHER', 'Autre raison', 'user', '{task,request,purchase_request,intervention}', NULL, '#9ca3af', 'À justifier en texte libre', true, '2026-05-18 09:20:59.449181+00', '2026-07-24 04:49:31.671453+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_reason_code VALUES (16, 'ROUTINE', 'Opération courante', 'auto', '{task,action,request,intervention,purchase_request,supplier_order}', NULL, '#94a3b8', 'Envoyée silencieusement par le front pour les mutations courantes (création tâche, saisie action). Jamais affichée à l''utilisateur.', true, '2026-05-18 15:24:14.768244+00', '2026-05-18 15:24:14.768244+00') ON CONFLICT DO NOTHING;


--
-- Data for Name: audit_rule; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.audit_rule VALUES (1, 'task', NULL, true, 'ROUTINE', '2026-07-23 05:25:24.191478+00', '2026-07-23 05:25:24.191478+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_rule VALUES (2, 'action', NULL, true, 'ROUTINE', '2026-07-23 05:25:24.191478+00', '2026-07-23 05:25:24.191478+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_rule VALUES (3, 'request', NULL, true, 'ROUTINE', '2026-07-23 05:25:24.191478+00', '2026-07-23 05:25:24.191478+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_rule VALUES (4, 'intervention', NULL, true, 'ROUTINE', '2026-07-23 05:25:24.191478+00', '2026-07-23 05:25:24.191478+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_rule VALUES (5, 'purchase_request', NULL, true, 'ROUTINE', '2026-07-23 05:25:24.191478+00', '2026-07-23 05:25:24.191478+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_rule VALUES (6, 'intervention', 'printed_fiche', true, 'ROUTINE', '2026-07-23 05:25:24.191478+00', '2026-07-23 05:25:24.191478+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_rule VALUES (7, 'intervention', 'title', true, 'ROUTINE', '2026-07-23 05:25:24.191478+00', '2026-07-23 05:25:24.191478+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_rule VALUES (8, 'task', 'status', true, 'ROUTINE', '2026-07-23 05:25:24.191478+00', '2026-07-23 05:25:24.191478+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_rule VALUES (9, 'task', 'sort_order', true, 'ROUTINE', '2026-07-23 05:25:24.191478+00', '2026-07-23 05:25:24.191478+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_rule VALUES (10, 'task', 'skip_reason', true, 'ROUTINE', '2026-07-23 05:25:24.191478+00', '2026-07-23 05:25:24.191478+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_rule VALUES (12, 'request', 'machine_id', true, 'ROUTINE', '2026-07-23 05:25:24.191478+00', '2026-07-23 05:25:24.191478+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_rule VALUES (13, 'request', 'demandeur_nom', true, 'ROUTINE', '2026-07-23 05:25:24.191478+00', '2026-07-23 05:25:24.191478+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_rule VALUES (14, 'request', 'service_id', true, 'ROUTINE', '2026-07-23 05:25:24.191478+00', '2026-07-23 05:25:24.191478+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_rule VALUES (15, 'request', 'description', true, 'ROUTINE', '2026-07-23 05:25:24.191478+00', '2026-07-23 05:25:24.191478+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_rule VALUES (16, 'request', 'is_system', true, 'ROUTINE', '2026-07-23 05:25:24.191478+00', '2026-07-23 05:25:24.191478+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_rule VALUES (17, 'request', 'suggested_type_inter', true, 'ROUTINE', '2026-07-23 05:25:24.191478+00', '2026-07-23 05:25:24.191478+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_rule VALUES (18, 'request', 'type_inter', true, 'ROUTINE', '2026-07-23 05:25:24.191478+00', '2026-07-23 05:25:24.191478+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_rule VALUES (19, 'request', 'tech_initials', true, 'ROUTINE', '2026-07-23 05:25:24.191478+00', '2026-07-23 05:25:24.191478+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_rule VALUES (20, 'request', 'priority', true, 'ROUTINE', '2026-07-23 05:25:24.191478+00', '2026-07-23 05:25:24.191478+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_rule VALUES (21, 'request', 'reported_date', true, 'ROUTINE', '2026-07-23 05:25:24.191478+00', '2026-07-23 05:25:24.191478+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_rule VALUES (22, 'request', 'changed_by', true, 'ROUTINE', '2026-07-23 05:25:24.191478+00', '2026-07-23 05:25:24.191478+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_rule VALUES (23, 'task', 'due_date', false, NULL, '2026-07-23 05:25:24.191478+00', '2026-07-23 05:25:24.191478+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_rule VALUES (24, 'task', 'assigned_to', false, NULL, '2026-07-23 05:25:24.191478+00', '2026-07-23 05:25:24.191478+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_rule VALUES (25, 'task', NULL, true, 'ROUTINE', '2026-07-23 05:45:54.426838+00', '2026-07-23 05:45:54.426838+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_rule VALUES (11, 'request', 'status_to', false, 'ROUTINE', '2026-07-23 05:25:24.191478+00', '2026-07-24 04:15:46.578865+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_rule VALUES (26, 'supplier_order', NULL, true, 'ROUTINE', '2026-07-26 18:26:47.231631+00', '2026-07-26 18:26:47.231631+00') ON CONFLICT DO NOTHING;


--
-- Data for Name: complexity_factor; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.complexity_factor VALUES ('DIAG', 'Diagnostic difficile ou panne intermittente', 'Technique') ON CONFLICT DO NOTHING;
INSERT INTO public.complexity_factor VALUES ('ACC', 'Accès machine compliqué ou dangereux', 'Environnement') ON CONFLICT DO NOTHING;
INSERT INTO public.complexity_factor VALUES ('OUT', 'Manque d’outillage adapté', 'Ressources') ON CONFLICT DO NOTHING;
INSERT INTO public.complexity_factor VALUES ('DOC', 'Manque de documentation, schéma ou nomenclature', 'Information') ON CONFLICT DO NOTHING;
INSERT INTO public.complexity_factor VALUES ('PCE', 'Attente pièce, fournisseur ou commande', 'Logistique') ON CONFLICT DO NOTHING;
INSERT INTO public.complexity_factor VALUES ('CMP', 'Manque de compétence ou besoin de formation', 'Compétence') ON CONFLICT DO NOTHING;
INSERT INTO public.complexity_factor VALUES ('PRD', 'Contrainte de production (machine non disponible, arrêt impossible)', 'Organisation') ON CONFLICT DO NOTHING;
INSERT INTO public.complexity_factor VALUES ('TEM', 'Manque de temps ou intervention interrompue', 'Organisation') ON CONFLICT DO NOTHING;
INSERT INTO public.complexity_factor VALUES ('COM', 'Problème de communication ou consigne floue', 'Organisation') ON CONFLICT DO NOTHING;
INSERT INTO public.complexity_factor VALUES ('AUT', 'Autre (à préciser en commentaire)', 'Divers') ON CONFLICT DO NOTHING;
INSERT INTO public.complexity_factor VALUES ('RCH', 'Recherche de nouvelle référence / Veille technologique', 'technique') ON CONFLICT DO NOTHING;
INSERT INTO public.complexity_factor VALUES ('PCS', 'Manque de piéces de rechange', 'ressources') ON CONFLICT DO NOTHING;
INSERT INTO public.complexity_factor VALUES ('VIE', 'Installation veillisante / bricolé', 'technique') ON CONFLICT DO NOTHING;


--
-- Data for Name: equipement_statuts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.equipement_statuts VALUES (2, 'EN_CONSTRUCTION', 'En construction', true, true, 2, '#F59E0B', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.equipement_statuts VALUES (3, 'EN_SERVICE', 'En service', true, true, 3, '#10B981', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.equipement_statuts VALUES (4, 'ARRET', 'À l''arrêt', true, true, 4, '#EF4444', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.equipement_statuts VALUES (5, 'REBUT', 'Rebut', false, true, 5, '#6B7280', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.equipement_statuts VALUES (6, 'INCONNU', 'Inconnu', false, true, 6, '#D1D5DB', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.equipement_statuts VALUES (1, 'EN_PROJET', 'En projet', true, true, 1, '#8B5CF6', NULL) ON CONFLICT DO NOTHING;


--
-- Data for Name: home_view_ref; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.home_view_ref VALUES ('technicien', 'Technicien (réservoir de tâches + fiche semaine)', 0) ON CONFLICT DO NOTHING;
INSERT INTO public.home_view_ref VALUES ('acheteur', 'Acheteur (demandes d''achat par statut)', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.home_view_ref VALUES ('direction_technique', 'Direction technique (DI par statut, porteur, deadline)', 2) ON CONFLICT DO NOTHING;


--
-- Data for Name: intervention_status_ref; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.intervention_status_ref VALUES ('attente_pieces', 'Attente pièces', 'attente_pieces', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.intervention_status_ref VALUES ('attente_prod', 'Attente production', 'attente_prod', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.intervention_status_ref VALUES ('ferme', 'Fermé', 'ferme', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.intervention_status_ref VALUES ('ouvert', 'Ouvert', 'ouvert', NULL, NULL) ON CONFLICT DO NOTHING;


--
-- Data for Name: purchase_status; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.purchase_status VALUES ('open', 'Ouverte', '#9CA3AF', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.purchase_status VALUES ('in_progress', 'En cours', '#3B82F6', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.purchase_status VALUES ('ordered', 'Commandée', '#F59E0B', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.purchase_status VALUES ('received', 'Reçue', '#10B981', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.purchase_status VALUES ('cancelled', 'Annulée', '#EF4444', NULL, NULL, NULL) ON CONFLICT DO NOTHING;


--
-- Data for Name: request_status_ref; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.request_status_ref VALUES ('nouvelle', 'Nouvelle', '#3b82f6', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.request_status_ref VALUES ('en_attente', 'En attente', '#f59e0b', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.request_status_ref VALUES ('acceptee', 'Acceptée', '#22c55e', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.request_status_ref VALUES ('rejetee', 'Rejetée', '#ef4444', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.request_status_ref VALUES ('cloturee', 'Clôturée', '#6b7280', 5) ON CONFLICT DO NOTHING;


--
-- Data for Name: request_type_ref; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.request_type_ref VALUES ('standard', 'Demande d''intervention', '#6B7280', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.request_type_ref VALUES ('amelioration', 'Idée d''amélioration', '#0EA5E9', 2) ON CONFLICT DO NOTHING;


--
-- Data for Name: tunnel_role; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tunnel_role VALUES ('19648dd0-9b82-42fd-bce1-f6b796e82feb', 'ADMIN', 'Administrateur', '2026-05-04 06:56:26.55814+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tunnel_role VALUES ('ee68cfc9-a694-4d74-80f0-41a993c3d474', 'RESP', 'Responsable', '2026-05-04 07:01:55.071894+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tunnel_role VALUES ('95bbb5ce-5a37-4fd9-8572-64837c662983', 'TECH', 'Technicien', '2026-05-04 07:01:55.071894+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tunnel_role VALUES ('38e8d810-d40e-405c-a953-d447cd95cbe4', 'MCP', 'MCP', '2026-05-04 07:01:55.071894+00') ON CONFLICT DO NOTHING;
INSERT INTO public.tunnel_role VALUES ('842b80c2-ca49-4ff8-bbe5-986e3953bc36', 'ACHETEUR', 'Acheteur', '2026-08-31 20:12:32.546982+00') ON CONFLICT DO NOTHING;


--
-- Name: audit_rule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_rule_id_seq', 26, true);


--
-- PostgreSQL database dump complete
--


SELECT setval(pg_get_serial_sequence('public.action_category','id'), COALESCE(MAX(id),0)+1, false) FROM public.action_category;
SELECT setval(pg_get_serial_sequence('public.action_subcategory','id'), COALESCE(MAX(id),0)+1, false) FROM public.action_subcategory;
SELECT setval(pg_get_serial_sequence('public.action_classification_probe','id'), COALESCE(MAX(id),0)+1, false) FROM public.action_classification_probe;
SELECT setval(pg_get_serial_sequence('public.anomaly_threshold','id'), COALESCE(MAX(id),0)+1, false) FROM public.anomaly_threshold;
SELECT setval(pg_get_serial_sequence('public.audit_reason_code','id'), COALESCE(MAX(id),0)+1, false) FROM public.audit_reason_code;
SELECT setval(pg_get_serial_sequence('public.audit_rule','id'), COALESCE(MAX(id),0)+1, false) FROM public.audit_rule;
SELECT setval(pg_get_serial_sequence('public.equipement_statuts','id'), COALESCE(MAX(id),0)+1, false) FROM public.equipement_statuts;
