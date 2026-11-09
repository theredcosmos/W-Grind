// SD Book Notes, chapters 1-7 (Vol 1). Shape: ../schema.js; helpers: ./h.js.
import { t, list, steps, table, java, text, key, warn, tip, drill, qa, flow, src } from './h.js';

const S = [];

// ---------------------------------------------------------------- ch 1

S.push({
  id: 'ch01-scaling',
  title: 'Ch 1 · Scale From Zero to Millions',
  summary: 'Grow one box into a stateless, cached, replicated, sharded, multi-DC system, one bottleneck at a time.',
  tags: ['scaling', 'load balancer', 'replication', 'cache', 'cdn', 'stateless', 'sharding', 'message queue', 'vol 1'],
  source: src('01. Scaling'),
  blocks: [
    t("Scaling is like **growing a food stall into a restaurant chain**. You start with one cook doing everything. Then you add more cooks, a host at the door, a fridge of ready dishes, and new branches in other cities. Each step fixes the bottleneck you hit **right now**, not every bottleneck you might hit one day."),
    flow([
      ['user:Web / mobile'],
      ['lb:DNS', 'lb:Load balancer', 'ext:CDN'],
      ['svc:Web servers (stateless)'],
      ['cache:Cache', 'db:Master DB', 'db:Read replicas', 'db:NoSQL (sessions)', 'q:Message queue'],
      ['svc:Workers'],
    ], 'Where you end up (millions of users)', ['HTTPS', 'route', 'read / write / enqueue', 'consume'], 'DNS gives the LB address, the CDN serves static files, logging + metrics + automation watch every box.'),
    key("**Stateless web tier**, **redundancy at every tier**, **cache + CDN** for reads, **shard** the data tier, **decouple** with queues, and run in **more than one data center**."),
    flow([
      ['svc:Web servers'],
      ['db:Master (writes)'],
      ['db:Replica 1', 'db:Replica 2', 'db:Replica 3'],
    ], 'Database replication', ['insert / update / delete', 'copy changes'], 'Reads go straight to replicas. Most apps read far more than they write, so you have many replicas and one master.'),
    flow([
      ['svc:Web server'],
      ['cache:Cache'],
      ['db:Database'],
    ], 'Cache-aside read', ['1. get key', '2. on miss: read DB, save to cache, return']),
    flow([
      ['user:User'],
      ['ext:CDN edge (nearby)'],
      ['store:Origin (web server or S3)'],
    ], 'CDN for static files', ['GET logo.png', 'miss: fetch, cache with TTL'], 'Next user near that edge gets the cached copy until the TTL runs out.'),
    flow([
      ['user:Users'],
      ['lb:GeoDNS'],
      ['lb:LB US-East', 'lb:LB US-West'],
      ['svc:DC1: web + cache + DB', 'svc:DC2: web + cache + DB'],
    ], 'Multi data center', ['', 'nearest DC', ''], 'If DC2 dies, GeoDNS sends 100% of traffic to DC1. Data is replicated across DCs.'),
    steps([
      "**One server**: web app + DB on one box. DNS returns its IP.",
      "**Split the DB** onto its own server so web and data scale separately.",
      "Pick **SQL** by default. Pick **NoSQL** for very low latency, unstructured data, or huge volume.",
      "**Scale out, not up**: put a load balancer in front of 2+ web servers (private IPs behind it).",
      "**Replicate the DB**: one master for writes, many replicas for reads.",
      "**Add a cache** (Redis / Memcached) for hot, read-heavy data, and a **CDN** for static files.",
      "**Make web servers stateless**: move sessions to a shared store, then autoscale.",
      "**Add data centers** with GeoDNS; replicate data between them.",
      "**Add a message queue** so slow jobs (e.g. photo resize) run on workers.",
      "**Add logging, metrics, automation (CI/CD)**, then **shard** the database.",
    ], 'HLD in 10 steps'),
    table(['Choice', 'Option A', 'Option B', 'Default answer'], [
      ['Scale web tier', 'Vertical: bigger box', 'Horizontal: more boxes + LB', 'Horizontal: no hard ceiling, no single point of failure'],
      ['Database type', 'SQL (MySQL, Postgres)', 'NoSQL (key-value, document, column, graph)', 'SQL unless latency, scale or shape says otherwise'],
      ['Session state', 'Stateful: user pinned to one server', 'Stateless: session in Redis / NoSQL', 'Stateless: any server can take any request'],
      ['Scale DB', 'Vertical: one huge machine', 'Sharding by key, e.g. `user_id % 4`', 'Shard when one machine is not enough'],
      ['Slow work', 'Do it inside the request', 'Queue + workers', 'Queue: the user does not wait, workers scale alone'],
    ], 'Compare the options'),
    list([
      "**When to cache**: read often, change rarely. Never the only copy of important data.",
      "**Expiry**: set a TTL. Too short = DB hammered. Too long = stale data.",
      "**Consistency**: DB write and cache write are not one transaction, so they can drift.",
      "**SPOF**: one cache box can take you down. Run several, across DCs, with spare memory.",
      "**Eviction**: when full, drop items. **LRU** is the usual pick (also LFU, FIFO).",
    ], 'Cache checklist'),
    flow([
      ['svc:Web servers'],
      ['lb:Shard router: user_id % 4'],
      ['db:Shard 0', 'db:Shard 1', 'db:Shard 2', 'db:Shard 3'],
    ], 'Sharding', ['', 'same schema, different rows'], 'Pick a key that spreads data **evenly**. Ch 5 (consistent hashing) fixes the resharding pain.'),
    java(`
// LLD core: a stateless service with a cache-aside read.
// Nothing user-specific lives in this object, so any server behind the LB can answer.
interface Cache { String get(String k); void set(String k, String v, int ttlSec); void delete(String k); }
interface UserDb { String findUser(long id); void updateUser(long id, String json); }
interface SessionStore { Long userIdFor(String token); }   // Redis / NoSQL, shared by all servers

class UserService {
    private static final int TTL_SEC = 300;
    private final Cache cache;
    private final UserDb db;
    private final SessionStore sessions;

    UserService(Cache cache, UserDb db, SessionStore sessions) {
        this.cache = cache; this.db = db; this.sessions = sessions;
    }

    String getProfile(String sessionToken) {
        Long userId = sessions.userIdFor(sessionToken);   // shared store, not local memory
        if (userId == null) throw new IllegalStateException("401: not logged in");
        String key = "user:" + userId;
        String hit = cache.get(key);                       // 1. try the cache
        if (hit != null) return hit;
        String row = db.findUser(userId);                  // 2. miss: read a replica
        if (row != null) cache.set(key, row, TTL_SEC);     // 3. fill, with a TTL
        return row;
    }

    void updateProfile(long userId, String json) {
        db.updateUser(userId, json);                       // writes go to the master
        cache.delete("user:" + userId);                    // invalidate; next read refills
    }
}`, 'LLD: stateless service + cache-aside'),
    warn("**Master failover is not free.** A promoted replica may be behind, so recent writes can be lost until recovery scripts run. Say this out loud when you draw replication."),
    warn("**Sharding has 3 classic pains**: resharding when a shard fills up, the **celebrity (hotspot) problem** where one key gets all the traffic, and **no cross-shard joins** (denormalize instead)."),
    tip("If the CDN goes down, clients should **fall back to the origin**. Version file names (`app.v2.css`) instead of waiting for invalidation."),
    qa([
      ["Why make the web tier stateless?", "So any server can serve any request. Then the LB can spread load freely and autoscaling can add or remove servers without logging users out."],
      ["The only read replica dies. What happens?", "Reads go to the master for a while, and a new replica is spun up. With several replicas, reads just move to the healthy ones."],
      ["How do you pick a sharding key?", "One that spreads rows and traffic evenly and is in most queries, e.g. `user_id`. Avoid keys where one value is huge (a celebrity) or that grow in time order."],
      ["What does the message queue buy you?", "Decoupling. The producer posts a job and returns. Workers scale on queue length, and a worker crash does not lose the job."],
    ]),
    drill("5 minutes, no notes: draw the final architecture from memory, every box. Then list the 5 cache considerations and the 3 sharding problems."),
  ],
});

