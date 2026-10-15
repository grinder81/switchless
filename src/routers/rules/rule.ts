export interface Rule {
  /** Action id to dispatch to. */
  action: string;
  /** Every pattern must match the normalized message. */
  when: RegExp[];
  /** If this matches, the rule does not fire. */
  unless?: RegExp;
  /** Overrides specificity; higher wins. */
  priority?: number;
}

/** Shorthand: `rule("cards.activate", /activat/)`. */
export const rule = (action: string, ...when: RegExp[]): Rule => ({ action, when });
