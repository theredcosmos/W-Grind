// SD Book Notes, chapters 22-28 (Vol 2). Shape: ../schema.js; helpers: ./h.js.
import { t, list, steps, table, java, text, key, warn, tip, drill, qa, flow, src } from './h.js';

const S = [];

// ---------------------------------------------------------------- ch 22

S.push({
  id: 'ch22-hotel-reservation',
  title: 'Ch 22 · Hotel Reservation System',
  summary: 'Book a room type for a date range without double booking. One inventory row per hotel, room type and day.',
  tags: ['hotel reservation', 'booking', 'double booking', 'idempotency', 'optimistic locking', 'inventory', 'overbooking', 'saga', 'vol 2'],
  source: src('22. Hotel Reservation System'),
  blocks: [
    t("A hotel booking system is a **seat counter per night**. For every hotel, room type and date you keep two numbers: rooms that exist and rooms already sold. Booking means adding to the sold number for each night of the stay, but only if it stays under the cap. The same design fits Airbnb, flights and movie tickets."),
    flow([
      ['user:Guest app', 'user:Admin'],
      ['lb:CDN + public API gateway', 'lb:Internal API (VPN)'],
      ['svc:Hotel svc', 'svc:Rate svc', 'svc:Reservation svc', 'svc:Payment svc', 'svc:Hotel mgmt svc'],
      ['cache:Hotel cache', 'db:Rate DB', 'db:Reservation + inventory DB', 'db:Payment DB'],
    ], 'High-level design', ['HTTPS', 'gRPC between services', 'own data'], 'Reservation and inventory share **one relational DB** on purpose, so a booking is one ACID transaction.'),
    key("Reserve a **room type**, not a room number. Stop double clicks with an **idempotency key** (`reservation_id`, unique). Stop two guests racing for the last room with **optimistic locking** or a DB `CHECK` constraint."),
    list([
      "Scale: **5,000 hotels, 1M rooms**, 70% occupied, 3-night stays.",
      "Reservations: 1M × 0.7 / 3 ≈ **240k per day ≈ 3 per second**. Writes are tiny.",
      "Funnel: 10% conversion per page, so 3 bookings/s means **30 views/s** of the booking page and **300 views/s** of room details.",
      "Inventory rows: 5,000 hotels × 20 room types × 365 days × 2 years ≈ **73M rows**. One MySQL box holds it.",
      "Hotels may **overbook by 10%**: the cap is `110% × total_inventory`.",
    ], 'Numbers to say out loud'),
    text(`
room_type_inventory   (PK: hotel_id, room_type_id, date)

hotel_id | room_type_id | date       | total_inventory | total_reserved | version
---------+--------------+------------+-----------------+----------------+--------
211      | 1001         | 2021-06-01 | 100             | 80             | 17
211      | 1001         | 2021-06-02 | 100             | 82             | 21
211      | 1001         | 2021-06-03 | 100             | 86             | 9

Book 3 rooms, Jun 1 -> Jun 3 (2 nights) = touch 2 rows.
OK if  total_reserved + 3 <= 1.1 * total_inventory  for EVERY night.
A nightly cron job pre-creates rows ~2 years ahead.`, 'The key table, drawn'),
    flow([
      ['user:Click Book twice'],
      ['svc:Reservation svc'],
      ['db:reservation table (reservation_id UNIQUE)'],
    ], 'Idempotent booking', ['same reservation_id both times', 'second INSERT hits unique key'], 'The client gets `reservation_id` when the booking form opens. A replay finds the existing row and returns it instead of booking again.'),
    flow([
      ['svc:Tx 1 reads version 7', 'svc:Tx 2 reads version 7'],
      ['db:UPDATE ... SET version = 8 WHERE version = 7'],
      ['svc:Tx 1: 1 row updated, wins', 'svc:Tx 2: 0 rows updated, retry'],
    ], 'Optimistic locking on the last room', ['both see 99 of 100 sold', 'only one can match']),
    steps([
      "Clarify: chain size, pay at booking or at check in, cancel allowed, overbooking %, prices change daily.",
      "APIs: hotels and rooms (CRUD, ops only), `POST /v1/reservations` with `hotelID`, `roomTypeID`, `roomCount`, dates and `reservationID`.",
      "Data: relational DB (read heavy, ACID, clear schema). Tables: hotel, room, room_type_rate, reservation, room_type_inventory.",
      "Services: hotel (cache hard, static), rate (price per future date), reservation (owns inventory), payment, hotel management.",
      "Availability check: `SELECT` inventory rows for the date range, check every night against the 110% cap.",
      "Concurrency: idempotency key for one user, optimistic lock or DB constraint for many users.",
      "Scale out: shard by `hash(hotel_id)`, cache inventory in Redis fed by CDC, keep the DB as the source of truth.",
      "Cross-service consistency: keep reservation + inventory in one DB; else Saga with compensations.",
    ], 'HLD in 8 steps'),
    table(['Option', 'How', 'Good', 'Bad'], [
      ['Pessimistic lock', '`SELECT ... FOR UPDATE` holds row locks until commit', 'Simple; great under heavy contention', 'Deadlocks; long locks block everyone; does not scale'],
      ['Optimistic lock', '`version` column; `UPDATE ... WHERE version = ?`', 'No DB locks; fast when conflicts are rare', 'Many rollbacks when contention is high'],
      ['DB constraint', '`CHECK (total_inventory - total_reserved >= 0)`', 'Easiest to build', 'Same high-contention issue; not in every DB; hard to version'],
    ], 'Stopping two guests from booking the last room'),
    flow([
      ['svc:Reservation svc'],
      ['lb:hash(hotel_id) % 16'],
      ['db:Shard 0', 'db:Shard ...', 'db:Shard 15'],
      ['q:CDC stream (Debezium)'],
      ['cache:Redis inventory cache'],
    ], 'Scaling to booking.com size (1000x)', ['', 'every query has hotel_id', 'row changes', 'async update'], '30,000 QPS / 16 shards ≈ **1,875 QPS each**. Cache key `hotelID_roomTypeID_date`, value = rooms left, TTL drops past dates.'),
    table(['Approach', 'Atomic?', 'Cost'], [
      ['One DB for reservation + inventory', 'Yes, one local transaction', 'Not "pure" microservices'],
      ['Two-phase commit', 'Yes, across nodes', 'Blocking: one slow node stalls all'],
      ['Saga', 'Eventually, via compensating steps', 'More code, brief inconsistency'],
    ], 'Keeping services consistent'),
    java(`
// LLD core: reserve N rooms of a type for a stay.
// Idempotency: reservationId is unique. Concurrency: optimistic version check per inventory row.
record InvKey(long hotelId, long roomTypeId, LocalDate date) {}

class InventoryRow {                       // one row of room_type_inventory
    final int total; int reserved; long version;
    InventoryRow(int total) { this.total = total; }
}

class ReservationService {
    static final double OVERBOOK = 1.10;
    private final Map<InvKey, InventoryRow> inventory = new ConcurrentHashMap<>();
    private final Map<String, String> reservations = new ConcurrentHashMap<>(); // id -> status

    String reserve(String reservationId, long hotelId, long typeId,
                   LocalDate checkIn, LocalDate checkOut, int rooms) {
        // 1. Idempotency: the second click gets the first result back.
        String prior = reservations.putIfAbsent(reservationId, "PENDING");
        if (prior != null) return prior;

        List<InvKey> nights = checkIn.datesUntil(checkOut)
            .map(d -> new InvKey(hotelId, typeId, d)).toList();
        for (int attempt = 0; attempt < 3; attempt++) {
            // 2. Read every night and remember its version.
            Map<InvKey, Long> seen = new HashMap<>();
            for (InvKey k : nights) {
                InventoryRow row = inventory.get(k);
                if (row == null || row.reserved + rooms > OVERBOOK * row.total) {
                    reservations.put(reservationId, "REJECTED");
                    return "REJECTED";
                }
                seen.put(k, row.version);
            }
            // 3. Write only if nobody changed those rows meanwhile.
            if (commitIfUnchanged(seen, rooms)) {
                reservations.put(reservationId, "RESERVED");
                return "RESERVED";
            }
        }
        reservations.remove(reservationId);   // let the client retry later
        return "BUSY_TRY_AGAIN";
    }

    // Stands in for ONE DB transaction of:
    // UPDATE room_type_inventory SET total_reserved = total_reserved + ?, version = version + 1
    // WHERE hotel_id = ? AND room_type_id = ? AND date = ? AND version = ?
    private synchronized boolean commitIfUnchanged(Map<InvKey, Long> seen, int rooms) {
        for (var e : seen.entrySet())
            if (inventory.get(e.getKey()).version != e.getValue()) return false; // rollback
        for (InvKey k : seen.keySet()) {
            InventoryRow row = inventory.get(k);
            row.reserved += rooms;
            row.version++;
        }
        return true;
    }
}`, 'LLD: reserve with idempotency + optimistic lock'),
    warn("Checking availability and then updating in **two steps without a lock or version** is the classic bug: both transactions see 99/100 and both commit. Say this race out loud before giving the fix."),
    warn("The Redis inventory cache can be stale. That is fine only because **the DB still enforces the cap**. Never let the cache decide a booking."),
    tip("Want history to stop growing the hot table? Keep only current and future reservations there and move old ones to cold storage."),
    qa([
      ["Why a relational DB?", "Reads far outnumber writes, the schema is clear, and ACID stops double booking and negative inventory. 73M inventory rows fits one server plus replicas."],
      ["Why reserve a room type, not a room?", "Hotels assign the room number at check in. Guests buy a type for some nights, so inventory is counted per type per night."],
      ["Optimistic or pessimistic locking here?", "Optimistic: about 3 bookings per second means conflicts are rare, and it avoids DB locks. Pessimistic only if one hotel gets hammered."],
      ["The DB is too big. Now what?", "Shard by `hash(hotel_id)` since every query has it, archive past reservations, and add a Redis read cache synced by CDC."],
    ]),
    drill("5 minutes, no notes: draw the `room_type_inventory` table with sample rows, write the availability check with the 110% cap, then write the optimistic `UPDATE ... WHERE version = ?` and explain what 0 rows updated means."),
  ],
});

