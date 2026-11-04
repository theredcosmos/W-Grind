// Codex tab: High-Level System Design (HLD) for interviews.
// Shape is defined in ./schema.js. Small helpers below only build plain block objects.

const t = (text) => ({ type: 'text', text });
const list = (items, title) => ({ type: 'list', ...(title && { title }), items });
const steps = (items, title) => ({ type: 'steps', ...(title && { title }), items });
const table = (head, rows, title) => ({ type: 'table', ...(title && { title }), head, rows });
const java = (code, title) => ({ type: 'code', lang: 'java', ...(title && { title }), code: code.replace(/^\n/, '') });
const diagram = (code, title) => ({ type: 'code', lang: 'text', ...(title && { title }), code: code.replace(/^\n/, '') });
const key = (text, title) => ({ type: 'callout', tone: 'key', ...(title && { title }), text });
const warn = (text, title) => ({ type: 'callout', tone: 'warn', ...(title && { title }), text });
const tip = (text, title) => ({ type: 'callout', tone: 'tip', ...(title && { title }), text });
const drill = (text, title = 'Drill') => ({ type: 'callout', tone: 'drill', title, text });
const qa = (pairs, title = 'Interviewer follow-ups') => ({ type: 'qa', title, items: pairs.map(([q, a]) => ({ q, a })) });

const S = [];

// ---------------------------------------------------------------- the round

S.push({
  id: 'hld-round',
  title: 'How an HLD round works',
  summary: 'A 45-minute framework with a time budget, from requirements to trade-offs.',
  tags: ['framework', 'interview', 'process', 'time budget'],
  blocks: [
    t("An HLD round is an open-ended conversation about building a large system. There is no single right answer. You are graded on structure, trade-off reasoning, and depth where it matters."),
    table(['Step', 'Minutes', 'Output'], [
      ['1. Functional requirements', '3-5', '3-5 core features, explicit out-of-scope list'],
      ['2. Non-functional requirements', '2-3', 'Scale, latency, availability vs consistency, durability'],
      ['3. Estimates', '3-5', 'QPS (read/write), storage per year, bandwidth'],
      ['4. API', '3-5', '3-6 endpoints with params and responses'],
      ['5. Data model', '3-5', 'Main entities, keys, DB choice'],
      ['6. High-level design', '8-10', 'Boxes and arrows covering every functional requirement'],
      ['7. Deep dives', '10-15', '2-3 hard parts: scaling, hot keys, consistency'],
      ['8. Bottlenecks and trade-offs', '3-5', 'Single points of failure, what breaks at 10x'],
    ], 'Time budget for a 45-minute round'),
    steps([
      "Clarify: who are the users, what are the top 3 actions, what is out of scope.",
      "Non-functional: ask for DAU, read/write ratio, latency target, and whether stale reads are OK.",
      "Estimate quickly with round numbers. Say what each number decides (cache? sharding?).",
      "Define the API. It forces you to name the entities.",
      "Pick storage per access pattern, not per habit.",
      "Draw the simple version first: client, LB, service, DB. Make it work end to end.",
      "Then evolve: add cache, queue, CDN, sharding only where a requirement demands it.",
      "Deep dive where the interviewer points, or pick the hardest part yourself.",
      "Close with failure modes, monitoring, and what you would do next.",
    ], 'The framework'),
    diagram(`
Client -> DNS -> CDN (static)
   |
   v
Load Balancer -> API Gateway (auth, rate limit)
                    |
         +----------+-----------+
         v                      v
   Service A (stateless)   Service B (stateless)
     |      |                   |
   Cache   DB (primary +     Queue -> Workers
           replicas)
`, 'Default starting skeleton'),
    key("Requirements first, simple design second, scale third. Every box you add must answer a stated requirement or number."),
    warn("Drawing Kafka, Redis, and 12 microservices in minute 3. It signals buzzword design. Earn each component with a reason."),
    tip("Keep a running list of 'trade-offs I made' in the corner. Read it back in the last 3 minutes."),
    qa([
      ["What is the bottleneck in your design?", "Name the component that saturates first using your numbers (e.g. DB writes at 20k/s), then the fix (shard by user_id, batch writes, queue)."],
      ["What happens if this component dies?", "Describe redundancy (replicas, multi-AZ), detection (health checks), and failover time. Mention data loss window."],
    ]),
    drill("15 minutes: run steps 1-6 for a Pastebin with a timer. Then answer: what is your read/write ratio, what do you cache, and what breaks first at 10x traffic?"),
  ],
});

S.push({
  id: 'estimation',
  title: 'Back-of-the-envelope numbers',
  summary: 'Latency numbers, powers of two, and a repeatable QPS and storage method.',
  tags: ['estimation', 'qps', 'storage', 'latency', 'capacity planning', 'numbers'],
  blocks: [
    t("Estimates exist to drive decisions, not to be exact. Use round numbers and powers of ten. Always say what the number implies."),
    table(['Operation', 'Rough latency'], [
      ['L1 cache reference', '~1 ns'],
      ['Main memory reference', '~100 ns'],
      ['Read 1 MB sequentially from memory', '~10 us'],
      ['SSD random read', '~100 us'],
      ['Round trip in same datacenter', '~0.5 ms'],
      ['Read 1 MB sequentially from SSD', '~1 ms'],
      ['HDD seek', '~10 ms'],
      ['Round trip across continents', '~100-150 ms'],
    ], 'Latency ladder (orders of magnitude)'),
    table(['Power', 'Exact', 'Approx', 'Name'], [
      ['2^10', '1,024', '1 thousand', 'KB'],
      ['2^20', '1,048,576', '1 million', 'MB'],
      ['2^30', '~1.07 billion', '1 billion', 'GB'],
      ['2^40', '~1.1 trillion', '1 trillion', 'TB'],
      ['2^50', '', '1 quadrillion', 'PB'],
    ], 'Powers of two'),
    list([
      "1 day ~ 86,400 s ~ **10^5 s** (use 100k for quick math).",
      "1 million requests/day ~ 12 QPS. 1 billion/day ~ 12k QPS.",
      "Peak QPS ~ 2-3x average.",
      "A single app server handles ~1k-10k simple req/s. One Postgres primary ~ few thousand writes/s comfortably.",
      "Redis single node ~ 100k ops/s.",
      "char = 1 byte (ASCII), int = 4, long/timestamp = 8, UUID = 16 bytes.",
    ], 'Handy constants'),
    steps([
      "DAU x actions per user per day = daily requests.",
      "Daily requests / 10^5 = average QPS. Multiply by 2-3 for peak.",
      "Split reads vs writes using the ratio.",
      "Storage/day = writes/day x bytes per record. x 365 x years x replication factor.",
      "Bandwidth = QPS x response size.",
    ], 'Method'),
    table(['Quantity', 'Math', 'Result'], [
      ['DAU', 'given', '100M'],
      ['Tweets written/day', '100M x 2', '200M/day -> ~2k write QPS'],
      ['Timeline reads/day', '100M x 50', '5B/day -> ~50k read QPS, peak ~150k'],
      ['Tweet size', '280 chars + metadata', '~500 bytes'],
      ['Text storage/year', '200M x 500 B x 365', '~36 TB/yr, ~100 TB with 3x replication'],
      ['Media (10% have 1 MB image)', '20M x 1 MB', '20 TB/day -> object storage + CDN'],
    ], 'Worked example: Twitter-like service'),
    key("Close every estimate with a decision: '50k read QPS means we need a cache and read replicas', '36 TB/yr means sharding'."),
    warn("Spending 10 minutes on precise arithmetic. Round aggressively; say 'about'."),
    drill("10 minutes: estimate QPS, storage for 5 years, and bandwidth for a photo-sharing app with 50M DAU, 2 uploads/day at 2 MB, 30 views per user per day. Write the decision each number drives."),
  ],
});

S.push({
  id: 'scalability',
  title: 'Scalability basics',
  summary: 'Vertical vs horizontal scaling and why services should be stateless.',
  tags: ['scalability', 'horizontal', 'vertical', 'stateless', 'sessions'],
  blocks: [
    t("Vertical scaling buys a bigger machine. Horizontal scaling adds more machines. Horizontal needs stateless services so any server can handle any request."),
    table(['', 'Vertical (scale up)', 'Horizontal (scale out)'], [
      ['How', 'More CPU/RAM on one box', 'More boxes behind a load balancer'],
      ['Limit', 'Hardware ceiling, cost grows fast', 'Nearly unlimited'],
      ['Failure', 'Single point of failure', 'Survives node loss'],
      ['Complexity', 'Low', 'Needs LB, statelessness, distributed data'],
      ['Good for', 'Databases early on, quick wins', 'Web/app tiers, workers'],
    ]),
    list([
      "Stateless: no user session in server memory. Put sessions in Redis, a DB, or a signed token (JWT).",
      "Store files in object storage, not local disk.",
      "Configuration from env/config service, identical on every node.",
      "Then autoscale on CPU, QPS, or queue depth.",
    ], 'Making a service stateless'),
    key("Stateless app tier + stateful data tier. Scaling the app tier is easy; scaling data is where the real design work is."),
    warn("Sticky sessions as the scaling answer. They break when a node dies and skew load. Use them only as a temporary measure."),
    drill("10 minutes: list every piece of state in a typical login + shopping cart app. For each, say where it lives so web servers become stateless."),
  ],
});

S.push({
  id: 'load-balancing',
  title: 'Load balancing',
  summary: 'L4 vs L7, balancing algorithms, health checks, and LB redundancy.',
  tags: ['load balancer', 'l4', 'l7', 'round robin', 'least connections', 'health check'],
  blocks: [
    t("A load balancer spreads requests across healthy servers. L4 balances by IP and port; L7 understands HTTP and can route by path, header, or cookie."),
    table(['', 'L4 (transport)', 'L7 (application)'], [
      ['Sees', 'IP, port, TCP/UDP', 'HTTP method, path, headers, cookies'],
      ['Speed', 'Faster, less CPU', 'Slower, does TLS termination and parsing'],
      ['Features', 'Simple forwarding', 'Path routing, retries, auth, compression'],
      ['Examples', 'AWS NLB', 'AWS ALB, Nginx, Envoy'],
    ]),
    table(['Algorithm', 'How', 'Use when'], [
      ['Round robin', 'Next server in order', 'Equal servers, similar requests'],
      ['Weighted round robin', 'Bigger servers get more', 'Mixed hardware'],
      ['Least connections', 'Fewest active connections', 'Long or uneven requests'],
      ['Least response time', 'Fastest recent responses', 'Latency-sensitive'],
      ['IP / consistent hash', 'Same client to same server', 'Cache locality, sticky needs'],
      ['Power of two choices', 'Pick 2 random, choose less loaded', 'Large fleets, cheap and effective'],
    ], 'Algorithms'),
    list([
      "Health checks: active pings to `/health`; remove failing nodes, re-add when healthy.",
      "LB redundancy: active-passive pair with a floating IP, or managed cloud LB.",
      "Global: DNS-based (GeoDNS) or anycast to route users to the nearest region.",
    ]),
    key("Say both layers: DNS/GeoDNS picks the region, an L7 LB picks the server within it."),
    warn("Forgetting the LB itself can be a single point of failure."),
    drill("10 minutes: you have 3 servers, one with 2x the CPU, and requests vary from 5 ms to 5 s. Pick an algorithm and justify it, then describe what the health check endpoint should verify."),
  ],
});

