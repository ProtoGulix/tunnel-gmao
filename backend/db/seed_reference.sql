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
INSERT INTO public.audit_reason_code VALUES (11, 'LEGACY_STATUS_CHANGE', 'Changement historique', 'manual', NULL, NULL, '#d1d5db', 'Logs migrés depuis les anciennes tables de statut', false, '2026-05-18 09:20:59.449181+00', '2026-05-18 09:20:59.449181+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_reason_code VALUES (12, 'TASK_CREATED', 'Tâche créée', 'system', '{task}', NULL, '#10b981', 'Création automatique ou manuelle d''une tâche', true, '2026-05-18 09:21:00.069731+00', '2026-05-18 09:21:00.069731+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_reason_code VALUES (13, 'TASK_UPDATED', 'Tâche modifiée', 'system', '{task}', NULL, '#6366f1', 'Modification d''un champ de la tâche (label, date, affectation…)', true, '2026-05-18 09:21:00.069731+00', '2026-05-18 09:21:00.069731+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_reason_code VALUES (14, 'TASK_STATUS', 'Changement de statut tâche', 'system', '{task}', NULL, '#f59e0b', 'Transition de statut : todo → in_progress → done / skipped', true, '2026-05-18 09:21:00.069731+00', '2026-05-18 09:21:00.069731+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_reason_code VALUES (15, 'TASK_DELETED', 'Tâche supprimée', 'system', '{task}', NULL, '#ef4444', 'Suppression d''une tâche manuelle', true, '2026-05-18 09:21:00.069731+00', '2026-05-18 09:21:00.069731+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_reason_code VALUES (17, 'PLANNING_CHANGE', 'Changement de planning', 'user', '{task}', NULL, '#3b82f6', 'La date ou le technicien a ete modifie suite a une reorganisation du planning', true, '2026-06-02 19:29:20.902622+00', '2026-06-02 19:29:20.902622+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_reason_code VALUES (18, 'TECH_UNAVAILABLE', 'Technicien indisponible', 'user', '{task}', NULL, '#f97316', 'Le technicien assigne nest plus disponible (absence, surcharge)', true, '2026-06-02 19:29:20.902622+00', '2026-06-02 19:29:20.902622+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_reason_code VALUES (19, 'PRIORITY_CHANGE', 'Changement de priorite', 'user', '{task}', NULL, '#8b5cf6', 'La tache est reprogrammee ou reassignee suite a une nouvelle priorite', true, '2026-06-02 19:29:20.902622+00', '2026-06-02 19:29:20.902622+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_reason_code VALUES (10, 'OTHER', 'Autre raison', 'user', '{task,request,purchase_request,intervention}', '{task_done,task_skipped}', '#9ca3af', 'À justifier en texte libre', true, '2026-05-18 09:20:59.449181+00', '2026-07-24 04:49:31.671453+00') ON CONFLICT DO NOTHING;
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
INSERT INTO public.audit_rule VALUES (11, 'request', 'status_to', true, 'ROUTINE', '2026-07-23 05:25:24.191478+00', '2026-07-24 04:15:46.578865+00') ON CONFLICT DO NOTHING;
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

--
-- Motifs de clôture ou d'annulation d'une tâche sans action (ADR 0016), proposés dans
-- le choix de motif d'audit. decision_types : task_done pour Terminé, task_skipped pour
-- Annuler et Ignorer ; seuls les motifs qui portent la valeur sont proposés. Identifiant calculé et ON CONFLICT (code) : idempotent,
-- sans collision avec les motifs ajoutés depuis l'administration.
--

INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, decision_types, color, description, is_active) SELECT COALESCE(MAX(id), 0) + 1, 'TASK_DONE_UNRECORDED', 'Réalisée sans action saisie', 'user', '{task}', '{task_done}', '#16a34a', 'Le travail a été fait mais aucune action n''a été saisie ; constaté en réunion de coordination.', true FROM public.audit_reason_code ON CONFLICT (code) DO NOTHING;
INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, decision_types, color, description, is_active) SELECT COALESCE(MAX(id), 0) + 1, 'TASK_HANDLED_ELSEWHERE', 'Traitée dans une autre intervention', 'user', '{task}', '{task_done,task_skipped}', '#0ea5e9', 'Le besoin a été traité par une autre intervention ou une autre tâche.', true FROM public.audit_reason_code ON CONFLICT (code) DO NOTHING;
INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, decision_types, color, description, is_active) SELECT COALESCE(MAX(id), 0) + 1, 'TASK_NO_LONGER_NEEDED', 'Plus nécessaire', 'user', '{task}', '{task_skipped}', '#d97706', 'Le besoin a disparu : situation résolue, équipement remplacé ou arrêté.', true FROM public.audit_reason_code ON CONFLICT (code) DO NOTHING;
INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, decision_types, color, description, is_active) SELECT COALESCE(MAX(id), 0) + 1, 'TASK_DUPLICATE', 'Doublon', 'user', '{task}', '{task_skipped}', '#6b7280', 'La même tâche existe déjà.', true FROM public.audit_reason_code ON CONFLICT (code) DO NOTHING;
SELECT setval(pg_get_serial_sequence('public.audit_reason_code','id'), COALESCE(MAX(id),0)+1, false) FROM public.audit_reason_code;

