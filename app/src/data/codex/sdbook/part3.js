// SD Book Notes, chapters 15-21. Shape: ../schema.js; helpers: ./h.js.
import { t, list, steps, table, java, text, key, warn, tip, drill, qa, flow, src } from './h.js';

const S = [];

// ---------------------------------------------------------------- ch 15

S.push({
  id: 'ch15-google-drive',
  title: 'Ch 15 · Google Drive',
  summary: 'Cloud file storage with sync. Split files into 4 MB hashed blocks, upload only changed blocks, keep metadata strongly consistent.',
  tags: ['google drive', 'dropbox', 'file sync', 'delta sync', 'block server', 'long polling', 's3', 'deduplication', 'vol 1'],
  source: src('15. Google Drive'),
  blocks: [
    t("Google Drive is a **library that only photocopies the pages you changed**. Every file is cut into blocks of up to 4 MB, each block gets a hash, and a sync sends just the blocks whose hash changed. The hard parts are reliability (losing a file is unacceptable), fast sync, and saving bandwidth for 10M daily users."),
    flow([
      ['user:Desktop / mobile client'],
      ['Block servers', 'lb:Load balancer'],
      ['store:Cloud storage (S3)', 'API servers'],
      ['store:Cold storage', 'db:Metadata DB + cache'],
    ], 'Main architecture', ['blocks  /  metadata calls', 'store blocks  /  read-write', 'old files  /  '], 'Block servers chunk, compress and encrypt. API servers handle auth, file metadata and everything that is not raw bytes. A notification service plus an offline backup queue tell other clients that something changed.'),
    key("Three things: (1) **blocks + hashes** make delta sync and dedupe possible. (2) Metadata needs **strong consistency**, so use a relational DB with ACID. (3) Clients learn about changes through **long polling** on a notification service."),
    list([
      "10M DAU, 50M signed up, 10 GB free each: about **500 PB** total.",
      "2 uploads per user per day, average file 500 KB.",
      "Upload QPS = 10M × 2 / 86,400 ≈ **240**, peak ≈ 480.",
      "Max file size 10 GB, so uploads must be **resumable**.",
    ], 'Numbers to say out loud'),
    flow([
      ['user:Client 1'],
      ['API servers', 'Block servers'],
      ['db:Metadata: status = pending', 'store:S3'],
      ['API servers'],
      ['db:Metadata: status = uploaded', 'Notification service'],
      ['user:Client 2'],
    ], 'Upload flow (two paths run in parallel)', ['add metadata  /  upload file', 'write row  /  store blocks', 'S3 completion callback', 'update  /  notify', 'file changed'], 'The file only becomes visible to others after S3 confirms the blocks landed.'),
    flow([
      ['Notification service', 'q:Offline backup queue'],
      ['user:Client 2'],
      ['API servers'],
      ['Block servers'],
      ['store:S3'],
    ], 'Download flow', ['online push  /  replay on reconnect', 'get changed metadata', 'fetch new blocks', 'read blocks'], 'The client rebuilds the file by joining its blocks in order.'),
    text(`
Delta sync: file v1 and v2 are split into blocks, only changed hashes move.

  v1:  [b1:a3f] [b2:91c] [b3:7de] [b4:0b2]
  v2:  [b1:a3f] [b2:5e8] [b3:7de] [b4:c41]
                   ^^^              ^^^
  upload only b2 and b4  (2 of 4 blocks, about 8 MB, not the whole file)

Dedupe: two blocks with the same hash are stored once per account.`, 'Picture: delta sync'),
    steps([
      "Clarify: upload, download, sync, share, revisions, notifications. Mobile and web. 10M DAU.",
      "Start with one server: web server + metadata DB + a `drive/` folder with one namespace per user.",
      "Move file bytes to S3 with cross-region replication. Shard metadata, add a load balancer.",
      "Split out **block servers**: chunk to 4 MB, hash, compress, encrypt, upload to S3.",
      "Metadata DB tables: user, workspace, file, file_version, block. Cache hot rows.",
      "Notification service with long polling. Offline backup queue for clients that are away.",
      "Conflicts: first write wins. The loser gets both copies and chooses merge or overwrite.",
    ], 'HLD in 7 steps'),
    table(['Choice', 'Option A', 'Option B', 'Book picks'], [
      ['Upload API', 'Simple upload (small files)', 'Resumable upload (get session URL, send chunks, resume)', 'Both; resumable for big files'],
      ['Change notification', 'Long polling: one-way, cheap, works for rare events', 'WebSocket: two-way, built for chat-like traffic', 'Long polling'],
      ['Metadata store', 'Relational: ACID, strong consistency', 'NoSQL: scales easily, no ACID by default', 'Relational'],
      ['Old versions', 'Keep every revision', 'Cap count, weight recent ones, move cold to Glacier', 'Cap + cold storage'],
    ], 'Key trade-offs'),
    table(['What fails', 'Recovery'], [
      ['Load balancer', 'Secondary takes over (heartbeat detects it).'],
      ['Block server', 'Other servers pick up the pending jobs.'],
      ['Cloud storage', 'Read from the replica in another region.'],
      ['Metadata master', 'Promote a replica to master.'],
      ['Notification server', 'Clients lose the long-poll connection and reconnect to another server.'],
    ], 'Failure handling'),
    java(`
// LLD core: chunk a file, hash each block, upload only blocks the server lacks.
class BlockSync {
    static final int BLOCK = 4 * 1024 * 1024;   // 4 MB max block

    record Block(int index, String hash, byte[] data) {}

    static List<Block> chunk(InputStream in) throws Exception {
        List<Block> out = new ArrayList<>();
        byte[] buf = new byte[BLOCK];
        int idx = 0, n;
        while ((n = in.readNBytes(buf, 0, BLOCK)) > 0) {
            byte[] data = Arrays.copyOf(buf, n);
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            out.add(new Block(idx++, HexFormat.of().formatHex(sha.digest(data)), data));
        }
        return out;
    }

    // serverHashes = block hashes of the latest version the server has, in order
    static List<Block> delta(List<Block> local, List<String> serverHashes, Set<String> knownHashes) {
        List<Block> toUpload = new ArrayList<>();
        for (Block b : local) {
            boolean samePlace = b.index() < serverHashes.size() && serverHashes.get(b.index()).equals(b.hash());
            boolean dedupe = knownHashes.contains(b.hash());   // same bytes already stored
            if (!samePlace && !dedupe) toUpload.add(b);
        }
        return toUpload;   // then send the full ordered hash list as the new file_version
    }
}`, 'LLD: block-level delta sync'),
    warn("The new version's metadata must list **every** block hash in order, not just the uploaded ones. Unchanged blocks are referenced, not re-sent. Forget this and the rebuilt file has holes."),
    warn("Metadata cache and DB must agree. On every metadata write, **invalidate the cache entry** first, or a client can sync to a stale version."),
    tip("Compression depends on file type: gzip/bzip2 for text, special codecs for images and video. Encryption happens on the block server before S3."),
    qa([
      ["Why split files into blocks?", "Small edits re-upload one 4 MB block, not a 10 GB file. Blocks also enable dedupe by hash and parallel, resumable uploads."],
      ["Two users edit the same file at once. What happens?", "The first write processed wins. The second gets a sync conflict and sees both copies, then merges or picks one."],
      ["Why long polling, not WebSocket?", "Changes are rare and only flow server to client. Long polling is simpler and cheap enough. WebSocket suits two-way chat traffic."],
      ["How do you cut storage cost?", "Dedupe blocks by hash, cap kept revisions, and move files untouched for months to cold storage like S3 Glacier."],
    ]),
    drill("5 minutes: draw the main architecture from memory with the notification service and offline queue. Then walk the upload flow and say exactly when the status flips from `pending` to `uploaded`."),
  ],
});

// ---------------------------------------------------------------- ch 16

