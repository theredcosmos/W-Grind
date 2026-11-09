// SD Book Notes, chapters 8-14 (Vol 1). Shape: ../schema.js; helpers: ./h.js.
import { t, steps, table, java, text, key, warn, tip, drill, qa, flow, src } from './h.js';

const S = [];

// ---------------------------------------------------------------- ch 8

S.push({
  id: 'ch08-url-shortener',
  title: 'Ch 8 · URL Shortener',
  summary: 'Turn a long URL into a 7-char code and redirect fast. Unique ID + Base62, cache in front of the DB.',
  tags: ['url shortener', 'tinyurl', 'base62', 'hash collision', 'bloom filter', '301 vs 302', 'redirect', 'vol 1'],
  source: src('08. URL Shortener'),
  blocks: [
    t("A URL shortener is a **coat check for links**. You hand over a long URL and get a tiny ticket (`tinyurl.com/zn9edcu`). Showing the ticket later gets you the original back. Two APIs do all the work: one to shorten, one to redirect."),
    flow([
      ['user:Client'],
      ['lb:Load balancer'],
      ['svc:Web servers (stateless)'],
      ['cache:Cache (short to long)', 'svc:Unique ID generator'],
      ['db:URL table (id, shortURL, longURL)'],
    ], 'Main architecture', ['', '', 'read / new id', 'miss / save']),
    key("**Unique ID + Base62** is the default answer: no collisions, short codes. 7 Base62 chars give 62^7 = **3.5 trillion** codes, plenty for 365 billion URLs. Reads beat writes 10:1, so a **cache** sits in front of the DB."),
    flow([
      ['user:POST /api/v1/data/shorten'],
      ['svc:Web server'],
      ['db:longURL already in DB?'],
      ['svc:Return existing shortURL', 'svc:ID generator: new id'],
      ['svc:Base62 encode id'],
      ['db:Save (id, shortURL, longURL)'],
    ], 'Shortening flow', ['', 'lookup', 'yes / no', 'id', 'shortURL']),
    flow([
      ['user:GET /zn9edcu'],
      ['lb:Load balancer'],
      ['svc:Web server'],
      ['cache:Cache', 'db:DB on miss'],
      ['user:301 / 302 to longURL'],
    ], 'Redirect flow', ['', '', 'lookup code', 'Location header']),
    steps([
      "Clarify scale: **100M new URLs/day** = about 1,160 writes/sec, reads 10x = about 11,600/sec.",
      "Storage: 100M x 365 x 10 years = **365 billion rows**, at ~100 bytes each = **365 TB**.",
      "APIs: `POST api/v1/data/shorten {longUrl}` returns the short URL; `GET api/v1/shortUrl` redirects.",
      "Data model: one relational table `(id, shortURL, longURL)`, indexed on both URL columns.",
      "Code generation: distributed unique ID (Snowflake, ch 7), then Base62 encode it.",
      "Redirect path: cache first, DB on miss, then return 301 or 302 with a `Location` header.",
      "Wrap up: rate limit per IP, stateless web tier, DB replication + sharding, click analytics.",
    ], 'HLD in 7 steps'),
    table(['', 'Hash + collision resolution', 'Unique ID + Base62'], [
      ['How', 'CRC32/MD5/SHA-1, keep first 7 chars', 'Encode an auto-increment or Snowflake ID'],
      ['Code length', 'Fixed (7)', 'Grows with the ID'],
      ['Needs ID generator', 'No', 'Yes'],
      ['Collisions', 'Yes: append a salt and rehash, check DB (Bloom filter helps)', 'Never (IDs are unique)'],
      ['Guessable next URL', 'No', 'Yes if IDs go up by 1 (security concern)'],
    ], 'Pick the hash function'),
    table(['Redirect', 'Meaning', 'Use when'], [
      ['301 Moved Permanently', 'Browser caches it; later clicks skip your servers', 'You want less server load'],
      ['302 Found', 'Temporary; every click hits your servers', 'You need click analytics'],
    ], '301 vs 302'),
    java(`
// LLD core: Base62 codec + shorten/resolve service. Maps stand in for DB and cache.
class Base62 {
    private static final String ALPHABET =
        "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    static String encode(long id) {
        if (id == 0) return "0";
        StringBuilder sb = new StringBuilder();
        while (id > 0) {
            sb.append(ALPHABET.charAt((int) (id % 62)));
            id /= 62;
        }
        return sb.reverse().toString();     // 11157 -> "2TX"
    }

    static long decode(String code) {
        long id = 0;
        for (char c : code.toCharArray()) id = id * 62 + ALPHABET.indexOf(c);
        return id;
    }
}

interface IdGenerator { long nextId(); }    // Snowflake from ch 7

class UrlShortener {
    private final IdGenerator ids;
    private final Map<String, String> longToShort = new ConcurrentHashMap<>(); // DB index on longURL
    private final Map<String, String> shortToLong = new ConcurrentHashMap<>(); // DB + cache

    UrlShortener(IdGenerator ids) { this.ids = ids; }

    String shorten(String longUrl) {
        // same long URL -> same code (idempotent)
        return longToShort.computeIfAbsent(longUrl, u -> {
            String code = Base62.encode(ids.nextId());
            shortToLong.put(code, u);
            return code;
        });
    }

    Optional<String> resolve(String code) {      // caller sends 301/302, or 404 if empty
        return Optional.ofNullable(shortToLong.get(code));
    }
}`, 'LLD: Base62 + shortener service in Java'),
    warn("Sequential IDs make codes **guessable**: anyone can walk `...a`, `...b`, `...c` and scrape every link. If that matters, use Snowflake IDs (not +1) or shuffle the ID bits before encoding."),
    warn("Picking 301 by default kills analytics: the browser caches it and you never see the second click. **Say the trade-off out loud.**"),
    qa([
      ["Why 7 characters?", "62^6 is about 56 billion, too few for 365 billion URLs. 62^7 is about 3.5 trillion, enough with room to spare."],
      ["Hash approach: how do you check for a collision cheaply?", "A Bloom filter of existing codes answers 'definitely not used' in memory, so most checks skip the DB."],
      ["Same long URL submitted twice?", "Look up `longURL` first and return the existing code. That keeps writes idempotent and saves space."],
      ["How do you scale reads?", "Cache the hot short-to-long pairs (Redis), read replicas behind it, shard the table by ID once one DB is not enough."],
    ]),
    drill("5 minutes, no notes: write `encode()` and `decode()`, convert 11157 to Base62 by hand, then draw both flows and say when you pick 301 vs 302."),
  ],
});