// ---------------------------------------------------------------- ch 2

S.push({
  id: 'ch02-estimation',
  title: 'Ch 2 · Back-of-the-Envelope Estimation',
  summary: 'Rough math for QPS, storage and servers using powers of two, latency numbers and the nines.',
  tags: ['estimation', 'qps', 'storage', 'latency numbers', 'powers of two', 'availability', 'nines', 'capacity', 'vol 1'],
  source: src('02. Back Of the Envelope Estimation'),
  blocks: [
    t("Estimation is like **packing for a trip by counting days, not socks**. You do not need exact numbers. You need the right order of magnitude, fast, so you know if your design needs 1 server or 1,000."),
    flow([
      ['user:300M MAU'],
      ['svc:150M DAU'],
      ['svc:~3,500 QPS'],
      ['svc:~7,000 peak QPS'],
    ], 'The QPS chain (Twitter-style example)', ['x 50% daily', 'x 2 tweets / 86,400 s', 'x 2 for peak']),
    key("**1 day ~ 100k seconds** (86,400). **Memory is fast, disk is slow, network across continents is slowest.** Round hard, write assumptions down, and **always label units**."),
    table(['Power', 'Exact value', 'Approx', 'Unit'], [
      ['2^10', '1,024', '1 thousand', '1 KB'],
      ['2^20', '1,048,576', '1 million', '1 MB'],
      ['2^30', '1,073,741,824', '1 billion', '1 GB'],
      ['2^40', '1,099,511,627,776', '1 trillion', '1 TB'],
      ['2^50', '1,125,899,906,842,624', '1 quadrillion', '1 PB'],
    ], 'Powers of two (1 ASCII char = 1 byte)'),
    table(['Operation', 'Latency', 'Feel it'], [
      ['L1 cache reference', '0.5 ns', 'instant'],
      ['Branch mispredict', '5 ns', ''],
      ['L2 cache reference', '7 ns', '14x L1'],
      ['Mutex lock / unlock', '100 ns', ''],
      ['Main memory reference', '100 ns', '200x L1'],
      ['Compress 1 KB (Zippy)', '10 µs', ''],
      ['Send 2 KB over 1 Gbps', '20 µs', ''],
      ['SSD random read', '150 µs', ''],
      ['Read 1 MB sequentially from memory', '250 µs', ''],
      ['Round trip inside one data center', '500 µs', 'half a ms'],
      ['Disk seek', '10 ms', '20x a DC round trip'],
      ['Read 1 MB sequentially from network', '10 ms', ''],
      ['Read 1 MB sequentially from disk', '30 ms', ''],
      ['Packet CA to Netherlands to CA', '150 ms', 'you can feel this'],
    ], 'Latency numbers every programmer should know'),
    flow([
      ['cache:Memory 100 ns'],
      ['store:SSD read 150 µs'],
      ['lb:DC round trip 500 µs'],
      ['store:Disk seek 10 ms'],
      ['ext:Cross-continent 150 ms'],
    ], 'The latency ladder', ['~1,500x slower', '~3x', '~20x', '~15x'], 'Lessons: avoid disk seeks, compress before sending, put data centers near users.'),
    table(['Availability', 'Downtime per year', 'Per day'], [
      ['99% (two nines)', '3.65 days', '14.4 min'],
      ['99.9% (three nines)', '8.77 hours', '1.44 min'],
      ['99.99% (four nines)', '52.6 min', '8.6 s'],
      ['99.999% (five nines)', '5.26 min', '0.86 s'],
      ['99.9999% (six nines)', '31.5 s', '86 ms'],
    ], 'The nines (cloud SLAs are usually 99.9% or more)'),
    text(`
ASSUME   300M MAU, 50% use it daily, 2 tweets/user/day,
         10% of tweets have media, media = 1 MB, keep 5 years

QPS      DAU        = 300M x 50%            = 150M
         tweet QPS  = 150M x 2 / 86,400 s   ~ 3,500
         peak QPS   = 2 x 3,500             ~ 7,000

STORAGE  media/day  = 150M x 2 x 10% x 1 MB = 30 TB / day
         5 years    = 30 TB x 365 x 5       ~ 55 PB

ROUNDING 99,987 / 9.1  ->  100,000 / 10 = 10,000`, 'Worked example: Twitter QPS and storage'),
    steps([
      "Write the **assumptions** on the board first (users, actions per user, sizes, retention).",
      "Get **DAU** from MAU.",
      "**QPS** = DAU x actions per day / 100k seconds.",
      "**Peak QPS** = 2x to 10x average (say which and why).",
      "**Storage/day** = writes per day x size per write. Multiply by retention.",
      "**Cache** = hot share (often 20%) of daily read data.",
      "**Servers** = peak QPS / QPS one server handles (assume ~1k-10k).",
    ], 'Estimation in 7 steps'),
    java(`
// LLD core: the same math as code. Round numbers on purpose.
class Estimator {
    static final double SECONDS_PER_DAY = 86_400;

    static double qps(long dau, double actionsPerUserPerDay) {
        return dau * actionsPerUserPerDay / SECONDS_PER_DAY;
    }

    static double bytesPerDay(long dau, double itemsPerUser, double share, long bytesPerItem) {
        return dau * itemsPerUser * share * bytesPerItem;
    }

    static long servers(double peakQps, double qpsPerServer) {
        return (long) Math.ceil(peakQps / qpsPerServer);
    }

    static String human(double bytes) {
        String[] unit = {"B", "KB", "MB", "GB", "TB", "PB", "EB"};
        int i = 0;
        while (bytes >= 1000 && i < unit.length - 1) { bytes /= 1000; i++; }
        return String.format("%.1f %s", bytes, unit[i]);
    }

    public static void main(String[] args) {
        long dau = 300_000_000L / 2;                          // 150M
        double q = qps(dau, 2);                               // ~3,472
        double peak = q * 2;                                  // ~6,944
        double media = bytesPerDay(dau, 2, 0.10, 1_000_000L); // 30 TB
        System.out.printf("QPS %.0f, peak %.0f, servers %d%n", q, peak, servers(peak, 1_000));
        System.out.println("media/day " + human(media) + ", 5 years " + human(media * 365 * 5));
    }
}`, 'LLD: a tiny estimator'),
    warn("**Do not chase precision.** Spending 3 minutes on `86,400` vs `100,000` loses the interview. The interviewer grades the **process**, not the digits."),
    warn("**Unlabeled numbers are a trap.** Is `5` five KB or five MB? Write `5 MB` every time."),
    qa([
      ["How many seconds in a day, roughly?", "About 100k (86,400). Good enough for QPS."],
      ["What peak factor do you use?", "2x for a smooth global product, up to 10x for spiky events (sales, sports). State the assumption."],
      ["Why is memory preferred over disk?", "A memory read is ~100 ns. A disk seek is ~10 ms, about 100,000x slower. That gap is why caches exist."],
      ["What does four nines mean in practice?", "About 52 minutes of downtime per year, under 9 seconds per day."],
    ]),
    drill("5 minutes, no notes: write the powers of two table and the latency ladder. Then estimate QPS and 5-year storage for 100M DAU posting 1 photo of 500 KB per day."),
  ],
});

