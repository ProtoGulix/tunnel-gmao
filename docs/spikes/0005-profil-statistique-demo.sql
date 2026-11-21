\echo == volumes globaux (12 derniers mois)
select 'interventions', count(*) from intervention where reported_date >= current_date - 365;
select 'actions', count(*) from intervention_action where created_at >= now() - interval '365 days';
select 'demandes', count(*) from intervention_request where created_at >= now() - interval '365 days';
select 'DA', count(*) from purchase_request where created_at >= now() - interval '365 days';
select 'commandes', count(*) from supplier_order where created_at >= now() - interval '365 days';
\echo == interventions par mois (12 mois)
select to_char(date_trunc('month',reported_date),'MM') m, count(*) from intervention where reported_date >= current_date-365 group by 1 order by min(reported_date);
\echo == part par type (12 mois)
select type_inter, round(100.0*count(*)/sum(count(*)) over()) from intervention where reported_date >= current_date-365 group by 1 order by 2 desc;
\echo == part par priorite
select priority, round(100.0*count(*)/sum(count(*)) over()) from intervention where reported_date >= current_date-365 group by 1 order by 2 desc;
\echo == statuts actuels
select status_actual, count(*) from intervention group by 1;
\echo == actions par intervention (p50 p90 max)
select percentile_cont(0.5) within group (order by n), percentile_cont(0.9) within group (order by n), max(n) from (select count(*) n from intervention_action a join intervention i on i.id=a.intervention_id where i.reported_date>=current_date-365 group by a.intervention_id) x;
\echo == temps par action en h (p25 p50 p75 p90)
select percentile_cont(array[0.25,0.5,0.75,0.9]) within group (order by time_spent) from intervention_action where created_at >= now()-interval '365 days';
\echo == score complexite distribution
select complexity_score, round(100.0*count(*)/sum(count(*)) over()) from intervention_action where created_at >= now()-interval '365 days' group by 1 order by 1;
\echo == part par categorie d action (code)
select c.code, round(100.0*count(*)/sum(count(*)) over()), round(sum(a.time_spent)) from intervention_action a join action_subcategory s on s.id=a.action_subcategory join action_category c on c.id=s.category_id where a.created_at >= now()-interval '365 days' group by 1 order by 2 desc;
\echo == sous-categories utilisees (nombre)
select count(distinct action_subcategory) from intervention_action where created_at >= now()-interval '365 days';
\echo == facteurs de complexite (code, part parmi actions avec facteur)
select complexity_factor, round(100.0*count(*)/sum(count(*)) over()) from intervention_action where complexity_factor is not null and created_at >= now()-interval '365 days' group by 1 order by 2 desc limit 8;
\echo == actions avec DA liee (pourcentage)
select round(100.0*count(distinct l.intervention_action_id)/(select count(*) from intervention_action where created_at>=now()-interval '365 days')) from intervention_action_purchase_request l join intervention_action a on a.id=l.intervention_action_id where a.created_at>=now()-interval '365 days';
\echo == DA autonomes (pourcentage)
select round(100.0*count(*) filter (where not exists (select 1 from intervention_action_purchase_request l where l.purchase_request_id=p.id))/count(*)) from purchase_request p where created_at>=now()-interval '365 days';
\echo == DA par urgence
select urgency, count(*) from purchase_request where created_at>=now()-interval '365 days' group by 1;
\echo == lignes par commande p50, delai commande->reception jours p50 p90
select percentile_cont(0.5) within group (order by n) from (select count(*) n from supplier_order_line group by supplier_order_id) x;
select percentile_cont(array[0.5,0.9]) within group (order by extract(day from received_at-ordered_at)) from supplier_order where received_at is not null and ordered_at is not null;
\echo == statuts commandes
select status, count(*) from supplier_order group by 1;
\echo == duree ouverture->fermeture intervention jours p50 p90 (par journal)
select percentile_cont(array[0.5,0.9]) within group (order by d) from (select extract(day from max(l.date)-i.reported_date::timestamp) d from intervention i join intervention_status_log l on l.intervention_id=i.id and l.status_to='ferme' where i.reported_date>=current_date-365 group by i.id,i.reported_date) x;
\echo == passages en attente pieces (pourcentage interventions)
select round(100.0*count(distinct intervention_id)/(select count(*) from intervention where reported_date>=current_date-365)) from intervention_status_log l join intervention i on i.id=l.intervention_id where l.status_to='attente_pieces' and i.reported_date>=current_date-365;
\echo == equipements : total, racines, meres, profondeur max
select count(*), count(*) filter (where equipement_mere is null), count(*) filter (where is_mere) from machine;
with recursive t as (select id, 1 d from machine where equipement_mere is null union all select m.id, t.d+1 from machine m join t on m.equipement_mere=t.id) select d, count(*) from t group by 1 order by 1;
\echo == classes d equipement
select count(*) from equipement_class;
\echo == plans preventifs : actifs, par trigger, periodicites
select trigger_type, active, count(*) from preventive_plan group by 1,2;
select percentile_cont(array[0.25,0.5,0.75]) within group (order by periodicity_days) from preventive_plan where active and trigger_type='periodicity';
select percentile_cont(0.5) within group (order by n) from (select count(*) n from preventive_plan_gamme_step group by plan_id) x;
\echo == occurrences par statut
select status, count(*) from preventive_occurrence group by 1;
\echo == equipe : utilisateurs actifs par role
select r.code, count(*) from tunnel_user u join tunnel_role r on r.id=u.role_id where u.is_active group by 1;
\echo == techniciens distincts ayant saisi des actions (12 mois)
select count(distinct tech) from intervention_action where created_at>=now()-interval '365 days';
\echo == taches : par origine, part optionnelles
select origin, count(*) from intervention_task group by 1;
select round(100.0*count(*) filter (where optional)/count(*)) from intervention_task;
\echo == demandes par origine et statut
select origine, statut, count(*) from intervention_request where created_at>=now()-interval '365 days' group by 1,2 order by 1,2;