// ---------------------------------------------------------------- ch 23

S.push({
  id: 'ch23-distributed-email',
  title: 'Ch 23 · Distributed Email Service',
  summary: 'Gmail at 1B users: HTTP for clients, SMTP between servers, queues for send and receive, data partitioned by user.',
  tags: ['email', 'gmail', 'smtp', 'imap', 'mailbox', 'search', 'elasticsearch', 'cassandra', 'deliverability', 'vol 2'],
  source: src('23. Distributed Email Service'),
  blocks: [
    t("An email service is a **post office where every user has a private locker**. Outgoing letters go through a sorting queue and a courier (SMTP) to other post offices. Incoming letters are checked, then dropped into the right locker. Almost nothing crosses lockers, so **partition everything by `user_id`**."),
    flow([
      ['user:Webmail'],
      ['lb:Load balancer'],
      ['svc:Web servers (REST)', 'svc:Real-time servers (WebSocket)'],
      ['db:Metadata DB', 'store:Attachment store (S3)', 'cache:Distributed cache (recent mail)', 'db:Search store'],
    ], 'High-level design', ['HTTPS', '', 'read / write'], 'Web servers handle request/response APIs. Real-time servers push new mail; fall back to long polling for old browsers.'),
    key("Separate **send** and **receive** pipelines with queues in the middle. Store metadata partitioned by `user_id` in a strongly consistent store. Index search **async** through Kafka; query it sync."),
    list([
      "**1B users**. 10 sent per user per day ≈ **100k sends/second**.",
      "40 received per day × 50 KB metadata ≈ **730 PB/year**.",
      "20% have attachments of 500 KB avg ≈ **1,460 PB/year**.",
      "Attachments are base64 inside the message; most providers cap at **25 MB**.",
    ], 'Numbers to say out loud'),
    table(['Protocol', 'Job', 'Note'], [
      ['SMTP', 'Server to server sending', 'Finds the target via the domain **MX record** in DNS'],
      ['POP', 'Client downloads mail', 'Deletes from the server after download'],
      ['IMAP', 'Client reads mail', 'Keeps mail on the server; syncs devices'],
      ['HTTPS', 'Web and mobile clients', 'Not a mail protocol, but easiest to extend; our choice'],
    ], 'Email 101'),
    flow([
      ['user:Alice (Outlook)'],
      ['svc:Outlook SMTP server'],
      ['lb:DNS: MX of gmail.com'],
      ['svc:Gmail SMTP server'],
      ['store:One file per email'],
      ['user:Bob (IMAP / POP)'],
    ], 'Traditional mail server (does not scale)', ['SMTP', 'lookup', 'SMTP', 'save', 'fetch'], 'Disk I/O becomes the bottleneck and one dead disk loses mail.'),
    flow([
      ['user:Sender'],
      ['lb:LB (rate limits sends)'],
      ['svc:Web servers: validate, spam check'],
      ['q:Outgoing queue', 'q:Error queue'],
      ['svc:SMTP outgoing workers (spam, virus)'],
      ['ext:Recipient mail server'],
    ], 'Send flow', ['POST /v1/messages', '', 'pass / fail', 'pull', 'SMTP'], 'Same domain recipient: skip SMTP and deliver internally. The mail is also saved to the Sent folder. A growing outgoing queue means a dead recipient server (retry with backoff) or too few workers.'),
    flow([
      ['ext:Other mail servers'],
      ['lb:SMTP load balancer'],
      ['svc:SMTP servers (acceptance policy)'],
      ['q:Incoming queue'],
      ['svc:Mail processing workers (spam, virus)'],
      ['db:Metadata DB', 'store:Object store', 'cache:Cache', 'svc:Real-time servers'],
    ], 'Receive flow', ['SMTP', '', 'big attachments to S3', '', 'store + push'], 'Online users get a WebSocket push. Offline users see it on their next HTTP fetch.'),
    text(`
Partition key = user_id (one user's mail on one shard). Clustering key sorts within it.

folders_by_user      PK (user_id)              | folder_id, folder_name
emails_by_folder     PK (user_id, folder_id)   | email_id TIMEUUID DESC, from, subject, preview, is_read
emails_by_user       PK (email_id)             | from, to[], subject, body, attachments[]
attachments          PK (email_id)             | filename, size, s3_url

Cassandra style DBs cannot filter on is_read (not a key), so DENORMALIZE:
read_emails          PK (user_id, folder_id)   | email_id DESC ...
unread_emails        PK (user_id, folder_id)   | email_id DESC ...
Mark as read = delete from unread_emails + insert into read_emails.

Threads: headers Message-Id, In-Reply-To, References let the client rebuild a conversation.`, 'Metadata data model'),
    flow([
      ['svc:Send / receive / delete / move'],
      ['q:Kafka'],
      ['svc:Indexer'],
      ['db:Elasticsearch (partition by user_id)'],
    ], 'Search: write path async, read path sync', ['mutation event', 'consume', 'index'], 'Email search is **write heavy** (every mail is indexed) but rarely queried. Results must be exact and sorted by date, not relevance.'),
    steps([
      "Clarify: 1B users, send/receive/fetch/filter/search, attachments, spam; HTTP for clients.",
      "APIs: `POST /v1/messages`, `GET /v1/folders`, `GET /v1/folders/{id}/messages` (paged), `GET /v1/messages/{id}`.",
      "Draw web servers + real-time servers over metadata DB, attachment store, cache and search store.",
      "Walk the send flow: validate, queue, SMTP workers, retry with backoff, save to Sent.",
      "Walk the receive flow: SMTP LB, acceptance policy, queue, workers, store and push.",
      "Metadata DB: partition by `user_id`, `email_id` as TIMEUUID, denormalize read/unread. Pick **consistency over availability**.",
      "Search: Elasticsearch fed by Kafka, or a custom LSM-tree index for write-heavy load.",
      "Deliverability and multi-DC: dedicated warmed-up IPs, SPF/DKIM, leader-follower replication across data centers.",
    ], 'HLD in 8 steps'),
    table(['Need', 'Relational', 'Object store', 'NoSQL (Bigtable style)'], [
      ['Big bodies (MBs)', 'Poor: tuned for small rows', 'Great', 'Good'],
      ['Search, mark read, sort', 'Good with indexes', 'Poor', 'Good with denormalized tables'],
      ['Verdict', 'Small scale only', 'Backups only', 'Closest fit; Gmail uses Bigtable'],
    ], 'Where to put email metadata'),
    table(['', 'Elasticsearch', 'Custom search engine'], [
      ['Effort', 'Off the shelf', 'Large engineering project'],
      ['Scale', 'Scales to a point', 'Tuned for email, scales further'],
      ['Ops', 'A second system to run and sync', 'Can live inside the datastore'],
      ['Write path', 'General purpose', 'LSM tree: memory buffer, then sequential disk merges'],
    ], 'Search options'),
    java(`
// LLD core: one user's mailbox (lives on one shard), folders, read/unread, a tiny inverted index,
// and the send path. In production the index is updated async via Kafka.
record Email(long id, String from, List<String> to, String subject, String body, long ts) {}

class Mailbox {
    private final Map<String, TreeMap<Long, Email>> folders = new HashMap<>(); // newest first
    private final Map<Long, Email> byId = new HashMap<>();
    private final Set<Long> unread = new HashSet<>();
    private final Map<String, Set<Long>> index = new HashMap<>();               // word -> email ids

    Mailbox() {
        for (String f : List.of("Inbox", "Sent", "Drafts", "Trash"))
            folders.put(f, new TreeMap<>(Comparator.reverseOrder()));
    }

    void deliver(String folder, Email e, boolean markUnread) {
        folders.get(folder).put(e.id(), e);
        byId.put(e.id(), e);
        if (markUnread) unread.add(e.id());
        for (String w : (e.subject() + " " + e.body()).toLowerCase().split("[^a-z0-9]+"))
            if (!w.isEmpty()) index.computeIfAbsent(w, k -> new HashSet<>()).add(e.id());
    }

    List<Email> page(String folder, int limit) {
        return folders.get(folder).values().stream().limit(limit).toList();
    }

    void markRead(long id) { unread.remove(id); }

    List<Email> search(String query) {              // AND of all words, newest first
        Set<Long> hits = null;
        for (String w : query.toLowerCase().split("[^a-z0-9]+")) {
            if (w.isEmpty()) continue;
            Set<Long> ids = index.getOrDefault(w, Set.of());
            if (hits == null) hits = new HashSet<>(ids); else hits.retainAll(ids);
        }
        if (hits == null) return List.of();
        return hits.stream().map(byId::get)
            .sorted(Comparator.comparingLong(Email::ts).reversed()).toList();
    }
}

class MailService {
    static final int MAX_BYTES = 25 * 1024 * 1024;
    private final Map<String, Mailbox> boxes = new ConcurrentHashMap<>();
    private final BlockingQueue<Email> outgoing = new LinkedBlockingQueue<>(); // SMTP workers drain it

    void send(String sender, Email e) {
        if (e.body().length() > MAX_BYTES) throw new IllegalArgumentException("too big");
        box(sender).deliver("Sent", e, false);
        for (String to : e.to()) {
            if (to.endsWith("@ourmail.com")) box(to).deliver("Inbox", e, true); // same domain: skip SMTP
            else outgoing.add(e);
        }
    }
    private Mailbox box(String user) { return boxes.computeIfAbsent(user, u -> new Mailbox()); }
}`, 'LLD: mailbox, search index, send'),
    warn("Do not put mail in one file per message on a local disk. It was the old way: **disk I/O** caps throughput and a dead disk loses mail."),
    warn("A fresh server sending lots of mail lands in **spam**. Use dedicated IPs, warm them up over 2 to 6 weeks, split marketing from transactional mail, and sign with SPF and DKIM."),
    qa([
      ["How do you partition email data?", "By `user_id`. Nearly every operation (list, read, search) touches one user, so one shard answers it. The cost is no shared mail across users, which we do not need."],
      ["How do you support unread filtering in Cassandra?", "You cannot filter on a non-key column, so keep two denormalized tables, read and unread, and move the row between them."],
      ["Consistency or availability for the mail store?", "Consistency. A mailbox must never lose or show a stale state; during failover the affected users briefly cannot sync."],
      ["The outgoing queue keeps growing. Why?", "Either a recipient server is down (retry with exponential backoff) or workers are too few (scale consumers). Monitor queue depth."],
    ]),
    drill("5 minutes, no notes: draw the send flow and the receive flow side by side, name what each queue protects against, then write the `emails_by_folder` key (partition and clustering)."),
  ],
});

