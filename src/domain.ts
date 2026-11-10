export type EntityKind = 'card' | 'event' | 'character' | 'faction' | 'phase' | 'stat';

export type Condition =
  | { type: 'all' | 'any'; children: Condition[] }
  | { type: 'not'; child: Condition }
  | { type: 'stat'; id: string; operator: string; value: number }
  | { type: 'phase'; operator: string; value: string }
  | { type: 'card'; id: string; operator: 'completed' | 'not_completed' }
  | { type: 'flag'; operator: string; value: string }
  | { type: 'character'; id: string; operator: string; value: string }
  | { type: 'faction'; id: string; operator: string; value: number }
  | { type: 'event'; id: string; operator: string; value: string };

export type Effect =
  | { type: 'stat'; id: string; operation: 'add' | 'set'; value: number; delayed?: number }
  | { type: 'flag'; operation: 'set' | 'remove'; value: string; delayed?: number }
  | { type: 'event'; operation: 'start' | 'end'; value: string; delayed?: number }
  | { type: 'card'; operation: 'unlock' | 'lock' | 'trigger'; value: string; delayed?: number }
  | { type: 'phase'; operation: 'change'; value: string; delayed?: number }
  | { type: 'time'; operation: 'advance' | 'set'; value: number; delayed?: number };

export type Choice = {
  id: string;
  title: string;
  text: string;
  conditions: Condition[];
  effects: Effect[];
};

export type Card = {
  id: string;
  title: string;
  artwork: string;
  situation: string;
  notes: string;
  phase?: string;
  event?: string;
  dayFrom: number;
  dayUntil?: number;
  tags: string[];
  priority: number;
  repeatable: boolean;
  conditions: Condition[];
  choices: Choice[];
};

export type Phase = { id: string; name: string; description: string; order: number; cards: string[] };
export type Stat = { id: string; name: string; displayName: string; value: number; min: number; max: number; color: string; lockedPhases: string[] };
export type Character = { id: string; name: string; role: string; faction: string; alive: boolean; loyalty: number; description: string };
export type Faction = { id: string; name: string; influence: number; loyalty: number; description: string };
export type Event = { id: string; name: string; description: string; phase: string; active: boolean; cards: string[]; conditions: Condition[] };

export type ContentModel = {
  schemaVersion: number;
  contentVersion: string;
  phases: Phase[];
  stats: Stat[];
  characters: Character[];
  factions: Faction[];
  events: Event[];
  cards: Card[];
};

export type DebugState = {
  phase: string;
  day: number;
  stats: Record<string, number>;
  flags: string[];
  activeEvents: string[];
  completedCards: string[];
  unlockedCards: string[];
  lockedCards: string[];
  queuedCardId?: string;
};

export type ValidationIssue = { severity: 'error' | 'warning'; message: string; entityId?: string; entityKind?: EntityKind };

export const phaseNames = ['Rebellion', 'Revolution', 'Fall of the Government', 'Civil War', 'Kingdom', 'Foreign War', 'Popular Uprisings', 'Governance'];

const condition = (source: Condition): Condition => source;

