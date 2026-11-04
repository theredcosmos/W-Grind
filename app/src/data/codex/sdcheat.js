// Codex tab: System Design Cheat Sheet. Condensed, interview-focused layer on top of the LLD and HLD tabs.
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
const qa = (pairs, title) => ({ type: 'qa', ...(title && { title }), items: pairs.map(([q, a]) => ({ q, a })) });

const S = [];

// ---------------------------------------------------------------- 1. LLD round

S.push({
  id: 'clear-lld',
  title: 'How to clear an LLD round',
  summary: 'What gets graded, a minute-by-minute plan, the order to write things, and hire signals.',
  tags: ['lld', 'rubric', 'interview', 'time budget', 'machine coding', 'hire'],
  blocks: [
    t("LLD is graded on clean modelling, not on finishing every feature. A small design that is correct, extensible and explained beats a big one that is tangled. Deep dive: LLD › How an LLD round works."),
    table(['Signal', 'What good looks like', 'What fails'], [
      ['Requirement gathering', "Asks 4-6 sharp questions, writes a scoped list, names what is out of scope", 'Starts coding in minute 1; builds features nobody asked for'],
      ['Entity modelling', 'Nouns become classes, types and states become enums, clear ownership', 'God class `ParkingLotManager` doing everything; strings for states'],
      ['Responsibilities (SRP)', 'Each class has one reason to change; service vs model vs repository split', 'Models that print, save to DB and compute prices at once'],
      ['Extensibility (OCP)', 'New vehicle type or pricing rule = new class, no edits to old ones', '`if (type == CAR) ... else if (type == BIKE)` chains everywhere'],
      ['Patterns', 'Uses 1-3 patterns because a requirement needs them, and says why', 'Forces 6 patterns in; cannot explain why Singleton'],
      ['Code quality', 'Readable names, small methods, interfaces at seams, immutability where possible', 'Public mutable fields, 80-line methods, magic numbers'],
      ['Concurrency', 'Spots the shared resource (spot, seat, balance) and protects it', 'Ignores two users booking the same seat'],
      ['Error handling', 'Custom exceptions for domain errors, validates input at the edge', 'Returns null or -1 for everything; swallows exceptions'],
      ['Communication', 'Thinks aloud, checks in, adapts to hints', 'Silent for 10 minutes; argues with the interviewer'],
      ['Working code (machine coding)', 'Runs end to end with a small demo in `main`', 'Half-written classes, nothing compiles'],
    ], 'The rubric (what interviewers actually score)'),
    table(['Minute', '45-minute round', '60-minute round'], [
      ['0-5', 'Clarify scope, actors, top 3 use cases', 'Clarify scope, actors, top 4 use cases, constraints'],
      ['5-10', 'List entities, enums, relationships', 'Entities, enums, relationships, write them as a class list'],
      ['10-15', 'Interfaces + key method signatures', 'Class diagram in text, mark patterns'],
      ['15-30', 'Code core models + one service + main flow', 'Interfaces, then models, then services'],
      ['30-38', 'Concurrency + error cases on the critical path', 'Main flow working end to end with demo'],
      ['38-45', 'Walk through a scenario, extensions, questions', 'Concurrency + exceptions (45-52)'],
      ['52-60', '-', 'Extension follow-up, trade-offs, questions'],
    ], 'Minute-by-minute plan'),
    steps([
      'Requirements list (in scope / out of scope).',
      'Actors and use cases (who does what).',
      'Enums: types and states (`VehicleType`, `SpotStatus`, `BookingStatus`).',
      'Entities with fields only (no methods yet).',
      'Interfaces at the variation points (`PricingStrategy`, `PaymentProcessor`).',
      'Relationships: has-a, is-a, multiplicity (one lot has many floors).',
      'Service classes that orchestrate use cases.',
      'Repository interfaces for storage (in-memory impl).',
      'Custom exceptions.',
      'Main flow code + a tiny demo.',
    ], 'The exact order to draw / write'),
    table(['Hire signals', 'No-hire signals'], [
      ['Drives the session; interviewer rarely has to prompt', 'Waits to be told every next step'],
      ['Names the pattern and the requirement that justified it', 'Pattern soup with no reasons'],
      ['Extension request takes 2 minutes because seams already exist', 'Extension request means rewriting half the code'],
      ['Spots the race condition unprompted', 'Says "we can add synchronized everywhere"'],
      ['Code compiles in their head: types, generics, visibility right', 'Pseudo-code dressed as Java'],
      ['Admits a weakness and proposes the fix', 'Defends a bad choice after a hint'],
    ], 'Hire vs no-hire'),
    key("Enums + interfaces + one service + one repository + exceptions. If those five exist and the main flow runs, you are above the bar."),
    warn("Do not spend 20 minutes on a perfect UML diagram. A text class list is enough; the code is the diagram."),
    drill("15 minutes: set a timer and run only minutes 0-15 of the plan for Parking Lot. Output: requirements list, enums, entity list, two interfaces. Compare against LLD › Problem: Parking Lot."),
  ],
});

// ---------------------------------------------------------------- 2. HLD round

S.push({
  id: 'clear-hld',
  title: 'How to clear an HLD round',
  summary: 'Rubric, minute-by-minute plan, how to drive, the 10x question, and level expectations.',
  tags: ['hld', 'rubric', 'interview', 'time budget', 'system design', 'levels', 'hire'],
  blocks: [
    t("HLD is graded on structure and trade-off reasoning. The interviewer wants to see you turn a vague prompt into a working design, then go deep where it hurts. Deep dive: HLD › How an HLD round works."),
    table(['Signal', 'What good looks like', 'What fails'], [
      ['Scoping', 'Pins 3-5 functional + 3-4 non-functional requirements in 5 minutes', 'Designs all of Twitter including ads and DMs'],
      ['Estimation', 'Rough QPS, storage, bandwidth, and says what each number decides', 'Ten minutes of arithmetic with no conclusion'],
      ['API + data model', 'Clean endpoints, entities with keys, DB chosen by access pattern', 'Skips API; picks MongoDB "because it scales"'],
      ['High-level design', 'Simple end-to-end path first, every requirement covered', 'Starts with Kafka, Redis and 12 microservices'],
      ['Deep dive', 'Goes 2-3 levels deep on the hard part (hot keys, fan-out, consistency)', 'Stays shallow on everything'],
      ['Trade-offs', 'Says option A vs B and why A here', 'Presents choices as facts'],
      ['Reliability', 'Names SPOFs, replication, retries, idempotency, monitoring', 'Assumes nothing ever fails'],
      ['Communication', 'Drives, checks in at milestones, uses the board neatly', 'Monologue or waits for questions'],
    ], 'The rubric'),
    table(['Minute (45)', 'Minute (60)', 'Phase', 'Output'], [
      ['0-5', '0-6', 'Requirements', 'Functional list, non-functional list, out of scope'],
      ['5-9', '6-11', 'Estimates', 'Read/write QPS, storage/year, peak factor'],
      ['9-13', '11-16', 'API', '3-6 endpoints with params'],
      ['13-17', '16-22', 'Data model', 'Tables / documents, keys, DB choice'],
      ['17-27', '22-35', 'High-level design', 'Boxes and arrows, walk one request through'],
      ['27-40', '35-52', 'Deep dives', '2-3 hard parts, each with a trade-off'],
      ['40-45', '52-60', 'Wrap-up', 'Bottlenecks, failure modes, monitoring, next steps'],
    ], 'Minute-by-minute plan'),
    list([
      'Announce the plan: "I will do requirements, estimates, API, data model, design, then deep dives. Stop me if you want to go elsewhere."',
      'Close each phase out loud: "That covers the API. Moving to the data model."',
      'Offer the deep-dive menu: "The hard parts here are X and Y. Which one do you want?"',
      'If they redirect you, follow immediately. They are telling you where the points are.',
      'Keep a "parking lot" corner on the board for things you will come back to.',
    ], 'How to drive the conversation'),
    steps([
      'Re-estimate: which number grows 10x (QPS, storage, connections)?',
      'Find the first thing that breaks: usually the DB write path or one hot key.',
      'Stateless tier: add instances behind the LB (autoscale). Easy, say it fast.',
      'Reads: add cache / read replicas / CDN.',
      'Writes: shard by a key that spreads load; queue to smooth bursts.',
      'Hot keys: replicate the key, split counters, or cache at the edge.',
      'Say what you would monitor to know you are near the limit.',
    ], 'Handling "what if traffic grows 10x?"'),
    table(['Level', 'Expected'], [
      ['SDE-1 / new grad', 'Clean basic design, knows building blocks, can estimate, follows hints well. Depth on 1 area.'],
      ['SDE-2', 'Drives the round, picks DBs and caches with reasons, handles scaling and failure, depth on 2 areas.'],
      ['Senior / SDE-3', 'Owns ambiguity, spots the real bottleneck early, discusses consistency, cost, ops, migration, and team trade-offs. Depth anywhere asked.'],
    ], 'What each level must show'),
    table(['Hire signals', 'No-hire signals'], [
      ['Simple design first, evolves with reasons', 'Over-engineered from minute one'],
      ['Numbers drive decisions ("1M writes/s, one DB cannot, shard")', 'Numbers computed then ignored'],
      ['Names failure modes and mitigations unprompted', 'Happy path only'],
      ['Comfortable saying "it depends on X; if X then A"', 'Buzzwords with no mechanism'],
      ['Adjusts design when constraint changes', 'Stuck on the first idea'],
    ], 'Hire vs no-hire'),
    key("Make it work, then make it scale. A complete simple design plus one strong deep dive beats a half-drawn perfect one."),
    drill("20 minutes: pick URL Shortener. Do only phases 1-3 (requirements, estimates, API) on paper in 12 minutes. Then spend 8 minutes listing the 3 deep-dive options you would offer."),
  ],
});