// ---------------------------------------------------------------- ch 24

S.push({
  id: 'ch24-object-storage',
  title: 'Ch 24 · S3-like Object Storage',
  summary: 'Store huge numbers of immutable blobs cheaply and durably. Metadata store and data store split, small objects packed into big files.',
  tags: ['object storage', 's3', 'blob', 'erasure coding', 'replication', 'multipart upload', 'metadata', 'durability', 'vol 2'],
  source: src('24. S3-like Object Storage'),
  blocks: [
    t("Object storage is a **giant coat check**. You hand over a coat (bytes), get a ticket (object id), and later trade the ticket back. Coats are never altered, only replaced, and the attendant keeps a ledger (metadata) separate from the racks (data). That split is the whole design, just like a UNIX inode pointing at disk blocks."),
    flow([
      ['user:Client'],
      ['lb:Load balancer'],
      ['svc:API service (stateless)'],
      ['svc:IAM', 'db:Metadata store', 'store:Data store'],
    ], 'High-level design', ['PUT / GET /bucket/key', '', 'authz, name to id, bytes'], 'Metadata (small, queried by name) and data (huge, fetched by id) scale independently.'),
    key("**Separate metadata from data**. Pack small objects into big append-only files and look them up by `(file, offset, size)`. Durability comes from **3 replicas or erasure coding** across failure domains."),
    table(['', 'Block', 'File', 'Object'], [
      ['Mutable', 'Yes', 'Yes', 'No (versioning instead)'],
      ['Cost', 'High', 'Medium-high', 'Low'],
      ['Speed', 'Highest', 'Medium-high', 'Low-medium'],
      ['Access', 'SAS / iSCSI / FC', 'NFS, SMB', 'REST API'],
      ['Scale', 'Medium', 'High', 'Vast'],
      ['Good for', 'VMs, databases', 'Shared file systems', 'Blobs, backups, media'],
    ], 'Three kinds of storage'),
    list([
      "**100 PB/year**, durability **6 nines**, availability **4 nines**.",
      "Mix: 20% small (~0.5 MB), 60% medium (~32 MB), 20% large (~200 MB).",
      "At 40% usage that is ≈ **0.68B objects**; 1 KB metadata each ≈ **0.68 TB** of metadata.",
      "A spinning disk does only **100 to 150 random IOPS**, so seeks are the enemy.",
      "Access is **write once, read many**: about 95% of operations are reads.",
    ], 'Numbers to say out loud'),
    flow([
      ['svc:API service'],
      ['svc:Data routing service'],
      ['store:Primary data node'],
      ['store:Secondary node 1', 'store:Secondary node 2'],
    ], 'Data store: the write path', ['bytes', 'node chosen by placement service', 'replicate, ack after both'], 'The **placement service** (5 or 7 nodes on Raft/Paxos) holds the cluster map, gets heartbeats from data nodes, and picks the replica group by consistent hashing on the object id.'),
    text(`
One data node, file /data/c (open for appends; sealed at a few GB)

offset: 0          4096            4126                    9000
        | object A  | object B (30B) | object C (4874B)    | free ...
        +-----------+----------------+---------------------+---------->

object_mapping (SQLite, local to this node; read heavy)
object_id | file_name | start_offset | object_size | checksum
----------+-----------+--------------+-------------+---------
uuid-A    | /data/c   | 0            | 4096        | 9f2c..
uuid-B    | /data/c   | 4096         | 30          | 11ab..
uuid-C    | /data/c   | 4126         | 4874        | 7e01..

Why: one file per object wastes 4 KB blocks and runs out of inodes.
Writes to one file are serial, so give each CPU core its own open file.`, 'How bytes sit on disk'),
    flow([
      ['user:Client'],
      ['svc:API service'],
      ['svc:IAM'],
      ['store:Data store'],
      ['db:Metadata store'],
    ], 'Upload: PUT /bucket-to-share/script.txt', ['PUT + bytes', 'can write?', 'store bytes, get UUID', 'save name, bucket, UUID'], 'Download is the mirror: IAM check, metadata gives the UUID, data store returns the bytes. The "folder" in a key is just a name prefix; there is no real hierarchy.'),
    steps([
      "Clarify: bucket create, object upload/download, versioning, listing; small and huge objects; 100 PB/yr; 6 nines.",
      "State the properties: immutable objects, key-value by URI, write once read many.",
      "Draw API service, IAM, metadata store, data store. Walk upload and download.",
      "Data store: routing service, placement service (Raft), data nodes with primary + 2 secondaries.",
      "Disk layout: append small objects to big files, `object_mapping` table in SQLite on each node.",
      "Durability: replicas or 8+4 erasure coding across racks/DCs, plus checksums per object and per file.",
      "Metadata: shard objects by `hash(bucket_name, object_name)`; denormalized listing table sharded by bucket.",
      "Extras: versioning, multipart upload, garbage collection by compaction.",
    ], 'HLD in 8 steps'),
    table(['', 'Replication (3 copies)', 'Erasure coding (8+4)'], [
      ['Storage overhead', '**200%**', '**50%**'],
      ['Durability', '~6 nines', '~11 nines'],
      ['Read speed', 'Fast: read one copy', 'Slower: gather 8 chunks from many nodes'],
      ['CPU', 'None', 'Compute parity on write and on repair'],
      ['Survives', '2 lost copies', 'Any 4 lost chunks of 12'],
      ['Pick when', 'Latency matters', 'Cost and durability matter'],
    ], 'Durability options'),
    flow([
      ['svc:Data routing service'],
      ['store:8 data chunks (racks 1-8)', 'store:4 parity chunks (racks 9-12)'],
      ['svc:Rebuild any 4 lost chunks'],
    ], 'Erasure coding picture', ['split + compute parity', 'on failure']),
    table(['Shard objects by', 'Result'], [
      ['bucket_id', 'Hot spot: one bucket can hold billions of objects'],
      ['object_id', 'Even load, but queries come by name, so lookups scatter'],
      ['**hash(bucket_name, object_name)**', 'Even load and lookups by name hit one shard. Chosen.'],
    ], 'Sharding the object metadata table'),
    flow([
      ['user:Client'],
      ['svc:Initiate: get uploadId'],
      ['svc:Upload parts 1..N in parallel'],
      ['svc:Complete: uploadId + part numbers + ETags'],
      ['store:Store reassembles object'],
    ], 'Multipart upload for large files', ['', '', 'each part returns an ETag (MD5)', ''], 'A failed part is retried alone. Leftover parts become garbage for the collector.'),
    java(`
// LLD core: one data node. Objects are appended to the open data file and found again
// through a mapping table (SQLite in the book). The API layer maps bucket/name -> objectId.
record Location(String fileId, long offset, int size, long crc) {}

class DataNode {
    static final long MAX_FILE = 2L << 30;                       // seal a file at ~2 GB
    private final Map<UUID, Location> mapping = new HashMap<>();  // object_mapping table
    private RandomAccessFile open;
    private String openId;
    private int seq;

    synchronized UUID put(byte[] data) throws IOException {
        if (open == null || open.length() + data.length > MAX_FILE) roll();
        long offset = open.length();
        open.seek(offset);
        open.write(data);                                         // append only
        open.getFD().sync();                                      // durable before we ack
        UUID id = UUID.randomUUID();
        mapping.put(id, new Location(openId, offset, data.length, crc(data)));
        return id;
    }

    byte[] get(UUID id) throws IOException {
        Location loc;
        synchronized (this) { loc = mapping.get(id); }
        if (loc == null) throw new NoSuchElementException("404");
        try (RandomAccessFile f = new RandomAccessFile(loc.fileId(), "r")) {
            byte[] buf = new byte[loc.size()];
            f.seek(loc.offset());
            f.readFully(buf);
            if (crc(buf) != loc.crc()) throw new IOException("corrupt: read another replica");
            return buf;
        }
    }

    private void roll() throws IOException {
        if (open != null) open.close();
        openId = "/data/file-" + (seq++);
        open = new RandomAccessFile(openId, "rw");
    }

    private static long crc(byte[] b) { CRC32 c = new CRC32(); c.update(b); return c.getValue(); }
}

class ObjectService {                                             // API service
    private final Map<String, UUID> metadata = new ConcurrentHashMap<>(); // "bucket/name" -> id
    private final DataNode node;
    ObjectService(DataNode node) { this.node = node; }

    UUID putObject(String bucket, String name, byte[] data) throws IOException {
        UUID id = node.put(data);                 // 1. bytes first
        metadata.put(bucket + "/" + name, id);    // 2. then make it visible by name
        return id;
    }

    byte[] getObject(String bucket, String name) throws IOException {
        UUID id = metadata.get(bucket + "/" + name);
        if (id == null) throw new NoSuchElementException("404");
        return node.get(id);
    }
}`, 'LLD: put = append + mapping row; get by id'),
    list([
      "**Versioning**: add an `object_version` TIMEUUID column. Each upload is a new row with a new `object_id`.",
      "**Delete with versioning**: insert a **delete marker** version; reads of it return 404.",
      "**Listing by prefix**: sharded metadata makes `LIKE 'abc/%'` a scatter-gather with messy pagination. Fix: a denormalized listing table sharded by bucket.",
      "**Garbage**: lazily deleted objects, orphan parts from failed uploads, corrupt data.",
      "**Compaction**: copy live objects from old file to a new one, swap `object_mapping` in one transaction, delete the old file.",
      "**Correctness**: checksum per object and per file catches silent bit rot that a heartbeat never sees.",
    ], 'Deep dive bullets'),
    warn("Writing metadata **before** the bytes are durable creates names that point at nothing. Store bytes, then publish the name."),
    warn("Three replicas on the same rack are one power failure from zero. Spread copies across **failure domains** (rack, DC, network)."),
    qa([
      ["Why not one file per object?", "Tiny files waste whole 4 KB blocks and exhaust inodes. Packing into multi-GB append-only files fixes both and keeps writes sequential."],
      ["Replication or erasure coding?", "Replication for hot, latency-sensitive data. Erasure coding (8+4) for cold data: 50% overhead instead of 200% and higher durability, but slower reads and more CPU."],
      ["How do you list objects with a prefix fast?", "Keep a separate listing table sharded by bucket so one shard answers the query and pagination stays simple."],
      ["How do you upload a 5 GB file reliably?", "Multipart: initiate for an upload id, send parts in parallel, each returns an ETag, then complete with all ETags so the store reassembles it."],
    ]),
    drill("5 minutes, no notes: draw the data file with three objects and the `object_mapping` rows, then write `put()` and `get()`. Then explain 8+4 erasure coding and its 50% overhead."),
  ],
});

