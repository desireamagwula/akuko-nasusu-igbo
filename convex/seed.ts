import { v } from "convex/values";
import { createAccount, invalidateSessions, modifyAccountCredentials } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { slugify } from "./lib/text";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";

/**
 * One-off operations, run from your terminal with `npx convex run`.
 * They are `internal`, so they cannot be called from a browser at all.
 *
 *   npx convex run seed:createAdmin '{"email":"you@example.com","password":"a-long-passphrase"}'
 *   npx convex run seed:setAdminPassword '{"email":"you@example.com","password":"a-new-passphrase"}'
 *   npx convex run seed:sampleContent
 */

/* -------------------------------------------------------------------------- */
/*  Admin account                                                             */
/* -------------------------------------------------------------------------- */

export const adminCount = internalQuery({
  args: {},
  handler: async (ctx) => (await ctx.db.query("users").take(2)).length,
});

export const userIdByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    return user?._id ?? null;
  },
});

function checkEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) throw new Error("Enter a valid email address.");
  return normalized;
}

function checkPassword(password: string) {
  if (password.length < 12) throw new Error("Use a password of at least 12 characters.");
}

/** Creates the single owner account. Refuses if any account already exists. */
export const createAdmin = internalAction({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, { email, password }) => {
    const normalized = checkEmail(email);
    checkPassword(password);
    if ((await ctx.runQuery(internal.seed.adminCount)) > 0) {
      throw new Error("An admin account already exists. To change its password use seed:setAdminPassword.");
    }
    await createAccount(ctx, {
      provider: "password",
      account: { id: normalized, secret: password },
      profile: { email: normalized },
    });
    return `Admin account created for ${normalized}. Sign in at /admin/login.`;
  },
});

/** Resets the owner's password and signs out every existing session. */
export const setAdminPassword = internalAction({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, { email, password }) => {
    const normalized = checkEmail(email);
    checkPassword(password);
    const userId = await ctx.runQuery(internal.seed.userIdByEmail, { email: normalized });
    if (!userId) throw new Error(`No admin account exists for ${normalized}.`);
    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: normalized, secret: password },
    });
    await invalidateSessions(ctx, { userId });
    return `Password updated for ${normalized}. Existing sessions were signed out.`;
  },
});

/* -------------------------------------------------------------------------- */
/*  Sample content                                                            */
/* -------------------------------------------------------------------------- */

const DAY = 24 * 60 * 60 * 1000;

// Facebook's own documentation example video. Replace these with real videos
// from the page, or delete the sample posts from /admin.
const SAMPLE_VIDEO_SRC =
  "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Ffacebook%2Fvideos%2F10153231379946729%2F&show_text=false";

const html = (...blocks: string[]) => blocks.join("");
const p = (text: string) => `<p>${text}</p>`;
const h2 = (text: string) => `<h2>${text}</h2>`;
const quote = (text: string) => `<blockquote><p>${text}</p></blockquote>`;

