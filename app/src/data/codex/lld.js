// Codex tab: Low-Level Design (LLD) for interviews, in Java 17.
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

// ---------------------------------------------------------------- foundations

S.push({
  id: 'lld-round',
  title: 'How an LLD round works',
  summary: 'The 45-60 minute flow and an 8-step framework you can run on autopilot.',
  tags: ['framework', 'interview', 'process', 'machine coding'],
  blocks: [
    t("An LLD round asks you to model a small system as classes and write the core code. The interviewer grades structure, not cleverness. They want clean objects, clear responsibilities, and code that bends when requirements change."),
    table(['Phase', 'Minutes', 'What you produce'], [
      ['Requirements', '5', 'A short list of must-have features and 2-3 things you are NOT building'],
      ['Entities', '5', 'Nouns from the requirements become candidate classes'],
      ['Relationships', '3', 'has-a, is-a, multiplicity (1 lot has many floors)'],
      ['Class diagram (text)', '5', 'Boxes with key fields and methods'],
      ['Key methods', '5', 'Signatures for the main flows (park, unpark, pay)'],
      ['Patterns', '3', 'Name the pattern and the reason (Strategy for pricing)'],
      ['Code the core', '15-20', 'Compilable Java for the hot path only'],
      ['Extensions', '5', 'Show how a new requirement plugs in without rewrites'],
    ], 'Time budget for a 50-minute round'),
    steps([
      "Requirements: ask who uses it, what actions they take, and what is out of scope. Write them as numbered bullets.",
      "Entities: underline the nouns. Drop the ones that are just fields (a `color` is not a class).",
      "Relationships: for each pair decide is-a (inheritance/interface) or has-a (field). Add multiplicity.",
      "Class diagram: sketch in text. Fields, then public methods. Mark interfaces with `<<interface>>`.",
      "Key methods: write signatures with types. This exposes missing classes fast.",
      "Patterns: pick only what solves a real variation point. Say why out loud.",
      "Code the core: enums, interfaces, then the service class that ties it together. Skip getters.",
      "Extensions: walk through 2 changes (new vehicle type, new payment) and show which class changes.",
    ], 'The 8-step framework'),
    key("Find the **variation points** first. Every place that says 'different kinds of X' or 'may change later' becomes an interface. That single habit drives most of your score."),
    warn("Jumping into code before agreeing on requirements. Also: designing 25 classes and coding none. Aim for 6-10 classes and working core logic."),
    tip("Talk while you type. Say 'I am making this an interface because pricing will vary.' Silent coding loses points even when the code is good."),
    qa([
      ["Why did you make this an interface instead of a class?", "Because there are multiple interchangeable implementations, and callers should not care which one they get. It also lets me test with a fake."],
      ["What happens if two users do this at the same time?", "Point to the shared mutable state, then lock it at the smallest scope (per seat, per spot) or use an atomic/concurrent structure."],
      ["How would you add feature X?", "Name the one class or interface that changes. If you need to edit more than two existing classes, your design is too coupled."],
    ]),
    drill("Set a 15-minute timer. Run steps 1-6 on paper for a Coffee Machine (no code). Then answer: what are your variation points, which pattern handles each, and what would change if you add a new drink?"),
  ],
});

S.push({
  id: 'oop-pillars',
  title: 'OOP pillars in Java',
  summary: 'Encapsulation, abstraction, inheritance, polymorphism with one-line Java examples.',
  tags: ['oop', 'encapsulation', 'abstraction', 'inheritance', 'polymorphism'],
  blocks: [
    t("The four pillars are the vocabulary interviewers expect. Know each as a one-line definition plus a tiny example. Then show them in your design, not just in definitions."),
    table(['Pillar', 'One line', 'Java tool'], [
      ['Encapsulation', 'Hide state, expose behavior', '`private` fields, methods that enforce rules'],
      ['Abstraction', 'Show what, hide how', 'interfaces, abstract classes'],
      ['Inheritance', 'Reuse and specialize a parent', '`extends`, `super`'],
      ['Polymorphism', 'One call, many behaviors', 'overriding (runtime), overloading (compile time)'],
    ]),
    java(`
// Encapsulation: balance can only change through rules
public class Account {
    private long balanceCents;

    public void withdraw(long cents) {
        if (cents <= 0 || cents > balanceCents) {
            throw new IllegalArgumentException("invalid amount");
        }
        balanceCents -= cents;
    }

    public long balance() { return balanceCents; }
}

// Abstraction + polymorphism
interface Shape { double area(); }
record Circle(double r) implements Shape { public double area() { return Math.PI * r * r; } }
record Square(double s) implements Shape { public double area() { return s * s; } }

// Caller does not know or care which shape it has
double total(List<Shape> shapes) {
    return shapes.stream().mapToDouble(Shape::area).sum();
}
`, 'All four in a few lines'),
    key("Encapsulation is not 'add getters and setters'. A public setter for every field breaks encapsulation. Expose actions (`withdraw`), not raw state."),
    warn("Saying inheritance is the main way to reuse code. Modern answer: prefer composition, use inheritance only for true is-a with shared behavior."),
    qa([
      ["Overloading vs overriding?", "Overloading: same name, different parameters, picked at compile time. Overriding: subclass replaces a parent method, picked at runtime by the object's real type."],
      ["Can you override a static method?", "No. Static methods are hidden, not overridden. The call is bound to the declared type."],
    ]),
    drill("10 minutes: model a `Notification` hierarchy (Email, SMS, Push). Point at each pillar in your code and say it out loud in one sentence each."),
  ],
});

S.push({
  id: 'solid',
  title: 'SOLID principles',
  summary: 'Five rules for code that is easy to change: rule, smell, fix, tiny example.',
  tags: ['solid', 'srp', 'ocp', 'lsp', 'isp', 'dip', 'principles'],
  blocks: [
    t("SOLID is a checklist for 'will this be painful to change?'. Interviewers rarely ask for definitions alone. They ask you to spot a violation and fix it."),
    table(['Principle', 'Rule', 'Smell', 'Fix'], [
      ['S - Single Responsibility', 'A class has one reason to change', '`OrderService` also formats emails and writes SQL', 'Split into `OrderService`, `EmailFormatter`, `OrderRepository`'],
      ['O - Open/Closed', 'Add behavior without editing old code', 'Growing `if/else` or `switch` on type', 'Interface + one class per type'],
      ['L - Liskov Substitution', 'Subclass must work wherever parent works', 'Override throws `UnsupportedOperationException`', 'Fix the hierarchy; split interfaces'],
      ['I - Interface Segregation', 'Small, focused interfaces', 'Classes implementing methods they do not need', 'Break into role interfaces'],
      ['D - Dependency Inversion', 'Depend on abstractions, not concretes', '`new MySqlDb()` inside business logic', 'Inject an interface through the constructor'],
    ]),
    java(`
// SRP: one job each
class InvoiceCalculator { Money total(Invoice inv) { /* math only */ return null; } }
class InvoicePrinter    { String render(Invoice inv) { /* formatting only */ return ""; } }
class InvoiceRepository { void save(Invoice inv) { /* persistence only */ } }
`, 'S - Single Responsibility'),
    java(`
// OCP smell
double discount(String type, double price) {
    if (type.equals("STUDENT")) return price * 0.8;
    if (type.equals("SENIOR"))  return price * 0.7;
    return price; // every new type edits this method
}

// OCP fix: new type = new class, no edits
interface DiscountPolicy { double apply(double price); }
class StudentDiscount implements DiscountPolicy { public double apply(double p) { return p * 0.8; } }
class SeniorDiscount  implements DiscountPolicy { public double apply(double p) { return p * 0.7; } }
`, 'O - Open/Closed'),
    java(`
// LSP smell: Square breaks Rectangle's contract (setWidth changes height)
// Fix: do not make Square extend Rectangle. Both implement Shape.
interface Bird {}
interface FlyingBird extends Bird { void fly(); }
class Sparrow implements FlyingBird { public void fly() { } }
class Penguin implements Bird { }   // no fake fly() that throws
`, 'L - Liskov Substitution'),
    java(`
// ISP smell: one fat interface
interface Machine { void print(); void scan(); void fax(); }

// ISP fix: role interfaces
interface Printer { void print(); }
interface Scanner { void scan(); }
class SimplePrinter implements Printer { public void print() { } }
class OfficeMachine implements Printer, Scanner {
    public void print() { }
    public void scan() { }
}
`, 'I - Interface Segregation'),
    java(`
interface PaymentGateway { boolean charge(String userId, long cents); }

class CheckoutService {
    private final PaymentGateway gateway;          // abstraction

    CheckoutService(PaymentGateway gateway) {       // injected
        this.gateway = gateway;
    }

    boolean checkout(String userId, long cents) {
        return gateway.charge(userId, cents);
    }
}
// Swap Stripe for Razorpay or a test fake without touching CheckoutService.
`, 'D - Dependency Inversion'),
    key("OCP + DIP together are the interview superpower: **interfaces at variation points, injected through constructors**. Most design questions reduce to this."),
    warn("Do not over-apply. An interface with exactly one implementation and no test need is noise. Say 'I would extract this if a second variant appears.'"),
    qa([
      ["Which principle does a `switch` on enum type violate?", "Open/Closed. Every new type edits the switch. Replace with polymorphism or a map from type to strategy."],
      ["DIP vs dependency injection?", "DIP is the principle (depend on abstractions). DI is a technique to achieve it (pass dependencies in instead of creating them)."],
    ]),
    drill("15 minutes: write a 30-line `ReportService` that reads from MySQL, computes totals, and emails a PDF all in one method. Then refactor it to obey SRP and DIP. Count how many classes you end up with and name each one's single reason to change."),
  ],
});

S.push({
  id: 'composition-vs-inheritance',
  title: 'Composition vs inheritance',
  summary: 'Why has-a usually beats is-a, and when inheritance is still right.',
  tags: ['composition', 'inheritance', 'has-a', 'is-a', 'design'],
  blocks: [
    t("Inheritance locks behavior in at compile time and couples child to parent internals. Composition holds a reference to a collaborator and delegates. You can swap the collaborator at runtime."),
    table(['', 'Inheritance', 'Composition'], [
      ['Relationship', 'is-a', 'has-a'],
      ['Coupling', 'Tight (fragile base class)', 'Loose (talk through interface)'],
      ['Change at runtime', 'No', 'Yes, swap the field'],
      ['Combining behaviors', 'Class explosion (FlyingSwimmingDuck)', 'Mix and match fields'],
      ['Good for', 'True taxonomy with shared code (Template Method)', 'Almost everything else'],
    ]),
    java(`
// Inheritance explosion: RobotDuck, RubberDuck, FlyingRubberDuck...
// Composition: behavior is a field
interface FlyBehavior { void fly(); }
class Wings implements FlyBehavior { public void fly() { System.out.println("flap"); } }
class NoFly implements FlyBehavior { public void fly() { } }

class Duck {
    private FlyBehavior fly;
    Duck(FlyBehavior fly) { this.fly = fly; }
    void setFly(FlyBehavior fly) { this.fly = fly; }   // change at runtime
    void performFly() { fly.fly(); }
}
`),
    key("Default to composition. Use inheritance only when the child truly IS the parent everywhere (Liskov holds) and you want the shared code."),
    warn("Extending a concrete class like `ArrayList` or `HashMap` to add a feature. Wrap it instead (forwarding class), or you inherit methods that bypass your rules."),
    qa([
      ["Give a case where inheritance is the better choice.", "An abstract `Vehicle` with shared fields (plate, size) and a fixed algorithm skeleton, where subclasses only fill small hooks. Or framework base classes designed for extension."],
    ]),
    drill("10 minutes: model Employee types (FullTime, Contractor, Intern) with different pay rules and benefit rules. Do it once with inheritance and once with composition (PayPolicy, BenefitPolicy). Which handles 'intern who becomes full-time' without creating a new object?"),
  ],
});