// ---------------------------------------------------------------- ch 9

S.push({
  id: 'ch09-web-crawler',
  title: 'Ch 9 · Web Crawler',
  summary: 'BFS over the web graph at 400 pages/sec. The URL frontier handles politeness and priority.',
  tags: ['web crawler', 'spider', 'url frontier', 'politeness', 'robots.txt', 'bfs', 'dedupe', 'spider trap', 'vol 1'],
  source: src('09. Web Crawler'),
  blocks: [
    t("A web crawler is a **librarian walking every shelf**. Start from a few seed pages, download each one, pull out its links, and add the new ones to the to-do pile. Repeat for **1 billion pages a month** without hammering any single site."),
    flow([
      ['Seed URLs'],
      ['q:URL frontier'],
      ['svc:HTML downloader', 'lb:DNS resolver'],
      ['svc:Content parser'],
      ['svc:Content seen?', 'store:Content storage'],
      ['svc:URL extractor'],
      ['svc:URL filter'],
      ['svc:URL seen?', 'db:URL storage'],
    ], 'Main architecture', ['', 'next URL', 'HTML', 'valid page', 'new content', 'links', 'clean links'], 'New URLs that pass `URL seen?` go back into the URL frontier. That loop is the whole crawler.'),
    key("It is **BFS**, not DFS (the web is too deep). The **URL frontier** is the brain: front queues for **priority**, back queues for **politeness** (one host per worker, delay between hits). Dedupe both content (hash) and URLs (seen set / Bloom filter)."),
    flow([
      ['svc:Prioritizer'],
      ['q:Front queues f1..fn'],
      ['svc:Front selector (biased random)'],
      ['lb:Back router + host to queue map'],
      ['q:Back queues b1..bn (one host each)'],
      ['svc:Back selector'],
      ['svc:Worker threads 1..N'],
    ], 'URL frontier inside', ['rank', 'high first', '', 'by host', '', 'delay per host']),
    steps([
      "Clarify: purpose (search indexing), **1B pages/month**, HTML only, keep 5 years, skip duplicates.",
      "Estimate: 1B / 30 days / 86,400 s = **~400 pages/sec**, peak ~800. 500 KB/page = 500 TB/month, **~30 PB** over 5 years.",
      "Draw the loop: seeds, frontier, downloader + DNS, parser, content seen, extractor, filter, URL seen.",
      "Traversal: BFS with a frontier, not a plain FIFO (plain FIFO floods one host and ignores importance).",
      "Frontier: front queues by priority (PageRank, traffic, update rate), back queues by host for politeness.",
      "Downloader: obey `robots.txt` (cache it), DNS cache, short timeouts, crawl servers spread by region.",
      "Robustness: consistent hashing across crawl servers, save crawl state, catch every exception per page.",
      "Freshness: recrawl based on how often a page changed before; important pages more often.",
    ], 'HLD in 8 steps'),
    table(['Problem', 'What it looks like', 'Fix'], [
      ['Duplicate content', '~30% of pages are copies', 'Hash page content, compare against `Content seen?`'],
      ['Spider trap', 'Infinite URL like `/a/b/a/b/a/b/...`', 'Cap URL length and depth, blocklist the site'],
      ['Data noise', 'Ads, spam, code snippets', 'Filter out, low priority'],
      ['Impolite crawling', 'Many hits/sec to one host', 'Per-host back queue + delay'],
      ['Slow site', 'Download hangs', 'Short timeout, move on'],
    ], 'Problem content and fixes'),
    java(`
// LLD core: URL frontier with one FIFO per host and a min-heap of "host is free at time T".
class UrlFrontier {
    private static class HostSlot {
        final String host; long readyAt;
        HostSlot(String host, long readyAt) { this.host = host; this.readyAt = readyAt; }
    }

    private final Map<String, Deque<String>> hostQueues = new HashMap<>();   // back queues
    private final Map<String, Long> nextAllowed = new HashMap<>();           // politeness clock
    private final PriorityQueue<HostSlot> ready =
        new PriorityQueue<>(Comparator.comparingLong((HostSlot s) -> s.readyAt));
    private final Set<String> seen = new HashSet<>();   // "URL seen?"; Bloom filter at scale
    private final long delayMs;

    UrlFrontier(long delayMs) { this.delayMs = delayMs; }

    synchronized void add(String url) {
        if (!seen.add(url)) return;                      // already queued or crawled
        String host = URI.create(url).getHost();
        Deque<String> q = hostQueues.get(host);
        if (q == null) {
            q = new ArrayDeque<>();
            hostQueues.put(host, q);
            ready.add(new HostSlot(host, nextAllowed.getOrDefault(host, 0L)));
        }
        q.addLast(url);
    }

    /** Next URL whose host may be hit now, or null if every host is cooling down. */
    synchronized String next(long nowMs) {
        HostSlot slot = ready.peek();
        if (slot == null || slot.readyAt > nowMs) return null;
        ready.poll();
        Deque<String> q = hostQueues.get(slot.host);
        String url = q.pollFirst();
        nextAllowed.put(slot.host, nowMs + delayMs);     // politeness delay
        if (q.isEmpty()) {
            hostQueues.remove(slot.host);
        } else {
            slot.readyAt = nowMs + delayMs;
            ready.add(slot);
        }
        return url;
    }
}`, 'LLD: polite URL frontier in Java'),
    warn("A plain FIFO frontier is the classic trap: most links on a page point to the **same host**, so you would DoS that site. Always split by host."),
    tip("Extensibility is a plug-in point after the downloader: add a PNG downloader or a copyright monitor as a new module without touching the loop."),
    qa([
      ["How do you detect a duplicate page cheaply?", "Hash the content (or a fingerprint like SimHash for near-duplicates) and check the set. Comparing raw text character by character is far too slow."],
      ["How do you store billions of seen URLs?", "A Bloom filter in memory for the fast 'no', backed by URL storage on disk. Most of the frontier also lives on disk with memory buffers."],
      ["How do you handle JavaScript-built pages?", "Server-side (dynamic) rendering before parsing, so links created by JS are found."],
      ["How do you prioritize?", "Score each URL (PageRank, traffic, update frequency), put it in a front queue by score, pick high queues more often."],
    ]),
    drill("5 minutes, no notes: draw the 8-box crawler loop, then the front/back queue picture, then write `next()` from memory. Say the 400 QPS and 30 PB math out loud."),
  ],
});