// ---------------------------------------------------------------- 3. LLD clarifying

S.push({
  id: 'clarify-lld',
  title: 'Clarifying questions: LLD',
  summary: 'The questions to ask before writing a class, and how each answer changes the design.',
  tags: ['lld', 'requirements', 'clarifying questions', 'scope'],
  blocks: [
    qa([
      ['Scope: which features are must-have for this session?', 'Shrinks the class list. Write the 3-4 use cases on the board and code only those. Everything else becomes an extension point.'],
      ['Actors: who uses the system (user, admin, staff, system job)?', 'Each actor maps to a set of service methods. Admin-only actions may need a role check or a separate `AdminService`.'],
      ['Core use cases: walk me through the happy path?', 'Gives you the method call order: e.g. `enter -> assignSpot -> issueTicket -> exit -> pay`. That order is your main flow.'],
      ['Concurrency: can many users act at the same time on the same thing?', 'Yes means the shared resource (seat, spot, account) needs a lock, `ConcurrentHashMap`, or compare-and-set. No means keep it simple.'],
      ['Persistence: in-memory is fine, or do we need a DB?', 'In-memory: repository with a `Map`. DB: same repository interface, so swapping later costs nothing. Always code to the interface.'],
      ['Extensibility: which parts are likely to change?', 'Those become interfaces (Strategy / Factory). Typical: pricing, payment method, notification channel, assignment rule.'],
      ['Payment: do we model payment or just a status?', 'Modelled: `PaymentProcessor` interface + strategy per method. Not modelled: a `PaymentStatus` enum on the booking.'],
      ['Notifications: do users get notified on events?', 'Yes means Observer: publisher + `NotificationChannel` interface (email, SMS, push).'],
      ['Scale of objects: how many floors, seats, users roughly?', 'Changes data structures: a `TreeMap` or heaps for nearest free spot when there are thousands; a list is fine for ten.'],
      ['Error cases: what happens when full, invalid input, payment fails?', 'Defines custom exceptions (`LotFullException`) and rollback paths (release held seat on failed payment).'],
      ['Time: do we need timing rules (expiry, TTL, hourly rates)?', 'Inject a `Clock` so it is testable; add a scheduler or lazy expiry check.'],
      ['Undo / history: do we need audit or undo?', 'Command pattern or an event log list.'],
    ], 'Generic questions and what the answer changes'),
    table(['Problem', 'Ask these'], [
      ['Parking lot', 'Vehicle types and spot sizes? Can a bike use a car spot? Multiple floors / entry gates? Pricing hourly or flat? Pay at exit or entry?'],
      ['Elevator', 'How many elevators and floors? Which scheduling goal: wait time or energy? Capacity / weight limit? Emergency and maintenance modes?'],
      ['BookMyShow', 'Seat hold duration before payment? Multiple cities/theatres? Seat types with different prices? Cancellation and refunds?'],
      ['Vending machine', 'Coins, notes, cards? Give change? What if out of stock mid-transaction? Refill / admin mode?'],
      ['Splitwise', 'Split types (equal, exact, percent)? Groups? Simplify debts? Multiple currencies?'],
      ['Rate limiter', 'Per user, per IP or per API key? Which algorithm is acceptable? Single process or shared? Hard reject or queue?'],
      ['Cache (LRU/LFU)', 'Eviction policy fixed or pluggable? Thread-safe? TTL? Capacity in entries or bytes?'],
    ], 'Questions specific to common LLD problems'),
    key("Every answer should change something you write. If an answer would not change the design, skip that question."),
    drill("10 minutes: for Vending Machine and Splitwise, write 5 questions each and next to each one write the class, enum or interface it creates."),
  ],
});

// ---------------------------------------------------------------- 4. HLD clarifying