S.push({
  id: 'interface-vs-abstract',
  title: 'Interfaces vs abstract classes',
  summary: 'When to pick each in Java 17, including default methods and sealed types.',
  tags: ['interface', 'abstract class', 'java', 'sealed', 'default methods'],
  blocks: [
    t("An interface is a contract: what you can do. An abstract class is a partial implementation: what you are, plus shared state. Java allows many interfaces but only one superclass."),
    table(['Feature', 'Interface', 'Abstract class'], [
      ['Multiple per class', 'Yes', 'No (single extends)'],
      ['Instance fields', 'No (only constants)', 'Yes'],
      ['Constructors', 'No', 'Yes'],
      ['Method bodies', '`default`, `static`, `private` methods', 'Any'],
      ['Access modifiers', 'Public by default', 'Any'],
      ['Use for', 'Capability / role (`Comparable`, `PaymentGateway`)', 'Shared state + skeleton (`Vehicle`, `AbstractHandler`)'],
    ]),
    java(`
interface Payable {
    long amountCents();
    default String display() { return "Rs " + amountCents() / 100.0; }
}

abstract class Vehicle {
    protected final String plate;
    protected Vehicle(String plate) { this.plate = plate; }
    abstract VehicleSize size();          // subclasses fill this
}

// Java 17: sealed restricts who can extend. Great for closed sets.
sealed interface Shape permits Circle, Rect {}
record Circle(double r) implements Shape {}
record Rect(double w, double h) implements Shape {}
`),
    key("Rule of thumb: start with an interface. Add an abstract class only when several implementations share fields or a fixed algorithm."),
    warn("Answering with Java 7 facts ('interfaces cannot have method bodies'). Since Java 8 they have `default` and `static`; since Java 9, `private`."),
    qa([
      ["Two interfaces have the same default method. What happens?", "Compile error until the class overrides it. Inside, you can call a specific one with `A.super.method()`."],
    ]),
    drill("10 minutes: for Parking Lot, decide for each of `Vehicle`, `ParkingSpot`, `PricingStrategy`, `PaymentMethod` whether it is an interface, abstract class, enum, or record. Write one sentence justifying each."),
  ],
});

S.push({
  id: 'uml-text',
  title: 'Class diagrams in text (UML lite)',
  summary: 'How to draw is-a, has-a, and multiplicity on a whiteboard or in plain text.',
  tags: ['uml', 'class diagram', 'multiplicity', 'association', 'aggregation', 'composition'],
  blocks: [
    t("You rarely need full UML. You need a fast, readable way to show classes and how they connect. Plain text arrows work in any shared editor."),
    table(['Relation', 'Meaning', 'Text notation', 'Example'], [
      ['Inheritance', 'is-a (extends)', '`Car --|> Vehicle`', 'Car is a Vehicle'],
      ['Realization', 'implements', '`CardPay ..|> Payment`', 'CardPay implements Payment'],
      ['Composition', 'owns, dies with parent', '`Lot *-- Floor`', 'Floors do not exist without Lot'],
      ['Aggregation', 'has, can live alone', '`Team o-- Player`', 'Player exists without Team'],
      ['Association', 'uses / knows about', '`Ticket --> Spot`', 'Ticket refers to a Spot'],
      ['Dependency', 'uses temporarily', '`Service ..> Logger`', 'Method parameter or local'],
    ]),
    table(['Multiplicity', 'Means'], [
      ['1', 'exactly one'],
      ['0..1', 'optional'],
      ['*', 'zero or more'],
      ['1..*', 'at least one'],
    ]),
    diagram(`
+-------------------+        +-------------------+
| ParkingLot        | 1   1..*| Floor            |
|-------------------|*-------|-------------------|
| - floors: List    |        | - spots: List     |
| + park(v): Ticket |        | + freeSpot(size)  |
+-------------------+        +-------------------+
                                     | 1
                                     *--- 1..* ParkingSpot

<<interface>> PricingStrategy
   ^.. HourlyPricing
   ^.. FlatPricing
`, 'Quick whiteboard style'),
    key("In interviews, show **fields, key methods, and arrows with multiplicity**. Skip getters, setters, and visibility on every line."),
    warn("Confusing composition and aggregation. Ask: if the parent is deleted, does the child still make sense? No means composition."),
    drill("10 minutes: draw the text class diagram for a Library (Library, Book, BookCopy, Member, Loan). Mark every arrow type and multiplicity. Check: is Book to BookCopy composition or aggregation?"),
  ],
});

// ---------------------------------------------------------------- patterns

S.push({
  id: 'singleton',
  title: 'Singleton (thread-safe)',
  summary: 'Exactly one instance, created safely under concurrency.',
  tags: ['singleton', 'creational', 'pattern', 'thread-safe', 'double-checked locking'],
  blocks: [
    t("Singleton guarantees one instance and a global access point. Use it for shared, stateless-ish infrastructure: config, a logger, a connection pool. The interview trap is thread safety."),
    list([
      "Intent: one instance per JVM, lazily or eagerly created.",
      "Use when: exactly one coordinator must exist (registry, ID generator, cache manager).",
      "Avoid when: it hides dependencies that should be injected. It makes tests harder.",
    ]),
    java(`
// 1) Best default: enum singleton (thread-safe, serialization-safe, reflection-safe)
public enum IdGenerator {
    INSTANCE;
    private final AtomicLong next = new AtomicLong();
    public long nextId() { return next.incrementAndGet(); }
}

// 2) Lazy holder idiom: lazy + thread-safe, no locking cost
public final class Config {
    private Config() { }
    private static class Holder { static final Config INSTANCE = new Config(); }
    public static Config get() { return Holder.INSTANCE; }
}

// 3) Double-checked locking: know it, explain volatile
public final class Registry {
    private static volatile Registry instance;
    private Registry() { }
    public static Registry get() {
        if (instance == null) {
            synchronized (Registry.class) {
                if (instance == null) instance = new Registry();
            }
        }
        return instance;
    }
}
`),
    key("Without `volatile`, double-checked locking can hand another thread a half-constructed object (instruction reordering). Enum or holder idiom avoids the whole problem."),
    warn("Plain lazy `if (instance == null) instance = new X();` with no lock. Two threads can both create one. This is the most common wrong answer."),
    list([
      "'There must be only one ...' in the requirements.",
      "A global manager: `ParkingLot`, `Logger`, `BookingSystem` entry point.",
      "Follow-up: 'Is your getInstance thread-safe?'",
    ], 'Spot it in an interview'),
    qa([
      ["How can a singleton be broken?", "Reflection calling the private constructor, serialization creating a new copy, or multiple class loaders. Enum singleton blocks the first two."],
      ["Why is singleton called an anti-pattern?", "Hidden global state and hard-to-mock dependencies. Prefer one instance managed by DI and passed in."],
    ]),
    drill("10 minutes: write all three versions from memory. Then explain in 2 sentences why `volatile` is needed in version 3."),
  ],
});

S.push({
  id: 'factory',
  title: 'Factory and Factory Method',
  summary: 'Move object creation behind one method so callers do not depend on concrete classes.',
  tags: ['factory', 'factory method', 'creational', 'pattern'],
  blocks: [
    t("A factory centralizes `new`. Callers ask for a type, the factory decides the concrete class. Factory Method is the inheritance flavor: a subclass overrides a creation method."),
    list([
      "Intent: decouple 'what I need' from 'which class builds it'.",
      "Use when: the concrete type depends on input (vehicle type, payment mode, file format).",
      "Simple Factory: a static method with a switch. Factory Method: abstract `create()` overridden by subclasses.",
    ]),
    java(`
interface Notifier { void send(String to, String msg); }
class EmailNotifier implements Notifier { public void send(String to, String m) { } }
class SmsNotifier   implements Notifier { public void send(String to, String m) { } }

enum Channel { EMAIL, SMS }

// Simple factory: the only switch on type in the whole codebase
final class NotifierFactory {
    static Notifier of(Channel c) {
        return switch (c) {
            case EMAIL -> new EmailNotifier();
            case SMS   -> new SmsNotifier();
        };
    }
}

// Factory Method: subclass decides what to create
abstract class Dialog {
    abstract Button createButton();          // factory method
    void render() { createButton().draw(); }
}
class WebDialog extends Dialog { Button createButton() { return new HtmlButton(); } }
`),
    key("The switch on type is allowed in exactly one place: the factory. Everywhere else uses the interface."),
    warn("Calling every static helper a factory. It is a factory only if it hides which concrete class gets created."),
    list([
      "'Support different types of X' and X is created from user input.",
      "Code with `new CarSpot()` / `new BikeSpot()` scattered around.",
      "Follow-up: 'How do you add a new type?' Answer: one new class + one factory line.",
    ], 'Spot it in an interview'),
    tip("For full OCP, replace the switch with a `Map<Channel, Supplier<Notifier>>` that new types register into."),
    drill("10 minutes: build a `ParserFactory` that returns JSON, CSV, or XML parsers from a file extension. Then make it a registry map so adding YAML needs zero edits to the factory."),
  ],
});

S.push({
  id: 'abstract-factory',
  title: 'Abstract Factory (brief)',
  summary: 'A factory of factories: create families of related objects that must match.',
  tags: ['abstract factory', 'creational', 'pattern', 'families'],
  blocks: [
    t("Abstract Factory creates a whole family of products that belong together. Swap the factory and every product switches theme at once. It is rarer in LLD rounds; know the shape and one example."),
    java(`
interface Button { void draw(); }
interface Checkbox { void draw(); }

interface UiFactory {               // one method per product in the family
    Button button();
    Checkbox checkbox();
}
class DarkUi implements UiFactory {
    public Button button() { return new DarkButton(); }
    public Checkbox checkbox() { return new DarkCheckbox(); }
}
class LightUi implements UiFactory {
    public Button button() { return new LightButton(); }
    public Checkbox checkbox() { return new LightCheckbox(); }
}

class Screen {
    Screen(UiFactory ui) { ui.button().draw(); ui.checkbox().draw(); }
}
`),
    key("Factory Method = one product. Abstract Factory = a matching family of products."),
    list([
      "'Support multiple themes / platforms / database vendors' where pieces must not be mixed.",
      "Payment provider kits: each provider has its own client, validator, and refund handler.",
    ], 'Spot it in an interview'),
    drill("10 minutes: design a `CloudFactory` with `storage()` and `queue()` for AWS and GCP. Show that `App` never names a vendor class."),
  ],
});

S.push({
  id: 'builder',
  title: 'Builder',
  summary: 'Construct objects with many optional fields readably and immutably.',
  tags: ['builder', 'creational', 'pattern', 'immutable'],
  blocks: [
    t("Builder replaces giant constructors with named, chained setters and a final `build()`. The result can be immutable and validated in one place."),
    list([
      "Intent: readable construction of complex or optional-heavy objects.",
      "Use when: 4+ parameters, many optional, or validation across fields.",
      "Bonus: the built object is immutable and thread-safe to share.",
    ]),
    java(`
public final class HttpRequest {
    private final String url;
    private final String method;
    private final Map<String, String> headers;
    private final int timeoutMs;

    private HttpRequest(Builder b) {
        this.url = b.url;
        this.method = b.method;
        this.headers = Map.copyOf(b.headers);
        this.timeoutMs = b.timeoutMs;
    }

    public static Builder builder(String url) { return new Builder(url); }

    public static final class Builder {
        private final String url;                 // required
        private String method = "GET";             // defaults
        private final Map<String, String> headers = new HashMap<>();
        private int timeoutMs = 5000;

        private Builder(String url) { this.url = Objects.requireNonNull(url); }
        public Builder method(String m) { this.method = m; return this; }
        public Builder header(String k, String v) { headers.put(k, v); return this; }
        public Builder timeoutMs(int t) { this.timeoutMs = t; return this; }

        public HttpRequest build() {
            if (timeoutMs <= 0) throw new IllegalStateException("timeout must be > 0");
            return new HttpRequest(this);
        }
    }
}

// HttpRequest r = HttpRequest.builder("https://x").method("POST").timeoutMs(2000).build();
`),
    key("Required fields go in the builder's constructor. Optional fields get chained methods with defaults. Validate in `build()`."),
    warn("Using Builder for a 2-field object. Use a `record` instead."),
    list([
      "Objects like `Pizza`, `Order`, `Query`, `User profile` with many optional parts.",
      "'Telescoping constructor' problem in the existing code.",
    ], 'Spot it in an interview'),
    drill("10 minutes: write a `Pizza.Builder` (size required; cheese, toppings list, crust optional). Make `Pizza` immutable and reject more than 5 toppings in `build()`."),
  ],
});

