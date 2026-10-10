# Édition sur place : rendre le focus à la ligne

Dans la fiche équipement (ADR 0012), le champ d'édition est retiré de la page après
Entrée ou Échap, et le focus clavier se perd avec lui. Il faudrait le rendre à la
ligne modifiée, mais seulement quand l'édition se termine au clavier : un clic ailleurs
ne doit pas ramener le focus. Relevé par la revue du 2026-10-10
(web/src/components/equipements/EditableProperty.jsx).