// ---------------------------------------------------------------- ch 3

S.push({
  id: 'ch03-framework',
  title: 'Ch 3 · Interview Framework',
  summary: 'The 4-step script for a 45-minute system design interview: scope, high level, deep dive, wrap-up.',
  tags: ['framework', 'interview', '4 steps', 'requirements', 'high level design', 'deep dive', 'time management', 'vol 1'],
  source: src('03. System Design Framework'),
  blocks: [
    t("The interview is like **planning a house with an architect**. First you ask what the family needs, then you sketch the rooms together, then you detail the kitchen, then you review the plan. Jumping straight to the plumbing is the classic fail."),
    flow([
      ['svc:1. Scope: 3-10 min'],
      ['svc:2. High-level design: 10-15 min'],
      ['svc:3. Deep dive: 10-25 min'],
      ['svc:4. Wrap-up: 3-5 min'],
    ], 'The 4 steps (45-minute interview)', ['requirements agreed', 'interviewer buys in', 'time left']),
    key("**Ask before you draw.** Treat the interviewer as a **teammate**: propose, check, adjust. Keep talking; silence reads as stuck."),
    steps([
      "**Scope**: ask features, users (DAU), scale growth, platforms (web, mobile), existing tech. Write assumptions down.",
      "**High level**: draw clients, APIs, web servers, data stores, cache, CDN, queue. Do quick estimates. Walk through 1-2 use cases.",
      "**Get buy-in**: ask 'does this look right before I go deeper?'",
      "**Deep dive**: pick the 2-3 parts that matter most (often the interviewer hints). Talk bottlenecks and trade-offs.",
      "**Wrap-up**: recap the design, name the bottlenecks, failure handling, monitoring, and how to go from 1M to 10M users.",
    ], 'HLD in 5 moves'),
    flow([
      ['user:User'],
      ['lb:Load balancer'],
      ['svc:Web servers'],
      ['svc:Post service', 'svc:Fanout service', 'svc:Notification service'],
      ['db:Post DB', 'cache:News feed cache'],
    ], 'Example blueprint: news feed publishing', ['POST /feed', '', 'auth, rate limit', 'save + push']),
    flow([
      ['user:User'],
      ['lb:Load balancer'],
      ['svc:Web servers'],
      ['svc:News feed service'],
      ['cache:News feed cache'],
    ], 'Example blueprint: news feed retrieval', ['GET /feed', '', '', 'post ids, newest first']),
    table(['Do', 'Do not'], [
      ['Ask clarifying questions first', 'Start designing in minute 1'],
      ['Think out loud', 'Go silent for minutes'],
      ['Offer 2 options and pick one', 'Claim there is one right answer'],
      ['Go deep on the critical parts', 'Over-engineer every box'],
      ['Ask for hints when stuck', 'Wait for the interviewer to rescue you'],
      ['Name trade-offs', 'Hide weaknesses in your design'],
    ], 'Dos and don\'ts'),
    list([
      "Design a URL shortener? Deep dive the **hash function** and redirects.",
      "Design a chat system? Deep dive **latency** and **online presence**.",
      "Design a news feed? Deep dive **fanout** on publish vs on read.",
    ], 'What to deep dive'),
    text(`
[ ] 1. SCOPE (3-10 min)
      - What are the top 3 features?
      - How many users now? In 1 year?
      - Web, mobile, or both?
      - Any existing stack or constraints?
      - Write assumptions on the board.
[ ] 2. HIGH LEVEL (10-15 min)
      - API list: method + path + params.
      - Box diagram: client -> LB -> web -> cache / DB / queue.
      - Back-of-envelope: QPS, storage.
      - Walk one request end to end.
      - "Does this look right?"
[ ] 3. DEEP DIVE (10-25 min)
      - 2-3 critical components only.
      - Bottlenecks, failure modes, trade-offs.
[ ] 4. WRAP-UP (3-5 min)
      - Recap. Bottlenecks. Errors. Monitoring.
      - Next 10x of scale.`, 'Interview checklist (run it in your head)'),
    warn("**Premature design** is the number one red flag. Two minutes of questions saves twenty minutes of building the wrong thing."),
    tip("Never say 'the design is perfect' in the wrap-up. Say what you would improve with more time. It shows judgment."),
    qa([
      ["The interviewer says 'you choose' for scale. What now?", "Pick concrete numbers out loud (e.g. 10M DAU, 1 KB per post), write them down, and design to them."],
      ["How do you know what to deep dive?", "Ask, or follow hints. Otherwise pick the component that is hardest or most unique to this product."],
      ["You run out of time mid deep dive. What do you do?", "Stop, summarize what you have, and name the open problems in one line each."],
    ]),
    drill("5 minutes, no notes: recite the 4 steps with their time slots. Then write 5 scope questions for 'design Instagram'."),
  ],
});