S.push({
  id: 'caching',
  title: 'Caching',
  summary: 'Where to cache, read/write strategies, eviction, invalidation, and stampedes.',
  tags: ['cache', 'redis', 'cache-aside', 'write-through', 'write-back', 'eviction', 'invalidation', 'stampede'],
  blocks: [
    t("A cache keeps hot data in fast storage to cut latency and DB load. It is the first tool for read-heavy systems. The hard parts are staleness and invalidation."),
    list([
      "Client/browser cache (HTTP Cache-Control, ETag).",
      "CDN edge cache for static and cacheable responses.",
      "Application cache: local in-process (Caffeine) or distributed (Redis, Memcached).",
      "Database buffer pool and query cache.",
    ], 'Where caches live'),
    table(['Strategy', 'Read path', 'Write path', 'Trade-off'], [
      ['Cache-aside (lazy)', 'App checks cache; on miss reads DB and fills cache', 'App writes DB, then deletes cache key', 'Most common. First read is slow; brief staleness possible'],
      ['Read-through', 'Cache loads from DB on miss itself', 'Same as cache-aside', 'Simpler app code; cache needs a loader'],
      ['Write-through', 'From cache', 'Write cache and DB synchronously', 'Fresh cache; slower writes'],
      ['Write-back (write-behind)', 'From cache', 'Write cache; flush to DB async', 'Fast writes; data loss risk if cache dies'],
      ['Write-around', 'Cache-aside reads', 'Write DB only', 'Avoids caching data never read'],
    ], 'Strategies'),
    table(['Policy', 'Evicts'], [
      ['LRU', 'Least recently used (default choice)'],
      ['LFU', 'Least frequently used (stable hot sets)'],
      ['FIFO', 'Oldest inserted'],
      ['TTL', 'Anything past its expiry'],
    ], 'Eviction'),
    list([
      "Delete on write (not update) to avoid racing writers putting old values back.",
      "TTL as a safety net on every key.",
      "Event-driven invalidation via change data capture (CDC) for multi-service caches.",
      "Versioned keys (`user:42:v7`) to make old entries unreachable.",
    ], 'Invalidation'),
    list([
      "Stampede (thundering herd): a hot key expires and 1000 requests hit the DB.",
      "Fix 1: request coalescing / single-flight (one loader per key, others wait).",
      "Fix 2: a lock or lease on miss so only one caller recomputes.",
      "Fix 3: early probabilistic refresh, and jittered TTLs so keys do not expire together.",
      "Penetration (lookups for non-existent keys): cache negative results briefly or use a Bloom filter.",
    ], 'Stampede and friends'),
    key("Default answer: **cache-aside with Redis, delete-on-write, TTL + jitter, single-flight for hot keys**. Then mention the staleness window."),
    warn("Saying 'add a cache' without hit-rate reasoning, a TTL, or an invalidation plan."),
    qa([
      ["Cache and DB disagree. How?", "Write DB then delete cache; a concurrent read can refill stale data between. Mitigate with short TTL, delayed double delete, or CDC-driven invalidation."],
      ["Local vs distributed cache?", "Local is fastest but each node has its own copy (inconsistent, duplicated memory). Distributed is shared and consistent-ish but adds a network hop. Often both: small local L1 + Redis L2."],
    ]),
    drill("15 minutes: design caching for a product page with 100k reads/s and price changes every few minutes. Pick a strategy, TTL, invalidation, and stampede protection. Then answer: what if a celebrity product gets 1M reads/s?"),
  ],
});

S.push({
  id: 'cdn',
  title: 'CDN',
  summary: 'Edge caching for static assets and media; push vs pull.',
  tags: ['cdn', 'edge', 'static', 'media', 'cache'],
  blocks: [
    t("A CDN is a global network of edge caches. Users fetch content from a nearby edge instead of your origin. It cuts latency and origin bandwidth for static files and video."),
    table(['', 'Pull CDN', 'Push CDN'], [
      ['How', 'Edge fetches from origin on first miss', 'You upload content to the CDN ahead of time'],
      ['Good for', 'Large catalogs, unpredictable demand', 'Small set of known, big files'],
      ['Downside', 'First request is slow', 'You manage uploads and expiry'],
    ]),
    list([
      "Cache static assets with long TTLs and versioned file names (`app.3f2a.js`).",
      "Video segments and images are the biggest win.",
      "Signed URLs or tokens for private content.",
      "Can also cache API GET responses with short TTLs.",
      "Purge/invalidate API for urgent changes.",
    ]),
    key("CDN + object storage is the default answer for any media-heavy design."),
    warn("Using a CDN for highly personalized, per-user responses. Hit rate is near zero."),
    drill("10 minutes: for a news site, list which responses go through the CDN, their TTLs, and how a breaking-news correction gets purged within 1 minute."),
  ],
});

// ---------------------------------------------------------------- data

S.push({
  id: 'sql-vs-nosql',
  title: 'Databases: SQL vs NoSQL',
  summary: 'Pick storage by access pattern; a choice table for common needs.',
  tags: ['database', 'sql', 'nosql', 'postgres', 'cassandra', 'dynamodb', 'mongodb'],
  blocks: [
    t("Choose the database from the access pattern and consistency needs. SQL gives joins, transactions, and a schema. NoSQL families trade some of that for scale or flexible shapes."),
    table(['Type', 'Examples', 'Strengths', 'Use for'], [
      ['Relational (SQL)', 'Postgres, MySQL', 'ACID, joins, constraints', 'Payments, orders, bookings, user accounts'],
      ['Key-value', 'Redis, DynamoDB', 'O(1) by key, huge scale', 'Sessions, caches, carts, URL mappings'],
      ['Wide-column', 'Cassandra, HBase', 'Massive writes, partition + sort key', 'Chat messages, time series, feeds'],
      ['Document', 'MongoDB', 'Flexible JSON, nested data', 'Catalogs, profiles, CMS'],
      ['Graph', 'Neo4j', 'Relationship traversal', 'Social graph, recommendations, fraud'],
      ['Search', 'Elasticsearch', 'Full-text, ranking', 'Search, logs'],
      ['Time series', 'InfluxDB, TimescaleDB', 'Time-bucketed writes, downsampling', 'Metrics, IoT'],
      ['Object store', 'S3, GCS', 'Cheap, durable blobs', 'Images, video, backups'],
    ], 'Choice table'),
    list([
      "Need multi-row transactions or strong consistency? SQL.",
      "Write-heavy, simple access by key and time? Wide-column.",
      "Unknown or changing schema per item? Document.",
      "Default if unsure: Postgres. It scales further than people think (read replicas, partitioning).",
    ], 'Quick rules'),
    key("Say the access pattern first: 'We read messages by (chat_id, time) range, so a wide-column store with chat_id as partition key fits.'"),
    warn("'NoSQL because it scales' with no access pattern. Also: picking Mongo for money transfers."),
    drill("10 minutes: for each of these, pick a store and the primary key: user profiles, chat messages, payment ledger, product search, driver locations, video files."),
  ],
});

S.push({
  id: 'indexing',
  title: 'Indexing',
  summary: 'B-tree vs LSM, composite indexes, and the read/write trade-off.',
  tags: ['index', 'b-tree', 'lsm', 'composite index', 'database', 'performance'],
  blocks: [
    t("An index is a sorted side structure that turns a full scan into a fast lookup. Every index speeds reads and slows writes. Index the columns your queries filter and sort on."),
    table(['Structure', 'Used by', 'Good at', 'Cost'], [
      ['B-tree / B+tree', 'Postgres, MySQL', 'Point + range reads', 'Random writes in place'],
      ['LSM tree', 'Cassandra, RocksDB', 'Very high write throughput', 'Reads may check several files; compaction'],
      ['Hash index', 'In-memory KV', 'Exact match', 'No range queries'],
      ['Inverted index', 'Elasticsearch', 'Full-text search', 'Index build and storage'],
      ['Geospatial (R-tree, geohash)', 'PostGIS, Redis GEO', 'Nearby queries', 'Specialized'],
    ]),
    list([
      "Composite index `(user_id, created_at)` serves `WHERE user_id = ? ORDER BY created_at DESC`.",
      "Leftmost prefix rule: that index also serves `WHERE user_id = ?`, but not `WHERE created_at > ?` alone.",
      "Covering index: includes all selected columns, so the table is not touched.",
      "Low-cardinality columns (boolean) alone are poor index candidates.",
    ], 'Practical rules'),
    key("Design the index from the query: equality columns first, then the range/sort column."),
    warn("Adding an index for every column. Write amplification and storage explode."),
    drill("10 minutes: write 3 queries for an orders table (by user recent first, by status + date range, by order id). Design the minimal set of indexes that serves all three."),
  ],
});

S.push({
  id: 'replication',
  title: 'Replication',
  summary: 'Leader-follower, multi-leader, leaderless quorums, and replication lag.',
  tags: ['replication', 'leader follower', 'multi-leader', 'quorum', 'replica', 'lag'],
  blocks: [
    t("Replication keeps copies of data on several nodes for availability and read scaling. The design question is who accepts writes and how fast copies converge."),
    table(['Model', 'Writes go to', 'Pros', 'Cons'], [
      ['Leader-follower (primary-replica)', 'One leader', 'Simple, no write conflicts', 'Leader is a bottleneck; failover needed; replica lag'],
      ['Multi-leader', 'Several leaders (often one per region)', 'Local writes in each region', 'Write conflicts need resolution (last-write-wins, merge)'],
      ['Leaderless (Dynamo-style)', 'Any N replicas', 'High availability, no failover', 'Quorum tuning, read repair, conflicts'],
    ]),
    list([
      "Synchronous: leader waits for replica ack. No data loss, slower writes.",
      "Asynchronous: leader returns immediately. Fast, but recent writes can be lost on failover.",
      "Semi-sync: wait for at least one replica.",
    ], 'Sync vs async'),
    list([
      "N = replicas, W = write acks needed, R = replicas read.",
      "If **W + R > N**, every read overlaps the latest write (e.g. N=3, W=2, R=2).",
      "W=1, R=1: fastest, may read stale. W=N: writes fail if any node is down.",
    ], 'Quorums'),
    list([
      "Read-your-writes: route a user's reads to the leader for a few seconds after they write.",
      "Monotonic reads: pin a user to one replica.",
    ], 'Handling replica lag'),
    key("Leader-follower with async replicas is the default. Mention lag and read-your-writes in the same breath."),
    warn("Assuming replicas are always up to date. A user posts a comment, refreshes, and it is gone: classic lag bug."),
    drill("10 minutes: N=5. Pick W and R for (a) a shopping cart that must always accept writes and (b) a settings store that must never return stale data. Explain each choice."),
  ],
});