S.push({
  id: 'strategy',
  title: 'Strategy',
  summary: 'Swap an algorithm at runtime behind one interface.',
  tags: ['strategy', 'behavioral', 'pattern', 'pricing', 'algorithm'],
  blocks: [
    t("Strategy puts each variant of an algorithm in its own class behind a common interface. The context holds one and calls it. This is the most used pattern in LLD rounds."),
    list([
      "Intent: make algorithms interchangeable without `if/else` on type.",
      "Use when: pricing, payment, sorting, matching, eviction, routing rules vary.",
      "Java 17 shortcut: a functional interface lets you pass a lambda as the strategy.",
    ]),
    java(`
@FunctionalInterface
interface PricingStrategy {
    long priceCents(Duration parked);
}

class HourlyPricing implements PricingStrategy {
    private final long perHour;
    HourlyPricing(long perHour) { this.perHour = perHour; }
    public long priceCents(Duration d) {
        long hours = Math.max(1, (d.toMinutes() + 59) / 60);   // round up
        return hours * perHour;
    }
}

class FlatPricing implements PricingStrategy {
    public long priceCents(Duration d) { return 5000; }
}

class ParkingFeeCalculator {
    private PricingStrategy strategy;
    ParkingFeeCalculator(PricingStrategy s) { this.strategy = s; }
    void setStrategy(PricingStrategy s) { this.strategy = s; }   // weekend pricing
    long fee(Duration d) { return strategy.priceCents(d); }
}
`),
    key("Strategy = **who chooses the behavior from outside**. State = the object changes its own behavior from inside. Same shape, different driver."),
    list([
      "'Different pricing / payment / matching / eviction policies'.",
      "'We may add new algorithms later'.",
      "Any `switch` on a mode enum inside business logic.",
    ], 'Spot it in an interview'),
    qa([
      ["How does the system pick which strategy to use?", "A factory or config maps a key (vehicle type, day of week, user tier) to a strategy instance. The context only sees the interface."],
    ]),
    drill("15 minutes: build a `RideFareCalculator` with Normal, Surge (multiplier), and Pool (split by riders) strategies. Then add a 'night' strategy without editing any existing class."),
  ],
});

S.push({
  id: 'observer',
  title: 'Observer',
  summary: 'Notify many listeners when one subject changes, without coupling them.',
  tags: ['observer', 'behavioral', 'pattern', 'pub-sub', 'events', 'listener'],
  blocks: [
    t("A subject keeps a list of observers and calls them on an event. Observers can join and leave at runtime. The subject only knows the interface."),
    list([
      "Intent: one-to-many dependency, push notifications on change.",
      "Use when: 'notify users when X', stock tickers, UI events, display boards.",
      "In-process Observer is synchronous by default. For scale, the same idea becomes a message queue.",
    ]),
    java(`
interface StockListener { void onPrice(String symbol, double price); }

class StockTicker {
    private final Map<String, List<StockListener>> listeners = new ConcurrentHashMap<>();

    void subscribe(String symbol, StockListener l) {
        listeners.computeIfAbsent(symbol, k -> new CopyOnWriteArrayList<>()).add(l);
    }

    void unsubscribe(String symbol, StockListener l) {
        listeners.getOrDefault(symbol, List.of()).remove(l);
    }

    void publish(String symbol, double price) {
        for (StockListener l : listeners.getOrDefault(symbol, List.of())) {
            try {
                l.onPrice(symbol, price);
            } catch (RuntimeException e) {
                // one bad listener must not stop the others
            }
        }
    }
}
`),
    key("Isolate failures per observer and use a thread-safe list (`CopyOnWriteArrayList`) so subscribe during publish does not throw `ConcurrentModificationException`."),
    warn("Memory leaks from observers that never unsubscribe. Mention `unsubscribe` or weak references."),
    list([
      "'Notify', 'subscribe', 'alert when available', 'display board updates'.",
      "Parking display showing free spots, back-in-stock alerts, chat room members.",
    ], 'Spot it in an interview'),
    drill("10 minutes: implement a `BackInStock` subject where users subscribe to a product ID. When stock goes from 0 to positive, notify each user once and auto-unsubscribe them."),
  ],
});

S.push({
  id: 'state',
  title: 'State',
  summary: 'An object changes behavior when its internal state changes, without giant switches.',
  tags: ['state', 'behavioral', 'pattern', 'state machine', 'vending machine'],
  blocks: [
    t("Each state is a class that implements the same actions. The context delegates to its current state, and states decide the next state. It kills the 'switch inside every method' smell."),
    list([
      "Intent: model a finite state machine with one class per state.",
      "Use when: Vending Machine, Elevator, Order lifecycle, Traffic Light, Document workflow.",
      "Each state rejects actions that make no sense in it (cannot dispense before paying).",
    ]),
    java(`
interface OrderState {
    default void pay(Order o)    { throw new IllegalStateException("cannot pay now"); }
    default void ship(Order o)   { throw new IllegalStateException("cannot ship now"); }
    default void cancel(Order o) { throw new IllegalStateException("cannot cancel now"); }
}

class Created implements OrderState {
    public void pay(Order o)    { o.setState(new Paid()); }
    public void cancel(Order o) { o.setState(new Cancelled()); }
}
class Paid implements OrderState {
    public void ship(Order o)   { o.setState(new Shipped()); }
    public void cancel(Order o) { /* refund */ o.setState(new Cancelled()); }
}
class Shipped implements OrderState { }
class Cancelled implements OrderState { }

class Order {
    private OrderState state = new Created();
    void setState(OrderState s) { this.state = s; }
    void pay()    { state.pay(this); }
    void ship()   { state.ship(this); }
    void cancel() { state.cancel(this); }
}
`),
    key("Draw the state transition table first (state x action -> next state). The code is then a direct translation."),
    warn("Putting transitions in the context with `if (state == PAID)`. That is just a switch with extra classes."),
    list([
      "Requirements list modes: idle, has-money, dispensing, out-of-service.",
      "Phrases like 'only after', 'cannot X while Y'.",
    ], 'Spot it in an interview'),
    tip("For tiny machines, an `enum` with abstract methods per constant is a compact State pattern."),
    drill("15 minutes: write the transition table for a Traffic Light with a pedestrian button and a 'flashing' maintenance mode, then code it with the State pattern."),
  ],
});

S.push({
  id: 'decorator',
  title: 'Decorator',
  summary: 'Add responsibilities to an object by wrapping it, stackable at runtime.',
  tags: ['decorator', 'structural', 'pattern', 'wrapper'],
  blocks: [
    t("A decorator implements the same interface as the object it wraps. It adds behavior before or after delegating. You can stack many wrappers in any order."),
    list([
      "Intent: extend behavior without subclass explosion.",
      "Use when: add-ons (coffee toppings, pizza extras), cross-cutting concerns (logging, caching, retry around a service).",
      "Java's own example: `new BufferedReader(new InputStreamReader(in))`.",
    ]),
    java(`
interface Coffee { long cost(); String desc(); }

class Espresso implements Coffee {
    public long cost() { return 100; }
    public String desc() { return "Espresso"; }
}

abstract class AddOn implements Coffee {
    protected final Coffee inner;
    AddOn(Coffee inner) { this.inner = inner; }
}
class Milk extends AddOn {
    Milk(Coffee c) { super(c); }
    public long cost() { return inner.cost() + 30; }
    public String desc() { return inner.desc() + ", milk"; }
}
class Caramel extends AddOn {
    Caramel(Coffee c) { super(c); }
    public long cost() { return inner.cost() + 50; }
    public String desc() { return inner.desc() + ", caramel"; }
}

// Coffee c = new Caramel(new Milk(new Espresso()));  // 180
`),
    key("Decorator keeps the **same interface** and adds behavior. Adapter **changes** the interface. Proxy controls access with the same interface."),
    list([
      "'Toppings', 'add-ons', 'optional extras' that combine freely.",
      "'Add logging/caching/retries to an existing service without changing it'.",
    ], 'Spot it in an interview'),
    drill("10 minutes: wrap a `DataSource` interface (`read`, `write`) with `EncryptionDecorator` and `CompressionDecorator`. Explain why the order of wrapping matters."),
  ],
});

S.push({
  id: 'adapter',
  title: 'Adapter',
  summary: 'Make an incompatible class fit the interface your code expects.',
  tags: ['adapter', 'structural', 'pattern', 'wrapper', 'third-party'],
  blocks: [
    t("An adapter translates one interface into another. Your code talks to your interface. The adapter calls the third-party SDK underneath."),
    list([
      "Intent: integrate legacy or vendor code without changing either side.",
      "Use when: multiple payment gateways, map providers, or old APIs with different method shapes.",
    ]),
    java(`
// Our interface
interface PaymentGateway { boolean charge(String userId, long cents); }

// Vendor SDK we cannot change
class RazorClient {
    RazorResult makePayment(PaymentRequest req) { return null; }
}

// Adapter
class RazorAdapter implements PaymentGateway {
    private final RazorClient client;
    RazorAdapter(RazorClient client) { this.client = client; }

    public boolean charge(String userId, long cents) {
        var req = new PaymentRequest(userId, cents / 100.0, "INR");
        return client.makePayment(req).status().equals("captured");
    }
}
`),
    key("Adapter protects your domain from vendor types. If the vendor changes, only the adapter changes."),
    list([
      "'Integrate with external payment/SMS/map providers'.",
      "'We have a legacy class with a different method signature'.",
    ], 'Spot it in an interview'),
    drill("10 minutes: you have `LegacyXmlWeather.fetchXml(city)` and need `WeatherService.tempCelsius(city)`. Write the adapter, including Fahrenheit-to-Celsius conversion."),
  ],
});

S.push({
  id: 'command',
  title: 'Command',
  summary: 'Turn a request into an object so you can queue, log, undo, or retry it.',
  tags: ['command', 'behavioral', 'pattern', 'undo', 'queue'],
  blocks: [
    t("A command object wraps an action and its parameters behind `execute()`. Once actions are objects, you can store them in a stack for undo or a queue for later."),
    list([
      "Intent: decouple who triggers an action from who performs it.",
      "Use when: undo/redo (text editor), job queues, macro recording, remote controls, transaction logs.",
    ]),
    java(`
interface Command { void execute(); void undo(); }

class TextEditor {
    final StringBuilder text = new StringBuilder();
}

class InsertCommand implements Command {
    private final TextEditor ed; private final String s;
    InsertCommand(TextEditor ed, String s) { this.ed = ed; this.s = s; }
    public void execute() { ed.text.append(s); }
    public void undo() { ed.text.setLength(ed.text.length() - s.length()); }
}

class History {
    private final Deque<Command> undo = new ArrayDeque<>();
    private final Deque<Command> redo = new ArrayDeque<>();

    void run(Command c) { c.execute(); undo.push(c); redo.clear(); }
    void undo() { if (!undo.isEmpty()) { Command c = undo.pop(); c.undo(); redo.push(c); } }
    void redo() { if (!redo.isEmpty()) { Command c = redo.pop(); c.execute(); undo.push(c); } }
}
`),
    key("Undo/redo = two stacks of commands. A new action clears the redo stack."),
    list([
      "'Support undo', 'replay', 'schedule this action', 'remote control buttons'.",
    ], 'Spot it in an interview'),
    drill("10 minutes: add `DeleteCommand(n)` to the editor above. It must remember the deleted text so undo restores it exactly."),
  ],
});