// ---------------------------------------------------------------- ch 10

S.push({
  id: 'ch10-notification-system',
  title: 'Ch 10 · Notification System',
  summary: 'Send push, SMS and email at 16M/day. Queues per channel, workers, retries, dedupe, opt-out.',
  tags: ['notification', 'push', 'apns', 'fcm', 'sms', 'email', 'message queue', 'retry', 'dedupe', 'vol 1'],
  source: src('10. Notification System'),
  blocks: [
    t("A notification system is a **post office with four mail trucks**. Services drop letters at the counter. Clerks check the address and sort letters into a queue per truck (iOS, Android, SMS, email). Each truck hands them to a third party (APNs, FCM, Twilio, SendGrid) that does the last mile."),
    flow([
      ['svc:Services 1..N (billing, shipping, cron)'],
      ['svc:Notification servers', 'cache:Cache', 'db:DB'],
      ['q:iOS queue', 'q:Android queue', 'q:SMS queue', 'q:Email queue'],
      ['svc:Workers'],
      ['ext:APNs', 'ext:FCM', 'ext:Twilio', 'ext:SendGrid'],
      ['user:Devices'],
    ], 'Main architecture', ['API call', 'event per channel', 'pull', 'send', 'deliver']),
    key("**One queue per channel** so a slow SMS provider never blocks push. Persist every notification in a **notification log** and retry on failure. Dedupe by **event ID**: delivery is at-least-once, so exactly-once is not possible."),
    flow([
      ['user:App install / signup'],
      ['lb:Load balancer'],
      ['svc:API servers'],
      ['db:User table (email, phone)', 'db:Device table (device token)'],
    ], 'Contact info gathering', ['', '', 'store contact info']),
    flow([
      ['q:Channel queue'],
      ['svc:Worker'],
      ['db:Notification log'],
      ['ext:Third-party provider'],
    ], 'Reliability: no lost messages', ['pull', 'persist first', 'send, retry on fail'], 'If the provider fails, the worker puts the event back with backoff. The log lets a crashed worker resume.'),
    steps([
      "Clarify: push (iOS, Android, desktop), SMS, email. Soft real-time. Opt-out allowed.",
      "Scale: **10M push + 1M SMS + 5M email per day**.",
      "Gather contact info at install/signup: device tokens, phone, email.",
      "Notification servers: auth the caller, validate, fetch user data and template from cache/DB.",
      "Put one event per channel on its queue; stateless workers pull and call the provider.",
      "Reliability: notification log + retry with backoff; dedupe by event ID.",
      "Extras: templates, per-user settings (opt-out), rate limit per user, queue-depth monitoring, open/click tracking.",
    ], 'HLD in 7 steps'),
    table(['Channel', 'Provider', 'Needs', 'Volume/day'], [
      ['iOS push', 'APNs', 'Device token + payload', 'part of 10M'],
      ['Android push', 'FCM', 'Device token + payload', 'part of 10M'],
      ['SMS', 'Twilio, Nexmo', 'Phone number', '1M'],
      ['Email', 'SendGrid, Mailchimp', 'Email address', '5M'],
    ], 'Channels'),
    table(['', 'First design', 'Improved design'], [
      ['Servers', 'One notification server', 'Many, behind a load balancer'],
      ['DB and cache', 'Inside the server', 'Separate tiers, scale alone'],
      ['Sending', 'Synchronous calls to providers', 'Queues + workers'],
      ['Failure', 'SPOF, lost messages', 'Retry from log, no SPOF'],
    ], 'Why the first design fails'),
    java(`
// LLD core: worker with one strategy per channel, opt-out check, dedupe and retry.
enum Channel { IOS_PUSH, ANDROID_PUSH, SMS, EMAIL }

record Notification(String eventId, long userId, Channel channel, String to, String body) {}

class TransientException extends Exception {}

interface ChannelSender {                        // strategy: APNs, FCM, Twilio, SendGrid
    void send(Notification n) throws TransientException;
}

interface Settings { boolean optedIn(long userId, Channel c); }
interface NotificationLog { void record(Notification n, String status); }

class NotificationWorker {
    private static final int MAX_ATTEMPTS = 5;
    private final Map<Channel, ChannelSender> senders;
    private final Settings settings;
    private final NotificationLog log;
    private final Set<String> sentIds = ConcurrentHashMap.newKeySet(); // Redis SETNX + TTL in prod

    NotificationWorker(Map<Channel, ChannelSender> senders, Settings settings, NotificationLog log) {
        this.senders = senders; this.settings = settings; this.log = log;
    }

    void handle(Notification n) throws InterruptedException {
        if (!settings.optedIn(n.userId(), n.channel())) return;   // respect opt-out
        if (!sentIds.add(n.eventId())) return;                     // seen before: drop
        long backoffMs = 1000;
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                senders.get(n.channel()).send(n);
                log.record(n, "SENT");
                return;
            } catch (TransientException e) {
                log.record(n, "RETRY " + attempt);
                Thread.sleep(backoffMs);      // prod: re-enqueue with a delay instead of sleeping
                backoffMs *= 2;
            }
        }
        sentIds.remove(n.eventId());          // let a later replay try again
        log.record(n, "FAILED");              // dead-letter for a human or a later job
    }
}`, 'LLD: notification worker in Java'),
    warn("Do not promise **exactly-once** delivery. Queues and retries give at-least-once; dedupe by event ID makes duplicates rare, not impossible."),
    warn("Never let services call APNs or Twilio directly. Without the queue, a provider outage backs up into every caller."),
    qa([
      ["How do you avoid spamming a user?", "Per-user rate limit on the notification servers, plus honoring the settings table (opt-out per channel)."],
      ["A provider is down. What happens?", "Workers fail, events go back with exponential backoff, the log keeps them safe. Add a second provider for SMS/email as failover."],
      ["How do you secure the send API?", "Only authenticated internal clients can call it: `appKey` + `appSecret` (or mTLS)."],
      ["How do you know it works?", "Monitor queue depth to autoscale workers, and track delivered, opened and clicked events for each notification."],
    ]),
    drill("5 minutes, no notes: draw services to devices with 4 queues, then write `handle()` with opt-out, dedupe and retry. Say the daily volumes per channel."),
  ],
});

