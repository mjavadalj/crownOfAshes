import cathedralArtwork from '../game/assets/cards/temp.png';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  applyEffects,
  clone,
  initialContent,
  initialDebugState,
  labelForId,
  normalizeContent,
  priorityDescription,
  priorityLabel,
  type Card,
  type Choice,
  type Condition,
  type ContentModel,
  type DebugState,
  type Effect,
  type EntityKind,
  type Event as ContentEvent,
  type Phase,
  type Stat,
  validateContent,
} from './domain';

type Section = 'dashboard' | 'cards' | 'content' | 'graph' | 'timeline' | 'debug' | 'validation';
type Tab = { kind: EntityKind | 'graph' | 'timeline'; id: string; label: string };

const icons: Record<string, string> = {
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  card: 'M4 3.5h16a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 19V5A1.5 1.5 0 0 1 4 3.5Zm2.5 4h11M6.5 12h5M6.5 15.5h8',
  search: 'm20 20-3.9-3.9m1.4-5.1a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z',
  plus: 'M12 5v14M5 12h14',
  close: 'm7 7 10 10M17 7 7 17',
  play: 'm8 5 10 7-10 7V5Z',
  graph: 'M5 18V8m0 10h14M5 14l5-5 4 3 5-7',
  timeline: 'M4 7h16M4 12h11M4 17h7M7 4v3M17 12v5',
  check: 'm5 12 4 4L19 6',
  alert: 'M12 4 21 20H3L12 4Zm0 6v4m0 3v.01',
  download: 'M12 4v11m0 0 4-4m-4 4-4-4M5 20h14',
  upload: 'M12 20V9m0 0 4 4m-4-4-4 4M5 4h14',
  undo: 'M9 7 4 12l5 5M5 12h8a5 5 0 1 1 0 10h-1',
  wand: 'm15 4 5 5M3 21l11-11m-1-6 2 2m-8 5 2 2',
  database: 'M4 6c0-2 4-3 8-3s8 1 8 3-4 3-8 3-8-1-8-3Zm0 0v6c0 2 4 3 8 3s8-1 8-3V6m-16 6v6c0 2 4 3 8 3s8-1 8-3v-6',
};