S.push({
  id: 'ch16-proximity-service',
  title: 'Ch 16 · Proximity Service',
  summary: 'Find businesses near a point (Yelp). Turn 2D lat/lng into a 1D geohash, search the cell plus 8 neighbors, cache by geohash.',
  tags: ['proximity', 'yelp', 'geohash', 'quadtree', 'google s2', 'geospatial index', 'lbs', 'nearby search', 'vol 2'],
  source: src('16. Proximity Service'),
  blocks: [
    t("A proximity service is a **city split into labeled squares**. To find restaurants near you, look up your square and the 8 around it, instead of measuring the distance to all 200M businesses. The trick is turning a 2D location into a 1D key that a normal index can search."),
    flow([
      ['user:Client'],
      ['lb:Load balancer'],
      ['Location-based service (LBS)', 'Business service'],
      ['cache:Redis: geohash → ids', 'cache:Redis: id → business'],
      ['db:DB replicas', 'db:DB primary'],
    ], 'Main architecture', ['', '/search/nearby  /  /businesses', 'read  /  read-write', 'cache miss  /  write'], 'LBS is read-only, stateless and hot at peak. Business service handles owner edits (rare, not real time) and detail views.'),
    key("**Index the 2D map as 1D keys.** Geohash: longer shared prefix = closer. Always search the **cell plus its 8 neighbors** to beat edge cases. Cache by geohash, not raw lat/lng."),
    list([
      "100M DAU, 200M businesses.",
      "5 searches per user per day: 100M × 5 / 86,400 ≈ **5,000 search QPS**.",
      "Business edits apply the next day (nightly batch), so replica lag is fine.",
      "Quadtree of 200M businesses (≤100 per leaf) ≈ **2 GB RAM**: fits on one server.",
    ], 'Numbers to say out loud'),
    text(`
Geohash: split the world in half again and again, alternating lng / lat bits.

  lng bit 0 = west, 1 = east   lat bit 0 = south, 1 = north
  every 5 bits -> one base32 char   (0-9, b-z without a i l o)

  length  cell size          use for radius
    4     39 km x 19.5 km     20 km
    5     4.9 km x 4.9 km     1-2 km
    6     1.2 km x 0.6 km     0.5 km

  Search 9 cells at the chosen length:
     +--------+--------+--------+
     | 9q8yyz | 9q9p8b | 9q9p8c |
     +--------+--------+--------+
     | 9q8yyx | 9q9p80 | 9q9p81 |   <- you are in the middle cell
     +--------+--------+--------+
     | 9q8yyr | 9q9p2p | 9q9p2q |
     +--------+--------+--------+
  Two neighbors can share no prefix at all (other side of a big boundary).`, 'Picture: geohash cells and neighbors'),
    text(`
Quadtree: split a square into 4 until each leaf holds <= 100 businesses.

               [World: 200M]
          /       |       |       \\
       [NW]     [NE]    [SW]     [SE]
      /  |  \\ \\   ...   (dense city)  sparse ocean stays one big leaf
   [..] [..] [..] [..]  -> leaves small in Manhattan, huge in the desert

  Built in memory on every LBS server at startup (n log n, a few minutes).`, 'Picture: quadtree'),
    flow([
      ['user:Client (lat, lng, 500 m)'],
      ['lb:Load balancer'],
      ['LBS: radius → length 6, compute 9 cells'],
      ['cache:Geohash Redis (9 parallel reads)'],
      ['cache:Business info Redis'],
      ['user:Results sorted by distance'],
    ], 'Search path', ['', '', 'business ids per cell', 'details', 'filter + rank']),
    flow([
      ['user:Business owner'],
      ['Business service'],
      ['db:DB primary'],
      ['db:Read replicas', 'Nightly job'],
      ['cache:Refresh geohash + business caches'],
    ], 'Write path (not real time)', ['POST / PUT / DELETE', 'write', 'replicate  /  batch read', 'rebuild'], 'Owners expect changes to show up the next day, which keeps the read path simple.'),
    steps([
      "Clarify: radius search, max radius 20 km, business edits not real time, 5k QPS.",
      "APIs: `GET /v1/search/nearby?lat&lng&radius`, CRUD on `/v1/businesses/{id}`.",
      "Split into LBS (read-only search) and business service (CRUD + details).",
      "Pick the index: geohash table `(geohash, business_id)` or an in-memory quadtree.",
      "Pick geohash length from the radius. Compute the 9 cells. Read ids from Redis in parallel.",
      "Load business details from the second Redis, filter by real distance, sort, page.",
      "Scale: shard the business table by id; geohash table fits one box, so add read replicas, not shards. Deploy per region.",
    ], 'HLD in 7 steps'),
    table(['Index', 'How it works', 'Good', 'Bad'], [
      ['Even grid', 'Fixed-size squares', 'Trivial', 'Cities overloaded, oceans empty'],
      ['Geohash', 'Recursive halving to a base32 string', 'Simple, easy updates, plain DB index', 'Fixed cell size; boundary cases need neighbors'],
      ['Quadtree', 'In-memory tree, split until ≤100 per leaf', 'Adapts to density; k-nearest queries', 'Rebuild on deploy; updates need locking'],
      ['Google S2', 'Sphere mapped to a Hilbert curve', 'Geofencing, region cover with min/max level', 'Hard to explain and implement'],
    ], 'Geohash vs quadtree vs S2'),
    table(['Cache key', 'Value', 'Why'], [
      ['`geohash` (length 4, 5, 6)', 'List of business ids in that cell', 'Raw lat/lng changes with every step and GPS noise'],
      ['`business_id`', 'Name, address, rating, hours', 'Detail page and result rendering'],
    ], 'Two Redis caches'),
    java(`
// LLD core: geohash encode + 9-cell neighbor search with real distance filter.
class Geohash {
    static final String BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

    static String encode(double lat, double lng, int len) {
        double[] la = {-90, 90}, lo = {-180, 180};
        StringBuilder sb = new StringBuilder();
        boolean lngBit = true;              // bits alternate, longitude first
        int bits = 0, ch = 0;
        while (sb.length() < len) {
            double[] r = lngBit ? lo : la;
            double v = lngBit ? lng : lat;
            double mid = (r[0] + r[1]) / 2;
            ch <<= 1;
            if (v >= mid) { ch |= 1; r[0] = mid; } else { r[1] = mid; }
            lngBit = !lngBit;
            if (++bits == 5) { sb.append(BASE32.charAt(ch)); bits = 0; ch = 0; }
        }
        return sb.toString();
    }

    // cell height and width in degrees for a geohash of this length
    static double[] cellSize(int len) {
        int total = len * 5, lngBits = (total + 1) / 2, latBits = total / 2;
        return new double[] { 180 / Math.pow(2, latBits), 360 / Math.pow(2, lngBits) };
    }

    // my cell + 8 neighbors: step exactly one cell in each direction and re-encode
    static Set<String> nineCells(double lat, double lng, int len) {
        double[] d = cellSize(len);
        Set<String> out = new LinkedHashSet<>();
        for (int dy = -1; dy <= 1; dy++)
            for (int dx = -1; dx <= 1; dx++) {
                double a = Math.max(-90, Math.min(89.999999, lat + dy * d[0]));
                double b = lng + dx * d[1];
                if (b >= 180) b -= 360;
                if (b < -180) b += 360;
                out.add(encode(a, b, len));
            }
        return out;
    }
}

class NearbySearch {
    record Biz(long id, double lat, double lng) {}
    private final Map<String, List<Biz>> index;   // geohash(len) -> businesses (Redis in prod)
    private final int len;
    NearbySearch(Map<String, List<Biz>> index, int len) { this.index = index; this.len = len; }

    List<Biz> search(double lat, double lng, double radiusM) {
        List<Biz> hits = new ArrayList<>();
        for (String cell : Geohash.nineCells(lat, lng, len))
            for (Biz b : index.getOrDefault(cell, List.of()))
                if (Geo.haversineM(lat, lng, b.lat(), b.lng()) <= radiusM) hits.add(b);
        hits.sort(Comparator.comparingDouble(b -> Geo.haversineM(lat, lng, b.lat(), b.lng())));
        return hits;
    }
}

class Geo {
    static double haversineM(double lat1, double lng1, double lat2, double lng2) {
        double R = 6_371_000, p1 = Math.toRadians(lat1), p2 = Math.toRadians(lat2);
        double dp = p2 - p1, dl = Math.toRadians(lng2 - lng1);
        double h = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
        return 2 * R * Math.asin(Math.sqrt(h));
    }
}`, 'LLD: geohash encode + neighbor search'),
    warn("A shared prefix means close, but close does **not** mean shared prefix. Two shops 10 m apart can sit on opposite sides of the equator or meridian. Searching only your own cell misses them."),
    warn("Not enough results in 9 cells? **Drop one character** (bigger cells) and search again, up to the max radius."),
    tip("Quadtree rollout: a server cannot serve while it builds the tree (minutes). Deploy to a small slice of servers at a time, blue/green style."),
    qa([
      ["Why not a SQL range query on lat and lng?", "An index helps on one column only. You get a huge latitude strip and a huge longitude strip and must intersect them. Geohash makes it one prefix lookup."],
      ["Geohash or quadtree?", "Geohash for fixed-radius search and easy updates. Quadtree when density varies a lot or you need k-nearest (closest gas station)."],
      ["Should you shard the geohash table?", "No. It is small (a few GB) and read-only. Read replicas spread the 5k QPS. Shard the business table by id instead."],
      ["How do business edits show up?", "Saved to the primary right away, then a nightly job refreshes the index and caches. The requirement says next-day is fine."],
    ]),
    drill("5 minutes: encode a point to 6 geohash chars by hand for 2 rounds of bits, say which radius maps to lengths 4, 5, 6, and draw the 9-cell search. Then argue geohash vs quadtree in two sentences each."),
  ],
});