const blogs = [
  {
    title: "Iri Ji Ọhụrụ: Ihe Mere Ọ Ji Bụrụ Isi Emume Ndị Igbo",
    category: "Omenala",
    daysAgo: 1,
    excerpt:
      "Before the first knife touches a new yam, no one in the village eats from the harvest. The New Yam festival is thanksgiving, calendar and homecoming in a single week, and it explains a great deal about how Igbo communities understand plenty.",
    body: html(
      p("In much of Igboland the farming year does not end with a harvest. It ends with a ceremony. Iri ji ọhụrụ, the eating of the new yam, marks the point at which the community agrees that the season has been good, and gives thanks for it."),
      p("The order of events matters. In many towns the eldest man, or a priest of the yam deity Ahịajoku, first offers the new yam in thanks and only then may the households cook from their own barns. The yam is not simply a crop. It is the measure of a man's industry, which is why the proverb calls it the king of food: <em>ji bụ eze nri</em>."),
      h2("A calendar older than the holiday"),
      p("The festival is tied to the four-day Igbo market week of Eke, Orie, Afọ and Nkwọ, and the date is usually fixed by the elders of each town rather than by a calendar printed in a city. That is why neighbouring communities can celebrate weeks apart, and why families who live far away plan their journeys home around a date announced by word of mouth."),
      quote("A festival is not what is cooked. It is who is at the table when it is served."),
      p("For young people raised in cities or abroad, iri ji is often the first time they hear the old greetings used in earnest, see masquerades perform in their own compound, and understand that the meal is the smallest part of the occasion.")
    ),
  },
  {
    title: "Ilu Igbo: Okwu Nna Anyị Na-akụzi Ndụ Taa",
    category: "Omenala",
    daysAgo: 4,
    excerpt:
      "Chinua Achebe called proverbs the palm oil with which words are eaten. A generation on, the old sayings are being recorded, translated and argued over, and speakers say they still solve problems that no textbook does.",
    body: html(
      p("Ask an Igbo elder for advice and you are likely to get a proverb before you get an answer. That is not evasion. In Igbo speech the proverb is the argument: it compresses a lifetime of observation into a line that both sides accept as common ground."),
      p("Take <em>egbe bere, ugo bere, nke si ibe ya ebela, nku kwaa ya</em>. Let the kite perch and let the eagle perch; whichever says the other may not, may its wing break. It is a short lesson in coexistence, and it is still quoted in disputes over land, business and marriage."),
      h2("Keeping the sayings alive"),
      p("Younger speakers often know the first half of a proverb and not the second. Community groups, radio programmes and social media pages have begun to collect them, sometimes in a single post a day, with the meaning explained in both Igbo and English."),
      p("The work is slow, and it depends on the people who still speak in proverbs being asked, patiently, to explain themselves.")
    ),
  },
  {
    title: "Mgba: Egwuregwu Ọdịnala Ndị Igbo Ka Na-adọta Ìgwè Mmadụ",
    category: "Egwuregwu",
    daysAgo: 7,
    excerpt:
      "Traditional wrestling was once the way a young man made his name before the whole town. On festival days it still fills village squares, with drummers, commentators and a scoring rule everyone in the crowd knows by heart.",
    body: html(
      p("A wrestling ground in an Igbo town is a circle of people before it is a place. The crowd forms the ring, the drummers set the tempo, and the contest begins when two young men step forward and hold each other's waists."),
      p("The rules are simple and strictly kept. A fall is a fall only when the back or the shoulders touch the ground, and a wrestler who is thrown in front of his own village is expected to accept it without argument."),
      h2("More than a sport"),
      p("Mgba was, and in many places still is, a form of social introduction. A champion was known beyond his own compound, and families noticed. Today the bouts are also a draw for visitors, and organisers say the challenge is to keep the ceremony around the contest, the songs, the praise names and the elders seated at the edge, and not just the contest itself.")
    ),
  },
  {
    title: "Nkiri Igbo Na-alọghachi n'Ihu: Why Igbo-Language Film Is Having a Moment",
    category: "Nkiri",
    daysAgo: 10,
    excerpt:
      "For years Igbo-language films were sold on disc from market stalls and rarely discussed. Streaming, subtitles and a new group of directors are bringing them a wider audience, and raising an old question about how much Igbo a film should risk.",
    body: html(
      p("The Igbo-language film industry grew out of the same market-stall economy as the rest of Nollywood: fast shoots, cheap discs, and an audience that watched in the language it spoke at home."),
      p("What has changed is distribution. Subtitles let a film travel beyond the region that speaks the language, and a younger group of directors is treating dialogue as a craft rather than a translation of something written in English."),
      h2("The subtitle question"),
      p("Filmmakers say the hardest decision is not budget but register. Write the dialogue in the Igbo people actually speak, with its borrowings and code-switching, and it feels true but may divide critics. Write it in careful, formal Igbo, and it can feel like a lecture. Most are now choosing the first.")
    ),
  },
  {
    title: "Teaching Igbo Away From Home: Weekend Schools Keep the Language Alive",
    category: "Ọmụmụ Ihe",
    daysAgo: 14,
    excerpt:
      "In hired classrooms and church halls across the diaspora, volunteers give up their Saturdays to teach children the alphabet, the tones and the proverbs. Their students, born abroad, are learning that the dot beneath a vowel changes the word.",
    body: html(
      p("The children arrive in their weekend clothes and sit in rows facing a whiteboard. The lesson begins the way it would in any classroom, with the alphabet, except that here the first thing corrected is a dot."),
      p("Igbo spelling uses dotted vowels, ị, ọ and ụ, and the difference is not decoration. Written without them, one word can mean several things, and children who have only seen Igbo in text messages often have never seen them at all."),
      h2("Tone by ear"),
      p("Igbo is a tonal language, so the teachers rely on songs, call-and-response and stories told aloud. Parents sit at the back, and many admit they came to learn as much as their children.")
    ),
  },
  {
    title: "Ndị Ọrụ Ugbo Na-ere Ihe Ubi Ha Ozugbo Nye Ndị Ahịa n'Obodo Ukwu",
    category: "Akụkọ Ọhụrụ",
    daysAgo: 18,
    excerpt:
      "Skipping the middleman is not a new idea, but phones have made it practical. Small farmers describe how group chats, bank transfers and a shared delivery van are changing what they earn from a bag of produce.",
    body: html(
      p("For most of a generation the route from farm to kitchen ran through a chain of buyers, each taking a share. A farmer growing vegetables an hour outside town might see a fraction of the price the final customer paid."),
      p("Some are now selling straight to households. Orders arrive in a group chat on Thursday, produce is harvested on Friday, and one van makes the delivery run on Saturday morning, with payment made by transfer before the van leaves."),
      h2("What still gets in the way"),
      p("Farmers describe the same obstacles: poor roads, the cost of fuel, and customers who want to see the produce before they pay. The arrangement works best for small groups who already trust one another, and it does not yet scale beyond them.")
    ),
  },
];