export const initialContent: ContentModel = {
  schemaVersion: 1,
  contentVersion: '0.1.0',
  phases: phaseNames.map((name, index) => ({ id: name.toLowerCase().replaceAll(' ', '_'), name, description: index === 0 ? 'A resistance becomes a movement.' : 'A future chapter in the political lifecycle.', order: index, cards: [] })),
  stats: [
    { id: 'popularity', name: 'Popularity', displayName: 'مقبولیت', value: 62, min: 0, max: 100, color: '#e6b85c', lockedPhases: [] },
    { id: 'legitimacy', name: 'Legitimacy', displayName: 'مشروعیت', value: 44, min: 0, max: 100, color: '#77b7a6', lockedPhases: [] },
    { id: 'military', name: 'Military', displayName: 'ارتش', value: 58, min: 0, max: 100, color: '#d88373', lockedPhases: [] },
    { id: 'money', name: 'Money', displayName: 'پول', value: 35, min: 0, max: 100, color: '#bda1d2', lockedPhases: [] },
    { id: 'nobility', name: 'Nobility', displayName: 'اشراف', value: 72, min: 0, max: 100, color: '#e6b85c', lockedPhases: [] },
    { id: 'religion', name: 'Religion', displayName: 'مذهب', value: 48, min: 0, max: 100, color: '#80a9d1', lockedPhases: [] },
    { id: 'factions', name: 'Political Factions', displayName: 'جناح های سیاسی', value: 51, min: 0, max: 100, color: '#d88373', lockedPhases: [] },
    { id: 'food', name: 'Food', displayName: 'غذا', value: 66, min: 0, max: 100, color: '#77b7a6', lockedPhases: [] },
  ],
  characters: [
    { id: 'char_general_ardan', name: 'General Ardan', role: 'Army commander', faction: 'faction_army', alive: true, loyalty: 68, description: 'A pragmatic commander who believes the movement needs order before it needs glory.' },
    { id: 'char_mara_voss', name: 'Mara Voss', role: 'Revolutionary organizer', faction: 'faction_radicals', alive: true, loyalty: 54, description: 'An uncompromising organizer with the ear of the city districts.' },
    { id: 'char_sorin', name: 'Sorin Vale', role: 'Merchant envoy', faction: 'faction_merchants', alive: true, loyalty: 42, description: 'A quiet broker who turns promises into leverage.' },
  ],
  factions: [
    { id: 'faction_army', name: 'The Army', influence: 65, loyalty: 61, description: 'The force that can win the war, or decide who rules after it.' },
    { id: 'faction_radicals', name: 'Radical Assembly', influence: 47, loyalty: 53, description: 'Street organizers demanding the revolution mean something.' },
    { id: 'faction_merchants', name: 'Merchant Council', influence: 72, loyalty: 44, description: 'Financiers who expect every favor to mature with interest.' },
  ],
  events: [
    { id: 'event_noble_conspiracy', name: 'Noble Conspiracy', description: 'The old houses test the new government for weakness.', phase: 'kingdom', active: true, cards: ['card_noble_demand'], conditions: [condition({ type: 'stat', id: 'nobility', operator: 'gt', value: 70 })] },
    { id: 'event_revolution_begins', name: 'Revolution Begins', description: 'A rebellion becomes a public break with the old regime.', phase: 'revolution', active: false, cards: ['card_secret_letters'], conditions: [condition({ type: 'stat', id: 'popularity', operator: 'gte', value: 60 })] },
  ],
  cards: [
    {
      id: 'card_noble_demand', title: 'The Noble Demand', artwork: 'assets/cards/noble_demand.png', situation: 'A delegation arrives before dawn. They offer recognition, but only if the old houses keep their privileges.', notes: 'This card should teach the author how a delayed compromise resurfaces.', phase: 'kingdom', event: 'event_noble_conspiracy', dayFrom: 120, tags: ['nobility', 'consequence'], priority: 7, repeatable: false, conditions: [],
      choices: [
        { id: 'choice_accept_privileges', title: 'Choice A', text: 'Keep their privileges', conditions: [], effects: [{ type: 'stat', id: 'legitimacy', operation: 'add', value: -8 }, { type: 'stat', id: 'nobility', operation: 'add', value: 14 }, { type: 'flag', operation: 'set', value: 'nobility_entrenched' }] },
        { id: 'choice_refuse_houses', title: 'Choice B', text: 'Refuse the old houses', conditions: [condition({ type: 'stat', id: 'military', operator: 'gte', value: 55 })], effects: [{ type: 'stat', id: 'popularity', operation: 'add', value: 8 }, { type: 'stat', id: 'legitimacy', operation: 'add', value: -4 }, { type: 'event', operation: 'start', value: 'event_noble_conspiracy', delayed: 7 }] },
      ],
    },
    {
      id: 'card_secret_letters', title: 'Strange Letters', artwork: 'assets/cards/strange_letters.png', situation: 'Sorin brings a bundle of letters sealed with the mark of three merchant houses. They want a promise before they move their money.', notes: 'A small promise now can become a government crisis later.', phase: 'revolution', dayFrom: 18, tags: ['merchants', 'delayed'], priority: 5, repeatable: false, conditions: [],
      choices: [
        { id: 'choice_accept_merchants', title: 'Choice A', text: 'Promise them a monopoly', conditions: [], effects: [{ type: 'stat', id: 'money', operation: 'add', value: 30 }, { type: 'flag', operation: 'set', value: 'merchant_monopoly_promised' }, { type: 'card', operation: 'unlock', value: 'card_merchant_demand', delayed: 60 }] },
        { id: 'choice_refuse_merchants', title: 'Choice B', text: 'Refuse to be bought', conditions: [], effects: [{ type: 'stat', id: 'legitimacy', operation: 'add', value: 5 }, { type: 'stat', id: 'money', operation: 'add', value: -12 }] },
      ],
    },
    {
      id: 'card_generals_warning', title: "The General's Warning", artwork: 'assets/cards/generals_warning.png', situation: 'Ardan says the city gates will not hold through another week of hunger. He asks for authority to requisition food.', notes: 'A pressure card with a visible stat trade-off.', phase: 'rebellion', dayFrom: 7, tags: ['army', 'food'], priority: 9, repeatable: true, conditions: [],
      choices: [
        { id: 'choice_requisition', title: 'Choice A', text: 'Give the army what it needs', conditions: [condition({ type: 'stat', id: 'military', operator: 'lt', value: 70 })], effects: [{ type: 'stat', id: 'military', operation: 'add', value: 10 }, { type: 'stat', id: 'food', operation: 'add', value: -12 }] },
        { id: 'choice_feed_city', title: 'Choice B', text: 'Feed the city first', conditions: [], effects: [{ type: 'stat', id: 'popularity', operation: 'add', value: 7 }, { type: 'stat', id: 'military', operation: 'add', value: -6 }] },
      ],
    },
  ],
};