// ---------------------------------------------------------------- ch 17

S.push({
  id: 'ch17-nearby-friends',
  title: 'Ch 17 · Nearby Friends',
  summary: 'Show friends within 5 miles, updated every 30 s. WebSocket servers + Redis location cache with TTL + one Redis pub/sub channel per user.',
  tags: ['nearby friends', 'websocket', 'redis pub/sub', 'location cache', 'ttl', 'fan-out', 'haversine', 'vol 2'],
  source: src('17. Nearby Friends'),
  blocks: [
    t("Nearby friends is a **walkie-talkie channel for every user**. Your phone broadcasts your location on your channel every 30 seconds, and your friends' servers are tuned in. Unlike proximity search, here **every point moves**, so the core problem is fan-out, not indexing."),
    flow([
      ['user:Mobile client'],
      ['lb:Load balancer'],
      ['WebSocket servers', 'API servers'],
      ['cache:Redis location cache (TTL)', 'q:Redis pub/sub', 'db:Location history (Cassandra)', 'db:User + friends DB'],
    ], 'Main architecture', ['', 'WS (stateful)  /  HTTP', 'save, publish, subscribe  /  friends + profile'], 'WebSocket servers hold one long-lived connection per active user and do the distance math. API servers handle friends and profile CRUD.'),
    key("**One pub/sub channel per user.** Your WS server publishes to your channel; servers of your online friends subscribe and forward only if the friend is within 5 miles. Location cache entries have a **TTL**: expiry means you went inactive."),
    list([
      "1B users, 10% use the feature: 100M DAU; 10% concurrent = **10M** online.",
      "Update every 30 s: 10M / 30 ≈ **334k updates/s**.",
      "400 friends each, 10% online: about **40 pushes per update**.",
      "334k × 40 ≈ **14M pushes/s**. At 100k pushes per Redis node: about **140 pub/sub nodes**.",
    ], 'Numbers to say out loud'),
    flow([
      ['user:User 1'],
      ['User 1 WS server'],
      ['q:Channel: user 1'],
      ['Friend WS servers (users 2, 3, 4)'],
      ['user:Users 2, 3, 4'],
    ], 'Periodic location update', ['1. location', '2. publish', '3. subscribers get it', '4. if within 5 mi, push'], 'Before publishing, User 1\'s WS server also writes the history DB and updates the location cache (and its own in-memory copy).'),
    flow([
      ['user:Client connects'],
      ['WebSocket server'],
      ['db:Friends list', 'cache:Location cache'],
      ['q:Subscribe to each friend channel'],
      ['user:Client: initial nearby list'],
    ], 'Client initialization', ['', 'load friends  /  their last locations', 'subscribe', 'send nearby friends']),
    text(`
Pub/sub cluster sharded with consistent hashing (ring stored in etcd / ZooKeeper):

        channel "user:42"  --hash-->  ring position  -->  pubsub node p3

        p1 ---- p2 ---- p3 ---- p4 ---- (back to p1)
         ^ every WS server caches this ring in memory

  Add a node: only channels between the new node and its neighbor move.
  Moved channels -> WS servers must re-subscribe -> brief update loss (OK here).`, 'Picture: sharding Redis pub/sub'),
    steps([
      "Clarify: 5 mile radius, straight-line distance, update every 30 s, inactive after 10 min, keep history.",
      "Pick transport: WebSocket for two-way, server-initiated pushes.",
      "Draw LB, stateless API servers, stateful WS servers.",
      "Location cache in Redis: `user_id → (lat, lng, ts)` with TTL. History in Cassandra (write heavy).",
      "Redis pub/sub: one channel per user, created up front (idle channels cost almost nothing).",
      "Walk the update path: save, cache, publish, fan out, distance check, push.",
      "Scale: shard pub/sub by consistent hashing, drain WS servers before removing them.",
    ], 'HLD in 7 steps'),
    table(['Component', 'Stateful?', 'How it scales'], [
      ['API servers', 'No', 'Autoscaling group'],
      ['WebSocket servers', 'Yes (open connections)', 'Add freely; mark draining in the LB before removal'],
      ['Location cache', 'Yes, but TTL bounds it', 'Shard Redis by `user_id`'],
      ['Redis pub/sub', 'Yes (subscribers)', 'Consistent hash ring; resize off peak; overprovision'],
      ['User DB', 'Yes', 'Shard by `user_id`; own service'],
    ], 'How each piece scales'),
    table(['Alternative', 'Idea', 'Catch'], [
      ['Random nearby people', 'One channel per geohash; subscribe to your cell (and neighbors)', 'More channels, privacy questions'],
      ['Erlang / OTP', 'Millions of lightweight processes do WS + pub/sub in one runtime', 'Niche language, hard to hire'],
      ['Peer to peer', 'Phones talk directly', 'Flaky mobile networks and battery: impractical'],
    ], 'Variants the interviewer may ask'),
    java(`
// LLD core: WS server side. Publish my location; fan out friends' updates within the radius.
interface PubSub {
    void publish(String channel, Loc loc);
    void subscribe(String channel, Consumer<Loc> listener);
    void unsubscribe(String channel);
}
record Loc(long userId, double lat, double lng, long ts) {}

class NearbyFriendsServer {
    static final double RADIUS_M = 5 * 1609.34;   // 5 miles, configurable
    private final PubSub bus;
    private final Map<Long, Loc> lastLoc = new ConcurrentHashMap<>();          // users on THIS server
    private final Map<Long, Consumer<Loc>> sockets = new ConcurrentHashMap<>(); // userId -> push to phone

    NearbyFriendsServer(PubSub bus) { this.bus = bus; }

    void onConnect(long userId, List<Long> friendIds, Consumer<Loc> socket) {
        sockets.put(userId, socket);
        for (long f : friendIds) bus.subscribe("loc:" + f, loc -> forward(userId, loc));
    }

    void onLocationUpdate(Loc loc, LocationCache cache, HistoryDb history) {
        lastLoc.put(loc.userId(), loc);
        history.append(loc);                       // Cassandra, write heavy
        cache.put(loc.userId(), loc, 600);         // TTL 10 min = inactive after that
        bus.publish("loc:" + loc.userId(), loc);   // my channel
    }

    private void forward(long receiver, Loc friend) {
        Loc me = lastLoc.get(receiver);
        Consumer<Loc> socket = sockets.get(receiver);
        if (me == null || socket == null) return;
        if (Geo.haversineM(me.lat(), me.lng(), friend.lat(), friend.lng()) <= RADIUS_M) socket.accept(friend);
    }
}
interface LocationCache { void put(long userId, Loc loc, int ttlSeconds); }
interface HistoryDb { void append(Loc loc); }`, 'LLD: location update to pub/sub fan-out'),
    warn("The bottleneck is **CPU for 14M pushes per second**, not memory. Pub/sub channels for 100M users fit in about 200 GB (2 big boxes), but you still need ~140 nodes for throughput."),
    warn("Do not filter by distance on the publisher. The publisher does not know where each friend is; the **receiver's** WS server has that friend's latest location in memory."),
    tip("Users with thousands of friends: cap friends (Facebook caps at 5,000). The load spreads because each friend sits on a different WS server."),
    qa([
      ["Why not just poll the location cache every 30 s?", "Each client would read 400 friends every 30 s: billions of reads, mostly wasted. Pub/sub pushes only real changes to only online friends."],
      ["What happens when a friend goes offline?", "Their cache key expires after the TTL; the WS server gets an unsubscribe event and the client drops them from the list."],
      ["How do you add pub/sub nodes safely?", "Consistent hashing so few channels move, do it at the daily traffic low, and accept that some updates are dropped during resubscription."],
      ["Do you need strong consistency?", "No. Location is overwritten every 30 s; a few seconds of replica lag and an occasional lost point are fine."],
    ]),
    drill("5 minutes: derive 334k updates/s and 14M pushes/s from scratch, draw the 4-step update flow, and write `forward()` with the haversine check from memory."),
  ],
});