// ---------------------------------------------------------------- ch 4

S.push({
  id: 'ch04-rate-limiter',
  title: 'Ch 4 · Rate Limiter',
  summary: 'Cap how many requests a client may send per time window. Token bucket in Redis, at the gateway.',
  tags: ['rate limiter', 'token bucket', 'leaky bucket', 'sliding window', 'redis', '429', 'throttling', 'vol 1'],
  source: src('04. Rate Limiter'),
  blocks: [
    t("A rate limiter is a **bouncer with a counter**. Each client gets N requests per time window. Request N+1 gets `HTTP 429 Too Many Requests` instead of reaching your servers. It stops abuse (DoS, brute force), cuts cost, and keeps one noisy client from starving everyone else."),
    flow([
      ['user:Client'],
      ['lb:API gateway + rate limiter'],
      ['svc:API servers'],
    ], 'Where it lives', ['request', 'allowed'], 'Rejected requests stop at the gateway with `429` and a `Retry-After` header. Counters live in Redis, rules in a config file loaded into cache.'),
    key("Server side, not client side (clients can lie). Token bucket is the default answer: two knobs (bucket size, refill rate) and it allows short bursts. Store counters in Redis with atomic ops."),
    flow([
      ['user:Client'],
      ['lb:Rate limiter middleware'],
      ['cache:Redis counters', 'store:Rules (YAML)'],
      ['svc:API servers', 'q:Drop or queue'],
    ], 'Detailed design', ['', 'read count + rule', 'under limit / over limit']),
    steps([
      "Clarify: per user, per IP, or per API key? How many rules? Hard limit or soft (queue the excess)?",
      "Place it: an API gateway middleware if you have microservices, else in the app.",
      "Pick the algorithm (table below). Default: token bucket.",
      "Store counters in Redis: `INCR` + `EXPIRE`, or a Lua script so read-check-write is atomic.",
      "Rules live in config files on disk, pulled into a cache by workers.",
      "Over the limit: return `429` with headers `X-Ratelimit-Remaining`, `X-Ratelimit-Limit`, `X-Ratelimit-Retry-After`. Optionally push the request to a queue for later.",
      "Distributed: one shared Redis (or Redis Cluster) so every gateway node sees the same counts.",
    ], 'HLD in 7 steps'),
    table(['Algorithm', 'Picture it as', 'Good', 'Bad'], [
      ['Token bucket', 'A jar refilled with K tokens/sec; each request takes one', 'Bursts allowed, tiny memory', 'Two knobs to tune'],
      ['Leaking bucket', 'A FIFO queue drained at a fixed rate', 'Smooth, steady output', 'Bursts fill the queue and old requests block new ones'],
      ['Fixed window counter', 'A counter reset every minute', 'Simplest', 'Burst at the window edge can let 2x through'],
      ['Sliding window log', 'Keep every request timestamp, drop old ones', 'Exact', 'Memory heavy (stores rejected timestamps too)'],
      ['Sliding window counter', 'Current window + weighted share of previous', 'Smooth, cheap', 'An approximation (assumes even traffic)'],
    ], 'The 5 algorithms'),
    java(`
// LLD core: one token bucket per client key. Thread safe, lazy refill (no timer thread).
class TokenBucket {
    private final long capacity;          // max burst
    private final double refillPerNano;   // tokens added per nanosecond
    private double tokens;
    private long lastRefill;

    TokenBucket(long capacity, double tokensPerSecond) {
        this.capacity = capacity;
        this.refillPerNano = tokensPerSecond / 1_000_000_000.0;
        this.tokens = capacity;
        this.lastRefill = System.nanoTime();
    }

    synchronized boolean tryAcquire() {
        long now = System.nanoTime();
        tokens = Math.min(capacity, tokens + (now - lastRefill) * refillPerNano);
        lastRefill = now;
        if (tokens < 1) return false;     // caller returns 429
        tokens -= 1;
        return true;
    }
}

class RateLimiter {
    private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();
    private final long capacity; private final double rate;
    RateLimiter(long capacity, double rate) { this.capacity = capacity; this.rate = rate; }

    boolean allow(String clientKey) {
        return buckets.computeIfAbsent(clientKey, k -> new TokenBucket(capacity, rate)).tryAcquire();
    }
}`, 'LLD: token bucket in Java'),
    tip("For the sliding window counter, say the formula out loud: `requests in current window + requests in previous window × overlap % of the previous window`. Interviewers love it."),
    warn("Read count, then write count, as two separate Redis calls is a **race condition**: two gateways both read 3, both write 4. Fix with a Lua script or Redis sorted sets in a `MULTI` block."),
    warn("Multiple data centers: sync counters across them eventually; route users to the nearest edge so most of their traffic hits one counter."),
    qa([
      ["Which algorithm would you pick and why?", "Token bucket: it allows short bursts (real users click fast), uses two numbers per key, and Amazon and Stripe use it. Leaking bucket if downstream needs a steady rate."],
      ["How do you rate limit across 20 gateway servers?", "A central Redis holding the counters, with atomic Lua scripts. Sticky sessions are the alternative but scale badly."],
      ["What does the client see?", "`429` plus `X-Ratelimit-Remaining`, `X-Ratelimit-Limit` and `X-Ratelimit-Retry-After` so it can back off."],
      ["What if Redis is down?", "Fail open (let traffic through, protect availability) or fail closed (block, protect the backend). Say which and why for this product."],
    ]),
    drill("5 minutes, no notes: draw the detailed design, then write `tryAcquire()` from memory. Then explain why a fixed window lets 2x traffic through at 00:59 to 01:01."),
  ],
});