S.push({
  id: 'clarify-hld',
  title: 'Clarifying questions: HLD',
  summary: 'Grouped questions for scope, scale, data, latency, geography and constraints, with design impact.',
  tags: ['hld', 'requirements', 'clarifying questions', 'non-functional', 'scale'],
  blocks: [
    qa([
      ['Which 3 features matter most for this session?', 'Everything else is out of scope. You design only for those flows.'],
      ['Who are the clients: mobile, web, other services?', 'Mobile means flaky networks: idempotent APIs, pagination, smaller payloads. Service clients may need gRPC.'],
      ['Is there a write path and a read path, and which is hotter?', 'Decides where caching and denormalisation go.'],
    ], 'Functional scope'),
    qa([
      ['How many daily active users? Expected growth?', 'Drives QPS. 1M DAU is one region and a few boxes; 500M DAU means sharding from day one.'],
      ['Read:write ratio?', '100:1 means cache + read replicas. 1:1 or write-heavy means LSM stores (Cassandra), queues, and batching.'],
      ['Peak vs average? Any spikes (sales, live events)?', 'Size for peak (2-10x average). Spikes need queues, autoscaling or a waiting room.'],
    ], 'Users and scale'),
    qa([
      ['How big is one record, and how many per day?', 'Gives storage/year. Over a few TB means sharding or object storage.'],
      ['Retention: forever, 30 days, 1 year?', 'Short retention: TTL tables. Long: tiered storage (hot DB, cold blob).'],
      ['Do reads need the very latest write?', 'Yes (balances, bookings): strong consistency, single leader, transactions. No (likes, feeds): eventual, caches, async replication.'],
      ['Are there relationships and transactions across entities?', 'Yes leans SQL. Simple key access at huge scale leans NoSQL.'],
    ], 'Data'),
    qa([
      ['What latency target for the main read? (p99)', '<100 ms means cache + precompute. Seconds is fine means compute on read.'],
      ['Availability target: 99.9 or 99.99?', '99.99 means multi-AZ, no single points of failure, automated failover.'],
      ['Is losing data acceptable anywhere?', 'No means synchronous replication / acks=all. Analytics events may tolerate small loss.'],
    ], 'Latency and availability'),
    qa([
      ['Single region or global users?', 'Global: CDN, geo-DNS, regional replicas, and a decision on cross-region write conflicts.'],
      ['Data residency rules?', 'Partition data by region; cannot replicate everything everywhere.'],
    ], 'Geography'),
    qa([
      ['Any existing infra or tech we must use?', 'Reuse it. Do not introduce Kafka if they already run a working queue.'],
      ['Budget or team-size constraints?', 'Small team: fewer services, managed services. Cost sensitive: cheaper storage tiers, less replication.'],
      ['Build vs buy (e.g. payment provider, search)?', 'Buy means you design the integration (webhooks, idempotency) instead of the engine.'],
    ], 'Constraints'),
    key("1) Top 3 features? 2) DAU and peak? 3) Read:write ratio? 4) Is stale data OK? 5) Latency / availability target?", '5 questions to always ask'),
    warn("Do not ask 15 questions. Ask the 5, state assumptions for the rest, and move on within 5 minutes."),
    drill("10 minutes: for News Feed, Payment System and Chat, ask yourself the 5 questions, invent answers, and write one design change each answer forces."),
  ],
});

// ---------------------------------------------------------------- 5. LLD concepts

S.push({
  id: 'lld-concepts',
  title: 'Top LLD concepts asked',
  summary: 'OOP, SOLID, patterns and Java habits: one line each and when to bring them up.',
  tags: ['lld', 'oop', 'solid', 'design patterns', 'concepts'],
  blocks: [
    table(['Concept', 'One-line definition', 'When to mention it'], [
      ['Encapsulation', 'Hide state behind methods that keep it valid', 'When you make fields private and expose `book()` instead of `setStatus()`'],
      ['Abstraction', 'Expose what, hide how', 'When you introduce an interface like `PaymentProcessor`'],
      ['Inheritance', 'Is-a reuse of behaviour', 'Only for true hierarchies (`Car extends Vehicle`); say you keep it shallow'],
      ['Polymorphism', 'One call, many behaviours chosen at runtime', 'When replacing an if-else chain with `strategy.calculate()`'],
      ['S: Single Responsibility', 'A class has one reason to change', 'When splitting `Ticket` from `PricingService`'],
      ['O: Open/Closed', 'Add behaviour by adding code, not editing it', 'When a new type is just a new class'],
      ['L: Liskov Substitution', 'Subtypes must work wherever the parent works', 'When rejecting a subclass that throws on a parent method'],
      ['I: Interface Segregation', 'Small focused interfaces over fat ones', 'When splitting `Printable` and `Scannable`'],
      ['D: Dependency Inversion', 'Depend on interfaces, inject concretes', 'When a service takes a `Repository` in its constructor'],
      ['Composition over inheritance', 'Build behaviour by holding objects, not extending', 'When behaviour varies on multiple axes (vehicle + fuel + pricing)'],
      ['Interface vs abstract class', 'Interface = capability contract; abstract = shared state + partial code', 'When choosing a base type; default to interface'],
      ['Singleton', 'One instance, global access', 'Config or registry; say you prefer DI and note thread safety'],
      ['Factory', 'Centralise object creation by type', 'Creating vehicles, spots, notifications from an enum'],
      ['Builder', 'Step-by-step construction of objects with many optional fields', 'Booking, Order, Request objects with 5+ fields'],
      ['Strategy', 'Swap an algorithm behind an interface', 'Pricing, payment, elevator scheduling, split types'],
      ['Observer', 'Notify subscribers on events', 'Notifications, display boards, stock alerts'],
      ['State', 'Behaviour depends on current state object', 'Vending machine, order lifecycle, elevator'],
      ['Decorator', 'Wrap an object to add behaviour', 'Add-ons (toppings, logging, compression)'],
      ['Adapter', 'Convert one interface to another', 'Wrapping a third-party payment SDK'],
      ['Command', 'Request as an object (execute / undo)', 'Undo, queues of actions, remote buttons'],
      ['Chain of Responsibility', 'Pass a request along handlers until one handles it', 'ATM cash dispenser, log levels, validation pipeline'],
      ['Template Method', 'Fixed skeleton, subclasses fill steps', 'Game turn loop, report generation'],
      ['Immutability', 'Objects never change after construction', 'Value objects (`Money`, `Location`); use `record`, safe to share across threads'],
      ['Thread safety', 'Correct under concurrent access', 'Any shared mutable resource: seat, spot, balance, cache'],
      ['Dependency injection', 'Pass dependencies in, do not `new` them inside', 'Constructors of services; makes testing and swapping easy'],
      ['Enums for types/states', 'Closed set of values with behaviour', 'Every status and type field; never raw strings'],
      ['Exception design', 'Domain-specific unchecked exceptions', '`SeatUnavailableException`, `InsufficientBalanceException`'],
    ], 'Concept | definition | when to say it'),
    tip("Deep dive for each row: LLD › OOP pillars, SOLID principles, and the individual pattern sections."),
    key("Name a pattern only together with the requirement that needs it: \"Pricing varies by vehicle, so Strategy.\""),
    drill("15 minutes: cover the middle column and say each definition aloud. Then for 5 patterns, name one LLD problem where you would use it."),
  ],
});

// ---------------------------------------------------------------- 6. HLD concepts

