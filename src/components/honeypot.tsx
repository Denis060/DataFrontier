/** Must match isBot()'s field name in lib/rate-limit.ts. Defined here (not
 *  imported from the server-only rate-limit module) so client forms can use it. */
export const HONEYPOT_FIELD = "company_website";

/**
 * A hidden decoy field. Kept out of the layout and out of the tab order, and
 * announced to assistive tech as hidden, so a real user never fills it — but a
 * naive bot that fills every input does. See isBot() in lib/rate-limit.
 */
export function Honeypot() {
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
      <label>
        Company website
        <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