S.push({
  id: 'chain-of-responsibility',
  title: 'Chain of Responsibility',
  summary: 'Pass a request along a chain of handlers until one handles it.',
  tags: ['chain of responsibility', 'behavioral', 'pattern', 'middleware', 'pipeline'],
  blocks: [
    t("Each handler either handles the request or forwards it to the next. The sender does not know who will handle it. Middleware pipelines and approval flows are this pattern."),
    list([
      "Intent: avoid coupling the sender to one receiver; make the chain configurable.",
      "Use when: logger levels, ATM note dispensing, expense approvals, request filters (auth, rate limit, validation).",
    ]),
    java(`
abstract class Approver {
    private Approver next;
    Approver linkWith(Approver next) { this.next = next; return next; }

    void approve(Expense e) {
        if (canApprove(e)) handle(e);
        else if (next != null) next.approve(e);
        else throw new IllegalStateException("nobody can approve " + e.amount());
    }
    protected abstract boolean canApprove(Expense e);
    protected abstract void handle(Expense e);
}

class Manager extends Approver {
    protected boolean canApprove(Expense e) { return e.amount() <= 10_000; }
    protected void handle(Expense e) { System.out.println("Manager ok"); }
}
class Director extends Approver {
    protected boolean canApprove(Expense e) { return e.amount() <= 100_000; }
    protected void handle(Expense e) { System.out.println("Director ok"); }
}

// Approver chain = new Manager(); chain.linkWith(new Director()).linkWith(new Cfo());
`),
    key("Always define what happens at the end of the chain (default handler or explicit error)."),
    list([
      "'Escalation', 'levels', 'approval hierarchy', 'filters', 'ATM dispenses 2000 then 500 then 100'.",
    ], 'Spot it in an interview'),
    drill("15 minutes: build an ATM dispenser chain for notes 2000, 500, 200, 100. Each handler takes as many notes as it can and passes the remainder. Reject amounts not divisible by 100."),
  ],
});

S.push({
  id: 'template-method',
  title: 'Template Method',
  summary: 'Fix the algorithm skeleton in a base class; subclasses fill in the steps.',
  tags: ['template method', 'behavioral', 'pattern', 'inheritance', 'hooks'],
  blocks: [
    t("The base class has a `final` method that runs steps in a fixed order. Some steps are abstract or have default hooks. Subclasses override only the steps that differ."),
    list([
      "Intent: reuse an algorithm's structure, vary details.",
      "Use when: data import pipelines (read, parse, validate, save), game turn loops, report generation.",
    ]),
    java(`
abstract class DataImporter {
    public final void run(String path) {           // the template
        String raw = read(path);
        List<Row> rows = parse(raw);
        rows.removeIf(r -> !isValid(r));
        save(rows);
        afterSave(rows);                            // optional hook
    }
    protected String read(String path) { return ""; /* shared */ }
    protected abstract List<Row> parse(String raw);
    protected boolean isValid(Row r) { return true; }
    protected abstract void save(List<Row> rows);
    protected void afterSave(List<Row> rows) { }
}

class CsvImporter extends DataImporter {
    protected List<Row> parse(String raw) { return List.of(); }
    protected void save(List<Row> rows) { }
}
`),
    key("Template Method uses inheritance for the skeleton. Strategy uses composition for the whole algorithm. If you need to swap at runtime, prefer Strategy."),
    list([
      "'All X follow the same steps but differ in Y'.",
      "Board games: same turn loop, different rules per game.",
    ], 'Spot it in an interview'),
    drill("10 minutes: write `abstract class Game { final void play() }` with `init`, `makeMove`, `isOver`, `winner`. Implement `TicTacToe` skeleton methods only."),
  ],
});

S.push({
  id: 'repository-di',
  title: 'Repository and Dependency Injection',
  summary: 'Hide storage behind an interface and pass dependencies in through constructors.',
  tags: ['repository', 'dependency injection', 'di', 'testing', 'persistence'],
  blocks: [
    t("A repository is a collection-like interface for loading and saving entities. Business logic never sees SQL or maps. Dependency injection wires the real or fake implementation in from outside."),
    list([
      "Intent: separate domain logic from storage; make services testable.",
      "Use when: any LLD with persistent entities (users, bookings, books). Start with in-memory implementations.",
      "Constructor injection: dependencies are `final`, required, and visible.",
    ]),
    java(`
interface BookingRepository {
    Optional<Booking> findById(String id);
    List<Booking> findByShow(String showId);
    void save(Booking b);
}

class InMemoryBookingRepository implements BookingRepository {
    private final Map<String, Booking> store = new ConcurrentHashMap<>();
    public Optional<Booking> findById(String id) { return Optional.ofNullable(store.get(id)); }
    public List<Booking> findByShow(String showId) {
        return store.values().stream().filter(b -> b.showId().equals(showId)).toList();
    }
    public void save(Booking b) { store.put(b.id(), b); }
}

class BookingService {
    private final BookingRepository repo;
    private final PaymentGateway payments;

    BookingService(BookingRepository repo, PaymentGateway payments) {   // DI
        this.repo = repo;
        this.payments = payments;
    }
}

// Wiring (a 'composition root', or Spring does this for you)
// var service = new BookingService(new InMemoryBookingRepository(), new FakeGateway());
`),
    key("In LLD rounds, say: 'Storage is behind a repository interface. I will use an in-memory map now; swapping to a DB touches one class.'"),
    warn("Field injection with `@Autowired` on private fields in interview code. Constructor injection is clearer and testable without a framework."),
    drill("10 minutes: write `UserRepository` + in-memory impl + `UserService.register(email)` that rejects duplicates. Then write a 5-line test using a fake repository."),
  ],
});

// ---------------------------------------------------------------- cross-cutting

S.push({
  id: 'lld-concurrency',
  title: 'Concurrency basics for LLD',
  summary: 'synchronized, locks, ConcurrentHashMap, atomics, BlockingQueue, and where to use each.',
  tags: ['concurrency', 'threads', 'synchronized', 'lock', 'atomic', 'blockingqueue', 'thread-safe'],
  blocks: [
    t("Most LLD problems have one concurrency hotspot: two users grabbing the same seat, spot, or token. Find the shared mutable state, then protect it at the smallest scope that is correct."),
    table(['Tool', 'Use for', 'Note'], [
      ['`synchronized`', 'Simple mutual exclusion on one object', 'Reentrant, auto-release, cannot time out'],
      ['`ReentrantLock`', 'tryLock with timeout, fairness, multiple conditions', 'Always unlock in `finally`'],
      ['`ReadWriteLock`', 'Many readers, few writers (config, cache)', 'Writers block all readers'],
      ['`ConcurrentHashMap`', 'Shared maps', 'Use `compute`, `merge`, `putIfAbsent` for atomic updates'],
      ['`AtomicInteger/Long`', 'Counters, IDs, CAS updates', 'Lock-free, single variable only'],
      ['`BlockingQueue`', 'Producer-consumer handoff', '`put` blocks when full, `take` blocks when empty'],
      ['`ExecutorService`', 'Running tasks on a thread pool', 'Do not create raw threads per request'],
    ]),
    java(`
// Producer-consumer with BlockingQueue
BlockingQueue<Job> queue = new ArrayBlockingQueue<>(100);

Runnable producer = () -> {
    try { while (true) queue.put(nextJob()); }
    catch (InterruptedException e) { Thread.currentThread().interrupt(); }
};
Runnable consumer = () -> {
    try { while (true) process(queue.take()); }
    catch (InterruptedException e) { Thread.currentThread().interrupt(); }
};

ExecutorService pool = Executors.newFixedThreadPool(4);
pool.submit(producer);
pool.submit(consumer);
`, 'Producer-consumer'),
    java(`
// Check-then-act must be atomic
// WRONG: two threads can both see null and both book
if (!seatOwner.containsKey(seat)) seatOwner.put(seat, user);

// RIGHT: one atomic call
boolean booked = seatOwner.putIfAbsent(seat, user) == null;

// Per-object lock (lock striping): only callers on the same spot wait
class ParkingSpot {
    private final ReentrantLock lock = new ReentrantLock();
    private Vehicle vehicle;

    boolean tryPark(Vehicle v) {
        lock.lock();
        try {
            if (vehicle != null) return false;
            vehicle = v;
            return true;
        } finally {
            lock.unlock();
        }
    }
}
`, 'Check-then-act'),
    java(`
// Thread-safe token bucket rate limiter (per user)
class TokenBucket {
    private final long capacity;
    private final double refillPerNano;
    private double tokens;
    private long last = System.nanoTime();

    TokenBucket(long capacity, double perSecond) {
        this.capacity = capacity;
        this.refillPerNano = perSecond / 1_000_000_000.0;
        this.tokens = capacity;
    }

    synchronized boolean tryAcquire() {
        long now = System.nanoTime();
        tokens = Math.min(capacity, tokens + (now - last) * refillPerNano);
        last = now;
        if (tokens < 1) return false;
        tokens -= 1;
        return true;
    }
}
`, 'Thread-safe rate limiter'),
    key("Name the race out loud: 'check-then-act on seat availability'. Then fix it with an atomic map op or a per-resource lock. That sentence alone scores points."),
    warn("One global `synchronized` on the whole service. It is correct but serializes every user. Mention lock granularity and deadlock (always lock in a fixed order)."),
    qa([
      ["`HashMap` vs `ConcurrentHashMap` vs `Collections.synchronizedMap`?", "HashMap is not thread-safe. synchronizedMap locks the whole map per call. ConcurrentHashMap allows concurrent reads and fine-grained writes, and offers atomic compound ops."],
      ["How do you avoid deadlock when booking two seats?", "Lock resources in a global order (sorted seat IDs), use `tryLock` with timeout, and keep critical sections short."],
      ["What does `volatile` guarantee?", "Visibility and ordering for one variable. Not atomicity: `count++` on a volatile is still a race."],
    ]),
    drill("15 minutes: write a `BoundedBuffer<T>` with `put` and `take` using `ReentrantLock` and two `Condition`s (notFull, notEmpty). Then rewrite it in 3 lines with `ArrayBlockingQueue` and explain when you would still hand-roll it."),
  ],
});

S.push({
  id: 'errors-extensibility',
  title: 'Error handling and extensibility',
  summary: 'Fail clearly, validate at the edges, and leave hooks for the next requirement.',
  tags: ['exceptions', 'validation', 'extensibility', 'enum', 'optional', 'design'],
  blocks: [
    t("Interviewers poke edge cases: lot is full, payment fails, invalid input. Decide up front how each fails. Then show the design absorbs new requirements with small additions."),
    list([
      "Validate inputs at public methods. Throw `IllegalArgumentException` for bad args, `IllegalStateException` for wrong state.",
      "Create a few domain exceptions for business failures: `SpotUnavailableException`, `InsufficientFundsException`.",
      "Return `Optional<T>` for 'may not exist' lookups instead of null.",
      "Never swallow exceptions silently. Log and rethrow, or convert to a domain error.",
      "Make value objects immutable (`record`), keep mutable state inside the class that owns the rules.",
    ], 'Error handling rules'),
    java(`
public class SpotUnavailableException extends RuntimeException {
    public SpotUnavailableException(VehicleType type) {
        super("No free spot for " + type);
    }
}

public Ticket park(Vehicle v) {
    Objects.requireNonNull(v, "vehicle");
    ParkingSpot spot = finder.find(v.type())
        .orElseThrow(() -> new SpotUnavailableException(v.type()));
    return issueTicket(spot, v);
}
`),
    table(['Extension hook', 'How it looks', 'Example'], [
      ['Interface + new class', 'Strategy / Factory registry', 'New pricing, new payment method'],
      ['Enum with behavior', 'Add a constant', 'New vehicle size'],
      ['Observer/event', 'Add a listener', 'New notification channel'],
      ['Decorator', 'Wrap existing service', 'Add caching, logging, retries'],
      ['Config, not code', 'Values in a config object', 'Rates, limits, capacities'],
    ], 'Extensibility toolkit'),
    key("For every 'what if we add X?' answer with: **which new class**, **which one line of wiring**, and **zero edits to existing logic**."),
    warn("Returning `null` or `-1` for errors in public APIs. Callers forget to check and the bug surfaces far away."),
    drill("10 minutes: take any LLD you did this week. List 3 failure cases and 3 likely new requirements. For each, write the exception or the class you would add."),
  ],
});