S.push({
  id: 'sharding',
  title: 'Sharding and partitioning',
  summary: 'Split data across nodes: strategies, hot keys, and resharding.',
  tags: ['sharding', 'partitioning', 'hot key', 'resharding', 'shard key'],
  blocks: [
    t("Sharding splits one dataset across many databases so each holds a slice. It scales writes and storage. The shard key decides everything: balance, query routing, and pain later."),
    table(['Strategy', 'How', 'Pros', 'Cons'], [
      ['Range', 'Key ranges per shard (A-F, G-M)', 'Range scans are easy', 'Hot spots (recent timestamps all on one shard)'],
      ['Hash', 'hash(key) mod N', 'Even spread', 'Range scans hit all shards; resharding moves most keys'],
      ['Consistent hash', 'Keys and nodes on a ring', 'Adding a node moves ~1/N keys', 'Needs virtual nodes for balance'],
      ['Directory / lookup', 'Service maps key to shard', 'Flexible, can move tenants', 'Lookup service is a dependency'],
      ['Geo', 'By region', 'Data locality, compliance', 'Uneven regions'],
    ]),
    list([
      "Pick a key with high cardinality and even access (user_id, chat_id).",
      "Keep data queried together on one shard (all of a user's orders).",
      "Avoid monotonically increasing keys for range sharding.",
    ], 'Choosing a shard key'),
    list([
      "Hot key: one celebrity or one viral item overloads a shard.",
      "Fixes: add a random suffix to spread writes (`key#0..9`) and fan-in on read; cache hot reads; dedicated shard for top tenants.",
    ], 'Hot keys'),
    list([
      "Cross-shard joins and transactions become app-level work (scatter-gather, sagas).",
      "Global secondary indexes need their own partitioning.",
      "Resharding: use many logical shards mapped to fewer physical nodes, then move logical shards. Or consistent hashing.",
    ], 'Costs'),
    key("Shard key = the field in almost every query's WHERE clause. State it explicitly."),
    warn("Sharding too early. First: indexes, caching, read replicas, vertical scaling. Shard when writes or storage outgrow one node."),
    drill("10 minutes: choose a shard key for (a) chat messages, (b) an e-commerce orders table queried by user and by seller, (c) a metrics store. For (b), explain how you serve the 'other' query."),
  ],
});

S.push({
  id: 'consistent-hashing',
  title: 'Consistent hashing',
  summary: 'A hash ring so adding or removing nodes moves only a small slice of keys.',
  tags: ['consistent hashing', 'hash ring', 'virtual nodes', 'sharding', 'cache'],
  blocks: [
    t("With `hash(key) % N`, changing N remaps almost every key. Consistent hashing puts nodes and keys on a ring; a key belongs to the next node clockwise. Adding a node only steals keys from one neighbor."),
    diagram(`
              0
         N3 .   . N1
          .       .
   270   .   ring  .   90
          .       .
         k2 .   . k1 -> goes to next node clockwise (N1 or N2)
              N2
             180

Virtual nodes: each physical node appears at many points (N1#1, N1#2, ...)
so load evens out and a failed node's keys spread over many neighbors.
`),
    java(`
class HashRing<T> {
    private final TreeMap<Long, T> ring = new TreeMap<>();
    private final int vnodes;

    HashRing(int vnodes) { this.vnodes = vnodes; }

    void add(T node) {
        for (int i = 0; i < vnodes; i++) ring.put(hash(node + "#" + i), node);
    }
    void remove(T node) {
        for (int i = 0; i < vnodes; i++) ring.remove(hash(node + "#" + i));
    }
    T nodeFor(String key) {
        if (ring.isEmpty()) throw new IllegalStateException("empty ring");
        Map.Entry<Long, T> e = ring.ceilingEntry(hash(key));
        return (e != null ? e : ring.firstEntry()).getValue();   // wrap around
    }
    private long hash(String s) { /* e.g. murmur3 64-bit */ return s.hashCode() & 0xffffffffL; }
}
`),
    list([
      "Distributed caches (Memcached clients), Cassandra and DynamoDB partitioning, load balancer stickiness.",
      "Replication: store a key on the next R distinct nodes clockwise.",
    ], 'Where it shows up'),
    key("Adding a node moves about K/N keys instead of nearly all K. Virtual nodes fix uneven load."),
    warn("Forgetting virtual nodes. With few physical nodes, a plain ring is badly unbalanced."),
    drill("15 minutes: implement the ring above with a real hash (e.g. `MessageDigest` MD5 first 8 bytes), add 3 nodes with 100 vnodes, map 10k keys, and count per node. Then add a 4th and count how many keys moved."),
  ],
});

S.push({
  id: 'cap-pacelc',
  title: 'CAP and PACELC',
  summary: 'During a partition choose consistency or availability; otherwise latency vs consistency.',
  tags: ['cap', 'pacelc', 'consistency', 'availability', 'partition tolerance', 'trade-off'],
  blocks: [
    t("CAP: when the network partitions, a distributed system must either reject some requests (consistent) or answer with possibly stale data (available). Partitions will happen, so the real choice is C or A during one."),
    table(['Choice', 'Behavior in a partition', 'Examples', 'Use for'], [
      ['CP', 'Refuse or block requests that cannot be confirmed', 'ZooKeeper, etcd, HBase, Spanner', 'Payments, inventory, leader election, locks'],
      ['AP', 'Keep serving, reconcile later', 'Cassandra, DynamoDB (default), DNS', 'Feeds, likes, carts, presence'],
    ]),
    t("PACELC extends CAP: if Partition, choose A or C; Else (normal operation), choose Latency or Consistency. It explains why systems trade consistency for speed even when nothing is broken."),
    table(['System', 'PACELC', 'Meaning'], [
      ['DynamoDB / Cassandra (default)', 'PA/EL', 'Available in partition, low latency otherwise'],
      ['Spanner, traditional RDBMS with sync replicas', 'PC/EC', 'Consistent always, pays latency'],
      ['MongoDB (default config)', 'PC/EC-ish', 'Primary reads are consistent'],
    ]),
    key("Pick per feature, not per system: 'Seat booking is CP; the seat-map view is AP and can be a few seconds stale.'"),
    warn("Saying 'we choose CA'. Without partition tolerance you are not a distributed system."),
    drill("10 minutes: for a ride-hailing app, label each feature CP or AP: driver location updates, trip assignment, fare payment, ratings, trip history. Justify each in one line."),
  ],
});

S.push({
  id: 'consistency-models',
  title: 'Consistency models',
  summary: 'Strong, eventual, causal, read-your-writes: what each guarantees.',
  tags: ['consistency', 'eventual', 'strong', 'linearizable', 'causal', 'read your writes'],
  blocks: [
    t("A consistency model is the promise a system makes about what reads see after writes. Stronger promises cost latency and availability. Pick the weakest model the feature can tolerate."),
    table(['Model', 'Promise', 'Example need'], [
      ['Strong (linearizable)', 'Every read sees the latest committed write, as if one copy', 'Bank balance, unique username, locks'],
      ['Sequential', 'All see the same order, maybe delayed', 'Replicated logs'],
      ['Causal', 'Cause is seen before effect', 'Comment reply never appears before the comment'],
      ['Read-your-writes', 'You always see your own updates', 'Profile edit shows immediately to you'],
      ['Monotonic reads', 'You never go back in time', 'Refreshing does not hide new items'],
      ['Eventual', 'Replicas converge if writes stop', 'Like counts, follower counts, feeds'],
    ]),
    list([
      "Strong: single leader with sync replication, or consensus (Raft/Paxos).",
      "Session guarantees: sticky routing to one replica or leader-after-write.",
      "Conflicts in eventual systems: last-write-wins (timestamps), version vectors, CRDTs.",
    ], 'How systems get there'),
    key("Most product features are fine with eventual + read-your-writes. Reserve strong consistency for money, inventory, and uniqueness."),
    warn("Last-write-wins with unsynchronized clocks silently drops writes. Say so if you pick LWW."),
    drill("10 minutes: a user changes their display name and immediately views their profile and a friend's feed. Which guarantee does each view need, and how do you provide it with async replicas?"),
  ],
});

// ---------------------------------------------------------------- communication

S.push({
  id: 'queues-streams',
  title: 'Message queues and streams',
  summary: 'Queue vs log (Kafka), delivery semantics, idempotent consumers, DLQ.',
  tags: ['queue', 'kafka', 'rabbitmq', 'sqs', 'stream', 'at-least-once', 'idempotency', 'async'],
  blocks: [
    t("Queues decouple producers from consumers and absorb traffic spikes. Use them when work can happen asynchronously. They add durability, retries, and independent scaling."),
    table(['', 'Message queue (RabbitMQ, SQS)', 'Log / stream (Kafka, Kinesis)'], [
      ['Model', 'Message deleted after ack', 'Append-only log, retained for days'],
      ['Consumers', 'Competing consumers share work', 'Consumer groups each read the full stream at their own offset'],
      ['Replay', 'No', 'Yes, rewind the offset'],
      ['Ordering', 'Per queue (often loose)', 'Strict per partition'],
      ['Use for', 'Task/job distribution, emails, image processing', 'Event sourcing, analytics, fan-out to many services, CDC'],
    ]),
    table(['Semantics', 'Meaning', 'Cost'], [
      ['At-most-once', 'Ack before processing; may lose messages', 'Cheapest'],
      ['At-least-once', 'Ack after processing; may duplicate', 'Default; needs idempotent consumers'],
      ['Exactly-once', 'Effectively once via idempotency + transactions', 'Hard; Kafka supports within its ecosystem'],
    ], 'Delivery'),
    list([
      "Idempotent consumer: store processed message IDs (or use a unique constraint) and skip duplicates.",
      "Make operations naturally idempotent: `SET status = PAID` instead of `balance += 10`.",
      "Ordering: partition by entity key (order_id) so one entity's events stay ordered.",
      "Dead-letter queue (DLQ) for messages that fail N times; alert on DLQ depth.",
      "Back-pressure: monitor consumer lag; autoscale consumers on lag.",
      "Transactional outbox: write the event to an outbox table in the same DB transaction, then relay it to the queue.",
    ], 'Practical rules'),
    key("Assume **at-least-once** and make consumers idempotent. That sentence answers half of all queue follow-ups."),
    warn("Dual write: updating the DB and publishing to Kafka separately. One can fail. Use the outbox pattern or CDC."),
    qa([
      ["How do you keep events for one user in order?", "Use user_id as the partition key. Ordering is guaranteed only within a partition, and one consumer handles a partition at a time."],
      ["Consumer is slow and lag grows?", "Add partitions and consumers (up to partition count), batch processing, or shed non-critical work."],
    ]),
    drill("15 minutes: design order processing where 'order placed' must trigger payment, inventory, and email services. Choose queue vs stream, partition key, delivery semantics, and how each consumer stays idempotent."),
  ],
});