export const initialDebugState: DebugState = {
  phase: 'kingdom',
  day: 143,
  stats: Object.fromEntries(initialContent.stats.map((stat) => [stat.id, stat.value])),
  flags: ['merchant_monopoly_promised'],
  activeEvents: ['event_noble_conspiracy'],
  completedCards: [],
  unlockedCards: [],
  lockedCards: [],
};

export function clone<T>(value: T): T {
  return structuredClone(value);
}

export function normalizeContent(value: ContentModel): ContentModel {
  return {
    ...value,
    stats: (value.stats ?? []).map((stat) => ({ ...stat, lockedPhases: stat.lockedPhases ?? [] })),
    cards: (value.cards ?? []).map((card) => ({
      ...card,
      phase: card.phase || undefined,
      tags: card.tags ?? [],
      priority: Math.max(0, Math.min(10, Number(card.priority ?? 5))),
      conditions: card.conditions ?? [],
      choices: (card.choices ?? []).map((choice, index) => ({ ...choice, title: choice.title?.trim() || `Choice ${index === 0 ? 'A' : 'B'}`, conditions: choice.conditions ?? [], effects: choice.effects ?? [] })),
    })),
  };
}

export function priorityLabel(priority: number): string {
  const value = Math.max(0, Math.min(10, priority));
  if (value >= 9) return 'Critical';
  if (value >= 7) return 'High';
  if (value >= 4) return 'Normal';
  return 'Low';
}

export function priorityDescription(priority: number): string {
  return `Priority ${Math.max(0, Math.min(10, priority))}/10 · ${priorityLabel(priority)} selection preference. It only breaks ties between eligible cards; phase, day, and conditions still gate availability.`;
}

export function validateContent(content: ContentModel): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const phaseIds = new Set(content.phases.map((item) => item.id));
  const statIds = new Set(content.stats.map((item) => item.id));
  const eventIds = new Set(content.events.map((item) => item.id));
  const cardIds = new Set(content.cards.map((item) => item.id));
  content.cards.forEach((card) => {
    if (!card.id || !card.title) issues.push({ severity: 'error', message: 'Card is missing an ID or title.', entityId: card.id, entityKind: 'card' });
    if (card.phase && !phaseIds.has(card.phase)) issues.push({ severity: 'error', message: `Phase reference “${card.phase}” does not exist.`, entityId: card.id, entityKind: 'card' });
    if (card.event && !eventIds.has(card.event)) issues.push({ severity: 'error', message: `Event reference “${card.event}” does not exist.`, entityId: card.id, entityKind: 'card' });
    if (card.choices.length < 2) issues.push({ severity: 'error', message: 'Card needs two choices for swipe-left and swipe-right.', entityId: card.id, entityKind: 'card' });
    if (!card.artwork) issues.push({ severity: 'warning', message: 'Card has no artwork reference.', entityId: card.id, entityKind: 'card' });
    if (card.dayUntil !== undefined && card.dayUntil < card.dayFrom) issues.push({ severity: 'error', message: 'Availability window ends before it begins.', entityId: card.id, entityKind: 'card' });
    card.choices.forEach((choice) => choice.effects.forEach((effect) => {
      if (effect.type === 'stat' && !statIds.has(effect.id)) issues.push({ severity: 'error', message: `Effect references missing stat “${effect.id}”.`, entityId: card.id, entityKind: 'card' });
      if (effect.type === 'event' && !eventIds.has(effect.value)) issues.push({ severity: 'error', message: `Effect references missing event “${effect.value}”.`, entityId: card.id, entityKind: 'card' });
      if (effect.type === 'card' && !cardIds.has(effect.value)) issues.push({ severity: 'warning', message: `Follow-up card “${effect.value}” is not authored yet.`, entityId: card.id, entityKind: 'card' });
    }));
    card.conditions.forEach((condition) => {
      if (condition.type === 'card' && !cardIds.has(condition.id)) issues.push({ severity: 'error', message: `Card dependency references missing card “${condition.id}”.`, entityId: card.id, entityKind: 'card' });
    });
  });
  content.events.forEach((event) => {
    if (!phaseIds.has(event.phase)) issues.push({ severity: 'error', message: `Event references missing phase “${event.phase}”.`, entityId: event.id, entityKind: 'event' });
    if (event.cards.length === 0) issues.push({ severity: 'warning', message: 'Event has no cards attached.', entityId: event.id, entityKind: 'event' });
  });
  content.characters.forEach((character) => {
    if (!character.name) issues.push({ severity: 'error', message: 'Character is missing a name.', entityId: character.id, entityKind: 'character' });
  });
  return issues;
}