S.push({
  id: 'hld-concepts',
  title: 'Top HLD concepts asked',
  summary: '35 building-block concepts: one-line meaning and the trade-off to say out loud.',
  tags: ['hld', 'concepts', 'building blocks', 'trade-offs', 'distributed systems'],
  blocks: [
    table(['Concept', 'One-line definition', 'Trade-off to say out loud'], [
      ['Vertical scaling', 'Bigger machine', 'Simple, but has a ceiling and is a single point of failure'],
      ['Horizontal scaling', 'More machines', 'Near-unlimited, but needs stateless services and data partitioning'],
      ['Load balancer', 'Spreads requests across servers', 'L4 is fast; L7 can route by path/header but costs more CPU'],
      ['Cache-aside', 'App reads cache, on miss loads DB and fills cache', 'Simple and resilient; first read is slow and data can be stale'],
      ['Write-through', 'Write cache and DB together', 'Cache always fresh; every write is slower'],
      ['Write-back', 'Write cache, flush DB later', 'Fast writes; risk of data loss if cache dies'],
      ['CDN', 'Edge servers cache static / media content', 'Huge latency win; invalidation is slow and costs money'],
      ['SQL', 'Relational tables, joins, ACID', 'Strong consistency and queries; harder to scale writes'],
      ['NoSQL', 'Key-value, document, wide-column, graph', 'Scales out easily; weaker joins and transactions'],
      ['Indexing', 'Extra structure (B-tree) to find rows fast', 'Faster reads; slower writes and more storage'],
      ['Replication', 'Copies of data on several nodes', 'Read scale + availability; replica lag means stale reads'],
      ['Sharding', 'Split data across nodes by a key', 'Write scale; cross-shard queries and resharding are painful'],
      ['Consistent hashing', 'Hash ring so adding a node moves ~1/N keys', 'Smooth rebalancing; needs virtual nodes to avoid skew'],
      ['CAP', 'On a partition, choose consistency or availability', 'Bank: CP. Social feed: AP'],
      ['PACELC', 'Else (no partition), choose latency or consistency', 'Even healthy systems trade latency for consistency'],
      ['Strong consistency', 'Every read sees the latest write', 'Correct; slower and less available'],
      ['Eventual consistency', 'Replicas converge over time', 'Fast and available; users may see old data briefly'],
      ['Message queue', 'Buffer between producer and consumer', 'Decouples and absorbs spikes; adds latency and ops'],
      ['Kafka (log)', 'Partitioned, replayable append-only log', 'High throughput + replay; ordering only within a partition'],
      ['Idempotency', 'Same request twice = same effect once', 'Safe retries; need an idempotency key store'],
      ['Rate limiting', 'Cap requests per client per window', 'Protects service; must choose algorithm and shared state'],
      ['API gateway', 'Single entry: auth, routing, limits', 'Central control; extra hop and potential bottleneck'],
      ['Microservices', 'Independently deployable services', 'Team autonomy and scaling; network calls, distributed failures'],
      ['Service discovery', 'Find live instances by name', 'Dynamic scaling; another critical system to run'],
      ['Observability', 'Metrics, logs, traces', 'Fast debugging; storage cost and cardinality limits'],
      ['Retry + backoff', 'Retry with growing delays + jitter', 'Hides blips; can amplify load without limits'],
      ['Circuit breaker', 'Stop calling a failing dependency for a while', 'Prevents cascades; must define fallback behaviour'],
      ['Leader election', 'Pick one node to coordinate (Raft, ZooKeeper)', 'Simple coordination; failover gap and split-brain risk'],
      ['Distributed lock', 'Mutual exclusion across machines', 'Correctness; needs lease + fencing token, adds latency'],
      ['Snowflake IDs', 'Time + machine + sequence 64-bit IDs', 'Sortable, no coordination; depends on clock sanity'],
      ['Bloom filter', 'Probabilistic set: maybe-yes / definitely-no', 'Tiny memory; false positives, no deletes (basic form)'],
      ['Geohash / quadtree', 'Index 2D locations for nearby search', 'Geohash is simple; quadtree adapts to density'],
      ['WebSockets / SSE / long polling', 'Server push channels', 'WS is bidirectional but stateful; SSE simpler one-way; polling simplest, wasteful'],
      ['Blob storage', 'Object store for files (S3)', 'Cheap and durable; not for small frequent updates'],
      ['Inverted index', 'Term -> list of documents', 'Fast full-text search; index updates are async'],
      ['Event sourcing', 'Store events, derive state', 'Full audit and replay; complex queries need projections'],
      ['CQRS', 'Separate write model and read model', 'Each side optimised; read side is eventually consistent'],
      ['Saga', 'Chain of local transactions with compensations', 'No global lock; must write compensations, eventual'],
      ['2PC', 'Coordinator asks all to prepare, then commit', 'Atomic across nodes; blocking and slow if coordinator dies'],
    ], 'Concept | definition | trade-off'),
    tip("Deep dive: HLD › Caching, Sharding and partitioning, Consistent hashing, CAP and PACELC, Reliability patterns."),
    key("Every concept is a trade-off. If you can name what it costs, you understand it. If you can only name what it gives, you do not yet."),
    drill("15 minutes: cover the last column. For each concept say the cost out loud. Mark the ones you hesitated on and read their HLD deep dive tonight."),
  ],
});

// ---------------------------------------------------------------- 7. LLD problems

S.push({
  id: 'lld-problems',
  title: 'Most-asked LLD problems',
  summary: '16 classic LLD problems: entities, patterns, the tricky part, and the follow-up.',
  tags: ['lld', 'problems', 'parking lot', 'elevator', 'cache', 'machine coding'],
  blocks: [
    table(['Problem', 'Core entities', 'Patterns', 'The one tricky part', 'Follow-up they will throw'], [
      ['Parking lot', 'Lot, Floor, Spot, Vehicle, Ticket, Gate', 'Strategy (pricing, spot pick), Factory, Singleton lot', 'Finding nearest free spot of the right size fast', 'Multiple entry gates at once: avoid two cars getting one spot'],
      ['Elevator', 'Elevator, Request, Controller, Direction, Door', 'State, Strategy (scheduling), Observer', 'Scheduling: which car serves which request', 'Add VIP / emergency mode; minimise energy'],
      ['BookMyShow', 'Movie, Theatre, Screen, Show, Seat, Booking', 'Strategy (pricing), Observer, Builder', 'Two users selecting the same seat', 'Seat hold with timeout before payment'],
      ['Vending machine', 'Machine, Item, Slot, Coin, Inventory', 'State (Idle, HasMoney, Dispensing)', 'Valid transitions and change making', 'Add card payment; refund on failure'],
      ['Splitwise', 'User, Group, Expense, Split, BalanceSheet', 'Strategy (split type), Factory', 'Keeping balances correct per pair', 'Simplify debts to minimum transactions'],
      ['LRU / LFU cache', 'Cache, Node, DoublyLinkedList, EvictionPolicy', 'Strategy (eviction)', 'O(1) get and put (map + list / freq buckets)', 'Make it thread-safe; add TTL'],
      ['Rate limiter', 'Limiter, Bucket/Window, Rule, ClientId', 'Strategy (algorithm), Factory', 'Atomic refill + consume', 'Distributed across servers (Redis)'],
      ['Logger', 'Logger, Level, Appender, Formatter', 'Chain of Responsibility, Singleton, Strategy', 'Level filtering and multiple sinks', 'Async logging without losing messages'],
      ['Notification system', 'Notification, Channel, Template, Preference', 'Observer, Strategy, Factory, Decorator', 'Per-user channel preferences', 'Retries, rate limits per channel, priority'],
      ['Library', 'Book, BookCopy, Member, Loan, Reservation', 'Observer (reservations), Strategy (fines)', 'Book vs physical copy', 'Fines, holds queue, max loans per member'],
      ['Snake & ladder / Tic-tac-toe / Chess', 'Board, Player, Piece/Cell, Dice, Game', 'Strategy (move rules), Template (turn loop), Factory', 'Win detection / legal move validation', 'N players, undo move (Command)'],
      ['ATM', 'ATM, Card, Account, CashDispenser, Transaction', 'State, Chain of Responsibility (notes)', 'Dispensing cash with denominations', 'Concurrent withdrawals on a joint account'],
      ['Food delivery order flow', 'Restaurant, Menu, Order, Cart, DeliveryAgent, Payment', 'State (order status), Strategy (agent assign), Observer', 'Order state machine and who can move it', 'Cancellation after pickup; reassign agent'],
      ['Cab booking', 'Rider, Driver, Ride, Location, Fare', 'Strategy (matching, fare), State, Observer', 'Matching nearest available driver safely', 'Surge pricing; driver rejects ride'],
      ['File system / in-memory KV store', 'Directory, File (Composite), Entry, Store', 'Composite, Command', 'Path resolution / TTL expiry', 'Transactions: begin, commit, rollback'],
      ['Pub-sub / message queue', 'Topic, Message, Publisher, Subscriber, Offset', 'Observer, Strategy (delivery)', 'Per-subscriber offsets and ordering', 'At-least-once delivery, retries, dead letter'],
    ], 'Problem cheat table'),
    tip("Deep dive: LLD › Problem: Parking Lot, LRU Cache, Rate Limiter, Elevator, Vending Machine, Movie Ticket Booking, Splitwise and others."),
    key("For every problem, know the tricky part before the interview. That is where the interviewer will spend the second half."),
    drill("20 minutes: pick 3 rows. For each, write the enum list and the one interface you would introduce, then 3 lines on how you handle the follow-up."),
  ],
});