// ---------------------------------------------------------------- ch 11

S.push({
  id: 'ch11-news-feed',
  title: 'Ch 11 · News Feed System',
  summary: 'Publish a post and build a reverse-chronological feed. Fanout on write, pull for celebrities.',
  tags: ['news feed', 'timeline', 'fanout', 'push vs pull', 'celebrity', 'feed cache', 'social graph', 'vol 1'],
  source: src('11. News Feed System'),
  blocks: [
    t("A news feed is a **personal mailbox per user**. When you post, the system drops a copy of the post ID into each friend's mailbox (fanout on write). Reading the feed is then just opening your own mailbox. Celebrities are the exception: too many mailboxes, so their posts are fetched at read time."),
    flow([
      ['user:User (POST /v1/me/feed)'],
      ['lb:Load balancer'],
      ['svc:Web servers (auth, rate limit)'],
      ['svc:Post service', 'svc:Fanout service', 'svc:Notification service'],
      ['db:Post DB + post cache', 'cache:News feed cache'],
    ], 'Feed publishing', ['', '', '', 'save / push ids']),
    key("Two flows: **publish** and **build**. Use **hybrid fanout**: push to friends' feed caches for normal users, pull at read time for celebrities. The feed cache stores only `<post_id, user_id>`, never full posts."),
    flow([
      ['user:User (GET /v1/me/feed)'],
      ['lb:Load balancer'],
      ['svc:Web servers'],
      ['svc:News feed service'],
      ['cache:News feed cache (ids)', 'cache:User cache', 'cache:Post cache'],
    ], 'Feed building', ['', '', '', 'ids, then hydrate'], 'The service reads post IDs, then fills in author names, avatars and post bodies from the user and post caches.'),
    flow([
      ['svc:Fanout service'],
      ['db:Graph DB (friend ids)', 'cache:User settings cache'],
      ['q:Message queue'],
      ['svc:Fanout workers'],
      ['cache:News feed cache'],
    ], 'Fanout deep dive', ['', 'friends minus muted', 'post id + friend list', 'append id (capped)']),
    steps([
      "Clarify: web + mobile, publish and view, reverse chronological, **up to 5,000 friends**, **10M DAU**.",
      "APIs: `POST /v1/me/feed` with `content` + `auth_token`; `GET /v1/me/feed` with `auth_token`.",
      "Publish: LB, web servers, post service writes post DB + cache.",
      "Fanout service: get friend IDs from the graph DB, drop muted ones, push to a queue.",
      "Fanout workers append the post ID to each friend's feed list; keep only the latest few hundred.",
      "Build: news feed service reads IDs from the feed cache, hydrates from user + post caches.",
      "Celebrities: skip fanout, merge their recent posts at read time.",
      "Scale: 5 cache tiers, DB sharding + read replicas, stateless web tier.",
    ], 'HLD in 8 steps'),
    table(['', 'Fanout on write (push)', 'Fanout on read (pull)', 'Hybrid'], [
      ['When work happens', 'At post time', 'At read time', 'Push for most, pull for celebrities'],
      ['Read speed', 'Fast: feed is precomputed', 'Slow: gather on every read', 'Fast for most users'],
      ['Weak spot', 'Hotkey: 1 post x millions of followers', 'Slow feed load', 'More moving parts'],
      ['Wasted work', 'Writes feeds of inactive users', 'None', 'Little'],
    ], 'Push vs pull'),
    table(['Cache tier', 'Holds'], [
      ['News feed', 'Post IDs per user'],
      ['Content', 'Post bodies (hot posts separate)'],
      ['Social graph', 'Follower / following lists'],
      ['Action', 'Liked, replied, shared by me?'],
      ['Counters', 'Like, reply, follower counts'],
    ], 'The 5 cache tiers'),
    java(`
// LLD core: fanout on write with a celebrity skip, and a read path that merges them back.
interface Graph {
    List<Long> followers(long userId);
    long followerCount(long userId);
    List<Long> followedCelebrities(long userId);
}
interface Settings { boolean muted(long viewerId, long authorId); }
interface Posts { List<Long> recentIds(long authorId, int limit); }

class FeedCache {                                   // Redis list per user in prod
    private final Map<Long, Deque<Long>> feeds = new ConcurrentHashMap<>();
    private final int cap;
    FeedCache(int cap) { this.cap = cap; }

    void prepend(long userId, long postId) {
        Deque<Long> d = feeds.computeIfAbsent(userId, k -> new ConcurrentLinkedDeque<>());
        d.addFirst(postId);
        while (d.size() > cap) d.pollLast();      // keep only recent posts
    }
    List<Long> get(long userId) { return new ArrayList<>(feeds.getOrDefault(userId, new ArrayDeque<>())); }
}

class FanoutService {
    static final long CELEBRITY_THRESHOLD = 100_000;
    private final Graph graph; private final Settings settings; private final FeedCache feeds;

    FanoutService(Graph g, Settings s, FeedCache f) { graph = g; settings = s; feeds = f; }

    void onPost(long authorId, long postId) {      // runs in fanout workers off a queue
        if (graph.followerCount(authorId) > CELEBRITY_THRESHOLD) return;   // pulled at read time
        for (long f : graph.followers(authorId)) {
            if (!settings.muted(f, authorId)) feeds.prepend(f, postId);
        }
    }
}

class NewsFeedService {
    private final Graph graph; private final Posts posts; private final FeedCache feeds;

    NewsFeedService(Graph g, Posts p, FeedCache f) { graph = g; posts = p; feeds = f; }

    List<Long> feed(long userId, int limit) {
        List<Long> ids = feeds.get(userId);
        for (long celeb : graph.followedCelebrities(userId)) ids.addAll(posts.recentIds(celeb, limit));
        ids.sort(Comparator.reverseOrder());         // Snowflake ids sort by time
        return ids.subList(0, Math.min(limit, ids.size()));
    }
}`, 'LLD: hybrid fanout in Java'),
    warn("Storing full post objects in every friend's feed explodes memory (5,000 copies of each post). **Store IDs only** and hydrate on read."),
    tip("Say why the fanout goes through a queue: the post request returns at once, and slow fanout to 5,000 friends happens in the background."),
    qa([
      ["Why not pure push?", "A celebrity with 10M followers turns one post into 10M cache writes (the hotkey problem). Pull their posts at read time instead."],
      ["Why not pure pull?", "Every feed load would query hundreds of friends' posts and merge them. Too slow for 10M DAU."],
      ["Where does the friend list come from?", "A graph DB (or social graph cache) fetched by the fanout service."],
      ["How do you keep the feed cache small?", "Cap each list (for example the latest 500 IDs). Older pages fall back to the DB, and few users scroll that far."],
    ]),
    drill("5 minutes, no notes: draw both flows side by side, fill the push vs pull table, then write `onPost()` with the celebrity skip and `feed()` with the merge."),
  ],
});