--
-- Motif des mutations du système (ADR 0018, point 6), cohérent avec la migration 0007 :
-- catégorie system, toutes entités et toutes décisions. Identifiant calculé et
-- ON CONFLICT (code) : idempotent.
--

INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, decision_types, color, description, is_active) SELECT COALESCE(MAX(id), 0) + 1, 'SYSTEM_CASCADE', 'Mutation automatique du système', 'system', NULL, NULL, '#64748b', 'Mutation produite par le système lui-même (cascade, génération, acceptation automatique), sans décision d''un utilisateur.', true FROM public.audit_reason_code ON CONFLICT (code) DO NOTHING;
INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, decision_types, color, description, is_active) SELECT COALESCE(MAX(id), 0) + 1, 'SYSTEM_SCHEDULE', 'Génération planifiée du système', 'system', NULL, NULL, '#64748b', 'Création produite par une tâche planifiée du système (génération des occurrences préventives), sans décision d''un utilisateur.', true FROM public.audit_reason_code ON CONFLICT (code) DO NOTHING;
SELECT setval(pg_get_serial_sequence('public.audit_reason_code','id'), COALESCE(MAX(id),0)+1, false) FROM public.audit_reason_code;

--
-- Motif de complétion de données par une migration (IMPR-04), cohérent avec la migration
-- 0014 : catégorie system, intervention, reported_date_changed. Idempotent.
--

INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, decision_types, color, description, is_active) SELECT COALESCE(MAX(id), 0) + 1, 'DATA_BACKFILL', 'Complétion de données historiques', 'system', '{intervention}', '{reported_date_changed}', '#64748b', 'Donnée manquante complétée par une migration, à partir d''une source déjà présente en base (code, journal des statuts).', true FROM public.audit_reason_code ON CONFLICT (code) DO NOTHING;
SELECT setval(pg_get_serial_sequence('public.audit_reason_code','id'), COALESCE(MAX(id),0)+1, false) FROM public.audit_reason_code;

--
-- Règle d'audit de l'occurrence préventive (AUDC-29), cohérente avec la migration 0008 :
-- règle routinière et entité ajoutée aux entity_types de ROUTINE. Idempotent.
--

UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'preventive_occurrence') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('preventive_occurrence' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'preventive_occurrence', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'preventive_occurrence' AND field IS NULL);
SELECT setval(pg_get_serial_sequence('public.audit_rule','id'), COALESCE(MAX(id),0)+1, false) FROM public.audit_rule;