// ---------------------------------------------------------------- classic problems

S.push({
  id: 'parking-lot',
  title: 'Problem: Parking Lot',
  summary: 'The most asked LLD. Floors, spot types, tickets, pricing strategy, concurrency on spots.',
  tags: ['parking lot', 'problem', 'strategy', 'factory', 'singleton', 'concurrency'],
  blocks: [
    t("Classic warm-up LLD. It tests entities, enums, Strategy for pricing, and safe spot allocation. Keep it to 8-10 classes."),
    list([
      "Multiple floors, each with spots of size SMALL, MEDIUM, LARGE.",
      "Vehicles: bike, car, truck. A vehicle fits its size or bigger (configurable).",
      "Entry issues a ticket; exit computes fee and frees the spot.",
      "Pricing varies (hourly, flat, per vehicle type).",
      "Out of scope: reservations, payment provider details, EV charging (mention as extension).",
    ], 'Requirements'),
    table(['Class', 'Type', 'Responsibility'], [
      ['`ParkingLot`', 'class (single instance)', 'Entry point: `park`, `unpark`'],
      ['`Floor`', 'class', 'Holds spots, finds a free one'],
      ['`ParkingSpot`', 'class', 'id, size, current vehicle, `tryPark`/`free` (locked)'],
      ['`Vehicle`', 'record', 'plate, type'],
      ['`VehicleType` / `SpotSize`', 'enum', 'Sizes and fit rules'],
      ['`Ticket`', 'record', 'id, vehicle, spot, entry time'],
      ['`SpotAllocationStrategy`', 'interface', 'Nearest first, lowest floor first'],
      ['`PricingStrategy`', 'interface', 'Fee from duration + type'],
    ], 'Core classes'),
    list(['Strategy: pricing and spot allocation.', 'Factory: build vehicles/spots from input.', 'Singleton or single instance via DI: `ParkingLot`.', 'Observer (extension): display boards showing free counts.'], 'Patterns'),
    java(`
enum SpotSize { SMALL, MEDIUM, LARGE }
enum VehicleType {
    BIKE(SpotSize.SMALL), CAR(SpotSize.MEDIUM), TRUCK(SpotSize.LARGE);
    final SpotSize minSize;
    VehicleType(SpotSize s) { this.minSize = s; }
}
record Vehicle(String plate, VehicleType type) { }
record Ticket(String id, Vehicle vehicle, ParkingSpot spot, Instant entry) { }

class ParkingSpot {
    final String id; final SpotSize size;
    private Vehicle vehicle;
    ParkingSpot(String id, SpotSize size) { this.id = id; this.size = size; }
    synchronized boolean tryPark(Vehicle v) {
        if (vehicle != null || size.compareTo(v.type().minSize) < 0) return false;
        vehicle = v;
        return true;
    }
    synchronized void free() { vehicle = null; }
}

interface SpotAllocationStrategy { Optional<ParkingSpot> allocate(List<Floor> floors, Vehicle v); }

class FirstFreeAllocation implements SpotAllocationStrategy {
    public Optional<ParkingSpot> allocate(List<Floor> floors, Vehicle v) {
        for (Floor f : floors)
            for (ParkingSpot s : f.spots())
                if (s.tryPark(v)) return Optional.of(s);   // atomic claim
        return Optional.empty();
    }
}

interface PricingStrategy { long fee(Ticket t, Instant exit); }

class ParkingLot {
    private final List<Floor> floors;
    private final SpotAllocationStrategy allocator;
    private final PricingStrategy pricing;
    private final Map<String, Ticket> active = new ConcurrentHashMap<>();

    ParkingLot(List<Floor> floors, SpotAllocationStrategy a, PricingStrategy p) {
        this.floors = floors; this.allocator = a; this.pricing = p;
    }

    Ticket park(Vehicle v) {
        ParkingSpot spot = allocator.allocate(floors, v)
            .orElseThrow(() -> new IllegalStateException("Lot full for " + v.type()));
        Ticket t = new Ticket(UUID.randomUUID().toString(), v, spot, Instant.now());
        active.put(t.id(), t);
        return t;
    }

    long unpark(String ticketId) {
        Ticket t = active.remove(ticketId);
        if (t == null) throw new IllegalArgumentException("unknown ticket");
        t.spot().free();
        return pricing.fee(t, Instant.now());
    }
}
`),
    key("The concurrency fix is `tryPark` on the spot itself (claim, do not check-then-assign). Two cars racing for one spot: exactly one wins, the other moves on."),
    warn("Scanning every spot on every park is O(spots). Mention the upgrade: per-size free lists (`ConcurrentLinkedDeque<ParkingSpot>`) per floor for O(1) allocation."),
    qa([
      ["Add EV charging spots?", "New spot feature flag plus an allocation strategy that prefers charging spots for EVs. Pricing adds a per-kWh component."],
      ["Multiple entry gates at once?", "Already safe: spot claim is atomic, and active tickets live in a `ConcurrentHashMap`."],
      ["Show free spots on a display board?", "Observer: spots publish occupied/freed events, boards keep counters per floor and size."],
    ]),
    drill("Timer 20 minutes: write the skeleton above from memory. Then add weekend pricing as a new strategy and a per-floor display board via Observer."),
  ],
});

S.push({
  id: 'lru-cache',
  title: 'Problem: LRU Cache',
  summary: 'O(1) get/put with HashMap + doubly linked list; thread-safety follow-up.',
  tags: ['lru', 'cache', 'problem', 'linked list', 'hashmap', 'eviction'],
  blocks: [
    t("LRU evicts the least recently used key when full. Both `get` and `put` must be O(1). The trick: a map for lookup and a doubly linked list for recency order."),
    list([
      "`get(key)` returns the value or empty, and marks it most recent.",
      "`put(key, value)` inserts or updates, marks most recent, evicts LRU when over capacity.",
      "Follow-ups: thread safety, TTL, pluggable eviction (LFU).",
    ], 'Requirements'),
    table(['Class', 'Responsibility'], [
      ['`Node<K,V>`', 'key, value, prev, next'],
      ['`LRUCache<K,V>`', 'map key to node, maintain list with head = most recent'],
      ['`EvictionPolicy<K>` (extension)', 'Interface for LRU/LFU/FIFO'],
    ], 'Core classes'),
    diagram(`
map: { a -> Node(a), b -> Node(b), c -> Node(c) }

HEAD <-> c <-> a <-> b <-> TAIL
         ^                 ^
    most recent       least recent (evict here)
`),
    java(`
class LRUCache<K, V> {
    private final class Node {
        K key; V val; Node prev, next;
        Node(K k, V v) { key = k; val = v; }
    }

    private final int capacity;
    private final Map<K, Node> map = new HashMap<>();
    private final Node head = new Node(null, null);   // sentinels
    private final Node tail = new Node(null, null);

    LRUCache(int capacity) {
        this.capacity = capacity;
        head.next = tail; tail.prev = head;
    }

    public synchronized Optional<V> get(K key) {
        Node n = map.get(key);
        if (n == null) return Optional.empty();
        moveToFront(n);
        return Optional.of(n.val);
    }

    public synchronized void put(K key, V val) {
        Node n = map.get(key);
        if (n != null) { n.val = val; moveToFront(n); return; }
        if (map.size() == capacity) {
            Node lru = tail.prev;
            unlink(lru);
            map.remove(lru.key);
        }
        n = new Node(key, val);
        map.put(key, n);
        addFront(n);
    }

    private void moveToFront(Node n) { unlink(n); addFront(n); }
    private void unlink(Node n) { n.prev.next = n.next; n.next.prev = n.prev; }
    private void addFront(Node n) {
        n.next = head.next; n.prev = head;
        head.next.prev = n; head.next = n;
    }
}
`),
    tip("Shortcut answer: `LinkedHashMap` with `accessOrder = true` and override `removeEldestEntry`. Say it, then offer to hand-roll, because that is usually what they want."),
    key("Sentinel head and tail nodes remove every null check. Unlink and addFront are a few pointer writes each."),
    warn("Forgetting to remove the evicted key from the map, or updating a value without moving its node to the front."),
    qa([
      ["Make it scale under heavy concurrency?", "Shard into N segments by key hash, each its own LRU with its own lock. Reads mutate order, so a plain read lock is not enough."],
      ["Add TTL?", "Store `expiresAt` in the node; treat expired as a miss on `get` and remove it. Optionally add a background sweeper or a min-heap by expiry."],
    ]),
    drill("15 minutes: write LRU from a blank file, then trace it on capacity 2: put(1), put(2), get(1), put(3), get(2). Expected: get(2) is empty because 2 was least recent."),
  ],
});

S.push({
  id: 'rate-limiter-lld',
  title: 'Problem: Rate Limiter',
  summary: 'Token bucket and sliding window per user, behind one interface.',
  tags: ['rate limiter', 'problem', 'token bucket', 'sliding window', 'strategy', 'concurrency'],
  blocks: [
    t("Limit each client to N requests per time window. The LLD version is in-memory and thread-safe. The algorithm is a Strategy so you can swap token bucket and sliding window."),
    list([
      "`allow(clientId)` returns true or false.",
      "Config per client tier (free: 10/min, pro: 100/min).",
      "Thread-safe for concurrent requests from the same client.",
    ], 'Requirements'),
    table(['Class', 'Responsibility'], [
      ['`RateLimiter` (interface)', '`boolean allow(String clientId)`'],
      ['`TokenBucketLimiter`', 'Bucket per client, refill by elapsed time, allows bursts'],
      ['`SlidingWindowLogLimiter`', 'Deque of timestamps per client, exact but memory heavy'],
      ['`RateLimitConfig`', 'record: capacity, window or refill rate'],
      ['`RateLimiterFactory`', 'Builds a limiter by algorithm name'],
    ], 'Core classes'),
    java(`
interface RateLimiter { boolean allow(String clientId); }

record RateLimitConfig(int maxRequests, Duration window) { }

class SlidingWindowLogLimiter implements RateLimiter {
    private final RateLimitConfig cfg;
    private final Map<String, Deque<Long>> logs = new ConcurrentHashMap<>();

    SlidingWindowLogLimiter(RateLimitConfig cfg) { this.cfg = cfg; }

    public boolean allow(String clientId) {
        Deque<Long> log = logs.computeIfAbsent(clientId, k -> new ArrayDeque<>());
        long now = System.currentTimeMillis();
        long cutoff = now - cfg.window().toMillis();
        synchronized (log) {                                // per-client lock
            while (!log.isEmpty() && log.peekFirst() <= cutoff) log.pollFirst();
            if (log.size() >= cfg.maxRequests()) return false;
            log.addLast(now);
            return true;
        }
    }
}

class TokenBucketLimiter implements RateLimiter {
    private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();
    private final long capacity; private final double perSecond;

    TokenBucketLimiter(long capacity, double perSecond) {
        this.capacity = capacity; this.perSecond = perSecond;
    }

    public boolean allow(String clientId) {
        return buckets.computeIfAbsent(clientId, k -> new TokenBucket(capacity, perSecond))
                      .tryAcquire();   // TokenBucket: see the Concurrency section
    }
}
`),
    table(['Algorithm', 'Burst', 'Memory', 'Accuracy'], [
      ['Fixed window counter', 'Double burst at window edge', 'O(1)', 'Low'],
      ['Sliding window log', 'No', 'O(N) per client', 'Exact'],
      ['Sliding window counter', 'Small', 'O(1)', 'Good approximation'],
      ['Token bucket', 'Yes, up to capacity', 'O(1)', 'Good'],
      ['Leaky bucket', 'No, smooth output', 'O(queue)', 'Good'],
    ]),
    key("Lock per client, not globally. Use `computeIfAbsent` to create per-client state atomically."),
    warn("Calling `System.currentTimeMillis()` directly makes tests flaky. Inject a `java.time.Clock` for testability."),
    qa([
      ["How to make it distributed?", "Move state to Redis: `INCR` + `EXPIRE` for fixed window, or a Lua script for token bucket so read-modify-write is atomic."],
      ["Memory grows with clients forever?", "Evict idle client state with a TTL cache or a periodic sweep."],
    ]),
    drill("15 minutes: implement a fixed window counter as a third strategy. Then write a request sequence that shows its edge-burst problem with a 10 req/min limit."),
  ],
});