// ---------------------------------------------------------------- ch 12

S.push({
  id: 'ch12-chat-system',
  title: 'Ch 12 · Chat System',
  summary: '1:1 and group chat for 50M DAU. WebSocket chat servers, KV store, per-channel message ids, presence.',
  tags: ['chat', 'websocket', 'long polling', 'presence', 'heartbeat', 'kv store', 'message sync', 'whatsapp', 'vol 1'],
  source: src('12. Chat System'),
  blocks: [
    t("A chat system is a **switchboard with open phone lines**. Every online user keeps one line (a WebSocket) open to a chat server. A message comes in on the sender's line, gets an ID and is saved, then goes out on the receiver's line, or as a push notification if they are offline."),
    flow([
      ['user:User (phone, laptop)'],
      ['lb:Load balancer', 'svc:Chat servers (WebSocket)', 'svc:Presence servers'],
      ['svc:API servers (login, profile, discovery)'],
      ['svc:Notification servers', 'db:KV store (chat history)'],
    ], 'Main architecture', ['http / ws', '', 'push / persist'], 'Stateless side: LB + API servers. Stateful side: chat and presence servers, which hold open WebSocket connections.'),
    key("**WebSocket** both ways for real-time. **KV store** (HBase, Cassandra) for history: it scales out and handles the long tail. Order messages by a **message_id that is unique per channel**, and sync devices with `cur_max_message_id`."),
    flow([
      ['user:User A'],
      ['svc:Chat server 1'],
      ['svc:ID generator', 'q:Message sync queue'],
      ['db:KV store'],
      ['svc:Chat server 2 (B online)', 'ext:Push notification (B offline)'],
      ['user:User B'],
    ], '1-on-1 message flow', ['ws', 'id + enqueue', 'persist', 'presence check', 'ws / push']),
    flow([
      ['user:User A'],
      ['svc:Chat server'],
      ['q:Sync queue of B', 'q:Sync queue of C'],
      ['user:User B', 'user:User C'],
    ], 'Group chat (max 100 members)', ['', 'copy into each inbox', 'pull']),
    flow([
      ['user:Client'],
      ['svc:Presence server'],
      ['cache:Presence KV (last seen)'],
      ['q:Pub/sub channels A-B, A-C, A-D'],
      ['user:Friends B, C, D'],
    ], 'Online presence', ['heartbeat every 5 s', 'no beat in 30 s = offline', 'status change', 'subscribe']),
    steps([
      "Clarify: 1:1 + group (**max 100**), text up to 100,000 chars, presence, multi-device, push, **50M DAU**, history kept forever.",
      "Protocol: WebSocket for send and receive (HTTP for everything else).",
      "Split services: stateless (login, profile, service discovery), stateful (chat, presence), third party (push).",
      "Service discovery (ZooKeeper) picks the best chat server by region and load at login.",
      "Storage: users/profiles in SQL; messages in a KV store, key `(channel_id, message_id)`.",
      "Message IDs: Snowflake works, but a **local sequence per channel** is enough for ordering.",
      "Group: write into each member's sync queue (fine for 100 members).",
      "Presence: heartbeats, 30 s timeout, publish changes on per-friend-pair channels.",
    ], 'HLD in 8 steps'),
    table(['', 'Short polling', 'Long polling', 'WebSocket'], [
      ['How', 'Client asks every few seconds', 'Server holds the request until data or timeout', 'One persistent two-way connection'],
      ['Latency', 'Up to the poll interval', 'Low', 'Lowest'],
      ['Waste', 'Most answers are empty', 'Reconnects; idle users still hold requests', 'One idle socket per user'],
      ['Server push', 'No', 'Sort of', 'Yes'],
      ['Verdict', 'No', 'Fallback', '**Pick this**'],
    ], 'Receive side: 3 options'),
    table(['Table', 'Primary key', 'Columns'], [
      ['Message (1:1)', '`message_id`', 'message_from, message_to, content, created_at'],
      ['Group message', '`(channel_id, message_id)`', 'user_id, content, created_at'],
    ], 'Data model'),
    java(`
// LLD core: message + per-channel KV store keyed by message_id, and device sync by max id.
record Message(long channelId, long messageId, long fromUserId, String content, long createdAt) {}

class ChatStore {
    // KV: channel_id -> (message_id -> message), sorted by message_id
    private final Map<Long, ConcurrentSkipListMap<Long, Message>> byChannel = new ConcurrentHashMap<>();
    private final Map<Long, AtomicLong> seq = new ConcurrentHashMap<>();  // local id per channel

    Message append(long channelId, long fromUserId, String content) {
        long id = seq.computeIfAbsent(channelId, c -> new AtomicLong()).incrementAndGet();
        Message m = new Message(channelId, id, fromUserId, content, System.currentTimeMillis());
        byChannel.computeIfAbsent(channelId, c -> new ConcurrentSkipListMap<>()).put(id, m);
        return m;
    }

    /** Messages newer than the device's cursor, in order. */
    Collection<Message> since(long channelId, long curMaxMessageId) {
        ConcurrentSkipListMap<Long, Message> msgs = byChannel.get(channelId);
        return msgs == null ? List.of() : msgs.tailMap(curMaxMessageId, false).values();
    }
}

class Device {
    private final Map<Long, Long> curMaxMessageId = new HashMap<>();  // per channel cursor

    List<Message> sync(ChatStore store, long channelId) {
        long cursor = curMaxMessageId.getOrDefault(channelId, 0L);
        List<Message> fresh = new ArrayList<>(store.since(channelId, cursor));
        if (!fresh.isEmpty()) {
            curMaxMessageId.put(channelId, fresh.get(fresh.size() - 1).messageId());
        }
        return fresh;
    }
}`, 'LLD: message store + device sync in Java'),
    warn("`created_at` cannot order messages: two messages can share a timestamp, and clocks drift across servers. **Order by message_id.**"),
    warn("Presence fanout per friend pair is fine for small groups. For a 100k-member group it explodes; fetch presence only when a user opens the group."),
    qa([
      ["Why a KV store and not MySQL?", "Chat data is huge and mostly recent reads. KV stores scale out easily, stay fast, and avoid giant indexes. Facebook Messenger (HBase) and Discord (Cassandra) do this."],
      ["How do multiple devices stay in sync?", "Each device keeps `cur_max_message_id`; on connect it fetches every message for this user with a higher ID from the KV store."],
      ["A chat server dies. What happens?", "Clients lose the socket, reconnect, and service discovery hands them a new server. Messages are already persisted, so nothing is lost."],
      ["How do you avoid flapping online/offline on bad networks?", "Heartbeats: the client pings every 5 s and is marked offline only after 30 s of silence."],
    ]),
    drill("5 minutes, no notes: draw the architecture, then the 1:1 flow with online and offline branches, then write `append()` and `sync()`. Fill the polling vs WebSocket table."),
  ],
});

