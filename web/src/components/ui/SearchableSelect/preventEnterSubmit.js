/**
 * Empêche la touche Entrée de soumettre un formulaire englobant.
 * À brancher en onKeyDownCapture sur le conteneur d'un formulaire embarqué.
 */
export function preventEnterSubmit(event) {
  if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
    event.preventDefault();
  }
}
