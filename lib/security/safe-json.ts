/** Safe for embedding inside <script type="application/ld+json">.
 *  Escapes < > & so a value containing </script> cannot break out. */
export function safeJsonForScript(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