// ---------------------------------------------------------------- ch 18

S.push({
  id: 'ch18-google-maps',
  title: 'Ch 18 · Google Maps',
  summary: 'Location updates, routing with ETA, and map rendering. Batched GPS into Cassandra + Kafka, A* over routing tiles, precomputed map tiles on a CDN.',
  tags: ['google maps', 'navigation', 'routing tiles', 'a star', 'dijkstra', 'map tiles', 'cdn', 'eta', 'geocoding', 'vol 2'],
  source: src('18. Google Maps'),
  blocks: [
    t("Google Maps is a **jigsaw puzzle of the planet**. The picture you see is pre-cut image tiles served from a CDN, the roads are pre-cut graph tiles that the router loads piece by piece, and your phone keeps reporting its position in batches. Three features matter: location update, navigation with ETA, and map rendering."),
    flow([
      ['user:Mobile client'],
      ['lb:Load balancer', 'ext:CDN'],
      ['Location service', 'Navigation service'],
      ['db:Cassandra: user locations', 'q:Kafka: location stream', 'store:S3: routing tiles'],
    ], 'Main architecture', ['batched GPS, nav  /  map tiles', 'route', 'write  /  stream  /  read tiles'], 'Map tiles never touch app servers: the client computes the tile URL (or asks a tiny API) and pulls it from the nearest CDN edge.'),
    key("Three ideas: (1) **batch GPS on the client** (every 15 s) to cut QPS. (2) The road network is split into **routing tiles at 3 detail levels** so A* loads only what it needs. (3) Map imagery is **precomputed tiles per zoom level on a CDN**."),
    list([
      "1B DAU, 35 min of navigation per user per week ≈ **5B minutes per day**.",
      "GPS every second = 3M QPS; batched every 15 s = **200k QPS**, about 1M at peak.",
      "Zoom 0 is 1 tile of 256×256 for the whole world; each level has **4×** the tiles of the one above.",
      "All map tiles across 21 zoom levels: roughly **100 PB** before compression, about 70 PB stored (deserts and oceans compress well).",
    ], 'Numbers to say out loud'),
    flow([
      ['user:Origin + destination'],
      ['Geocoding service'],
      ['Route planner'],
      ['Shortest path (A* on tiles)', 'ETA service (ML on traffic)'],
      ['Ranker (avoid tolls, highways)'],
      ['user:Best routes + ETA'],
    ], 'Navigation service', ['addresses', 'lat/lng pairs', 'top-k paths  /  times', 'ranked', ''], 'Updater services consume the Kafka location stream to refresh traffic data, ETA models and the routing tiles themselves.'),
    flow([
      ['user:Phone (batch of GPS points)'],
      ['Location service'],
      ['db:Cassandra (key: user_id, ts)', 'q:Kafka'],
      ['Traffic update', 'ETA model training', 'Routing tile update', 'Analytics'],
    ], 'Location update pipeline', ['POST /v1/locations', 'store  /  stream', 'consumers']),
    text(`
Routing tiles: the road graph cut into squares, 3 levels of detail.

  Level 3 (highways only, huge tiles)   [=========== H ===========]
  Level 2 (arterial roads)              [ A ][ A ][ A ][ A ][ A ][ A ]
  Level 1 (all local streets, small)    [l][l][l][l][l][l][l][l][l][l]

  Short trip: stay in level 1 tiles around origin and destination.
  Long trip:  local tiles near both ends, highway tiles in between.
  Each tile = adjacency list (nodes = intersections, edges = roads)
            + references to neighbor tiles, stored as a binary blob in S3.`, 'Picture: hierarchical routing tiles'),
    steps([
      "Clarify: 1B DAU, features = location update, navigation + ETA, map rendering. Support walk, bike, drive.",
      "Map 101: lat/lng, Web Mercator projection, geocoding, tiling.",
      "Location service: client batches GPS, `POST /v1/locations`, Cassandra keyed by `user_id` with `ts` as clustering key, plus Kafka.",
      "Navigation: geocode, A* over routing tiles from S3, ETA from an ML model, ranker applies filters.",
      "Rendering: precomputed tiles per zoom level on a CDN; client derives the tile URL from geohash + zoom.",
      "Deep dive: vector tiles instead of images to save bandwidth.",
      "Adaptive ETA and rerouting: track which tiles each active route uses; push updates over WebSocket.",
    ], 'HLD in 7 steps'),
    table(['Data', 'Store', 'Why'], [
      ['Routing tiles', 'S3 + aggressive cache', 'Read-only binary blobs; no DB features needed'],
      ['User locations', 'Cassandra', 'Huge write volume; availability over consistency'],
      ['Geocoding (address ↔ lat/lng)', 'Redis', 'Many reads, few writes, needs speed'],
      ['Map images', 'CDN (backed by object storage)', 'Static, cacheable, served from the nearest edge'],
    ], 'Where each kind of data lives'),
    table(['Option', 'Good', 'Bad'], [
      ['Raster image tiles', 'Simple client', 'Big downloads; blurry when zooming'],
      ['Vector tiles (paths, polygons)', 'Much smaller; smooth zoom; client renders', 'Client does more work'],
      ['Push: mobile notification', 'Works when app is closed', 'Tiny payload; no web support'],
      ['Push: WebSocket', 'Two-way, cheap per message', 'Stateful servers'],
      ['Push: SSE / long polling', 'Simple', 'One-way; long polling costs more server work'],
    ], 'Rendering and delivery choices'),
    java(`
// LLD core: A* across routing tiles that are loaded lazily from storage.
record Edge(long to, double seconds) {}
record Node(long id, double lat, double lng, String tileId) {}
record Tile(String id, Map<Long, Node> nodes, Map<Long, List<Edge>> adj) {}

class TileRouter {
    static final double MAX_SPEED_MPS = 36;           // ~130 km/h, keeps the heuristic admissible
    private final Function<String, Tile> tileStore;   // S3 + cache in prod
    private final Map<String, Tile> loaded = new HashMap<>();
    private final Map<Long, Node> nodes = new HashMap<>();

    TileRouter(Function<String, Tile> tileStore) { this.tileStore = tileStore; }

    private void ensureTile(String tileId) {
        if (loaded.containsKey(tileId)) return;
        Tile t = tileStore.apply(tileId);
        loaded.put(tileId, t);
        nodes.putAll(t.nodes());
    }

    List<Long> route(Node src, Node dst) {
        ensureTile(src.tileId());
        nodes.put(src.id(), src);
        Map<Long, Double> g = new HashMap<>(Map.of(src.id(), 0.0));
        Map<Long, Long> parent = new HashMap<>();
        PriorityQueue<double[]> open = new PriorityQueue<>(Comparator.comparingDouble(a -> a[0]));
        open.add(new double[] { h(src, dst), src.id() });
        while (!open.isEmpty()) {
            double[] top = open.poll();
            long u = (long) top[1];
            if (u == dst.id()) return path(parent, u);
            Node un = nodes.get(u);
            if (top[0] > g.get(u) + h(un, dst)) continue;   // stale queue entry
            ensureTile(un.tileId());                        // stitch the next tile in on demand
            for (Edge e : loaded.get(un.tileId()).adj().getOrDefault(u, List.of())) {
                double cand = g.get(u) + e.seconds();
                if (cand < g.getOrDefault(e.to(), Double.MAX_VALUE)) {
                    g.put(e.to(), cand);
                    parent.put(e.to(), u);
                    Node vn = nodes.get(e.to());
                    if (vn == null) continue;   // edge points into a tile we have not loaded yet
                    open.add(new double[] { cand + h(vn, dst), e.to() });
                }
            }
        }
        return List.of();
    }

    // straight-line time at top speed never overestimates the real time
    private double h(Node a, Node b) { return Geo.haversineM(a.lat(), a.lng(), b.lat(), b.lng()) / MAX_SPEED_MPS; }

    private List<Long> path(Map<Long, Long> parent, long end) {
        LinkedList<Long> p = new LinkedList<>();
        for (Long cur = end; cur != null; cur = parent.get(cur)) p.addFirst(cur);
        return p;
    }
}`, 'LLD: A* over lazily loaded routing tiles'),
    tip("In the code, a cross-tile edge lands on a node from the neighbor tile. A real tile stores boundary nodes with their tile id, so the router can call `ensureTile` before expanding them. Say this out loud; it is the whole point of tiles."),
    warn("Do not run Dijkstra on the whole world graph. It does not fit in memory and explores in every direction. Use **tiles + A*** (a heuristic pulls the search toward the goal) and higher-level tiles for long trips."),
    warn("If clients compute tile URLs from geohash, that scheme is **frozen forever**: old app versions keep using it. A tiny tile-URL API costs one extra call but keeps you free to change it."),
    qa([
      ["How do you reroute users when an accident happens?", "Store each active route as its origin tile plus its parent tiles up the levels. Find users whose top tile covers the accident tile, recompute, and push over WebSocket."],
      ["Why Cassandra for locations?", "200k writes/s and growing, simple access by `user_id` and time. Partition key `user_id`, clustering key `timestamp`. Availability matters more than consistency."],
      ["How does the client know which map tiles to fetch?", "From its lat/lng and zoom level it computes the tile id (geohash-like), then pulls the static URL from the nearest CDN node."],
      ["Why batch GPS points?", "It cuts requests 15×, saves battery and data, and the server only needs near-real-time positions."],
    ]),
    drill("5 minutes: draw the navigation service chain, explain routing tile levels for a 5 km vs a 500 km trip, and write the A* loop with an admissible heuristic from memory."),
  ],
});