// ---------------------------------------------------------------- ch 25

S.push({
  id: 'ch25-gaming-leaderboard',
  title: 'Ch 25 · Real-time Gaming Leaderboard',
  summary: 'Top 10 and my rank, live, for millions of players. A Redis sorted set does the heavy lifting.',
  tags: ['leaderboard', 'redis', 'sorted set', 'skip list', 'zincrby', 'rank', 'sharding', 'dynamodb', 'vol 2'],
  source: src('25. Real-time Gaming Leaderboard'),
  blocks: [
    t("A live leaderboard is a **ladder that re-sorts itself every time someone scores**. You need two answers fast: who is on the top 10 rungs, and which rung am I on. A SQL `ORDER BY` re-sorts millions of rows per question; a **Redis sorted set** keeps the ladder sorted all the time at O(log n) per update."),
    flow([
      ['user:Player'],
      ['svc:Game service'],
      ['svc:Leaderboard service'],
      ['cache:Redis sorted set (this month)', 'db:MySQL (profiles, match history)'],
    ], 'High-level design', ['win', 'validated +1 (server to server)', 'ZINCRBY / ZREVRANGE / ZREVRANK'], 'Players read top 10 and their rank straight from the leaderboard service. Only the game server may write scores.'),
    key("Use a **sorted set**: `ZINCRBY` to score, `ZREVRANGE 0 9` for top 10, `ZREVRANK` for my rank, all O(log n). **The server writes scores**, never the client. One new key per month."),
    list([
      "**5M DAU, 25M MAU**, 10 matches per player per day.",
      "Average ≈ 50 players/second online; peak ≈ **5x = 250**.",
      "Score updates: 50 × 10 = **500 QPS**, peak **2,500 QPS**. One Redis node is fine.",
      "Top 10 reads: ~once a day per user ≈ **50 QPS**.",
      "Memory: 25M × (24-byte id + 2-byte score) ≈ **650 MB**; double it for skip-list overhead and it still fits easily.",
    ], 'Numbers to say out loud'),
    table(['Command', 'Does', 'Cost'], [
      ['`ZADD key score user`', 'Insert or set a score', 'O(log n)'],
      ['`ZINCRBY key 1 user`', 'Add points (starts at 0)', 'O(log n)'],
      ['`ZREVRANGE key 0 9 WITHSCORES`', 'Top 10, highest first', 'O(log n + m)'],
      ['`ZREVRANK key user`', 'My 0-based position from the top', 'O(log n)'],
      ['`ZREVRANGE key r-4 r+4`', 'The 4 players above and below me', 'O(log n + m)'],
    ], 'The 5 Redis commands you need'),
    text(`
Sorted set = hash map (user -> score)  +  skip list (sorted by score)

Level 3:  1 ---------------------------------------------> 81
Level 2:  1 -------------> 25 -------------> 57 ---------> 81
Level 1:  1 ----> 9 ----> 25 ----> 33 ----> 57 ----> 70 -> 81
Level 0:  1 -> 4 -> 9 -> 17 -> 25 -> 29 -> 33 -> 48 -> 57 -> 70 -> 81

Find 48: ride the top lane, drop down when the next jump overshoots.
64 nodes: ~62 hops on the plain list vs ~11 with the index levels.
Redis also stores span widths on each link, which is how ZRANK stays O(log n).`, 'Why a skip list is fast'),
    table(['', 'SQL table', 'Redis sorted set', 'NoSQL (DynamoDB)'], [
      ['Score update', '`UPDATE score = score + 1`', '`ZINCRBY`, O(log n)', 'Put item, write-sharded key'],
      ['Top 10', 'Index on score + `LIMIT 10`', '`ZREVRANGE 0 9`', 'Query each partition, merge'],
      ['My rank', '`COUNT(*) WHERE score >= mine`: scans, slow', '`ZREVRANK`, O(log n)', 'Hard; show a percentile instead'],
      ['Fits', 'Small games', 'Millions of players, real time', 'Huge write volume, managed'],
    ], 'Where to keep the leaderboard'),
    flow([
      ['svc:Leaderboard service'],
      ['lb:Route by score range'],
      ['cache:Shard 1-100', 'cache:Shard 101-500', 'cache:Shard 501-900', 'cache:Shard 901-1000'],
    ], 'Scaling 100x: fixed (score range) partitions', ['', 'user to shard map in MySQL or cache'], 'Top 10 = ask only the top shard. My rank = rank inside my shard + sizes of all higher shards (size is O(1) per shard). When a score crosses a boundary, move the user.'),
    flow([
      ['svc:Leaderboard service'],
      ['cache:Redis Cluster node 1', 'cache:Redis Cluster node 2', 'cache:Redis Cluster node 3'],
      ['svc:Merge top 10 of each'],
    ], 'Alternative: hash partitions (scatter-gather)', ['ask every node for its top 10', 'sort, keep 10'], 'Gets slower as shards or K grow, and there is no simple way to compute a global rank. The book prefers fixed partitions.'),
    flow([
      ['user:Player'],
      ['lb:AWS API Gateway'],
      ['svc:AWS Lambda functions'],
      ['cache:Redis (ElastiCache)', 'db:MySQL (RDS)'],
    ], 'Serverless version (recommended for a new game)', ['score / leaderboard calls', 'invoke', ''], 'No servers to manage; Lambdas scale on demand.'),
    steps([
      "Clarify: points per win, monthly tournaments, top 10 + my rank (+ 4 above and below), 5M DAU, real time, ties share a rank.",
      "APIs: `POST /v1/scores` (game server only), `GET /v1/scores` (top 10), `GET /v1/scores/{user_id}` (rank).",
      "Flow: client wins, game service validates, leaderboard service updates the store.",
      "Pick storage: SQL rank queries scan; Redis sorted set gives O(log n) for every operation.",
      "One key per month, e.g. `leaderboard_feb_2021`; old months move to history.",
      "Reliability: Redis replica + persistence; MySQL match history can rebuild the set.",
      "Scale 100x: score-range shards (preferred) or Redis Cluster with scatter-gather.",
      "Alternatives: DynamoDB with write sharding and percentiles; serverless with API Gateway + Lambda.",
    ], 'HLD in 8 steps'),
    java(`
// LLD core: a sorted leaderboard like a Redis sorted set.
// TreeSet keeps players ordered (top K, neighbours). A Fenwick tree over scores gives
// rank in O(log maxScore). Players with equal scores share a rank.
class Leaderboard {
    record Entry(String user, int score) {}
    private static final Comparator<Entry> ORDER =
        Comparator.comparingInt(Entry::score).reversed().thenComparing(Entry::user);

    private final Map<String, Integer> scores = new HashMap<>();
    private final TreeSet<Entry> sorted = new TreeSet<>(ORDER);
    private final int[] fenwick;                  // counts of players per score (shifted by 1)
    private final int maxScore;

    Leaderboard(int maxScore) { this.maxScore = maxScore; this.fenwick = new int[maxScore + 2]; }

    synchronized void addScore(String user, int points) {           // ZINCRBY
        Integer old = scores.get(user);
        if (old != null) { sorted.remove(new Entry(user, old)); bump(old, -1); }
        int now = Math.min(maxScore, (old == null ? 0 : old) + points);
        scores.put(user, now);
        sorted.add(new Entry(user, now));
        bump(now, +1);
    }

    synchronized List<Entry> top(int k) {                         // ZREVRANGE 0 k-1
        return sorted.stream().limit(k).toList();
    }

    synchronized int rank(String user) {                          // 1-based, ties share
        Integer s = scores.get(user);
        if (s == null) return -1;
        return 1 + (prefix(maxScore) - prefix(s));                // players strictly above me
    }

    synchronized List<Entry> around(String user, int n) {         // n above, me, n below
        Entry me = new Entry(user, scores.get(user));
        List<Entry> out = new ArrayList<>(sorted.headSet(me, false).descendingSet()
            .stream().limit(n).toList());
        Collections.reverse(out);
        out.addAll(sorted.tailSet(me, true).stream().limit(n + 1).toList());
        return out;
    }

    private void bump(int score, int delta) {
        for (int i = score + 1; i < fenwick.length; i += i & -i) fenwick[i] += delta;
    }
    private int prefix(int score) {                               // players with score <= s
        int sum = 0;
        for (int i = score + 1; i > 0; i -= i & -i) sum += fenwick[i];
        return sum;
    }
}`, 'LLD: add score, top 10, rank, neighbours'),
    warn("Letting the **client** post its own score invites cheating: a proxy can rewrite the request. Scores come from the game server after it validates the match."),
    warn("`TreeSet.headSet(x).size()` looks like a rank but is **O(n)**. Redis gets O(log n) rank from span counts in the skip list; in Java you need an order-statistic tree or a Fenwick tree."),
    tip("Break ties by **who reached the score first**: encode `score` and `-timestamp` together in the sort key."),
    qa([
      ["Why not just MySQL?", "Top 10 is fine with an index and `LIMIT`, but a single user's rank needs a `COUNT(*)` over everyone above them. At millions of users and real time, that is too slow."],
      ["Redis dies. What now?", "Fail over to the replica. If both are gone, replay the MySQL match history (or its WAL) with a script to rebuild the sorted set."],
      ["How do you find my rank with score-range shards?", "`ZREVRANK` inside my shard plus the total size of every higher-score shard. Shard sizes are O(1) to read."],
      ["Should there be a queue between game and leaderboard?", "Only if other consumers (analytics, push notifications) need match results. Otherwise it adds latency for no gain."],
    ]),
    drill("5 minutes, no notes: write the three Redis commands for score, top 10 and rank, draw a 3-level skip list, then explain how score-range sharding answers top 10 and my rank."),
  ],
});