// ---------------------------------------------------------------- ch 5

S.push({
  id: 'ch05-consistent-hashing',
  title: 'Ch 5 · Consistent Hashing',
  summary: 'Put servers and keys on one hash ring so adding or removing a server moves only about k/n keys.',
  tags: ['consistent hashing', 'hash ring', 'virtual nodes', 'rehashing', 'sharding', 'treemap', 'dynamo', 'cassandra', 'vol 1'],
  source: src('05. Consistent Hashing'),
  blocks: [
    t("Consistent hashing is like **seats around a round table**. Each guest (key) sits down and walks clockwise to the first waiter (server). Add or remove one waiter and only the guests in **that one stretch** change waiter; everyone else stays put."),
    flow([
      ['user:Key'],
      ['svc:hash(key) on the ring'],
      ['lb:Walk clockwise'],
      ['db:First server found'],
    ], 'Lookup on the ring', ['same hash fn as servers', '', 'owns the key']),
    key("Plain `hash(key) % N` moves **almost every key** when N changes. On a ring, only about **k / n keys** move (k keys, n servers). **Virtual nodes** fix uneven load."),
    text(`
hash % N with 4 servers, then server 1 dies (N becomes 3):

key    hash      % 4   % 3
key0   18358617   1     0    <- moved
key1   26143584   0     0
key2   18131146   2     1    <- moved
key3   35863496   0     2    <- moved
key4   34085809   1     1
key5   27581703   3     0    <- moved
key6   38164978   2     1    <- moved
key7   22530351   3     0    <- moved

Most keys move even though only 1 server left -> cache miss storm.`, 'The rehashing problem'),
    text(`
                 s0
            .  '    '  .
        k3 .            . k0      k0 -> walk clockwise -> s1
          .              .        k1 -> s2
     s3  .                .  s1   k2 -> s3
          .              .        k3 -> s0
        k2 .            . k1
            '  .    .  '
                 s2
Hash space 0 .. 2^160 - 1 (SHA-1), ends joined into a ring.`, 'The hash ring'),
    flow([
      ['svc:Keys between s3 and s4'],
      ['db:New server s4'],
    ], 'Add a server', ['only these move'], 'Walk **anticlockwise** from s4 to the previous server s3. That arc is all that moves.'),
    flow([
      ['svc:Keys between s0 and s1'],
      ['db:s2 (next clockwise)'],
    ], 'Remove a server (s1 dies)', ['reassigned'], 'Every other key keeps its server.'),
    flow([
      ['svc:Server A', 'svc:Server B'],
      ['svc:A#0, A#1, A#2 ...', 'svc:B#0, B#1, B#2 ...'],
      ['lb:Ring, sorted by hash'],
    ], 'Virtual nodes', ['hash(name#i)', 'interleaved'], '100-200 vnodes per server gives a standard deviation of roughly 10% to 5% of the mean. Bigger box = more vnodes.'),
    steps([
      "Pick a hash function (SHA-1 / MD5 / Murmur) for both servers and keys.",
      "Place each server on the ring at `hash(server)`; with vnodes, at `hash(server#i)` for i = 0..V-1.",
      "To find a key's server: hash the key, walk clockwise, take the first node.",
      "On add: move only the keys between the new node and its anticlockwise neighbor.",
      "On remove: hand that node's arc to the next node clockwise.",
      "For replication (Ch 6): take the next N **distinct physical** servers clockwise.",
    ], 'HLD in 6 steps'),
    table(['Approach', 'Keys moved when 1 server changes', 'Balance', 'Notes'], [
      ['`hash % N`', 'Almost all', 'Even, if N fixed', 'Fine only for a fixed pool'],
      ['Ring, 1 point per server', '~k / n', 'Uneven arcs, hotspots', 'Partitions differ in size'],
      ['Ring + virtual nodes', '~k / n, spread over many servers', 'Close to even', 'More metadata; the standard answer'],
    ], 'Compare'),
    java(`
// LLD core: hash ring on a TreeMap. ceilingEntry = "walk clockwise".
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;

class ConsistentHashRing {
    private final TreeMap<Long, String> ring = new TreeMap<>();
    private final int vnodes;

    ConsistentHashRing(int vnodes) { this.vnodes = vnodes; }

    void addServer(String server) {
        for (int i = 0; i < vnodes; i++) ring.put(hash(server + "#" + i), server);
    }

    void removeServer(String server) {
        for (int i = 0; i < vnodes; i++) ring.remove(hash(server + "#" + i));
    }

    String serverFor(String key) {
        if (ring.isEmpty()) throw new IllegalStateException("no servers");
        Map.Entry<Long, String> e = ring.ceilingEntry(hash(key));   // first node clockwise
        return (e != null ? e : ring.firstEntry()).getValue();       // wrap past the top
    }

    // Next n distinct physical servers clockwise (replica list for Ch 6).
    List<String> replicasFor(String key, int n) {
        List<String> out = new ArrayList<>();
        long h = hash(key);
        for (Collection<String> arc : List.of(ring.tailMap(h, true).values(), ring.headMap(h, false).values()))
            for (String s : arc)
                if (out.size() < n && !out.contains(s)) out.add(s);
        return out;
    }

    private static long hash(String s) {
        try {
            byte[] d = MessageDigest.getInstance("MD5").digest(s.getBytes(StandardCharsets.UTF_8));
            long h = 0;
            for (int i = 0; i < 8; i++) h = (h << 8) | (d[i] & 0xFF);   // first 64 bits
            return h;
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}`, 'LLD: ring with TreeMap + virtual nodes'),
    warn("**Forgetting the wrap-around.** If no node sits clockwise of the key, the owner is the **first** node on the ring. `ceilingEntry` returns null there."),
    warn("**Replicas on the same box.** With vnodes, the next 3 ring entries can all be the same physical server. Skip duplicates when picking replicas."),
    tip("Name drops that land well: Amazon Dynamo, Apache Cassandra, Discord, Akamai CDN, Google Maglev load balancer."),
    qa([
      ["Why not just use `hash % N`?", "When N changes, nearly every key remaps. For a cache that is a miss storm; for a DB it is a full reshuffle."],
      ["How many keys move when you add a server?", "On average k / n: only the arc between the new node and its anticlockwise neighbor."],
      ["Why virtual nodes?", "A few points on a ring give uneven arcs and hotspots. Many points per server even out the load, and a stronger box can get more vnodes."],
      ["What is the lookup cost?", "O(log V) with a sorted map or binary search over V total vnodes."],
    ]),
    drill("5 minutes, no notes: draw a ring with 4 servers and 4 keys, then add s4 and shade the keys that move. Then write `serverFor()` with `ceilingEntry` and the wrap-around."),
  ],
});

