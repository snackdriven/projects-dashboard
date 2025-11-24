# Life-Logging System - UI/UX Deep Analysis

**Generated:** 2025-11-20
**Mode:** Ultra-Think - First Principles Design (No Technical Constraints)

---

## Problem Analysis

### Core Challenge
Design a unified daily life-logging interface that makes **automated data aggregation** feel as natural and valuable as **manual journaling**, solving the fundamental tension between:
- **Passive observation** (auto-pulled JIRA, Spotify, Calendar)
- **Active reflection** (journaling, mood, gratitude, habits)

### Key User Insight
The user doesn't want a "dashboard" or "analytics tool" - they want a **digital memory** that answers: *"What was my life like on November 19, 2025?"* with the same richness you'd get from reading an old diary, but powered by objective data.

### Critical Success Factors
1. **Glanceability** - Must see day summary in <3 seconds
2. **Depth on demand** - Details available without feeling overwhelming
3. **Temporal fluidity** - Effortless navigation between days/weeks/months
4. **Entity curiosity** - Clicking into people/projects/artists must reveal insights, not just lists
5. **Manual entry delight** - Journaling should feel rewarding, not like filling forms

---

## Design Principles (North Star)

### 1. **"Auto-Magic" Transparency**
Auto-pulled data should feel like it's working *for* you, not *watching* you. Show the data sources visually distinct from manual entries. User should always know "this came from Spotify" vs "I wrote this."

### 2. **Progressive Disclosure**
Information hierarchy: Summary → Context → Details → Deep Analysis
- Level 1: "47 songs today" (2 seconds to scan)
- Level 2: Top 3 artists with play counts (5 seconds)
- Level 3: Full tracklist with timestamps (browsing mode)
- Level 4: "You listened to Marilyn Manson during work hours, Tool during evening" (insights)

### 3. **Bi-Temporal Navigation**
Support both mental models simultaneously:
- **Chronological**: "Show me last Tuesday" (temporal browsing)
- **Entity-based**: "Show me all Marilyn Manson days" (pattern discovery)

### 4. **Data Humanism**
Numbers alone are boring. Context makes them meaningful:
- Not: "5 tickets completed"
- But: "5 tickets completed ✓ (Most productive day this week!)"

### 5. **Respecting Emptiness**
Empty days should feel peaceful, not broken:
- No data ≠ Failed system
- Show minimal, calm placeholder: "A quiet day"

### 6. **Technical Transparency**
User is a QA Engineer - don't hide complexity, make it explorable:
- Show data sync status
- Allow clicking into raw data
- Expose filters and queries

### 7. **Future Self Empathy**
Design for the user reading this in 3 years:
- Prioritize context over jargon
- Make old data still feel relevant
- Enable rediscovery ("I forgot I was listening to this artist back then!")

---

## Solution Architecture

### Navigation Structure: 3-Mode Interface