// ---------------------------------------------------------------- 8. HLD problems

S.push({
  id: 'hld-problems',
  title: 'Most-asked HLD problems',
  summary: '19 classic designs: components, the hard part, and the must-ask question.',
  tags: ['hld', 'problems', 'url shortener', 'chat', 'feed', 'uber', 'design'],
  blocks: [
    table(['Problem', 'Key components', 'The hard part', 'Must-ask question'], [
      ['URL shortener', 'API, ID generator, KV store, cache, redirect service', 'Unique short codes at scale; hot links', 'Custom aliases? Expiry? Analytics?'],
      ['Rate limiter', 'Gateway middleware, Redis counters, rules config', 'Atomic counting across many servers', 'Per user, IP or key? Hard or soft limit?'],
      ['Chat (WhatsApp)', 'WebSocket gateways, chat service, message store, presence, push', 'Delivery to offline users, ordering, receipts', '1:1 only or groups? Group size limit?'],
      ['News feed', 'Post service, fan-out workers, feed cache, graph service', 'Celebrities: fan-out on write explodes', 'Ranked or chronological? Follower cap?'],
      ['Notification system', 'API, queue per channel, workers, provider adapters, preferences', 'Retries, dedupe, user rate limits', 'Which channels? Transactional or marketing?'],
      ['YouTube / Netflix', 'Upload, transcoding pipeline, blob store, CDN, metadata DB', 'Transcoding at scale + adaptive streaming', 'Upload-heavy or watch-heavy? Live?'],
      ['Uber', 'Location ingest, geo index, matching, trip service, payments', 'Frequent location updates + nearby search', 'Update frequency? Matching radius?'],
      ['Google Docs', 'Doc service, OT/CRDT engine, WebSockets, snapshot store', 'Concurrent edits converge to one doc', 'Max simultaneous editors? Offline editing?'],
      ['Dropbox / Drive', 'Chunker, metadata DB, blob store, sync service, notifier', 'Chunk-level sync and conflict handling', 'Max file size? Versioning? Sharing?'],
      ['Instagram', 'Upload, media store + CDN, feed, follow graph, likes counters', 'Feed + media at scale, hot counters', 'Stories / reels in scope? Feed ranking?'],
      ['Typeahead', 'Trie / prefix index service, aggregation pipeline, cache', 'Sub-50 ms top-k per prefix', 'Personalised? How fresh must trends be?'],
      ['Web crawler', 'URL frontier, fetchers, DNS cache, dedupe, parser, store', 'Politeness + dedupe of billions of URLs', 'Scale (pages/day)? Re-crawl frequency?'],
      ['Distributed cache', 'Client lib, consistent hash ring, nodes, replication', 'Rebalancing and hot keys', 'Eviction policy? Can we lose data?'],
      ['Payment system', 'Payment API, ledger, PSP adapter, idempotency store, reconciliation', 'Exactly-once money movement', 'Which payment methods? Refunds? Multi-currency?'],
      ['Ticket booking', 'Inventory, hold service with TTL, booking, payment, waiting room', 'No double booking under flash-sale load', 'Seat selection or general admission? Peak?'],
      ['Search engine basics', 'Crawler, indexer, inverted index shards, ranker, query service', 'Index size + ranking latency', 'Freshness need? Query types?'],
      ['Metrics / logging', 'Agents, Kafka, stream processor, time-series DB, cold storage', 'Write volume and high-cardinality labels', 'Retention? Query granularity?'],
      ['Leaderboard', 'Score service, Redis sorted sets, DB for history', 'Real-time top-K and rank of one user', 'Global or per region / time window?'],
      ['Distributed job scheduler', 'Scheduler API, job store, time-bucketed queue, workers, leader', 'Run each job exactly once on time', 'Cron or one-off? Allowed delay? Retries?'],
    ], 'Problem cheat table'),
    tip("Deep dive: HLD › Design: URL Shortener, Chat app, News Feed, Uber, Payment system, Ticketmaster-style booking and others."),
    key("Every famous problem has one famous hard part. Mention it in the first 10 minutes so the interviewer knows you know."),
    drill("20 minutes: choose 2 problems you have never drawn. Spend 10 minutes each: requirements, the 5 key boxes, and a 3-line plan for the hard part."),
  ],
});

// ---------------------------------------------------------------- 9. trade-offs

S.push({
  id: 'tradeoffs',
  title: 'Trade-off cheat table',
  summary: 'Classic either/or decisions with when to pick each side.',
  tags: ['hld', 'trade-offs', 'decisions', 'sql', 'nosql', 'consistency'],
  blocks: [
    table(['Decision', 'Option A', 'Option B', 'Pick A when', 'Pick B when'], [
      ['Database', 'SQL', 'NoSQL', 'Relations, transactions, ad-hoc queries, money', 'Huge scale, simple key access, flexible schema'],
      ['Feed generation', 'Push (fan-out on write)', 'Pull (fan-out on read)', 'Most users have few followers; reads dominate', 'Celebrity accounts; many inactive readers'],
      ['Caching', 'Cache-aside', 'Write-through', 'Read-heavy, stale reads OK briefly', 'Reads must see recent writes; write rate moderate'],
      ['Communication', 'Sync (REST/gRPC)', 'Async (queue)', 'Caller needs the answer now', 'Work can finish later; spikes; many consumers'],
      ['Consistency', 'Strong', 'Eventual', 'Money, inventory, bookings, auth', 'Likes, views, feeds, analytics'],
      ['Architecture', 'Monolith', 'Microservices', 'Small team, early product', 'Many teams, independent scaling and deploys'],
      ['Real-time updates', 'Polling', 'WebSockets', 'Updates are rare; simplicity matters', 'Frequent, low-latency, two-way updates'],
      ['Scaling', 'Vertical', 'Horizontal', 'Quick fix, moderate load, stateful DB', 'Large load, need redundancy'],
      ['Schema', 'Normalised', 'Denormalised', 'Writes frequent, consistency matters', 'Read-heavy, joins too slow at scale'],
      ['API style', 'REST', 'gRPC', 'Public APIs, browsers, simplicity', 'Internal service-to-service, low latency, streaming'],
      ['Messaging', 'Kafka', 'RabbitMQ', 'High throughput, replay, event streams, many consumer groups', 'Task queues, per-message routing, simple work distribution'],
      ['Locking', 'Optimistic (version check)', 'Pessimistic (lock row)', 'Conflicts are rare', 'Conflicts are frequent; retries are expensive'],
      ['Replication', 'Leader-follower', 'Leaderless (quorum)', 'Need simple ordering and strong-ish writes', 'Need high write availability across nodes'],
      ['ID generation', 'DB auto-increment', 'Snowflake / UUID', 'Single DB, small scale', 'Sharded or multi-region writes'],
      ['Storage for files', 'DB BLOB column', 'Object store + URL in DB', 'Tiny files, few of them', 'Almost always for images/video/docs'],
    ], 'Decision | A | B | when'),
    key("The formula: \"I pick A because requirement X. The cost is Y, which is acceptable because Z.\""),
    warn("Never say one option is simply better. The interviewer will ask \"when would you pick the other?\" and you must have an answer."),
    drill("10 minutes: cover the last two columns. For each row, say aloud one real product that would pick A and one that would pick B."),
  ],
});