S.push({
  id: 'rate-limiting',
  title: 'Rate limiting algorithms',
  summary: 'Token bucket, leaky bucket, fixed and sliding windows, and where to enforce.',
  tags: ['rate limiting', 'token bucket', 'leaky bucket', 'sliding window', 'throttling', '429'],
  blocks: [
    t("Rate limiting protects services from abuse and overload. It caps requests per client per time window. Exceeded requests get HTTP 429 with a `Retry-After` header."),
    table(['Algorithm', 'How', 'Pros', 'Cons'], [
      ['Token bucket', 'Bucket refills at rate r up to capacity b; each request takes a token', 'Allows bursts, O(1) memory', 'Two parameters to tune'],
      ['Leaky bucket', 'Queue drains at a fixed rate', 'Smooth output', 'Bursts are queued or dropped; adds latency'],
      ['Fixed window counter', 'Count per clock window (per minute)', 'Simplest, O(1)', 'Up to 2x burst at window boundaries'],
      ['Sliding window log', 'Store each timestamp; count those in last window', 'Exact', 'Memory O(requests)'],
      ['Sliding window counter', 'Current count + previous window weighted by overlap', 'Accurate enough, O(1)', 'Approximate'],
    ]),
    list([
      "Client-side: polite clients back off (not trusted).",
      "Edge/API gateway: per IP or API key, cheapest place to drop traffic.",
      "Service-level: per user per endpoint, business limits.",
    ], 'Where to enforce'),
    key("Token bucket in Redis at the API gateway is the default answer. Say which key you limit by (user, API key, IP)."),
    warn("Limiting by IP only. Many users share NAT IPs, and attackers rotate IPs."),
    drill("10 minutes: compute the sliding window counter estimate: limit 100/min, previous minute had 80, current minute has 40, and we are 25% into the current minute. Is the next request allowed?"),
  ],
});

S.push({
  id: 'api-design',
  title: 'API design',
  summary: 'REST vs gRPC vs GraphQL, pagination, versioning, and idempotency keys.',
  tags: ['api', 'rest', 'grpc', 'graphql', 'pagination', 'idempotency', 'versioning'],
  blocks: [
    t("The API is the contract between clients and your system. Define it early; it exposes the entities and the access patterns. Keep it resource-oriented and predictable."),
    table(['', 'REST', 'gRPC', 'GraphQL'], [
      ['Format', 'JSON over HTTP', 'Protobuf over HTTP/2', 'JSON, single endpoint'],
      ['Strength', 'Simple, cacheable, universal', 'Fast, typed, streaming', 'Client picks fields, fewer round trips'],
      ['Weakness', 'Over/under-fetching', 'Browser support needs a proxy', 'Caching and rate limiting are harder; N+1 risk'],
      ['Use for', 'Public APIs, CRUD', 'Internal service-to-service', 'Mobile/web with varied screens'],
    ]),
    diagram(`
POST   /v1/urls                 { longUrl, alias? }   -> 201 { shortCode }
GET    /v1/urls/{code}                                -> 200 { longUrl, stats }
GET    /v1/users/{id}/orders?limit=20&cursor=abc     -> 200 { items, nextCursor }
POST   /v1/payments   Idempotency-Key: 7f3e...        -> 201 { paymentId, status }
`, 'Example REST endpoints'),
    table(['Pagination', 'How', 'Trade-off'], [
      ['Offset', '`?offset=40&limit=20`', 'Simple; slow on deep pages; items shift when data changes'],
      ['Cursor (keyset)', '`?cursor=<last id/time>&limit=20`', 'Stable and fast; no jumping to page N'],
    ]),
    list([
      "Idempotency key: client sends a unique key on POST; server stores key -> result and returns the same result on retry.",
      "Version in the path (`/v1`) or a header; never break existing clients.",
      "Use proper status codes: 201 created, 400 bad input, 401/403 auth, 404, 409 conflict, 429 rate limited, 5xx server.",
      "Long operations: return 202 Accepted + a status URL.",
    ], 'Rules'),
    key("Any POST that moves money or creates a booking takes an **Idempotency-Key**. Retries must not double charge."),
    warn("Offset pagination for infinite feeds. Use cursors."),
    drill("10 minutes: write the API for a food delivery app (browse restaurants, place order, track order, cancel). Include pagination, the idempotency key, and status codes for 2 failure cases."),
  ],
});

S.push({
  id: 'microservices',
  title: 'Microservices vs monolith',
  summary: 'When to split, how services talk, and the costs you sign up for.',
  tags: ['microservices', 'monolith', 'architecture', 'saga', 'distributed transactions'],
  blocks: [
    t("A monolith is one deployable unit. Microservices split by business capability, each with its own data. Splitting buys independent scaling and deploys, and costs network calls, distributed failures, and operational load."),
    table(['', 'Monolith', 'Microservices'], [
      ['Deploy', 'One unit', 'Each service independently'],
      ['Scaling', 'All together', 'Per service'],
      ['Data', 'One DB, easy transactions', 'DB per service, eventual consistency'],
      ['Failure', 'Bug can take all down', 'Partial failures, cascading risk'],
      ['Team fit', 'Small teams', 'Many teams owning domains'],
      ['Ops cost', 'Low', 'High: discovery, tracing, CI/CD per service'],
    ]),
    list([
      "Sync: REST/gRPC for queries that need an answer now.",
      "Async: events via a queue for side effects (send email, update search index).",
      "Distributed transactions: Saga (sequence of local transactions with compensating actions), orchestrated or choreographed.",
      "Avoid shared databases between services.",
    ], 'Communication'),
    key("Start with a modular monolith; split where scaling, team ownership, or failure isolation demands it."),
    warn("A 'distributed monolith': services that must deploy together and call each other synchronously in long chains."),
    drill("10 minutes: split an e-commerce app into services. For 'place order', write the saga steps and the compensating action for each step if payment fails."),
  ],
});

S.push({
  id: 'discovery-gateway',
  title: 'Service discovery and API gateway',
  summary: 'How services find each other, and the single front door for clients.',
  tags: ['service discovery', 'api gateway', 'service mesh', 'consul', 'kubernetes'],
  blocks: [
    t("In a dynamic fleet, instance IPs change constantly. Service discovery keeps a live registry of healthy instances. An API gateway is the single entry point that handles cross-cutting concerns for clients."),
    table(['Discovery style', 'How', 'Examples'], [
      ['Client-side', 'Client queries registry, picks an instance', 'Eureka + Ribbon'],
      ['Server-side', 'Client calls an LB that queries the registry', 'AWS ALB, Kubernetes Service'],
      ['DNS-based', 'Service name resolves to healthy IPs', 'Kubernetes DNS, Consul DNS'],
      ['Service mesh', 'Sidecar proxy handles discovery, retries, mTLS', 'Istio, Linkerd'],
    ]),
    list([
      "Routing by path/host to backend services.",
      "Authentication and token validation.",
      "Rate limiting and quotas.",
      "TLS termination, request/response transformation.",
      "Aggregation (Backend-for-Frontend) for mobile vs web.",
      "Logging, metrics, tracing headers.",
    ], 'Gateway responsibilities'),
    key("Gateway = north-south traffic (clients to services). Mesh/discovery = east-west traffic (service to service)."),
    warn("Putting business logic in the gateway. It becomes a bottleneck everyone must change."),
    drill("10 minutes: draw the request path for a mobile app call to 'get my orders' from DNS to database, naming every hop and which component does auth, rate limiting, and service lookup."),
  ],
});

// ---------------------------------------------------------------- operations

S.push({
  id: 'observability',
  title: 'Observability',
  summary: 'Logs, metrics, traces, and SLI/SLO/SLA language.',
  tags: ['observability', 'logs', 'metrics', 'tracing', 'slo', 'sla', 'sli', 'monitoring'],
  blocks: [
    t("Observability is how you know the system works and why it does not. Three signals cover most needs. Interviewers like a closing line on what you would monitor."),
    table(['Signal', 'What', 'Tools', 'Answers'], [
      ['Logs', 'Structured events (JSON) with request IDs', 'ELK, Loki', 'What happened in this request?'],
      ['Metrics', 'Numeric time series', 'Prometheus, Datadog', 'Is it healthy? Trends, alerts'],
      ['Traces', 'Spans across services for one request', 'OpenTelemetry, Jaeger', 'Where did the latency go?'],
    ]),
    list([
      "RED for services: Rate, Errors, Duration (p50, p95, p99).",
      "USE for resources: Utilization, Saturation, Errors.",
      "Business metrics: orders/min, payment success rate.",
      "Queue lag, cache hit rate, DB replication lag.",
    ], 'What to measure'),
    table(['Term', 'Meaning', 'Example'], [
      ['SLI', 'Measured indicator', '% of requests under 200 ms'],
      ['SLO', 'Internal target for the SLI', '99.9% under 200 ms over 30 days'],
      ['SLA', 'External contract with penalties', '99.9% uptime or credits'],
      ['Error budget', '1 - SLO', '0.1% = ~43 minutes/month of failure allowed'],
    ]),
    key("Alert on symptoms users feel (error rate, p99 latency), not on every CPU spike."),
    warn("Using averages for latency. Tail latency (p99) is what users notice and what fan-out amplifies."),
    drill("10 minutes: pick 5 metrics and 2 alerts for a URL shortener. Write the SLO for redirects and compute its monthly error budget in minutes."),
  ],
});