```
┌─────────────────────────────────────────────────────────┐
│  [CALENDAR]  [TIMELINE]  [EXPLORE]          [SEARCH 🔍] │ ← Mode Switcher
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Mode-specific content renders here                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Mode 1: CALENDAR (Default - Temporal Browsing)
**Mental Model:** "I'm browsing through my days like a photo album"

**Desktop Layout:**
```
┌──────────────────┬────────────────────────────────────────┐
│   MINI CALENDAR  │         DAILY VIEW                     │
│                  │  ┌──────────────────────────────────┐  │
│  November 2025   │  │  November 19, 2025   Wednesday   │  │
│  S  M  T  W  T   │  │  😊 Productive • 5 events        │  │
│        1  2  3   │  └──────────────────────────────────┘  │
│  4  5  6  7  8   │                                        │
│  9 10 11 12 13   │  [Quick Stats Bar]                     │
│ 14 15 16 17 18   │  💼 3 tickets • 🎵 47 songs • ⏱️ 9h   │
│ 19●20 21 22 23   │                                        │
│ 24 25 26 27 28   │  [Expandable Sections - see below]    │
│                  │                                        │
│ [Month Stats]    │                                        │
│ 😊 12 days       │                                        │
│ 💼 23 tickets    │                                        │
└──────────────────┴────────────────────────────────────────┘
```

**Calendar Visual Indicators:**
- **Mood Emoji** in cell (😊😐😟)
- **Dot color** = Data density (gray=empty, yellow=light, green=medium, blue=heavy)
- **Border** = Has manual journal entry (thick border)

#### Mode 2: TIMELINE (Infinite Scroll)
**Mental Model:** "I'm scrolling through time like a social media feed"

**Layout:**
```
┌────────────────────────────────────────────────────────┐
│  ← Nov 18                     Nov 20 →                 │ ← Sticky date nav
├────────────────────────────────────────────────────────┤
│                                                         │
│  ╔═══════════════════════════════════════════════╗     │
│  ║  November 19, 2025  Wednesday                 ║     │
│  ║  😊 Productive • 3 tickets • 47 songs         ║     │
│  ╚═══════════════════════════════════════════════╝     │
│                                                         │
│  [Compact card view of the day]                        │
│                                                         │
│  ───────────────────────────────────────────────────   │
│                                                         │
│  ╔═══════════════════════════════════════════════╗     │
│  ║  November 18, 2025  Tuesday                   ║     │
│  ║  😐 Quiet day • 0 tickets • 12 songs          ║     │
│  ╚═══════════════════════════════════════════════╝     │
│                                                         │
│  [Compact card view]                                   │
│                                                         │
│  ▼ Load older days...                                  │
└────────────────────────────────────────────────────────┘
```

**Behavior:**
- Click card → Expand to full daily view in-place
- Infinite scroll both directions (past/future)
- Sticky date navigator at top

#### Mode 3: EXPLORE (Entity Deep-Dive)
**Mental Model:** "I'm exploring patterns and connections"

**Entry Points:**
1. Click any entity in daily view → Opens entity page
2. Use search → Find entities
3. Browse entity graph → Visual network

**Entity Page Layout** (see dedicated section below)

---

## Daily View - Detailed Design

### Information Hierarchy

```
┌──────────────────────────────────────────────────────────┐
│  LEVEL 1: HERO HEADER (Always Visible)                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │  November 19, 2025  •  Wednesday                   │  │
│  │  😊 Productive                                      │  │
│  │                                                     │  │
│  │  [Quick Stats Pills]                               │  │
│  │  💼 3 tickets  🎵 47 songs  📅 5 events  ⏱️ 9h    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  LEVEL 2: SECTION HEADERS (Expandable Cards)            │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 💼 Work  [3 tickets]                          ↓    │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 📝 Journal                                     ↓    │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🎵 Music  [47 songs, 3.5h]                    ↓    │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 📅 Calendar  [5 events]                       ↓    │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ✅ Habits & Mood                              ↓    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  LEVEL 3: EXPANDED CONTENT (Click to reveal)            │
│  [Detailed data appears here when section expanded]     │
└──────────────────────────────────────────────────────────┘
```

### Visual Design Strategy

**Card-Based Layout with Smart Expansion:**

#### Collapsed State (Default)
```
┌────────────────────────────────────────────────────────┐
│ 💼 Work  [3 tickets]                              ↓    │
│                                                        │
│ WRKA-3808 ✓ • WRKA-3807 ⏳ • WMB-3217 📋           │
│ [Mini preview: 1 line per ticket with status icon]    │
└────────────────────────────────────────────────────────┘
```

#### Expanded State (Click card)
```
┌────────────────────────────────────────────────────────┐
│ 💼 Work  [3 tickets]                              ↑    │
├────────────────────────────────────────────────────────┤
│                                                        │
│ ┌──────────────────────────────────────────────────┐  │
│ │ ✓ WRKA-3808  [Backlog → Done]                    │  │
│ │ QA | O&E UAF - Shelter / Treatment Tab Updates   │  │
│ │ Component: OC O&E Mobile                         │  │
│ │ [View in JIRA →]                                 │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│ ┌──────────────────────────────────────────────────┐  │
│ │ ⏳ WRKA-3807  [In Progress]                       │  │
│ │ QA | O&E UAF - Tally Validations                 │  │
│ │ Component: OC O&E Mobile                         │  │
│ │ Labels: O&E                                      │  │
│ │ [View in JIRA →]                                 │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│ ┌──────────────────────────────────────────────────┐  │
│ │ 📋 WMB-3217  [To Do]                             │  │
│ │ QA | dev | NHHA: Treatment Add Authorization    │  │
│ │ Component: NHHA                                  │  │
│ │ [View in JIRA →]                                 │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│ [Project breakdown: WRKA 2 • WMB 1]                   │
└────────────────────────────────────────────────────────┘
```

**Key Design Decisions:**

1. **Status Icons (Better than color-only):**
   - ✓ = Done/Completed
   - ⏳ = In Progress
   - 📋 = To Do / Backlog
   - 🔍 = In Review
   - ❌ = Blocked

2. **Color Coding (Secondary):**
   - Green border = Completed
   - Blue border = In Progress
   - Gray border = To Do
   - Red border = Blocked

3. **Ticket Card Interaction:**
   - Click ticket → Expand to show full summary + description
   - Click "View in JIRA" → Open external link
   - Click component/label → Filter to that entity (enters EXPLORE mode)

---

## Music Section - Detailed Design

### The Music Challenge
**Problem:** 47 songs is too much for a scan, but hiding them loses granularity.

**Solution:** Progressive disclosure with visual interest

#### Collapsed State
```
┌────────────────────────────────────────────────────────┐
│ 🎵 Music  [47 songs, 3.5h listening]              ↓   │
│                                                        │
│ [Album Art Thumbnails - Top 3 Artists]                │
│ ┌──────┐  ┌──────┐  ┌──────┐                         │
│ │ [MM] │  │ [Tool]  │ [NIN] │                         │
│ └──────┘  └──────┘  └──────┘                         │
│ Marilyn    Tool      Nine Inch                        │
│ Manson     8 plays   Nails                            │
│ 15 plays            6 plays                           │
│                                                        │
│ Top song: "The Beautiful People" (3 plays)            │
└────────────────────────────────────────────────────────┘
```

#### Expanded State - Tab Interface
```
┌────────────────────────────────────────────────────────┐
│ 🎵 Music  [47 songs, 3.5h listening]              ↑   │
├────────────────────────────────────────────────────────┤
│                                                        │
│ [TOP TRACKS] [ALL SONGS] [BY ARTIST] [TIMELINE]       │ ← Tabs
│ ▔▔▔▔▔▔▔▔▔▔                                            │
│                                                        │
│ 1. 🔥 Marilyn Manson - The Beautiful People (3 plays) │
│    2:47 • Album: Antichrist Superstar                 │
│                                                        │
│ 2. Tool - Schism (2 plays)                            │
│    6:44 • Album: Lateralus                            │
│                                                        │
│ 3. Nine Inch Nails - Closer (2 plays)                 │
│    6:13 • Album: The Downward Spiral                  │
│                                                        │
│ 4. A Perfect Circle - The Hollow (1 play)             │
│    2:58 • Album: Mer De Noms                          │
│                                                        │
│ 5. Deftones - Change (1 play)                         │
│    5:08 • Album: White Pony                           │
│                                                        │
│ [Show all 47 songs →]                                 │
└────────────────────────────────────────────────────────┘
```

**Tab: ALL SONGS**
```
Chronological playback list with timestamps:
9:23 AM  Marilyn Manson - The Beautiful People
9:26 AM  Tool - Schism
9:33 AM  Nine Inch Nails - Closer
...
```

**Tab: BY ARTIST**
```
┌──────────────────────────────────────────────────┐
│ Marilyn Manson (15 plays, 42 min)                │
│ • The Beautiful People (3×)                      │
│ • Sweet Dreams (2×)                              │
│ • Tourniquet (2×)                                │
│ • [+8 more songs]                                │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ Tool (8 plays, 51 min)                           │
│ • Schism (2×)                                    │
│ • Forty Six & 2 (1×)                             │
│ • [+5 more songs]                                │
└──────────────────────────────────────────────────┘
```

**Tab: TIMELINE**
```
[Horizontal timeline visualization]

