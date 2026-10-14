/**
 * lib/copy.ts
 * Single source of truth for all copy across BeeBombshell.
 * Conforms to copy.md and design.md.
 */

export const COPY = {
  // Voice & Facts
  site: {
    title: "Bhavya Verma",
    titleTemplate: "%s · Bhavya Verma",
    tagline: "Shipping features and memes in equal measure.",
  },
  seo: {
    description:
      "Bhavya Verma is a product engineer focused on developer experience. Dev tools, open source, writing, and views nobody asked for.",
    ogTitle: "Bhavya Verma · I make dev tools feel like someone cared",
    ogDescription:
      "Product engineer, developer experience. Open source, writing, and a lanyard that swings.",
    jsonLdDescription:
      "Product engineer focused on developer experience, open source contributor and mentor.",
    badgeAlt:
      "A holographic ID badge with a glossy blob character, hanging from a black lanyard.",
  },
  bio: {
    oneLiner:
      "Product engineer, developer experience. I make dev tools feel like someone cared.",
    short:
      "Product engineer on the developer-experience side. Early-stage low-code startups raised me. I live where technical meets creative, and I explain things well. Free time goes to open source and to X, where I post views nobody asked for.",
    medium:
      "I'm Bhavya, a product engineer working on developer experience, which is a fancy way of saying I care a lot about the first ten minutes with a tool. I started at early-stage low-code startups, where the team is small and the surface area is everything. I like the spot where technical meets creative, and I'm good at explaining either one to the other. Outside work: open source, mentoring (20+ women and non-binary folks into their first contributions so far), and X, where I post views nobody asked for.",
    long: [
      "I'm a product engineer working on developer experience, which is a fancy way of saying I care a lot about the first ten minutes with a tool.",
      'I started out at early-stage low-code startups, where nobody has a job title for what you\'re doing and the only rule is "make it work, then make it nice."',
      "I'm happiest where the technical meets the creative, and I'm unreasonably fond of explaining either one to the other.",
      "Open source is where I learned most of what I know, so I give it back. I've helped mentor 20+ women and non-binary folks into their first contributions, and I'd do it again tomorrow.",
      "I'm bad at sitting still. When I'm \"off\", I'm usually on X, sharing views nobody asked for.",
    ],
  },
  card: {
    label: "Bhavya Verma",
    meta: "Product engineer · Developer experience.",
    headline: "Hi, I'm Bhavya. I make dev tools feel like someone cared.",
    headlineLead: "Hi, I'm Bhavya. I make dev tools feel like ",
    headlineAccent: "someone cared.",
    bio: "Product engineer on the developer-experience side. Early-stage low-code startups raised me. I live where technical meets creative, and I explain things well. Free time goes to open source and to X, where I post views nobody asked for.",
    chips: ["20+ mentored into OSS", "ex low-code", "DX"],
    hint: "psst, flip me",
    hintBack: "flip me back",
    back: {
      label: "Find me",
      book: "book a call",
      writing: "writing",
      llms: "llms.txt",
      x: "unsolicited views ↗",
    },
  },
  nav: {
    index: "index",
    work: "work",
    writing: "writing",
    about: "about",
    calendarTooltip: "Book a call",
    llmsLabel: "llms.txt",
    llmsTooltip: "For the robots (and the curious)",
    themeToDark: "Lights off",
    themeToLight: "Lights on",
    statusOpen: "open for chats",
    statusBusy: "heads down, back soon",
    statusTooltip: "currently: not sitting still",
  },
  index: {
    scrollHint: "scroll. the badge will survive.",
    workIntroTitle: "Things I've shipped",
  },
  about: {
    title: "About",
    howTitle: "How I work",
    howItems: [
      "Docs are a feature. Ship them like one.",
      "The best error message is the one you never see. The second best tells you what to do next.",
      "If it needs a tutorial, try to make it need less of one.",
      "Explain it to someone new, then fix whatever confused them.",
    ],
    ossTitle: "Open source and mentoring",
    ossBody:
      "Open source taught me most of what I know, so I try to give some back. I've helped mentor 20+ women and non-binary folks into their first open source contributions. Watching someone merge their first PR never gets old.",
    ossProjects:
      "Contributions across projects including UNICEF, Apache APISIX, and Fedora.",
    offclockTitle: "Off the clock",
    offclockBody:
      "There is no off the clock. There is X, where I share views nobody asked for. Come argue with me.",
    funTitle: "Fun facts",
    funItems: [
      "Has never knowingly sat still.",
      "Four-time GitHub Galaxy Brain.",
      "Believes a good README is a feature.",
      "Opinions per day: unreasonable.",
    ],
    nowTitle: "Currently",
    nowBody: "Shipping features and memes in equal measure.",
  },
  work: {
    title: "Work",
    intro: "Selected work. Some of it even has a README.",
    cardHint: "click to open",
    cardOpenLabel: "open case study",
    stars: "{n} stars",
  },
  writing: {
    title: "Writing",
    intro: "Mostly things I wish I'd read sooner.",
    empty: "First post loading. Opinions are being formed.",
    readTime: "{n} min read · skimmable",
    tagsLabel: "filed under",
    rss: "RSS, which still exists and is great",
    postFooter: "Disagree? That's what X is for. ↗",
    draftBanner: "Draft. You weren't supposed to see this. (Hi.)",
  },
  views: {
    title: "Views nobody asked for",
    sub: "Unsolicited, unreviewed, occasionally correct.",
    cta: "Disagree with me on X ↗",
    empty: "No takes today. Suspicious.",
    takes: [
      "The worst thing you could do for your X presence is to involve \"AI\" in any way, shape, or form. (Except opinions, obviously.)",
      "RIP public static void main, you will be missed. Not that I Java anymore, lol.",
      "My Claude agent went rogue and ordered two more pairs of wide-leg jeans and pullovers. On my card.",
      "We all start somewhere. Be the mentor you once wished you had.\nA mindset I've mostly seen in open source communities though. Wish more people thought this way.",
      "Graph Engineering is apparently the next big hype.\nWe had:\nContext Eng. > Harness Eng. > Loop Eng. > Added nodes & vertices = Graph Engineering 😵💫\nPeople be making tiny tweaks and calling it a breakthrough. It's just modifying the architecture to fit what you build 🤷♀️",
      "What I initially intended as a personal project turned into a SaaS.\nGoing in big, it seems! ※\\(^o^)/※\n★ Dropping the beta soon. Drop a comment if you want early access! ★",
    ],
  },
  booking: {
    title: "Let's talk",
    sub: "Pick a time. I'll bring opinions.",
    topics:
      "Dev tools, open source, breaking into OSS, or just arguing about a README.",
    cta: "Book a call",
    success: "Booked. I'll bring opinions.",
    error: "The calendar is being shy. Email me instead: {email}",
    close: "close",
    busy: "Calendar's full for now. Email me and I'll find a gap.",
  },
  llms: {
    toggle: "llms.txt",
    panelTitle: "llms.txt",
    panelNote: "Same content, zero decoration. Hello, machine.",
    panelBack: "back to the pretty version",
    panelCopy: "copy",
    panelCopied: "copied",
  },
  spotify: {
    playing: "now playing · {track} — {artist}",
    paused: "paused · {track}",
    lastPlayed: "last played · {track} — {artist}",
    offline: "offline",
    tooltip: "Live from my Spotify. Yes, really.",
    aria: "Currently playing {track} by {artist} on Spotify.",
    pillHint: "hover for the track",
  },
  tab: {
    away: "come back, I was mid-thought",
    return: "oh, hi",
  },
  egg: {
    console:
      "Hi, you opened devtools. Respect. The physics on that badge is a custom rope sim, ask me about it. If you're hiring, building, or just curious: hello@beebombshell.com",
    htmlComment:
      "You found the source. The lanyard is a verlet rope. Ask me about it.",
    logoClick: "ouch.",
  },
  footer: {
    status: "Open for chats",
    heading: "Let's talk",
    sub: "Pick a time. Bring a problem, I'll bring opinions.",
    cta: "Book a call",
    copyright: "© {year} beebombshell.com",
    top: "up we go",
    links: {
      github: "GitHub",
      x: "X",
      linkedin: "LinkedIn",
      llms: "llms.txt",
    },
  },
  a11y: {
    reducedMotion: "Motion is off. The badge is just hanging out.",
    badgeLabel: "Interactive ID badge, press Enter to flip",
    badgeFront: "Badge front, showing my intro.",
    badgeBack: "Badge back, showing links.",
    notchLabel: "Main navigation",
    skip: "Skip to content",
    canvas: "decorative, hidden from screen readers",
  },
  state: {
    notFoundTitle: "Nothing here.",
    notFoundBody: "I checked twice. (I don't sit still, remember?)",
    notFoundCta: "take me home",
    errorTitle: "Something broke.",
    errorBody: "Not you, me. I've been told.",
    errorCta: "try again",
    loading: "warming up the particles…",
    offline: "You're offline. The badge is on its own for now.",
    emptyProjects: "Nothing shipped yet. Impossible, but here we are.",
    formError: "That didn't go through. Try once more?",
    copied: "copied",
  },
  links: {
    github: "GitHub ↗",
    x: "X ↗",
    linkedin: "LinkedIn ↗",
    email: "Email",
    site: "beebombshell.com",
  },
} as const;

export type CopyKey = keyof typeof COPY;
