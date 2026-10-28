import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BY_ID, DIFF_XP } from './lib/data';
import { computeGame, QUEST_XP, REVIEW_XP } from './lib/game';
import { GUILD_BY_KEY } from './lib/guilds';
import { notify } from './lib/system';
import { monsterOf } from './lib/lore';
import { LISTS } from './lib/data';
import { useHashRoute } from './lib/useHashRoute';
import { useProgress } from './lib/useProgress';
import { clearSession, legacyUsername, loadSession, saveSession, userKey } from './lib/session';
import { applyTheme, useMotion, useTheme } from './lib/themes';
import { useToday } from './lib/date';
import Ambience from './components/Ambience';
import Sidebar from './components/Sidebar';
import SystemLayer from './components/SystemLayer';
import StatusPage from './components/StatusPage';
import GuildsPage from './components/GuildsPage';
import GuildDeck from './components/GuildDeck';
import ReviewsPage from './components/ReviewsPage';
import TitlesPage from './components/TitlesPage';
import QuestionDrawer from './components/QuestionDrawer';
import ThemePicker from './components/ThemePicker';

const Login = lazy(() => import('./components/Login'));
const CodexPage = lazy(() => import('./components/CodexPage'));

function useEquippedTitle(username) {
  const key = userKey(username, 'equippedTitle');
  const [id, setId] = useState(() => {
    try { return localStorage.getItem(key) || ''; } catch { return ''; }
  });
  const equip = useCallback((next) => {
    try { localStorage.setItem(key, next); } catch { /* private mode: keep it for this session */ }
    setId(next);
  }, [key]);
  return [id, equip];
}