// ---------------------------------------------------------------- ch 26

S.push({
  id: 'ch26-payment-system',
  title: 'Ch 26 · Payment System',
  summary: 'Move money for an e-commerce site through a PSP, exactly once, with a double-entry ledger and nightly reconciliation.',
  tags: ['payment', 'psp', 'stripe', 'idempotency', 'ledger', 'double entry', 'reconciliation', 'retry', 'exactly once', 'vol 2'],
  source: src('26. Payment System'),
  blocks: [
    t("A payment system is a **careful accountant who never trusts the phone line**. It asks a PSP like Stripe to move the money, writes every cent twice in the ledger (one debit, one credit), and checks its books against the bank statement every night. The hard part is not speed (10 TPS) but **never charging twice and never losing a payment**."),
    flow([
      ['user:Buyer clicks Place order'],
      ['svc:Payment service'],
      ['svc:Payment executor'],
      ['ext:PSP (Stripe, Adyen, PayPal)'],
      ['ext:Card schemes (Visa, Mastercard)'],
    ], 'Pay-in flow', ['payment event', 'one call per payment order', 'charge, key = payment_order_id', ''], 'Payment service and executor each store their own state first. A risk check (AML, fraud) runs before money moves.'),
    flow([
      ['svc:Payment service (on success)'],
      ['svc:Wallet', 'svc:Ledger'],
      ['db:Wallet DB (seller balance)', 'db:Ledger DB (append only)'],
    ], 'After the PSP says yes', ['update', 'persist']),
    key("**Idempotency key** = `payment_order_id`, sent to our API and to the PSP so retries never double charge. **Double-entry ledger** so every movement balances to zero. **Reconcile** nightly against the PSP settlement file to catch everything else."),
    list([
      "**1M transactions/day ≈ 10 TPS**. Throughput is not the problem; correctness is.",
      "Amounts are **strings or integer cents**, never `double`.",
      "We never store card numbers: a **PSP-hosted payment page** keeps us out of most PCI scope.",
      "Pay-out (to sellers) mirrors pay-in, often via an accounts-payable provider like Tipalti.",
    ], 'Numbers and facts to say out loud'),
    text(`
payment_events                      payment_orders
-----------------------------       ------------------------------------------
checkout_id      PK                 payment_order_id   PK  (= idempotency key)
buyer_info                          checkout_id        FK -> payment_events
seller_info                         buyer_account
credit_card_info (token only)       amount  (string)   currency
is_payment_done  bool               payment_order_status:
                                      NOT_STARTED -> EXECUTING -> SUCCESS | FAILED
                                    ledger_updated  bool
                                    wallet_updated  bool

Double-entry ledger, one $1 sale:
tx_id | account | debit | credit
------+---------+-------+-------
t-42  | buyer   | $1    |
t-42  | seller  |       | $1        sum(debit) - sum(credit) = 0, always`, 'Data model and ledger'),
    flow([
      ['user:Checkout'],
      ['svc:Payment service'],
      ['ext:PSP: register payment'],
      ['user:PSP-hosted card page'],
      ['ext:PSP charges card'],
      ['svc:Webhook updates payment'],
    ], 'Hosted payment page', ['order info', 'amount + UUID', 'token stored, page opened', 'card details', 'async result'], 'The browser is redirected to our `redirectURL` too, but the **webhook is the source of truth**. If the PSP has no webhooks, poll it.'),
    flow([
      ['svc:Payment executor'],
      ['svc:Classify error'],
      ['q:Retry queue', 'q:Dead-letter queue'],
      ['svc:Retry worker (backoff)', 'user:Engineer inspects'],
    ], 'Handling failed payments', ['failure', 'transient / terminal', ''], 'The stored payment state decides: retry, refund, or give up.'),
    flow([
      ['ext:PSP settlement file (nightly)', 'db:Ledger', 'db:Wallet'],
      ['svc:Reconciliation job'],
      ['svc:Auto-fix known mismatch', 'user:Finance team (manual)'],
    ], 'Reconciliation', ['compare', 'classify'], 'Mismatch types: known and auto-fixable, known but manual, unknown and investigated by hand.'),
    steps([
      "Clarify: e-commerce backend, cards via a PSP, no card storage, one currency, 1M tx/day, pay-in and pay-out, reconciliation required.",
      "API: `POST /v1/payments` with `checkout_id` and a list of payment orders; `GET /v1/payments/{id}`.",
      "Draw pay-in: payment service, executor, PSP, card schemes, then wallet and ledger.",
      "Data: SQL with ACID; `payment_events` and `payment_orders` with a status state machine.",
      "Ledger: double entry, append only.",
      "PSP integration: hosted payment page + webhook; handle hours-long delays (3-D Secure, manual review) with a pending status.",
      "Reliability: retry with exponential backoff, idempotency keys, retry and dead-letter queues, nightly reconciliation.",
      "Consistency + security: read from primary (or Raft-based DB), HTTPS, tokens instead of cards, rate limits.",
    ], 'HLD in 8 steps'),
    table(['Strategy', 'Wait between tries', 'Use when'], [
      ['Immediate', '0', 'Almost never; hammers a sick server'],
      ['Fixed interval', 'Same each time', 'Simple jobs'],
      ['Incremental', '+N each time', 'Mild backoff'],
      ['**Exponential backoff**', '1s, 2s, 4s, 8s... (+ jitter)', 'Default choice; honor `Retry-After`'],
      ['Cancel', 'Stop', 'Terminal error or retry budget used up'],
    ], 'Retry strategies'),
    table(['', 'Synchronous (HTTP)', 'Asynchronous (Kafka)'], [
      ['Latency', 'Long call chains', 'Caller returns fast'],
      ['Failure isolation', 'One slow PSP blocks the user', 'Buffered; consumers retry'],
      ['Coupling', 'Sender knows receivers', 'Many receivers subscribe'],
      ['Spikes', 'No buffer', 'Queue absorbs them'],
      ['Verdict', 'Simple, small systems', 'Payments: one event fans out to wallet, ledger, analytics'],
    ], 'How services talk'),
    java(`
// LLD core: an idempotent payment. The DB unique key on payment_order_id stops double submits,
// the same key goes to the PSP on every retry, and success writes a balanced ledger pair.
enum Status { NOT_STARTED, EXECUTING, SUCCESS, FAILED }
record LedgerEntry(String txId, String account, long debitCents, long creditCents) {}
class TransientException extends Exception {}   // timeout, 5xx: safe to retry
class TerminalException extends Exception {}    // card declined: never retry

interface Psp { void charge(String idempotencyKey, long cents) throws TransientException, TerminalException; }

class PaymentService {
    private final Map<String, Status> orders = new ConcurrentHashMap<>();  // PK payment_order_id
    private final List<LedgerEntry> ledger = new ArrayList<>();
    private final Psp psp;
    PaymentService(Psp psp) { this.psp = psp; }

    Status pay(String paymentOrderId, String buyer, String seller, long cents)
            throws InterruptedException {
        // INSERT ... fails on duplicate key -> return what we already have.
        Status prior = orders.putIfAbsent(paymentOrderId, Status.EXECUTING);
        if (prior != null) return prior;

        long delayMs = 200;
        for (int attempt = 1; attempt <= 5; attempt++) {
            try {
                psp.charge(paymentOrderId, cents);       // PSP dedupes on the same key
                recordDoubleEntry(paymentOrderId, buyer, seller, cents);
                orders.put(paymentOrderId, Status.SUCCESS);
                return Status.SUCCESS;
            } catch (TransientException e) {
                Thread.sleep(delayMs + ThreadLocalRandom.current().nextLong(delayMs)); // jitter
                delayMs = Math.min(delayMs * 2, 30_000); // exponential backoff, capped
            } catch (TerminalException e) {
                break;
            }
        }
        orders.put(paymentOrderId, Status.FAILED);       // + publish to dead-letter queue;
        return Status.FAILED;                            // reconciliation catches late successes
    }

    // In SQL this is one transaction: both rows or neither.
    private synchronized void recordDoubleEntry(String txId, String buyer, String seller, long cents) {
        ledger.add(new LedgerEntry(txId, buyer, cents, 0));   // debit buyer
        ledger.add(new LedgerEntry(txId, seller, 0, cents));  // credit seller
    }

    synchronized boolean ledgerBalanced() {
        long debit = 0, credit = 0;
        for (LedgerEntry e : ledger) { debit += e.debitCents(); credit += e.creditCents(); }
        return debit == credit;
    }
}`, 'LLD: idempotent pay + double entry + backoff'),
    warn("A **timeout is not a failure**. The PSP may have charged the card and the reply got lost. Retry with the **same** idempotency key, and let reconciliation settle anything still unknown."),
    warn("Never use `double` for money: `0.1 + 0.2 != 0.3`. Use integer cents or a decimal string."),
    tip("Exactly once = **at least once** (retries) + **at most once** (idempotency). Say this equation; interviewers love it."),
    qa([
      ["How do you stop a double charge when the user clicks Pay twice?", "The client sends an idempotency key (UUID). The server inserts it under a unique constraint; the second insert fails and the server returns the first result."],
      ["The PSP charged the card but our ledger update crashed. Then what?", "The payment order shows `ledger_updated = false`; a background job retries it. Nightly reconciliation against the settlement file is the final safety net."],
      ["Why a hosted payment page?", "Card data never touches our servers, which avoids most PCI DSS burden. We only hold a token."],
      ["How do you keep replicas from showing stale payment status?", "Serve reads and writes from the primary and keep replicas for failover, or use a Raft-based DB like CockroachDB or YugabyteDB."],
    ]),
    drill("5 minutes, no notes: draw pay-in end to end, write the `payment_order_status` state machine, then write `pay()` with the idempotency check, the backoff loop and the two ledger rows."),
  ],
});