function Icon({ name, size = 16 }: { name: string; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={icons[name] ?? icons.grid} /></svg>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function App() {
  const [content, setContent] = useState<ContentModel>(() => {
    const saved = localStorage.getItem('coa-content');
    if (!saved) return clone(initialContent);
    try {
      return normalizeContent(JSON.parse(saved) as ContentModel);
    } catch {
      return clone(initialContent);
    }
  });
  const [debugState, setDebugState] = useState<DebugState>(() => clone(initialDebugState));
  const [section, setSection] = useState<Section>('dashboard');
  const [cardsMode, setCardsMode] = useState<'directory' | 'editor'>('directory');
  const [selected, setSelected] = useState<{ kind: EntityKind; id: string }>({ kind: 'card', id: 'card_noble_demand' });
  const [tabs, setTabs] = useState<Tab[]>([{ kind: 'card', id: 'card_noble_demand', label: 'The Noble Demand' }]);
  const [activeTab, setActiveTab] = useState('card_noble_demand');
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState(true);
  const [toast, setToast] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);
  const issues = useMemo(() => validateContent(content), [content]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    localStorage.setItem('coa-content', JSON.stringify(content));
    setSaved(true);
  }, [content]);

  const card = selected.kind === 'card' ? content.cards.find((item) => item.id === selected.id) : undefined;
  const openEntity = (kind: EntityKind, id: string) => {
    const collection = content[`${kind}s` as keyof ContentModel] as Array<{ id: string; name?: string; title?: string }>;
    const entity = collection?.find((item) => item.id === id);
    const label = entity?.title ?? entity?.name ?? labelForId(id);
    setSelected({ kind, id });
    setSection(kind === 'card' ? 'cards' : 'content');
    if (kind === 'card') setCardsMode('editor');
    setActiveTab(id);
    setTabs((current) => current.some((tab) => tab.id === id) ? current : [...current, { kind, id, label }]);
  };

  const updateCard = (patch: Partial<Card>) => {
    if (!card) return;
    const eventChanged = Object.prototype.hasOwnProperty.call(patch, 'event');
    setContent((current) => ({
      ...current,
      events: eventChanged ? current.events.map((event) => ({
        ...event,
        cards: patch.event === event.id
          ? event.cards.includes(card.id) ? event.cards : [...event.cards, card.id]
          : event.cards.filter((cardId) => cardId !== card.id),
      })) : current.events,
      cards: current.cards.map((item) => item.id === card.id ? { ...item, ...patch } : item),
    }));
    setSaved(false);
  };

  const updateChoice = (choiceId: string, patch: Partial<Choice>) => {
    if (!card) return;
    updateCard({ choices: card.choices.map((choice) => choice.id === choiceId ? { ...choice, ...patch } : choice) });
    const followUpTargets = (patch.effects ?? []).filter((effect): effect is Extract<Effect, { type: 'card' }> => effect.type === 'card' && effect.operation !== 'lock');
    if (followUpTargets.length) setContent((current) => ({
      ...current,
      cards: current.cards.map((item) => followUpTargets.some((effect) => effect.value === item.id) && !item.conditions.some((condition) => condition.type === 'card' && condition.id === card.id && condition.operator === 'completed')
        ? { ...item, conditions: [...item.conditions, { type: 'card', id: card.id, operator: 'completed' }] }
        : item),
    }));
  };

  const save = () => {
    localStorage.setItem('coa-content', JSON.stringify(content));
    setSaved(true);
    setToast('Project saved locally');
  };

  const exportContent = () => {
    if (issues.some((issue) => issue.severity === 'error')) {
      setSection('validation');
      setToast('Resolve validation errors before export');
      return;
    }
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `crown-of-ashes-content-${content.contentVersion}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setToast('Deterministic content export ready');
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isRecord(parsed)) throw new Error('The file is not a JSON object.');
      const candidate = { ...clone(initialContent), ...parsed } as ContentModel;
      const collections = ['phases', 'stats', 'characters', 'factions', 'events', 'cards'] as const;
      if (collections.some((key) => !Array.isArray(candidate[key]))) {
        throw new Error('The file is missing one or more content collections.');
      }
      if (!window.confirm('Import this project and replace the current editor content?')) return;

      const restored = normalizeContent(candidate);
      setContent(restored);
      setSaved(false);
      const firstCard = restored.cards[0];
      if (firstCard) {
        setSelected({ kind: 'card', id: firstCard.id });
        setTabs([{ kind: 'card', id: firstCard.id, label: firstCard.title }]);
        setActiveTab(firstCard.id);
        setSection('cards');
        setCardsMode('editor');
      } else {
        setSection('dashboard');
        setCardsMode('directory');
        setTabs([]);
        setActiveTab('');
      }
      setToast(`Imported ${restored.cards.length} cards and saved the project locally`);
    } catch {
      setToast('Import failed — choose a valid Crown of Ashes JSON export');
    }
  };

  const createCard = () => {
    const stamp = Date.now();
    const newCard: Card = { id: `card_new_${stamp}`, title: 'Untitled Card', artwork: '', situation: 'Write the situation here.', notes: '', phase: 'rebellion', dayFrom: 1, tags: ['draft'], priority: 5, repeatable: false, conditions: [], choices: [{ id: `choice_left_${stamp}`, title: 'Choice A', text: 'Choice A', conditions: [], effects: [] }, { id: `choice_right_${stamp}`, title: 'Choice B', text: 'Choice B', conditions: [], effects: [] }] };
    setContent((current) => ({ ...current, cards: [newCard, ...current.cards] }));
    setSaved(false);
    openEntity('card', newCard.id);
    setToast('New card opened');
  };

  const browseCards = () => {
    setSection('cards');
    setCardsMode('directory');
    setActiveTab('cards');
  };

  const deleteCard = (id: string) => {
    const target = content.cards.find((item) => item.id === id);
    if (!target || !window.confirm(`Delete “${target.title}”? This cannot be undone.`)) return;
    const remaining = content.cards.filter((item) => item.id !== id);
    setContent((current) => ({
      ...current,
      phases: current.phases.map((phase) => ({ ...phase, cards: phase.cards.filter((cardId) => cardId !== id) })),
      events: current.events.map((event) => ({ ...event, cards: event.cards.filter((cardId) => cardId !== id) })),
      cards: remaining.map((card) => ({ ...card, conditions: card.conditions.filter((condition) => condition.type !== 'card' || condition.id !== id) })),
    }));
    setTabs((current) => current.filter((tab) => tab.id !== id));
    if (selected.id === id) {
      const next = remaining[0];
      if (next) {
        setSelected({ kind: 'card', id: next.id });
        setActiveTab(next.id);
        setCardsMode('editor');
      } else {
        setCardsMode('directory');
        setActiveTab('cards');
      }
    }
    setSection('cards');
    setSaved(false);
    setToast('Card deleted');
  };

  const updatePhase = (id: string, patch: Partial<Phase>) => {
    setContent((current) => ({ ...current, phases: current.phases.map((phase) => phase.id === id ? { ...phase, ...patch } : phase) }));
    setSaved(false);
  };

  const updateStat = (id: string, patch: Partial<Stat>) => {
    setContent((current) => ({ ...current, stats: current.stats.map((stat) => stat.id === id ? { ...stat, ...patch } : stat) }));
    setSaved(false);
  };

  const updateEvent = (id: string, patch: Partial<ContentEvent>) => {
    setContent((current) => ({ ...current, events: current.events.map((event) => event.id === id ? { ...event, ...patch } : event) }));
    if (patch.name) setTabs((current) => current.map((tab) => tab.id === id ? { ...tab, label: patch.name! } : tab));
    setSaved(false);
  };

  const createPhase = () => {
    const phase: Phase = { id: `phase_new_${content.phases.length + 1}`, name: 'New Phase', description: 'Describe the political pressure in this phase.', order: content.phases.length, cards: [] };
    setContent((current) => ({ ...current, phases: [...current.phases, phase] }));
    setSelected({ kind: 'phase', id: phase.id });
    setActiveTab(phase.id);
    setTabs((current) => [...current, { kind: 'phase', id: phase.id, label: phase.name }]);
    setSaved(false);
    setSection('content');
    setToast('New phase opened');
  };

  const createEvent = () => {
    const stamp = Date.now();
    const event: ContentEvent = {
      id: `event_new_${stamp}`,
      name: 'New Event',
      description: 'Describe the pressure this event brings into the story.',
      phase: content.phases[0]?.id ?? 'rebellion',
      active: false,
      cards: [],
      conditions: [],
    };
    setContent((current) => ({ ...current, events: [event, ...current.events] }));
    setSelected({ kind: 'event', id: event.id });
    setActiveTab(event.id);
    setTabs((current) => [...current, { kind: 'event', id: event.id, label: event.name }]);
    setSaved(false);
    setSection('content');
    setToast('New event opened');
  };

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const needle = query.toLowerCase();
    return [
      ...content.cards.map((item) => ({ kind: 'card' as const, id: item.id, label: item.title, detail: item.situation })),
      ...content.events.map((item) => ({ kind: 'event' as const, id: item.id, label: item.name, detail: item.description })),
      ...content.characters.map((item) => ({ kind: 'character' as const, id: item.id, label: item.name, detail: item.role })),
      ...content.factions.map((item) => ({ kind: 'faction' as const, id: item.id, label: item.name, detail: 'Faction' })),
      ...content.phases.map((item) => ({ kind: 'phase' as const, id: item.id, label: item.name, detail: 'Phase' })),
    ].filter((item) => `${item.label} ${item.detail}`.toLowerCase().includes(needle)).slice(0, 8);
  }, [content, query]);

  const renderWorkspace = () => {
    if (section === 'dashboard') return <Dashboard content={content} issues={issues} onCreateCard={createCard} onSection={setSection} onBrowseCards={browseCards} />;
    if (section === 'graph') return <GraphView content={content} onOpen={openEntity} />;
    if (section === 'timeline') return <TimelineView content={content} onOpen={openEntity} />;
    if (section === 'debug') return <DebugView content={content} state={debugState} setState={setDebugState} onOpen={openEntity} />;
    if (section === 'validation') return <ValidationView issues={issues} onOpen={openEntity} />;
    if (section === 'content') return <ContentEditor content={content} selected={selected} onOpen={openEntity} onUpdatePhase={updatePhase} onUpdateStat={updateStat} onCreatePhase={createPhase} onUpdateEvent={updateEvent} onCreateEvent={createEvent} />;
    if (cardsMode === 'directory') return <CardsDirectory content={content} query={query} onQuery={setQuery} onOpen={openEntity} onCreate={createCard} onDelete={deleteCard} />;
    if (!card) return <EmptyWorkspace label="Choose a card from the content browser" />;
    return <CardEditor card={card} content={content} onUpdate={updateCard} onChoiceUpdate={updateChoice} onOpen={openEntity} onSimulate={(choice) => { const result = applyEffects(debugState, choice.effects, content); setDebugState(result.state); setSection('debug'); setToast(`${choice.text} simulated against the debug state`); }} />;
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark"><span className="brand-sigil">C</span><div><strong>Crown of Ashes</strong><small>NARRATIVE AUTHORING EDITOR</small></div></div>
        <nav className="primary-nav" aria-label="Primary navigation">
          <button className={section === 'dashboard' ? 'nav-active' : ''} onClick={() => setSection('dashboard')}><Icon name="grid" /> Project</button>
          <button className={section === 'debug' ? 'nav-active' : ''} onClick={() => setSection('debug')}><Icon name="play" /> Play</button>
          <button className={section === 'debug' ? 'nav-active' : ''} onClick={() => setSection('debug')}><Icon name="wand" /> Debug</button>
          <button className={section === 'validation' ? 'nav-active' : ''} onClick={() => setSection('validation')}><Icon name="check" /> Validate</button>
        </nav>
        <div className="top-actions">
          <div className="global-search"><Icon name="search" size={15} /><input aria-label="Global search" placeholder="Search content…" value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>⌘ K</kbd></div>
          <input ref={importInputRef} className="file-input-hidden" type="file" accept="application/json,.json" onChange={handleImport} aria-label="Import Crown of Ashes JSON" />
          <button className="button button-quiet" onClick={() => importInputRef.current?.click()}><Icon name="upload" /> Import</button>
          <button className="button button-quiet" onClick={exportContent}><Icon name="download" /> Export</button>
          <button className="button button-primary" onClick={save}><Icon name="database" /> {saved ? 'Autosaved' : 'Saving…'}</button>
        </div>
        {searchResults.length > 0 && <div className="search-popover">{searchResults.map((result) => <button key={result.id} onClick={() => { openEntity(result.kind, result.id); setQuery(''); }}><span className="result-kind">{result.kind}</span><span><strong>{result.label}</strong><small>{result.detail}</small></span><span className="result-arrow">→</span></button>)}</div>}
      </header>

      <div className="workspace-grid">
        <aside className="content-browser">
          <div className="panel-heading"><div><span className="overline">CONTENT</span><h2>Browser</h2></div><button className="icon-button" aria-label="Create card" onClick={createCard}><Icon name="plus" /></button></div>
          <div className="browser-project"><span className="project-dot" /><div><strong>Rebellion to Kingdom</strong><small>Content v{content.contentVersion}</small></div><span className="caret">⌄</span></div>
          <div className="browser-list">
            <BrowserGroup title="World" items={[['phase', 'Phases', content.phases.length], ['stat', 'Stats', content.stats.length], ['character', 'Characters', content.characters.length], ['faction', 'Factions', content.factions.length], ['event', 'Events', content.events.length]]} selected={selected} onSelect={openEntity} content={content} />
            <BrowserGroup title="Narrative" items={[['card', 'Cards', content.cards.length]]} selected={selected} onSelect={openEntity} onBrowse={browseCards} content={content} />
          </div>
          <div className="browser-footer"><button onClick={() => setSection('graph')}><Icon name="graph" /> Story Graph <span>↗</span></button><button onClick={() => setSection('timeline')}><Icon name="timeline" /> Timeline <span>↗</span></button></div>
        </aside>

        <main className="main-workspace">
          <div className="tab-strip">
            <div className="breadcrumbs"><span>Project</span><b>/</b><span className="crumb-current">{section === 'dashboard' ? 'Overview' : section === 'cards' && card ? card.title : section[0].toUpperCase() + section.slice(1)}</span></div>
            <div className="open-tabs">{tabs.map((tab) => <button key={tab.id} className={activeTab === tab.id && selected.id === tab.id ? 'tab-active' : ''} onClick={() => { setActiveTab(tab.id); if (tab.kind === 'graph') setSection('graph'); else if (tab.kind === 'timeline') setSection('timeline'); else openEntity(tab.kind, tab.id); }}>{tab.label}<span onClick={(event) => { event.stopPropagation(); setTabs((current) => current.filter((item) => item.id !== tab.id)); }}>×</span></button>)}</div>
          </div>
          <div className="workspace-content">{renderWorkspace()}</div>
        </main>

        <Inspector content={content} selected={selected} card={card} issues={issues} onOpen={openEntity} onUpdateCard={updateCard} />
      </div>
      <footer className="statusbar"><div className="status-left"><span className="status-live" /><span>Local project</span><span className="status-divider" /><span>Autosave {saved ? 'synced' : 'pending'}</span></div><div className="status-right"><button onClick={() => setSection('validation')}><span className={issues.filter((issue) => issue.severity === 'error').length ? 'status-error' : 'status-ok'}><Icon name="check" size={13} /> {issues.filter((issue) => issue.severity === 'error').length} Errors</span><span className="status-warning"><Icon name="alert" size={13} /> {issues.filter((issue) => issue.severity === 'warning').length} Warnings</span></button><span className="status-divider" /><span>Schema {content.schemaVersion}</span></div></footer>
      {toast && <div className="toast"><Icon name="check" />{toast}</div>}
    </div>
  );
}

function BrowserGroup({ title, items, selected, onSelect, onBrowse, content }: { title: string; items: Array<[EntityKind, string, number]>; selected: { kind: EntityKind; id: string }; onSelect: (kind: EntityKind, id: string) => void; onBrowse?: () => void; content: ContentModel }) {
  return <section className="browser-group"><div className="group-label"><span>{title}</span><span className="group-line" /></div>{items.map(([kind, label, count]) => <button key={kind} className={selected.kind === kind ? 'browser-item browser-item-active' : 'browser-item'} onClick={() => { if (kind === 'card' && onBrowse) { onBrowse(); return; } const first = (content[`${kind}s` as keyof ContentModel] as Array<{ id: string }>)[0]; if (first) onSelect(kind, first.id); }}><span className={`entity-icon entity-${kind}`}><Icon name={kind === 'card' ? 'card' : kind === 'event' ? 'timeline' : kind === 'phase' ? 'graph' : kind === 'stat' ? 'database' : 'grid'} size={14} /></span><span>{label}</span><em>{count}</em></button>)}</section>;
}

function CardsDirectory({ content, query, onQuery, onOpen, onCreate, onDelete }: { content: ContentModel; query: string; onQuery: (value: string) => void; onOpen: (kind: EntityKind, id: string) => void; onCreate: () => void; onDelete: (id: string) => void }) {
  const needle = query.trim().toLowerCase();
  const cards = content.cards.filter((card) => `${card.title} ${card.situation} ${card.tags.join(' ')} ${card.phase ?? 'general'}`.toLowerCase().includes(needle));
  return <div className="cards-directory"><div className="tool-view-heading"><div><span className="overline">NARRATIVE / CARDS</span><h1>Card library</h1><p>Every authored card in one place. Open a tile to edit it, or remove an unused draft.</p></div><button className="button button-primary" onClick={onCreate}><Icon name="plus" /> New card</button></div><div className="directory-toolbar"><label className="directory-search"><Icon name="search" size={14} /><input aria-label="Filter cards" placeholder="Filter by title, situation, or tag…" value={query} onChange={(event) => onQuery(event.target.value)} /></label><span>{cards.length} of {content.cards.length} cards</span></div>{cards.length ? <div className="card-tile-grid">{cards.map((card) => <article className="card-tile" key={card.id}><div className="card-tile-top"><span className="card-tile-kind">CARD</span><span className={`priority-dot priority-${priorityLabel(card.priority).toLowerCase()}`} title={priorityDescription(card.priority)} /></div><button className="card-tile-open" onClick={() => onOpen('card', card.id)}><h2>{card.title}</h2><p>{card.situation}</p></button><div className="card-tile-meta"><span>{card.phase ? labelForId(card.phase) : 'General card'}</span><span>Priority {card.priority}/10</span></div><div className="card-tile-tags">{card.tags.length ? card.tags.map((tag) => <span className="tag tag-muted" key={tag}>{tag}</span>) : <span className="card-tile-empty">No tags</span>}{card.repeatable && <span className="tag tag-teal">Recurring</span>}</div><div className="card-tile-actions"><button className="text-button" onClick={() => onOpen('card', card.id)}>Edit card ↗</button><button className="text-button danger-button" onClick={() => onDelete(card.id)}>Delete</button></div></article>)}</div> : <div className="directory-empty"><Icon name="card" size={22} /><h2>{content.cards.length ? 'No cards match that filter' : 'Your card library is empty'}</h2><p>{content.cards.length ? 'Try a different title or tag.' : 'Create a card to start authoring the narrative.'}</p>{!content.cards.length && <button className="button button-primary" onClick={onCreate}><Icon name="plus" /> Create first card</button>}</div>}</div>;
}

function Dashboard({ content, issues, onCreateCard, onSection, onBrowseCards }: { content: ContentModel; issues: ReturnType<typeof validateContent>; onCreateCard: () => void; onSection: (section: Section) => void; onBrowseCards: () => void }) {
  return <div className="dashboard-view"><div className="dashboard-hero"><div><span className="overline">PROJECT OVERVIEW</span><h1>Shape the story<br /><em>before it plays.</em></h1><p>Author stateful decisions, trace their consequences, and test every branch of the political lifecycle.</p><div className="hero-actions"><button className="button button-primary" onClick={onCreateCard}><Icon name="plus" /> New card</button><button className="button button-outline" onClick={() => onSection('debug')}><Icon name="play" /> Open debug mode</button></div></div><div className="hero-seal"><span>COA</span><small>SCHEMA<br />v{content.schemaVersion}</small></div></div><div className="metric-row">{[['Cards', content.cards.length, 'card'], ['Events', content.events.length, 'timeline'], ['Characters', content.characters.length, 'grid'], ['Warnings', issues.filter((i) => i.severity === 'warning').length, 'alert']].map(([label, value, icon]) => <div className="metric" key={label as string}><Icon name={icon as string} /><span><strong>{value as number}</strong><small>{label as string}</small></span></div>)}</div><div className="dashboard-columns"><section className="dashboard-panel workflow-panel"><div className="section-heading"><div><span className="overline">AUTHORING FLOW</span><h2>Keep the thread visible</h2></div><span className="subtle">5 of 8 steps</span></div>{[['01', 'Build the world', 'Phases · stats · factions', true], ['02', 'Write the pressure', 'Events · characters · cards', true], ['03', 'Add the turn', 'Conditions · effects', false], ['04', 'Trace the consequence', 'Graph · timeline · dependencies', false], ['05', 'Playtest the branch', 'Debug states · simulation', false]].map(([number, title, detail, done]) => <button className={done ? 'workflow-row workflow-done' : 'workflow-row'} key={number as string} onClick={() => title === 'Playtest the branch' && onSection('debug')}><span className="workflow-number">{number}</span><span><strong>{title as string}</strong><small>{detail as string}</small></span><span className="workflow-state">{done ? 'Done' : 'Open'} {done ? '✓' : '→'}</span></button>)}</section><section className="dashboard-panel recent-panel"><div className="section-heading"><div><span className="overline">RECENT WORK</span><h2>Last touched</h2></div><button className="text-button" onClick={onBrowseCards}>View all →</button></div><div className="recent-list">{content.cards.slice(0, 3).map((item, index) => <button className="recent-row" key={item.id} onClick={() => onBrowseCards()}><span className="recent-index">0{index + 1}</span><span><strong>{item.title}</strong><small>Card · {item.phase ? labelForId(item.phase) : 'General card'}</small></span><span className="recent-time">{index === 0 ? '2m ago' : `${index + 1}h ago`}</span></button>)}</div><div className="commit-note"><span className="status-live" /><span><strong>Local draft</strong> · autosave is on</span></div></section></div></div>;
}

function StatsEditor({ content, selectedId, onOpen, onUpdate }: { content: ContentModel; selectedId: string; onOpen: (kind: EntityKind, id: string) => void; onUpdate: (id: string, patch: Partial<Stat>) => void }) {
  const stat = content.stats.find((item) => item.id === selectedId) ?? content.stats[0];
  if (!stat) return <EmptyWorkspace label="Create your first stat" />;
  return <div className="content-directory stats-directory"><div className="tool-view-heading"><div><span className="overline">WORLD / STATS</span><h1>Stats</h1><p>Define the values that shape the political state and decide which phases allow them to change.</p></div></div><div className="stats-editor-layout"><aside className="stats-list"><div className="list-heading"><span>ALL STATS</span><small>{content.stats.length} total</small></div>{content.stats.map((item) => <button key={item.id} className={item.id === stat.id ? 'stat-list-item stat-list-active' : 'stat-list-item'} onClick={() => onOpen('stat', item.id)}><span className="stat-color" style={{ background: item.color }} /><span><strong>{item.name}</strong><small>{item.lockedPhases.length ? `${item.lockedPhases.length} locked phases` : 'Changes allowed everywhere'}</small></span><span className="phase-arrow">→</span></button>)}</aside><section className="stat-detail"><div className="phase-detail-top"><div><span className="overline">STAT PROPERTIES</span><h2>{stat.name}</h2></div><span className="tag tag-teal">Editable</span></div><div className="stat-form"><label className="field-label">ID<input value={stat.id} readOnly /></label><label className="field-label">Name<input value={stat.name} onChange={(event) => onUpdate(stat.id, { name: event.target.value })} /></label><label className="field-label">Display name<input value={stat.displayName} onChange={(event) => onUpdate(stat.id, { displayName: event.target.value })} /></label><label className="field-label">Current value<input type="number" min={stat.min} max={stat.max} value={stat.value} onChange={(event) => onUpdate(stat.id, { value: Math.max(stat.min, Math.min(stat.max, Number(event.target.value))) })} /></label><label className="field-label">Minimum<input type="number" value={stat.min} onChange={(event) => onUpdate(stat.id, { min: Number(event.target.value) })} /></label><label className="field-label">Maximum<input type="number" value={stat.max} onChange={(event) => onUpdate(stat.id, { max: Number(event.target.value) })} /></label><label className="field-label">Color<input type="text" value={stat.color} onChange={(event) => onUpdate(stat.id, { color: event.target.value })} /></label></div><div className="stat-lock-section"><div className="section-heading"><div><span className="overline">PHASE LOCKS</span><h2>Where is this stat frozen?</h2></div><span className="subtle">{stat.lockedPhases.length} selected</span></div><p>When a phase is selected, card effects that target this stat are negated while that phase is active.</p><div className="phase-lock-grid">{content.phases.map((phase) => <label key={phase.id} className={stat.lockedPhases.includes(phase.id) ? 'phase-lock phase-lock-active' : 'phase-lock'}><input type="checkbox" checked={stat.lockedPhases.includes(phase.id)} onChange={(event) => onUpdate(stat.id, { lockedPhases: event.target.checked ? [...stat.lockedPhases, phase.id] : stat.lockedPhases.filter((id) => id !== phase.id) })} /><span><strong>{phase.name}</strong><small>{stat.lockedPhases.includes(phase.id) ? 'Effects negated' : 'Effects allowed'}</small></span></label>)}</div></div></section></div></div>;
}

function EventEditor({ event, content, onUpdate, onOpen, onCreate }: { event: ContentEvent; content: ContentModel; onUpdate: (id: string, patch: Partial<ContentEvent>) => void; onOpen: (kind: EntityKind, id: string) => void; onCreate: () => void }) {
  const linkedCards = content.cards.filter((card) => card.event === event.id || event.cards.includes(card.id));
  const addCondition = () => onUpdate(event.id, { conditions: [...event.conditions, { type: 'stat', id: 'legitimacy', operator: 'gt', value: 50 }] });

  return <div className="content-directory event-editor-view"><div className="tool-view-heading"><div><span className="overline">WORLD / EVENTS / {event.id}</span><h1>{event.name}</h1><p>Define the pressure arc and the cards it activates when the event is started.</p></div><button className="button button-primary" onClick={onCreate}><Icon name="plus" /> New event</button></div><section className="event-detail-panel"><div className="phase-detail-top"><div><span className="overline">EVENT PROPERTIES</span><h2>{event.name}</h2></div><span className={event.active ? 'tag tag-teal' : 'tag tag-muted'}>{event.active ? 'Active at start' : 'Starts through a choice'}</span></div><div className="event-form"><label className="field-label">ID<input value={event.id} readOnly /></label><label className="field-label">Name<input value={event.name} onChange={(inputEvent) => onUpdate(event.id, { name: inputEvent.target.value })} /></label><label className="field-label event-description-field">Description<textarea value={event.description} onChange={(inputEvent) => onUpdate(event.id, { description: inputEvent.target.value })} /></label><label className="field-label">Phase<select value={event.phase} onChange={(inputEvent) => onUpdate(event.id, { phase: inputEvent.target.value })}>{content.phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name}</option>)}</select></label><label className="repeatable-toggle event-active-toggle"><input type="checkbox" checked={event.active} onChange={(inputEvent) => onUpdate(event.id, { active: inputEvent.target.checked })} /><span><strong>Active when a new run begins</strong><small>Otherwise, start it from a choice’s Follow-up flow.</small></span></label></div></section><section className="event-detail-panel event-conditions-section"><div className="section-heading"><div><span className="overline">EVENT GATES</span><h2>When can it begin?</h2></div><button className="text-button" onClick={addCondition}><Icon name="plus" size={13} /> Add condition</button></div><p className="event-help">Keep the event’s authored gates here. The event becomes active when a choice starts it, unless it is active at the beginning of a run.</p>{event.conditions.length ? event.conditions.map((condition, index) => <ConditionRow key={index} condition={condition} content={content} onChange={(next) => onUpdate(event.id, { conditions: event.conditions.map((current, currentIndex) => currentIndex === index ? next : current) })} onDelete={() => onUpdate(event.id, { conditions: event.conditions.filter((_, currentIndex) => currentIndex !== index) })} />) : <div className="empty-builder">No event gates yet — the event can start whenever a choice starts it.</div>}</section><section className="event-detail-panel event-cards-section"><div className="section-heading"><div><span className="overline">EVENT CARD POOL</span><h2>Cards in this event</h2></div><span className="availability-note">{linkedCards.length} linked</span></div><p className="event-help">Assign a card to this event from its card editor. Linked cards appear only while this event is active.</p>{linkedCards.length ? linkedCards.map((linkedCard) => <button className="related-card" key={linkedCard.id} onClick={() => onOpen('card', linkedCard.id)}><span className="related-card-dot" /><span><strong>{linkedCard.title}</strong><small>{linkedCard.phase ? labelForId(linkedCard.phase) : 'No phase gate'} · {linkedCard.choices.length} choices</small></span><b>↗</b></button>) : <div className="empty-builder">No cards are linked yet. Open a card and choose this event as its parent.</div>}</section></div>;
}

function ContentEditor({ content, selected, onOpen, onUpdatePhase, onUpdateStat, onCreatePhase, onUpdateEvent, onCreateEvent }: { content: ContentModel; selected: { kind: EntityKind; id: string }; onOpen: (kind: EntityKind, id: string) => void; onUpdatePhase: (id: string, patch: Partial<Phase>) => void; onUpdateStat: (id: string, patch: Partial<Stat>) => void; onCreatePhase: () => void; onUpdateEvent: (id: string, patch: Partial<ContentEvent>) => void; onCreateEvent: () => void }) {
  if (selected.kind === 'stat') return <StatsEditor content={content} selectedId={selected.id} onOpen={onOpen} onUpdate={onUpdateStat} />;
  if (selected.kind === 'event') {
    const event = content.events.find((item) => item.id === selected.id) ?? content.events[0];
    if (!event) return <EmptyWorkspace label="Create your first event" />;
    return <EventEditor event={event} content={content} onUpdate={onUpdateEvent} onOpen={onOpen} onCreate={onCreateEvent} />;
  }
  if (selected.kind !== 'phase') {
    const collection = content[`${selected.kind}s` as keyof ContentModel] as Array<{ id: string; name?: string; title?: string; description?: string }>;
    return <div className="content-directory"><div className="tool-view-heading"><div><span className="overline">WORLD / {selected.kind.toUpperCase()}S</span><h1>{selected.kind[0].toUpperCase() + selected.kind.slice(1)} directory</h1><p>Select an item from the browser to inspect its authored data.</p></div></div><div className="directory-list">{collection?.map((entity) => <button key={entity.id} onClick={() => onOpen(selected.kind, entity.id)}><span className="directory-dot" /><span><strong>{entity.title ?? entity.name ?? labelForId(entity.id)}</strong><small>{entity.description ?? entity.id}</small></span><b>Open ↗</b></button>)}</div></div>;
  }
  const phase = content.phases.find((item) => item.id === selected.id) ?? content.phases[0];
  if (!phase) return <EmptyWorkspace label="Create your first phase" />;
  return <div className="phase-editor-view"><div className="tool-view-heading"><div><span className="overline">WORLD / PHASES / {phase.id}</span><h1>Phases</h1><p>Define the political chapter, its order, and the card pool it makes available.</p></div><button className="button button-primary" onClick={onCreatePhase}><Icon name="plus" /> New phase</button></div><div className="phase-editor-layout"><aside className="phase-list"><div className="list-heading"><span>ALL PHASES</span><small>{content.phases.length} total</small></div>{content.phases.slice().sort((a, b) => a.order - b.order).map((item) => <button key={item.id} className={item.id === phase.id ? 'phase-list-item phase-list-active' : 'phase-list-item'} onClick={() => onOpen('phase', item.id)}><span className="phase-order">{String(item.order + 1).padStart(2, '0')}</span><span><strong>{item.name}</strong><small>{item.cards.length} cards attached</small></span><span className="phase-arrow">→</span></button>)}</aside><section className="phase-detail"><div className="phase-detail-top"><div><span className="overline">PHASE PROPERTIES</span><h2>{phase.name}</h2></div><span className="tag tag-teal">Active chapter</span></div><div className="phase-form"><label className="field-label">ID<input value={phase.id} readOnly /></label><label className="field-label">Name<input value={phase.name} onChange={(event) => onUpdatePhase(phase.id, { name: event.target.value })} /></label><label className="field-label phase-description-field">Description<textarea value={phase.description} onChange={(event) => onUpdatePhase(phase.id, { description: event.target.value })} /></label><label className="field-label">Order<input type="number" min={0} value={phase.order} onChange={(event) => onUpdatePhase(phase.id, { order: Number(event.target.value) })} /></label></div><div className="phase-summary"><div><span className="overline">CARD POOL</span><strong>{phase.cards.length || 'No'} cards</strong><small>Cards become available through phase and condition rules.</small></div><div><span className="overline">DEPENDENCIES</span><strong>{content.cards.filter((card) => card.phase === phase.id).length} cards reference this phase</strong><small>Open a card to inspect its availability gate.</small></div></div><div className="phase-links"><div className="section-heading"><div><span className="overline">RELATED CONTENT</span><h2>Cards in this chapter</h2></div><button className="text-button">Open Story Graph ↗</button></div>{content.cards.filter((card) => card.phase === phase.id).map((card) => <button className="related-card" key={card.id} onClick={() => onOpen('card', card.id)}><span className="related-card-dot" /><span><strong>{card.title}</strong><small>{card.dayFrom ? `Day ${card.dayFrom}` : 'No day gate'} · {card.choices.length} choices</small></span><b>↗</b></button>)}{content.cards.every((card) => card.phase !== phase.id) && <div className="empty-builder">No cards are attached to this phase yet. Attach them from a card’s Availability section.</div>}</div></section></div></div>;
}

type CardEditorProps = { card: Card; content: ContentModel; onUpdate: (patch: Partial<Card>) => void; onChoiceUpdate: (choiceId: string, patch: Partial<Choice>) => void; onOpen: (kind: EntityKind, id: string) => void; onSimulate: (choice: Choice) => void };

function CardEditor({ card, content, onUpdate, ...props }: CardEditorProps) {
  return <div className="card-editor-shell"><CardEditorBody card={card} content={content} onUpdate={onUpdate} {...props} /><section className="card-event-panel"><div className="section-heading"><div><span className="overline">FLOW / EVENT LINK</span><h2>When does this card belong?</h2></div><span className="availability-note">Optional parent event</span></div><label className="field-label">Parent event<select value={card.event ?? ''} onChange={(event) => onUpdate({ event: event.target.value || undefined })}><option value="">No event · direct card</option>{content.events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</select><small>Cards linked to an event surface only while that event is active.</small></label></section></div>;
}

function CardEditorBody({ card, content, onUpdate, onChoiceUpdate, onOpen, onSimulate }: CardEditorProps) {
  const addCardCondition = () => {
    const hasCardDependency = card.conditions.some((condition) => condition.type === 'card');
    const target = content.cards.find((item) => item.id !== card.id && !card.conditions.some((condition) => condition.type === 'card' && condition.id === item.id));
    onUpdate({ conditions: [...card.conditions, !hasCardDependency && target ? { type: 'card', id: target.id, operator: 'completed' } : { type: 'stat', id: 'legitimacy', operator: 'gt', value: 50 }] });
  };
  return <div className="card-editor"><div className="editor-header"><div><span className="overline">CARD / {card.id}</span><input className="title-input" value={card.title} onChange={(event) => onUpdate({ title: event.target.value })} /><div className="tag-row"><span className="tag tag-amber">{card.phase ? labelForId(card.phase) : 'General card'}</span>{card.event && <button className="tag tag-teal" onClick={() => onOpen('event', card.event!)}>{labelForId(card.event)}</button>}{card.repeatable && <span className="tag tag-muted">Recurring</span>}</div></div><div className="editor-actions"><button className="button button-outline"><Icon name="undo" /> History</button><button className="button button-primary" onClick={() => onSimulate(card.choices[0])}><Icon name="play" /> Simulate</button></div></div><details className="art-direction-preview" open><summary>Card appearance</summary><article className="reliquary-card"><span className="card-corner corner-tl" aria-hidden="true" /><span className="card-corner corner-tr" aria-hidden="true" /><span className="card-corner corner-bl" aria-hidden="true" /><span className="card-corner corner-br" aria-hidden="true" /><img src={card.artwork.endsWith('temp.png') ? cathedralArtwork : undefined} hidden={!card.artwork.endsWith('temp.png')} alt="A cloaked figure beneath the monumental cathedral of the Silent City" /><div className="reliquary-copy"><h2>{card.title}</h2><p>{card.situation}</p><div className="reliquary-divider" aria-hidden="true">◇</div><div className="reliquary-choices">{card.choices.slice(0, 2).map((choice, index) => <div className="reliquary-choice" key={choice.id}><h3>{choice.title?.trim() || `Choice ${index === 0 ? 'A' : 'B'}`}</h3><button onClick={() => onSimulate(choice)} title="Simulate this choice">{choice.text}</button></div>)}</div></div></article></details><section className="editor-section situation-section"><div className="section-heading"><div><span className="overline">01 · SITUATION</span><h2>The pressure point</h2></div><span className="character-count">{card.situation.length} / 500</span></div><textarea className="situation-input" value={card.situation} onChange={(event) => onUpdate({ situation: event.target.value })} /><label className="field-label">Author notes <input className="inline-input" value={card.notes} placeholder="What should this card teach the author?" onChange={(event) => onUpdate({ notes: event.target.value })} /></label></section><section className="editor-section availability-section"><div className="section-heading"><div><span className="overline">02 · AVAILABILITY</span><h2>When does it surface?</h2></div><span className="availability-note">No phase = available in every chapter</span></div><div className="field-grid"><label className="field-label">Phase<select value={card.phase ?? ''} onChange={(event) => onUpdate({ phase: event.target.value || undefined })}><option value="">No phase · general card</option>{content.phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name}</option>)}</select></label><label className="field-label">Day from<input type="number" min={0} value={card.dayFrom} onChange={(event) => onUpdate({ dayFrom: Number(event.target.value) })} /></label><label className="field-label">Day until<input type="number" min={0} placeholder="∞" value={card.dayUntil ?? ''} onChange={(event) => onUpdate({ dayUntil: event.target.value ? Number(event.target.value) : undefined })} /></label><label className="field-label priority-field">Priority<input type="number" min={0} max={10} value={card.priority} onChange={(event) => onUpdate({ priority: Math.max(0, Math.min(10, Number(event.target.value))) })} /><small title={priorityDescription(card.priority)}>{priorityLabel(card.priority)} · higher wins ties</small></label></div><label className="repeatable-toggle"><input type="checkbox" checked={card.repeatable} onChange={(event) => onUpdate({ repeatable: event.target.checked })} /><span><strong>Recurring card</strong><small>Can surface again after it has been shown.</small></span></label><div className="builder-line"><div><strong>Conditions</strong><small>All conditions must be true. Use conditions for general cards that should wait on world state.</small></div><div className="condition-chips">{card.phase && <ConditionChip label={`phase = ${labelForId(card.phase)}`} tone="teal" />}{card.event && <ConditionChip label="event active" tone="amber" />}{card.conditions.map((condition, index) => <ConditionChip key={index} label={condition.type === 'stat' ? `${labelForId(condition.id)} ${condition.operator} ${condition.value}` : condition.type} tone="teal" />)}<button className="add-chip" onClick={addCardCondition}><Icon name="plus" size={13} /> Add condition</button></div></div>{card.conditions.length > 0 && <div className="card-condition-list">{card.conditions.map((condition, index) => <ConditionRow key={index} condition={condition} content={content} onChange={(next) => onUpdate({ conditions: card.conditions.map((current, currentIndex) => currentIndex === index ? next : current) })} onDelete={() => onUpdate({ conditions: card.conditions.filter((_, currentIndex) => currentIndex !== index) })} />)}</div>}<label className="field-label tags-editor-field">Tags <input value={card.tags.join(', ')} placeholder="nobility, consequence" onChange={(event) => onUpdate({ tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })} /><small>Organization labels for search and filtering; tags do not change availability.</small></label></section><div className="choice-grid">{card.choices.map((choice, index) => <ChoiceEditor key={choice.id} cardId={card.id} cardPhase={card.phase} choice={choice} index={index} content={content} onUpdate={onChoiceUpdate} onSimulate={() => onSimulate(choice)} />)}</div></div>;
}

function ChoiceEditor({ cardId, cardPhase, choice, index, content, onUpdate, onSimulate }: { cardId: string; cardPhase?: string; choice: Choice; index: number; content: ContentModel; onUpdate: (choiceId: string, patch: Partial<Choice>) => void; onSimulate: () => void }) {
  const addCondition = () => onUpdate(choice.id, { conditions: [...choice.conditions, { type: 'stat', id: 'legitimacy', operator: 'gt', value: 50 }] });
  const addEffect = () => onUpdate(choice.id, { effects: [...choice.effects, { type: 'stat', id: 'popularity', operation: 'add', value: 5 }] });
  const [showFollowUp, setShowFollowUp] = useState(false);
  const addDelayedEffect = () => onUpdate(choice.id, { effects: [...choice.effects, { type: 'stat', id: 'popularity', operation: 'add', value: 5, delayed: 7 }] });
  const [followUpOperation, setFollowUpOperation] = useState<'unlock' | 'lock' | 'trigger'>('unlock');
  const appendFollowUpEffect = (effect: Effect) => {
    const alreadyExists = choice.effects.some((current) => current.type === effect.type && current.operation === effect.operation && current.value === effect.value);
    if (!alreadyExists) onUpdate(choice.id, { effects: [...choice.effects, effect] });
    setShowFollowUp(false);
  };
  const addCardFollowUp = (targetCardId: string) => {
    if (!targetCardId) return;
    appendFollowUpEffect({ type: 'card', operation: followUpOperation, value: targetCardId });
  };
  const addEventFollowUp = (eventId: string) => {
    if (!eventId) return;
    appendFollowUpEffect({ type: 'event', operation: 'start', value: eventId });
  };
  return (
    <section className={`choice-editor ${index === 0 ? 'choice-left' : 'choice-right'}`}>
      <div className="choice-topline"><div><span className="choice-direction">{index === 0 ? 'SWIPE LEFT' : 'SWIPE RIGHT'}</span><input className="choice-title-input" value={choice.title ?? ''} placeholder={`Choice ${index === 0 ? 'A' : 'B'} title`} aria-label={`Choice ${index === 0 ? 'A' : 'B'} title`} onChange={(event) => onUpdate(choice.id, { title: event.target.value })} /></div><button className="button button-small" onClick={onSimulate}><Icon name="play" size={13} /> Test choice</button></div>
      <textarea className="choice-input" value={choice.text} onChange={(event) => onUpdate(choice.id, { text: event.target.value })} />
      <div className="builder-block"><div className="builder-heading"><span>Conditions</span><button onClick={addCondition}><Icon name="plus" size={13} /> Add</button></div>{choice.conditions.length === 0 ? <div className="empty-builder">No gates — this choice is always available.</div> : choice.conditions.map((item, itemIndex) => <ConditionRow key={itemIndex} condition={item} content={content} onChange={(next) => onUpdate(choice.id, { conditions: choice.conditions.map((current, currentIndex) => currentIndex === itemIndex ? next : current) })} onDelete={() => onUpdate(choice.id, { conditions: choice.conditions.filter((_, currentIndex) => currentIndex !== itemIndex) })} />)}</div>
      <div className="builder-block"><div className="builder-heading"><span>Effects</span><button onClick={addEffect}><Icon name="plus" size={13} /> Add</button></div>{choice.effects.length === 0 ? <div className="empty-builder">No effects yet.</div> : choice.effects.map((item, itemIndex) => <EffectRow key={itemIndex} effect={item} cardPhase={cardPhase} content={content} onChange={(next) => onUpdate(choice.id, { effects: choice.effects.map((current, currentIndex) => currentIndex === itemIndex ? next : current) })} onDelete={() => onUpdate(choice.id, { effects: choice.effects.filter((_, currentIndex) => currentIndex !== itemIndex) })} />)}</div>
      <div className="choice-footer"><button className="text-button" onClick={addDelayedEffect}>+ Delayed effect</button><button className="text-button" onClick={() => setShowFollowUp((current) => !current)}>Follow-up flow ↗</button></div>
      {showFollowUp && <div className="follow-up-picker">
        <label className="field-label">Card action<select value={followUpOperation} onChange={(event) => setFollowUpOperation(event.target.value as 'unlock' | 'lock' | 'trigger')}><option value="unlock">Unlock card</option><option value="trigger">Trigger card</option><option value="lock">Lock card</option></select></label>
        <label className="field-label">Choose an authored card<select defaultValue="" onChange={(event) => addCardFollowUp(event.target.value)}><option value="">Choose a card…</option>{content.cards.filter((card) => card.id !== cardId).map((card) => <option key={card.id} value={card.id}>{card.title}</option>)}</select></label>
        <label className="field-label">Start an authored event<select defaultValue="" onChange={(event) => addEventFollowUp(event.target.value)}><option value="">Choose an event…</option>{content.events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</select></label>
        <small>Cards become unlockable or triggerable; starting an event activates its linked cards. Adjust timing in the Effects list below.</small>
      </div>}
    </section>
  );
}

function ConditionRow({ condition, content, onChange, onDelete }: { condition: Condition; content: ContentModel; onChange: (condition: Condition) => void; onDelete: () => void }) {
  if (condition.type === 'stat') return <div className="builder-row"><select value={condition.id} onChange={(event) => onChange({ ...condition, id: event.target.value })}>{content.stats.map((stat) => <option key={stat.id} value={stat.id}>{stat.name}</option>)}</select><select value={condition.operator} onChange={(event) => onChange({ ...condition, operator: event.target.value })}><option value="gt">&gt;</option><option value="gte">≥</option><option value="lt">&lt;</option><option value="lte">≤</option><option value="eq">=</option></select><input type="number" value={condition.value} onChange={(event) => onChange({ ...condition, value: Number(event.target.value) })} /><button className="row-delete" aria-label="Delete condition" onClick={onDelete}><Icon name="close" size={13} /></button></div>;
  if (condition.type === 'card') return <div className="builder-row"><span className="row-token">After card</span><select value={condition.id} onChange={(event) => onChange({ ...condition, id: event.target.value })}>{content.cards.map((card) => <option key={card.id} value={card.id}>{card.title}</option>)}</select><span className="row-muted">must be completed</span><button className="row-delete" aria-label="Delete card dependency" onClick={onDelete}><Icon name="close" size={13} /></button></div>;
  if (condition.type === 'phase') return <div className="builder-row"><span className="row-token">Phase</span><select value={condition.value} onChange={(event) => onChange({ ...condition, value: event.target.value })}>{content.phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name}</option>)}</select><button className="row-delete" onClick={onDelete}><Icon name="close" size={13} /></button></div>;
  return <div className="builder-row"><span className="row-token">{condition.type}</span><span className="row-muted">{labelForId('value' in condition ? String(condition.value) : '')}</span><button className="row-delete" onClick={onDelete}><Icon name="close" size={13} /></button></div>;
}

function EffectRow({ effect, cardPhase, content, onChange, onDelete }: { effect: Effect; cardPhase?: string; content: ContentModel; onChange: (effect: Effect) => void; onDelete: () => void }) {
  const updateDelay = (value: string) => onChange({ ...effect, delayed: value ? Number(value) : undefined } as Effect);
  const delay = <label className="effect-delay" title="Days after the choice before this effect is applied">+<input type="number" min={1} placeholder="0" value={effect.delayed ?? ''} onChange={(event) => updateDelay(event.target.value)} />d</label>;
  if (effect.type === 'stat') { const stat = content.stats.find((item) => item.id === effect.id); const negated = Boolean(cardPhase && stat?.lockedPhases.includes(cardPhase)); return <div className="builder-row"><span className="row-token row-token-effect">Stat</span><select value={effect.id} onChange={(event) => onChange({ ...effect, id: event.target.value })}>{content.stats.map((stat) => <option key={stat.id} value={stat.id}>{stat.name}</option>)}</select><select value={effect.operation} onChange={(event) => onChange({ ...effect, operation: event.target.value as 'add' | 'set' })}><option value="add">change by</option><option value="set">set to</option></select><input type="number" value={effect.value} onChange={(event) => onChange({ ...effect, value: Number(event.target.value) })} />{delay}{negated && <span className="effect-negated" title="This stat is locked during the card's phase">Negated in {labelForId(cardPhase!)}</span>}<button className="row-delete" onClick={onDelete}><Icon name="close" size={13} /></button></div>; }
  if (effect.type === 'flag') return <div className="builder-row"><span className="row-token row-token-effect">Flag</span><select value={effect.operation} onChange={(event) => onChange({ ...effect, operation: event.target.value as 'set' | 'remove' })}><option value="set">Set</option><option value="remove">Remove</option></select><input value={effect.value} onChange={(event) => onChange({ ...effect, value: event.target.value })} />{delay}<button className="row-delete" onClick={onDelete}><Icon name="close" size={13} /></button></div>;
  if (effect.type === 'card') return <div className="builder-row"><span className="row-token row-token-effect">Card</span><select value={effect.operation} onChange={(event) => onChange({ ...effect, operation: event.target.value as 'unlock' | 'lock' | 'trigger' })}><option value="unlock">Unlock</option><option value="trigger">Trigger</option><option value="lock">Lock</option></select><select value={effect.value} onChange={(event) => onChange({ ...effect, value: event.target.value })}>{content.cards.map((card) => <option key={card.id} value={card.id}>{card.title}</option>)}</select>{delay}<button className="row-delete" onClick={onDelete}><Icon name="close" size={13} /></button></div>;
  if (effect.type === 'event') return <div className="builder-row"><span className="row-token row-token-effect">Event</span><select value={effect.operation} onChange={(event) => onChange({ ...effect, operation: event.target.value as 'start' | 'end' })}><option value="start">Start</option><option value="end">End</option></select><select value={effect.value} onChange={(event) => onChange({ ...effect, value: event.target.value })}>{content.events.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{delay}<button className="row-delete" onClick={onDelete}><Icon name="close" size={13} /></button></div>;
  if (effect.type === 'phase') return <div className="builder-row"><span className="row-token row-token-effect">Phase</span><select value={effect.value} onChange={(event) => onChange({ ...effect, value: event.target.value })}>{content.phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name}</option>)}</select>{delay}<button className="row-delete" onClick={onDelete}><Icon name="close" size={13} /></button></div>;
  return <div className="builder-row"><span className="row-token row-token-effect">Time</span><select value={effect.operation} onChange={(event) => onChange({ ...effect, operation: event.target.value as 'advance' | 'set' })}><option value="advance">Advance by</option><option value="set">Set to</option></select><input type="number" value={effect.value} onChange={(event) => onChange({ ...effect, value: Number(event.target.value) })} />{delay}<button className="row-delete" onClick={onDelete}><Icon name="close" size={13} /></button></div>;
}

function ConditionChip({ label, tone }: { label: string; tone: string }) { return <span className={`condition-chip chip-${tone}`}><span className="chip-dot" />{label}</span>; }

function Inspector({ content, selected, card, issues, onOpen, onUpdateCard }: { content: ContentModel; selected: { kind: EntityKind; id: string }; card?: Card; issues: ReturnType<typeof validateContent>; onOpen: (kind: EntityKind, id: string) => void; onUpdateCard: (patch: Partial<Card>) => void }) {
  const selectedIssues = issues.filter((issue) => issue.entityId === selected.id);
  return <aside className="inspector"><div className="panel-heading"><div><span className="overline">INSPECTOR</span><h2>{card?.title ?? labelForId(selected.id)}</h2></div><button className="icon-button"><Icon name="close" /></button></div>{card ? <><div className="inspector-tabs"><button className="inspector-tab-active">Properties</button><button>Dependencies</button><button>Why?</button></div><div className="inspector-section"><InspectorField label="ID" value={card.id} readOnly /><InspectorField label="Artwork" value={card.artwork} placeholder="assets/cards/..." onChange={(value) => onUpdateCard({ artwork: value })} /><InspectorField label="Tags" value={card.tags.join(', ')} help="Organization labels for search and filtering. They do not change availability." onChange={(value) => onUpdateCard({ tags: value.split(',').map((tag) => tag.trim()).filter(Boolean) })} /></div><div className="inspector-section"><div className="inspector-label-row"><span>QUICK LINKS</span><small>OPEN IN TAB</small></div>{card.event && <button className="dependency-link" onClick={() => onOpen('event', card.event!)}><span className="dependency-icon"><Icon name="timeline" size={13} /></span><span><strong>{labelForId(card.event)}</strong><small>Parent event</small></span><b>↗</b></button>}{card.phase ? <button className="dependency-link" onClick={() => onOpen('phase', card.phase!)}><span className="dependency-icon"><Icon name="graph" size={13} /></span><span><strong>{labelForId(card.phase)}</strong><small>Phase gate</small></span><b>↗</b></button> : <div className="inspector-note"><Icon name="check" size={13} /> General card · no phase gate</div>}</div><div className="inspector-section"><div className="inspector-label-row"><span>VALIDATION</span><small>{selectedIssues.length ? 'ATTENTION' : 'CLEAN'}</small></div>{selectedIssues.length ? selectedIssues.map((issue, index) => <div className="inspector-issue" key={index}><Icon name="alert" size={14} />{issue.message}</div>) : <div className="clean-state"><Icon name="check" size={14} /> No issues on this card</div>}</div><div className="inspector-section dependencies-section"><div className="inspector-label-row"><span>DEPENDENCY PREVIEW</span><button className="text-button">Open full view</button></div><div className="dependency-tree"><div><span className="tree-node tree-node-active" />This card<em /></div><div className="tree-branch"><span className="tree-node tree-node-teal" />{card.choices.length} choices<span>choices</span></div><div className="tree-branch"><span className="tree-node tree-node-amber" />{card.conditions.length} availability conditions<span>conditions</span></div><div className="tree-branch"><span className="tree-node tree-node-amber" />{card.tags.length} organization tags<span>tags</span></div></div></div></> : <GenericInspector content={content} selected={selected} />}</aside>;
}

function InspectorField({ label, value, readOnly, placeholder, help, onChange }: { label: string; value: string; readOnly?: boolean; placeholder?: string; help?: string; onChange?: (value: string) => void }) { return <label className="inspector-field"><span>{label}</span><input value={value} readOnly={readOnly} placeholder={placeholder} onChange={(event) => onChange?.(event.target.value)} />{help && <small>{help}</small>}</label>; }
function GenericInspector({ content, selected }: { content: ContentModel; selected: { kind: EntityKind; id: string } }) { const source = content[`${selected.kind}s` as keyof ContentModel] as Array<Record<string, unknown>>; const entity = source?.find((item) => item.id === selected.id); return <div className="generic-inspector">{entity ? Object.entries(entity).slice(0, 6).map(([key, value]) => <div className="generic-row" key={key}><span>{key}</span><strong>{Array.isArray(value) ? `${value.length} items` : String(value)}</strong></div>) : <EmptyWorkspace label="Nothing selected" />}</div>; }

function GraphView({ content, onOpen }: { content: ContentModel; onOpen: (kind: EntityKind, id: string) => void }) { return <div className="tool-view graph-view"><div className="tool-view-heading"><div><span className="overline">RELATIONSHIPS / DERIVED VIEW</span><h1>Story Graph</h1><p>Trace how a promise becomes pressure across the political lifecycle.</p></div><div className="graph-legend"><span><i className="legend-card" /> Cards</span><span><i className="legend-event" /> Events</span><span><i className="legend-phase" /> Phases</span></div></div><div className="graph-canvas"><div className="graph-line line-a" /><div className="graph-line line-b" /><div className="graph-line line-c" /><GraphNode x="8" y="38" tone="phase" label="Revolution" detail="phase" onClick={() => onOpen('phase', 'revolution')} /><GraphNode x="32" y="20" tone="event" label="Revolution Begins" detail="event · active" onClick={() => onOpen('event', 'event_revolution_begins')} /><GraphNode x="32" y="60" tone="card" label="Strange Letters" detail="card · day 18" onClick={() => onOpen('card', 'card_secret_letters')} /><GraphNode x="60" y="38" tone="card" label="The Noble Demand" detail="card · day 120" onClick={() => onOpen('card', 'card_noble_demand')} /><GraphNode x="84" y="22" tone="event" label="Noble Conspiracy" detail="event · active" onClick={() => onOpen('event', 'event_noble_conspiracy')} /><div className="graph-callout"><span>INFERRED DEPENDENCY</span><strong>merchant_monopoly_promised</strong><small>Flag producer → consumer</small></div></div><div className="graph-footer"><span><strong>{content.cards.length}</strong> nodes visible</span><span><strong>4</strong> inferred relationships</span><button className="text-button">Focus selected node ↗</button></div></div>; }
function GraphNode({ x, y, tone, label, detail, onClick }: { x: string; y: string; tone: string; label: string; detail: string; onClick: () => void }) { return <button className={`graph-node node-${tone}`} style={{ left: `${x}%`, top: `${y}%` }} onClick={onClick}><span className="node-dot" /><strong>{label}</strong><small>{detail}</small></button>; }

function TimelineView({ content, onOpen }: { content: ContentModel; onOpen: (kind: EntityKind, id: string) => void }) { return <div className="tool-view timeline-view"><div className="tool-view-heading"><div><span className="overline">TEMPORAL VIEW / DERIVED</span><h1>Timeline</h1><p>See where phase gates and delayed consequences land in time.</p></div><button className="button button-outline">Day 1 — 365 <span>⌄</span></button></div><div className="timeline-scale"><span>DAY 1</span><span>REBELLION</span><span>DAY 60</span><span>REVOLUTION</span><span>DAY 120</span><span>KINGDOM</span><span>DAY 365</span></div><div className="timeline-track"><div className="track-line" /><div className="phase-block phase-one"><span>REBELLION</span></div><div className="phase-block phase-two"><span>REVOLUTION</span></div><div className="phase-block phase-three"><span>KINGDOM</span></div><button className="timeline-event event-one" onClick={() => onOpen('card', 'card_secret_letters')}><span className="timeline-dot" /><strong>Strange Letters</strong><small>day 18 · card</small></button><button className="timeline-event event-two" onClick={() => onOpen('event', 'event_revolution_begins')}><span className="timeline-dot" /><strong>Revolution Begins</strong><small>condition gate</small></button><button className="timeline-event event-three" onClick={() => onOpen('card', 'card_noble_demand')}><span className="timeline-dot" /><strong>The Noble Demand</strong><small>day 120 · card</small></button><div className="timeline-delayed"><span className="delayed-line" /><span className="delayed-pill">+60 days</span><strong>Merchant Council demand</strong><small>scheduled by “Promise them a monopoly”</small></div></div><div className="timeline-footer"><span><i className="phase-swatch" /> Phase boundary</span><span><i className="event-swatch" /> Authored content</span><span><i className="delayed-swatch" /> Delayed consequence</span><span className="timeline-count">{content.events.length} events · {content.cards.length} cards</span></div></div>; }

function DebugView({ content, state, setState, onOpen }: { content: ContentModel; state: DebugState; setState: React.Dispatch<React.SetStateAction<DebugState>>; onOpen: (kind: EntityKind, id: string) => void }) { const [result, setResult] = useState<{ diff: string[]; scheduled: string[]; negated: string[] } | null>(null); const activeCard = content.cards[0]; const simulate = (choice: Choice) => { const outcome = applyEffects(state, choice.effects, content); setState(outcome.state); setResult({ diff: outcome.diff, scheduled: outcome.scheduled, negated: outcome.negated }); }; return <div className="tool-view debug-view"><div className="tool-view-heading"><div><span className="overline">PLAYTEST / TEMPORARY STATE</span><h1>Debug Mode</h1><p>Load a meaningful world state, simulate either choice, and inspect the diff.</p></div><div className="debug-actions"><button className="button button-outline" onClick={() => { setState(clone(initialDebugState)); setResult(null); }}>Reset state</button><button className="button button-primary" onClick={() => setState((current) => ({ ...current, day: current.day + 1 }))}><Icon name="play" /> Advance day</button></div></div><div className="debug-layout"><section className="debug-state-panel"><div className="section-heading"><div><span className="overline">CURRENT STATE</span><h2>Kingdom · Day {state.day}</h2></div><span className="tag tag-teal">Temporary</span></div><div className="debug-selects"><label className="field-label">Phase<select value={state.phase} onChange={(event) => setState((current) => ({ ...current, phase: event.target.value }))}>{content.phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name}</option>)}</select></label><label className="field-label">Preset<select defaultValue="weak_kingdom"><option value="weak_kingdom">Weak Kingdom</option><option value="rebellion">Early Rebellion</option><option value="famine">Famine</option></select></label></div><div className="debug-stat-list">{content.stats.slice(0, 6).map((stat) => <label key={stat.id} className="debug-stat"><span><b>{stat.name}</b><small>{state.stats[stat.id] ?? 0} / 100</small></span><input type="range" min={stat.min} max={stat.max} value={state.stats[stat.id] ?? 0} onChange={(event) => setState((current) => ({ ...current, stats: { ...current.stats, [stat.id]: Number(event.target.value) } }))} style={{ accentColor: stat.color }} /></label>)}</div><div className="flag-list"><span className="overline">ACTIVE FLAGS</span><div>{state.flags.map((flag) => <span className="condition-chip chip-amber" key={flag}><span className="chip-dot" />{flag}</span>)}</div></div></section><section className="simulation-panel"><div className="section-heading"><div><span className="overline">CARD SIMULATION</span><h2>{activeCard.title}</h2></div><button className="text-button" onClick={() => onOpen('card', activeCard.id)}>Open card ↗</button></div><p className="simulation-situation">{activeCard.situation}</p><div className="simulation-choices">{activeCard.choices.map((choice, index) => <button key={choice.id} className="simulation-choice" onClick={() => simulate(choice)}><span>{index === 0 ? 'A' : 'B'}</span><strong>{choice.text}</strong><small>Simulate outcome →</small></button>)}</div>{result && <div className="result-panel"><div className="result-header"><span className="overline">STATE DIFF</span><button onClick={() => setResult(null)}><Icon name="close" size={14} /></button></div>{result.diff.length ? result.diff.map((line) => <div className="diff-row" key={line}><Icon name="check" size={13} />{line}</div>) : !result.negated.length && <div className="empty-builder">No immediate changes.</div>}{result.negated.map((line) => <div className="negated-row" key={line}><Icon name="close" size={13} />Negated · {line}</div>)}{result.scheduled.map((line) => <div className="scheduled-row" key={line}><Icon name="timeline" size={13} />Scheduled · {line}</div>)}</div>}</section></div></div>; }

function ValidationView({ issues, onOpen }: { issues: ReturnType<typeof validateContent>; onOpen: (kind: EntityKind, id: string) => void }) { return <div className="tool-view validation-view"><div className="tool-view-heading"><div><span className="overline">QUALITY GATE / CONTINUOUS</span><h1>Validation</h1><p>References, structure, and authoring gaps are checked against the canonical model.</p></div><button className="button button-primary"><Icon name="check" /> Run validation</button></div><div className="validation-summary"><div className="validation-count validation-clean"><span>✓</span><strong>{issues.filter((issue) => issue.severity === 'error').length}</strong><small>Errors</small></div><div className="validation-count validation-warn"><span>!</span><strong>{issues.filter((issue) => issue.severity === 'warning').length}</strong><small>Warnings</small></div><div className="validation-copy"><strong>{issues.length ? 'A few edges need attention.' : 'Everything is ready to export.'}</strong><span>Each result opens the relevant entity in the workspace.</span></div></div><div className="issues-table"><div className="issue-table-head"><span>SEVERITY</span><span>MESSAGE</span><span>ENTITY</span><span>ACTION</span></div>{issues.length === 0 ? <div className="empty-table"><Icon name="check" /> No validation issues found.</div> : issues.map((issue, index) => <button className="issue-row" key={`${issue.message}-${index}`} onClick={() => issue.entityId && issue.entityKind && onOpen(issue.entityKind, issue.entityId)}><span className={issue.severity === 'error' ? 'severity severity-error' : 'severity severity-warning'}><Icon name={issue.severity === 'error' ? 'close' : 'alert'} size={13} />{issue.severity}</span><strong>{issue.message}</strong><span>{labelForId(issue.entityId ?? 'project')}</span><span className="issue-action">Open ↗</span></button>)}</div></div>; }

function EmptyWorkspace({ label }: { label: string }) { return <div className="empty-workspace"><span className="empty-mark"><Icon name="card" size={24} /></span><h2>{label}</h2><p>Open an item from the content browser to begin authoring.</p></div>; }

export default App;