// ---------------------------------------------------------------- ch 19

S.push({
  id: 'ch19-distributed-message-queue',
  title: 'Ch 19 · Distributed Message Queue',
  summary: 'A Kafka-like log. Topics split into partitions on brokers, append-only segment files, consumer groups with stored offsets, ISR replication and ack levels.',
  tags: ['message queue', 'kafka', 'partition', 'offset', 'consumer group', 'isr', 'replication', 'delivery semantics', 'zookeeper', 'vol 2'],
  source: src('19. Distributed Message Queue'),
  blocks: [
    t("A distributed message queue is a **row of numbered notebooks where you can only write on the next empty line**. Producers append, nobody edits, and each reader team keeps a bookmark (the offset). Because messages are kept for 2 weeks and must stay ordered, this is closer to Kafka than to a classic queue that deletes on read."),
    flow([
      ['user:Producers'],
      ['Brokers (partitions + replicas)'],
      ['user:Consumer groups'],
    ], 'Main architecture', ['append to partition leader', 'pull from offset'], 'Around the brokers: data storage (log segments on disk), state storage (consumer offsets), metadata storage (topic config) and a coordination service (ZooKeeper / etcd) for broker liveness and leader election.'),
    key("**Partition = ordered append-only log; offset = position.** Order is only guaranteed inside one partition, so pick the partition key (e.g. `user_id`) on purpose. A partition is read by **at most one consumer per group**."),
    list([
      "Messages are text, a few KB each.",
      "Retention: **2 weeks**, replay allowed.",
      "Configurable: high throughput (log aggregation) or low latency (classic queue).",
      "Delivery: at-least-once required, ideally all three semantics configurable.",
    ], 'Requirements to confirm'),
    text(`
Topic "orders", 3 partitions. key -> hash(key) % 3 picks the partition.

  P0: | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |   <- append here
  P1: | 0 | 1 | 2 | 3 | 4 |
  P2: | 0 | 1 | 2 | 3 | 4 | 5 |

  Group A offsets: P0=6  P1=3  P2=5     (each group has its own bookmarks)
  Group B offsets: P0=1  P1=0  P2=2     (slow analytics job, still fine)

On disk each partition = segment files:
  00000000.log (read-only)  00004000.log (read-only)  00008000.log (active)
  Old segments are dropped whole when they pass retention.`, 'Picture: partitions, offsets, segments'),
    flow([
      ['user:Producer (client lib: router + buffer)'],
      ['Leader replica (broker 1)'],
      ['Follower (broker 2)', 'Follower (broker 3)'],
    ], 'Producer flow and replication', ['batched send', 'followers pull'], 'The routing layer lives inside the producer: it caches the replica plan from metadata, batches in memory, and sends straight to the partition leader. With `ack=all` the leader replies only after every in-sync replica has the batch.'),
    flow([
      ['user:Consumer B joins group'],
      ['Group coordinator (broker, hash of group name)'],
      ['Group leader consumer'],
      ['Group coordinator (broker, hash of group name)'],
      ['user:All consumers get new partitions'],
    ], 'Consumer rebalancing', ['join', 'pick leader, send member list', 'partition plan', 'broadcast plan'], 'Rebalance triggers: a consumer joins, leaves, or misses heartbeats; partitions are added. Consumers learn about it in the heartbeat reply.'),
    steps([
      "Clarify: message size, replay, ordering, retention 2 weeks, delivery semantics, throughput vs latency.",
      "Models: point-to-point (one consumer, deleted after ack) vs publish-subscribe (topics). Support both via consumer groups.",
      "Topics → partitions → brokers. Partition key picks the partition. Offset = position.",
      "Storage: write-ahead log split into segments. Sequential disk I/O + OS page cache = fast, even on HDD.",
      "Batch everywhere (producer, broker, consumer). Bigger batch = more throughput, more latency.",
      "Consumers **pull** from an offset; group coordinator assigns partitions; offsets committed to state storage.",
      "Replication with in-sync replicas (ISR); `ack` = 0, 1 or all. ZooKeeper holds metadata, offsets, leader election.",
    ], 'HLD in 7 steps'),
    table(['Semantics', 'Producer', 'Consumer', 'Use when'], [
      ['At-most-once', 'Send async, no retry (`ack=0`)', 'Commit offset **before** processing', 'Losing a few is fine (metrics)'],
      ['At-least-once', 'Retry until `ack=1` or `ack=all`', 'Process, **then** commit offset', 'Duplicates OK or deduped downstream'],
      ['Exactly-once', 'Idempotent producer + transactions', 'Commit offset and output atomically', 'Money, billing (costly)'],
    ], 'Delivery semantics'),
    table(['Setting', 'Producer waits for', 'Speed', 'Durability'], [
      ['`ack=0`', 'Nothing', 'Fastest', 'Lowest'],
      ['`ack=1`', 'Leader wrote it', 'Fast', 'Lost if leader dies before followers copy'],
      ['`ack=all`', 'Every in-sync replica', 'Slowest', 'Highest'],
    ], 'Ack levels'),
    table(['', 'Push (broker sends)', 'Pull (consumer fetches)'], [
      ['Latency', 'Lowest', 'Slightly higher (long polling helps)'],
      ['Slow consumer', 'Gets overwhelmed', 'Reads at its own pace'],
      ['Batching', 'Broker guesses capacity', 'Consumer grabs big batches'],
      ['Book picks', '', 'Pull'],
    ], 'Push vs pull consumers'),
    java(`
// LLD core: one partition as an append-only segmented log, plus consumer-group offsets.
record Message(long offset, String key, byte[] value, long ts) {}

class PartitionLog {
    static final int SEGMENT_MAX = 4096;   // messages per segment file
    private final TreeMap<Long, List<Message>> segments = new TreeMap<>();   // base offset -> segment
    private long nextOffset = 0;

    synchronized long append(String key, byte[] value) {
        if (segments.isEmpty() || segments.lastEntry().getValue().size() >= SEGMENT_MAX)
            segments.put(nextOffset, new ArrayList<>());          // roll a new active segment
        long off = nextOffset++;
        segments.lastEntry().getValue().add(new Message(off, key, value, System.currentTimeMillis()));
        return off;
    }

    synchronized List<Message> read(long fromOffset, int max) {
        List<Message> out = new ArrayList<>();
        Map.Entry<Long, List<Message>> e = segments.floorEntry(fromOffset);
        if (e == null) e = segments.firstEntry();                 // asked for data already purged
        while (e != null && out.size() < max) {
            for (Message m : e.getValue())
                if (m.offset() >= fromOffset && out.size() < max) out.add(m);
            e = segments.higherEntry(e.getKey());
        }
        return out;
    }

    synchronized void dropSegmentsBefore(long offset) {           // retention: delete whole files
        Long keep = segments.floorKey(offset);
        if (keep != null) segments.headMap(keep).clear();
    }
}

class Topic {
    final PartitionLog[] parts;
    Topic(int n) { parts = new PartitionLog[n]; for (int i = 0; i < n; i++) parts[i] = new PartitionLog(); }
    int partitionFor(String key) { return (key.hashCode() & 0x7fffffff) % parts.length; }
    long send(String key, byte[] value) { return parts[partitionFor(key)].append(key, value); }
}

class GroupOffsets {   // state storage (ZooKeeper / internal topic in prod)
    private final Map<String, Long> committed = new ConcurrentHashMap<>();
    long get(String group, int partition) { return committed.getOrDefault(group + "/" + partition, 0L); }
    void commit(String group, int partition, long next) { committed.merge(group + "/" + partition, next, Math::max); }
}

class Consumer {
    // at-least-once: process first, commit after. A crash in between replays the batch.
    static void pollOnce(Topic t, int p, String group, GroupOffsets offs, java.util.function.Consumer<Message> handler) {
        List<Message> batch = t.parts[p].read(offs.get(group, p), 500);
        for (Message m : batch) handler.accept(m);
        if (!batch.isEmpty()) offs.commit(group, p, batch.get(batch.size() - 1).offset() + 1);
    }
}`, 'LLD: partition log, offsets, consumer group'),
    warn("More consumers than partitions in one group means **idle consumers**. Partition count caps parallelism, so create enough partitions up front."),
    warn("A slow replica stalls `ack=all` writes. That is why the leader keeps an **ISR list**: a replica lagging past `replica.lag.max.messages` is dropped from ISR until it catches up."),
    tip("Advanced features to name: message filtering by tags on the broker, delayed / scheduled messages via a temp topic plus a hierarchical timing wheel, retry topics, archiving old segments to S3 or HDFS."),
    qa([
      ["Why a log on disk instead of a database?", "No updates or deletes, only sequential appends and reads. Sequential disk I/O plus the OS page cache gives huge throughput; a DB adds overhead you do not need."],
      ["How do you keep order for one user's events?", "Use `user_id` as the partition key so all of that user's messages land in one partition, and one consumer per group reads it."],
      ["A broker dies. What happens?", "A follower in the ISR becomes leader for each partition it held. The coordinator assigns new followers, which catch up and rejoin the ISR."],
      ["How do you reduce partitions?", "Stop writing to the old partition, keep reading it until retention expires, then delete it and rebalance consumers."],
    ]),
    drill("5 minutes: draw a topic with 3 partitions, two consumer groups and their offsets. State the producer and consumer rules for each delivery semantic. Then write `append` and `read` from memory."),
  ],
});