// ---------------------------------------------------------------- ch 13

S.push({
  id: 'ch13-search-autocomplete',
  title: 'Ch 13 · Search Autocomplete',
  summary: 'Top 5 suggestions per prefix in under 100 ms. Trie with top-k cached at every node, rebuilt weekly.',
  tags: ['autocomplete', 'typeahead', 'trie', 'top k', 'prefix', 'data gathering', 'sharding', 'vol 1'],
  source: src('13. Search Autocomplete'),
  blocks: [
    t("Autocomplete is a **cheat sheet taped to every letter**. For each prefix you might type (`t`, `tw`, `twi`), the top 5 answers are already written down. Typing just looks up the sheet; nothing is sorted at query time. A separate offline job rewrites the sheets once a week."),
    flow([
      ['user:User types'],
      ['lb:Load balancer'],
      ['svc:API servers'],
      ['cache:Trie cache'],
      ['db:Trie DB'],
    ], 'Query service', ['GET /search?q=tw', '', 'top 5 for prefix', 'on miss']),
    key("Two services: **query** (fast reads) and **data gathering** (slow, offline). Cache the **top k at each trie node**, so a lookup is O(prefix length). Rebuild the trie **weekly** from aggregated logs, not on every search."),
    flow([
      ['store:Analytics logs'],
      ['svc:Aggregators'],
      ['db:Aggregated data (query, week, freq)'],
      ['svc:Workers'],
      ['db:Trie DB'],
      ['cache:Trie cache'],
    ], 'Data gathering pipeline', ['raw queries', 'weekly counts', 'build trie', 'snapshot', 'load']),
    text(`
root
 |
 t    top: [true:35, try:29, toy:14, tree:10]
 |-- o    top: [toy:14]
 |   '-- y    top: [toy:14]
 '-- r    top: [true:35, try:29, tree:10]
     |-- e    top: [tree:10]
     |   '-- e    top: [tree:10]
     |-- u    top: [true:35]
     |   '-- e    top: [true:35]
     '-- y    top: [try:29]

Lookup "tr": walk t -> r (2 steps), return the cached list. No subtree scan.`, 'Trie with top-k cached at each node'),
    flow([
      ['svc:Web servers'],
      ['lb:Shard map manager'],
      ['db:Shard 1 (a..m)', 'db:Shard 2 (n..s)', 'db:Shard 3 (t..z, split further)'],
    ], 'Sharding by prefix', ['which shard for this prefix?', '']),
    steps([
      "Clarify: top 5 by frequency, lowercase English, prefix match only, **< 100 ms**.",
      "Estimate: **10M DAU** x 10 searches x 20 chars = **~24,000 QPS**, peak **~48,000**. New data ~**0.4 GB/day**.",
      "Draw query service: client, LB, API servers, trie cache, trie DB.",
      "Trie: cap prefix length (~50), cache top k at every node, lookup = walk the prefix.",
      "Data gathering: analytics logs, aggregators (weekly), workers build the trie, store in trie DB, load into cache.",
      "Filter layer between API and cache removes hateful or unsafe suggestions.",
      "Client side: AJAX per keystroke, browser cache results (for example 1 hour).",
      "Scale: shard by prefix using real traffic stats, not just a..z.",
    ], 'HLD in 8 steps'),
    table(['Option', 'How the trie is stored', 'Good for'], [
      ['Document store (MongoDB)', 'Serialize the weekly snapshot', 'Simple full rebuilds'],
      ['Key-value store', 'Key = prefix, value = node data (top k)', 'Direct prefix lookups'],
      ['Trie cache (in memory)', 'Distributed cache of the trie', 'The hot read path'],
    ], 'Where the trie lives'),
    java(`
// LLD core: trie where every node keeps its top K queries, built offline from a frequency table.
class AutocompleteTrie {
    private static final int K = 5;
    private static final int MAX_PREFIX = 50;

    private static class Node {
        final Map<Character, Node> kids = new HashMap<>();
        final List<String> topK = new ArrayList<>();
    }

    private final Node root = new Node();
    private final Map<String, Long> freq = new HashMap<>();

    /** Called once per (query, count) row during the weekly build. */
    void insert(String query, long count) {
        freq.put(query, count);
        Node n = root;
        for (int i = 0; i < query.length() && i < MAX_PREFIX; i++) {
            n = n.kids.computeIfAbsent(query.charAt(i), c -> new Node());
            offer(n, query);
        }
    }

    private void offer(Node n, String q) {
        if (!n.topK.contains(q)) n.topK.add(q);
        n.topK.sort((a, b) -> Long.compare(freq.get(b), freq.get(a)));
        if (n.topK.size() > K) n.topK.remove(K);       // drop the weakest
    }

    /** O(prefix length): walk down, return the cached list. */
    List<String> suggest(String prefix) {
        Node n = root;
        for (char c : prefix.toLowerCase().toCharArray()) {
            n = n.kids.get(c);
            if (n == null) return List.of();
        }
        return List.copyOf(n.topK);
    }
}`, 'LLD: top-k trie in Java'),
    warn("Updating the trie on every search sounds real-time but does not scale: billions of writes, and each one touches up to 50 nodes plus their top-k lists. **Batch and rebuild.**"),
    warn("Sharding by first letter is uneven: far more words start with `s` than `x`. Shard on **historical traffic**, using a shard map manager."),
    qa([
      ["Lookup cost without the top-k cache?", "Find the prefix node O(p), scan its whole subtree O(c), sort O(c log c). Caching top k makes it O(p), at the cost of extra memory per node."],
      ["How do you handle trending queries (breaking news)?", "Weekly rebuild is too slow. Use a streaming pipeline (Kafka, Spark) and weight recent queries more."],
      ["How do you remove a bad suggestion now?", "A filter layer in front of the cache hides it instantly; the row is deleted from the DB asynchronously."],
      ["Other languages?", "Store Unicode chars in nodes, and build per-country tries since top queries differ by region."],
    ]),
    drill("5 minutes, no notes: draw the query service and the data gathering pipeline, sketch a trie for `tree, true, try, toy` with top-k lists, then write `insert()` and `suggest()`."),
  ],
});