// ---------------------------------------------------------------- ch 6

S.push({
  id: 'ch06-key-value-store',
  title: 'Ch 6 · Key-Value Store',
  summary: 'A Dynamo-style store: ring partitioning, N replicas, tunable quorum, vector clocks, gossip, Merkle sync.',
  tags: ['key-value store', 'cap theorem', 'quorum', 'vector clock', 'gossip', 'hinted handoff', 'merkle tree', 'sstable', 'bloom filter', 'vol 1'],
  source: src('06. Key-Value Store'),
  blocks: [
    t("A distributed key-value store is like **a library with copies of every book in 3 branches**. Any branch can take your request. If one branch is closed, another answers. The hard part is keeping the copies in sync when people edit them in different branches."),
    flow([
      ['user:Client'],
      ['lb:Coordinator (any node)'],
      ['db:Replica n1', 'db:Replica n2', 'db:Replica n3'],
    ], 'Final architecture', ['get(key) / put(key, value)', 'fan out to N = 3 on the ring'], 'Every node has the same job. No master, no single point of failure. Nodes join and leave automatically.'),
    key("**CAP: pick C or A during a partition.** Tune it with **W + R > N** (strong) or W + R <= N (fast, eventual). Conflicts are found with **vector clocks**, failures with **gossip**, repaired with **hinted handoff** (short) and **Merkle trees** (long)."),
    list([
      "API: `put(key, value)` and `get(key)`.",
      "Small pairs: under **10 KB** each.",
      "Big data, **high availability**, automatic scaling.",
      "**Tunable consistency**, low latency.",
      "One server = an in-memory hash table. Memory runs out fast, so we distribute.",
    ], 'Requirements'),
    table(['Type', 'Keeps', 'Gives up', 'Use for'], [
      ['CP', 'Consistency + partition tolerance', 'Availability: block writes during a partition', 'Banks, balances'],
      ['AP', 'Availability + partition tolerance', 'Consistency: may return stale data, syncs later', 'Carts, feeds, most KV stores'],
      ['CA', 'Consistency + availability', 'Partition tolerance', 'Does not exist: networks always fail'],
    ], 'CAP theorem'),
    flow([
      ['db:n1', 'db:n2'],
      ['lb:Network partition'],
      ['db:n3 (cut off)'],
    ], 'CAP in one picture', ['writes land here', 'cannot sync'], 'CP: stop writes to n1/n2 until healed. AP: keep serving, n3 catches up after the partition heals.'),
    flow([
      ['user:Client'],
      ['lb:Coordinator'],
      ['db:s1 ack', 'db:s2 ack', 'db:s3 (slow)'],
    ], 'Quorum write: N = 3, W = 2', ['put(k, v)', 'success after 2 acks'], 'The coordinator still sends to all 3; it just stops waiting after W acks.'),
    table(['Setting', 'Effect'], [
      ['R = 1, W = N', 'Fast reads, slow writes'],
      ['W = 1, R = N', 'Fast writes, slow reads'],
      ['W + R > N (e.g. N=3, W=R=2)', '**Strong consistency**: read and write sets overlap in at least 1 node'],
      ['W + R <= N', 'Faster, but reads may be stale (eventual consistency)'],
    ], 'Tuning N, W, R'),
    table(['Model', 'A read returns'], [
      ['Strong', 'Always the latest write'],
      ['Weak', 'Maybe not the latest write'],
      ['Eventual', 'The latest write, once updates finish spreading (Dynamo, Cassandra)'],
    ], 'Consistency models'),
    text(`
Vector clock = list of [server, counter] pairs on each value.

D1 ([Sx,1])                 written at Sx
D2 ([Sx,2])                 updated at Sx        D1 is ancestor of D2
   |                \\
D3 ([Sx,2],[Sy,1])   D4 ([Sx,2],[Sz,1])         written at Sy and Sz in parallel
   |                /
   CONFLICT: Sy > 0 in D3 but 0 in D4, Sz the opposite
   |
D5 ([Sx,3],[Sy,1],[Sz,1])   client merges, Sx writes the result

Rule: X is an ancestor of Y if every counter in X <= Y.
      Otherwise (some bigger, some smaller) they are siblings = conflict.`, 'Vector clock example'),
    flow([
      ['svc:s0 heartbeat table'],
      ['svc:Random peers'],
      ['svc:Whole cluster'],
    ], 'Gossip failure detection', ['every second: +1 own counter, send table', 'merge and forward'], 'If a member\'s counter has not grown for a set time, mark it down. Need **2+ independent sources**, not one node\'s opinion.'),
    flow([
      ['lb:Coordinator'],
      ['db:s1 ok', 'db:s2 down', 'db:s3 stand-in (keeps hint)'],
      ['db:s2 back online'],
    ], 'Sloppy quorum + hinted handoff', ['first W healthy nodes on the ring', 'hand the writes back'], 'Temporary failure: keep going with healthy nodes, then replay the hinted writes to s2.'),
    text(`
Replica A                          Replica B
          root: 7F2A                         root: 7F2B      <- differ
         /          \\                        /          \\
     H12: 3C1      H34: 9D0             H12: 3C1      H34: 9D7  <- go right only
     /    \\        /    \\                /    \\        /    \\
  B1:a1  B2:b2  B3:c3  B4:d4          B1:a1  B2:b2  B3:c3  B4:e9
                                                           ^ only bucket 4 is synced

Build: split key space into buckets -> hash each key ->
       hash per bucket -> hash pairs upward -> root.`, 'Merkle tree anti-entropy (permanent failures)'),
    flow([
      ['user:Client'],
      ['svc:Node'],
      ['store:1. Commit log (append)', 'cache:2. Memtable (in memory)'],
      ['store:3. SSTable on disk'],
    ], 'Write path (Cassandra style)', ['put', 'log first, then memory', 'flush when memtable is full']),
    flow([
      ['user:Client'],
      ['svc:Node'],
      ['cache:Memtable'],
      ['lb:Bloom filters'],
      ['store:SSTables'],
    ], 'Read path', ['get', 'hit? return', 'miss: which SSTables might hold it?', 'read only those']),
    steps([
      "**Partition** with consistent hashing + virtual nodes (vnodes per server follow its capacity).",
      "**Replicate** to the next **N distinct servers** clockwise, ideally in different data centers.",
      "**Tune consistency** with N, W, R. Default: N = 3, W = R = 2.",
      "**Version** every value with a vector clock; return siblings to the client to merge.",
      "**Detect failures** with gossip heartbeats.",
      "**Temporary failure**: sloppy quorum + hinted handoff.",
      "**Permanent failure**: Merkle tree anti-entropy to sync only differing buckets.",
      "**DC outage**: replicate across data centers.",
      "**Storage engine**: commit log, memtable, SSTables, bloom filters.",
    ], 'HLD in 9 steps'),
    table(['Goal / problem', 'Technique'], [
      ['Store big data', 'Consistent hashing spreads load'],
      ['High availability reads', 'Replication, multi data center'],
      ['Highly available writes', 'Versioning + conflict resolution with vector clocks'],
      ['Partition the data', 'Consistent hashing'],
      ['Incremental scalability', 'Consistent hashing'],
      ['Mixed server sizes', 'Consistent hashing with virtual nodes'],
      ['Tunable consistency', 'Quorum consensus (N, W, R)'],
      ['Temporary failures', 'Sloppy quorum + hinted handoff'],
      ['Permanent failures', 'Merkle tree'],
      ['Data center outage', 'Cross-data-center replication'],
    ], 'Cheat sheet: problem to technique'),
    java(`
// LLD core: vector clock compare + quorum put/get on a coordinator.
import java.util.*;

enum Order { BEFORE, AFTER, EQUAL, CONFLICT }

final class VectorClock {
    final Map<String, Integer> v = new HashMap<>();

    VectorClock bump(String node) {               // new version written at node
        VectorClock c = new VectorClock();
        c.v.putAll(v);
        c.v.merge(node, 1, Integer::sum);
        return c;
    }

    Order compare(VectorClock o) {
        boolean less = false, more = false;
        Set<String> nodes = new HashSet<>(v.keySet());
        nodes.addAll(o.v.keySet());
        for (String n : nodes) {
            int a = v.getOrDefault(n, 0), b = o.v.getOrDefault(n, 0);
            if (a < b) less = true;
            else if (a > b) more = true;
        }
        if (less && more) return Order.CONFLICT;  // siblings: client must merge
        if (less) return Order.BEFORE;            // this is an ancestor of o
        if (more) return Order.AFTER;
        return Order.EQUAL;
    }
}

record Versioned(String value, VectorClock clock) {}

interface Replica {                               // throws RuntimeException when down
    void put(String key, Versioned val);
    Versioned get(String key);
}

class Coordinator {
    private final int n, w, r;                    // e.g. 3, 2, 2 so w + r > n
    private final ConsistentHashRing ring;        // from Ch 5
    private final Map<String, Replica> nodes;

    Coordinator(int n, int w, int r, ConsistentHashRing ring, Map<String, Replica> nodes) {
        this.n = n; this.w = w; this.r = r; this.ring = ring; this.nodes = nodes;
    }

    boolean put(String key, Versioned val) {
        int acks = 0;
        for (String id : ring.replicasFor(key, n)) {   // real code: parallel + timeouts
            try { nodes.get(id).put(key, val); acks++; } catch (RuntimeException down) { }
        }
        return acks >= w;
    }

    List<Versioned> get(String key) {
        List<Versioned> seen = new ArrayList<>();
        int replies = 0;
        for (String id : ring.replicasFor(key, n)) {
            try {
                Versioned x = nodes.get(id).get(key);
                replies++;
                if (x != null) seen.add(x);
            } catch (RuntimeException down) { }
            if (replies >= r) break;
        }
        if (replies < r) throw new IllegalStateException("read quorum not met");
        List<Versioned> latest = new ArrayList<>();     // drop versions someone else dominates
        for (Versioned a : seen) {
            boolean old = seen.stream().anyMatch(b -> a.clock().compare(b.clock()) == Order.BEFORE);
            boolean dup = latest.stream().anyMatch(b -> a.clock().compare(b.clock()) == Order.EQUAL);
            if (!old && !dup) latest.add(a);
        }
        return latest;                                  // 1 value, or siblings to reconcile
    }
}`, 'LLD: vector clocks + quorum coordinator'),
    warn("**W + R > N is not magic.** With a sloppy quorum, the W stand-in nodes may not overlap the R nodes you read, so you can still read stale data. Say this when the interviewer pushes on strong consistency."),
    warn("**Vector clocks grow.** Many writers means a long list. Cap it (e.g. 10 entries, drop the oldest). It is rarely a problem in practice, but trimming can hide a true conflict."),
    tip("Writes are append-only (commit log + memtable), so they are fast. Reads may touch several SSTables, which is why the **bloom filter** matters: it says 'definitely not here' cheaply."),
    qa([
      ["Is this store CP or AP?", "AP by default, like Dynamo and Cassandra: always accept writes, reconcile later. Raise W and R to lean toward consistency."],
      ["Two clients write the same key on different nodes at once. What happens?", "Both versions get vector clocks that conflict. A read returns both siblings; the client merges and writes back a new version."],
      ["How do you tell a node is really down?", "Gossip: each node bumps a heartbeat counter and spreads its table to random peers. A counter that stops growing, as seen by several nodes, marks it down."],
      ["A node was dead for a day. How does it catch up?", "Merkle trees: compare root hashes with a replica, walk down only differing branches, and copy just those buckets."],
    ]),
    drill("5 minutes, no notes: draw the coordinator + ring + 3 replicas. Write the 10-row problem-to-technique table. Then compare ([Sx,2],[Sy,1]) with ([Sx,2],[Sz,1]) and say why it is a conflict."),
  ],
});