// ---------------------------------------------------------------- ch 20

S.push({
  id: 'ch20-metrics-monitoring',
  title: 'Ch 20 · Metrics Monitoring and Alerting',
  summary: 'Collect 10M infra metrics, store them in a time-series DB with downsampling, alert through rules, show dashboards. Pull or push into Kafka first.',
  tags: ['metrics', 'monitoring', 'alerting', 'time series', 'prometheus', 'influxdb', 'downsampling', 'push vs pull', 'grafana', 'vol 2'],
  source: src('20. Metrics Monitoring and Alerting System'),
  blocks: [
    t("A metrics system is a **heart-rate monitor for 100,000 servers**. Every server reports numbers like CPU and request rate every few seconds, a special database keeps the history, and an alarm rings when a number stays bad too long. It is write-heavy all the time and read-heavy in bursts during incidents."),
    flow([
      ['Metrics sources'],
      ['Metrics collectors'],
      ['q:Kafka'],
      ['Consumers (Flink / Spark)'],
      ['db:Time-series DB'],
      ['Query service', 'cache:Query cache'],
      ['Alerting system', 'Visualization (Grafana)'],
    ], 'Main architecture', ['pull or push', 'buffer', '', 'write', 'read', 'queries'], 'Kafka between collectors and the DB means a DB outage does not lose data. Alerts fan out to email, SMS, PagerDuty and webhooks.'),
    key("Three things: (1) Data is a **time series**: name + labels + (timestamp, value) pairs. Use a TSDB like InfluxDB or Prometheus, not MySQL. (2) **Keep label cardinality low.** (3) **Downsample** old data: raw 7 days, 1 min for 30 days, 1 h for a year."),
    list([
      "1,000 server pools × 100 machines × ~100 metrics = **10M time series**.",
      "Retention 1 year with rollups: raw 7 d, 1-minute 30 d, 1-hour after.",
      "About **85%** of queries hit the last 26 hours, so keep recent data hot.",
      "One InfluxDB node (8 cores, 32 GB) handles **250k writes/s**.",
    ], 'Numbers to say out loud'),
    text(`
Line protocol: one point = metric name, labels, timestamp, value.

  cpu.load host=web01,region=us-west 1613707265 50
  cpu.load host=web01,region=us-west 1613707275 62
  cpu.load host=web02,region=us-west 1613707265 43

  series key = cpu.load{host=web01,region=us-west}
  time ---->  50   62   58   71   ...

Compression: store first timestamp, then deltas (10, 10, 10 ...)
             -> delta of deltas is 0, which costs almost no bits.`, 'Picture: time-series data model'),
    flow([
      ['lb:Service discovery (etcd / ZooKeeper)'],
      ['Metrics collector (pull)'],
      ['Web servers', 'DB servers', 'Queue servers'],
    ], 'Pull model', ['targets, interval, timeout', 'GET /metrics'], 'Several collectors sit on a consistent hash ring; each server belongs to exactly one collector, so nothing is scraped twice.'),
    flow([
      ['Web servers + agent', 'DB servers + agent'],
      ['lb:Load balancer'],
      ['Metrics collectors (autoscaled)'],
      ['q:Kafka'],
    ], 'Push model', ['push (pre-aggregated)', '', ''], 'Agents can sum counters for a minute before sending, cutting volume. Collectors sit behind an LB in an autoscaling group so they can absorb spikes.'),
    flow([
      ['store:Rule config (YAML)'],
      ['cache:Rule cache'],
      ['Alert manager'],
      ['Query service', 'db:Alert store (Cassandra)'],
      ['q:Kafka'],
      ['Alert consumers'],
      ['ext:Email / SMS / PagerDuty / webhook'],
    ], 'Alerting flow', ['load', 'fetch rules', 'evaluate  /  state', 'fire', '', 'notify']),
    steps([
      "Clarify: internal use, infra metrics only (no logs, no tracing), 10M series, 1 year retention, alert channels.",
      "Name the 5 parts: collection, transmission, storage, alerting, visualization.",
      "Data model: metric name + labels + (ts, value). Write heavy, spiky reads.",
      "Collection: pull (Prometheus) or push (CloudWatch, Graphite). Large orgs support both.",
      "Transmission: collectors → Kafka (partition by metric name) → stream processors → TSDB.",
      "Storage: TSDB with delta encoding, downsampling, cold storage for old data.",
      "Alerting: rules in YAML, evaluated on an interval, dedupe and retry, notify via Kafka consumers. Dashboards: buy Grafana.",
    ], 'HLD in 7 steps'),
    table(['', 'Pull', 'Push'], [
      ['Debugging', '`/metrics` endpoint readable any time: **pull wins**', 'Missing data could be network or app'],
      ['Health check', 'No response = server down: **pull wins**', 'Unclear: down or network?'],
      ['Short-lived jobs', 'May finish before a scrape (needs push gateway)', 'Job pushes before exit: **push wins**'],
      ['Firewalls, many DCs', 'Every endpoint must be reachable', 'Collector behind LB accepts from anywhere: **push wins**'],
      ['Transport', 'Usually TCP', 'Often UDP, lower latency'],
      ['Authenticity', 'Targets listed in config, trusted', 'Anyone can push unless whitelisted / authed'],
    ], 'Pull vs push'),
    table(['Where', 'Example', 'Good', 'Bad'], [
      ['Collection agent', 'Sum a counter for 1 min, then send', 'Less traffic', 'Only simple math'],
      ['Ingestion pipeline (Flink)', 'Roll up before writing to DB', 'Far fewer writes', 'Raw data lost'],
      ['Query time', 'Grafana averages raw points', 'No data loss', 'Slow queries'],
    ], 'Where aggregation can happen'),
    java(`
// LLD core: points, downsampling rollup, and a "for 5m" alert rule with dedupe.
record Point(long ts, double value) {}

class Rollup {
    // average raw points into fixed buckets, e.g. 10 s data -> 30 s or 1 min buckets
    static List<Point> downsample(List<Point> raw, long bucketMs) {
        TreeMap<Long, double[]> acc = new TreeMap<>();   // bucket start -> {sum, count}
        for (Point p : raw) {
            long b = p.ts() - Math.floorMod(p.ts(), bucketMs);
            double[] s = acc.computeIfAbsent(b, k -> new double[2]);
            s[0] += p.value();
            s[1]++;
        }
        List<Point> out = new ArrayList<>();
        acc.forEach((b, s) -> out.add(new Point(b, s[0] / s[1])));
        return out;
    }
}

class AlertRule {
    final String name; final double threshold; final long forMs;
    private final Map<String, Long> breachingSince = new HashMap<>();   // series -> first bad ts
    private final Set<String> firing = new HashSet<>();

    AlertRule(String name, double threshold, long forMs) { this.name = name; this.threshold = threshold; this.forMs = forMs; }

    // called every evaluation interval with the latest value per series; returns new alerts only
    List<String> evaluate(Map<String, Point> latest) {
        List<String> fired = new ArrayList<>();
        for (var e : latest.entrySet()) {
            String series = e.getKey(); Point p = e.getValue();
            if (p.value() > threshold) {
                long since = breachingSince.computeIfAbsent(series, k -> p.ts());
                if (p.ts() - since >= forMs && firing.add(series)) fired.add(name + " " + series);  // dedupe
            } else {
                breachingSince.remove(series);
                firing.remove(series);                       // resolved: may fire again later
            }
        }
        return fired;                                        // publish to Kafka -> notifiers
    }
}`, 'LLD: downsampling + alert rule evaluation'),
    warn("**High-cardinality labels** (user id, request id) explode the number of series and the label index. Labels should be things like host, region, service."),
    warn("Empty is not healthy. If a server stops reporting, a pure threshold rule never fires. Add an `up == 0` or **absent-data** rule."),
    tip("Say build vs buy out loud: Grafana for dashboards and an off-the-shelf alert manager are hard to beat; the interesting parts to design are collection, transport and storage."),
    qa([
      ["Why not store metrics in MySQL?", "Write rate and time-window aggregations (moving averages) are painful in SQL. A TSDB has compression, label indexes and a query language built for it."],
      ["What if the TSDB goes down?", "Kafka buffers the points, consumers resume from their offsets when it is back. No data loss."],
      ["How do you avoid two collectors scraping the same server?", "Put collectors on a consistent hash ring; each target hashes to exactly one collector."],
      ["How do you stop an alert storm?", "The alert manager merges and dedupes per rule and series, sends once, keeps state in the alert store, and retries until delivered at least once."],
    ]),
    drill("5 minutes: draw the main pipeline, fill the pull vs push table from memory (6 rows), then downsample 10, 16, 20, 30, 20, 30 (10 s apart) to 30 s buckets. Answer: 15.3 and 26.7."),
  ],
});