--
-- Motifs de suppression (ADR 0018, point 5 ; AUDC-30), cohérents avec la migration 0009 :
-- toutes entités, décision deleted ; OTHER applicable à toutes les entités et à deleted.
-- Idempotent.
--

INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, decision_types, color, description, is_active) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_reason_code), 'DELETE_CREATED_BY_MISTAKE', 'Créé par erreur', 'user', NULL, '{deleted}', '#dc2626', 'L''élément a été créé par erreur et n''aurait pas dû exister.', true WHERE NOT EXISTS (SELECT 1 FROM public.audit_reason_code WHERE code = 'DELETE_CREATED_BY_MISTAKE') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, decision_types, color, description, is_active) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_reason_code), 'DELETE_DUPLICATE', 'Doublon', 'user', NULL, '{deleted}', '#6b7280', 'L''élément existe déjà ailleurs ; on supprime le doublon.', true WHERE NOT EXISTS (SELECT 1 FROM public.audit_reason_code WHERE code = 'DELETE_DUPLICATE') ON CONFLICT (code) DO NOTHING;
UPDATE public.audit_reason_code SET entity_types = NULL, decision_types = '{task_done,task_skipped,deleted}' WHERE code = 'OTHER' AND (entity_types IS NOT NULL OR decision_types IS DISTINCT FROM '{task_done,task_skipped,deleted}');
SELECT setval(pg_get_serial_sequence('public.audit_reason_code','id'), COALESCE(MAX(id),0)+1, false) FROM public.audit_reason_code;

--
-- Règles d'audit des entités de l'étape 3 (AUDC-32, AUDC-34), cohérentes avec les migrations
-- 0010 et 0011 (stock_family) :
-- règle routinière et entité ajoutée aux entity_types de ROUTINE. Idempotent.
--

UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'preventive_plan') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('preventive_plan' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'preventive_plan', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'preventive_plan' AND field IS NULL);
UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'part') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('part' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'part', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'part' AND field IS NULL);
UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'part_manufacturer_ref') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('part_manufacturer_ref' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'part_manufacturer_ref', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'part_manufacturer_ref' AND field IS NULL);
UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'part_supplier_ref') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('part_supplier_ref' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'part_supplier_ref', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'part_supplier_ref' AND field IS NULL);
UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'manufacturer_item') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('manufacturer_item' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'manufacturer_item', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'manufacturer_item' AND field IS NULL);
UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'stock_item') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('stock_item' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'stock_item', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'stock_item' AND field IS NULL);
UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'stock_sub_family') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('stock_sub_family' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'stock_sub_family', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'stock_sub_family' AND field IS NULL);
UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'stock_item_supplier') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('stock_item_supplier' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'stock_item_supplier', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'stock_item_supplier' AND field IS NULL);
UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'supplier') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('supplier' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'supplier', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'supplier' AND field IS NULL);
UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'supplier_order_line') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('supplier_order_line' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'supplier_order_line', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'supplier_order_line' AND field IS NULL);
UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'stock_family') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('stock_family' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'stock_family', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'stock_family' AND field IS NULL);

--
-- Règles d'audit des entités de l'étape 4 (AUDC-42), cohérentes avec la migration 0012 :
-- règle routinière et entité ajoutée aux entity_types de ROUTINE. Idempotent.
--

UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'user') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('user' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'user', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'user' AND field IS NULL);
UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'permission') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('permission' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'permission', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'permission' AND field IS NULL);
UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'endpoint') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('endpoint' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'endpoint', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'endpoint' AND field IS NULL);
UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'ip_block') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('ip_block' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'ip_block', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'ip_block' AND field IS NULL);
UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'email_domain_rule') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('email_domain_rule' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'email_domain_rule', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'email_domain_rule' AND field IS NULL);
UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'api_key') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('api_key' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'api_key', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'api_key' AND field IS NULL);
UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'equipement_class') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('equipement_class' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'equipement_class', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'equipement_class' AND field IS NULL);
UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'service') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('service' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'service', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'service' AND field IS NULL);
UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'role_home_view') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('role_home_view' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'role_home_view', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'role_home_view' AND field IS NULL);
UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'action_category') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('action_category' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'action_category', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'action_category' AND field IS NULL);
UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'action_subcategory') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('action_subcategory' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'action_subcategory', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'action_subcategory' AND field IS NULL);
UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'intervention_type') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('intervention_type' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'intervention_type', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'intervention_type' AND field IS NULL);
UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'intervention_status') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('intervention_status' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'intervention_status', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'intervention_status' AND field IS NULL);
UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'audit_reason') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('audit_reason' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'audit_reason', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'audit_reason' AND field IS NULL);
UPDATE public.audit_reason_code SET entity_types = array_append(COALESCE(entity_types, '{}'), 'audit_rule') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL AND NOT ('audit_rule' = ANY(entity_types));
INSERT INTO public.audit_rule (id, entity_type, field, is_routine, default_reason_code) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_rule), 'audit_rule', NULL, true, 'ROUTINE' WHERE NOT EXISTS (SELECT 1 FROM public.audit_rule WHERE entity_type = 'audit_rule' AND field IS NULL);
SELECT setval(pg_get_serial_sequence('public.audit_rule','id'), COALESCE(MAX(id),0)+1, false) FROM public.audit_rule;

--
-- Motifs pour ignorer une occurrence préventive (CONT-03), cohérents avec la migration 0019 :
-- motifs de la décision occurrence_skipped, règle de l'entité non routinière. Idempotent.
--

INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, decision_types, color, description, is_active) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_reason_code), 'OCCURRENCE_MACHINE_DOWN', 'Machine arrêtée', 'user', '{preventive_occurrence}', '{occurrence_skipped}', '#d97706', 'L''équipement est à l''arrêt : le préventif ne peut pas être réalisé à cette échéance.', true WHERE NOT EXISTS (SELECT 1 FROM public.audit_reason_code WHERE code = 'OCCURRENCE_MACHINE_DOWN') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, decision_types, color, description, is_active) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_reason_code), 'OCCURRENCE_DONE_OFFLINE', 'Fait hors de l''outil', 'user', '{preventive_occurrence}', '{occurrence_skipped}', '#16a34a', 'Le préventif a été réalisé sans être saisi dans l''outil.', true WHERE NOT EXISTS (SELECT 1 FROM public.audit_reason_code WHERE code = 'OCCURRENCE_DONE_OFFLINE') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, decision_types, color, description, is_active) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_reason_code), 'OCCURRENCE_PLAN_OBSOLETE', 'Plan obsolète', 'user', '{preventive_occurrence}', '{occurrence_skipped}', '#6b7280', 'Le plan préventif ne correspond plus à l''équipement ou à son usage.', true WHERE NOT EXISTS (SELECT 1 FROM public.audit_reason_code WHERE code = 'OCCURRENCE_PLAN_OBSOLETE') ON CONFLICT (code) DO NOTHING;
UPDATE public.audit_reason_code SET decision_types = array_append(COALESCE(decision_types, '{}'), 'occurrence_skipped') WHERE code = 'OTHER' AND decision_types IS NOT NULL AND NOT ('occurrence_skipped' = ANY(decision_types));
UPDATE public.audit_reason_code SET entity_types = array_remove(entity_types, 'preventive_occurrence') WHERE code = 'ROUTINE' AND entity_types IS NOT NULL;
UPDATE public.audit_rule SET is_routine = false, default_reason_code = NULL WHERE entity_type = 'preventive_occurrence' AND field IS NULL AND is_routine;
SELECT setval('public.audit_reason_code_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.audit_reason_code), (SELECT last_value FROM public.audit_reason_code_id_seq)));

--
-- Types d'intervention en base (TYP-01, ADR 0026), cohérents avec la migration 0020 : colonne
-- description, les 8 types, clés étrangères vers intervention_type(code). Idempotent. Ce
-- fichier s'exécute avant 0020 (migration 0002) : les instructions sont donc complètes.
--

ALTER TABLE public.intervention_type ADD COLUMN IF NOT EXISTS description text;
INSERT INTO public.intervention_type (id, code, label, color, is_active, description) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.intervention_type), 'CUR', 'Curatif', 'red', true, 'Réparer une panne ou un défaut constaté sur un équipement.' WHERE NOT EXISTS (SELECT 1 FROM public.intervention_type WHERE code = 'CUR') ON CONFLICT (code) DO NOTHING;
UPDATE public.intervention_type SET description = 'Réparer une panne ou un défaut constaté sur un équipement.' WHERE code = 'CUR' AND description IS NULL;
INSERT INTO public.intervention_type (id, code, label, color, is_active, description) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.intervention_type), 'PRE', 'Préventif', 'green', true, 'Entretien planifié pour éviter la panne (plan préventif).' WHERE NOT EXISTS (SELECT 1 FROM public.intervention_type WHERE code = 'PRE') ON CONFLICT (code) DO NOTHING;
UPDATE public.intervention_type SET description = 'Entretien planifié pour éviter la panne (plan préventif).' WHERE code = 'PRE' AND description IS NULL;
INSERT INTO public.intervention_type (id, code, label, color, is_active, description) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.intervention_type), 'REA', 'Réapprovisionnement', 'blue', true, 'Réapprovisionner des pièces ou des consommables.' WHERE NOT EXISTS (SELECT 1 FROM public.intervention_type WHERE code = 'REA') ON CONFLICT (code) DO NOTHING;
UPDATE public.intervention_type SET description = 'Réapprovisionner des pièces ou des consommables.' WHERE code = 'REA' AND description IS NULL;
INSERT INTO public.intervention_type (id, code, label, color, is_active, description) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.intervention_type), 'BAT', 'Batiment', 'gray', true, 'Travaux sur les locaux et les réseaux du bâtiment, hors équipement de production.' WHERE NOT EXISTS (SELECT 1 FROM public.intervention_type WHERE code = 'BAT') ON CONFLICT (code) DO NOTHING;
UPDATE public.intervention_type SET description = 'Travaux sur les locaux et les réseaux du bâtiment, hors équipement de production.' WHERE code = 'BAT' AND description IS NULL;
INSERT INTO public.intervention_type (id, code, label, color, is_active, description) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.intervention_type), 'PRO', 'Projet', 'blue', true, 'Amélioration, modification ou ajout sur un équipement ou une installation.' WHERE NOT EXISTS (SELECT 1 FROM public.intervention_type WHERE code = 'PRO') ON CONFLICT (code) DO NOTHING;
UPDATE public.intervention_type SET description = 'Amélioration, modification ou ajout sur un équipement ou une installation.' WHERE code = 'PRO' AND description IS NULL;
INSERT INTO public.intervention_type (id, code, label, color, is_active, description) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.intervention_type), 'COF', 'Remise en conformité', 'amber', true, 'Mise aux normes ou correction suite à un contrôle (sécurité, réglementaire).' WHERE NOT EXISTS (SELECT 1 FROM public.intervention_type WHERE code = 'COF') ON CONFLICT (code) DO NOTHING;
UPDATE public.intervention_type SET description = 'Mise aux normes ou correction suite à un contrôle (sécurité, réglementaire).' WHERE code = 'COF' AND description IS NULL;
INSERT INTO public.intervention_type (id, code, label, color, is_active, description) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.intervention_type), 'PIL', 'Pilotage', 'blue', true, 'Organisation et suivi du service : documentation, réunions, formation.' WHERE NOT EXISTS (SELECT 1 FROM public.intervention_type WHERE code = 'PIL') ON CONFLICT (code) DO NOTHING;
UPDATE public.intervention_type SET description = 'Organisation et suivi du service : documentation, réunions, formation.' WHERE code = 'PIL' AND description IS NULL;
INSERT INTO public.intervention_type (id, code, label, color, is_active, description) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.intervention_type), 'MES', 'Mise en service', 'amber', true, 'Installation et démarrage d''un équipement neuf ou déplacé.' WHERE NOT EXISTS (SELECT 1 FROM public.intervention_type WHERE code = 'MES') ON CONFLICT (code) DO NOTHING;
UPDATE public.intervention_type SET description = 'Installation et démarrage d''un équipement neuf ou déplacé.' WHERE code = 'MES' AND description IS NULL;
INSERT INTO public.intervention_type (id, code, label, is_active) SELECT (SELECT COALESCE(MAX(id), 0) FROM public.intervention_type) + row_number() OVER (ORDER BY o.code), o.code, o.code, false FROM (SELECT code FROM (SELECT type_inter AS code FROM public.intervention UNION SELECT suggested_type_inter FROM public.intervention_request WHERE suggested_type_inter IS NOT NULL AND length(suggested_type_inter) <= 10) u WHERE NOT EXISTS (SELECT 1 FROM public.intervention_type t WHERE t.code = u.code) ORDER BY code) o ON CONFLICT (code) DO NOTHING;
SELECT setval('public.intervention_type_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.intervention_type), (SELECT last_value FROM public.intervention_type_id_seq)));
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'intervention_type_inter_fkey' AND conrelid = 'public.intervention'::regclass) THEN ALTER TABLE public.intervention ADD CONSTRAINT intervention_type_inter_fkey FOREIGN KEY (type_inter) REFERENCES public.intervention_type(code); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'intervention_request_suggested_type_inter_fkey' AND conrelid = 'public.intervention_request'::regclass) THEN ALTER TABLE public.intervention_request ADD CONSTRAINT intervention_request_suggested_type_inter_fkey FOREIGN KEY (suggested_type_inter) REFERENCES public.intervention_type(code); END IF; END $$;
ALTER TABLE public.intervention_request DROP CONSTRAINT IF EXISTS chk_suggested_type_inter;

