// Phase 4 — pluggable fallback for elements that the deterministic pipeline
// (Phases 1-3) could not turn into an Elementor element despite carrying
// visible content ("holes").
//
// Design principles (see plan.md):
//  - INERT BY DEFAULT: with no provider injected, resolve() never fabricates
//    anything — it only records the hole. The pipeline stays 100% deterministic.
//  - VALIDATION GATE: any provider output MUST pass the Phase 2 knowledge-base
//    validator before being accepted; rejected keys are dropped.
//  - The provider is deliberately abstract: it can be a rules engine, a
//    lookup table, or an LLM wrapper. It receives the element payload plus a
//    compact catalog of the available widgets/controls as grounding context.
//
// A provider is a synchronous function:
//     ({ tag, text, html, attrs, kb }) => ({ widgetType, settings }) | null
// (An LLM-backed provider would pre-resolve suggestions or run against an
// async pipeline; the sync contract keeps the current pipeline deterministic.)

// Compact widget/control catalog used to ground a provider (e.g. an LLM prompt).
export function buildKbContext(kb) {
  return kb.widgets
    .filter((w) => typeof w.name === 'string')
    .map((w) => ({
      widgetType: w.name,
      controls: w.controls
        .filter((c) => c.id && typeof c.id === 'string')
        .map((c) => ({ id: c.id, type: c.type })),
    }));
}

export function createFallback({ provider = null, validator, kb } = {}) {
  const context = kb ? buildKbContext(kb) : [];
  const enabled = typeof provider === 'function';
  const holes = [];

  return {
    enabled,
    holes,
    // payload: { tag, text, html, attrs }
    // returns { widgetType, settings } accepted by the validator, or null.
    resolve(payload) {
      const record = { tag: payload.tag, text: (payload.text || '').slice(0, 120), resolved: false };

      if (!enabled) {
        holes.push(record);
        return null;
      }

      let suggestion;
      try {
        suggestion = provider({ ...payload, kb: context });
      } catch (e) {
        record.error = String(e && e.message ? e.message : e);
        holes.push(record);
        return null;
      }

      if (!suggestion || !suggestion.widgetType) {
        holes.push(record);
        return null;
      }

      const { clean, warnings } = validator.validate(suggestion.widgetType, suggestion.settings || {});
      record.resolved = true;
      record.widgetType = suggestion.widgetType;
      record.rejectedKeys = warnings.length;
      holes.push(record);
      return { widgetType: suggestion.widgetType, settings: clean };
    },
  };
}