// ---------------------------------------------------------------- ch 7

S.push({
  id: 'ch07-unique-id-generator',
  title: 'Ch 7 · Unique ID Generator',
  summary: 'Make 64-bit, time-sortable, unique IDs at 10k+/s with no coordination: Twitter Snowflake.',
  tags: ['unique id', 'snowflake', 'uuid', 'ticket server', 'auto increment', 'bit shift', 'distributed id', 'vol 1'],
  source: src('07. Unique-Id Generator'),
  blocks: [
    t("A Snowflake ID is like **a ticket stamped with time, branch, counter and ticket number**. Each counter prints its own tickets without phoning head office, and no two tickets can ever match because the stamp includes **who** printed it and **when**."),
    flow([
      ['user:Client'],
      ['lb:Load balancer'],
      ['svc:ID gen: dc 1, machine 1', 'svc:ID gen: dc 1, machine 2', 'svc:ID gen: dc 2, machine 1'],
      ['svc:64-bit ID'],
    ], 'Snowflake: every server mints its own IDs', ['', 'no shared state', 'time | dc | machine | seq']),
    key("**41 bits time + 5 dc + 5 machine + 12 sequence** (+1 sign bit) = 64. That gives **4,096 IDs per ms per machine** and about **69 years** of timestamps from a custom epoch."),
    text(`
 0 | 41 bits timestamp (ms since epoch) | 5 bits dc | 5 bits machine | 12 bits sequence
 1 |                41                  |     5     |       5        |       12

shift left by:   timestamp << 22   dc << 17   machine << 12   sequence << 0

id = (now - EPOCH) << 22 | dc << 17 | machine << 12 | seq

2^41 ms ~ 69 years    2^5 = 32 dcs    2^5 = 32 machines    2^12 = 4,096 per ms`, 'The 64-bit layout'),
    list([
      "IDs are **unique**.",
      "Numbers only, fit in **64 bits**.",
      "**Sortable by time** (grow with time, not always by +1).",
      "**10,000+ IDs per second**.",
    ], 'Requirements'),
    flow([
      ['svc:Web servers'],
      ['db:MySQL 1: 1, 3, 5 ...', 'db:MySQL 2: 2, 4, 6 ...'],
    ], 'Option 1: multi-master auto_increment', ['step by k = number of DBs'], 'Breaks across data centers, not time-ordered across servers, painful to add a server.'),
    flow([
      ['svc:Web 1', 'svc:Web 2', 'svc:Web 3'],
      ['db:Ticket server (one counter)'],
    ], 'Option 3: ticket server (Flickr)', ['next id?'], 'Simple and numeric, but one box is a **single point of failure**.'),
    table(['Approach', 'How', 'Good', 'Bad'], [
      ['Multi-master', 'DB auto_increment with step k', 'Uses existing DBs', 'Not time-sorted, hard across DCs and when servers change'],
      ['UUID', '128-bit random ID on each server', 'No coordination, scales freely', '128 bits (too big), not sortable, can be non-numeric'],
      ['Ticket server', 'One central auto_increment DB', 'Numeric, simple', 'Single point of failure; multiple ticket servers need sync'],
      ['Snowflake', 'Bit sections: time, dc, machine, seq', '64-bit, sorted by time, no SPOF, fast', 'Needs synced clocks and unique machine ids'],
    ], 'The 4 options'),
    steps([
      "Clarify: unique, numeric, 64 bits, time-sorted, 10k/s.",
      "Reject multi-master, UUID and ticket server, with one reason each.",
      "Pick Snowflake. Draw the bit layout.",
      "Assign dc id and machine id at startup (config or ZooKeeper); they never change at runtime.",
      "Each call: read the clock, bump the sequence in the same ms, reset to 0 on a new ms.",
      "Sequence full (4,096)? Wait for the next millisecond.",
      "Wrap-up: clock sync with **NTP**, tuning bit lengths, high availability.",
    ], 'HLD in 7 steps'),
    java(`
// LLD core: Snowflake. One instance per machine; thread safe.
class Snowflake {
    private static final long EPOCH = 1288834974657L;          // Twitter epoch: Nov 04 2010
    private static final int MACHINE_BITS = 5, DC_BITS = 5, SEQ_BITS = 12;
    private static final long MAX_SEQ = (1L << SEQ_BITS) - 1;  // 4095
    private static final long MAX_ID = (1L << DC_BITS) - 1;    // 31 (same for dc and machine)
    private static final int MACHINE_SHIFT = SEQ_BITS;                        // 12
    private static final int DC_SHIFT = SEQ_BITS + MACHINE_BITS;              // 17
    private static final int TIME_SHIFT = SEQ_BITS + MACHINE_BITS + DC_BITS;  // 22

    private final long dcId, machineId;
    private long lastMs = -1L;
    private long seq = 0L;

    Snowflake(long dcId, long machineId) {
        if (dcId < 0 || dcId > MAX_ID || machineId < 0 || machineId > MAX_ID)
            throw new IllegalArgumentException("dc and machine ids must be 0..31");
        this.dcId = dcId;
        this.machineId = machineId;
    }

    synchronized long nextId() {
        long now = System.currentTimeMillis();
        if (now < lastMs)
            throw new IllegalStateException("clock moved back " + (lastMs - now) + " ms");
        if (now == lastMs) {
            seq = (seq + 1) & MAX_SEQ;
            if (seq == 0) {                                     // 4,096 used this ms
                while ((now = System.currentTimeMillis()) <= lastMs) { }   // spin to next ms
            }
        } else {
            seq = 0;                                            // new ms: restart counter
        }
        lastMs = now;
        return ((now - EPOCH) << TIME_SHIFT) | (dcId << DC_SHIFT) | (machineId << MACHINE_SHIFT) | seq;
    }

    static long timestampOf(long id) { return (id >>> TIME_SHIFT) + EPOCH; }
    static long sequenceOf(long id)  { return id & MAX_SEQ; }
}`, 'LLD: Snowflake ID generator in Java'),
    warn("**Clock going backwards** (NTP adjust, VM pause) can create duplicate IDs. Detect `now < lastMs` and refuse or wait; never just carry on."),
    warn("**Duplicate machine ids** break uniqueness silently. Assign them from config or a coordinator (ZooKeeper / etcd) at startup, not at random."),
    tip("Tune the bits to the product: low traffic for a long time? Fewer sequence bits, more timestamp bits."),
    qa([
      ["Why not UUID?", "It is 128 bits, not sortable by time and may contain letters. The requirement says 64-bit numeric and time-ordered."],
      ["How many IDs per second can one machine make?", "4,096 per millisecond, so about 4 million per second. Far above 10k."],
      ["When do the timestamp bits run out?", "2^41 ms is about 69 years after the custom epoch. Pick a recent epoch to push that out."],
      ["Are IDs strictly ordered across machines?", "Roughly, by millisecond. Within the same ms, two machines can interleave, and clock skew between machines can reorder slightly."],
    ]),
    drill("5 minutes, no notes: draw the 64-bit layout with all shift amounts. Then write `nextId()` including the same-millisecond and clock-backwards cases."),
  ],
});

export default S;