// ---------------------------------------------------------------- ch 21

S.push({
  id: 'ch21-ad-click-aggregation',
  title: 'Ch 21 · Ad Click Event Aggregation',
  summary: 'Count 1B ad clicks per day per minute and per ad, plus top 100 ads, exactly once. Kafka → MapReduce-style aggregation → Kafka → Cassandra, with watermarks and reconciliation.',
  tags: ['ad click', 'aggregation', 'stream processing', 'kappa', 'lambda', 'watermark', 'tumbling window', 'exactly once', 'top n', 'vol 2'],
  source: src('21. Ad Click Event Aggregation'),
  blocks: [
    t("Ad click aggregation is a **cash register that tallies every minute**. Clicks stream in, each minute gets a total per ad and a top-100 list, and the totals become invoices. Because **money** depends on it, the counts must be exactly right even with late, duplicated or replayed events."),
    flow([
      ['Log watcher'],
      ['q:Kafka: raw clicks'],
      ['Aggregation service (map → aggregate → reduce)', 'DB writer'],
      ['q:Kafka: per-minute results', 'db:Raw data DB (Cassandra)'],
      ['DB writer'],
      ['db:Aggregation DB (Cassandra)'],
      ['Query service (dashboard)'],
    ], 'Main architecture', ['', 'consume  /  copy raw', 'counts + top 100  /  store', 'pull', 'write', 'read'], 'The second Kafka queue lets the aggregator commit its input offset and its output together, which is how you get end-to-end exactly-once.'),
    key("Three things: (1) Aggregate by **event time**, close windows with a **watermark**. (2) Billing needs **exactly-once**: dedupe and commit offsets atomically with output. (3) Keep **raw data** too, for recalculation and the end-of-day **reconciliation**."),
    list([
      "1B DAU, 1 click each: **1B clicks/day**, 2M ads, +30% a year.",
      "Average **10k QPS**, peak 5× = **50k QPS**.",
      "0.1 KB per click: **100 GB/day**, about 3 TB/month.",
      "End-to-end latency: a few minutes is fine (real-time bidding has its own sub-second path).",
    ], 'Numbers to say out loud'),
    flow([
      ['q:Kafka partitions'],
      ['Map nodes (filter, clean, route by ad_id % 3)'],
      ['Aggregate node 0', 'Aggregate node 1', 'Aggregate node 2'],
      ['Reduce node (merge counts, merge top-N heaps)'],
      ['q:Kafka: results'],
    ], 'Aggregation DAG (MapReduce style)', ['', 'shuffle by ad_id', 'per-minute counts + local top N', ''], 'Map nodes exist because you may not control how producers partition, and to clean data first. Intermediate data stays in memory.'),
    text(`
Tumbling 1-minute windows, event time, with a 15 s watermark:

event time  00:00         00:01         00:02
            |--- win A ---|--- win B ---|
               e1  e2   e3   e4     e5
                          ^ e3 happened at 00:00:58 but arrived at 00:01:09

  Close win A only when the watermark passes 00:01:00 + 15 s.
  -> e3 still counted in A.  Longer watermark = fewer misses, more delay.
  Events later than the watermark: fixed by the end-of-day reconciliation.

Top 100 in the last M minutes = sliding window over the per-minute results.`, 'Picture: tumbling window + watermark'),
    flow([
      ['q:Upstream Kafka'],
      ['Aggregator'],
      ['q:Downstream Kafka'],
    ], 'Exactly-once: atomic commit', ['poll from offset 100', 'send result + commit offset 100 in one transaction'], 'Without the transaction: crash after sending but before committing offset means offset 100 is reprocessed and counted twice. Idempotent upserts keyed by `(ad_id, minute)` downstream are a simpler alternative.'),
    flow([
      ['store:Raw data (Cassandra / S3)'],
      ['Recalculation service (batch read)'],
      ['Dedicated aggregation service'],
      ['q:Kafka: results'],
      ['db:Aggregation DB'],
    ], 'Kappa recalculation path', ['', '', '', 'overwrite bad minutes'], 'Same aggregation code as the live path, separate instances, so a backfill never slows real-time results.'),
    steps([
      "Clarify: 1B clicks/day, queries = clicks for ad X in last M min, top 100 per minute, filters by ip / user / country. Late and duplicate events exist.",
      "APIs: `GET /v1/ads/{ad_id}/aggregated_count?from&to&filter`, `GET /v1/ads/popular_ads?count&window&filter`.",
      "Data: keep raw clicks and per-minute aggregates. Both in Cassandra (write heavy).",
      "Pipeline: log watcher → Kafka → aggregation DAG → Kafka → DB writer → aggregation DB.",
      "Filters: pre-aggregate per dimension (country, ...) = **star schema**, filter_id per combo.",
      "Correctness: event time + watermark, tumbling window for counts, sliding for top N, exactly-once with atomic commit, dedupe.",
      "Ops: scale Kafka partitions and consumers, split hot ads, snapshot aggregator state, monitor lag, reconcile nightly.",
    ], 'HLD in 7 steps'),
    table(['', 'Lambda', 'Kappa'], [
      ['Paths', 'Batch path + streaming path side by side', 'One streaming path only'],
      ['Reprocessing', 'Batch job recomputes', 'Replay raw data through the same stream code'],
      ['Codebases', 'Two to keep in sync', 'One'],
      ['Book picks', '', 'Kappa'],
    ], 'Lambda vs kappa'),
    table(['', 'Event time', 'Processing time'], [
      ['Meaning', 'When the click happened (client)', 'When the server handled it'],
      ['Good', 'Accurate per-minute counts', 'Reliable server clock'],
      ['Bad', 'Late events; client clocks can be wrong or forged', 'Wrong bucket when events arrive late'],
      ['Book picks', 'This one, plus watermark', ''],
    ], 'Which timestamp'),
    table(['Window', 'Shape', 'Used for'], [
      ['Tumbling', 'Fixed, back to back, no overlap', 'Clicks per ad per minute'],
      ['Sliding', 'Fixed length, moves continuously', 'Top N in the last M minutes'],
      ['Hopping', 'Fixed length, jumps by a step, overlaps', 'Not used here'],
      ['Session', 'Ends after a gap of inactivity', 'Not used here'],
    ], 'Window types'),
    java(`
// LLD core: per-minute tumbling window by event time, dedupe by click id, watermark close, top N with a min-heap.
record Click(String clickId, String adId, long eventTimeMs) {}
record MinuteResult(long minute, Map<String, Long> counts, List<String> topN) {}

class TumblingAggregator {
    static final long WINDOW = 60_000;
    private final long watermarkMs;     // allowed lateness, e.g. 15 s
    private final int n;
    private final TreeMap<Long, Map<String, Long>> windows = new TreeMap<>();  // minute -> adId -> count
    private final Map<Long, Set<String>> seen = new HashMap<>();               // minute -> click ids (dedupe)
    private long maxEventTime = Long.MIN_VALUE;

    TumblingAggregator(long watermarkMs, int n) { this.watermarkMs = watermarkMs; this.n = n; }

    /** Returns results for every window the watermark just closed. */
    List<MinuteResult> onClick(Click c) {
        long minute = c.eventTimeMs() - Math.floorMod(c.eventTimeMs(), WINDOW);
        maxEventTime = Math.max(maxEventTime, c.eventTimeMs());
        boolean open = minute + WINDOW + watermarkMs > maxEventTime;
        if (open && seen.computeIfAbsent(minute, k -> new HashSet<>()).add(c.clickId()))   // drop duplicates
            windows.computeIfAbsent(minute, k -> new HashMap<>()).merge(c.adId(), 1L, Long::sum);
        // too-late events are skipped here; nightly reconciliation from raw data fixes them

        List<MinuteResult> closed = new ArrayList<>();
        while (!windows.isEmpty() && windows.firstKey() + WINDOW + watermarkMs <= maxEventTime) {
            var e = windows.pollFirstEntry();
            seen.remove(e.getKey());
            closed.add(new MinuteResult(e.getKey(), e.getValue(), topN(e.getValue())));
        }
        return closed;   // downstream upserts by (adId, minute): replays overwrite, never double count
    }

    private List<String> topN(Map<String, Long> counts) {
        PriorityQueue<Map.Entry<String, Long>> heap =
            new PriorityQueue<>(Map.Entry.comparingByValue());          // min-heap of size n
        for (var e : counts.entrySet()) {
            heap.offer(e);
            if (heap.size() > n) heap.poll();                          // evict the smallest
        }
        List<String> out = new ArrayList<>();
        while (!heap.isEmpty()) out.add(heap.poll().getKey());
        Collections.reverse(out);                                      // biggest first
        return out;
    }
}`, 'LLD: tumbling window, dedupe, top N'),
    warn("At-least-once is **not** good enough here. A 1% double count is millions of dollars of wrong bills. Name exactly-once (atomic offset + output commit) or idempotent upserts keyed by `(ad_id, minute)`."),
    warn("Aggregator state lives in memory. If a node dies, restarting from the Kafka offset alone loses the half-built top-N. **Snapshot** the window state with its offset, and restore both."),
    tip("Hot ad (one ad gets far more clicks): the overloaded aggregate node asks the resource manager for extra nodes, splits its events across them, and merges the partial counts. Fancier names: global-local aggregation, split distinct aggregation."),
    qa([
      ["How do you know the numbers are right?", "A nightly batch job recomputes per-minute counts from the raw data and compares them with the aggregation DB. Mismatches are alerted and backfilled."],
      ["How do you support filtering by country fast?", "Pre-aggregate per dimension value (star schema): rows like `(ad_id, minute, country, count)`. Fast reads, more rows."],
      ["How do you scale ingestion?", "More Kafka partitions created up front (rebalancing thousands of consumers is slow, do it off-peak), more consumers per group, maybe topics per region."],
      ["Why keep raw data if you have aggregates?", "To debug and to recalculate after an aggregation bug. Move it to cold storage to keep it cheap."],
    ]),
    drill("5 minutes: draw the pipeline with both Kafka queues and say why the second exists. Explain event time vs processing time and the watermark trade-off in 3 sentences. Then write `topN` with a min-heap from memory."),
  ],
});

export default S;