S.push({
  id: 'reliability',
  title: 'Reliability patterns',
  summary: 'Timeouts, retries with backoff, circuit breakers, redundancy, and failover.',
  tags: ['reliability', 'retry', 'backoff', 'circuit breaker', 'timeout', 'failover', 'bulkhead', 'availability'],
  blocks: [
    t("In distributed systems, something is always failing. Reliability patterns stop one slow dependency from taking everything down. Combine them; each covers a different failure."),
    table(['Pattern', 'What it does', 'Detail'], [
      ['Timeout', 'Never wait forever', 'Set per call, shorter than the caller\'s own timeout'],
      ['Retry + exponential backoff + jitter', 'Recover from transient errors', 'Retry only idempotent ops and 5xx/network errors; cap attempts'],
      ['Circuit breaker', 'Stop calling a failing dependency', 'Closed -> Open after N failures -> Half-open probe -> Closed'],
      ['Bulkhead', 'Isolate resources', 'Separate thread pools/connection pools per dependency'],
      ['Fallback / graceful degradation', 'Serve something useful', 'Cached data, default recommendations, hide a widget'],
      ['Load shedding', 'Reject early under overload', 'Drop low-priority traffic, return 503 fast'],
      ['Redundancy', 'No single point of failure', 'N+1 instances, multi-AZ, replicated data'],
      ['Failover', 'Switch to standby', 'Active-passive or active-active; health checks + leader election'],
    ]),
    diagram(`
          failures >= threshold
 CLOSED ------------------------> OPEN  (fail fast, no calls)
   ^                                |
   | probe succeeds                 | after cooldown
   |                                v
   +-------------------------- HALF-OPEN (allow a few probe calls)
          probe fails -> back to OPEN
`, 'Circuit breaker states'),
    table(['Availability', 'Downtime per year'], [
      ['99%', '~3.65 days'],
      ['99.9%', '~8.8 hours'],
      ['99.99%', '~53 minutes'],
      ['99.999%', '~5 minutes'],
    ]),
    key("Retries without backoff and jitter cause retry storms. Retries without idempotency cause duplicates."),
    warn("Retrying at every layer: 3 retries x 3 layers = 27 calls on the bottom service. Retry at one layer."),
    drill("10 minutes: a checkout service calls payment (slow sometimes), inventory, and recommendations. Assign timeout, retry, breaker, and fallback settings to each call and justify them."),
  ],
});

S.push({
  id: 'security',
  title: 'Security basics',
  summary: 'AuthN vs authZ, sessions vs JWT, OAuth 2.0, encryption in transit and at rest.',
  tags: ['security', 'authentication', 'authorization', 'jwt', 'oauth', 'encryption', 'tls'],
  blocks: [
    t("Authentication proves who you are. Authorization decides what you may do. Encryption protects data on the wire and on disk."),
    table(['Approach', 'How', 'Pros', 'Cons'], [
      ['Server sessions', 'Session ID cookie; session data in Redis', 'Easy revoke', 'Needs shared session store'],
      ['JWT (stateless token)', 'Signed token carries claims; services verify signature', 'No lookup per request', 'Hard to revoke; keep short expiry + refresh tokens'],
      ['OAuth 2.0', 'Delegated access via an authorization server', 'Third-party login, scoped access', 'More moving parts'],
      ['OIDC', 'Identity layer on top of OAuth 2.0', 'Standard login (Sign in with Google)', ''],
    ], 'Authentication'),
    list([
      "RBAC (roles) for most apps; ABAC (attributes) for fine-grained rules.",
      "Check authorization at the service that owns the data, not only at the gateway.",
      "Principle of least privilege for services and DB users.",
    ], 'Authorization'),
    list([
      "TLS everywhere in transit; mTLS between services in a mesh.",
      "Encryption at rest with managed keys (KMS); envelope encryption for sensitive fields.",
      "Hash passwords with bcrypt/scrypt/Argon2, never plain SHA.",
      "Secrets in a vault, not in code or images.",
      "Input validation, parameterized queries, rate limits on login.",
    ], 'Data protection'),
    key("Short-lived access token (minutes) + refresh token (days), validated at the gateway, authorization re-checked in the owning service."),
    warn("Putting sensitive data in a JWT payload. It is signed, not encrypted; anyone can read it."),
    drill("10 minutes: describe the full login flow for a mobile app with Google sign-in (OIDC), including where tokens are stored, how they are refreshed, and how you log a stolen device out."),
  ],
});

S.push({
  id: 'blob-storage',
  title: 'Blob / object storage',
  summary: 'Store large files in S3-like stores; upload via pre-signed URLs.',
  tags: ['object storage', 's3', 'blob', 'upload', 'pre-signed url', 'media'],
  blocks: [
    t("Object storage holds large immutable files cheaply and durably. Databases store only metadata and the object key. Clients upload and download directly, bypassing your servers."),
    steps([
      "Client asks the API for an upload URL (sends file name, size, type).",
      "API validates, creates a metadata row (status=PENDING), returns a pre-signed PUT URL.",
      "Client uploads directly to object storage (multipart for big files, resumable).",
      "Storage emits an event; a worker validates, scans, generates thumbnails/transcodes, sets status=READY.",
      "Reads go through a CDN using the object key.",
    ], 'Upload flow'),
    list([
      "Durability ~11 nines via replication/erasure coding across zones.",
      "Storage tiers: hot, infrequent, archive (cheaper, slower).",
      "Lifecycle rules to move or delete old objects.",
      "Content-addressed keys (hash of content) give free deduplication.",
    ], 'Key facts'),
    key("Never stream large uploads through your app servers. Pre-signed URLs + direct upload + async processing."),
    warn("Storing images as BLOBs in the relational DB. It bloats backups and replication."),
    drill("10 minutes: design profile-photo upload for 10M users: API calls, metadata table columns, processing steps, and how a user sees the new photo within seconds via the CDN."),
  ],
});

S.push({
  id: 'search',
  title: 'Search and inverted indexes',
  summary: 'Tokenize, build term-to-documents lists, rank, and keep the index fresh.',
  tags: ['search', 'inverted index', 'elasticsearch', 'tf-idf', 'bm25', 'full-text'],
  blocks: [
    t("Full-text search uses an inverted index: for each term, the list of documents containing it. A query intersects those lists and ranks the results. Databases with LIKE '%x%' cannot do this at scale."),
    diagram(`
Docs:  1: "red running shoes"   2: "blue running jacket"   3: "red jacket"

Inverted index (term -> posting list):
  red     -> [1, 3]
  running -> [1, 2]
  shoes   -> [1]
  blue    -> [2]
  jacket  -> [2, 3]

Query "red jacket" -> intersect [1,3] and [2,3] -> [3]  (OR -> rank 1,2,3)
`),
    list([
      "Analysis: lowercase, tokenize, remove stop words, stem (running -> run), synonyms.",
      "Ranking: TF-IDF or BM25 relevance, plus business signals (popularity, recency).",
      "Sharding: by document (each shard holds a full mini-index; query fans out to all and merges top-K).",
      "Freshness: DB is the source of truth; changes flow via CDC/queue to the indexer (near real time).",
    ]),
    key("Search index is a secondary, derived store. Write to the DB, stream changes to Elasticsearch, accept seconds of lag."),
    warn("Using the search engine as the primary database for transactional data."),
    drill("10 minutes: design product search for an e-commerce site: indexing pipeline, fields to index, how filters (price, brand) work, and how a price change reaches the index."),
  ],
});

S.push({
  id: 'realtime',
  title: 'Real-time communication',
  summary: 'Short polling, long polling, WebSockets, and SSE compared.',
  tags: ['websocket', 'sse', 'long polling', 'polling', 'real-time', 'push'],
  blocks: [
    t("Real-time features push updates from server to client. The choice depends on direction, frequency, and scale. Persistent connections need special handling for load balancing and failover."),
    table(['Technique', 'How', 'Direction', 'Use for'], [
      ['Short polling', 'Client asks every N seconds', 'Client pull', 'Rare updates, simplest'],
      ['Long polling', 'Server holds request until data or timeout', 'Near push', 'Fallback, moderate rates'],
      ['Server-Sent Events (SSE)', 'One long HTTP response streaming events', 'Server to client only', 'Live scores, notifications, LLM token streams'],
      ['WebSocket', 'Upgraded full-duplex TCP connection', 'Both ways', 'Chat, multiplayer, collaborative editing'],
    ]),
    list([
      "Connection servers (gateways) hold sockets; a registry maps user_id -> gateway node.",
      "Use a pub/sub layer (Redis pub/sub, Kafka) so any backend can reach any gateway.",
      "Heartbeats detect dead connections; clients reconnect with backoff and resume from last event ID.",
      "One server handles roughly 10k-100k+ idle connections; plan the fleet by concurrent users.",
    ], 'Scaling persistent connections'),
    key("Chat = WebSocket. One-way live updates = SSE. Fallback = long polling."),
    warn("Assuming a WebSocket message was delivered. Use acks and a stored message log so reconnecting clients catch up."),
    drill("10 minutes: 5M concurrent users get live cricket score updates every few seconds. Choose a technique, estimate gateway servers needed, and explain how one score update reaches all of them."),
  ],
});

// ---------------------------------------------------------------- classic designs

S.push({
  id: 'design-url-shortener',
  title: 'Design: URL Shortener',
  summary: 'Short codes, ID generation, a read-heavy redirect path, and analytics.',
  tags: ['url shortener', 'tinyurl', 'design', 'base62', 'id generation', 'cache'],
  blocks: [
    t("Create a short code for a long URL and redirect fast. It is read-heavy (100:1) and needs unique, short IDs. The classic warm-up HLD."),
    list([
      "Functional: shorten URL, optional custom alias and expiry, redirect, basic click stats.",
      "Non-functional: redirect p99 < 50 ms, 99.99% available, codes not guessable in sequence (nice to have).",
    ], 'Requirements'),
    table(['Quantity', 'Estimate'], [
      ['New URLs', '100M/month -> ~40 writes/s'],
      ['Redirects', '100:1 -> ~4k reads/s, peak ~10k'],
      ['Storage', '100M x 12 months x 5 years x ~500 B -> ~3 TB'],
      ['Code length', 'base62^7 = ~3.5 trillion codes, plenty'],
    ], 'Estimates'),
    diagram(`
POST /v1/urls        { longUrl, alias?, expiresAt? } -> 201 { code, shortUrl }
GET  /{code}         -> 301/302 Location: longUrl
GET  /v1/urls/{code}/stats -> { clicks, byDay }

urls(code PK, long_url, user_id, created_at, expires_at)
clicks -> event stream -> analytics store (aggregated per code/day)
`, 'API and data model'),
    diagram(`
Client -> LB -> Redirect service -> Redis cache (code -> url)
                     |                  | miss
                     |                  v
                     |              KV store (DynamoDB/Cassandra), sharded by code
                     +-> click event -> Kafka -> analytics workers -> OLAP store

Write path: API -> ID generator (ranges) -> base62 -> KV store
`, 'Architecture'),
    table(['ID generation option', 'How', 'Trade-off'], [
      ['Hash (MD5 of URL) and take 7 chars', 'Deterministic', 'Collisions need retry; same URL gives same code'],
      ['Counter + base62', 'Global counter', 'Short and unique; sequential and guessable; counter is a bottleneck'],
      ['Range allocation', 'Each server leases a block of 1M IDs from ZooKeeper/DB', 'No per-request coordination; gaps on crash are fine'],
      ['Random 7 chars + uniqueness check', 'Insert-if-absent', 'Not guessable; rare retries'],
    ], 'Deep dive: unique codes'),
    list([
      "301 (permanent) lets browsers cache and cuts load, but hides repeat clicks. 302 keeps analytics accurate.",
      "Cache hot codes in Redis with LRU; 20% of links get 80% of traffic.",
      "Expired links: lazy check on read + background cleanup.",
      "Abuse: rate limit creation per user, scan URLs against malware lists.",
    ], 'Talking points'),
    key("Pre-allocated ID ranges + base62 encoding gives short, unique codes with no hot coordination on each write."),
    warn("Making click analytics a synchronous DB write on the redirect path. Emit an event and aggregate async."),
    qa([
      ["Custom aliases collide with generated codes?", "Use a single namespace with insert-if-absent (conditional write). Optionally reserve a prefix for custom aliases."],
      ["Same long URL shortened twice?", "Either return a new code (simple, per-user stats) or look up an index on hash(long_url) to reuse. State the choice."],
    ]),
    drill("15 minutes: run the full framework for this design on paper. Then answer: how do you make codes non-sequential with range allocation, and what changes for 100k redirects/s?"),
  ],
});