S.push({
  id: 'elevator',
  title: 'Problem: Elevator System',
  summary: 'Cars, requests, a dispatcher strategy, and per-car movement logic.',
  tags: ['elevator', 'problem', 'state', 'strategy', 'scheduling'],
  blocks: [
    t("Several elevator cars serve floors. Hall calls (up/down button on a floor) go to a dispatcher that picks a car. Each car runs its own state and stop queue."),
    list([
      "N cars, M floors. Hall requests (floor, direction) and car requests (destination floor).",
      "Dispatcher assigns hall requests to a car.",
      "Car states: IDLE, MOVING_UP, MOVING_DOWN, DOORS_OPEN, MAINTENANCE.",
      "Out of scope: weight sensors, express zones (extensions).",
    ], 'Requirements'),
    table(['Class', 'Responsibility'], [
      ['`ElevatorSystem`', 'Entry point, holds cars and dispatcher'],
      ['`ElevatorCar`', 'Current floor, direction, state, stop sets'],
      ['`Request`', 'record: floor, direction'],
      ['`DispatchStrategy`', 'interface: choose a car for a hall request'],
      ['`Direction`, `CarState`', 'enums'],
    ], 'Core classes'),
    list(['Strategy: dispatching (nearest car, same-direction first, zoning).', 'State: car behavior per state.', 'Observer: floor displays.', 'LOOK algorithm: keep going one way while stops remain, then reverse.'], 'Patterns'),
    java(`
enum Direction { UP, DOWN, IDLE }
record Request(int floor, Direction dir) { }

class ElevatorCar {
    final int id;
    private int floor = 0;
    private Direction dir = Direction.IDLE;
    private final TreeSet<Integer> upStops = new TreeSet<>();
    private final TreeSet<Integer> downStops = new TreeSet<>();

    ElevatorCar(int id) { this.id = id; }

    synchronized void addStop(int target) {
        if (target >= floor) upStops.add(target); else downStops.add(target);
        if (dir == Direction.IDLE) dir = target >= floor ? Direction.UP : Direction.DOWN;
    }

    // Called once per tick: LOOK algorithm
    synchronized void step() {
        if (dir == Direction.UP) {
            Integer next = upStops.ceiling(floor);
            if (next == null) { dir = downStops.isEmpty() ? Direction.IDLE : Direction.DOWN; return; }
            if (floor < next) floor++;
            if (floor == next) upStops.remove(next);     // open doors here
        } else if (dir == Direction.DOWN) {
            Integer next = downStops.floor(floor);
            if (next == null) { dir = upStops.isEmpty() ? Direction.IDLE : Direction.UP; return; }
            if (floor > next) floor--;
            if (floor == next) downStops.remove(next);
        }
    }

    synchronized int distanceTo(Request r) { return Math.abs(floor - r.floor()); }
    synchronized Direction dir() { return dir; }
}

interface DispatchStrategy { ElevatorCar pick(List<ElevatorCar> cars, Request r); }

class NearestIdleOrSameDirection implements DispatchStrategy {
    public ElevatorCar pick(List<ElevatorCar> cars, Request r) {
        return cars.stream()
            .filter(c -> c.dir() == Direction.IDLE || c.dir() == r.dir())
            .min(Comparator.comparingInt(c -> c.distanceTo(r)))
            .orElse(cars.get(0));
    }
}
`),
    key("Two separate concerns: **dispatch** (which car) is a Strategy; **movement** (what next stop) is the car's own LOOK loop over sorted stop sets."),
    warn("One global FIFO queue of requests. Real elevators do not serve in arrival order; FIFO causes ping-ponging between floors."),
    qa([
      ["Handle a car going into maintenance?", "State MAINTENANCE: the dispatcher filters it out and its pending hall requests are reassigned."],
      ["Peak-hour optimization?", "Swap the DispatchStrategy: zone cars by floor ranges in the morning, park idle cars at the lobby."],
    ]),
    drill("20 minutes: 2 cars on 10 floors, requests (5,UP), (2,DOWN), (8,DOWN). Trace by hand which car takes each and the stop order. Then code `ElevatorSystem.requestHall`."),
  ],
});

S.push({
  id: 'vending-machine',
  title: 'Problem: Vending Machine (State pattern)',
  summary: 'Textbook State pattern: idle, has money, dispensing, out of service.',
  tags: ['vending machine', 'problem', 'state', 'inventory'],
  blocks: [
    t("The vending machine is the go-to State pattern question. Every action (insert money, select, cancel) behaves differently by state. Start with the transition table."),
    list([
      "Insert coins/notes, select product, dispense, return change, cancel/refund.",
      "Track inventory per slot; reject sold-out selections.",
      "Admin can restock.",
    ], 'Requirements'),
    table(['State', 'insertMoney', 'select', 'cancel'], [
      ['Idle', 'add balance -> HasMoney', 'error: insert money', 'no-op'],
      ['HasMoney', 'add balance', 'enough + in stock -> Dispensing; else error', 'refund -> Idle'],
      ['Dispensing', 'reject', 'reject', 'reject'],
      ['OutOfService', 'reject + refund', 'reject', 'refund'],
    ], 'Transition table'),
    java(`
interface VmState {
    default void insert(VendingMachine m, int amount) { throw new IllegalStateException("not now"); }
    default void select(VendingMachine m, String code) { throw new IllegalStateException("not now"); }
    default void cancel(VendingMachine m) { }
}

class Idle implements VmState {
    public void insert(VendingMachine m, int amt) { m.addBalance(amt); m.setState(new HasMoney()); }
}

class HasMoney implements VmState {
    public void insert(VendingMachine m, int amt) { m.addBalance(amt); }
    public void select(VendingMachine m, String code) {
        Slot s = m.inventory().get(code);
        if (s == null || s.count() == 0) throw new IllegalStateException("sold out");
        if (m.balance() < s.price()) throw new IllegalStateException("insert more");
        m.setState(new Dispensing());
        m.dispense(s);
    }
    public void cancel(VendingMachine m) { m.refund(); m.setState(new Idle()); }
}

class Dispensing implements VmState { }   // rejects everything by default

class VendingMachine {
    private VmState state = new Idle();
    private int balance;
    private final Map<String, Slot> inventory = new HashMap<>();

    synchronized void insert(int amt) { state.insert(this, amt); }
    synchronized void select(String code) { state.select(this, code); }
    synchronized void cancel() { state.cancel(this); }

    void dispense(Slot s) {
        s.take();
        int change = balance - s.price();
        balance = 0;
        returnChange(change);
        setState(new Idle());
    }
    // addBalance, refund, returnChange, setState, inventory() omitted
}
`),
    key("States hold no data, so they can be shared constants. The machine holds the data; the states hold the rules."),
    warn("Ignoring change-making: the machine may lack coins for exact change. Mention a `CoinInventory` with a greedy or DP change algorithm."),
    qa([
      ["Add card payments?", "Payment becomes a Strategy (`CashPayment`, `CardPayment`). HasMoney becomes a 'PaymentAuthorized' state."],
      ["Power failure mid-dispense?", "Persist state and balance; on restart in Dispensing, either complete or refund."],
    ]),
    drill("15 minutes: write the transition table for an ATM (Idle, CardInserted, PinVerified, Dispensing) and code two of the states. Note which actions each state rejects."),
  ],
});

S.push({
  id: 'movie-booking',
  title: 'Problem: Movie Ticket Booking',
  summary: 'Shows, seats, temporary seat holds, and safe concurrent booking.',
  tags: ['bookmyshow', 'booking', 'problem', 'concurrency', 'seat lock', 'ttl'],
  blocks: [
    t("Users browse movies by city, pick a show, choose seats, and pay. The core challenge is two users picking the same seat. Use a temporary hold with expiry, then confirm on payment."),
    list([
      "Search movies by city; list theatres and shows.",
      "View the seat map; hold selected seats for about 5 minutes.",
      "Pay to confirm; holds expire automatically.",
      "Out of scope: dynamic pricing, food add-ons (extensions).",
    ], 'Requirements'),
    table(['Class', 'Responsibility'], [
      ['`Movie`, `Theatre`, `Screen`', 'Catalog data'],
      ['`Show`', 'movie + screen + start time; owns its `ShowSeat`s'],
      ['`ShowSeat`', 'seat in a show: AVAILABLE/HELD/BOOKED, heldBy, holdExpiry'],
      ['`Booking`', 'id, user, show, seats, status, amount'],
      ['`SeatHoldService`', 'Atomic hold/confirm of multiple seats'],
      ['`BookingService`', 'hold -> pay -> confirm flow'],
      ['`PaymentGateway`', 'interface (Adapter for real providers)'],
    ], 'Core classes'),
    java(`
enum SeatStatus { AVAILABLE, HELD, BOOKED }

class ShowSeat {
    final String seatId;
    private SeatStatus status = SeatStatus.AVAILABLE;
    private String heldBy;
    private Instant holdExpiry;
    ShowSeat(String id) { this.seatId = id; }

    boolean isFree(Instant now) {
        return status == SeatStatus.AVAILABLE
            || (status == SeatStatus.HELD && now.isAfter(holdExpiry));
    }
    void hold(String user, Instant until) { status = SeatStatus.HELD; heldBy = user; holdExpiry = until; }
    void book() { status = SeatStatus.BOOKED; }
    void release() { status = SeatStatus.AVAILABLE; heldBy = null; }
    String heldBy() { return heldBy; }
}

class Show {
    final String id;
    final Map<String, ShowSeat> seats = new HashMap<>();
    final ReentrantLock lock = new ReentrantLock();   // one lock per show
    Show(String id) { this.id = id; }
}

class SeatHoldService {
    private static final Duration HOLD = Duration.ofMinutes(5);

    // All-or-nothing: either every requested seat is held, or none.
    boolean hold(Show show, List<String> seatIds, String user) {
        show.lock.lock();
        try {
            Instant now = Instant.now();
            for (String id : seatIds)
                if (!show.seats.get(id).isFree(now)) return false;
            for (String id : seatIds)
                show.seats.get(id).hold(user, now.plus(HOLD));
            return true;
        } finally {
            show.lock.unlock();
        }
    }

    boolean confirm(Show show, List<String> seatIds, String user) {
        show.lock.lock();
        try {
            Instant now = Instant.now();
            for (String id : seatIds) {
                ShowSeat s = show.seats.get(id);
                if (!user.equals(s.heldBy()) || s.isFree(now)) return false;  // hold lost or expired
            }
            seatIds.forEach(id -> show.seats.get(id).book());
            return true;
        } finally {
            show.lock.unlock();
        }
    }
}
`),
    key("Hold all seats in one critical section (all-or-nothing). Lock per **show**, not globally, so different shows never contend."),
    warn("Charging the card, then discovering the hold expired. Check the hold before charging, and refund if confirm fails after payment."),
    qa([
      ["How does this work across many servers?", "Move the lock into the database: a conditional `UPDATE ... SET status='HELD' WHERE id IN (...) AND status='AVAILABLE'` and check the row count, or optimistic locking with a version column. Redis `SET NX PX` for holds also works."],
      ["Who releases expired holds?", "Lazy expiry (treat as free when checked) plus a periodic cleanup job so seat maps stay accurate."],
    ]),
    drill("20 minutes: code `BookingService.book(user, show, seats)` that holds, calls a fake payment, then confirms or releases. Write down the 2-thread interleaving that would double-book without the show lock."),
  ],
});

