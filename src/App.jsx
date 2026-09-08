import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Settings, Search, RotateCcw, Check, X, Undo2, Trophy, Users,
  ChevronRight, Flame, Shield, Clock, ListChecks, LayoutGrid,
  RefreshCw, AlertTriangle, AlertCircle, ThumbsUp, Info, Plus
} from 'lucide-react';
import { supabase } from './lib/supabaseClient';

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */
const Tokens = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap');
    .ff-root { font-family: 'Inter', sans-serif; background: #10121A; color: #EEF0F5; }
    .ff-display { font-family: 'Oswald', sans-serif; letter-spacing: 0.03em; text-transform: uppercase; }
    .ff-mono { font-variant-numeric: tabular-nums; }
    .ff-panel { background: #1A1D28; border: 1px solid #2A2E3D; }
    .ff-panel-raised { background: #1F2330; border: 1px solid #333850; }
    .ff-input { background: #12141E; border: 1px solid #333850; color: #EEF0F5; }
    .ff-input:focus { outline: none; border-color: #E8B339; }
    .ff-muted { color: #9AA1B4; }
    .ff-gold { color: #E8B339; }
    .ff-bg-gold { background: #E8B339; }
    .ff-bg-green { background: #34C77B; }
    .ff-green { color: #34C77B; }
    .ff-red { color: #E8544A; }
    .ff-bg-red { background: #E8544A; }
    .ff-scrollbar::-webkit-scrollbar { width: 8px; }
    .ff-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .ff-scrollbar::-webkit-scrollbar-thumb { background: #333850; border-radius: 4px; }
    .ff-tab-active { background: #E8B339; color: #12141E; }
    .ff-tab-inactive { background: transparent; color: #9AA1B4; }
    .ff-clock { background: linear-gradient(135deg, #E8B339 0%, #C98F1F 100%); color: #12141E; }
    .ff-btn-draft { background: #34C77B; color: #0B1F14; }
    .ff-btn-draft:hover { background: #2BB56C; }
    .ff-btn-taken { background: #2A2E3D; color: #C7CBDB; }
    .ff-btn-taken:hover { background: #333850; }
    @media (prefers-reduced-motion: reduce) { .ff-transition { transition: none !important; } }
    .ff-spin { animation: ff-spin-kf 1s linear infinite; }
    @keyframes ff-spin-kf { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .ff-toggle { position: relative; display: inline-block; width: 36px; height: 20px; }
    .ff-toggle input { opacity: 0; width: 0; height: 0; }
    .ff-toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #333850; border-radius: 20px; transition: .2s; }
    .ff-toggle-slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: .2s; }
    .ff-toggle input:checked + .ff-toggle-slider { background: #E8B339; }
    .ff-toggle input:checked + .ff-toggle-slider:before { transform: translateX(16px); }
  `}</style>
);

/* ------------------------------------------------------------------ */
/*  Position metadata                                                  */
/* ------------------------------------------------------------------ */
const POS_META = {
  QB: { label: 'QB', color: '#E8544A', bg: 'rgba(232,84,74,0.15)' },
  RB: { label: 'RB', color: '#34C77B', bg: 'rgba(52,199,123,0.15)' },
  WR: { label: 'WR', color: '#4A9FE8', bg: 'rgba(74,159,232,0.15)' },
  TE: { label: 'TE', color: '#B37AE8', bg: 'rgba(179,122,232,0.15)' },
  K:  { label: 'K',  color: '#9AA3B2', bg: 'rgba(154,163,178,0.15)' },
  DEF:{ label: 'DEF', color: '#C9A227', bg: 'rgba(201,162,39,0.15)' },
};
const FLEX_ELIGIBLE = ['RB', 'WR', 'TE'];

/* ------------------------------------------------------------------ */
/*  Static player notes — fallback lookup when DB has no live update  */
/*  Keyed by the canonical DB full_name where known to differ.        */
/* ------------------------------------------------------------------ */
const PLAYER_NOTES = {
  'Bijan Robinson': 'Led the NFL in scrimmage yards last season (2,298)',
  'Jahmyr Gibbs': '1,223 rush yds/13 TD + 117 catches; Montgomery traded away, clear bell cow',
  "Ja'Marr Chase": 'Top-5 WR in points/game in 4 of the last 5 seasons',
  'Justin Jefferson': 'Dominant with every QB except last year; buy-low with Kyler Murray now throwing',
  'Puka Nacua': "Last year's WR1; offseason rehab-facility stay adds risk in his contract year",
  'Amon-Ra St. Brown': 'Top-3 WR three straight seasons',
  'CeeDee Lamb': 'Injury-shortened last year; now shares Dallas targets with George Pickens',
  'Malik Nabers': 'On a 2-for-2 top-12 pace before a Week 4 ACL tear; trending to go Week 1',
  'Brian Thomas Jr.': 'Big-play alpha in a Jaguars offense that won the AFC South',
  'Saquon Barkley': 'Historic 2024 gave way to regression last year; some are fading him at cost',
  "De'Von Achane": "Led the NFL in yards/touch; new run-first scheme without Tua/McDaniel adds risk",
  'Christian McCaffrey': 'No.1 overall fantasy scorer last year at age 30 — huge ceiling, real injury history',
  'Nico Collins': "Clear WR1 after teammate Jayden Higgins' season-ending ACL tear",
  'Drake London': "Atlanta's clear No.1 target regardless of who wins the QB battle",
  'A.J. Brown': 'Traded to New England to pair with Drake Maye; six 1,000-yd seasons in seven years',
  'Trey McBride': 'Wore the fantasy TE1 crown last season',
  'Brock Bowers': 'Best offensive context of his career entering this year',
  'Jaxon Smith-Njigba': 'WR2 in total scoring last year; some regression risk after the breakout',
  'Derrick Henry': 'Still defying the age curve',
  'Josh Allen': 'QB1 in four of the last six years; 14 rushing TDs last season',
  'Josh Jacobs': 'Steady RB1 in Green Bay, though an ongoing legal matter is worth monitoring',
  'Jonathan Taylor': 'Some models project fewer TDs after a huge 2025',
  'Kyren Williams': 'Top-10 points/game at the position three straight years',
  'James Cook III': 'Led the NFL in rushing yards last season (1,621)',
  'James Cook': 'Led the NFL in rushing yards last season (1,621)',
  'DeVonta Smith': "Philly's clear WR1 now that A.J. Brown is gone",
  'George Pickens': "Now sharing Dallas' passing game with Lamb",
  'Rashee Rice': 'Less off-field uncertainty than a year ago, but missed minicamp on a legal matter',
  'Marvin Harrison Jr.': 'Talent is obvious; offense still finding its footing',
  'Kenneth Walker III': 'Big free-agent add in Kansas City; early timeshare while Mahomes ramps back from knee surgery',
  'Ken Walker III': 'Big free-agent add in Kansas City; early timeshare while Mahomes ramps back from knee surgery',
  'Breece Hall': 'Talented three-down profile in a run-first-leaning offense',
  'Chase Brown': 'Efficient three-down back; O-line and backfield competition are the concerns',
  'Colston Loveland': 'No.2 scoring TE from Week 9 on as a rookie, capped by an explosive playoff run',
  'Tyler Warren': '76/817/4 as a rookie; Pittman traded away, even more targets up for grabs',
  'Javonte Williams': 'Returned RB1 value last year and Dallas paid to keep him',
  'Lamar Jackson': 'Down year in 2025 (13 games); new playcaller, buy-low rebound candidate',
  'Tucker Kraft': 'Was playing like the TE1 before a Week 9 ACL/meniscus tear; trending toward Week 1',
  'Sam LaPorta': 'Coming off offseason back surgery for a herniated disc',
  'Jeremiyah Love': "No.3 overall pick in April's draft; high-ankle sprain in camp, hopeful for Wk1, but Allgeier/Conner cut into goal-line work",
  'Mike Evans': 'Left Tampa Bay for San Francisco in free agency',
  'Emeka Egbuka': "Clear path to Tampa's top target role with Evans gone; 68/938/6 as a rookie",
  'Tyreek Hill': "Miami's rebuild (Waddle traded away) clouds an aging, still-explosive profile",
  'Jaylen Waddle': 'Traded to Denver; boosts Bo Nix as much as himself',
  'David Montgomery': 'Traded from Detroit; projected as a featured back in Houston',
  'Alvin Kamara': 'Sprained MCL in camp, expected to miss about a month to start the season',
  'Kyle Pitts': 'New extension, but Atlanta QB uncertainty caps the outlook',
  'Drake Maye': 'QB3 finish last year; added A.J. Brown and Romeo Doubs this offseason',
  'Bucky Irving': 'Electric rookie tape, but real red flags around his 2026 role',
  'Jonathon Brooks': "Back from a second ACL tear in the same knee within 13 months; Carolina let Dowdle walk and passed on RB in the draft, sign of confidence",
  'George Kittle': 'Still a reliable weekly floor',
  'Travis Kelce': 'Some analysts are fading him purely on age and price',
  'DK Metcalf': 'Field-stretching No.1 option',
  'Zay Flowers': 'Lead slot role in a run-heavy Baltimore offense',
  'Jordan Addison': "Vikings' No.2 behind Jefferson",
  'Xavier Worthy': 'Field-stretcher in a crowded Chiefs passing game',
  'Jameson Williams': 'Best season of his career last year (65/1,117/7); some call the efficiency a mirage',
  'Chuba Hubbard': 'Hamstring strain in camp (week-to-week); Brooks pushing hard for touches behind him',
  'Dak Prescott': 'Topped 4,500 passing yards last season on limited rushing',
  'Kenny Gainwell': '13.3 touches/17.8 PPG from Week 8 on last year; standalone value with White gone from Tampa',
  'Kenneth Gainwell': '13.3 touches/17.8 PPG from Week 8 on last year; standalone value with White gone from Tampa',
  'Rico Dowdle': 'Reunited with his old head coach; splitting first-team camp reps with Warren',
  'Jaylen Warren': "Splitting Pittsburgh's backfield reps with Dowdle",
  'Jalen Hurts': 'Reliable rushing floor for a reigning Super Bowl roster',
  'Joe Burrow': 'Elite ceiling in every game he finishes healthy',
  'Jayden Daniels': 'Missed time last year (knee/hamstring/elbow) but was a playoff force when healthy',
  'Rome Odunze': 'Part of a full receiver-room rebuild after the Moore trade',
  'Ladd McConkey': 'Ascending slot weapon',
  'Tetairoa McMillan': 'Led all rookie WRs last season (WR15 finish)',
  'Christian Watson': 'High-upside boom piece, but has missed 20 games over four seasons',
  'Isiah Pacheco': 'Now timesharing early-down work after the Walker signing',
  "D'Andre Swift": "Bigger role possible if rookie Monangai's knee costs him time",
  'Kyle Monangai': 'Hyperextended knee in camp; ADP already sliding, still worth a late-round dart',
  'J.K. Dobbins': 'Re-signed; injury history, but a real path to lead work',
  'Caleb Williams': 'Improving in Year 2; some call him overpriced next to Stafford/Purdy at similar cost',
  'Patrick Mahomes': 'Recovering from a torn ACL/LCL — watch his Week 1 workload closely',
  'Matthew Stafford': 'QB3 finish last year on almost zero rushing value',
  'Kyler Murray': "New team via free agency after Arizona's release; big rushing/passing combo when healthy",
  'Terry McLaurin': 'Down year last season per most models; catches from an improving Daniels',
  'Stefon Diggs': 'Signed August 7 — ADP is still settling',
  'Jayden Reed': 'Benefits from vacated Green Bay targets',
  'Romeo Doubs': 'Signed to pair with A.J. Brown and Maye',
  'Hollywood Brown': 'Signed as depth; WR2 upside if the target tree shakes out his way',
  'DJ Moore': "Traded from Chicago to Buffalo; some question how guaranteed his volume is there",
  'Dallas Goedert': 'Steady weekly floor',
  'Evan Engram': 'Reliable target earner',
  'Dalton Kincaid': 'Buffalo receiving-TE role',
  'Tyler Allgeier': "Goal-line/early-down threat to cut into rookie Love's touches",
  'James Conner': "Also in the mix for Arizona's early-down and goal-line work",
  'Rhamondre Stevenson': 'Committee back in an improving Patriots offense',
  'Zach Charbonnet': 'Change-of-pace back behind Walker-less Seattle backfield',
  'Cam Skattebo': 'Minor camp tweak already resolved; full workload potential as a rookie',
  'Tyrone Tracy Jr.': 'Clearest beneficiary if Skattebo misses time',
  'Bhayshul Tuten': "Took over early-down work after Etienne's departure",
  'Ashton Jeanty': 'Disappointing rookie year (RB15) despite the hype — regression-to-the-mean value now',
  'Jordan Mason': 'Popular sleeper the last two years; offensive struggles held him back in 2025',
  'Trevor Lawrence': "2025's biggest league-winner at QB; led Jacksonville to the AFC South title",
  'Jared Goff': 'QB1-caliber four straight seasons under a new OC',
  'Brock Purdy': 'Efficient, with Mike Evans newly added to the arsenal',
  'Bo Nix': 'Ascending Year 2 QB, now with Jaylen Waddle added via trade',
  'Justin Herbert': 'High weekly ceiling arm talent',
  'Khalil Shakir': 'Reliable underneath option for Allen',
  'Keon Coleman': "Buffalo's field-stretching WR2",
  'Garrett Wilson': "Jets' clear top target",
  'Elic Ayomanor': "Led Titans WRs with just 89 targets last year — low bar, more weapons around him now",
  'Carnell Tate': 'First rookie WR off the board in most 2026 drafts',
  "Wan'Dale Robinson": 'Signed to Tennessee; will command a real target share',
  'Michael Pittman Jr.': 'Signed away from Indianapolis',
  'Calvin Ridley': "Veteran depth in a suddenly crowded Titans WR room",
  'Jerry Jeudy': "Cleveland's clear target leader",
  'Tank Dell': 'Back to full-pads practice after a gruesome multi-ligament injury wiped out 2025 — real upside if you trust the recovery',
  'Jaylin Noel': "Direct beneficiary of teammate Higgins' season-ending ACL tear",
  'Baker Mayfield': 'Egbuka is now the clear top target with Evans gone',
  'Geno Smith': 'Game-manager floor with some ceiling',
  'C.J. Stroud': "Lost Jayden Higgins for the season to a torn ACL — needs Collins/Dell/Noel to step up",
  'Daniel Jones': "Broke out in 2025 in Indy behind Tyler Warren's emergence — confirm his camp/roster status before you draft him",
  'Tua Tagovailoa': 'Released by Miami on a record dead-cap hit; competing with Michael Penix Jr. for the Atlanta job',
  'Josh Downs': 'Slot role in an ascending Colts passing game',
  'Alec Pierce': 'Coming off ankle surgery; effectiveness in Week 1 is a question',
  'Brandon Aiyuk': 'Talented but competing for targets in a deep 49ers WR room',
  'Ricky Pearsall': 'Ascending in the 49ers offense',
  'Xavier Legette': 'Boom/bust field-stretcher',
  'Jalen Coker': 'Sleeper appeal in an offense hunting for pass-catchers',
  'Darnell Mooney': 'Veteran depth behind London',
  'Jayden Douglas': "Third-round rookie who has emerged as the clear favorite for Miami's No.1 WR job in camp",
  'Malik Washington': 'Depth piece in a wide-open Dolphins WR room',
  'Jalen Tolbert': 'Signed at the veteran minimum for depth',
  'Chris Olave': "Saints' clear No.1 target",
  'Rashid Shaheed': 'Re-signed after a midseason deadline deal last year',
  'Xavier Hutchinson': 'More of a blocking-role receiver in the Houston rotation',
  'Michael Penix Jr.': 'Competing with Tua Tagovailoa for the starting job',
  'Sam Darnold': 'Steady bridge/starter option',
  'J.J. McCarthy': "Now behind/competing with the Kyler Murray addition",
  'Jaxson Dart': 'Rookie floor already set (QB13 finish); Nabers trending back for Week 1',
  'Cam Ward': "Real weapon upgrades entering Year 2 (Tate, Wan’Dale Robinson)",
  'Harold Fannin Jr.': 'TE6 finish as a rookie; better weapons around him, but a shakier QB room',
  'Jake Ferguson': 'Steady target earner in Dallas',
  'Mark Andrews': 'Red-zone role in a run-heavy offense',
  'Cole Kmet': 'Underneath option in a rebuilding WR room',
  'Isaiah Likely': 'Sleeper appeal behind Andrews',
  'Chigoziem Okonkwo': 'Athletic upside piece',
  'Dalton Schultz': "Part of Houston's target committee",
  'Kenyon Sadiq': 'First-round rookie; hybrid WR/TE usage',
  'Pat Freiermuth': "Pittsburgh's red-zone TE option",
  'Zamir White': 'Early-down complement in the Vegas backfield',
  'Brian Robinson Jr.': 'Between-the-tackles committee back',
  'Austin Ekeler': 'Change-of-pace, pass-catching role',
  'Tony Pollard': "Titans' lead back",
  'Aaron Jones Sr.': 'Committee veteran; ageing but still involved',
  'Aaron Jones': 'Committee veteran; ageing but still involved',
  'Najee Harris': 'Depth/committee role after a change of scenery',
  'Braelon Allen': 'Early-down committee piece',
  'Ray Davis': "Cook's backup with standalone flash",
  'Tank Bigsby': 'Complementary back behind Tuten',
  'Woody Marks': 'Rookie committee piece in the Houston backfield',
  'Jaylen Wright': "Change-of-pace role behind Achane",
  'Xavier Flournoy': "Dallas' No.3 WR last season; flashed a real ceiling on starter-level snaps",
  'Kendrick Bourne': 'Depth insurance behind a crowded Arizona WR room',
  'Brandon Aubrey': 'Elite leg, high-value kicking offense',
  'Harrison Butker': 'Consistent scorer in a high-powered offense',
  'Jake Bates': "Strong leg in Detroit's efficient offense",
  'Cameron Dicker': 'Reliable volume kicker',
  'Chris Boswell': 'Steady veteran leg',
  'Jake Elliott': 'Reliable in a playoff-caliber offense',
  'Younghoe Koo': 'Consistent scoring chances',
  'Tyler Bass': "High-powered Bills offense means plenty of chances",
  "Ka'imi Fairbairn": 'Steady veteran option',
  'Evan McPherson': 'Strong leg, high-upside offense',
  'Seahawks D/ST': 'Preseason top-ranked fantasy defense',
  'Texans D/ST': 'Elite front seven, takeaway upside',
  'Rams D/ST': 'Strong all-around unit',
  'Broncos D/ST': 'Pressure and turnover upside',
  'Steelers D/ST': 'Perennial havoc-rate leader',
  'Ravens D/ST': 'Aggressive, high-turnover scheme',
  'Vikings D/ST': 'Disruptive front, solid floor',
  'Eagles D/ST': 'Deep, talented roster',
  '49ers D/ST': 'Talented when healthy',
  'Packers D/ST': 'Ball-hawking secondary',
};

/* ------------------------------------------------------------------ */
/*  Scoring-format helpers (app labels ↔ DB enum values)              */
/* ------------------------------------------------------------------ */
const scoringToDb = (s) => s === 'half' ? 'half_ppr' : s === 'ppr' ? 'full_ppr' : 'standard';
const scoringFromDb = (s) => s === 'half_ppr' ? 'half' : s === 'full_ppr' ? 'ppr' : 'standard';

/* ------------------------------------------------------------------ */
/*  Exposure penalty — tunable constant next to NEED_WEIGHT           */
/* ------------------------------------------------------------------ */
const CROSS_LEAGUE_EXPOSURE_PENALTY = -60;

const DEFAULT_ROSTER = { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DEF: 1 };
const STARTER_ORDER = ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'K', 'DEF'];

/* ------------------------------------------------------------------ */
/*  Snake draft math                                                   */
/* ------------------------------------------------------------------ */
function overallPickFor(round, slot, numTeams) {
  if (round % 2 === 1) return (round - 1) * numTeams + slot;
  return (round - 1) * numTeams + (numTeams - slot + 1);
}
function roundAndSlotFor(overall, numTeams) {
  const round = Math.ceil(overall / numTeams);
  const posInRound = overall - (round - 1) * numTeams;
  const slot = round % 2 === 1 ? posInRound : numTeams - posInRound + 1;
  return { round, slot };
}
function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/* ------------------------------------------------------------------ */
/*  Small presentational pieces                                        */
/* ------------------------------------------------------------------ */
function PosChip({ pos }) {
  const m = POS_META[pos] || POS_META.K;
  return (
    <span
      className="ff-display text-[11px] font-semibold px-1.5 py-0.5 rounded shrink-0"
      style={{ color: m.color, background: m.bg }}
    >
      {m.label}
    </span>
  );
}

const SEVERITY_BADGE_META = {
  season_ending: { label: 'OUT', color: '#E8544A' },
  significant: { label: 'INJURY', color: '#E8544A' },
  minor: { label: 'QUESTIONABLE', color: '#E8B339' },
  off_field: { label: 'NEWS', color: '#9AA3B2' },
  positive: { label: 'GOOD NEWS', color: '#34C77B' },
};

function UpdateBadge({ update }) {
  if (!update || !SEVERITY_BADGE_META[update.severity]) return null;
  const meta = SEVERITY_BADGE_META[update.severity];
  return (
    <span
      className="ff-display text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
      style={{ color: meta.color, background: `${meta.color}22`, border: `1px solid ${meta.color}55` }}
      title={update.note}
    >
      {meta.label}
    </span>
  );
}

function PlayerRow({ player, posRank, onDraft, onTaken, canUndo, onUndo }) {
  const taken = player.status !== 'available';
  return (
    <div
      className={`flex items-center gap-2 sm:gap-3 px-3 py-2.5 rounded-lg ff-transition ${
        taken ? 'opacity-45' : 'ff-panel-raised hover:brightness-110'
      }`}
      style={taken ? { background: '#161923' } : {}}
    >
      <span className="ff-mono ff-muted text-xs w-8 shrink-0 text-right">
        {posRank ? `${player.pos}${posRank}` : ''}
      </span>
      <PosChip pos={player.pos} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className={`font-semibold text-sm truncate ${taken ? 'line-through' : ''}`}>{player.name}</span>
          <span className="ff-muted text-xs shrink-0">{player.team}</span>
          <UpdateBadge update={player.liveUpdate} />
        </div>
        {player.note ? (
          <div className="ff-muted text-xs mt-0.5 truncate sm:whitespace-normal sm:line-clamp-1">{player.note}</div>
        ) : null}
        {player.liveUpdate ? (
          <div className="text-xs mt-0.5" style={{ color: SEVERITY_BADGE_META[player.liveUpdate.severity]?.color }}>
            {player.liveUpdate.note}
          </div>
        ) : null}
      </div>
      {!taken ? (
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={() => onDraft(player.id)}
            className="ff-btn-draft text-xs font-semibold px-2.5 py-1.5 rounded-md ff-transition"
            title="Draft to my team"
          >
            Mine
          </button>
          <button
            onClick={() => onTaken(player.id)}
            className="ff-btn-taken text-xs font-semibold px-2.5 py-1.5 rounded-md ff-transition"
            title="Mark taken by another team"
          >
            Taken
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="ff-display text-[10px] font-semibold px-2 py-1 rounded"
            style={
              player.status === 'mine'
                ? { color: '#34C77B', background: 'rgba(52,199,123,0.15)' }
                : { color: '#9AA1B4', background: 'rgba(154,161,180,0.15)' }
            }
          >
            {player.status === 'mine' ? 'Your Team' : 'Taken'}
          </span>
          {canUndo && (
            <button onClick={onUndo} className="ff-muted hover:text-white ff-transition" title="Undo this pick">
              <Undo2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function RecCard({ player, posRank, reason, primary, onDraft, onTaken }) {
  return (
    <div
      className={`rounded-xl p-3 flex flex-col gap-2 ff-transition ${primary ? 'ff-panel-raised' : 'ff-panel'}`}
      style={primary ? { border: '1px solid #E8B339' } : {}}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <PosChip pos={player.pos} />
          <span className="font-semibold text-sm truncate">{player.name}</span>
          <UpdateBadge update={player.liveUpdate} />
        </div>
        <span className="ff-mono ff-muted text-[11px] shrink-0">{player.team} · {player.pos}{posRank}</span>
      </div>
      <div className="ff-muted text-xs leading-snug">{player.note}</div>
      <div className="ff-gold text-[11px] font-semibold ff-display">{reason}</div>
      <div className="flex gap-1.5 mt-1">
        <button onClick={() => onDraft(player.id)} className="ff-btn-draft text-xs font-semibold px-2.5 py-1.5 rounded-md flex-1 ff-transition">
          Draft Him
        </button>
        <button onClick={() => onTaken(player.id)} className="ff-btn-taken text-xs font-semibold px-2.5 py-1.5 rounded-md flex-1 ff-transition">
          He's Gone
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Settings form (used for initial setup + editing later)             */
/* ------------------------------------------------------------------ */
function SettingsForm({ draft, setDraft, onSubmit, submitLabel, submitting }) {
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const setRoster = (k, v) => setDraft((d) => ({ ...d, roster: { ...d.roster, [k]: v } }));

  const NumField = ({ label, value, onChange, min = 0, max = 30, wide }) => (
    <label className={`flex flex-col gap-1 ${wide ? 'col-span-2' : ''}`}>
      <span className="ff-muted text-xs ff-display">{label}</span>
      <input
        type="number"
        className="ff-input rounded-md px-2 py-1.5 text-sm w-full"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          onChange(Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : min);
        }}
      />
    </label>
  );

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-1">
        <span className="ff-muted text-xs ff-display">League name</span>
        <input
          type="text"
          className="ff-input rounded-md px-2 py-1.5 text-sm w-full"
          value={draft.leagueName || ''}
          placeholder="e.g. My 12-Team League"
          onChange={(e) => set('leagueName', e.target.value)}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <NumField label="Teams in league" value={draft.numTeams} min={4} max={16} onChange={(v) => set('numTeams', v)} />
        <NumField
          label="Your draft slot"
          value={draft.myPosition}
          min={1}
          max={draft.numTeams}
          onChange={(v) => set('myPosition', v)}
        />
      </div>

      <div>
        <div className="ff-muted text-xs ff-display mb-1.5">Scoring format</div>
        <div className="grid grid-cols-3 gap-2">
          {[
            ['standard', 'Standard'],
            ['half', 'Half PPR'],
            ['ppr', 'Full PPR'],
          ].map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => set('scoring', val)}
              className={`text-xs font-semibold py-2 rounded-md ff-transition ${
                draft.scoring === val ? 'ff-bg-gold' : 'ff-input'
              }`}
              style={draft.scoring === val ? { color: '#12141E' } : {}}
            >
              {lbl}
            </button>
          ))}
        </div>
        <div className="ff-muted text-[11px] mt-1.5">
          This mainly nudges pass-catching RBs and possession WRs up or down the board — the app doesn't
          auto-reorder players yet, so use it as a reminder while you edit the notes/ranks that matter to your league.
        </div>
      </div>

      <div>
        <div className="ff-muted text-xs ff-display mb-1.5">Starting lineup</div>
        <div className="grid grid-cols-4 gap-2">
          <NumField label="QB" value={draft.roster.QB} min={0} max={4} onChange={(v) => setRoster('QB', v)} />
          <NumField label="RB" value={draft.roster.RB} min={0} max={6} onChange={(v) => setRoster('RB', v)} />
          <NumField label="WR" value={draft.roster.WR} min={0} max={6} onChange={(v) => setRoster('WR', v)} />
          <NumField label="TE" value={draft.roster.TE} min={0} max={4} onChange={(v) => setRoster('TE', v)} />
          <NumField label="FLEX" value={draft.roster.FLEX} min={0} max={4} onChange={(v) => setRoster('FLEX', v)} />
          <NumField label="K" value={draft.roster.K} min={0} max={2} onChange={(v) => setRoster('K', v)} />
          <NumField label="DEF" value={draft.roster.DEF} min={0} max={2} onChange={(v) => setRoster('DEF', v)} />
          <NumField label="Bench" value={draft.benchSize} min={0} max={15} onChange={(v) => set('benchSize', v)} />
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={submitting}
        className="ff-bg-gold rounded-lg py-3 font-bold ff-display text-sm mt-1 disabled:opacity-60"
        style={{ color: '#12141E' }}
      >
        {submitting ? 'Creating...' : submitLabel}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main app                                                            */
/* ------------------------------------------------------------------ */
export default function FantasyDraftAssistant() {
  const [loaded, setLoaded] = useState(false);
  const [setupDone, setSetupDone] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [activeTab, setActiveTab] = useState('board');
  const [posFilter, setPosFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  /* draft settings */
  const [draft, setDraft] = useState({
    leagueName: '',
    numTeams: 10,
    myPosition: 5,
    scoring: 'half',
    roster: { ...DEFAULT_ROSTER },
    benchSize: 6,
  });

  /* player data — raw from Supabase, statuses tracked separately */
  const [rawPlayers, setRawPlayers] = useState([]);
  const [playerStatuses, setPlayerStatuses] = useState({}); // { [player_id]: 'mine'|'taken' }
  const [playersLoading, setPlayersLoading] = useState(true);
  const [playersError, setPlayersError] = useState(null);

  /* pick history (for undo) */
  const [pickLog, setPickLog] = useState([]); // [{overall, playerId, status}]

  /* league management */
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [leaguesLoading, setLeaguesLoading] = useState(true);
  const [creatingDraft, setCreatingDraft] = useState(false);

  /* cross-league exposure */
  const [myPlayersInOtherLeagues, setMyPlayersInOtherLeagues] = useState(new Map());
  const [diversifyEnabled, setDiversifyEnabled] = useState(true);

  /* live news/injury updates, keyed by player id */
  const [liveUpdates, setLiveUpdates] = useState({});
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [updatesError, setUpdatesError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  /* sync error shown when a Supabase pick write fails */
  const [syncError, setSyncError] = useState(null);

  /* ---------------- storage load/save (browser localStorage) ---------------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ff-draft-state-v2');
      if (raw) {
        const data = JSON.parse(raw);
        if (data.draft) setDraft(data.draft);
        if (data.playerStatuses) setPlayerStatuses(data.playerStatuses);
        if (data.pickLog) setPickLog(data.pickLog);
        if (data.setupDone) setSetupDone(data.setupDone);
        if (data.liveUpdates) setLiveUpdates(data.liveUpdates);
        if (data.lastChecked) setLastChecked(data.lastChecked);
        if (data.activeDraftId != null) setActiveDraftId(data.activeDraftId);
        if (data.diversifyEnabled != null) setDiversifyEnabled(data.diversifyEnabled);
      }
    } catch (e) {
      /* nothing saved yet, or storage unavailable */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(
        'ff-draft-state-v2',
        JSON.stringify({
          draft,
          playerStatuses,
          pickLog,
          setupDone,
          liveUpdates,
          lastChecked,
          activeDraftId,
          diversifyEnabled,
        })
      );
    } catch (e) {
      /* ignore save errors */
    }
  }, [draft, playerStatuses, pickLog, setupDone, liveUpdates, lastChecked, loaded, activeDraftId, diversifyEnabled]);

  /* ---------------- Supabase: load player data on mount ---------------- */
  useEffect(() => {
    supabase
      .from('current_draft_board')
      .select('player_id, full_name, position, team_id, overall_rank, latest_severity, latest_note, latest_update_at')
      .order('overall_rank')
      .then(({ data, error }) => {
        if (error) {
          setPlayersError('Could not load player data. Check your connection and Supabase env vars.');
          setPlayersLoading(false);
          return;
        }
        setRawPlayers(
          (data || []).map((p) => ({
            id: p.player_id,
            name: p.full_name,
            pos: p.position,
            team: p.team_id || '',
            rank: p.overall_rank || 9999,
            note: PLAYER_NOTES[p.full_name] || '',
          }))
        );
        /* pre-populate liveUpdates from any DB-stored news/injury records */
        const dbUpdates = {};
        (data || []).forEach((p) => {
          if (p.latest_severity && p.latest_note) {
            dbUpdates[p.player_id] = {
              severity: p.latest_severity,
              note: p.latest_note,
              checkedAt: p.latest_update_at,
            };
          }
        });
        if (Object.keys(dbUpdates).length > 0) {
          setLiveUpdates((prev) => ({ ...dbUpdates, ...prev }));
        }
        setPlayersLoading(false);
      });
  }, []);

  /* ---------------- Supabase: load leagues list on mount ---------------- */
  useEffect(() => {
    supabase
      .from('drafts')
      .select('draft_id, league_name, num_teams, my_position, scoring_format, roster_config')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setLeagues(data);
        setLeaguesLoading(false);
      });
  }, []);

  /* ---------------- Supabase: cross-league exposure query ---------------- */
  useEffect(() => {
    if (activeDraftId == null) {
      setMyPlayersInOtherLeagues(new Map());
      return;
    }
    supabase
      .from('draft_picks')
      .select('player_id, drafts(league_name)')
      .eq('drafted_by', 'me')
      .neq('draft_id', activeDraftId)
      .then(({ data, error }) => {
        if (!error && data) {
          const map = new Map();
          data.forEach((row) => {
            map.set(row.player_id, row.drafts?.league_name || 'another league');
          });
          setMyPlayersInOtherLeagues(map);
        }
      });
  }, [activeDraftId]);

  /* ---------------- players: derived from rawPlayers + playerStatuses ---------------- */
  const players = useMemo(
    () => rawPlayers.map((p) => ({ ...p, status: playerStatuses[p.id] || 'available' })),
    [rawPlayers, playerStatuses]
  );

  /* ---------------- derived values ---------------- */
  const totalRounds = useMemo(
    () => Object.values(draft.roster).reduce((a, b) => a + b, 0) + draft.benchSize,
    [draft.roster, draft.benchSize]
  );

  const myPickNumbers = useMemo(() => {
    const arr = [];
    for (let r = 1; r <= totalRounds; r++) arr.push(overallPickFor(r, draft.myPosition, draft.numTeams));
    return arr;
  }, [totalRounds, draft.myPosition, draft.numTeams]);

  const currentOverallPick = pickLog.length + 1;
  const totalPicks = totalRounds * draft.numTeams;
  const draftComplete = currentOverallPick > totalPicks;
  const { round: currentRound, slot: currentSlot } = roundAndSlotFor(
    Math.min(currentOverallPick, totalPicks),
    draft.numTeams
  );
  const isMyTurn = !draftComplete && currentSlot === draft.myPosition;

  const nextMyPick = useMemo(
    () => myPickNumbers.find((p) => p >= currentOverallPick),
    [myPickNumbers, currentOverallPick]
  );
  const followingMyPick = useMemo(() => {
    if (nextMyPick == null) return null;
    const idx = myPickNumbers.indexOf(nextMyPick);
    return idx >= 0 ? myPickNumbers[idx + 1] : null;
  }, [myPickNumbers, nextMyPick]);
  const picksUntilMine = nextMyPick != null ? nextMyPick - currentOverallPick : 0;

  const myRoster = useMemo(() => players.filter((p) => p.status === 'mine'), [players]);

  const rosterNeeds = useMemo(() => {
    const counts = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DEF: 0 };
    myRoster.forEach((p) => { counts[p.pos] = (counts[p.pos] || 0) + 1; });
    const needs = {};
    ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].forEach((pos) => {
      needs[pos] = Math.max(0, draft.roster[pos] - counts[pos]);
    });
    const flexUsed =
      Math.max(0, counts.RB - draft.roster.RB) +
      Math.max(0, counts.WR - draft.roster.WR) +
      Math.max(0, counts.TE - draft.roster.TE);
    needs.FLEX = Math.max(0, draft.roster.FLEX - flexUsed);
    return needs;
  }, [myRoster, draft.roster]);

  const availablePlayers = useMemo(
    () => players.filter((p) => p.status === 'available').sort((a, b) => a.rank - b.rank),
    [players]
  );

  /* ---------------- live news/injury check via Anthropic API ---------------- */
  const SEVERITY_META = {
    season_ending: { label: 'Season-ending', score: -900, icon: AlertTriangle, color: '#E8544A' },
    significant: { label: 'Significant', score: -180, icon: AlertTriangle, color: '#E8544A' },
    minor: { label: 'Minor / monitor', score: -35, icon: AlertCircle, color: '#E8B339' },
    off_field: { label: 'Off-field', score: -10, icon: Info, color: '#9AA3B2' },
    positive: { label: 'Good news', score: 40, icon: ThumbsUp, color: '#34C77B' },
  };

  const checkForUpdates = useCallback(async () => {
    setUpdatesLoading(true);
    setUpdatesError(null);
    try {
      const watchList = [
        ...availablePlayers.slice(0, 60),
        ...players.filter((p) => p.status === 'mine'),
      ];
      const seen = new Set();
      const uniqueList = watchList.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));

      const response = await fetch('/api/check-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          players: uniqueList.map((p) => ({ name: p.name, pos: p.pos, team: p.team })),
        }),
      });

      if (!response.ok) throw new Error('API request failed');
      const parsed = await response.json();

      const byName = {};
      uniqueList.forEach((p) => {
        byName[p.name.toLowerCase()] = p.id;
      });

      const nowIso = new Date().toISOString();
      const next = {};
      parsed.forEach((item) => {
        if (!item || !item.name || !item.severity) return;
        const id = byName[String(item.name).toLowerCase()];
        if (!id) return;
        if (!SEVERITY_META[item.severity]) return;
        next[id] = { severity: item.severity, note: item.note || '', checkedAt: nowIso };
      });

      setLiveUpdates((prev) => ({ ...prev, ...next }));
      setLastChecked(nowIso);
    } catch (e) {
      setUpdatesError('Could not fetch updates. Try again in a moment.');
    } finally {
      setUpdatesLoading(false);
    }
  }, [availablePlayers, players]);

  const posRankMap = useMemo(() => {
    const counters = {};
    const map = {};
    availablePlayers.forEach((p) => {
      counters[p.pos] = (counters[p.pos] || 0) + 1;
      map[p.id] = counters[p.pos];
    });
    return map;
  }, [availablePlayers]);

  const recommendations = useMemo(() => {
    if (draftComplete || nextMyPick == null) return [];
    const pool = availablePlayers.slice(0, 45);
    // In a single-QB league, QB is never truly scarce early (streamable all season),
    // so it gets a much smaller "need" weight than the positions that actually
    // thin out fast. TE sits in between. DEF/K need is irrelevant until the very
    // last rounds, handled separately below.
    const NEED_WEIGHT = { QB: 35, RB: 150, WR: 150, TE: 90, K: 150, DEF: 150 };
    // Positions where being "light" near the top of the board is real draft-day
    // scarcity worth reaching for. QB/K/DEF are excluded: a thin QB top-40 just
    // reflects correct draft strategy, not an imminent run you need to jump on.
    const SCARCITY_ELIGIBLE = ['RB', 'WR', 'TE'];
    const scored = pool.map((p) => {
      let score = 1000 - p.rank;
      let reason = 'Best player available';
      const need = rosterNeeds[p.pos] || 0;
      if (need > 0) {
        score += NEED_WEIGHT[p.pos] || 0;
        reason = `Fills your ${p.pos} need`;
      } else if (rosterNeeds.FLEX > 0 && FLEX_ELIGIBLE.includes(p.pos)) {
        score += 70;
        reason = 'Flex-eligible value';
      } else {
        score -= 30;
      }
      if (SCARCITY_ELIGIBLE.includes(p.pos)) {
        const depthAtPos = availablePlayers.filter((x) => x.pos === p.pos && x.rank <= p.rank + 20).length;
        if (depthAtPos <= Math.max(2, Math.ceil(picksUntilMine / 2))) {
          score += 55;
          reason = reason === 'Best player available' ? `${p.pos} run likely before your next pick` : reason;
        }
      }
      if (p.pos === 'K' || p.pos === 'DEF') {
        const roundsLeft = totalRounds - currentRound;
        if (roundsLeft > 1) score -= 700;
      }
      const update = liveUpdates[p.id];
      if (update && SEVERITY_META[update.severity]) {
        score += SEVERITY_META[update.severity].score;
        if (update.severity === 'season_ending' || update.severity === 'significant') {
          reason = `⚠ ${SEVERITY_META[update.severity].label}: ${update.note}`;
        } else if (update.severity === 'positive') {
          reason = `↑ ${update.note}`;
        }
      }
      /* Cross-league exposure penalty — soft deprioritization, never a filter */
      if (diversifyEnabled && myPlayersInOtherLeagues.has(p.id)) {
        score += CROSS_LEAGUE_EXPOSURE_PENALTY;
        const leagueName = myPlayersInOtherLeagues.get(p.id);
        if (!reason.startsWith('⚠')) {
          reason = `Already on your ${leagueName} roster — diversifying`;
        }
      }
      return { ...p, score, reason, liveUpdate: update || null };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 4);
  }, [availablePlayers, rosterNeeds, nextMyPick, picksUntilMine, draftComplete, totalRounds, currentRound, liveUpdates, myPlayersInOtherLeagues, diversifyEnabled]);

  const filteredPlayers = useMemo(() => {
    let list = players;
    if (posFilter !== 'ALL') list = list.filter((p) => p.pos === posFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q));
    }
    return [...list]
      .sort((a, b) => {
        if (a.status !== 'available' && b.status === 'available') return 1;
        if (a.status === 'available' && b.status !== 'available') return -1;
        return a.rank - b.rank;
      })
      .map((p) => (liveUpdates[p.id] ? { ...p, liveUpdate: liveUpdates[p.id] } : p));
  }, [players, posFilter, search, liveUpdates]);

  /* ---------------- handlers ---------------- */
  const markPlayer = useCallback(
    (playerId, status) => {
      /* optimistic local update */
      setPlayerStatuses((prev) => ({ ...prev, [playerId]: status }));
      setPickLog((prev) => {
        const overall = prev.length + 1;
        const { round, slot } = roundAndSlotFor(overall, draft.numTeams);
        /* background write to Supabase — does not block UI */
        if (activeDraftId != null) {
          supabase
            .from('draft_picks')
            .insert({
              draft_id: activeDraftId,
              player_id: playerId,
              overall_pick_number: overall,
              round,
              slot,
              drafted_by: status === 'mine' ? 'me' : 'opponent',
            })
            .then(({ error }) => {
              if (error) setSyncError('Pick not synced to cloud — saved locally only.');
            });
        }
        return [...prev, { overall, playerId, status }];
      });
    },
    [activeDraftId, draft.numTeams]
  );

  const handleDraft = useCallback((id) => markPlayer(id, 'mine'), [markPlayer]);
  const handleTaken = useCallback((id) => markPlayer(id, 'taken'), [markPlayer]);

  const handleUndo = useCallback(() => {
    setPickLog((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setPlayerStatuses((ps) => {
        const next = { ...ps };
        delete next[last.playerId];
        return next;
      });
      return prev.slice(0, -1);
    });
  }, []);

  /* Select an existing league from the DB list */
  const selectLeague = useCallback(async (league) => {
    const config = league.roster_config || {};
    const { BN: benchSize = 6, QB = 1, RB = 2, WR = 2, TE = 1, FLEX = 1, K = 1, DEF = 1 } = config;
    setDraft({
      leagueName: league.league_name || '',
      numTeams: league.num_teams,
      myPosition: league.my_position,
      scoring: scoringFromDb(league.scoring_format),
      roster: { QB, RB, WR, TE, FLEX, K, DEF },
      benchSize,
    });
    setActiveDraftId(league.draft_id);

    /* load existing picks for this draft so the board reflects them */
    const { data: picks } = await supabase
      .from('draft_picks')
      .select('player_id, drafted_by, overall_pick_number')
      .eq('draft_id', league.draft_id)
      .order('overall_pick_number');

    if (picks && picks.length > 0) {
      const statuses = {};
      picks.forEach((p) => { statuses[p.player_id] = p.drafted_by === 'me' ? 'mine' : 'taken'; });
      setPlayerStatuses(statuses);
      setPickLog(picks.map((p) => ({ overall: p.overall_pick_number, playerId: p.player_id, status: statuses[p.player_id] })));
    } else {
      setPlayerStatuses({});
      setPickLog([]);
    }

    setSetupDone(true);
  }, []);

  /* Create a new league in DB then enter draft */
  const startDraft = useCallback(async () => {
    setCreatingDraft(true);
    try {
      const rosterConfig = { ...draft.roster, BN: draft.benchSize };
      const { data, error } = await supabase
        .from('drafts')
        .insert({
          season_year: 2026,
          league_name: draft.leagueName || 'My League',
          num_teams: draft.numTeams,
          my_position: draft.myPosition,
          scoring_format: scoringToDb(draft.scoring),
          roster_config: rosterConfig,
        })
        .select('draft_id')
        .single();

      if (!error && data) {
        setActiveDraftId(data.draft_id);
        setLeagues((prev) => [
          { draft_id: data.draft_id, league_name: draft.leagueName || 'My League', num_teams: draft.numTeams, my_position: draft.myPosition, scoring_format: scoringToDb(draft.scoring), roster_config: rosterConfig },
          ...prev,
        ]);
      } else {
        setSyncError('Could not save league to cloud — picks will be local only.');
      }
    } catch (e) {
      setSyncError('Could not save league to cloud — picks will be local only.');
    }
    setPlayerStatuses({});
    setPickLog([]);
    setSetupDone(true);
    setShowSettings(false);
    setCreatingDraft(false);
  }, [draft]);

  const doReset = () => {
    setPlayerStatuses({});
    setPickLog([]);
    setConfirmReset(false);
    setShowSettings(false);
  };

  const lastPickPlayerId = pickLog.length ? pickLog[pickLog.length - 1].playerId : null;

  /* ---------------- loading screen ---------------- */
  if (!loaded) {
    return (
      <div className="ff-root rounded-2xl p-8 max-w-3xl mx-auto flex items-center justify-center min-h-48">
        <Tokens />
        <div className="flex flex-col items-center gap-3">
          <div className="ff-bg-gold rounded-md p-2"><Trophy size={20} color="#12141E" /></div>
          <RefreshCw size={16} className="ff-spin ff-muted" />
        </div>
      </div>
    );
  }

  /* ---------------- setup screen ---------------- */
  if (!setupDone) {
    return (
      <div className="ff-root rounded-2xl p-5 sm:p-8 max-w-xl mx-auto">
        <Tokens />
        <div className="flex items-center gap-2 mb-1">
          <div className="ff-bg-gold rounded-md p-1.5"><Trophy size={18} color="#12141E" /></div>
          <span className="ff-muted text-xs ff-display">2026 Season</span>
        </div>
        <h1 className="ff-display text-3xl sm:text-4xl font-bold mb-1">Draft Command Center</h1>
        <p className="ff-muted text-sm mb-6">
          Set your league up once. From here on, every pick you mark — yours or anyone else's — updates
          who you should target next.
        </p>

        {/* existing leagues */}
        {(leaguesLoading || leagues.length > 0) && (
          <div className="mb-6">
            <div className="ff-muted text-xs ff-display mb-2 flex items-center gap-1.5">
              Continue an existing draft
            </div>
            {leaguesLoading ? (
              <div className="ff-muted text-xs flex items-center gap-1.5 py-2">
                <RefreshCw size={12} className="ff-spin" /> Loading your leagues…
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {leagues.map((league) => (
                  <button
                    key={league.draft_id}
                    onClick={() => selectLeague(league)}
                    className="ff-panel-raised rounded-lg px-4 py-3 text-left ff-transition hover:brightness-110 w-full"
                  >
                    <div className="font-semibold text-sm">{league.league_name || `Draft #${league.draft_id}`}</div>
                    <div className="ff-muted text-xs mt-0.5">
                      {league.num_teams} teams · Slot {league.my_position} ·{' '}
                      {scoringFromDb(league.scoring_format) === 'half'
                        ? 'Half PPR'
                        : scoringFromDb(league.scoring_format) === 'ppr'
                        ? 'Full PPR'
                        : 'Standard'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* divider */}
        <div style={{ borderTop: '1px solid #2A2E3D' }} className="pt-5 mb-4">
          <div className="ff-muted text-xs ff-display">
            {leagues.length > 0 ? '— or create a new league —' : 'Create your first league'}
          </div>
        </div>

        <SettingsForm
          draft={draft}
          setDraft={setDraft}
          onSubmit={startDraft}
          submitLabel="Enter the War Room"
          submitting={creatingDraft}
        />
      </div>
    );
  }

  /* ---------------- players loading / error screen ---------------- */
  if (playersError) {
    return (
      <div className="ff-root rounded-2xl p-8 max-w-3xl mx-auto flex items-center justify-center min-h-48">
        <Tokens />
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle size={24} style={{ color: '#E8544A' }} />
          <div className="text-sm" style={{ color: '#E8544A' }}>{playersError}</div>
        </div>
      </div>
    );
  }

  if (playersLoading) {
    return (
      <div className="ff-root rounded-2xl p-8 max-w-3xl mx-auto flex items-center justify-center min-h-48">
        <Tokens />
        <div className="flex flex-col items-center gap-3">
          <div className="ff-bg-gold rounded-md p-2"><Trophy size={20} color="#12141E" /></div>
          <div className="ff-muted text-sm">Loading draft board…</div>
          <RefreshCw size={16} className="ff-spin ff-muted" />
        </div>
      </div>
    );
  }

  /* ---------------- main app ---------------- */
  return (
    <div className="ff-root rounded-2xl p-3 sm:p-5 max-w-3xl mx-auto ff-scrollbar">
      <Tokens />

      {/* header */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="ff-bg-gold rounded-md p-1.5 shrink-0"><Trophy size={16} color="#12141E" /></div>
          <div className="min-w-0">
            <div className="ff-display text-sm font-bold leading-tight truncate">
              {draft.leagueName || 'Draft Command Center'}
            </div>
            <div className="ff-muted text-[11px] leading-tight ff-mono">
              {draft.numTeams}-team · Slot {draft.myPosition} · {draft.scoring === 'ppr' ? 'Full PPR' : draft.scoring === 'half' ? 'Half PPR' : 'Standard'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {lastPickPlayerId && (
            <button onClick={handleUndo} className="ff-panel-raised rounded-md p-2 ff-transition hover:brightness-110" title="Undo last pick">
              <Undo2 size={15} />
            </button>
          )}
          <button
            onClick={checkForUpdates}
            disabled={updatesLoading}
            className="ff-panel-raised rounded-md p-2 ff-transition hover:brightness-110 disabled:opacity-50"
            title="Check for injury/news updates"
          >
            <RefreshCw size={15} className={updatesLoading ? 'ff-spin' : ''} />
          </button>
          <button onClick={() => setShowSettings((s) => !s)} className="ff-panel-raised rounded-md p-2 ff-transition hover:brightness-110" title="Settings">
            <Settings size={15} />
          </button>
        </div>
      </div>

      {/* sync error indicator */}
      {syncError && (
        <div
          className="ff-panel rounded-lg px-3 py-2 mb-3 text-xs flex items-center gap-2"
          style={{ borderColor: '#E8544A', borderWidth: 1 }}
        >
          <AlertTriangle size={12} style={{ color: '#E8544A' }} />
          <span style={{ color: '#E8544A' }} className="flex-1">{syncError}</span>
          <button onClick={() => setSyncError(null)} className="ff-muted hover:text-white ff-transition">
            <X size={12} />
          </button>
        </div>
      )}

      {/* update status strip */}
      {(updatesLoading || updatesError || lastChecked) && (
        <div className="ff-panel rounded-lg px-3 py-2 mb-3 text-xs flex items-center gap-2 flex-wrap">
          {updatesLoading ? (
            <span className="ff-muted flex items-center gap-1.5"><RefreshCw size={12} className="ff-spin" /> Searching for injury &amp; news updates on your available players and roster…</span>
          ) : updatesError ? (
            <span style={{ color: '#E8544A' }}>{updatesError}</span>
          ) : (
            <span className="ff-muted">
              News last checked {new Date(lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {Object.keys(liveUpdates).length > 0 ? ` · ${Object.keys(liveUpdates).length} flagged player${Object.keys(liveUpdates).length === 1 ? '' : 's'}` : ' · nothing new found'}
            </span>
          )}
        </div>
      )}

      {/* settings panel */}
      {showSettings && (
        <div className="ff-panel rounded-xl p-4 mb-3">
          <SettingsForm draft={draft} setDraft={setDraft} onSubmit={() => setShowSettings(false)} submitLabel="Save Settings" />

          {/* diversify toggle */}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid #2A2E3D' }}>
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <div className="text-sm font-semibold">Diversify across my other leagues</div>
                <div className="ff-muted text-xs mt-0.5">
                  Softly deprioritizes players already on your roster in other leagues (−{Math.abs(CROSS_LEAGUE_EXPOSURE_PENALTY)} pts)
                </div>
              </div>
              <label className="ff-toggle shrink-0">
                <input
                  type="checkbox"
                  checked={diversifyEnabled}
                  onChange={(e) => setDiversifyEnabled(e.target.checked)}
                />
                <span className="ff-toggle-slider" />
              </label>
            </label>
          </div>

          <div className="mt-4 pt-4 text-xs ff-muted" style={{ borderTop: '1px solid #2A2E3D' }}>
            The <RefreshCw size={11} className="inline -mt-0.5" /> refresh icon up top searches the web for fresh injury/trade/news on your available players and roster, tags severity (season-ending, significant, minor, off-field, or good news), and folds it into recommendations. It's a live web search each time you tap it, so use it a few times over the next day or two rather than repeatedly — not automatic, and it never touches K/DEF.
          </div>

          {/* switch league */}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid #2A2E3D' }}>
            <button
              onClick={() => { setSetupDone(false); setShowSettings(false); }}
              className="ff-muted text-xs font-semibold flex items-center gap-1.5 hover:text-white ff-transition"
            >
              <Plus size={13} /> Switch to a different league
            </button>
          </div>

          <div className="mt-4 pt-4" style={{ borderTop: '1px solid #2A2E3D' }}>
            {!confirmReset ? (
              <button onClick={() => setConfirmReset(true)} className="ff-red text-xs font-semibold flex items-center gap-1.5">
                <RotateCcw size={13} /> Start a brand-new draft (clears all picks)
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs ff-muted">Clear every pick and start over?</span>
                <button onClick={doReset} className="ff-bg-red text-xs font-semibold px-2.5 py-1 rounded-md">Yes, reset</button>
                <button onClick={() => setConfirmReset(false)} className="ff-btn-taken text-xs font-semibold px-2.5 py-1 rounded-md">Cancel</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* turn banner */}
      {draftComplete ? (
        <div className="ff-panel-raised rounded-xl p-4 mb-3 flex items-center gap-3">
          <Trophy className="ff-gold shrink-0" size={22} />
          <div>
            <div className="ff-display font-bold text-sm">Draft Complete</div>
            <div className="ff-muted text-xs">Check the My Roster tab for your final squad.</div>
          </div>
        </div>
      ) : (
        <div className={`rounded-xl p-4 mb-3 ${isMyTurn ? 'ff-clock' : 'ff-panel-raised'}`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {isMyTurn ? <Flame size={18} /> : <Clock size={16} className="ff-muted" />}
              <span className="ff-display font-bold text-sm">
                {isMyTurn ? "You're On The Clock" : `Round ${currentRound} · ${ordinal(currentSlot)} slot picking`}
              </span>
            </div>
            <span className={`ff-mono text-xs font-semibold ${isMyTurn ? '' : 'ff-muted'}`}>
              Pick {currentOverallPick} of {totalPicks}
            </span>
          </div>
          {!isMyTurn && (
            <div className={`text-xs mt-1.5 ${isMyTurn ? '' : 'ff-muted'}`}>
              Your next pick: <span className="ff-mono font-semibold">#{nextMyPick}</span>
              {' '}({picksUntilMine} pick{picksUntilMine === 1 ? '' : 's'} away)
              {followingMyPick ? <> · then #{followingMyPick}</> : null}
            </div>
          )}
        </div>
      )}

      {/* tabs */}
      <div className="flex gap-1.5 mb-3">
        {[
          ['board', 'Draft Board', LayoutGrid],
          ['roster', 'My Roster', ListChecks],
        ].map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold ff-display ff-transition ${
              activeTab === key ? 'ff-tab-active' : 'ff-tab-inactive ff-panel'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'board' && (
        <div>
          {!draftComplete && recommendations.length > 0 && (
            <div className="mb-4">
              <div className="ff-display text-xs font-semibold ff-muted mb-2 flex items-center gap-1.5">
                <ChevronRight size={14} className="ff-gold" />
                Targets for pick #{nextMyPick}{isMyTurn ? ' (now!)' : ''}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recommendations.map((p, i) => (
                  <RecCard
                    key={p.id}
                    player={p}
                    posRank={posRankMap[p.id]}
                    reason={p.reason}
                    primary={i === 0}
                    onDraft={handleDraft}
                    onTaken={handleTaken}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 ff-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search players or teams…"
                className="ff-input rounded-lg pl-8 pr-3 py-2 text-sm w-full"
              />
            </div>
          </div>
          <div className="flex gap-1.5 mb-3 overflow-x-auto ff-scrollbar pb-1">
            {['ALL', 'QB', 'RB', 'WR', 'TE', 'K', 'DEF'].map((pos) => (
              <button
                key={pos}
                onClick={() => setPosFilter(pos)}
                className={`ff-display text-[11px] font-semibold px-2.5 py-1.5 rounded-md shrink-0 ff-transition ${
                  posFilter === pos ? 'ff-bg-gold' : 'ff-panel'
                }`}
                style={posFilter === pos ? { color: '#12141E' } : {}}
              >
                {pos}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-1.5 max-h-[520px] overflow-y-auto ff-scrollbar pr-1">
            {filteredPlayers.map((p) => (
              <PlayerRow
                key={p.id}
                player={p}
                posRank={p.status === 'available' ? posRankMap[p.id] : null}
                onDraft={handleDraft}
                onTaken={handleTaken}
                canUndo={p.id === lastPickPlayerId}
                onUndo={handleUndo}
              />
            ))}
            {filteredPlayers.length === 0 && (
              <div className="ff-muted text-sm text-center py-8">No players match that search.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'roster' && (
        <div>
          <div className="ff-display text-xs font-semibold ff-muted mb-2 flex items-center gap-1.5">
            <Shield size={14} className="ff-gold" /> Starting Lineup
          </div>
          <div className="flex flex-col gap-1.5 mb-5">
            {(() => {
              const used = { QB: 0, RB: 0, WR: 0, TE: 0 };
              const flexPool = [];
              const starterFor = [];
              myRoster
                .slice()
                .sort((a, b) => a.rank - b.rank)
                .forEach((p) => {
                  if (['QB', 'K', 'DEF'].includes(p.pos)) {
                    if (used[p.pos] < draft.roster[p.pos]) {
                      starterFor.push({ slot: p.pos, player: p });
                      used[p.pos] = (used[p.pos] || 0) + 1;
                    } else flexPool.push(p);
                  } else if (['RB', 'WR', 'TE'].includes(p.pos)) {
                    if (used[p.pos] < draft.roster[p.pos]) {
                      starterFor.push({ slot: p.pos, player: p });
                      used[p.pos] = (used[p.pos] || 0) + 1;
                    } else flexPool.push(p);
                  } else flexPool.push(p);
                });
              const flexStarters = flexPool.slice(0, draft.roster.FLEX);
              const bench = flexPool.slice(draft.roster.FLEX);

              const rows = [];
              ['QB', 'RB', 'WR', 'TE'].forEach((pos) => {
                for (let i = 0; i < draft.roster[pos]; i++) {
                  const match = starterFor.filter((s) => s.slot === pos)[i];
                  rows.push({ label: pos, player: match ? match.player : null });
                }
              });
              for (let i = 0; i < draft.roster.FLEX; i++) {
                rows.push({ label: 'FLEX', player: flexStarters[i] || null });
              }
              ['K', 'DEF'].forEach((pos) => {
                for (let i = 0; i < draft.roster[pos]; i++) {
                  const match = starterFor.filter((s) => s.slot === pos)[i];
                  rows.push({ label: pos, player: match ? match.player : null });
                }
              });

              return (
                <>
                  {rows.map((r, i) => (
                    <div key={i} className="ff-panel-raised rounded-lg px-3 py-2.5 flex items-center gap-3">
                      <span className="ff-display text-xs font-bold ff-gold w-11 shrink-0">{r.label}</span>
                      {r.player ? (
                        <>
                          <PosChip pos={r.player.pos} />
                          <span className="font-semibold text-sm truncate">{r.player.name}</span>
                          <span className="ff-muted text-xs">{r.player.team}</span>
                        </>
                      ) : (
                        <span className="ff-muted text-sm italic">Empty</span>
                      )}
                    </div>
                  ))}

                  <div className="ff-display text-xs font-semibold ff-muted mt-4 mb-2">
                    Bench ({bench.length}/{draft.benchSize})
                  </div>
                  {bench.length === 0 && <div className="ff-muted text-sm italic">No bench players yet.</div>}
                  {bench.map((p) => (
                    <div key={p.id} className="ff-panel rounded-lg px-3 py-2 flex items-center gap-3">
                      <PosChip pos={p.pos} />
                      <span className="font-semibold text-sm truncate">{p.name}</span>
                      <span className="ff-muted text-xs">{p.team}</span>
                    </div>
                  ))}
                </>
              );
            })()}
          </div>

          <div className="ff-panel rounded-lg p-3 flex items-center gap-2 text-xs ff-muted">
            <Users size={14} /> {myRoster.length} of {totalRounds} picks used
            {picksUntilMine > 0 && !draftComplete ? <> · next pick in {picksUntilMine}</> : null}
          </div>
        </div>
      )}
    </div>
  );
}