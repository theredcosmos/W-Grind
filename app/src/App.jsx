import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BY_ID, DIFF_XP } from './lib/data';
import { computeGame, QUEST_XP, REVIEW_XP } from './lib/game';
import { GUILD_BY_KEY } from './lib/guilds';
import { notify } from './lib/system';
import { useHashRoute } from './lib/useHashRoute';
import { useProgress } from './lib/useProgress';
import { clearSession, legacyUsername, loadSession, saveSession } from './lib/session';
import { useTheme } from './lib/themes';
import Sidebar from './components/Sidebar';
import SystemLayer from './components/SystemLayer';
import StatusPage from './components/StatusPage';
import GuildsPage from './components/GuildsPage';
import GuildDeck from './components/GuildDeck';
import ReviewsPage from './components/ReviewsPage';
import QuestionDrawer from './components/QuestionDrawer';
import ThemePicker from './components/ThemePicker';

const Login = lazy(() => import('./components/Login'));
const CodexPage = lazy(() => import('./components/CodexPage'));

function Tracker({ session, onSignOut, onExpired, theme, onTheme }) {
  const { username } = session;
  const progress = useProgress(session, onExpired);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const { completed, reviews, notes, trackedTime, toggleSolved, markReviewed, setNote, addTime } = progress;
  const route = useHashRoute();
  const [openId, setOpenId] = useState(null);
  const mainRef = useRef(null);

  const game = useMemo(() => computeGame({ completed, reviews, trackedTime }), [completed, reviews, trackedTime]);
  const dueIds = useMemo(() => new Set(game.due.map((d) => d.id)), [game.due]);

  // Only celebrate changes the player caused in the last few seconds (not a backend sync).
  const lastAction = useRef(0);
  const completedRef = useRef(completed);
  useEffect(() => { completedRef.current = completed; }, [completed]);

  const onToggle = useCallback((id) => {
    const q = BY_ID.get(id);
    const wasSolved = !!completedRef.current[id];
    lastAction.current = Date.now();
    toggleSolved(id);
    if (!wasSolved && q) notify({ text: `You have cleared “${q.title}”.`, xp: DIFF_XP[q.difficulty] });
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
      if (now.quest && !prev.quest) notify({ text: 'Daily Quest complete. The penalty has been avoided.', xp: QUEST_XP });
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
    case 'codex':
      page = <CodexPage tab={route.arg} />;
      break;
    default:
      page = <StatusPage game={game} username={username} completed={completed} onOpen={setOpenId} onAddTime={addTime} />;
  }

  return (
    <div className="flex h-full">
      <Sidebar
        page={route.page}
        username={username}
        offline={session.mode === 'offline'}
        level={game.level}
        rank={game.rank}
        dueCount={game.due.length}
        onSettings={openSettings}
      />
      <main ref={mainRef} className="flex-1 min-w-0 h-full overflow-y-auto scroll-thin">
        <div key={route.page} className="anim-fade mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-10 pt-6 md:pt-10 pb-28 md:pb-16">
          <Suspense fallback={null}>{page}</Suspense>
        </div>
      </main>

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
          onClose={closeSettings}
          account={{ username, mode: session.mode, onSignOut }}
        />
      )}
      <SystemLayer />
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(loadSession);
  const [theme, setTheme] = useTheme();
  const [notice, setNotice] = useState(() =>
    !loadSession() && legacyUsername() ? 'Sign-in got a security upgrade. Please sign in once more.' : '');

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
      <Suspense fallback={null}>
        <Login onLogin={login} notice={notice} theme={theme} onTheme={setTheme} />
      </Suspense>
    );
  }
  return <Tracker key={session.username} session={session} onSignOut={signOut} onExpired={expire} theme={theme} onTheme={setTheme} />;
}