--
-- Motifs de réouverture d'une intervention (REO-01, ADR 0028), cohérents avec la migration 0021 :
-- motifs de la décision intervention_reopened. Idempotent.
--

INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, decision_types, color, description, is_active) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_reason_code), 'INTERVENTION_CLOSED_BY_MISTAKE', 'Clôturée par erreur', 'user', '{intervention}', '{intervention_reopened}', '#d97706', 'L''intervention a été fermée par erreur : elle n''était pas terminée.', true WHERE NOT EXISTS (SELECT 1 FROM public.audit_reason_code WHERE code = 'INTERVENTION_CLOSED_BY_MISTAKE') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, decision_types, color, description, is_active) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_reason_code), 'INTERVENTION_REWORK', 'Travail à reprendre', 'user', '{intervention}', '{intervention_reopened}', '#dc2626', 'Le travail est à reprendre : le défaut est revenu ou la réparation est incomplète.', true WHERE NOT EXISTS (SELECT 1 FROM public.audit_reason_code WHERE code = 'INTERVENTION_REWORK') ON CONFLICT (code) DO NOTHING;
UPDATE public.audit_reason_code SET decision_types = array_append(COALESCE(decision_types, '{}'), 'intervention_reopened') WHERE code = 'OTHER' AND decision_types IS NOT NULL AND NOT ('intervention_reopened' = ANY(decision_types));
SELECT setval('public.audit_reason_code_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.audit_reason_code), (SELECT last_value FROM public.audit_reason_code_id_seq)));

-- Motifs de rejet d'une demande (REJ-01, ADR 0038), cohérents avec la migration 0024 :
-- motifs de la décision request_rejected. Idempotent.
--
INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, decision_types, color, description, is_active) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_reason_code), 'REJECT_OUT_OF_SCOPE', 'Hors du périmètre de la maintenance', 'user', '{request}', '{request_rejected}', '#6b7280', 'La demande ne relève pas de la maintenance.', true WHERE NOT EXISTS (SELECT 1 FROM public.audit_reason_code WHERE code = 'REJECT_OUT_OF_SCOPE') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, decision_types, color, description, is_active) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_reason_code), 'REJECT_DUPLICATE', 'Doublon d''une demande existante', 'user', '{request}', '{request_rejected}', '#d97706', 'Une demande existante couvre déjà ce besoin.', true WHERE NOT EXISTS (SELECT 1 FROM public.audit_reason_code WHERE code = 'REJECT_DUPLICATE') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, decision_types, color, description, is_active) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_reason_code), 'REJECT_ALREADY_HANDLED', 'Déjà traité', 'user', '{request}', '{request_rejected}', '#16a34a', 'Le problème signalé a déjà été traité.', true WHERE NOT EXISTS (SELECT 1 FROM public.audit_reason_code WHERE code = 'REJECT_ALREADY_HANDLED') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, decision_types, color, description, is_active) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_reason_code), 'REJECT_INCOMPLETE', 'Demande incomplète ou incompréhensible', 'user', '{request}', '{request_rejected}', '#dc2626', 'La demande ne permet pas de savoir quoi faire : informations manquantes ou peu claires.', true WHERE NOT EXISTS (SELECT 1 FROM public.audit_reason_code WHERE code = 'REJECT_INCOMPLETE') ON CONFLICT (code) DO NOTHING;
UPDATE public.audit_reason_code SET decision_types = array_append(COALESCE(decision_types, '{}'), 'request_rejected') WHERE code = 'OTHER' AND decision_types IS NOT NULL AND NOT ('request_rejected' = ANY(decision_types));
SELECT setval('public.audit_reason_code_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.audit_reason_code), (SELECT last_value FROM public.audit_reason_code_id_seq)));

--
-- Motif de la normalisation de la priorité (PRIO-01, ADR 0039), cohérent avec la migration
-- 0025 : catégorie system, intervention, priority_changed. Idempotent.
--

INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, decision_types, color, description, is_active) SELECT COALESCE(MAX(id), 0) + 1, 'PRIORITY_NORMALIZED', 'Priorité normalisée', 'system', '{intervention}', '{priority_changed}', '#64748b', 'Écriture de la priorité corrigée par une migration (normale devenue normal, ADR 0039).', true FROM public.audit_reason_code ON CONFLICT (code) DO NOTHING;
SELECT setval(pg_get_serial_sequence('public.audit_reason_code','id'), COALESCE(MAX(id),0)+1, false) FROM public.audit_reason_code;