// ---------------------------------------------------------------- ch 27

S.push({
  id: 'ch27-digital-wallet',
  title: 'Ch 27 · Digital Wallet',
  summary: 'Transfer balance between wallets at 1M TPS, atomically and auditably. Distributed transactions, then event sourcing on Raft.',
  tags: ['digital wallet', 'balance transfer', '2pc', 'tcc', 'saga', 'event sourcing', 'cqrs', 'raft', 'vol 2'],
  source: src('27.  Digital Wallet'),
  blocks: [
    t("A digital wallet is a **bank passbook you can never erase**. Instead of overwriting a balance, you append every change (\"A -1\", \"C +1\") to a log, and the balance is just the log added up. That makes it auditable: **replay the log and you get the exact balance at any moment**. The rest of the chapter is making that log fast (1M TPS) and safe (Raft)."),
    flow([
      ['user:Client'],
      ['lb:Reverse proxy'],
      ['svc:Saga / TC-C coordinator'],
      ['svc:Raft group 1 (account A)', 'svc:Raft group 2 (account C)'],
      ['svc:Read state machines (CQRS)'],
    ], 'Final design', ['transfer', 'tracks the transaction', 'A-1 then C+1', 'events'], 'Read state machines **push** results back to the coordinator and proxy, so the user sees the update in near real time without polling.'),
    key("Atomic cross-shard transfer needs a **distributed transaction** (2PC, TC/C or Saga). Auditability needs **event sourcing**: commands become immutable events, state is derived. Durability of the event log comes from **Raft**."),
    list([
      "Target: **1M transfers/second**, 99.99% availability, transactional, reproducible.",
      "Each transfer has 2 legs, so the store sees **2M ops/second**.",
      "A cloud SQL node does ~1,000 TPS: that is **2,000 nodes**. At 10,000 TPS per node it is 200.",
      "Goal of the deep dive: raise per-node TPS so you need fewer nodes.",
      "API: `POST /v1/wallet/balance_transfer` with `from_account`, `to_account`, `amount` (string), `currency`, `transaction_id` (idempotency key).",
    ], 'Numbers to say out loud'),
    flow([
      ['user:Client'],
      ['svc:Wallet service (stateless)'],
      ['cache:Redis shard 1', 'cache:Redis shard 2', 'cache:Redis shard 3'],
    ], 'Attempt 1: sharded in-memory balances', ['transfer', 'hash(account) % N'], 'ZooKeeper holds the shard count and addresses. Fast, but **not durable**, and A-1 and C+1 on two shards are **not atomic**.'),
    table(['', '2PC', 'TC/C', 'Saga'], [
      ['Phase 1', 'Prepare: locks held, nothing committed', 'Try: each side commits a local tx (A -1, C no-op)', 'Run step 1, then step 2...'],
      ['Success', 'Commit all', 'Confirm: new local tx (C +1)', 'Done'],
      ['Failure', 'Abort all', 'Cancel: compensate (A +1)', 'Run compensations backwards'],
      ['Order', 'Any', 'Any, **parallel**', 'Linear only'],
      ['Weak spot', 'Locks; coordinator is a SPOF', 'Brief inconsistent state; business logic heavy', 'Slower (sequential); brief inconsistency'],
      ['Lives in', 'Database', 'Application', 'Application'],
    ], 'Distributed transactions compared'),
    text(`
TC/C for "move $1 from A to C"

Phase    | Account A (DB 1)    | Account C (DB 2)
---------+---------------------+---------------------
Try      | balance -1  (commit)| NOP
Confirm  | NOP                 | balance +1 (commit)
Cancel   | balance +1  (undo)  | NOP

Rule: DEDUCT FIRST, ADD LATER. Try "C +1" first and C could spend money
that A never sends. Doing both in Try is not atomic without 2PC.

Phase status table (stored with the shard, updated atomically):
tx_id | try status (not sent / sent / replied) | phase 2 (confirm|cancel) | phase 2 status | out_of_order
Out of order: a Cancel can arrive before its Try. Set the flag; a later Try sees it and fails.`, 'TC/C, drawn'),
    flow([
      ['q:Command queue (FIFO, e.g. Kafka)'],
      ['svc:State machine: validate'],
      ['q:Event log (append only)'],
      ['svc:State machine: apply'],
      ['db:State: account -> balance'],
    ], 'Event sourcing', ['transfer A to C $1', 'valid -> events A-1, C+1', '', 'update'], 'Commands can fail and may involve IO. Events are **facts**: deterministic to apply, never rejected.'),
    text(`
Event log (immutable)                   State after each event
seq | tx  | account | delta              A     C
----+-----+---------+------             ----  ----
1   | d-1 | A       | +5                  5     0
2   | t-7 | A       | -1                  4     0
3   | t-7 | C       | +1                  4     1
4   | t-9 | C       | -1                  4     0
5   | t-9 | A       | +1                  5     0

Balance at any time  = replay events 1..k.
Prove a code change  = replay all events with old and new code, compare.
Snapshot every N events so recovery starts from the snapshot, not from seq 1.`, 'Replay, drawn'),
    flow([
      ['q:Commands (mmap, local disk)'],
      ['svc:State machine (single node)'],
      ['q:Events (mmap, local disk)'],
      ['db:State in RocksDB (LSM)', 'store:Snapshots to HDFS'],
    ], 'High-performance event sourcing', ['', 'append', 'apply'], 'Local append-only files beat a network hop to Kafka. `mmap` keeps recent data in memory. RocksDB is write-optimized.'),
    flow([
      ['user:Commands'],
      ['svc:Raft leader'],
      ['svc:Follower 1', 'svc:Follower 2'],
    ], 'Making the event log reliable', ['', 'replicate events in order'], 'Only the **event list** must be replicated: state and snapshots can be rebuilt from it, and commands cannot (they are not deterministic). Majority up = system up.'),
    steps([
      "Clarify: wallet-to-wallet transfers only, 1M TPS, 99.99%, transactional, must be able to replay history.",
      "API: one `balance_transfer` endpoint with an idempotency `transaction_id`.",
      "Attempt 1: Redis `map<account, balance>` sharded by hash; show it is not atomic or durable.",
      "Attempt 2: sharded SQL + distributed transaction: 2PC, then TC/C, then Saga; pick TC/C for parallel low latency.",
      "Add event sourcing for audits: command -> validate -> event -> state; CQRS read models for queries.",
      "Speed: local mmap files instead of Kafka, RocksDB state, snapshots.",
      "Reliability: replicate the event log with Raft.",
      "Scale: many Raft groups (shards), a Saga/TC-C coordinator across them, reverse proxy + push for responses.",
    ], 'HLD in 8 steps'),
    table(['', 'CRUD (store current state)', 'Event sourcing (store changes)'], [
      ['Write', 'Overwrite balance', 'Append an event'],
      ['History', 'Lost unless you add audit tables', 'Built in; immutable'],
      ['Balance at time T', 'Hard', 'Replay to T'],
      ['Prove new code is correct', 'Hard', 'Replay with both versions, compare'],
      ['Cost', 'Simple', 'More moving parts; needs snapshots'],
    ], 'Event sourcing vs CRUD'),
    java(`
// LLD core: event-sourced wallet. Command -> validate -> events -> state. Replay rebuilds state.
record TransferCommand(String txId, String from, String to, long cents) {}
record BalanceChanged(long seq, String txId, String account, long delta) {}   // an event (a fact)

class WalletStateMachine {
    private final Map<String, Long> balances = new HashMap<>();       // state (derived)
    private final List<BalanceChanged> eventLog = new ArrayList<>();  // source of truth; Raft-replicated
    private final Set<String> appliedTx = new HashSet<>();
    private long seq;

    // Commands may be rejected. Events never are.
    synchronized List<BalanceChanged> handle(TransferCommand c) {
        if (appliedTx.contains(c.txId())) return List.of();               // idempotent replay
        if (c.cents() <= 0 || c.from().equals(c.to())) return List.of();  // invalid
        if (balance(c.from()) < c.cents()) return List.of();              // insufficient funds
        List<BalanceChanged> events = List.of(
            new BalanceChanged(++seq, c.txId(), c.from(), -c.cents()),   // deduct first
            new BalanceChanged(++seq, c.txId(), c.to(), +c.cents()));
        for (BalanceChanged e : events) { eventLog.add(e); apply(e); }
        return events;
    }

    synchronized void deposit(String txId, String account, long cents) {
        if (appliedTx.contains(txId) || cents <= 0) return;
        BalanceChanged e = new BalanceChanged(++seq, txId, account, cents);
        eventLog.add(e);
        apply(e);
    }

    // Pure and deterministic: no clock, no IO, no randomness.
    private void apply(BalanceChanged e) {
        balances.merge(e.account(), e.delta(), Long::sum);
        appliedTx.add(e.txId());
    }

    // Rebuild the state as it was right after event upToSeq.
    static WalletStateMachine replay(List<BalanceChanged> log, long upToSeq) {
        WalletStateMachine m = new WalletStateMachine();
        for (BalanceChanged e : log) {
            if (e.seq() > upToSeq) break;
            m.apply(e);
            m.eventLog.add(e);
            m.seq = e.seq();
        }
        return m;
    }

    synchronized long balance(String account) { return balances.getOrDefault(account, 0L); }
    synchronized List<BalanceChanged> log() { return List.copyOf(eventLog); }
}`, 'LLD: event-sourced wallet with replay'),
    warn("The state machine must be **deterministic**. Reading the clock, calling an API or using random numbers inside `apply` breaks replay: you would get a different balance the second time."),
    warn("Replicating **commands** instead of events is wrong: commands carry IO and randomness, so replaying them can produce different events. Replicate the event log."),
    tip("Polling for the result kills the read side. Put a **reverse proxy** in front that sends commands and receives **pushed** results for many users at once."),
    qa([
      ["2PC, TC/C or Saga for a wallet?", "TC/C if latency matters: its steps can run in parallel. Saga (orchestrated) if the flow is a strict sequence. 2PC holds locks across DBs and its coordinator is a single point of failure."],
      ["In TC/C, why deduct before adding?", "During the gap between phases, accounts are briefly inconsistent. If you add first, the receiver could spend money that later gets cancelled."],
      ["How do you answer an auditor asking for last March's balance?", "Replay the immutable event log up to that point, starting from the nearest snapshot."],
      ["Why Raft on the event log?", "It keeps the log identical and in the same order on a majority of nodes, so a leader crash loses nothing and a follower takes over."],
    ]),
    drill("5 minutes, no notes: draw command queue -> state machine -> event log -> state, write `handle()` and `replay()`, then fill in the TC/C Try/Confirm/Cancel table for A -> C."),
  ],
});