Morning        Afternoon      Evening        Night
├──────────────┼──────────────┼──────────────┤
9 AM: MM       2 PM: Tool     7 PM: NIN      11 PM: APC
Heavy mood     Focus music    Dark vibes     Wind down
```

**Design Insight:** The tabbed approach lets users choose their mental model:
- "What were my top songs?" → TOP TRACKS
- "When did I listen to X?" → ALL SONGS (chronological)
- "How much Tool did I listen to?" → BY ARTIST
- "What was my mood arc?" → TIMELINE

---

## Journal & Manual Entry - Design

### The Journaling Paradox
**Problem:** Forms feel like work. Blank pages feel intimidating. How to make manual entry feel rewarding?

**Solution:** "Start small, expand naturally" pattern

#### Empty State (Beginning of Day)
```
┌────────────────────────────────────────────────────────┐
│ 📝 Journal                                        +    │
├────────────────────────────────────────────────────────┤
│                                                        │
│ [Quick capture]                                        │
│ ┌────────────────────────────────────────────────┐    │
│ │ How was your day? Type anything...             │    │
│ │ [Text input with gentle prompt]                │    │
│ └────────────────────────────────────────────────┘    │
│                                                        │
│ Or choose a prompt:                                   │
│ • "What made today good?"                             │
│ • "What challenged you?"                              │
│ • "What are you grateful for?"                        │
│ • [Write freely]                                      │
└────────────────────────────────────────────────────────┘
```

#### Filled State
```
┌────────────────────────────────────────────────────────┐
│ 📝 Journal                                        ✓    │
├────────────────────────────────────────────────────────┤
│                                                        │
│ [Free-form entry - written at 8:47 PM]                │
│ ┌────────────────────────────────────────────────┐    │
│ │ Really productive day! Knocked out 3 tickets   │    │
│ │ and finally understood the O&E UAF flow.       │    │
│ │ Patrick and I looked at wedding venues - so    │    │
│ │ excited! Also discovered a new band today.     │    │
│ │ [Edit]                                         │    │
│ └────────────────────────────────────────────────┘    │
│                                                        │
│ 💭 Mood & Gratitude                                   │
│ ┌────────────────────────────────────────────────┐    │
│ │ Mood: 😊 Productive & Happy                     │    │
│ │                                                 │    │
│ │ Grateful for:                                   │    │
│ │ • Patrick's support with wedding planning       │    │
│ │ • Completing tickets on time                    │    │
│ │ • Discovering new music                         │    │
│ └────────────────────────────────────────────────┘    │
│                                                        │
│ ✅ Habits                                             │
│ │ [✓] Exercised  [✓] Meditated  [ ] Read 30min      │
└────────────────────────────────────────────────────────┘
```

**Mood Entry - Emoji + Context Pattern:**
```
[Emoji picker: 😊😐😟😤😌🤩😴]