export function applyEffects(state: DebugState, effects: Effect[], content?: ContentModel): { state: DebugState; diff: string[]; scheduled: string[]; negated: string[] } {
  const next = clone(state);
  const diff: string[] = [];
  const scheduled: string[] = [];
  const negated: string[] = [];
  effects.forEach((effect) => {
    if (effect.delayed !== undefined && effect.delayed > 0) {
      scheduled.push(`${effect.type} · day +${effect.delayed}`);
      return;
    }
    if (effect.type === 'stat') {
      const stat = content?.stats.find((item) => item.id === effect.id);
      if (stat?.lockedPhases.includes(next.phase)) {
        negated.push(`${stat.name} unchanged · locked in ${labelForId(next.phase)}`);
        return;
      }
      const before = next.stats[effect.id] ?? 0;
      next.stats[effect.id] = effect.operation === 'set' ? effect.value : before + effect.value;
      diff.push(`${effect.id} ${before} → ${next.stats[effect.id]} (${effect.operation === 'set' ? 'set' : `${effect.value > 0 ? '+' : ''}${effect.value}`})`);
    } else if (effect.type === 'flag') {
      if (effect.operation === 'set' && !next.flags.includes(effect.value)) next.flags.push(effect.value);
      if (effect.operation === 'remove') next.flags = next.flags.filter((flag) => flag !== effect.value);
      diff.push(`${effect.operation === 'set' ? 'flag set' : 'flag removed'} · ${effect.value}`);
    } else if (effect.type === 'event') {
      if (effect.operation === 'start' && !next.activeEvents.includes(effect.value)) next.activeEvents.push(effect.value);
      if (effect.operation === 'end') next.activeEvents = next.activeEvents.filter((event) => event !== effect.value);
      diff.push(`${effect.operation === 'start' ? 'event started' : 'event ended'} · ${effect.value}`);
    } else if (effect.type === 'phase') {
      diff.push(`phase ${next.phase} → ${effect.value}`);
      next.phase = effect.value;
    } else if (effect.type === 'time') {
      const before = next.day;
      next.day = effect.operation === 'set' ? effect.value : before + effect.value;
      diff.push(`day ${before} → ${next.day}`);
    } else if (effect.type === 'card') {
      if (effect.operation === 'unlock') {
        if (!next.unlockedCards.includes(effect.value)) next.unlockedCards.push(effect.value);
        next.lockedCards = next.lockedCards.filter((id) => id !== effect.value);
      }
      if (effect.operation === 'lock') {
        next.lockedCards = next.lockedCards.includes(effect.value) ? next.lockedCards : [...next.lockedCards, effect.value];
        next.unlockedCards = next.unlockedCards.filter((id) => id !== effect.value);
        if (next.queuedCardId === effect.value) next.queuedCardId = undefined;
      }
      if (effect.operation === 'trigger') {
        if (!next.unlockedCards.includes(effect.value)) next.unlockedCards.push(effect.value);
        next.lockedCards = next.lockedCards.filter((id) => id !== effect.value);
        next.queuedCardId = effect.value;
      }
      diff.push(`${effect.operation} card · ${effect.value}`);
    }
  });
  return { state: next, diff, scheduled, negated };
}

export function labelForId(id: string): string {
  return id.replace(/^\w+_/, '').replaceAll('_', ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}