const videos = [
  {
    title: "Mkparịta Ụka: Ihe Ndị Ntorobịa Chọrọ n'Ọdịnihu",
    category: "Akụkọ Ọhụrụ",
    daysAgo: 2,
    excerpt: "A studio conversation with four young professionals about work, home and what they want the next decade to look like. Recorded in Igbo with English captions.",
  },
  {
    title: "Ọrụ Aka Igbo: A Day With the Blacksmiths of Awka",
    category: "Omenala",
    daysAgo: 6,
    excerpt: "Awka has been known for iron work for generations. We spent a day in a working forge to see how the craft is passed on, and what apprentices are paid.",
  },
  {
    title: "Egwuregwu Ụbọchị Asaa: Match Day Reactions",
    category: "Egwuregwu",
    daysAgo: 9,
    excerpt: "Fans and former players react to the weekend's league results, with the studio panel going through the turning points minute by minute.",
  },
  {
    title: "Nkiri Ọhụrụ: Ndị Ọkà Nkiri Na-ekwu Maka Ọrụ Ha",
    category: "Nkiri",
    daysAgo: 12,
    excerpt: "Three actors talk about learning lines in a language they mostly speak at home, and why they prefer to improvise the proverbs.",
  },
];

/** Inserts a small, realistic set of posts if the site is empty. Delete them from /admin when you have your own. */
export const sampleContent = internalMutation({
  args: {},
  handler: async (ctx) => {
    if ((await ctx.db.query("posts").first()) !== null) {
      return "Skipped: posts already exist.";
    }
    const now = Date.now();
    let n = 0;
    for (const b of blogs) {
      await ctx.db.insert("posts", {
        title: b.title,
        slug: slugify(b.title),
        type: "blog",
        status: "published",
        category: b.category,
        excerpt: b.excerpt,
        body: b.body,
        publishedAt: now - b.daysAgo * DAY,
        updatedAt: now - b.daysAgo * DAY,
      });
      n++;
    }
    for (const vd of videos) {
      await ctx.db.insert("posts", {
        title: vd.title,
        slug: slugify(vd.title),
        type: "video",
        status: "published",
        category: vd.category,
        excerpt: vd.excerpt,
        embedSrc: SAMPLE_VIDEO_SRC,
        publishedAt: now - vd.daysAgo * DAY,
        updatedAt: now - vd.daysAgo * DAY,
      });
      n++;
    }
    return `Inserted ${n} sample posts. Sample videos all point at Facebook's demo video; replace them from /admin.`;
  },
});
