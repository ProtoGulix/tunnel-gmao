# Constat : notification de la demande aux techniciens

La demande issue d'un constat est d'origine « signalée » : fn_notify_di_a_traiter notifie tous
les TECH (« X demande une intervention sur … »), pas le référent RESP ou ADMIN qui la tranche.
Idée : ne pas notifier les techniciens, marquer ces demandes dans la liste (filtre « Issues de
constats ») pour un tri en lot. Revue du 2026-11-26 (ADR 0045, point D), jugé le plus urgent.