S.push({
  id: 'design-rate-limiter',
  title: 'Design: Rate Limiter service',
  summary: 'Distributed, low-latency limits per key with Redis and gateway integration.',
  tags: ['rate limiter', 'design', 'redis', 'token bucket', 'api gateway', 'distributed'],
  blocks: [
    t("Build a shared rate limiter used by every API. Decisions must take about a millisecond and be correct across many gateway nodes. Rules are configurable per client and endpoint."),
    list([
      "Functional: limit by user/API key/IP per endpoint; configurable rules; return 429 with headers.",
      "Non-functional: < 1-2 ms added latency, highly available, approximate accuracy is acceptable.",
      "Decide: fail open (allow if limiter down) or fail closed. Usually fail open for user APIs.",
    ], 'Requirements'),
    table(['Quantity', 'Estimate'], [
      ['Traffic', '1M req/s across gateways'],
      ['Keys', '10M active clients x few endpoints'],
      ['State per key', '~50 bytes (tokens + timestamp) -> ~1-2 GB in Redis'],
    ], 'Estimates'),
    diagram(`
Client -> API Gateway (rate-limit middleware) -> Services
                 |
                 v
         Redis cluster (sharded by key)  <- Rules service (config, cached locally)

Response headers: X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After
`, 'Architecture'),
    list([
      "Atomic check-and-update with a Redis Lua script (token bucket: read tokens + last refill, refill, decrement, write).",
      "Shard Redis by limiter key; replicas for availability.",
      "Hot path optimization: local in-memory token buckets per gateway that sync with Redis periodically (less accurate, much faster).",
      "Rules cached in each gateway, refreshed on change via pub/sub.",
      "Multi-region: limit per region, or accept slight overshoot with async sync.",
    ], 'Deep dives'),
    table(['Choice', 'Pro', 'Con'], [
      ['Central Redis check per request', 'Accurate', 'Network hop per request'],
      ['Local counters + periodic sync', 'Fast', 'Can overshoot by nodes x local budget'],
      ['Fail open', 'No outage from limiter', 'Abuse possible during outage'],
    ], 'Trade-offs'),
    key("Race-free distributed limiting = **one atomic Lua script per decision** in Redis."),
    warn("GET then SET from the gateway. Two gateways read the same count and both allow."),
    drill("15 minutes: write the pseudo-steps of the token bucket Lua script and the key format. Then answer: how do you support 'premium users get 10x' without code changes?"),
  ],
});

S.push({
  id: 'design-chat',
  title: 'Design: Chat app (WhatsApp)',
  summary: '1:1 and group messaging with WebSockets, delivery receipts, and offline sync.',
  tags: ['chat', 'whatsapp', 'design', 'websocket', 'messaging', 'presence', 'cassandra'],
  blocks: [
    t("Users send messages to individuals and groups in real time. Messages must not be lost and must stay in order per chat. Offline users get messages when they reconnect."),
    list([
      "Functional: 1:1 and group chat (up to ~500), sent/delivered/read receipts, online presence, history sync, media.",
      "Non-functional: low latency (< 200 ms), durable, ordered per conversation, highly available.",
    ], 'Requirements'),
    table(['Quantity', 'Estimate'], [
      ['DAU', '500M, ~40 messages/day each'],
      ['Messages', '20B/day -> ~230k/s avg, ~700k/s peak'],
      ['Storage', '20B x 100 B -> 2 TB/day'],
      ['Connections', '~200M concurrent WebSockets -> ~2-4k gateway servers at ~50-100k each'],
    ], 'Estimates'),
    diagram(`
WebSocket frames:
  send   { clientMsgId, chatId, body }
  ack    { clientMsgId, serverMsgId, ts }
  msg    { serverMsgId, chatId, from, body, ts }
  receipt{ serverMsgId, status: DELIVERED|READ }
REST: GET /v1/chats/{id}/messages?before=cursor  (history)

messages(chat_id PARTITION, msg_id CLUSTERING desc, sender, body, ts)  -- wide-column
chats(chat_id, type, members)   user_inbox(user_id, chat_id, last_read_msg_id)
`, 'API and data model'),
    diagram(`
Sender -> WS Gateway A -> Chat service -> Message store (Cassandra)
                                |
                                +-> Session registry (Redis: user -> gateway)
                                |
                     recipient online? --yes--> pub/sub -> WS Gateway B -> Recipient
                                |
                                no -> Push notification service (APNs/FCM)
`, 'Architecture'),
    list([
      "Message IDs: per-chat monotonically increasing (or time-sortable Snowflake IDs) for ordering.",
      "Delivery: persist first, then ack the sender (sent tick), then fan out. Recipient acks -> delivered tick.",
      "Client dedup with clientMsgId makes retries safe (at-least-once delivery).",
      "Offline sync: on reconnect, client sends last seen msg_id per chat; server returns newer messages.",
      "Groups: fan-out on write to each member's gateway; for very large groups, fan-out via a queue.",
      "Presence: heartbeat updates a TTL key in Redis; broadcast changes only to contacts who are online.",
      "Media: upload to object storage, send the URL in the message. E2E encryption keeps the server blind to content.",
    ], 'Deep dives'),
    key("Persist, then ack, then deliver. Client-generated IDs make retries idempotent, server IDs give order."),
    warn("Using a relational DB with one giant messages table and no partition strategy. Partition by chat_id."),
    qa([
      ["How do you guarantee order in a group?", "Single sequencer per chat (the partition owner assigns increasing IDs). Clients sort by that ID, not by device clock."],
      ["What if the recipient's gateway crashes?", "Client reconnects to another gateway, registry updates, client syncs from last seen ID. Nothing is lost because messages were persisted first."],
    ]),
    drill("20 minutes: sketch the design and trace one group message to 3 members (2 online, 1 offline) step by step. Then answer: how does a read receipt reach the sender?"),
  ],
});

S.push({
  id: 'design-news-feed',
  title: 'Design: News Feed / Twitter timeline',
  summary: 'Fan-out on write vs read, the celebrity problem, and feed ranking.',
  tags: ['news feed', 'twitter', 'timeline', 'design', 'fan-out', 'celebrity', 'cache'],
  blocks: [
    t("Users post, follow others, and read a home timeline. Reads massively outnumber writes. The central decision is when to build each user's timeline."),
    list([
      "Functional: post (text + media), follow/unfollow, home timeline (reverse chronological or ranked), user timeline.",
      "Non-functional: timeline load < 200 ms, eventual consistency is fine (a few seconds), highly available.",
    ], 'Requirements'),
    table(['Quantity', 'Estimate'], [
      ['DAU', '200M'],
      ['Posts', '400M/day -> ~5k writes/s'],
      ['Timeline reads', '200M x 20 -> 4B/day -> ~50k/s, peak ~150k/s'],
      ['Avg followers', '~200; some accounts have 100M'],
    ], 'Estimates'),
    diagram(`
POST /v1/posts            { text, mediaIds }
GET  /v1/feed?cursor=     -> { posts[], nextCursor }
POST /v1/users/{id}/follow

posts(post_id, author_id, text, media, created_at)    -- sharded by post_id/author
follows(follower_id, followee_id)                      -- both directions indexed
feed cache: Redis list per user: [post_id, ...] (last ~800)
`, 'API and data model'),
    diagram(`
Write: Post service -> posts DB -> Kafka "post_created"
                                       |
                                 Fan-out workers -> for each follower: LPUSH feed:{follower}
                                       (skip for celebrity authors)

Read:  Feed service -> Redis feed:{me} (post IDs)
                    + merge recent posts from celebrities I follow (pulled at read time)
                    -> hydrate posts + users (cache) -> rank -> return
`, 'Architecture'),
    table(['', 'Fan-out on write (push)', 'Fan-out on read (pull)'], [
      ['When built', 'At post time into every follower feed', 'At read time from followees'],
      ['Read cost', 'O(1) read of a list', 'Query many authors and merge'],
      ['Write cost', 'O(followers) per post', 'O(1)'],
      ['Problem', 'Celebrity posts = 100M writes', 'Slow reads for users following many'],
    ], 'Deep dive: push vs pull'),
    list([
      "Hybrid: push for normal users, pull for celebrities (> ~10k followers), merged on read.",
      "Only precompute feeds for active users; rebuild on demand for dormant ones.",
      "Store post IDs only in feeds; hydrate from a post cache.",
      "Ranking: candidate generation (feed list) then a scoring model (recency, engagement, affinity).",
      "Media through object storage + CDN.",
    ], 'Talking points'),
    key("The hybrid push/pull answer with the celebrity threshold is the core of this question."),
    warn("Pure fan-out on write without handling celebrities. One post from a 100M-follower account stalls the pipeline."),
    drill("15 minutes: draw the hybrid design and compute fan-out writes per second at 5k posts/s with 200 average followers. Then answer: how does unfollow clean up the feed?"),
  ],
});