--
-- Motifs de remise à faire d'une tâche (REM-01, ADR 0042), cohérents avec la migration
-- 0027 : décision task_reopened. Idempotent.
--

INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, decision_types, color, description, is_active) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_reason_code), 'TASK_CLOSED_BY_MISTAKE', 'Clôturée par erreur', 'user', '{task}', '{task_reopened}', '#d97706', 'La tâche a été terminée ou annulée par erreur.', true WHERE NOT EXISTS (SELECT 1 FROM public.audit_reason_code WHERE code = 'TASK_CLOSED_BY_MISTAKE') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.audit_reason_code (id, code, label, category, entity_types, decision_types, color, description, is_active) SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_reason_code), 'TASK_REWORK', 'Travail à reprendre', 'user', '{task}', '{task_reopened}', '#dc2626', 'Le travail de la tâche est à reprendre.', true WHERE NOT EXISTS (SELECT 1 FROM public.audit_reason_code WHERE code = 'TASK_REWORK') ON CONFLICT (code) DO NOTHING;
UPDATE public.audit_reason_code SET decision_types = array_append(COALESCE(decision_types, '{}'), 'task_reopened') WHERE code = 'OTHER' AND decision_types IS NOT NULL AND NOT ('task_reopened' = ANY(decision_types));
SELECT setval('public.audit_reason_code_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.audit_reason_code), (SELECT last_value FROM public.audit_reason_code_id_seq)));