S.push({
  id: 'library-management',
  title: 'Problem: Library Management',
  summary: 'Books vs copies, members, loans, reservations, and fines.',
  tags: ['library', 'problem', 'observer', 'strategy', 'repository'],
  blocks: [
    t("A library tracks titles, physical copies, members, and loans. The key modeling insight: a `Book` (title, ISBN) is not a `BookCopy` (a barcode on the shelf)."),
    list([
      "Search books by title, author, ISBN.",
      "Members borrow up to N copies for D days; return; renew.",
      "Fines for late returns (rule varies by member type).",
      "Reserve a title when no copy is free; notify when one returns.",
    ], 'Requirements'),
    table(['Class', 'Responsibility'], [
      ['`Book`', 'ISBN, title, authors (catalog entry)'],
      ['`BookCopy`', 'barcode, book, status (AVAILABLE, LOANED, ON_HOLD, LOST)'],
      ['`Member`', 'id, type, active loans'],
      ['`Loan`', 'copy, member, issue date, due date'],
      ['`Reservation`', 'member, book, created time (FIFO queue per book)'],
      ['`FinePolicy`', 'Strategy: per-day, capped, waived for staff'],
      ['`LibraryService`', 'checkout, checkin, reserve; uses repositories'],
    ], 'Core classes'),
    java(`
enum CopyStatus { AVAILABLE, LOANED, ON_HOLD, LOST }
record Book(String isbn, String title, List<String> authors) { }

class BookCopy {
    final String barcode; final Book book;
    CopyStatus status = CopyStatus.AVAILABLE;
    BookCopy(String barcode, Book book) { this.barcode = barcode; this.book = book; }
}

record Loan(BookCopy copy, Member member, LocalDate issued, LocalDate due) { }

interface FinePolicy { long fineCents(Loan loan, LocalDate returned); }

class PerDayFine implements FinePolicy {
    public long fineCents(Loan l, LocalDate r) {
        long late = ChronoUnit.DAYS.between(l.due(), r);
        return Math.max(0, late) * 1000;
    }
}

class LibraryService {
    private final Map<String, Deque<Member>> waitlist = new ConcurrentHashMap<>();
    private final FinePolicy fines;
    private final Notifier notifier;
    LibraryService(FinePolicy f, Notifier n) { fines = f; notifier = n; }

    synchronized Loan checkout(Member m, BookCopy c) {
        if (c.status != CopyStatus.AVAILABLE) throw new IllegalStateException("not available");
        if (m.activeLoans() >= m.type().maxLoans()) throw new IllegalStateException("limit reached");
        c.status = CopyStatus.LOANED;
        Loan loan = new Loan(c, m, LocalDate.now(), LocalDate.now().plusDays(m.type().loanDays()));
        m.addLoan(loan);
        return loan;
    }

    synchronized long checkin(Loan loan) {
        loan.member().removeLoan(loan);
        Deque<Member> q = waitlist.getOrDefault(loan.copy().book.isbn(), new ArrayDeque<>());
        Member next = q.pollFirst();
        if (next != null) {
            loan.copy().status = CopyStatus.ON_HOLD;
            notifier.notify(next, "Your book is ready: " + loan.copy().book.title());
        } else {
            loan.copy().status = CopyStatus.AVAILABLE;
        }
        return fines.fineCents(loan, LocalDate.now());
    }
}
`),
    key("Book vs BookCopy is the insight interviewers look for. Same idea as Movie vs Show, Product vs Item, Flight vs Seat."),
    warn("Putting fine math inside `Member` with `if (type == STUDENT)`. Use a FinePolicy strategy keyed by member type."),
    qa([
      ["Search by multiple fields?", "A `SearchCriteria` object combined as predicates, or separate indexes (title to books, author to books)."],
      ["Reservation hold expires?", "ON_HOLD copies get a pickup deadline; a scheduled job hands them to the next member or back to AVAILABLE."],
    ]),
    drill("15 minutes: draw the text class diagram, then code `renew(loan)` with two rules: max 2 renewals, and no renewal if someone is waiting for that title."),
  ],
});

S.push({
  id: 'board-games',
  title: 'Problem: Snake & Ladder / Tic-Tac-Toe',
  summary: 'Board games: board, players, turn loop, pluggable dice and win rules.',
  tags: ['snake and ladder', 'tic tac toe', 'problem', 'game', 'strategy', 'machine coding'],
  blocks: [
    t("Board games test clean separation: board state, players, a game loop, and rules. Machine coding rounds often want a runnable version. Keep I/O out of the domain classes."),
    list([
      "Snake & Ladder: N players, 100 cells, snakes and ladders as jumps, dice roll, first to 100 wins.",
      "Tic-Tac-Toe: N x N board, 2 players, win on a full row, column, or diagonal; detect a draw.",
      "Both: configurable board, pluggable dice or player strategy (human or bot).",
    ], 'Requirements'),
    table(['Piece', 'Snake & Ladder', 'Tic-Tac-Toe'], [
      ['Board', '`Map<Integer,Integer> jumps`, size', 'row/col/diagonal counters'],
      ['Player', 'name, position', 'name, symbol'],
      ['Rule piece', '`Dice` interface (normal, fixed for tests)', 'O(1) win check'],
      ['Game', 'turn queue, `play()` loop', 'turn index, `move(r, c)`'],
    ], 'Core classes'),
    java(`
// Snake & Ladder
interface Dice { int roll(); }
class SixSidedDice implements Dice {
    private final Random rnd = new Random();
    public int roll() { return rnd.nextInt(6) + 1; }
}

record Player(String name) { }

class SnakeLadderGame {
    private final int size;
    private final Map<Integer, Integer> jumps;      // snake head->tail, ladder bottom->top
    private final Deque<Player> turns;
    private final Map<Player, Integer> pos = new HashMap<>();
    private final Dice dice;

    SnakeLadderGame(int size, Map<Integer, Integer> jumps, List<Player> players, Dice dice) {
        this.size = size; this.jumps = jumps; this.dice = dice;
        this.turns = new ArrayDeque<>(players);
        players.forEach(p -> pos.put(p, 0));
    }

    Player play() {
        while (true) {
            Player p = turns.pollFirst();
            int next = pos.get(p) + dice.roll();
            if (next <= size) pos.put(p, jumps.getOrDefault(next, next));   // overshoot = stay
            if (pos.get(p) == size) return p;
            turns.addLast(p);
        }
    }
}

// Tic-Tac-Toe: O(1) win check with counters
class TicTacToe {
    private final int n;
    private final int[] rows, cols;
    private int diag, anti, moves;

    TicTacToe(int n) { this.n = n; rows = new int[n]; cols = new int[n]; }

    /** player is +1 or -1. Returns true if this move wins. */
    boolean move(int r, int c, int player) {
        rows[r] += player; cols[c] += player; moves++;
        if (r == c) diag += player;
        if (r + c == n - 1) anti += player;
        int target = player * n;
        return rows[r] == target || cols[c] == target || diag == target || anti == target;
    }

    boolean isDraw() { return moves == n * n; }
}
`),
    key("Dice and player moves behind interfaces make the game testable: inject a fixed-sequence dice in tests."),
    warn("Scanning the whole board after every Tic-Tac-Toe move is O(n^2). Counters give O(1) and are a common follow-up."),
    qa([
      ["Add a bot player?", "A `MoveStrategy` interface: `HumanMove` reads input, `RandomBot` or `MinimaxBot` computes. The game loop calls `strategy.nextMove(board)`."],
      ["Validate the board config?", "Reject jumps from the last cell, cycles, and a snake and ladder starting on the same cell."],
    ]),
    drill("15 minutes: code Snake & Ladder end to end with a `FixedDice` for tests. Then add 'roll a 6 to get another turn' with the smallest possible change."),
  ],
});

S.push({
  id: 'splitwise',
  title: 'Problem: Splitwise',
  summary: 'Expenses, split strategies, balances, and simplifying debts.',
  tags: ['splitwise', 'problem', 'strategy', 'expenses', 'heap'],
  blocks: [
    t("Users add expenses paid by one person and split among many. The app shows who owes whom. Split rules vary, so they are a Strategy. Balances are a net map per user."),
    list([
      "Add expense: payer, amount, participants, split type (EQUAL, EXACT, PERCENT).",
      "Show balances per user and per pair.",
      "Groups of users; settle up.",
      "Extension: simplify debts to minimize transactions.",
    ], 'Requirements'),
    table(['Class', 'Responsibility'], [
      ['`User`', 'id, name'],
      ['`Split`', 'record: user, amount owed'],
      ['`SplitStrategy`', 'EQUAL / EXACT / PERCENT; validates and returns `List<Split>`'],
      ['`Expense`', 'id, payer, total, splits, description'],
      ['`BalanceSheet`', 'net balance per user pair'],
      ['`ExpenseService`', 'addExpense, balances, settle'],
    ], 'Core classes'),
    java(`
record Split(String userId, long cents) { }

interface SplitStrategy {
    List<Split> split(long totalCents, List<String> users, List<Double> params);
}

class EqualSplit implements SplitStrategy {
    public List<Split> split(long total, List<String> users, List<Double> ignored) {
        long each = total / users.size();
        long remainder = total % users.size();     // give leftover cents to the first users
        List<Split> out = new ArrayList<>();
        for (int i = 0; i < users.size(); i++)
            out.add(new Split(users.get(i), each + (i < remainder ? 1 : 0)));
        return out;
    }
}

class PercentSplit implements SplitStrategy {
    public List<Split> split(long total, List<String> users, List<Double> pct) {
        double sum = pct.stream().mapToDouble(Double::doubleValue).sum();
        if (Math.abs(sum - 100.0) > 1e-9) throw new IllegalArgumentException("must sum to 100");
        List<Split> out = new ArrayList<>();
        for (int i = 0; i < users.size(); i++)
            out.add(new Split(users.get(i), Math.round(total * pct.get(i) / 100.0)));
        return out;
    }
}

class BalanceSheet {
    // net.get(a).get(b) > 0 means b owes a
    private final Map<String, Map<String, Long>> net = new HashMap<>();

    synchronized void record(String payer, List<Split> splits) {
        for (Split s : splits) {
            if (s.userId().equals(payer)) continue;
            add(payer, s.userId(), s.cents());
            add(s.userId(), payer, -s.cents());
        }
    }
    private void add(String a, String b, long v) {
        net.computeIfAbsent(a, k -> new HashMap<>()).merge(b, v, Long::sum);
    }
}
`),
    key("Money is `long` cents, never `double`. Handle leftover cents explicitly in equal splits."),
    tip("Simplify debts: compute each user's net (paid minus owed). Put creditors and debtors in two max-heaps; repeatedly settle the largest debtor against the largest creditor. At most N-1 transfers."),
    warn("Storing pairwise debts without netting. A owes B 100 and B owes A 40 should show one line: A owes B 60."),
    qa([
      ["Multiple currencies?", "Store currency on each expense; convert at settle time with a rate provider. Never mix currencies in one balance unconverted."],
      ["Edit or delete an expense?", "Reverse its splits from the balance sheet, then apply the new version. Keep an audit log."],
    ]),
    drill("15 minutes: implement `ExactSplit` with validation, then `simplify()` with two heaps. Test by hand first: A paid 300 split equally by A, B, C; B paid 150 split by B, C. Nets: A +200, B -25, C -175, so C pays A 175 and B pays A 25."),
  ],
});

