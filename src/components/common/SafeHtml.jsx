import { sanitizeHtml, truncateHtml } from "@/lib/utils/htmlUtils";

/**
 * Composant React pour afficher du HTML sécurisé
 * N'utilisez PAS ce composant dans un <Text> ou <p> si le HTML contient des blocs
 */
export default function SafeHtml({ html, maxLength, className, style }) {
  const safeHtml = maxLength
    ? truncateHtml(html, maxLength)
    : sanitizeHtml(html);

  return (
    <div
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}