S.push({
  id: 'design-notification-system',
  title: 'Design: Notification system',
  summary: 'Multi-channel delivery at scale with preferences, priorities, retries, and dedup.',
  tags: ['notification', 'design', 'push', 'email', 'sms', 'queue', 'idempotency'],
  blocks: [
    t("Internal services trigger notifications; the system delivers via push, SMS, and email. It must respect user preferences, never spam, and survive provider outages."),
    list([
      "Functional: send single and bulk notifications, templates, user preferences/opt-out, scheduling, delivery tracking.",
      "Non-functional: OTPs within seconds, marketing can lag; at-least-once with dedup; horizontally scalable.",
    ], 'Requirements'),
    table(['Quantity', 'Estimate'], [
      ['Volume', '10M push + 1M SMS + 5M email per day; campaigns spike to 1M/min'],
      ['Avg rate', '~200/s, bursts ~20k/s'],
    ], 'Estimates'),
    diagram(`
POST /v1/notifications { idempotencyKey, userIds|segment, template, data, priority, sendAt? }

notifications(id, idem_key UNIQUE, user_id, channel, status, attempts, created_at)
preferences(user_id, channel, category, enabled, quiet_hours)
device_tokens(user_id, token, platform)
`, 'API and data model'),
    diagram(`
Services -> Notification API (validate, dedup by idem key, persist)
                 |
                 v
        Router (prefs, rate limits, quiet hours, template render)
                 |
     +-----------+-----------+------------+
     v           v           v            v
  push-high   push-low    sms queue   email queue   (separate queues per channel+priority)
     |           |           |            |
  workers -> APNs/FCM     Twilio      SES/SendGrid  -> status callbacks -> tracking DB
     failures -> retry with backoff -> DLQ
`, 'Architecture'),
    list([
      "Separate queues per channel and priority so a marketing blast never delays OTPs.",
      "Dedup with the idempotency key + (user, template, window) to avoid double sends.",
      "Per-user frequency caps and global provider rate limits.",
      "Provider failover: secondary SMS/email provider behind a circuit breaker.",
      "Bulk campaigns: expand segments in batches by a scheduler, not in the API request.",
      "Invalid device tokens from APNs/FCM responses are removed.",
    ], 'Deep dives'),
    key("Queues per channel and priority + idempotent workers + provider circuit breakers."),
    warn("Calling SMS/email providers synchronously from the API request. Always enqueue."),
    drill("15 minutes: trace a 'flash sale' campaign to 20M users from API call to delivery. Where are the bottlenecks, and how do you keep OTP latency under 5 seconds during it?"),
  ],
});

S.push({
  id: 'design-video-streaming',
  title: 'Design: YouTube / video streaming',
  summary: 'Upload, transcoding pipeline, adaptive bitrate streaming via CDN.',
  tags: ['youtube', 'netflix', 'video', 'design', 'transcoding', 'cdn', 'hls', 'adaptive bitrate'],
  blocks: [
    t("Users upload videos; the system transcodes them into many resolutions and streams them globally. Storage and bandwidth dominate cost. The CDN does almost all the serving."),
    list([
      "Functional: upload, transcode, stream with seek, metadata/search, view counts, comments (light).",
      "Non-functional: playback starts < 2 s, smooth on poor networks, uploads are durable, views are eventually consistent.",
    ], 'Requirements'),
    table(['Quantity', 'Estimate'], [
      ['Uploads', '500 hours of video per minute'],
      ['Storage', '1 hour ~ 1 GB raw -> ~3 GB across renditions -> ~2 PB/day'],
      ['Views', '1B/day; egress dominated by CDN'],
    ], 'Estimates'),
    diagram(`
POST /v1/videos            -> { videoId, uploadUrl (pre-signed, multipart) }
GET  /v1/videos/{id}       -> { title, status, manifestUrl }
GET  <cdn>/{id}/master.m3u8 -> renditions -> segment files (2-6 s each)

videos(video_id, owner_id, title, status, duration, created_at)   -- SQL
video_stats(video_id, views, likes)                               -- counters, async
`, 'API and data model'),
    diagram(`
Upload: Client -> pre-signed URL -> Object storage (raw)
              -> event -> Transcode orchestrator
                   -> split into chunks -> worker pool (parallel transcode to 240p..4K, HLS/DASH)
                   -> output segments + manifests -> Object storage -> CDN
                   -> status READY in metadata DB

Watch:  Player -> API (metadata, manifest URL) -> CDN edge -> (miss) origin storage
        Player picks bitrate per segment based on measured bandwidth (ABR)
`, 'Architecture'),
    list([
      "Chunked parallel transcoding as a DAG: split, transcode chunks, merge manifests. Retries per chunk.",
      "Adaptive bitrate: HLS/DASH manifests list renditions; the player switches between segments.",
      "CDN strategy: popular videos pushed to edges; long tail served from regional caches or origin.",
      "View counts: batch increments through a stream, not a DB write per view.",
      "Resumable multipart uploads for large files and flaky mobile networks.",
    ], 'Deep dives'),
    key("Upload direct to storage, transcode async in parallel chunks, stream segments via CDN with adaptive bitrate."),
    warn("Serving video bytes from application servers or storing video in a database."),
    drill("15 minutes: sketch the transcoding pipeline as a DAG with failure handling. Then answer: how would you cut storage costs for videos with near-zero views?"),
  ],
});

S.push({
  id: 'design-uber',
  title: 'Design: Uber / ride matching',
  summary: 'Driver location ingestion, geo-indexing, matching, and trip state.',
  tags: ['uber', 'ride sharing', 'design', 'geohash', 'quadtree', 'h3', 'location', 'matching'],
  blocks: [
    t("Riders request a trip; the system finds nearby available drivers and matches one. The hard parts are high-volume location updates and fast nearby-driver queries."),
    list([
      "Functional: drivers send location, rider requests ride, match to nearby driver, track trip live, fare and payment.",
      "Non-functional: match within seconds, location freshness ~5 s, a driver is never assigned two trips (consistency).",
    ], 'Requirements'),
    table(['Quantity', 'Estimate'], [
      ['Active drivers', '5M, update every 4 s -> ~1.2M location writes/s'],
      ['Ride requests', '20M/day -> ~250/s, peaks ~2k/s'],
      ['Location payload', '~100 B -> ~120 MB/s ingest'],
    ], 'Estimates'),
    diagram(`
WS/UDP  driver -> { driverId, lat, lng, ts, status }
POST /v1/rides { pickup, dropoff } -> { rideId, status: MATCHING }
WS      rider <- { driver, eta, location updates }

driver_locations: in-memory geo index (Redis GEO / H3 cell -> driver set), TTL per driver
rides(ride_id, rider_id, driver_id, status, pickup, dropoff, fare, ts)  -- SQL, sharded by city
`, 'API and data model'),
    diagram(`
Driver app -> Location gateway -> Kafka -> Location service -> Geo index (sharded by city/cell)
                                         +-> trip tracking, analytics

Rider app -> Ride service -> Matching service:
                 1. find drivers in pickup cell + neighbor cells
                 2. rank by ETA (routing service), rating
                 3. offer to best driver (atomic claim: status AVAILABLE -> OFFERED)
                 4. accept -> ride ASSIGNED; timeout -> next driver
`, 'Architecture'),
    table(['Geo index', 'How', 'Notes'], [
      ['Geohash', 'Encode lat/lng into a string prefix grid', 'Nearby = same prefix + 8 neighbors; edge effects'],
      ['Quadtree', 'Split regions until each has < K points', 'Adapts to density; harder to update at high rates'],
      ['H3 hexagons', 'Hierarchical hex cells', 'Uniform neighbor distance; used by Uber'],
    ], 'Deep dive: geo-indexing'),
    list([
      "Location data is ephemeral: keep latest position in memory, not a DB row update per ping.",
      "Shard the geo index by city/region; most queries are local.",
      "Prevent double assignment with an atomic compare-and-set on driver status (Redis or DB).",
      "Surge pricing: supply/demand ratio per cell computed from the stream.",
    ], 'Talking points'),
    key("In-memory geo index of cells -> drivers, fed by a location stream, plus an atomic driver claim during matching."),
    warn("Writing every location ping to a relational DB and querying with lat/lng range scans."),
    drill("15 minutes: explain how 'find drivers within 2 km' works with geohash including neighbor cells. Then answer: what happens if two ride requests pick the same driver at the same moment?"),
  ],
});

S.push({
  id: 'design-distributed-cache',
  title: 'Design: Distributed cache',
  summary: 'Partitioning, replication, eviction, and client routing for a Redis-like cluster.',
  tags: ['distributed cache', 'design', 'redis', 'memcached', 'consistent hashing', 'replication'],
  blocks: [
    t("Build a shared in-memory key-value cache across many nodes. It must scale by adding nodes, survive node failures, and keep latency under a millisecond."),
    list([
      "Functional: get, set with TTL, delete; optional atomic increment.",
      "Non-functional: sub-ms p99, millions of ops/s, high availability, losing some cached data is acceptable.",
    ], 'Requirements'),
    table(['Quantity', 'Estimate'], [
      ['Throughput', '5M ops/s; ~100k ops/s per node -> ~50 primaries'],
      ['Data', '10 TB hot set -> ~64-128 GB RAM per node -> ~100+ nodes with replicas'],
    ], 'Estimates'),
    diagram(`
Client library (knows ring/slot map)
    |  hash(key) -> slot -> node
    v
+--------+   +--------+   +--------+
| Node A |   | Node B |   | Node C |   each: hash table + LRU + TTL
| + rep  |   | + rep  |   | + rep  |   async replica per primary
+--------+   +--------+   +--------+
        Config service / gossip: membership, slot ownership, failover
`, 'Architecture'),
    list([
      "Partitioning: consistent hashing with virtual nodes, or fixed hash slots (Redis uses 16384) mapped to nodes.",
      "Routing: smart client with a cached slot map, or a proxy layer (simpler clients, extra hop).",
      "Replication: async primary-replica; on primary failure, promote a replica (may lose last writes).",
      "Eviction: approximate LRU per node; TTL via lazy check + periodic sampling.",
      "Hot keys: replicate hot keys to several nodes, or a small local cache in clients.",
      "Rebalancing: migrate slots gradually while serving, with redirects for moved keys.",
    ], 'Deep dives'),
    key("Hash slots or a ring for partitioning, async replicas for availability, and the cache is never the source of truth."),
    warn("Treating the cache as durable storage. It must be rebuildable from the database."),
    drill("15 minutes: describe what happens step by step when a node dies: detection, failover, client map update, and the cold-cache load on the DB. How do you soften that load spike?"),
  ],
});