// ---------------------------------------------------------------- ch 28

S.push({
  id: 'ch28-stock-exchange',
  title: 'Ch 28 · Stock Exchange',
  summary: 'Match buy and sell limit orders in microseconds, fairly and deterministically. Sequencer, in-memory order book, one big server.',
  tags: ['stock exchange', 'matching engine', 'order book', 'sequencer', 'limit order', 'low latency', 'mmap', 'market data', 'vol 2'],
  source: src('28. Stock Exchange'),
  blocks: [
    t("A stock exchange is a **matchmaker with two queues per price**. Buyers line up at the prices they will pay, sellers at the prices they will accept, and whenever the best buyer meets the best seller a trade happens, first come first served. Everything else (sequencer, one big server, mmap) exists to do that **in microseconds and in the exact same order every time**."),
    flow([
      ['user:Trader'],
      ['ext:Broker (Robinhood, Fidelity)'],
      ['lb:Client gateway'],
      ['svc:Order manager (risk check, wallet)'],
      ['q:Sequencer'],
      ['svc:Matching engine (order book)'],
    ], 'Trading flow: the critical path', ['order', 'REST / FIX', 'auth, validate, rate limit', 'stamp seq id', 'match'], 'Fills come back the same way: matching engine -> sequencer -> order manager -> gateway -> broker. Off the critical path: the **market data publisher** (candlesticks, order book for data service) and the **reporter** (orders and executions to a DB for compliance).'),
    key("The **sequencer** stamps every order and fill with a sequence id, so the **matching engine is deterministic** and can be replayed. Order book = price levels of **FIFO queues**. For microsecond latency, put the critical path on **one server** talking over mmap."),
    list([
      "**100 symbols, 1B orders/day**, trading 09:30 to 16:00 (6.5 h).",
      "QPS = 1B / (6.5 × 3,600) ≈ **43,000**. Peak ≈ 5x ≈ **215,000** (the open is busiest).",
      "Availability **99.99%** = about 8.6 seconds of downtime per day.",
      "Latency target: **tens of microseconds**, and watch p99, not the average.",
      "Only limit orders, place and cancel; simple risk check (e.g. max 1M shares of AAPL per user per day).",
    ], 'Numbers to say out loud'),
    text(`
Order book for AAPL (L2 view: price levels; L3 also shows every queued order)

        ASKS (sellers)  best = lowest
        100.13 | 1,200  [o9 500][o12 700]
        100.12 |   800  [o4 300][o7 500]
        100.11 |   400  [o2 400]            <- best ask
   -------------------------------  spread = 0.01
        100.10 |   600  [o1 100][o5 500]    <- best bid
        100.09 | 1,500  [o3 1000][o8 500]
        100.08 |   900  [o6 900]
        BIDS (buyers)  best = highest

New BUY limit 100.12 qty 1,000:
  fills o2 400 @100.11, then o4 300 + o7 300 @100.12 (FIFO), done.
  o7 keeps 200 at 100.12; best ask is now 100.12.`, 'The order book, drawn'),
    table(['Level', 'Shows', 'Used by'], [
      ['L1', 'Best bid and best ask with sizes', 'Most retail apps'],
      ['L2', 'Several price levels with total size each', 'Active traders'],
      ['L3', 'Every price level and each queued order', 'Pros, market makers'],
    ], 'Market data tiers'),
    flow([
      ['svc:Matching engine'],
      ['svc:Market data publisher', 'svc:Reporter'],
      ['svc:Data service (candles, L1/L2/L3)', 'db:Orders + executions DB'],
      ['ext:Brokers subscribe'],
    ], 'Market data and reporting flows (off the critical path)', ['execution stream', 'build / write', 'multicast']),
    flow([
      ['lb:Client gateway (FIX)'],
      ['svc:Order manager'],
      ['q:Sequencer (single writer)'],
      ['q:mmap event store in /dev/shm'],
      ['svc:Matching engine', 'svc:Market data publisher', 'svc:Reporter'],
    ], 'Low-latency version: one server, event sourced', ['', 'NewOrderEvent', 'sequenced events', 'subscribe'], 'No network hops and no disk on the hot path: `/dev/shm` is shared memory. Each component runs an **application loop pinned to one CPU core**: no context switches, no locks.'),
    flow([
      ['svc:Primary matching engine'],
      ['q:Replicated event store (reliable UDP)'],
      ['svc:Hot standby (replays, does not publish)', 'svc:Warm server in another DC'],
    ], 'High availability', ['events', 'same order, same state'], 'Heartbeats detect a dead primary. Raft elects the new leader. Start with manual failover until you trust the automation.'),
    steps([
      "Clarify: stocks only, limit orders, place + cancel, normal hours, 100 symbols, 1B orders/day, risk checks, funds withheld for open orders.",
      "Three flows: trading (critical path), market data, reporting. Draw broker -> gateway -> order manager -> sequencer -> matching engine.",
      "APIs: `POST /v1/order`, `GET /execution`, `GET /marketdata/orderBook/L2`, `GET /marketdata/candles`.",
      "Data: product, order, execution; order book (price levels of FIFO doubly linked lists + order map); candlesticks in ring buffers.",
      "Matching: FIFO within a price level, best price first; every order and fill sequenced.",
      "Latency: one server, mmap event bus, pinned application loops, no logging on the hot path.",
      "Availability: hot standby replaying the same events, warm servers in other DCs, Raft leader election.",
      "Fairness + safety: multicast market data, colocation as a paid service, DDoS defenses on public endpoints.",
    ], 'HLD in 8 steps'),
    table(['Technique', 'What it removes'], [
      ['One big server for the critical path', 'Network hops (ms -> µs)'],
      ['mmap file in `/dev/shm` as the event bus', 'Disk I/O and socket copies'],
      ['Application loop pinned to a core', 'Context switches and lock contention'],
      ['No logging on the hot path', 'Extra work per order'],
      ['Pre-allocated ring buffers', 'Allocation and GC pauses (p99 spikes)'],
      ['Cache-line padding on sequence numbers', 'False sharing between cores'],
    ], 'How exchanges get to microseconds'),
    java(`
// LLD core: limit order book with FIFO queues per price level and a matching engine.
// LinkedHashMap per level = FIFO order + O(1) cancel by id (the book's doubly linked list).
enum Side { BUY, SELL }

class Order {
    final long id; final Side side; final long price; long remaining;   // price in ticks
    Order(long id, Side side, long price, long qty) {
        this.id = id; this.side = side; this.price = price; this.remaining = qty;
    }
}
record Fill(long buyOrderId, long sellOrderId, long price, long qty) {}

class PriceLevel {
    final long price; long totalVolume;
    final LinkedHashMap<Long, Order> queue = new LinkedHashMap<>();
    PriceLevel(long price) { this.price = price; }
}

class OrderBook {
    private final TreeMap<Long, PriceLevel> bids = new TreeMap<>(Comparator.reverseOrder()); // best = highest
    private final TreeMap<Long, PriceLevel> asks = new TreeMap<>();                          // best = lowest
    private final Map<Long, Order> orderMap = new HashMap<>();
    private long nextSeq = 1;

    List<Fill> onNewOrder(long seq, Order o) {
        if (seq != nextSeq) throw new IllegalStateException("out of order, want " + nextSeq);
        nextSeq++;
        List<Fill> fills = new ArrayList<>();
        TreeMap<Long, PriceLevel> other = o.side == Side.BUY ? asks : bids;

        while (o.remaining > 0 && !other.isEmpty()) {
            PriceLevel best = other.firstEntry().getValue();
            boolean crosses = o.side == Side.BUY ? best.price <= o.price : best.price >= o.price;
            if (!crosses) break;
            Iterator<Order> it = best.queue.values().iterator();
            while (o.remaining > 0 && it.hasNext()) {          // FIFO: oldest first
                Order resting = it.next();
                long qty = Math.min(o.remaining, resting.remaining);
                o.remaining -= qty;
                resting.remaining -= qty;
                best.totalVolume -= qty;
                fills.add(o.side == Side.BUY
                    ? new Fill(o.id, resting.id, best.price, qty)  // trade at the resting price
                    : new Fill(resting.id, o.id, best.price, qty));
                if (resting.remaining == 0) { it.remove(); orderMap.remove(resting.id); }
            }
            if (best.queue.isEmpty()) other.pollFirstEntry();
        }

        if (o.remaining > 0) {                                  // rest the leftover
            TreeMap<Long, PriceLevel> own = o.side == Side.BUY ? bids : asks;
            PriceLevel lvl = own.computeIfAbsent(o.price, PriceLevel::new);
            lvl.queue.put(o.id, o);                             // back of the queue
            lvl.totalVolume += o.remaining;
            orderMap.put(o.id, o);
        }
        return fills;
    }

    boolean cancel(long orderId) {
        Order o = orderMap.remove(orderId);
        if (o == null) return false;                            // already filled or unknown
        TreeMap<Long, PriceLevel> own = o.side == Side.BUY ? bids : asks;
        PriceLevel lvl = own.get(o.price);
        lvl.queue.remove(orderId);
        lvl.totalVolume -= o.remaining;
        if (lvl.queue.isEmpty()) own.remove(o.price);
        return true;
    }

    Long bestBid() { return bids.isEmpty() ? null : bids.firstKey(); }
    Long bestAsk() { return asks.isEmpty() ? null : asks.firstKey(); }
}`, 'LLD: order book + matching engine'),
    list([
      "**Candlestick**: open, close, high, low, volume per interval. Kept in pre-allocated **ring buffers**; old sticks go to disk.",
      "Real-time analytics in an in-memory columnar DB (e.g. KDB); historical DB after market close.",
      "**Fairness**: multicast over reliable UDP so all subscribers get market data at the same moment.",
      "**Colocation**: brokers rent servers in the exchange's data center; a paid low-latency tier.",
      "**DDoS**: isolate public from private services, cache rarely-changing data, use cacheable URLs like `/data/recent` over `?from=&to=`, allow/block lists, rate limits.",
    ], 'Deep dive bullets'),
    warn("Matching by **arrival time on the wire** is not deterministic: two replicas could disagree. Match by **sequence id** from the sequencer; then any replica replaying the same events reaches the same book."),
    warn("Garbage collection pauses in Java show up as **p99 latency spikes**. Pre-allocate (ring buffers, object pools) and watch p99 and p99.99, not the average."),
    qa([
      ["Why one big server instead of microservices?", "Every network hop costs tens to hundreds of microseconds. Putting gateway, order manager, sequencer and matching engine on one box with an mmap bus cuts end-to-end latency from milliseconds to microseconds."],
      ["What does the sequencer buy you?", "Fairness (strict order), fast recovery (replay events by sequence id), and exactly-once processing (gaps and duplicates are detectable)."],
      ["How does the order book make add, match and cancel O(1)?", "Each price level is a doubly linked FIFO list: add at the tail, match from the head, and cancel via an order-id map that points straight at the node."],
      ["How do you survive the matching engine dying?", "A hot standby consumes the same sequenced events and holds the same state but does not publish. On a missed heartbeat it becomes leader (Raft election) and starts publishing."],
    ]),
    drill("5 minutes, no notes: draw the trading flow with numbered steps, draw an order book with 3 bid and 3 ask levels, then walk a crossing buy order through it and write `onNewOrder()`."),
  ],
});

export default S;
