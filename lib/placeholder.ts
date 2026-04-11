/**
 * Converts raw template text (with {{placeholders}}) into HTML
 * with highlighted, clickable <span class="ph"> elements.
 */
export function templateToHtml(raw: string): string {
  // Escape HTML first (to avoid XSS in content we didn't write), then replace placeholders
  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return escaped
    .replace(
      /\{\{([^}]+)\}\}/g,
      (_, label) =>
        `<span class="ph" data-ph="${label}" title="क्लिक करके भरें — Click to fill">{{${label}}}</span>`
    )
    .replace(/\n/g, '<br />')
}