// ---------------------------------------------------------------- 10. building blocks

S.push({
  id: 'building-blocks',
  title: 'Building block chooser',
  summary: 'If you need X, reach for Y. Fast mapping from requirement to component.',
  tags: ['hld', 'components', 'building blocks', 'chooser'],
  blocks: [
    table(['If you need...', 'Use...', 'Example tech'], [
      ['Low-latency reads of hot data', 'In-memory cache', 'Redis, Memcached'],
      ['Static files / media close to users', 'CDN', 'CloudFront, Akamai'],
      ['Store large files (images, video)', 'Object / blob storage', 'S3, GCS'],
      ['Transactions and relations', 'Relational DB', 'PostgreSQL, MySQL'],
      ['Massive writes, simple key lookups', 'Wide-column / KV store', 'Cassandra, DynamoDB'],
      ['Flexible JSON documents', 'Document store', 'MongoDB'],
      ['Full-text search, filters, fuzzy match', 'Search index', 'Elasticsearch, OpenSearch'],
      ['Decouple producer and consumer, absorb spikes', 'Message queue', 'SQS, RabbitMQ'],
      ['Event stream with replay, many consumers', 'Distributed log', 'Kafka, Kinesis'],
      ['Ranking / top-K / leaderboards', 'Sorted set', 'Redis ZSET'],
      ['Nearby search on a map', 'Geo index', 'Geohash in Redis, PostGIS, quadtree'],
      ['Time-stamped metrics', 'Time-series DB', 'Prometheus, InfluxDB'],
      ['Relationships many hops deep', 'Graph DB', 'Neo4j'],
      ['Fast "have I seen this?" check', 'Bloom filter', 'Redis Bloom, Guava'],
      ['Push updates to clients', 'WebSockets / SSE', 'Socket gateway service'],
      ['Unique sortable IDs across shards', 'ID generator', 'Snowflake-style service'],
      ['One coordinator / config / leader', 'Coordination service', 'ZooKeeper, etcd'],
      ['Mutual exclusion across servers', 'Distributed lock with lease', 'Redis lock, etcd lease'],
      ['Route and protect public APIs', 'API gateway', 'Kong, AWS API Gateway'],
      ['Spread traffic over servers', 'Load balancer', 'Nginx, ALB, HAProxy'],
      ['Run work later / on a schedule', 'Delayed queue / scheduler', 'Quartz, SQS delay, Airflow'],
      ['Big batch analytics', 'Data warehouse / batch engine', 'Spark, BigQuery'],
      ['Real-time aggregation of streams', 'Stream processor', 'Flink, Kafka Streams'],
      ['Approximate counts of unique users', 'HyperLogLog', 'Redis PFADD'],
      ['Safe retries of payments / orders', 'Idempotency key store', 'DB unique constraint, Redis'],
    ], 'Requirement to component'),
    key("Say the requirement first, then the component: \"We need replay for new consumers, so Kafka.\" Never the other way round."),
    drill("10 minutes: cover the middle and right columns, read only the left one, and name the component. Aim for 25/25 in under 3 minutes."),
  ],
});

// ---------------------------------------------------------------- 11. numbers

S.push({
  id: 'numbers',
  title: 'Numbers to know',
  summary: 'Latencies, throughput per node, sizes, QPS conversion and a worked estimate.',
  tags: ['hld', 'estimation', 'numbers', 'latency', 'qps', 'back of the envelope'],
  blocks: [
    table(['Operation', 'Rough latency'], [
      ['L1 cache reference', '~1 ns'],
      ['Main memory reference', '~100 ns'],
      ['Read 1 MB sequentially from memory', '~10 us'],
      ['SSD random read', '~100 us'],
      ['Round trip in same datacenter', '~0.5 ms'],
      ['Redis GET over network', '~1 ms'],
      ['Read 1 MB sequentially from SSD', '~1 ms'],
      ['Indexed DB query', '1-10 ms'],
      ['HDD seek', '~10 ms'],
      ['Cross-continent round trip', '~150 ms'],
    ], 'Latency ladder'),
    table(['Component', 'Rule of thumb'], [
      ['Web / app server (stateless)', '1k-10k simple requests/s per node'],
      ['Relational DB node', '~1k-10k writes/s, ~10k-50k simple reads/s'],
      ['Redis / Memcached node', '~100k ops/s'],
      ['Kafka broker', 'hundreds of MB/s; ~100k+ messages/s'],
      ['Cassandra node', '~10k+ writes/s'],
      ['One WebSocket server', '~50k-100k open connections'],
    ], 'Throughput rules of thumb'),
    table(['Thing', 'Size'], [
      ['char / small int', '1-4 bytes'],
      ['UUID', '16 bytes (36 as text)'],
      ['Tweet-like text post with metadata', '~1 KB'],
      ['Compressed photo', '~200 KB - 2 MB'],
      ['1 minute of 1080p video', '~50-100 MB'],
      ['1 million x 1 KB', '1 GB'],
      ['1 billion x 1 KB', '1 TB'],
    ], 'Storage sizes'),
    table(['Per day', 'Per second (approx)'], [
      ['1 million', '~12'],
      ['10 million', '~120'],
      ['100 million', '~1,200'],
      ['1 billion', '~12,000'],
      ['Rule', 'day has ~100k seconds (86,400), so divide by 10^5'],
    ], 'QPS conversion'),
    diagram(`
100M DAU x 10 reads/day   = 1B reads/day   -> ~12k reads/s, peak x3 = ~36k/s
100M DAU x 1 post/day     = 100M writes/day -> ~1.2k writes/s
100M posts x 1 KB         = 100 GB/day     -> ~36 TB/year (+ replicas x3)
Decision: reads >> writes -> cache + replicas; 36 TB/yr -> shard by user_id
`, 'Worked estimate (4 lines)'),
    key("Round everything: 86,400 -> 100k, 2^10 -> 1k, 2.5 -> 3. Use powers of 10. The interviewer wants the order of magnitude and the decision it drives, not the exact number.", 'Round numbers'),
    warn("An estimate that does not end with a decision is wasted time. Always finish with \"so we need X\"."),
    drill("10 minutes: estimate read QPS, write QPS and storage/year for a chat app with 50M DAU sending 40 messages/day of 200 bytes. Then write the one decision it drives."),
  ],
});

// ---------------------------------------------------------------- 12. phrases