function Tracker({ session, onSignOut, onExpired, theme, onTheme }) {
  const { username } = session;
  const progress = useProgress(session, onExpired);
  const [motion, setMotion] = useMotion();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const { completed, reviews, notes, trackedTime, toggleSolved, markReviewed, setNote, addTime } = progress;
  const route = useHashRoute();
  const [openId, setOpenId] = useState(null);
  const [equippedId, equip] = useEquippedTitle(username);
  const mainRef = useRef(null);

  const today = useToday();
  // `today` is a dependency so quests, reviews and streaks roll over at midnight.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const game = useMemo(() => computeGame({ completed, reviews, trackedTime }), [completed, reviews, trackedTime, today]);
  const dueIds = useMemo(() => new Set(game.due.map((d) => d.id)), [game.due]);
  const equipped = game.achievements.find((a) => a.id === equippedId && a.unlocked);
  const title = equipped?.name || game.title;

  useEffect(() => {
    if (session.mode === 'offline') {
      notify({ text: 'Offline profile: progress is saved on this device only. Start the backend and sign in to sync.' });
    }
  }, [session.mode]);

  // Only celebrate changes the player caused in the last few seconds (not a backend sync).
  const lastAction = useRef(0);
  const completedRef = useRef(completed);
  useEffect(() => { completedRef.current = completed; }, [completed]);

  const onToggle = useCallback((id) => {
    const q = BY_ID.get(id);
    const wasSolved = !!completedRef.current[id];
    lastAction.current = Date.now();
    toggleSolved(id);
    if (!wasSolved && q) {
      const m = monsterOf(id);
      const guilds = q.lists.map((l) => LISTS[l].name);
      notify({
        text: `${m.name} the ${m.kind} is defeated (“${q.title}”).${guilds.length ? ` Counts in ${guilds.join(', ')}.` : ''}`,
        xp: DIFF_XP[q.difficulty],
      });
    }
  }, [toggleSolved]);

  const onReview = useCallback((id, stage) => {
    lastAction.current = Date.now();
    markReviewed(id, stage);
    notify({ text: `Re-entry complete: “${BY_ID.get(id)?.title}”. Memory reinforced.`, xp: REVIEW_XP });
  }, [markReviewed]);

  const onClose = useCallback(() => setOpenId(null), []);

  // Level, rank, quest and title celebrations.
  const seen = useRef(null);
  useEffect(() => {
    const now = {
      level: game.level,
      rank: game.rank.id,
      quest: game.quest.done,
      titles: new Set(game.achievements.filter((a) => a.unlocked).map((a) => a.id)),
    };
    const prev = seen.current;
    seen.current = now;
    if (prev && Date.now() - lastAction.current < 4000) {
      if (now.quest && !prev.quest) notify({ text: 'Daily Quest complete. Your streak is protected.', xp: QUEST_XP });
      for (const a of game.achievements) {
        if (a.unlocked && !prev.titles.has(a.id)) notify({ text: `Title acquired: [${a.name}]`, xp: a.xp });
      }
      if (now.rank !== prev.rank && now.level > prev.level) notify({ type: 'rank', rank: game.rank });
      else if (now.level > prev.level) notify({ type: 'level', level: now.level });
    }
  }, [game]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [route.page, route.arg]);

  // The dashboard scrolls; the other pages fit the screen and scroll inside their own panels.
  const fitsScreen = ['guilds', 'reviews', 'titles', 'codex'].includes(route.page);

  let page;
  switch (route.page) {
    case 'guilds':
      page = GUILD_BY_KEY[route.arg] ? (
        <GuildDeck
          key={route.arg}
          guildKey={route.arg}
          openPattern={route.params.get('p')}
          completed={completed}
          dueIds={dueIds}
          notes={notes}
          onToggle={onToggle}
          onOpen={setOpenId}
        />
      ) : (
        <GuildsPage completed={completed} />
      );
      break;
    case 'reviews':
      page = <ReviewsPage due={game.due} upcoming={game.upcoming} notes={notes} onReview={onReview} onOpen={setOpenId} />;
      break;
    case 'titles':
      page = <TitlesPage achievements={game.achievements} equippedId={equipped?.id} title={title} onEquip={equip} />;
      break;
    case 'codex':
      page = <CodexPage tab={route.arg} />;
      break;
    default:
      page = <StatusPage game={game} username={username} title={title} completed={completed} onOpen={setOpenId} onAddTime={addTime} />;
  }

  return (
    <>
      <Ambience theme={theme} />
      <div className="relative z-[1] flex h-full">
        <Sidebar
          page={route.page}
          username={username}
          offline={session.mode === 'offline'}
          level={game.level}
          rank={game.rank}
          dueCount={game.due.length}
          onSettings={openSettings}
        />
        {/* Desktop pages fit the screen; only lists and long text scroll inside their own panels. */}
        <main ref={mainRef} className={`flex-1 min-w-0 h-full overflow-y-auto scroll-thin ${fitsScreen ? 'md:overflow-hidden' : ''}`}>
          <div key={route.page} className={`anim-fade mx-auto max-w-[1240px] flex flex-col px-4 sm:px-6 lg:px-10 pt-6 md:pt-8 pb-28 md:pb-8 ${fitsScreen ? 'md:h-full' : ''}`}>
            <Suspense fallback={null}>{page}</Suspense>
          </div>
        </main>
      </div>

      {openId && (
        <QuestionDrawer
          key={openId}
          id={openId}
          solvedOn={completed[openId]}
          review={reviews[openId]}
          note={notes[openId]}
          onToggle={onToggle}
          onNote={setNote}
          onClose={onClose}
        />
      )}
      {settingsOpen && (
        <ThemePicker
          theme={theme}
          onChange={onTheme}
          motion={motion}
          onMotion={setMotion}
          onClose={closeSettings}
          account={{ username, mode: session.mode, onSignOut }}
        />
      )}
      <SystemLayer />
    </>
  );
}

export default function App() {
  const [session, setSession] = useState(loadSession);
  const [theme, setTheme] = useTheme();
  const [notice, setNotice] = useState(() =>
    !loadSession() && legacyUsername() ? 'Sign-in got a security upgrade. Please sign in once more.' : '');

  // The sign-in screen is always the signature Shadow Monarch look; your own theme returns once you're in.
  useEffect(() => {
    applyTheme(session ? theme : 'system');
  }, [session, theme]);

  const login = useCallback((s) => {
    saveSession(s);
    setSession(s);
    setNotice('');
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const expire = useCallback(() => {
    clearSession();
    setSession(null);
    setNotice('Your session expired. Please sign in again.');
  }, []);

  if (!session) {
    return (
      <>
        <Ambience theme="system" />
        <div className="relative z-[1] h-full">
          <Suspense fallback={null}>
            <Login onLogin={login} notice={notice} />
          </Suspense>
        </div>
      </>
    );
  }
  return <Tracker key={session.username} session={session} onSignOut={signOut} onExpired={expire} theme={theme} onTheme={setTheme} />;
}