S.push({
  id: 'logger',
  title: 'Problem: Logger',
  summary: 'Levels, multiple sinks, formatting, and async writes.',
  tags: ['logger', 'problem', 'chain of responsibility', 'observer', 'singleton', 'async'],
  blocks: [
    t("A logging library takes messages with a level and sends them to one or more sinks (console, file, remote). It must be cheap for callers and safe across threads."),
    list([
      "Levels: DEBUG < INFO < WARN < ERROR; drop messages below the configured level.",
      "Multiple appenders (console, file, network), each with its own formatter.",
      "Thread-safe and ideally non-blocking for the caller.",
    ], 'Requirements'),
    table(['Class', 'Responsibility'], [
      ['`Logger`', 'API: `info`, `error`...; one instance per name'],
      ['`LogLevel`', 'enum with ordering'],
      ['`LogRecord`', 'record: time, level, thread, message'],
      ['`Appender`', 'interface: `append(LogRecord)`'],
      ['`Formatter`', 'interface: record to string'],
      ['`AsyncAppender`', 'Decorator: queue + background thread around another appender'],
    ], 'Core classes'),
    list(['Singleton / registry: one logger per name.', 'Observer: the logger fans out to appenders.', 'Chain of Responsibility: level handlers (alternative design).', 'Decorator: async, buffering, filtering around an appender.', 'Strategy: formatter.'], 'Patterns'),
    java(`
enum LogLevel { DEBUG, INFO, WARN, ERROR }
record LogRecord(Instant time, LogLevel level, String thread, String msg) { }

interface Appender { void append(LogRecord r); }

class ConsoleAppender implements Appender {
    public void append(LogRecord r) {
        System.out.println(r.time() + " [" + r.level() + "] " + r.thread() + " - " + r.msg());
    }
}

class AsyncAppender implements Appender {                      // Decorator
    private final BlockingQueue<LogRecord> q = new LinkedBlockingQueue<>(10_000);
    AsyncAppender(Appender inner) {
        Thread t = new Thread(() -> {
            try { while (true) inner.append(q.take()); }
            catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        }, "log-writer");
        t.setDaemon(true);
        t.start();
    }
    public void append(LogRecord r) {
        if (!q.offer(r)) { /* queue full: count the drop, never block the caller */ }
    }
}

final class Logger {
    private static final Map<String, Logger> REGISTRY = new ConcurrentHashMap<>();
    private final List<Appender> appenders = new CopyOnWriteArrayList<>();
    private volatile LogLevel min = LogLevel.INFO;

    static Logger get(String name) { return REGISTRY.computeIfAbsent(name, n -> new Logger()); }
    void addAppender(Appender a) { appenders.add(a); }
    void setLevel(LogLevel l) { min = l; }

    void log(LogLevel level, String msg) {
        if (level.compareTo(min) < 0) return;                  // cheap filter first
        var r = new LogRecord(Instant.now(), level, Thread.currentThread().getName(), msg);
        for (Appender a : appenders) a.append(r);
    }
    void info(String m) { log(LogLevel.INFO, m); }
    void error(String m) { log(LogLevel.ERROR, m); }
}
`),
    key("Filter by level before building the message. Async appenders keep slow disks and networks off the request thread."),
    warn("Blocking callers when the async queue is full during an incident. State a policy: drop DEBUG first, count drops, never block."),
    drill("15 minutes: add a `RollingFileAppender` that starts a new file at 10 MB. Then explain how to flush pending async logs on shutdown (shutdown hook plus drain)."),
  ],
});

S.push({
  id: 'notification-service',
  title: 'Problem: Notification Service',
  summary: 'Multi-channel sends with templates, preferences, retries, and idempotency.',
  tags: ['notification', 'problem', 'factory', 'strategy', 'retry', 'template', 'idempotency'],
  blocks: [
    t("Other services call one API to notify a user. The service picks channels from user preferences, renders a template, and sends with retries. Channels are pluggable."),
    list([
      "`send(request)` from any service: user, event type, data.",
      "Channels: email, SMS, push; users opt out per channel and event type.",
      "Templates per event type and channel.",
      "Retry transient failures; never double-send (idempotency key).",
    ], 'Requirements'),
    table(['Class', 'Responsibility'], [
      ['`NotificationRequest`', 'record: idempotencyKey, userId, eventType, data'],
      ['`Channel`', 'interface: `send(user, body)`; Email/Sms/Push implementations'],
      ['`PreferenceService`', 'Which channels a user allows for an event'],
      ['`TemplateEngine`', 'Render a template with data'],
      ['`RetryPolicy`', 'Strategy: exponential backoff, max attempts'],
      ['`NotificationService`', 'Orchestrates the flow'],
    ], 'Core classes'),
    java(`
enum ChannelType { EMAIL, SMS, PUSH }
record NotificationRequest(String idemKey, String userId, String event, Map<String, String> data) { }

interface Channel {
    ChannelType type();
    void send(User u, String body) throws TransientSendException;
}

interface RetryPolicy { Optional<Duration> nextDelay(int attempt); }

class ExponentialBackoff implements RetryPolicy {
    public Optional<Duration> nextDelay(int attempt) {
        if (attempt >= 4) return Optional.empty();
        long ms = (long) (200 * Math.pow(2, attempt) * (0.5 + Math.random()));   // jitter
        return Optional.of(Duration.ofMillis(ms));
    }
}

class NotificationService {
    private final Map<ChannelType, Channel> channels;
    private final PreferenceService prefs;
    private final TemplateEngine templates;
    private final RetryPolicy retry;
    private final Set<String> sent = ConcurrentHashMap.newKeySet();   // idempotency

    NotificationService(List<Channel> chs, PreferenceService p, TemplateEngine t, RetryPolicy r) {
        this.channels = chs.stream().collect(Collectors.toMap(Channel::type, c -> c));
        this.prefs = p; this.templates = t; this.retry = r;
    }

    void send(NotificationRequest req) {
        User user = prefs.user(req.userId());
        for (ChannelType type : prefs.allowedChannels(user, req.event())) {
            String key = req.idemKey() + ":" + type;
            if (!sent.add(key)) continue;                      // already sent
            String body = templates.render(req.event(), type, req.data());
            deliverWithRetry(channels.get(type), user, body);
        }
    }

    private void deliverWithRetry(Channel ch, User u, String body) {
        for (int attempt = 0; ; attempt++) {
            try { ch.send(u, body); return; }
            catch (TransientSendException e) {
                Optional<Duration> d = retry.nextDelay(attempt);
                if (d.isEmpty()) { /* move to a dead-letter store */ return; }
                sleep(d.get());   // in production: re-enqueue with a delay instead
            }
        }
    }
}
`),
    key("Adding a channel (WhatsApp) = one new `Channel` class registered at startup. Nothing else changes."),
    warn("Retrying permanent errors (invalid phone number). Split exceptions into transient vs permanent and retry only transient."),
    qa([
      ["Priority (OTP vs marketing)?", "Separate queues per priority with dedicated workers, so marketing bursts never delay OTPs."],
      ["Per-user rate limits?", "Wrap channels in a rate-limiting Decorator, or check a RateLimiter before sending marketing events."],
    ]),
    drill("15 minutes: add quiet hours (no non-critical push between 22:00 and 08:00 user local time). Decide where the rule lives and write it as a small filter or strategy."),
  ],
});

S.push({
  id: 'kv-store-ttl',
  title: 'Problem: In-memory key-value store with TTL',
  summary: 'get/put/delete with per-key expiry, lazy + active cleanup, thread-safe.',
  tags: ['key value store', 'ttl', 'problem', 'cache', 'concurrency', 'delayqueue', 'redis'],
  blocks: [
    t("Build a mini Redis: `put(key, value, ttl)`, `get`, `delete`. Expired keys must never be returned. Memory must not leak from keys nobody reads again."),
    list([
      "`put(k, v)` and `put(k, v, ttl)`; `get(k)` is empty when missing or expired; `delete(k)`.",
      "Thread-safe for concurrent clients.",
      "Extensions: max size with eviction, transactions, persistence.",
    ], 'Requirements'),
    table(['Class', 'Responsibility'], [
      ['`Entry<V>`', 'record: value, expiresAt (or Long.MAX_VALUE)'],
      ['`KvStore<K,V>`', 'ConcurrentHashMap of entries; lazy expiry on read'],
      ['`Expiry` + `DelayQueue`', 'Min-heap by expiry time for active cleanup'],
      ['`Clock`', 'Injected for tests (extension)'],
    ], 'Core classes'),
    java(`
class KvStore<K, V> {
    private record Entry<V>(V value, long expiresAt) {
        boolean expired(long now) { return now >= expiresAt; }
    }
    private record Expiry<K>(K key, long at) implements Delayed {
        public long getDelay(TimeUnit u) {
            return u.convert(at - System.currentTimeMillis(), TimeUnit.MILLISECONDS);
        }
        public int compareTo(Delayed o) { return Long.compare(at, ((Expiry<?>) o).at); }
    }

    private final ConcurrentHashMap<K, Entry<V>> map = new ConcurrentHashMap<>();
    private final DelayQueue<Expiry<K>> expiries = new DelayQueue<>();

    KvStore() {
        Thread sweeper = new Thread(() -> {
            try {
                while (true) {
                    Expiry<K> e = expiries.take();             // blocks until due
                    // remove only if not overwritten with a newer TTL
                    map.computeIfPresent(e.key(), (k, cur) -> cur.expiresAt() == e.at() ? null : cur);
                }
            } catch (InterruptedException ex) { Thread.currentThread().interrupt(); }
        }, "kv-sweeper");
        sweeper.setDaemon(true);
        sweeper.start();
    }

    void put(K k, V v) { map.put(k, new Entry<>(v, Long.MAX_VALUE)); }

    void put(K k, V v, Duration ttl) {
        long at = System.currentTimeMillis() + ttl.toMillis();
        map.put(k, new Entry<>(v, at));
        expiries.put(new Expiry<>(k, at));
    }

    Optional<V> get(K k) {
        Entry<V> e = map.get(k);
        if (e == null) return Optional.empty();
        if (e.expired(System.currentTimeMillis())) {
            map.remove(k, e);                                  // lazy expiry, this exact entry only
            return Optional.empty();
        }
        return Optional.of(e.value());
    }

    void delete(K k) { map.remove(k); }
}
`),
    key("Use **both** lazy expiry (check on read, always correct) and active expiry (sweeper, frees memory). Redis does the same."),
    warn("The overwrite race: a key set with TTL 5s is re-set with TTL 60s. The old expiry must not delete the new value, so compare the stored expiry before removing."),
    qa([
      ["Add max memory with LRU eviction?", "Combine with the LRU structure (map + linked list), or a `LinkedHashMap` in access order inside a lock, evicting on put."],
      ["Persistence?", "Append-only log of writes (replay on start) plus periodic snapshots. Mention the fsync trade-off: every write vs every second."],
      ["Transactions (MULTI/EXEC)?", "Buffer commands per client, then apply all under a lock, or use optimistic version checks on watched keys."],
    ]),
    drill("20 minutes: rebuild this store with an injected `Clock` instead of `System.currentTimeMillis()`. Write a test that advances the clock to prove expiry, including the overwrite race."),
  ],
});

export default {
  key: 'lld',
  label: 'LLD',
  intro: 'Low-level design in Java: an 8-step round framework, OOP and SOLID, the patterns interviewers actually ask, LLD concurrency, and 12 classic problems with skeleton code.',
  sections: S,
};