// ---------------------------------------------------------------- ch 14

S.push({
  id: 'ch14-youtube',
  title: 'Ch 14 · YouTube',
  summary: 'Upload, transcode and stream video. Blob storage + DAG transcoding pipeline + CDN for playback.',
  tags: ['youtube', 'video streaming', 'transcoding', 'dag', 'cdn', 'blob storage', 'pre-signed url', 'vol 1'],
  source: src('14. Youtube'),
  blocks: [
    t("YouTube is a **film lab plus a chain of cinemas**. You drop off raw footage (upload to blob storage). The lab copies it into many sizes and formats (transcoding). The copies go to cinemas near viewers (the CDN), and playback never touches the lab again."),
    flow([
      ['user:Client'],
      ['svc:API servers', 'store:Original storage'],
      ['svc:Transcoding servers'],
      ['store:Transcoded storage', 'q:Completion queue'],
      ['ext:CDN', 'svc:Completion handler'],
      ['db:Metadata DB + cache'],
    ], 'Upload pipeline', ['metadata / video', 'new upload', 'renditions + event', 'distribute / consume', 'mark ready'], 'Streaming is separate: the client plays straight from the nearest CDN edge using MPEG-DASH or HLS.'),
    key("Two flows: **upload** and **stream**. Streaming comes from the **CDN**, not your servers. Transcoding is a **DAG of tasks** (split, encode, thumbnail, watermark) run in parallel. The CDN is the biggest cost: **~$150,000/day**."),
    flow([
      ['store:Original video'],
      ['svc:Video', 'svc:Audio', 'svc:Metadata'],
      ['svc:Encode 360p..4K', 'svc:Thumbnail', 'svc:Watermark', 'svc:Audio encode'],
      ['store:Assembled output'],
    ], 'Transcoding DAG', ['split', 'stage 2 tasks', 'merge']),
    flow([
      ['svc:Preprocessor (split GOPs, build DAG)'],
      ['svc:DAG scheduler (stages)'],
      ['q:Resource manager (task, worker, running queues)'],
      ['svc:Task workers'],
      ['store:Encoded video', 'store:Temporary storage'],
    ], 'Transcoding architecture', ['DAG', 'tasks per stage', 'best task + worker', 'output / retry data']),
    flow([
      ['user:Client'],
      ['svc:API servers'],
      ['store:Cloud storage (S3)'],
    ], 'Pre-signed upload URL', ['1. ask for upload URL', '2. PUT video with signed URL'], 'The API server returns a time-limited signed URL. Only authorized users can upload, and the bytes skip your API servers.'),
    steps([
      "Clarify: upload + watch, mobile/web/TV, many resolutions, **5M DAU**, max 1 GB per video.",
      "Estimate: 10% upload 1 video/day x **300 MB** = **150 TB/day**. CDN: 5M x 5 videos x 0.3 GB x $0.02 = **$150,000/day**.",
      "Draw: client, CDN (stream), API servers, metadata DB + cache, original storage, transcoding, transcoded storage.",
      "Upload: pre-signed URL, chunked resumable upload to original storage; metadata update in parallel.",
      "Transcode: preprocessor, DAG scheduler, resource manager, task workers, temp storage for retries.",
      "Finish: transcoded files to storage + CDN, completion queue, handler marks the video ready.",
      "Optimize: queues between stages, upload centers near users, DRM / AES / watermark for protection.",
      "Cost: CDN only for popular videos, encode rare ones on demand, regional distribution, ISP partnerships.",
    ], 'HLD in 8 steps'),
    table(['Goal', 'Trick'], [
      ['Faster upload', 'Split by GOP into chunks, upload in parallel, resume failed chunks'],
      ['Faster upload', 'Upload centers near users (CDN as entry point)'],
      ['Faster pipeline', 'Message queues between stages so each scales alone'],
      ['Safety', 'Pre-signed URLs; DRM (FairPlay, Widevine), AES, watermark'],
      ['Lower cost', 'Long-tail videos from cheap servers, popular ones from CDN'],
      ['Lower cost', 'Encode rarely watched videos on demand'],
    ], 'Optimizations'),
    java(`
// LLD core: upload service + DAG scheduler that runs each stage of tasks in parallel.
class Task {
    final String name;
    final List<Task> children = new ArrayList<>();
    int indegree;
    Task(String name) { this.name = name; }
    Task then(Task... next) {
        for (Task c : next) { children.add(c); c.indegree++; }
        return this;
    }
}

class DagScheduler {
    private final ExecutorService workers = Executors.newFixedThreadPool(8);

    void run(List<Task> tasks, Consumer<Task> worker) throws Exception {
        Map<Task, Integer> indeg = new HashMap<>();
        for (Task t : tasks) indeg.put(t, t.indegree);
        List<Task> stage = tasks.stream().filter(t -> t.indegree == 0).toList();
        while (!stage.isEmpty()) {
            List<Callable<Void>> jobs = new ArrayList<>();
            for (Task t : stage) jobs.add(() -> { worker.accept(t); return null; });
            for (Future<Void> f : workers.invokeAll(jobs)) f.get();  // throws -> retry from temp storage
            List<Task> next = new ArrayList<>();
            for (Task t : stage)
                for (Task c : t.children)
                    if (indeg.merge(c, -1, Integer::sum) == 0) next.add(c);
            stage = next;
        }
    }
}

class UploadService {
    interface Blob { String presignPut(String key, Duration ttl); }
    interface Meta { void insert(long videoId, long userId, String name); void status(long videoId, String s); }
    interface Queue { void publish(long videoId); }

    private final Blob blob; private final Meta meta; private final Queue transcodeQ;
    private final AtomicLong ids = new AtomicLong();       // Snowflake in prod

    UploadService(Blob b, Meta m, Queue q) { blob = b; meta = m; transcodeQ = q; }

    String startUpload(long userId, String fileName) {
        long videoId = ids.incrementAndGet();
        meta.insert(videoId, userId, fileName);
        meta.status(videoId, "UPLOADING");
        return blob.presignPut("original/" + videoId, Duration.ofMinutes(30));
    }

    void onUploaded(long videoId) {                 // storage event
        meta.status(videoId, "TRANSCODING");
        transcodeQ.publish(videoId);
    }

    void onTranscoded(long videoId) {               // completion handler
        meta.status(videoId, "READY");
    }

    static List<Task> buildDag() {
        Task split = new Task("split"), video = new Task("video"), audio = new Task("audio"),
             metadata = new Task("metadata"), encode = new Task("encode 360p..4K"),
             thumb = new Task("thumbnail"), mark = new Task("watermark"),
             audioEnc = new Task("audio encode"), assemble = new Task("assemble");
        split.then(video, audio, metadata);
        video.then(encode, thumb, mark);
        audio.then(audioEnc);
        encode.then(assemble);
        audioEnc.then(assemble);
        return List.of(split, video, audio, metadata, encode, thumb, mark, audioEnc, assemble);
    }
}`, 'LLD: upload + transcoding DAG in Java'),
    warn("Do not stream video from your API servers. Bandwidth for 5M DAU is enormous; **the CDN streams, the API only serves metadata.**"),
    warn("Do not transcode the whole file as one job. One failure means starting over. Split into GOP chunks, keep them in **temporary storage**, retry only the failed task."),
    tip("Errors: recoverable ones (a transcode task fails) get retried a few times; non-recoverable ones (malformed video) stop the pipeline and return an error code."),
    qa([
      ["Why transcode at all?", "Raw video is huge, devices and browsers support different formats, and adaptive bitrate needs several resolutions to switch between on slow networks."],
      ["How do you make uploads fast and resumable?", "Split the file by GOP on the client, upload chunks in parallel, and re-send only failed chunks. Upload centers close to the user help too."],
      ["How do you cut the $150k/day CDN bill?", "Serve only popular videos from the CDN, the long tail from your own servers; encode unpopular videos on demand; distribute by region."],
      ["What does the DAG scheduler buy you?", "Independent tasks (thumbnail, watermark, each resolution) run in parallel, and each creator can configure which tasks run."],
    ]),
    drill("5 minutes, no notes: draw the upload pipeline and the transcoding architecture, do the 150 TB/day and $150k/day math, then write the stage loop of `DagScheduler.run()`."),
  ],
});

export default S;