After selecting emoji:
"What made you feel this way?" (optional)
→ Free text or quick tags: #work-stress #wedding-excited #music-discovery
```

**Gratitude Entry - Friction-free:**
```
"What are you grateful for today?" (optional)

[Bullet list auto-formatting]
• [Type and press Enter to add another]
•
•

Or pick from common themes:
#relationships #work-wins #health #creativity #rest
```

**Habits - Checkbox Grid:**
```
✅ Daily Habits          Streak
[✓] Exercise             7 days 🔥
[✓] Meditate             3 days
[ ] Read 30 min          0 days
[✓] Drink water          14 days 🔥
[ ] Journal entry        [You're doing it now!]
```

**Design Insight:**
- **No required fields** - Everything optional
- **Start with one thing** - "How was your day?" is the only prompt initially
- **Natural expansion** - As you type, more options appear (mood, gratitude, habits)
- **Positive reinforcement** - Streaks, checkmarks, encouraging copy

---

## Calendar Section - Design

#### Collapsed State
```
┌────────────────────────────────────────────────────────┐
│ 📅 Calendar  [5 events]                           ↓   │
│                                                        │
│ 🐱 Litter box • 💍 Wedding venue • 💼 Team standup    │
│ [Emoji preview of event types]                        │
└────────────────────────────────────────────────────────┘
```

#### Expanded State - Timeline View
```
┌────────────────────────────────────────────────────────┐
│ 📅 Calendar  [5 events across 3 calendars]        ↑   │
├────────────────────────────────────────────────────────┤
│                                                        │
│ 9:00 AM  🐱 Litter box reminder                       │
│          [Personal Calendar]                          │
│                                                        │
│ 10:00 AM 💼 Team Standup                              │
│          [Work Calendar - WRKA]                       │
│          15 min • Zoom link                           │
│                                                        │
│ 2:00 PM  💍 Wedding venue visit - The Grand Hall      │
│          [Wedding Planning]                           │
│          2 hours • w/ Patrick                         │
│                                                        │
│ 5:30 PM  🏃 Evening run                               │
│          [Health & Fitness]                           │
│          30 min                                       │
│                                                        │
│ 8:00 PM  🎮 Patrick's raid night                      │
│          [Shared Calendar]                            │
│          2 hours                                      │
│                                                        │
│ [Calendar breakdown: Work 1 • Wedding 1 • Personal 3] │
└────────────────────────────────────────────────────────┘
```

**Calendar Visual Encoding:**
- **Emoji prefix** (from your existing system: 🐱💍💼🏃🎮)
- **Color-coded sidebar** (subtle, matches calendar source)
- **Time blocks** show duration visually
- **Click event** → See full details (location, attendees, notes)

---

## Entity Pages - Deep Dive Design

### Entity Types
1. **People** (Kayla Gilbert, Patrick, colleagues)
2. **Work Projects** (WRKA, WMB, CP, NHHA, TAR, etc.)
3. **Music Artists** (Marilyn Manson, Tool, Nine Inch Nails)
4. **Tickets** (individual JIRA tickets)
5. **Calendar Events** (recurring events like "Team Standup")

### Universal Entity Page Structure

```
┌────────────────────────────────────────────────────────┐
│ [← Back to Nov 19]                          [Search 🔍]│
├────────────────────────────────────────────────────────┤
│                                                        │
│  [ENTITY HERO HEADER]                                 │
│  ┌──────────────────────────────────────────────────┐ │
│  │  🎵 Marilyn Manson                               │ │
│  │  Artist                                          │ │
│  │                                                  │ │
│  │  [Quick Stats]                                   │ │
│  │  1,247 total plays • First: Mar 2023            │ │
│  │  Last: Nov 19, 2025 • #1 Top Artist             │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  [TABS]                                               │
│  [TIMELINE] [STATS] [CORRELATIONS] [NOTES]            │
│  ▔▔▔▔▔▔▔▔                                            │
│                                                        │
│  [TAB CONTENT AREA]                                   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Tab 1: TIMELINE (Default)
**Shows all appearances of this entity across time**

```
Timeline for: Marilyn Manson

2025
├─ November (127 plays)
│  ├─ Nov 19 • 15 plays • 😊 Productive day
│  ├─ Nov 15 • 23 plays • 😐 Heavy listening day
│  └─ Nov 8 • 12 plays
│
├─ October (89 plays)
│  └─ Oct 24 • 31 plays • 😊 Happy
│
├─ September (45 plays)
│
└─ [Earlier months ▼]

2024
└─ [Expand year ▼]

2023
└─ First listen: March 12, 2023
   "The Beautiful People" • Discovered via Spotify Discover Weekly
```

**Interaction:**
- Click date → Opens that daily view, scrolls to music section
- Click month → Expand/collapse
- Hover date → Tooltip shows top song that day

### Tab 2: STATS
**Aggregate analytics**

```
Stats for: Marilyn Manson

Overall
─────────────────────────────────────────────
Total plays: 1,247
Total time: 72 hours
First listen: March 12, 2023 (998 days ago)
Last listen: November 19, 2025 (today)

Top Songs
─────────────────────────────────────────────
1. The Beautiful People (187 plays)
2. Sweet Dreams (156 plays)
3. Tourniquet (134 plays)
4. The Dope Show (98 plays)
5. Disposable Teens (87 plays)

Listening Patterns
─────────────────────────────────────────────
[Heat map visualization]
              M   T   W   T   F   S   S
Morning       ░░░ ░░░ ▓▓▓ ░░░ ░░░ ▓▓▓ ░░░
Afternoon     ▓▓▓ ▓▓▓ ███ ▓▓▓ ░░░ ░░░ ░░░
Evening       ███ ▓▓▓ ░░░ ▓▓▓ ███ ███ ▓▓▓
Night         ░░░ ░░░ ░░░ ░░░ ▓▓▓ ░░░ ░░░

Peak listening: Wednesday afternoons & Friday evenings

Related Artists (often listened together)
─────────────────────────────────────────────
Tool • Nine Inch Nails • A Perfect Circle
```

### Tab 3: CORRELATIONS (Advanced - AI Insights)
**This is the "killer feature" that makes entity pages valuable**

```
Correlations for: Marilyn Manson

🔍 Discovered Patterns

Mood Correlation
─────────────────────────────────────────────
When you listen to Marilyn Manson:
• 67% of days rated 😊 Happy/Productive
• 23% of days rated 😐 Neutral
• 10% of days rated 😟 Stressed

→ You tend to listen when you're in a good mood, not to cope with stress

Work Correlation
─────────────────────────────────────────────
Heavy Marilyn Manson days (15+ plays):
• 80% have 3+ tickets completed
• Often includes WRKA QA tasks

→ This is your "focus music" for deep work

Time Patterns
─────────────────────────────────────────────
Peak listening: Wednesday afternoons
Lowest: Sunday mornings

→ Weekday work music, not weekend relaxation

Co-occurrence with Events
─────────────────────────────────────────────
Rarely listened during:
• Wedding planning events (0%)
• Time with Patrick (5%)

Often listened during:
• Solo work sessions (78%)
• Exercise (12%)

→ This is "Kayla focus time" music
```

**Design Insight:** This tab answers "What does this entity *mean* in my life?" - going beyond "what" to "why" and "when."

### Tab 4: NOTES
**Manual context and memories**

```
Notes for: Marilyn Manson

[Add note +]

─────────────────────────────────────────────
Mar 12, 2023
First discovered via Spotify Discover Weekly. Was skeptical at
first but "The Beautiful People" immediately clicked. Reminded me
of the industrial sound I loved in college.

─────────────────────────────────────────────
Aug 4, 2024
Went to concert with college friends! Amazing show. This band
has become my go-to for focused work.

─────────────────────────────────────────────
Nov 19, 2025
Productive day - MM helped me power through 3 tickets. Still
the best QA work music.
```

---

## Visual Design Direction

### Design Mood: "Technical Warmth"
- **Primary vibe:** Calm, focused, slightly futuristic
- **Not:** Sterile dashboards (too cold) or whimsical journaling (too soft)
- **Inspiration:** Linear app, Height, Raycast - technical tools that feel good to use

### Color Palette

**Dark Mode (Primary):**
```
Background: #0F1419 (deep charcoal, not pure black)
Surface: #1C2128 (elevated cards)
Border: #30363D (subtle separation)
Text: #E6EDF3 (soft white, not harsh)
Accent: #58A6FF (calming blue)
Success: #3FB950 (green for completed)
Warning: #D29922 (yellow for in-progress)
Muted: #8B949E (secondary text)
```

**Light Mode (Secondary):**
```
Background: #FFFFFF
Surface: #F6F8FA
Border: #D0D7DE
Text: #1F2328
Accent: #0969DA
```

### Typography

**Approach: Hybrid**
```
Headings: Inter (sans-serif, clean, technical)
Body: -apple-system, system-ui (native, readable)
Data/Numbers: JetBrains Mono (monospace, QA-friendly)
```

**Example:**
```
November 19, 2025           ← Inter Bold, 24px
Wednesday                   ← Inter Regular, 16px, muted

47 songs, 3.5h listening   ← JetBrains Mono, 14px
```

### Spacing & Layout

**Card-based with generous breathing room:**
- Padding: 24px (desktop), 16px (mobile)
- Card gap: 16px
- Section gap: 32px
- Border radius: 8px (modern but not overly rounded)

### Animations & Micro-interactions

**Principle: Snappy, not flashy**
- Card expand/collapse: 200ms ease-out
- Page transitions: 150ms slide
- Hover states: 100ms
- Loading states: Skeleton screens (not spinners)

**Example interactions:**
- Hover ticket card → Subtle lift shadow
- Click section → Smooth height expansion
- Swipe between days → Natural momentum scroll

---

## Implementation Recommendation

### Option A: React Web App (RECOMMENDED)

**Why this beats Obsidian:**

1. **True interactivity**
   - Expandable cards that feel native
   - Real-time data sync indicators
   - Drag-and-drop reordering
   - Keyboard shortcuts (/, ⌘K for search)

2. **Rich visualizations**
   - Music timeline heat maps
   - Mood pattern charts
   - Productivity trends
   - Entity relationship graphs

3. **Smart features**
   - Auto-save as you type
   - Offline support (PWA)
   - Cross-device sync
   - Search with fuzzy matching

4. **Integration with Quantified Life**
   - Already have React infrastructure
   - Can reuse components/styling
   - Same tech stack (React 19, Zustand, Framer Motion)

**Tech Stack:**
```
Frontend: React 19 + TypeScript
State: Zustand (lightweight, perfect for this)
Routing: React Router v7
Database: SQLite (local-first) + optional Supabase sync
Animations: Framer Motion
Charts: Recharts (already using)
Search: Minisearch (fast, client-side)
Styling: Tailwind CSS 4
Build: Vite (Rolldown)
```

**Architecture:**
```
quantified-life/
├── src/
│   ├── features/
│   │   ├── daily-view/
│   │   ├── entity-pages/
│   │   ├── navigation/
│   │   └── manual-entry/
│   ├── services/
│   │   ├── jira-sync.ts
│   │   ├── spotify-sync.ts
│   │   ├── calendar-sync.ts
│   │   └── local-db.ts
│   └── store/
│       ├── daily-notes.ts
│       ├── entities.ts
│       └── ui-state.ts
```

### Option B: Obsidian Plugin (Fallback)

**If you strongly prefer Obsidian:**
- Build custom plugin for advanced features
- Use Dataview for queries
- Accept limitations on interactivity
- Benefit: Native to your existing workflow

**Verdict:** Only choose this if Obsidian integration is a hard requirement. Web app gives you more control.

### Option C: Hybrid (Best of Both Worlds)

**Generate Obsidian markdown FROM web app:**
```
Web App (Primary Interface)
↓
Exports daily notes as markdown
↓
Obsidian vault (Backup/Archive)
```

**Benefits:**
- Rich interactivity in web app
- Markdown backup for portability
- Can still use Obsidian for manual editing
- Future-proof (not locked into either)

---

## MVP Feature Prioritization

### Phase 1: Core Experience (Week 1-2)
**Goal: Prove the daily view concept**

✅ Must Have:
- Daily view with collapsible sections
- Calendar navigation (mini calendar + date picker)
- Work section (JIRA tickets display)
- Music section (top tracks + full list)
- Calendar section (event timeline)
- Basic journal entry (free-text)
- Data import (JIRA, Spotify, Calendar APIs)

❌ Not Yet:
- Entity pages
- Correlations/insights
- Habit tracking
- Timeline mode
- Search

### Phase 2: Manual Entry (Week 3)
**Goal: Make journaling delightful**

✅ Add:
- Mood emoji selector
- Gratitude list
- Habit checkboxes
- Quick prompts
- Auto-save

### Phase 3: Entity Deep-Dive (Week 4)
**Goal: Unlock pattern discovery**

✅ Add:
- Entity pages (people, projects, artists)
- Timeline tab (entity appearances over time)
- Stats tab (aggregates)
- Manual notes on entities

### Phase 4: Advanced Features (Month 2+)

✅ Add:
- Correlations tab (AI insights)
- Timeline mode (infinite scroll)
- Explore mode (graph view)
- Weekly/monthly overviews
- Export to markdown
- Mobile responsive

---

## Success Metrics

### Qualitative (Feel)
- "I enjoy opening this every day" (habit formation)
- "I discovered something about myself" (insight)
- "I remembered something I'd forgotten" (rediscovery)

### Quantitative (Measure)
- Days with manual entry: Target 80%+
- Average time spent per day: 5-10 min (engagement without burden)
- Entity pages viewed: 3+ per session (curiosity-driven exploration)
- Historical days browsed: 10+ per month (retroactive value)

### Technical (Performance)
- Initial load: <1s
- Day switch: <200ms
- Search results: <100ms
- Offline support: 100% (local-first)

---

## Open Questions & Future Research

1. **Mobile Strategy:** Build responsive web app first, then native mobile? Or web-only?

2. **Data Export:** Should support exporting to Obsidian markdown? JSON? PDF?

3. **Privacy:** Encryption at rest? E2E encryption for cloud sync?

4. **Collaboration:** Share specific days/entities with Patrick (wedding planning context)?

5. **Voice Input:** Voice journal entries for mobile? Whisper API integration?

6. **Photos:** Integrate photos into daily entries (like Day One)?

7. **AI Features:**
   - Auto-generate journal prompts based on day's data?
   - "This day was similar to March 12, 2024" pattern matching?
   - Weekly summary generation?

---

## Conclusion: The Core Insight

The best life-logging system doesn't feel like "tracking" - it feels like **augmented memory**.

You're not building a dashboard. You're building a **second brain** that remembers the objective facts (47 songs, 3 tickets, 5 events) AND your subjective experience (😊 productive, grateful for Patrick, excited about wedding).

The magic happens when these two layers intersect:
- "I was listening to Marilyn Manson during my most productive days"
- "Wedding planning stress correlates with quiet music days"
- "I wrote my best journal entries after completing 3+ tickets"

This is **data humanism** - using technology to understand yourself better, not just to optimize productivity.

---

**Next Step:** Build Phase 1 MVP as React component in Quantified Life project, validate the daily view concept with real data (Nov 14-20, 2025).