S.push({
  id: 'phrases',
  title: 'Phrases that score',
  summary: 'Ready-made lines for assumptions, trade-offs, getting unstuck, and wrapping up.',
  tags: ['communication', 'scripts', 'interview', 'soft skills'],
  blocks: [
    table(['Moment', 'Say this'], [
      ['Opening', '"Before I design, let me ask a few questions so I build the right thing."'],
      ['Stating an assumption', '"I will assume X. If that is wrong, the part that changes is Y."'],
      ['Scoping down', '"To fit the time, I will focus on A, B and C and treat D as out of scope. OK?"'],
      ['Announcing the plan', '"My plan: requirements, estimates, API, data model, design, then deep dives."'],
      ['Presenting a trade-off', '"Option A gives us X but costs Y. Option B is the reverse. Given our read-heavy load, I pick A."'],
      ['Choosing a pattern (LLD)', '"Pricing changes per vehicle type, so I put it behind a `PricingStrategy` interface."'],
      ['Using a number', '"That is about 12k reads per second, which one DB will not handle comfortably, so I add a cache."'],
      ['When stuck', '"Let me step back to the requirement this serves." Then restate it and try the simplest thing.'],
      ['When you do not know a tool', '"I have not used X in production. The property I need is Y, and I would pick a tool that gives Y."'],
      ['Receiving a hint', '"Good point. That breaks my design at Z. Let me fix it by..."'],
      ['Handing control back', '"I can go deeper on the feed fan-out or on storage. Which is more useful to you?"'],
      ['Checking in', '"Does this level of detail work, or should I go faster?"'],
      ['Naming a weakness', '"The weak spot here is the single writer. At 10x I would shard it by user_id."'],
      ['Summarising', '"To recap: we serve reads from cache, writes go through a queue to sharded storage, and the main risk is hot keys, handled by..."'],
    ], 'Moment | say this'),
    key("Assumption + consequence. Every assumption you state should come with what changes if it is wrong."),
    tip("Silence over 30 seconds feels like stuck to the interviewer. Narrate even half-formed thoughts: \"I am weighing X against Y...\"."),
    drill("10 minutes: record yourself on your phone saying the trade-off, stuck, and summarising lines for a URL shortener. Replay once and cut filler words."),
  ],
});

// ---------------------------------------------------------------- 13. mistakes

S.push({
  id: 'mistakes',
  title: 'Mistakes that fail the round',
  summary: 'The common failure patterns in LLD and HLD rounds, each with the fix.',
  tags: ['mistakes', 'traps', 'lld', 'hld', 'anti-patterns'],
  blocks: [
    table(['LLD mistake', 'Fix'], [
      ['Coding before clarifying', 'Spend 5 minutes on requirements and write them down first'],
      ['One god class doing everything', 'Split into models, services, repositories, strategies'],
      ['Strings or ints for types and states', 'Use enums; add behaviour to enums if useful'],
      ['if-else chains on type', 'Polymorphism / Strategy / Factory'],
      ['Pattern soup', 'Use a pattern only when a requirement demands it; say which'],
      ['Ignoring concurrency on shared resources', 'Name the resource; lock it or use atomic compare-and-set'],
      ['Public mutable fields, setters for everything', 'Private fields, intent methods (`book()`, `release()`)'],
      ['Returning null for errors', 'Custom exceptions or `Optional`'],
      ['Deep inheritance trees', 'Prefer composition and interfaces'],
      ['Nothing runs at the end', 'Code the main flow end to end first, then polish'],
    ], 'LLD'),
    table(['HLD mistake', 'Fix'], [
      ['Jumping to the diagram', 'Requirements and non-functional targets first'],
      ['Buzzword architecture (Kafka, K8s, 12 services) on day one', 'Start simple, add components only when a requirement needs them'],
      ['Estimates with no decision', 'End each number with "so we need..."'],
      ['No API or data model', 'Write 3-6 endpoints and main tables before the diagram'],
      ['Picking a DB by habit', 'Choose by access pattern and consistency need'],
      ['Shallow everywhere', 'Go deep on the 1-2 hardest parts'],
      ['Ignoring failures', 'Discuss replicas, retries, idempotency, timeouts, monitoring'],
      ['Single points of failure left in', 'Scan the diagram: every box should have a backup'],
      ['Arguing with the interviewer', 'Treat pushback as a hint; adjust and say why'],
      ['Running out of time with no wrap-up', 'Reserve the last 3-5 minutes for bottlenecks and summary'],
    ], 'HLD'),
    warn("The most common fail in both rounds: no structure. The interviewer cannot follow you, so they cannot give you credit."),
    drill("15 minutes: take your last mock or practice design. Check it against both tables and write the 2 mistakes you made with one concrete fix each."),
  ],
});

// ---------------------------------------------------------------- 14. LLD template

S.push({
  id: 'lld-template',
  title: 'LLD answer template',
  summary: 'The repeatable answer order plus the Java skeleton shape you write every time.',
  tags: ['lld', 'template', 'java', 'skeleton', 'structure'],
  blocks: [
    steps([
      'Requirements: 3-4 use cases in scope, list out of scope.',
      'Enums for every type and state.',
      'Entities (fields first, behaviour after).',
      'Interfaces at variation points (strategy, payment, notifier).',
      'Repository interface + in-memory implementation.',
      'Service that orchestrates the use case and enforces rules.',
      'Custom exceptions for domain errors.',
      'Concurrency on the shared resource.',
      'Demo in `main` and walk through one scenario.',
      'Extensions: show where a new type or rule plugs in.',
    ], 'Answer order'),
    java(`
enum SpotType { SMALL, MEDIUM, LARGE }
enum SpotStatus { FREE, OCCUPIED }

record Vehicle(String plate, SpotType needs) {}

final class Spot {
    private final String id;
    private final SpotType type;
    private SpotStatus status = SpotStatus.FREE;
    Spot(String id, SpotType type) { this.id = id; this.type = type; }
    boolean fits(Vehicle v) { return status == SpotStatus.FREE && type == v.needs(); }
    void occupy() { status = SpotStatus.OCCUPIED; }
    String id() { return id; }
}

interface PricingStrategy { long priceFor(Vehicle v, long minutes); }
interface SpotRepository { List<Spot> all(); }

class NoSpotAvailableException extends RuntimeException {
    NoSpotAvailableException(String plate) { super("No spot for " + plate); }
}

class ParkingService {
    private final SpotRepository spots;
    private final PricingStrategy pricing;
    ParkingService(SpotRepository spots, PricingStrategy pricing) {
        this.spots = spots; this.pricing = pricing;
    }
    synchronized String park(Vehicle v) {
        Spot s = spots.all().stream().filter(x -> x.fits(v)).findFirst()
                .orElseThrow(() -> new NoSpotAvailableException(v.plate()));
        s.occupy();
        return s.id();
    }
}
`, 'Java skeleton: enums, record, entity, interfaces, exception, service'),
    key("Constructor injection of interfaces into the service is the single strongest visual signal of good LLD."),
    tip("Start with `synchronized` on the service method for correctness, then offer finer-grained locking per floor or spot as the follow-up."),
    drill("15 minutes: rewrite this skeleton from memory for BookMyShow (`SeatStatus`, `Seat`, `BookingService`, `SeatUnavailableException`). Check: does it compile in your head?"),
  ],
});

// ---------------------------------------------------------------- 15. HLD template

S.push({
  id: 'hld-template',
  title: 'HLD answer template',
  summary: 'The whiteboard outline you fill in every time, plus the default architecture sketch.',
  tags: ['hld', 'template', 'whiteboard', 'outline', 'diagram'],
  blocks: [
    diagram(`
1. REQUIREMENTS
   Functional:     - ...  - ...  - ...
   Non-functional: scale (DAU), latency p99, availability, consistency
   Out of scope:   - ...

2. ESTIMATES
   Reads/s: ...   Writes/s: ...   Peak x3
   Storage/yr: ...                Bandwidth: ...
   => decision: cache? shard? CDN?

3. API
   POST /v1/things          {..}  -> {id}
   GET  /v1/things/{id}           -> {..}
   GET  /v1/things?cursor=..      -> {items, nextCursor}

4. DATA MODEL
   Thing(id PK, owner_id, created_at, ...)   DB: ... because ...
   Shard key: ...   Indexes: ...

5. HIGH-LEVEL DIAGRAM  (walk one read + one write through it)

6. DEEP DIVES (pick 2-3)
   - hot keys / fan-out / consistency / ordering / exactly-once

7. BOTTLENECKS + FAILURES
   SPOFs, replication, retries + idempotency, monitoring, 10x plan
`, 'Whiteboard outline'),
    diagram(`
 Clients
    |
   DNS ---- CDN (static, media)
    |
 Load Balancer
    |
 API Gateway (auth, rate limit)
    |
 +--+----------------+-----------------+
 |                   |                 |
Read Service    Write Service     Notify Service
 |    |              |                 ^
Cache |              v                 |
 |    |          Queue (Kafka) --> Workers
 v    v              |
 DB replicas <-- DB primary (sharded)
                     |
               Blob store (S3)
`, 'Default architecture sketch'),
    key("Walk one read and one write request through the diagram out loud. That single walk proves the design works end to end."),
    drill("15 minutes: copy the outline from memory and fill it for a Pastebin clone. Time each phase and compare to the plan in How to clear an HLD round."),
  ],
});

