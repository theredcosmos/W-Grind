/** Words of a recipe card (task, note, cost, code), for the reading window's filter. */
export const recipeText = (r) => [r.task, r.note, r.cost, r.code].filter(Boolean).join(' ').toLowerCase();

/** True when every word of `filter` appears in `text`. */
export const matchesFilter = (text, filter) => filter.toLowerCase().split(/\s+/).filter(Boolean).every((w) => text.includes(w));
