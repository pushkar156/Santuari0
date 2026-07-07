/**
 * Sanitizes user-provided custom CSS before it is injected into a <style> tag.
 *
 * The extension renders custom CSS inside its own isolated new-tab page, so this
 * is primarily a defence-in-depth / self-XSS guard. It protects against two
 * classes of abuse if custom CSS is ever imported or synced from an untrusted
 * source:
 *
 *   1. Breaking out of the stylesheet context (e.g. injecting raw HTML).
 *   2. Exfiltrating typed values (weather API key, Spotify client id, etc.) via
 *      CSS attribute selectors + a remote background `url(...)` — the classic CSS
 *      data-exfiltration technique.
 */

const MAX_CSS_LENGTH = 50_000;

export function sanitizeCustomCSS(input: string): string {
  if (!input) return '';

  let css = input.slice(0, MAX_CSS_LENGTH);

  // 1. No raw HTML / angle brackets — prevents breaking out into markup.
  css = css.replace(/<|>/g, '');

  // 2. Strip external @-rules that can load resources or change parsing.
  css = css.replace(/@(?:import|charset|namespace)\b[^;]*;?/gi, '');

  // 3. Neutralise javascript: and expression() (legacy IE CSS execution).
  css = css.replace(/javascript:/gi, '');
  css = css.replace(/expression\s*\(/gi, 'expr\\(/*blocked*/');

  // 4. Only allow safe url() targets: data:image/... or fragment (#...) refs.
  //    Everything else (http(s)://, //, blob:, etc.) is removed so CSS cannot
  //    phone home with attribute-exfiltrated data.
  css = css.replace(
    /url\(\s*(['"]?)([^'")]*)\1\s*\)/gi,
    (match, _quote: string, body: string) => {
      const trimmed = body.trim();
      if (/^data:image\//i.test(trimmed) || trimmed.startsWith('#')) {
        return match;
      }
      return '';
    }
  );

  return css;
}