S.push({
  id: 'design-web-crawler',
  title: 'Design: Web crawler',
  summary: 'URL frontier, politeness, dedup, and distributed fetching at scale.',
  tags: ['web crawler', 'design', 'frontier', 'politeness', 'bloom filter', 'dedup', 'robots.txt'],
  blocks: [
    t("Start from seed URLs, fetch pages, extract links, and repeat. At web scale the hard parts are being polite to sites, not re-crawling duplicates, and keeping the pipeline flowing."),
    list([
      "Functional: crawl from seeds, respect robots.txt, store page content, extract links, recrawl based on freshness.",
      "Non-functional: billions of pages, polite per host, robust to bad HTML and traps, scalable workers.",
    ], 'Requirements'),
    table(['Quantity', 'Estimate'], [
      ['Pages', '1B pages/month -> ~400 pages/s'],
      ['Storage', '1B x 100 KB -> ~100 TB/month compressed less'],
      ['Seen-URL set', '10B URLs; Bloom filter ~10-20 GB at 1% false positives'],
    ], 'Estimates'),
    diagram(`
Seeds -> URL Frontier (priority queues -> per-host queues)
            |
            v
  Fetcher workers (DNS cache, robots.txt cache, per-host rate limit)
            |
            v
  Content store (object storage, keyed by URL hash)  + content hash dedup
            |
            v
  Parser -> link extractor -> URL normalizer -> seen-URL filter (Bloom + DB) -> Frontier
`, 'Architecture'),
    list([
      "Frontier: front queues by priority (PageRank, freshness), back queues one per host so each host gets at most 1 request per N seconds.",
      "Politeness: robots.txt cached per host, crawl-delay honored, identify with a user agent.",
      "Dedup URLs: normalize (lowercase host, strip fragments and tracking params), then Bloom filter + persistent set.",
      "Dedup content: hash or SimHash to catch mirrors and near duplicates.",
      "Traps: cap depth and URLs per host, detect infinite calendars and session-ID URLs.",
      "Distribution: partition the frontier by host hash so one worker owns a host (politeness stays local).",
    ], 'Deep dives'),
    key("Per-host back queues give politeness for free. Partition work by host."),
    warn("A single global FIFO frontier. It hammers one site with thousands of requests in a row."),
    drill("15 minutes: draw the frontier with front and back queues, then answer: how do you recrawl news sites every hour but static docs monthly?"),
  ],
});

S.push({
  id: 'design-typeahead',
  title: 'Design: Typeahead / autocomplete',
  summary: 'Top-K suggestions per prefix with a trie, precomputation, and caching.',
  tags: ['typeahead', 'autocomplete', 'design', 'trie', 'top-k', 'search suggestions'],
  blocks: [
    t("As the user types, return the top 5-10 completions for the prefix. Every keystroke is a request, so latency must be tiny. Suggestions come from query popularity, updated periodically."),
    list([
      "Functional: top-K suggestions per prefix, ranked by popularity (optionally personalized, trending).",
      "Non-functional: < 50-100 ms end to end, very high QPS, freshness of minutes to hours is fine.",
    ], 'Requirements'),
    table(['Quantity', 'Estimate'], [
      ['Searches', '5B/day, ~6 keystrokes each -> 30B requests/day -> ~350k QPS'],
      ['Distinct queries tracked', '~1B, top ~100M kept in the trie'],
    ], 'Estimates'),
    diagram(`
GET /v1/suggest?q=new%20yo&limit=8 -> ["new york", "new york times", ...]

Trie node: children map + precomputed topK [(query, score)]
Query log -> aggregated counts (query, count, window)
`, 'API and data model'),
    diagram(`
Online:  Client (debounce ~100 ms, local cache) -> CDN/edge cache for short prefixes
           -> Suggest service -> in-memory trie (replicated, sharded by prefix range)

Offline: Search logs -> Kafka -> stream/batch aggregation (counts with time decay)
           -> build new trie with topK per node -> snapshot to storage -> services hot-swap
`, 'Architecture'),
    list([
      "Store top-K at every trie node: lookup is O(prefix length), no subtree walk at query time.",
      "Shard by prefix (a-c, d-f...) or by hash of first 2-3 chars; replicate for read load.",
      "Build offline and swap atomically; trending terms via a smaller real-time layer merged in.",
      "Cache 1-2 character prefixes aggressively; they are a tiny set with huge traffic.",
      "Filter offensive terms at build time.",
    ], 'Deep dives'),
    key("Precompute top-K per node offline; serving is just a trie walk plus a cached list."),
    warn("Updating trie counts on every search in the serving path. Aggregate offline and rebuild."),
    drill("15 minutes: build a tiny trie on paper for queries {car: 50, cat: 30, cart: 40, care: 10} with top-2 per node. Then answer: how do you add personalized suggestions without a trie per user?"),
  ],
});

S.push({
  id: 'design-payments',
  title: 'Design: Payment system basics',
  summary: 'Idempotent payment flow, ledger, PSP integration, and reconciliation.',
  tags: ['payments', 'design', 'idempotency', 'ledger', 'double entry', 'reconciliation', 'psp'],
  blocks: [
    t("Move money correctly, exactly once, with a full audit trail. Correctness beats latency here. Most of the design is about idempotency, state machines, and reconciliation."),
    list([
      "Functional: charge a customer for an order via a payment provider (PSP), refunds, payment status, merchant payouts.",
      "Non-functional: no double charges, no lost payments, strong consistency for the ledger, full auditability.",
    ], 'Requirements'),
    table(['Quantity', 'Estimate'], [
      ['Payments', '10M/day -> ~120/s, peak ~1k/s'],
      ['Note', 'Low QPS; complexity is correctness, not scale'],
    ], 'Estimates'),
    diagram(`
POST /v1/payments  Idempotency-Key: <uuid>  { orderId, amount, currency, method }
     -> 201 { paymentId, status: PENDING|SUCCEEDED|FAILED }
GET  /v1/payments/{id}
POST /v1/payments/{id}/refunds  Idempotency-Key: <uuid>

payments(payment_id, idem_key UNIQUE, order_id, amount, currency, status, psp_ref, version)
ledger_entries(entry_id, txn_id, account_id, debit, credit, created_at)  -- append-only
`, 'API and data model'),
    diagram(`
Client -> Payment service
            1. insert payment (idem_key unique) status=CREATED   [same key -> return stored result]
            2. call PSP with our payment_id as PSP idempotency key (timeout + retry)
            3. update status SUCCEEDED/FAILED (state machine, version check)
            4. write double-entry ledger rows in the same DB transaction
            5. outbox event -> order service, notifications
PSP webhook -> verify signature -> same state transition (idempotent)
Nightly: reconciliation job compares PSP settlement files vs ledger -> flag mismatches
`, 'Architecture'),
    list([
      "Idempotency at every hop: client key -> our DB unique constraint -> PSP idempotency key.",
      "Payment state machine: CREATED -> PROCESSING -> SUCCEEDED | FAILED, refunds as separate records.",
      "Unknown outcome (timeout): never blindly re-charge; query PSP status or wait for the webhook.",
      "Double-entry ledger: every transaction has debits = credits; balances are derived, entries never updated.",
      "Amounts as integer minor units + currency code.",
      "Reconciliation catches what all the above miss.",
    ], 'Deep dives'),
    key("**Idempotency keys + state machine + append-only double-entry ledger + reconciliation.** Say all four."),
    warn("Retrying a timed-out charge with a new request ID. That is how customers get charged twice."),
    qa([
      ["PSP charged the card but our service crashed before saving?", "On restart, payments stuck in PROCESSING are resolved by querying the PSP by our payment_id or by the webhook. Reconciliation is the final safety net."],
    ]),
    drill("15 minutes: draw the payment state machine and mark which transitions come from API calls, PSP responses, and webhooks. Then walk through a timeout on step 2."),
  ],
});

S.push({
  id: 'design-ticketmaster',
  title: 'Design: Ticketmaster-style booking',
  summary: 'Seat inventory under extreme contention, holds with expiry, and virtual queues.',
  tags: ['ticketmaster', 'booking', 'design', 'concurrency', 'seat hold', 'virtual queue', 'locking'],
  blocks: [
    t("Users browse events, pick seats, hold them briefly, and pay. A hot concert puts millions of users on a few thousand seats at once. No seat may ever be sold twice."),
    list([
      "Functional: browse/search events, view seat map, hold seats (~10 min), pay to confirm, release on expiry.",
      "Non-functional: strong consistency for seat ownership, high availability for browsing, survive 10M+ users at on-sale.",
    ], 'Requirements'),
    table(['Quantity', 'Estimate'], [
      ['Hot event', '50k seats, 5M users arriving in minutes'],
      ['Browse', 'Read heavy, cacheable seat map (seconds stale is OK)'],
      ['Bookings', 'Bounded by seats: ~50k successful holds, many failed attempts'],
    ], 'Estimates'),
    diagram(`
GET  /v1/events/{id}/seats            -> seat map (cached, slightly stale)
POST /v1/events/{id}/holds  { seatIds }    -> 201 { holdId, expiresAt } | 409 conflict
POST /v1/holds/{holdId}/purchase  Idempotency-Key -> { bookingId }

seats(event_id, seat_id, status, hold_id, hold_expires_at, booking_id, version)  -- SQL
bookings(booking_id, user_id, event_id, seat_ids, amount, status)
`, 'API and data model'),
    diagram(`
Users -> CDN (event pages) -> Virtual waiting room (token, admits N users/min)
            |
            v
  Booking service -> hold: UPDATE seats SET status='HELD', hold_id=?, hold_expires_at=now+10m
                           WHERE event_id=? AND seat_id IN (...) AND (status='AVAILABLE'
                           OR (status='HELD' AND hold_expires_at < now))
                     -> check rows updated == seats requested, else rollback (409)
                  -> purchase: payment (idempotent) -> status='BOOKED'
  Expiry sweeper releases stale holds; seat map cache updated via events
`, 'Architecture'),
    table(['Hold mechanism', 'Pro', 'Con'], [
      ['DB conditional update (row locks)', 'Strong, simple, transactional', 'DB contention on hot events'],
      ['Optimistic locking (version column)', 'No long locks', 'Many retries under heavy contention'],
      ['Redis SET NX with TTL per seat', 'Very fast, auto-expiry', 'Must sync with DB as source of truth'],
    ], 'Deep dive: preventing double booking'),
    list([
      "Virtual waiting room smooths the spike and gives a fair order.",
      "Partition by event so one hot event cannot starve others; dedicated capacity for the hot event.",
      "Seat map served from cache; conflicts are caught at hold time, not at browse time.",
      "Payment must succeed before hold expiry; extend or fail gracefully.",
      "Bot defense: rate limits per account/device, purchase limits per user.",
    ], 'Talking points'),
    key("All-or-nothing conditional update on seat rows is the correctness core. The waiting room is the scale core."),
    warn("Checking availability in one query and booking in another without a lock or condition. Classic double booking."),
    drill("20 minutes: design on-sale for a 50k-seat stadium with 5M users. Explain the waiting room admission rate you would choose and why, and walk through two users racing for the same seat."),
  ],
});

export default {
  key: 'hld',
  label: 'HLD',
  intro: 'High-level system design: a timed interview framework, estimation, the core building blocks (caching, sharding, queues, consistency), and 12 classic designs with estimates, APIs, and trade-offs.',
  sections: S,
};
