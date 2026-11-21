# Scénario de la base de démonstration

Usine **entièrement fictive** (ADR 0036). Les fichiers de ce dossier sont écrits une fois
par un agent par rôle (fiche DEMO-05), puis chargés chaque nuit par le chargeur
(`deploy/demo/`, fiche DEMO-06). Aucun nom réel : ni personne, ni entreprise, ni ville, ni
marque ou fournisseur existants. Adresses de courriel : domaine `demo.frezille.fr` pour les
comptes, `.example` pour tout le reste.

## Fichiers et ordre d'écriture

| Fichier | Rôle qui l'écrit | Dépend de |
| --- | --- | --- |
| `usine.json` | responsable | référentiel de départ |
| `interventions.json` | technicien | `usine.json` |
| `achats.json` | acheteur | `usine.json`, `interventions.json` |
| `RELECTURE.md` | direction | les trois fichiers |

## Conventions

- **Dates relatives** : un entier `n` ≤ 0 = n jours par rapport au jour du chargement
  (`-120` = il y a 120 jours, `0` = aujourd'hui). Heures facultatives au format `"HH:MM"`.
  Horizon : de `-365` à `0`.
- **Clés** : chaînes courtes et stables (`"T1"`, `"I042"`, `"DA017"`), uniques dans leur
  liste ; une référence vers un autre objet utilise sa clé ou son code.
- **Référentiel de départ** (installé par `seed_reference.sql`, à utiliser tel quel) :
  - types d'intervention : `CUR`, `PRE`, `REA`, `BAT`, `PRO`, `COF`, `PIL`, `MES` ;
  - priorités : `faible`, `normal`, `important`, `urgent` ;
  - statuts d'intervention : `ouvert`, `attente_pieces`, `attente_prod`, `ferme` ;
  - statuts de demande : `nouvelle`, `en_attente`, `acceptee`, `rejetee`, `cloturee` ;
  - sous-catégories d'action (`sous_categorie`) : `BAT_AID BAT_DEM BAT_INS BAT_NET BAT_TRA
    DEP_AUT DEP_BAT DEP_ELC DEP_FLD DEP_MEC DOC_GES DOC_NOM DOC_PRO DOC_SCH FAB_ASS FAB_CAB
    FAB_ETU FAB_FLD FAB_INF FAB_MES FAB_MOD FAB_USI PREV_AUT PREV_COUP PREV_ELC PREV_FLD
    PREV_MEC PREV_VER SUP_ACH SUP_EQP SUP_EXT SUP_GES SUP_INV SUP_REG SUP_REU` ;
  - facteurs de complexité (`facteur`, obligatoire si `complexite` > 5) : `DIAG ACC OUT DOC
    PCE CMP PRD TEM COM AUT RCH PCS VIE` ;
  - urgences de demande d'achat : `normal`, `high`, `urgent`, `critical`.
- **Règles du code à respecter** : temps d'une action en heures, multiple de 0,25, au moins
  0,25 ; complexité entière de 1 à 10 ; une demande porte au plus une intervention ; une
  intervention fermée a au moins une action et toutes ses tâches non facultatives faites ou
  ignorées ; profondeur des équipements ≤ 4.

## `usine.json` (responsable)

    {
      "entreprise": "nom fictif",
      "services": [{"code": "PROD", "label": "Production"}],
      "classes": [{"code": "PRESSE", "label": "Presses", "description": "...",
                   "types": ["CUR", "PRE", "PRO"]}],
      "equipements": [{"code": "ATL", "name": "Atelier principal", "parent": null,
                       "classe": null, "marque": "", "model": "", "mise_en_service": -3000}],
      "equipe": [{"key": "T1", "first_name": "...", "last_name": "...", "initial": "AB",
                  "role": "TECH", "login": "technicien@demo.frezille.fr"}],
      "plans": [{"code": "PRE-PRESSE-TRIM", "label": "...", "classe": "PRESSE",
                 "periodicity_days": 90, "auto_accept": false,
                 "steps": [{"label": "...", "optional": false}]}]
    }

- `types` d'une classe : facultatif (absent = tous les types permis, ADR 0031).
- `equipe` : `login` vaut l'une des trois adresses publiques (`technicien@`, `acheteur@`,
  `direction@demo.frezille.fr`, rôles TECH, ACHETEUR, RESP) ou `null` pour un collègue
  fictif sans connexion.

## `interventions.json` (technicien)

    [
      {
        "key": "I001", "equipement": "PR-02", "demandeur": "prénom fictif",
        "service": "PROD", "description": "ce que signale le demandeur",
        "signalee_le": -120, "origine": "signalee",
        "statut_demande": "cloturee", "motif_rejet": null,
        "intervention": {
          "title": "...", "type": "CUR", "priority": "urgent", "tech": "T1",
          "plan": null, "ouverte_le": -120,
          "statuts": [{"to": "attente_pieces", "le": -119, "par": "T1"},
                      {"to": "ouvert", "le": -112, "par": "T1"},
                      {"to": "ferme", "le": -111, "par": "R1"}],
          "taches": [{"key": "t1", "label": "...", "origin": "tech", "assigned_to": "T1",
                      "status": "done", "optional": false, "gamme_step": null}],
          "actions": [{"key": "a1", "le": -120, "debut": "08:30", "tech": "T1",
                       "heures": 1.5, "sous_categorie": "DEP_MEC", "complexite": 3,
                       "facteur": null, "description": "ce qui a été fait, ton terrain",
                       "taches": ["t1"],
                       "demandes_achat": [{"key": "DA001", "besoin": "roulement 6204-2RS",
                                           "quantity": 2, "unit": "pce",
                                           "urgency": "urgent"}]}]
        }
      }
    ]

- `intervention` vaut `null` pour une demande `nouvelle`, `en_attente` ou `rejetee`
  (`motif_rejet` : texte court).
- Intervention préventive : `"type": "PRE"`, `"plan": "<code>"` ; ses tâches reprennent les
  étapes du plan, `gamme_step` = rang de l'étape (1, 2…), `origin` `"plan"`.
- Le dernier statut donne l'état actuel ; une intervention encore ouverte n'a pas de `ferme`.
- `demandes_achat` : besoin exprimé par le technicien, traité ensuite par l'acheteur.

## `achats.json` (acheteur)

    {
      "familles": [{"code": "ROUL", "label": "Roulements",
                    "sous_familles": [{"code": "ROUL-BILLE", "label": "À billes"}]}],
      "fabricants": [{"key": "F1", "name": "nom fictif", "ref": "...", "designation": "..."}],
      "fournisseurs": [{"code": "FOU-A", "name": "nom fictif", "contact_name": "...",
                        "email": "contact@fournisseur-a.example", "phone": "00 00 00 00 00"}],
      "articles": [{"key": "ART001", "name": "...", "famille": "ROUL",
                    "sous_famille": "ROUL-BILLE", "spec": "", "dimension": "",
                    "ref": "...", "quantity": 4, "unit": "pce", "location": "Armoire A2",
                    "fabricant": "F1",
                    "fournisseurs": [{"fournisseur": "FOU-A", "supplier_ref": "...",
                                      "unit_price": 12.5, "delivery_time_days": 3,
                                      "is_preferred": true}]}],
      "demandes": [{"key": "DA001", "article": "ART001", "item_label": "...",
                    "quantity": 2, "unit": "pce", "urgency": "urgent",
                    "demandeur": "T1", "le": -120, "reason": ""}],
      "commandes": [{"key": "CMD001", "fournisseur": "FOU-A", "status": "CLOSED",
                     "creee_le": -120, "commandee_le": -119, "recue_le": -117,
                     "lignes": [{"article": "ART001", "quantity": 2, "unit_price": 12.5,
                                 "quantity_received": 2, "demandes": ["DA001"]}]}]
    }

- `demandes` reprend chaque `demandes_achat` du technicien (même clé, rattachée à son
  action par le chargeur) et ajoute des demandes autonomes (réapprovisionnement) avec de
  nouvelles clés.
- Statuts de commande : `OPEN`, `SENT`, `ACK`, `RECEIVED`, `CLOSED`, `CANCELLED`.

## `RELECTURE.md` (direction)

Relecture de cohérence : le bilan raconte-t-il une histoire lisible (urgences, préventif en
avance et en retard, chantiers coupés, attente de pièces) ? Écarts au profil
(docs/spikes/0005-profil-statistique-demo.md) et corrections demandées.