// ---------------------------------------------------------------- 16. revision + plan

S.push({
  id: 'revision',
  title: 'Night-before checklist and 7-day plan',
  summary: 'What to review the night before, and a one-week LLD + HLD prep schedule.',
  tags: ['revision', 'checklist', 'plan', 'schedule', 'prep'],
  blocks: [
    list([
      'Re-read the two rubrics and minute plans (sections 1-2).',
      'Say the "5 questions to always ask" from memory.',
      'Write the LLD Java skeleton once without looking.',
      'Write the HLD whiteboard outline once without looking.',
      'Skim Trade-off cheat table and Numbers to know.',
      'Pick your 3 strongest LLD and 3 strongest HLD problems; know their hard parts cold.',
      'Read Phrases that score aloud once.',
      'Prepare tools: pen, paper or tablet, a working editor if machine coding, water.',
      'Stop by 10 pm. Sleep is worth more than one more design.',
    ], 'Night before'),
    table(['Day', 'LLD', 'HLD'], [
      ['1', 'OOP + SOLID + concept table; code Parking Lot skeleton', 'Round framework, numbers, 3 estimates'],
      ['2', 'Patterns: Strategy, Factory, Observer, State; Vending Machine', 'Caching, CDN, SQL vs NoSQL; URL Shortener'],
      ['3', 'LRU Cache + Rate Limiter (thread-safe)', 'Sharding, replication, consistent hashing; Rate Limiter service'],
      ['4', 'BookMyShow with seat locking', 'Queues, Kafka, idempotency; Notification system'],
      ['5', 'Splitwise + Elevator', 'News Feed + Chat'],
      ['6', 'Timed mock: one problem in 45 minutes, full code', 'Timed mock: one design in 45 minutes, full outline'],
      ['7', 'Review mistakes table; redo the weakest problem', 'Review trade-offs; redo the weakest design; rest early'],
    ], '7-day prep plan'),
    key("Mocks beat reading. From day 4 on, at least one timed problem per day."),
    drill("10 minutes: tonight, do the first 3 checklist items only. Tick them off in your tracker."),
  ],
});

// ---------------------------------------------------------------- 17. concurrency

S.push({
  id: 'lld-concurrency',
  title: 'Concurrency questions in LLD',
  summary: 'The concurrency follow-ups you will get and the short Java answer to each.',
  tags: ['lld', 'concurrency', 'thread safety', 'java', 'locks'],
  blocks: [
    table(['They ask', 'Short answer', 'Java tool'], [
      ['Two users book the same seat?', 'Atomic check-and-set on the seat; loser gets an exception', '`AtomicReference` CAS, `synchronized`, or DB row lock'],
      ['Make the cache thread-safe', 'Lock around get/put that mutate order; or striped locks', '`ReentrantLock`, `ConcurrentHashMap`'],
      ['Many gates assign parking spots', 'Lock per floor or per spot type, not the whole lot', '`ReentrantLock` per floor, `ConcurrentLinkedQueue` of free spots'],
      ['Rate limiter under load', 'Per-client bucket updated atomically', '`ConcurrentHashMap.compute`, `AtomicLong`'],
      ['Singleton under threads', 'Holder class idiom or enum singleton', '`enum Config { INSTANCE }`'],
      ['Producer-consumer (logger, pub-sub)', 'Bounded blocking queue + worker threads', '`BlockingQueue`, `ExecutorService`'],
      ['Read-heavy shared map', 'Allow parallel readers, exclusive writer', '`ReadWriteLock` or `ConcurrentHashMap`'],
      ['Seat hold expires after 5 minutes', 'Scheduled release or lazy expiry check on read', '`ScheduledExecutorService`, store `expiresAt`'],
      ['Deadlock risk with two locks', 'Always acquire locks in a fixed global order', 'Order by id; `tryLock` with timeout'],
      ['Counter shared by threads', 'Atomic increment', '`AtomicInteger`, `LongAdder`'],
    ], 'Question | answer | tool'),
    tip("Deep dive: LLD › Concurrency basics for LLD."),
    warn("\"Make every method synchronized\" is correct but signals no thought. Say it as step one, then narrow the lock."),
    drill("15 minutes: write a thread-safe `SeatService.hold(seatId, userId)` using `ConcurrentHashMap.putIfAbsent`. Then explain why it is atomic."),
  ],
});

// ---------------------------------------------------------------- 18. schema rules

S.push({
  id: 'schema-rules',
  title: 'Database schema design quick rules',
  summary: 'Fast rules for tables, keys, indexes and sharding in design rounds.',
  tags: ['database', 'schema', 'indexes', 'sharding', 'data model'],
  blocks: [
    list([
      'Start from queries: list the top 3 reads and writes, then design tables for them.',
      'Every table gets a primary key; use a surrogate ID (Snowflake/UUID) for sharded data.',
      'Store money as integer minor units (`amount_cents`) plus a currency code.',
      'Store timestamps in UTC; add `created_at` and `updated_at` everywhere.',
      'Add an index for every WHERE / ORDER BY in a hot query; not for every column.',
      'Composite index order: equality columns first, then range / sort column.',
      'Many-to-many needs a join table (`follows(follower_id, followee_id)`).',
      'Status columns map to enums; add a `version` column for optimistic locking.',
      'Unique constraints enforce business rules (one booking per seat per show).',
      'Shard key = the column most queries filter by and that spreads load (often `user_id`).',
      'Denormalise only for a proven hot read path; say how you keep copies in sync.',
      'Soft delete (`deleted_at`) when audit or undo matters.',
    ], 'Rules'),
    table(['Access pattern', 'Schema move'], [
      ['Get user timeline by time', 'Partition by `user_id`, cluster by `created_at DESC`'],
      ['Prevent double booking', 'Unique (`show_id`, `seat_id`) on bookings'],
      ['Count likes fast', 'Counter column or separate counter table, updated async'],
      ['Search by text', 'Do not LIKE scan; send to a search index'],
      ['Idempotent payments', 'Unique `idempotency_key` column'],
    ], 'Access pattern to schema move'),
    key("Schema follows queries. Say the query first, then the table and index that serve it."),
    drill("15 minutes: write the tables, keys and two indexes for BookMyShow (movie, show, seat, booking). Add the unique constraint that blocks double booking."),
  ],
});

export default {
  key: 'sdcheat',
  label: 'SD Cheat Sheet',
  intro: 'The condensed interview layer over the LLD and HLD tabs: how rounds are graded, what to ask, the concepts and problems asked most, trade-offs, numbers, phrases, templates and a prep plan.',
  sections: S,
};
