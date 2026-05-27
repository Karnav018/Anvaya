import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Route as RouteIcon,
  Lock,
  Database,
  Send,
  LayoutGrid,
  Code,
  Users,
  Check,
  CirclePlay,
  ChevronDown,
  Braces,
  Workflow,
  Mail,
  CloudUpload,
  BrainCircuit,
  CreditCard,
  Globe,
  HardDrive,
  TriangleAlert,
  CircleCheck,
  MessageCircle,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* Shared motion preset — one-shot fade-up on scroll                          */
/* -------------------------------------------------------------------------- */
const fadeUp = {
  initial: { opacity: 0, y: 8 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

/* -------------------------------------------------------------------------- */
/* Hand-rolled Express.js syntax highlighter                                  */
/* -------------------------------------------------------------------------- */
const KEYWORDS = new Set([
  'const',
  'let',
  'var',
  'async',
  'await',
  'function',
  'require',
  'return',
  'try',
  'catch',
  'if',
  'else',
  'new',
  'module',
  'exports',
  'import',
  'from',
  'export',
  'default',
]);

function highlight(code: string) {
  // Tokenize line-by-line, then per-line split on strings / comments / words.
  const lines = code.split('\n');
  return lines.map((line, lineIdx) => {
    const tokens: Array<{ t: string; cls?: string }> = [];

    // Handle comments at line level
    const commentIdx = (() => {
      // Avoid matching // inside a string — naive but good enough for our static snippets.
      let inStr: string | null = null;
      for (let i = 0; i < line.length - 1; i++) {
        const c = line[i];
        if (inStr) {
          if (c === '\\') {
            i++;
            continue;
          }
          if (c === inStr) inStr = null;
        } else {
          if (c === "'" || c === '"' || c === '`') inStr = c;
          else if (c === '/' && line[i + 1] === '/') return i;
        }
      }
      return -1;
    })();

    const codePart = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
    const commentPart = commentIdx >= 0 ? line.slice(commentIdx) : '';

    // Split codePart into string / non-string chunks
    const re = /(['"`])((?:\\.|(?!\1).)*)\1/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(codePart)) !== null) {
      if (m.index > last) {
        tokens.push(...splitWords(codePart.slice(last, m.index)));
      }
      tokens.push({ t: m[0], cls: 'text-slate-400' });
      last = m.index + m[0].length;
    }
    if (last < codePart.length) {
      tokens.push(...splitWords(codePart.slice(last)));
    }
    if (commentPart) {
      tokens.push({ t: commentPart, cls: 'text-white/40' });
    }

    return (
      <span key={lineIdx}>
        {tokens.map((tok, i) =>
          tok.cls ? (
            <span key={i} className={tok.cls}>
              {tok.t}
            </span>
          ) : (
            <span key={i}>{tok.t}</span>
          )
        )}
        {lineIdx < lines.length - 1 ? '\n' : ''}
      </span>
    );
  });
}

function splitWords(s: string): Array<{ t: string; cls?: string }> {
  const out: Array<{ t: string; cls?: string }> = [];
  // Split on word boundaries while keeping the separators.
  const parts = s.split(/(\b[A-Za-z_$][A-Za-z0-9_$]*\b)/g);
  for (const p of parts) {
    if (!p) continue;
    if (KEYWORDS.has(p)) {
      out.push({ t: p, cls: 'text-primary' });
    } else {
      out.push({ t: p });
    }
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Code samples                                                               */
/* -------------------------------------------------------------------------- */
const HERO_CODE = `const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { User } = require('../models/User');

router.get('/users', authenticate, async (req, res, next) => {
  try {
    const users = await User.findAll();
    res.status(200).json({ data: users });
  } catch (err) { next(err); }
});

module.exports = router;`;

const TAB_FILES: Record<string, string> = {
  'routes/users.js': `const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { User } = require('../models/User');

router.get('/users', authenticate, async (req, res, next) => {
  try {
    const users = await User.findAll();
    res.status(200).json({ data: users });
  } catch (err) { next(err); }
});

module.exports = router;`,
  'models/User.js': `const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, primaryKey: true },
  email: { type: DataTypes.STRING, unique: true },
  createdAt: { type: DataTypes.DATE },
});

module.exports = { User };`,
  'middleware/auth.js': `const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) { res.status(401).json({ error: 'Invalid token' }); }
}

module.exports = { authenticate };`,
  'server.js': `const express = require('express');
const app = express();
const usersRouter = require('./routes/users');

app.use(express.json());
app.use('/api', usersRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('Server running on http://localhost:' + port);
});`,
};

/* -------------------------------------------------------------------------- */
/* Node catalog — 14 blocks matching CustomNodes.tsx                          */
/* -------------------------------------------------------------------------- */
const NODE_CATALOG = [
  { name: 'Route', Icon: RouteIcon },
  { name: 'Auth', Icon: Lock },
  { name: 'Database', Icon: Database },
  { name: 'Schema', Icon: Braces },
  { name: 'Validation', Icon: CircleCheck },
  { name: 'Middleware', Icon: Workflow },
  { name: 'Response', Icon: Send },
  { name: 'Fetch', Icon: Globe },
  { name: 'Cache', Icon: HardDrive },
  { name: 'Email', Icon: Mail },
  { name: 'Upload', Icon: CloudUpload },
  { name: 'AI', Icon: BrainCircuit },
  { name: 'Payment', Icon: CreditCard },
  { name: 'Error Handler', Icon: TriangleAlert },
];

/* -------------------------------------------------------------------------- */
/* FAQ                                                                         */
/* -------------------------------------------------------------------------- */
const FAQ = [
  {
    q: 'Do I have to know how to code?',
    a: 'No, but Anvaya is built for developers who do. The generated code is yours to read and edit.',
  },
  {
    q: 'What frameworks do you support?',
    a: 'Today: Node.js / Express. Coming: FastAPI, NestJS, Go.',
  },
  {
    q: 'Can I self-host the APIs?',
    a: 'Yes. Anvaya outputs a standard Node project. Deploy anywhere — Fly.io, Render, AWS, your laptop.',
  },
  {
    q: 'Is there a free tier forever?',
    a: 'Yes. The Free plan gives you 10 generations a month, indefinitely.',
  },
  {
    q: 'Can my team collaborate on the same project?',
    a: 'Yes, on Pro and above. Owners, editors, and viewers.',
  },
];

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */
export default function Landing() {
  const [activeTab, setActiveTab] = useState<keyof typeof TAB_FILES>('routes/users.js');

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans">
      <StickyNav />
      <Hero />
      <TrustBand />
      <FeatureTrio />
      <HowItWorks />
      <NodeCatalogSection />
      <CodeProof activeTab={activeTab} setActiveTab={setActiveTab} />
      <PricingTeaser />
      <FaqSection />
      <FinalCta />
      <Footer />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sticky nav                                                                  */
/* -------------------------------------------------------------------------- */
function StickyNav() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <NodeGlyph />
          <span className="font-semibold text-[18px] tracking-tight text-white">Anvaya</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-[14px]">
          <a href="#product" className="text-white/60 hover:text-white transition-colors">
            Product
          </a>
          <a href="#pricing" className="text-white/60 hover:text-white transition-colors">
            Pricing
          </a>
          <Link to="/docs" className="text-white/60 hover:text-white transition-colors">
            Docs
          </Link>
          <Link to="/docs/changelog" className="text-white/60 hover:text-white transition-colors">
            Changelog
          </Link>
        </div>
        <div className="flex items-center gap-3 text-[14px]">
          <Link to="/login" className="px-3 py-2 text-white/70 hover:text-white transition-colors">
            Sign in
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 bg-primary text-white font-medium rounded-xl hover:brightness-110 transition-all"
          >
            Start free
          </Link>
        </div>
      </div>
    </nav>
  );
}

function NodeGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <circle cx="4" cy="4" r="2.4" fill="#6366f1" />
      <circle cx="18" cy="4" r="2.4" fill="#a3a6ff" />
      <circle cx="11" cy="18" r="2.4" fill="#6366f1" />
      <path
        d="M4 4 L11 18 M18 4 L11 18 M4 4 L18 4"
        stroke="#6366f1"
        strokeOpacity="0.6"
        strokeWidth="1.2"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                        */
/* -------------------------------------------------------------------------- */
function Hero() {
  return (
    <header className="relative min-h-screen pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(99,102,241,0.18),transparent_60%)] pointer-events-none" />
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.2em] text-primary mb-6">
            Visual API Builder
          </span>
          <h1
            className="font-semibold leading-[1.05] mb-6 text-[40px] md:text-[72px]"
            style={{ letterSpacing: '-0.02em' }}
          >
            From canvas to code.
            <br />
            In minutes, not days.
          </h1>
          <p className="text-[18px] text-white/70 max-w-[600px] mx-auto mb-10 leading-relaxed">
            Design REST APIs as a node graph. Anvaya generates a runnable Express.js project —
            typed, tested, deployable.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <Link
              to="/signup"
              className="px-7 py-3.5 bg-primary text-white font-semibold rounded-xl hover:brightness-110 transition-all"
            >
              Start building free
            </Link>
            <button
              type="button"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold border border-border text-white/80 hover:text-white hover:bg-surface transition-all"
            >
              <CirclePlay size={18} /> See it in motion
            </button>
          </div>
          <p className="text-[12px] text-white/40">
            10 free generations per month. No credit card.
          </p>
        </div>

        <HeroMockup />
      </div>
    </header>
  );
}

function HeroMockup() {
  return (
    <motion.div
      {...fadeUp}
      className="mt-16 relative"
      style={{ boxShadow: '0 40px 80px -20px rgba(99,102,241,0.15)' }}
    >
      <div className="bg-surface border border-border rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-10">
        {/* Canvas (60%) */}
        <div className="md:col-span-6 relative bg-[#0f1218] min-h-[440px] overflow-hidden">
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                'radial-gradient(#262629 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <CanvasScene />
        </div>

        {/* Code panel (40%) */}
        <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-border bg-[#0a0a0f] flex flex-col">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-surface">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
            <span className="ml-3 px-2 py-0.5 text-[11px] font-mono text-white/60 bg-background border border-border rounded">
              routes/users.js
            </span>
          </div>
          <pre className="flex-1 p-4 font-mono text-[12px] leading-[1.6] text-white/85 overflow-x-auto">
            <code>{highlight(HERO_CODE)}</code>
          </pre>
        </div>
      </div>
    </motion.div>
  );
}

/* Hero canvas — 4 node cards in horizontal flow with a looped fade edge.    */
function CanvasScene() {
  const nodes = [
    { title: 'GET /users', sub: 'Route', Icon: RouteIcon },
    { title: 'JWT', sub: 'Auth', Icon: Lock },
    { title: 'Postgres findAll', sub: 'Database', Icon: Database },
    { title: '200 JSON', sub: 'Response', Icon: Send },
  ];
  return (
    <div className="relative h-full min-h-[440px] px-6 py-10 flex items-center justify-between gap-3 flex-wrap md:flex-nowrap">
      {/* Connector edges */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none hidden md:block"
        preserveAspectRatio="none"
        style={{ filter: 'drop-shadow(0 0 4px rgba(99,102,241,0.4))' }}
      >
        {/* Three horizontal edges between the four nodes */}
        <line x1="22%" y1="50%" x2="28%" y2="50%" stroke="#6366f1" strokeWidth="1.5" />
        <motion.line
          x1="47%"
          y1="50%"
          x2="53%"
          y2="50%"
          stroke="#6366f1"
          strokeWidth="1.5"
          initial={{ opacity: 0.25 }}
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <line x1="72%" y1="50%" x2="78%" y2="50%" stroke="#6366f1" strokeWidth="1.5" />
      </svg>

      {nodes.map((n) => (
        <NodeCard key={n.title} title={n.title} sub={n.sub} Icon={n.Icon} />
      ))}
    </div>
  );
}

function NodeCard({
  title,
  sub,
  Icon,
}: {
  title: string;
  sub: string;
  Icon: typeof RouteIcon;
}) {
  return (
    <div className="bg-[#161a21] border border-border rounded-xl p-3 w-44 relative z-10">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-7 h-7 rounded-lg bg-primary/15 grid place-items-center">
          <Icon size={14} className="text-primary" />
        </span>
        <span className="text-[11px] uppercase tracking-wider text-white/40 font-mono">{sub}</span>
      </div>
      <div className="text-[13px] font-medium text-white" style={{ fontWeight: 500 }}>
        {title}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Trust band (research-backed)                                                */
/* -------------------------------------------------------------------------- */
function TrustBand() {
  return (
    <motion.section
      {...fadeUp}
      className="border-y border-border bg-surface/30 py-6"
    >
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
        <p className="text-[14px] text-white/50">
          Built on research-backed visual programming methodology.
        </p>
        <Link
          to="/docs/research"
          className="text-[14px] text-primary hover:underline font-medium"
        >
          Read the paper →
        </Link>
      </div>
    </motion.section>
  );
}

/* -------------------------------------------------------------------------- */
/* Feature trio                                                                */
/* -------------------------------------------------------------------------- */
function FeatureTrio() {
  const features = [
    {
      Icon: LayoutGrid,
      title: 'Visual-first',
      body:
        'Drag connected nodes for routes, auth, databases, and validation. See your API as a graph, not a maze of files.',
    },
    {
      Icon: Code,
      title: 'Real code out',
      body:
        'Express.js with proper structure: routes, models, middleware, validators, tests, env config. Download as a ZIP and run with `node server.js`.',
    },
    {
      Icon: Users,
      title: 'Built for teams',
      body:
        'Workspaces, roles (owner / editor / viewer), and team billing. Invite teammates and ship together.',
    },
  ];

  return (
    <section id="product" className="py-24">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        <motion.div {...fadeUp} className="text-center mb-14 max-w-3xl mx-auto">
          <h2
            className="text-[40px] font-semibold tracking-tight mb-4"
            style={{ letterSpacing: '-0.02em' }}
          >
            Stop boilerplating. Start shipping.
          </h2>
          <p className="text-[18px] text-white/60">
            Every node generates real code. Read it. Edit it. Own it.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map(({ Icon, title, body }) => (
            <motion.div
              key={title}
              {...fadeUp}
              className="bg-surface border border-border rounded-2xl p-8 transition-all hover:-translate-y-1 hover:shadow-[0_12px_40px_-12px_rgba(99,102,241,0.25)]"
            >
              <span className="inline-flex w-12 h-12 rounded-xl bg-primary/10 items-center justify-center mb-5">
                <Icon className="text-primary" size={22} />
              </span>
              <h3 className="text-[20px] font-semibold mb-2 text-white">{title}</h3>
              <p className="text-[15px] text-white/65 leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* How it works                                                                */
/* -------------------------------------------------------------------------- */
function HowItWorks() {
  const steps = [
    { n: '01', title: 'Design on the canvas.', body: 'Drag and connect nodes for routes, auth, databases, and validation.' },
    { n: '02', title: 'Preview the generated code.', body: 'Inspect routes, models, and middleware as the canvas updates.' },
    { n: '03', title: 'Download and run.', body: 'Export a clean Express.js project and run it anywhere Node.js runs.' },
  ];

  return (
    <section className="py-24 bg-surface/30 border-y border-border">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        <motion.h2
          {...fadeUp}
          className="text-[40px] font-semibold tracking-tight text-center mb-16 max-w-3xl mx-auto"
          style={{ letterSpacing: '-0.02em' }}
        >
          Three steps from idea to deployed API.
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <motion.div {...fadeUp} key={s.n} className="space-y-4">
              <div className="text-[64px] leading-none font-semibold text-primary/60" style={{ letterSpacing: '-0.04em' }}>
                {s.n}
              </div>
              <h3 className="text-[20px] font-semibold text-white">{s.title}</h3>
              <p className="text-[15px] text-white/60 leading-relaxed">{s.body}</p>
              <StepPane index={i} caption={s.title} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepPane({ index, caption }: { index: number; caption: string }) {
  if (index === 2) {
    return (
      <div className="bg-[#0f1218] aspect-video rounded-xl border border-border p-5 font-mono text-[12px] leading-[1.6] overflow-hidden">
        <div>
          <span className="text-primary">$ </span>
          <span className="text-white">npm install</span>
        </div>
        <div>
          <span className="text-primary">$ </span>
          <span className="text-white">node server.js</span>
        </div>
        <div className="text-green-400">✓ Server running on http://localhost:3000</div>
        <div>
          <span className="text-primary">$ </span>
          <span className="text-white">curl http://localhost:3000/users</span>
        </div>
        <div className="text-white/60">{`{"data":[{"id":"...","email":"..."}]}`}</div>
      </div>
    );
  }
  return (
    <div className="bg-[#0f1218] aspect-video rounded-xl border border-border grid place-items-center text-center px-6">
      <span className="text-[13px] text-white/40 font-mono">{caption}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Node catalog                                                                */
/* -------------------------------------------------------------------------- */
function NodeCatalogSection() {
  return (
    <section className="py-24">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        <motion.h2
          {...fadeUp}
          className="text-[40px] font-semibold tracking-tight text-center mb-10"
          style={{ letterSpacing: '-0.02em' }}
        >
          Fourteen building blocks. Endless APIs.
        </motion.h2>
        <motion.div
          {...fadeUp}
          className="flex gap-3 overflow-x-auto pb-4 lp-section-scroll"
        >
          {NODE_CATALOG.map(({ name, Icon }) => (
            <div
              key={name}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-full hover:border-primary/60 transition-colors"
            >
              <Icon size={14} className="text-primary" />
              <span className="text-[13px] font-medium text-white/80">{name}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Code proof                                                                  */
/* -------------------------------------------------------------------------- */
function CodeProof({
  activeTab,
  setActiveTab,
}: {
  activeTab: keyof typeof TAB_FILES;
  setActiveTab: (t: keyof typeof TAB_FILES) => void;
}) {
  const tabs = Object.keys(TAB_FILES) as Array<keyof typeof TAB_FILES>;
  const bullets = [
    'Routes',
    'Models',
    'Middleware',
    'Validators',
    'Tests (.test.js)',
    '.env.example',
    'package.json with pinned versions',
    'README',
  ];
  return (
    <section className="py-24 border-y border-border">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <motion.div {...fadeUp}>
          <h2
            className="text-[40px] font-semibold tracking-tight mb-5"
            style={{ letterSpacing: '-0.02em' }}
          >
            It's just code. Not a black box.
          </h2>
          <p className="text-[16px] text-white/65 leading-relaxed mb-7">
            Anvaya generates clean, idiomatic Express.js with the structure your team already knows.
            No proprietary runtime. No format lock-in. Eject any time.
          </p>
          <ul className="space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <Check size={18} className="text-primary mt-0.5 shrink-0" />
                <span className="text-[15px] text-white/80">{b}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          {...fadeUp}
          className="bg-surface border border-border rounded-2xl overflow-hidden"
        >
          <div className="flex bg-[#0a0a0f] border-b border-border overflow-x-auto">
            {tabs.map((t) => {
              const active = t === activeTab;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTab(t)}
                  className={`px-4 py-2.5 text-[12px] font-mono whitespace-nowrap border-r border-border transition-colors ${
                    active
                      ? 'bg-surface text-white border-b-2 border-b-primary -mb-px'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
          <pre className="p-5 font-mono text-[12px] leading-[1.6] text-white/85 overflow-x-auto bg-[#0f1218] min-h-[320px]">
            <code>{highlight(TAB_FILES[activeTab])}</code>
          </pre>
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Pricing teaser                                                              */
/* -------------------------------------------------------------------------- */
function PricingTeaser() {
  return (
    <section id="pricing" className="py-24">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        <motion.h2
          {...fadeUp}
          className="text-[40px] font-semibold tracking-tight text-center mb-12"
          style={{ letterSpacing: '-0.02em' }}
        >
          Simple pricing. No surprises.
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* FREE */}
          <motion.div
            {...fadeUp}
            className="bg-surface border border-border rounded-2xl p-8 flex flex-col"
          >
            <div className="text-[14px] uppercase tracking-wider text-white/50 font-semibold mb-2">
              Free
            </div>
            <div className="flex items-baseline gap-2 mb-5">
              <span className="text-[40px] font-semibold">$0</span>
              <span className="text-[14px] text-white/50">/ forever</span>
            </div>
            <ul className="space-y-2.5 text-[14px] text-white/70 mb-8 flex-1">
              <li className="flex items-start gap-2">
                <Check size={16} className="text-primary mt-0.5" /> 10 generations per month
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="text-primary mt-0.5" /> 1 user
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="text-primary mt-0.5" /> Unlimited canvases
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="text-primary mt-0.5" /> Community support
              </li>
            </ul>
            <Link
              to="/signup"
              className="text-center w-full py-3 rounded-xl border border-border text-white font-semibold hover:bg-surface/60 transition-all"
            >
              Start free
            </Link>
          </motion.div>

          {/* PRO */}
          <motion.div {...fadeUp} className="relative">
            <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl animate-pulse pointer-events-none" />
            <div className="relative bg-surface border-2 border-primary rounded-2xl p-8 flex flex-col">
              <div className="text-[14px] uppercase tracking-wider text-primary font-semibold mb-2">
                Pro
              </div>
              <div className="flex items-baseline gap-2 mb-5">
                <span className="text-[40px] font-semibold">$29</span>
                <span className="text-[14px] text-white/50">/ user / month</span>
              </div>
              <ul className="space-y-2.5 text-[14px] text-white/70 mb-8 flex-1">
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-primary mt-0.5" /> 500 generations per month
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-primary mt-0.5" /> Unlimited team members
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-primary mt-0.5" /> Workspaces & roles
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-primary mt-0.5" /> Billing portal
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-primary mt-0.5" /> Priority support
                </li>
              </ul>
              <Link
                to="/pricing"
                className="text-center w-full py-3 rounded-xl bg-primary text-white font-semibold hover:brightness-110 transition-all"
              >
                Start 14-day trial
              </Link>
            </div>
          </motion.div>
        </div>

        <p className="text-center text-[13px] text-white/50 mt-8">
          Enterprise — SSO, audit logs, on-prem available.{' '}
          <a href="/pricing#enterprise" className="text-primary hover:underline">
            Talk to us →
          </a>
        </p>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* FAQ                                                                         */
/* -------------------------------------------------------------------------- */
function FaqSection() {
  return (
    <section className="py-24 border-t border-border">
      <div className="max-w-3xl mx-auto px-6">
        <motion.h2
          {...fadeUp}
          className="text-[40px] font-semibold tracking-tight text-center mb-12"
          style={{ letterSpacing: '-0.02em' }}
        >
          Frequently asked.
        </motion.h2>
        <motion.div {...fadeUp} className="space-y-3">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group bg-surface border border-border rounded-xl overflow-hidden"
            >
              <summary className="cursor-pointer list-none flex items-center justify-between px-5 py-4 text-[15px] font-medium text-white hover:bg-surface/80">
                <span>{item.q}</span>
                <ChevronDown
                  size={18}
                  className="text-white/40 transition-transform group-open:rotate-180"
                />
              </summary>
              <div className="px-5 pb-5 text-[14px] text-white/65 leading-relaxed">{item.a}</div>
            </details>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Final CTA                                                                   */
/* -------------------------------------------------------------------------- */
function FinalCta() {
  return (
    <section className="relative py-28 overflow-hidden bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.15),transparent_60%)]">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(rgba(99,102,241,0.35) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <motion.div {...fadeUp} className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <h2
          className="text-[40px] md:text-[56px] font-semibold leading-tight mb-5"
          style={{ letterSpacing: '-0.02em' }}
        >
          Ship your next API in five minutes.
        </h2>
        <p className="text-[18px] text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
          Anvaya turns your sketch into a running Express server. Try it free, no credit card.
        </p>
        <Link
          to="/signup"
          className="inline-block px-9 py-4 bg-primary text-white font-semibold rounded-xl text-[17px] hover:brightness-110 transition-all"
        >
          Start building
        </Link>
      </motion.div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Footer                                                                      */
/* -------------------------------------------------------------------------- */
function Footer() {
  const cols: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '#product' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Changelog', href: '/docs/changelog' },
        { label: 'Roadmap', href: '/docs' },
        { label: 'Status', href: '/docs' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/docs' },
        { label: 'Contact', href: 'mailto:hello@anvaya.dev' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Docs', href: '/docs' },
        { label: 'API reference', href: '/docs/generated-code' },
        { label: 'Templates', href: '/docs' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Terms', href: '/docs' },
        { label: 'Privacy', href: '/docs' },
        { label: 'Security', href: '/docs' },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-surface/30 py-14">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <NodeGlyph />
              <span className="font-semibold text-[18px] text-white">Anvaya</span>
            </div>
            <p className="text-[13px] text-white/50 max-w-[200px] leading-relaxed">
              Visual engineering for modern backends.
            </p>
          </div>
          {cols.map((col) => (
            <FooterCol key={col.title} title={col.title} links={col.links} />
          ))}
        </div>
        <div className="pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-[13px] text-white/50">© 2026 Anvaya</span>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/karnav018/anvaya"
              aria-label="GitHub"
              className="text-white/50 hover:text-white transition-colors"
            >
              <GithubGlyph />
            </a>
            <a
              href="https://twitter.com"
              aria-label="Twitter / X"
              className="text-white/50 hover:text-white transition-colors"
            >
              <XGlyph />
            </a>
            <a
              href="https://discord.com"
              aria-label="Discord"
              className="text-white/50 hover:text-white transition-colors"
            >
              <MessageCircle size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function GithubGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1-.02-1.96-3.2.69-3.87-1.54-3.87-1.54-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.34.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.19a10.98 10.98 0 0 1 5.78 0c2.2-1.5 3.17-1.19 3.17-1.19.63 1.59.24 2.76.12 3.05.73.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .3.21.67.8.55C20.21 21.38 23.5 17.07 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

function XGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <h4 className="text-[13px] uppercase tracking-wider text-white font-semibold mb-3">{title}</h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            {l.href.startsWith('/') ? (
              <Link
                to={l.href}
                className="text-[13px] text-white/55 hover:text-primary transition-colors"
              >
                {l.label}
              </Link>
            ) : (
              <a
                href={l.href}
                className="text-[13px] text-white/55 hover:text-primary transition-colors"
              >
                {l.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

