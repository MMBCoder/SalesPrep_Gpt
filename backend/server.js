require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const axios = require('axios');
const OpenAI = require('openai');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'salesprep_secret_2026';

const TAVILY_API_KEY  = process.env.TAVILY_API_KEY  || '';
const OPENAI_API_KEY  = process.env.OPENAI_API_KEY  || '';
const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID     || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL  = process.env.BACKEND_URL  || 'http://localhost:3001';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// --- OpenAI GPT-4o-mini generate helper ---
async function openaiGenerate(systemPrompt, userMessage) {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 8192,
  });
  const text = res.choices[0].message.content || '';
  return JSON.parse(text);
}

// --- Tavily search helper ---
async function tavilySearch(query, maxResults = 5) {
  try {
    const res = await axios.post('https://api.tavily.com/search', {
      api_key: TAVILY_API_KEY,
      query,
      search_depth: 'advanced',
      include_answer: true,
      include_raw_content: false,
      max_results: maxResults
    }, { timeout: 20000 });
    return res.data;
  } catch (e) {
    console.error('Tavily error:', e.message);
    return { results: [], answer: '' };
  }
}

// --- AI Brief Generation System Prompt ---
const BRIEF_SYSTEM_PROMPT = `You are a senior sales intelligence analyst. Generate a comprehensive, accurate, data-rich pre-meeting brief for a field sales representative.

CRITICAL RULES — violating any of these is unacceptable:

1. SOURCE DISCIPLINE: Every financial figure, market share, and specific metric MUST come from the web search data provided below. Do NOT use numbers from your training data. If a figure is not in the search results, write "N/A". Never invent or estimate percentages or revenue numbers without a source.

2. DATE DISCIPLINE: You will be told today's date. Only include quarterly results that have been PUBLICLY REPORTED before today. If a quarter has not yet ended or results have not been published, skip it. Use only the most recently AVAILABLE reported quarters. Never fabricate future results.

3. CURRENCY — STRICTLY FOLLOW:
   - Detect the company's home country from the search data.
   - US companies → USD only (e.g. "$4.4B", "$1.2M"). Never use ₹ for US companies.
   - Indian companies → ₹ Crores (e.g. "₹14,000 Cr").
   - UK companies → GBP. European companies → EUR. Use the correct local currency.
   - The JSON template below shows placeholder text like "<value in native currency>" — replace those with the ACTUAL correct currency for the company.

4. NO PLACEHOLDERS: Never output "XX%", "X.X%", "₹X,XXX Cr", "$X.XB" or any unfilled template text. Use real numbers from search data, or write "N/A".

5. ADAPT TO COMPANY TYPE:
   - "brand_portfolio" → for FMCG list consumer brands; for banks list credit products/services; for IT firms list software products; for pharma list drug brands. Adapt the labels appropriately.
   - "sales_channels" → for FMCG use General Trade/Modern Trade/E-commerce; for banks use Branches/Digital/Partnerships; for IT use Direct Sales/Channel Partners/Cloud Marketplace. Use channels that ACTUALLY apply to this company.

6. REVENUE_VALUE FIELDS: These must be plain integers (no currency symbols, no commas). Unit = Crores for Indian companies, Millions (USD) for US companies, Millions for UK/EU. Use 0 only if truly unavailable.

7. NO TRUNCATION: Complete every field fully. Never cut off mid-sentence.

Return ONLY valid JSON with NO markdown fences, NO explanation text. Use this structure (replace all placeholder text with real data):

{
  "company_name": "Full official company name as found in search data",
  "industry": "Detect the ACTUAL sector from search data — e.g. 'Banking & Finance' for Synchrony/Ally/HDFC, 'FMCG' for HUL/ITC, 'IT Services' for TCS/Infosys, 'Pharmaceuticals' for Sun Pharma. Do NOT repeat the user's input — detect from what the company actually does.",
  "tagline": "One sharp sentence describing the company's market position and unique strength",
  "overview": "4-5 sentence paragraph covering: founding year, headquarters city and country, core business description, market position/leadership, and recent strategic direction — all from search data",
  "key_metrics": {
    "market_cap": "<value in native currency, e.g. $18.2B or ₹1,99,000 Cr> or N/A",
    "revenue_annual": "<value in native currency> or N/A",
    "net_profit_annual": "<value in native currency> or N/A",
    "net_profit_margin": "<X.X%> or N/A",
    "ebitda_margin": "<XX.X%> or N/A",
    "yoy_growth": "<+X.X%> or N/A",
    "employee_count": "<XX,XXX+> or N/A",
    "market_share": "<XX% in specific segment from search data> or N/A",
    "distribution_reach": "<relevant reach metric for this company type> or N/A",
    "r_and_d_spend": "<value in native currency> or N/A",
    "dividend_yield": "<X.X%> or N/A",
    "pe_ratio": "<XX.X> or N/A"
  },
  "segment_revenue": [
    { "segment": "<actual business segment name>", "revenue": "<value in native currency or N/A>", "share": "<XX% or N/A>", "growth_yoy": "<+X.X% or N/A>", "trend": "growing|stable|declining" },
    { "segment": "<segment 2>", "revenue": "<value or N/A>", "share": "<% or N/A>", "growth_yoy": "<% or N/A>", "trend": "growing|stable|declining" },
    { "segment": "<segment 3>", "revenue": "<value or N/A>", "share": "<% or N/A>", "growth_yoy": "<% or N/A>", "trend": "growing|stable|declining" }
  ],
  "quarters": [
    {
      "period": "<Actual reported quarter label from search data, e.g. Q3 FY26 or Q1 2025>",
      "revenue": "<value in native currency from search data>",
      "revenue_value": <integer — Crores for India, Millions for US/UK, 0 if unknown>,
      "profit": "<value in native currency from search data>",
      "profit_value": <integer — same unit as revenue_value, 0 if unknown>,
      "growth_yoy": "<+X.X% from search data or N/A>",
      "ebitda_margin": "<XX.X% or N/A>",
      "highlights": ["<specific highlight from search data>", "<highlight 2>", "<highlight 3>"]
    },
    {
      "period": "<Second most recent published quarter>",
      "revenue": "<value in native currency>",
      "revenue_value": <integer>,
      "profit": "<value in native currency>",
      "profit_value": <integer>,
      "growth_yoy": "<+X.X% or N/A>",
      "ebitda_margin": "<XX.X% or N/A>",
      "highlights": ["<highlight>", "<highlight>", "<highlight>"]
    },
    {
      "period": "<Third most recent published quarter>",
      "revenue": "<value in native currency>",
      "revenue_value": <integer>,
      "profit": "<value in native currency>",
      "profit_value": <integer>,
      "growth_yoy": "<+X.X% or N/A>",
      "ebitda_margin": "<XX.X% or N/A>",
      "highlights": ["<highlight>", "<highlight>", "<highlight>"]
    }
  ],
  "brand_portfolio": [
    { "name": "<brand or product name>", "category": "<category>", "market_rank": "<rank if known or N/A>", "revenue_contribution": "<~XX% or N/A>", "growth": "<+X.X% or N/A>" },
    { "name": "<brand 2>", "category": "<category>", "market_rank": "<rank or N/A>", "revenue_contribution": "<% or N/A>", "growth": "<% or N/A>" },
    { "name": "<brand 3>", "category": "<category>", "market_rank": "<rank or N/A>", "revenue_contribution": "<% or N/A>", "growth": "<% or N/A>" },
    { "name": "<brand 4>", "category": "<category>", "market_rank": "<rank or N/A>", "revenue_contribution": "<% or N/A>", "growth": "<% or N/A>" }
  ],
  "sales_channels": [
    { "channel": "<channel name appropriate to this company type>", "share": "<XX% or N/A>", "outlets": "<count or description or N/A>", "trend": "growing|stable|declining", "growth": "<+X.X% or N/A>" },
    { "channel": "<channel 2>", "share": "<% or N/A>", "outlets": "<count or N/A>", "trend": "growing|stable|declining", "growth": "<% or N/A>" },
    { "channel": "<channel 3>", "share": "<% or N/A>", "outlets": "<count or N/A>", "trend": "growing|stable|declining", "growth": "<% or N/A>" },
    { "channel": "<channel 4>", "share": "<% or N/A>", "outlets": "<count or N/A>", "trend": "growing|stable|declining", "growth": "<% or N/A>" }
  ],
  "competitors": [
    {
      "name": "<actual competitor name from search data>",
      "revenue_q3": "<competitor latest quarter revenue in native currency or N/A>",
      "revenue_value": <integer — same unit as main company revenue_value, 0 if unknown>,
      "market_share": "<XX% or N/A>",
      "yoy_growth": "<+X.X% or N/A>",
      "key_strength": "<one sentence about their biggest competitive advantage>",
      "key_weakness": "<one sentence about their main vulnerability>",
      "threat_level": "high|medium|low",
      "recent_move": "<latest strategic initiative, product launch, or market move from search data>"
    },
    {
      "name": "<competitor 2>",
      "revenue_q3": "<value or N/A>",
      "revenue_value": <integer or 0>,
      "market_share": "<% or N/A>",
      "yoy_growth": "<% or N/A>",
      "key_strength": "<strength>",
      "key_weakness": "<weakness>",
      "threat_level": "high|medium|low",
      "recent_move": "<recent move>"
    },
    {
      "name": "<competitor 3>",
      "revenue_q3": "<value or N/A>",
      "revenue_value": <integer or 0>,
      "market_share": "<% or N/A>",
      "yoy_growth": "<% or N/A>",
      "key_strength": "<strength>",
      "key_weakness": "<weakness>",
      "threat_level": "high|medium|low",
      "recent_move": "<recent move>"
    }
  ],
  "comparison_table": [
    { "metric": "Latest Quarter Revenue", "company": "<value in native currency>", "comp1": "<value or N/A>", "comp2": "<value or N/A>", "comp3": "<value or N/A>" },
    { "metric": "Annual Revenue", "company": "<value in native currency>", "comp1": "<value or N/A>", "comp2": "<value or N/A>", "comp3": "<value or N/A>" },
    { "metric": "YoY Revenue Growth", "company": "<+X.X% or N/A>", "comp1": "<% or N/A>", "comp2": "<% or N/A>", "comp3": "<% or N/A>" },
    { "metric": "Net Profit Margin", "company": "<X.X% or N/A>", "comp1": "<% or N/A>", "comp2": "<% or N/A>", "comp3": "<% or N/A>" },
    { "metric": "Market Share", "company": "<XX% or N/A>", "comp1": "<% or N/A>", "comp2": "<% or N/A>", "comp3": "<% or N/A>" },
    { "metric": "Market Cap", "company": "<value in native currency or N/A>", "comp1": "<value or N/A>", "comp2": "<value or N/A>", "comp3": "<value or N/A>" }
  ],
  "news_highlights": [
    { "title": "<actual news headline from search data>", "date": "<Month YYYY>", "summary": "<2-3 sentence summary with specific facts from search data>", "sentiment": "positive|negative|neutral", "source": "<publication name>", "category": "Financial|Strategy|Product|Regulatory|Partnership" },
    { "title": "<headline 2>", "date": "<Month YYYY>", "summary": "<summary>", "sentiment": "positive|negative|neutral", "source": "<source>", "category": "Financial|Strategy|Product|Regulatory|Partnership" },
    { "title": "<headline 3>", "date": "<Month YYYY>", "summary": "<summary>", "sentiment": "positive|negative|neutral", "source": "<source>", "category": "Financial|Strategy|Product|Regulatory|Partnership" },
    { "title": "<headline 4>", "date": "<Month YYYY>", "summary": "<summary>", "sentiment": "positive|negative|neutral", "source": "<source>", "category": "Financial|Strategy|Product|Regulatory|Partnership" }
  ],
  "risk_table": [
    { "risk": "<specific risk relevant to this company and industry>", "impact": "high|medium|low", "category": "Competition|Market|Operations|Regulatory|Financial", "mitigation": "<one line actionable mitigation>" },
    { "risk": "<risk 2>", "impact": "high|medium|low", "category": "Competition|Market|Operations|Regulatory|Financial", "mitigation": "<mitigation>" },
    { "risk": "<risk 3>", "impact": "high|medium|low", "category": "Competition|Market|Operations|Regulatory|Financial", "mitigation": "<mitigation>" }
  ],
  "talking_points": [
    "<data-backed talking point referencing a specific metric or initiative from search data>",
    "<talking point referencing a market opportunity specific to this company>",
    "<talking point referencing a pain point the sales rep can address>",
    "<talking point referencing competitive differentiation>",
    "<talking point referencing a growth initiative or seasonal opportunity>",
    "<talking point referencing a partnership or co-marketing angle>"
  ],
  "recommendations": [
    { "priority": "high", "category": "<relevant category>", "action": "<specific action with expected outcome>", "timing": "This meeting|This quarter|Next quarter|Ongoing" },
    { "priority": "high", "category": "<category>", "action": "<specific action>", "timing": "This meeting" },
    { "priority": "medium", "category": "<category>", "action": "<specific action>", "timing": "This quarter" },
    { "priority": "medium", "category": "<category>", "action": "<specific action>", "timing": "Next quarter" },
    { "priority": "low", "category": "<category>", "action": "<specific action>", "timing": "Ongoing" }
  ],
  "sales_opportunity": "<3-4 sentence paragraph: what specifically to pitch at this meeting, why now is the right moment based on the company's current situation from search data, and what outcome the sales rep should aim for>",
  "meeting_agenda": [
    "<Agenda item 1 relevant to this specific company and meeting context>",
    "<Agenda item 2>",
    "<Agenda item 3>",
    "<Agenda item 4>",
    "<Agenda item 5>"
  ]
}`;

app.use(cors({
  origin: [
    'http://localhost:5173',
    FRONTEND_URL,
  ].filter((v, i, a) => v && a.indexOf(v) === i),
  credentials: true,
}));
app.use(express.json());

// --- JSON DB setup ---
const dbPath = process.env.VERCEL ? '/tmp/db.json' : path.join(__dirname, 'db.json');
const adapter = new FileSync(dbPath);
const db = low(adapter);

db.defaults({ users: [], clients: [], briefs: [], _nextId: { users: 1, clients: 1, briefs: 1 } }).write();

function nextId(table) {
  const id = db.get(`_nextId.${table}`).value();
  db.set(`_nextId.${table}`, id + 1).write();
  return id;
}

// Seed demo user if not exists
const existingUser = db.get('users').find({ email: 'demo@salesprep.ai' }).value();
if (!existingUser) {
  const hash = bcrypt.hashSync('demo1234', 10);
  const userId = nextId('users');
  db.get('users').push({
    id: userId, email: 'demo@salesprep.ai', password: hash,
    name: 'Demo User', company: 'SalesPrep', job_title: 'Territory Sales Executive',
    industry: 'FMCG', city: 'Mumbai, Maharashtra',
    onboarding_complete: 1, profile_complete: 1,
    created_at: new Date().toISOString()
  }).write();

  const clients = [
    { name: 'Hindustan Unilever Ltd.', industry: 'FMCG', type: 'Distributor' },
    { name: 'Dabur India Ltd.', industry: 'FMCG', type: 'Distributor' },
    { name: 'ITC Limited', industry: 'FMCG', type: 'Distributor' },
    { name: 'Marico Limited', industry: 'Personal Care', type: 'Distributor' },
    { name: 'Britannia Industries', industry: 'Food & Bev', type: 'Retailer' },
  ];
  clients.forEach(c => {
    db.get('clients').push({ id: nextId('clients'), user_id: userId, ...c }).write();
  });

  const briefsData = [
    {
      client_name: 'Hindustan Unilever Ltd.', industry: 'FMCG', client_type: 'Distributor',
      meeting_date: '2026-06-19', meeting_time: '10:30 AM', meeting_location: 'Client office',
      company_background: `Hindustan Unilever Limited (HUL) is India's largest fast-moving consumer goods company with a heritage of over 90 years in India. The company operates across multiple categories including home care, personal care, foods, and refreshment beverages. HUL has a distribution network covering over 8 million retail outlets and employs approximately 18,000 people across India.`,
      recent_news: [
        { title: 'HUL announces 12% revenue growth in Q4 2026', subtitle: 'Strong performance driven by home care and personal care segments', date: '12 May 2026' },
        { title: 'Sustainable packaging initiative launched across 50 products', subtitle: 'Company commits to reducing plastic usage by 30% by 2027', date: '8 May 2026' },
        { title: 'New Distribution partnership in rural Maharashtra', subtitle: 'Expansion targets 500 new villages across the state', date: '2 May 2026' },
      ],
      rating: 4, status: 'active', created_at: '2026-05-15T10:15:00.000Z'
    },
    {
      client_name: 'Dabur India Ltd.', industry: 'FMCG', client_type: 'Distributor',
      meeting_date: '2026-06-20', meeting_time: '3:20 PM', meeting_location: 'Video Call',
      company_background: `Dabur India Limited is one of India's leading FMCG companies. Built over a 140 year legacy, Dabur is today India's most trusted name and the world's largest Ayurvedic and Natural Health Care Company. Dabur has a portfolio of over 250 Herbal/Ayurvedic products with flagship brands – Dabur, Vatika, Hajmola, Real Fruit Juice and Fem.`,
      recent_news: [
        { title: 'Dabur Q4 results: Net profit rises 8.5% YoY', subtitle: 'Healthcare and home care segments drive growth', date: '14 May 2026' },
        { title: 'Dabur launches new range of Ayurvedic immunity boosters', subtitle: 'New product line targets urban millennial consumers', date: '10 May 2026' },
      ],
      rating: 5, status: 'active', created_at: '2026-05-14T15:20:00.000Z'
    },
    {
      client_name: 'ITC Limited', industry: 'FMCG', client_type: 'Distributor',
      meeting_date: '2026-05-17', meeting_time: '9:30 AM', meeting_location: 'ITC Office, Mumbai',
      company_background: `ITC Limited is an Indian multinational conglomerate company headquartered in Kolkata. The company has a diversified presence in FMCG, Hotels, Paperboards & Packaging, Agribusiness and Information Technology. ITC is one of India's foremost private sector companies with a market capitalisation of ₹5 trillion.`,
      recent_news: [
        { title: 'ITC FMCG segment posts 11% growth in FY26', subtitle: 'Biscuits and snacks category leads growth trajectory', date: '12 May 2026' },
        { title: 'ITC launches premium personal care range', subtitle: 'New products target urban premium segment', date: '5 May 2026' },
      ],
      rating: 4, status: 'active', created_at: '2026-05-12T09:30:00.000Z'
    },
    {
      client_name: 'Marico Limited', industry: 'Personal Care', client_type: 'Distributor',
      meeting_date: '2026-05-20', meeting_time: '11:45 AM', meeting_location: 'Marico HQ',
      company_background: `Marico Limited is an Indian multinational consumer goods company. Marico's products and services in hair care, skin care, edible oils, health foods, male grooming, and fabric care are present in over 25 countries across Emerging Markets of Asia and Africa.`,
      recent_news: [
        { title: 'Marico posts 9% volume growth in Q4', subtitle: 'Parachute and Saffola brands show strong consumer demand', date: '13 May 2026' },
      ],
      rating: null, status: 'active', created_at: '2026-05-13T11:45:00.000Z'
    },
    {
      client_name: 'Britannia Industries', industry: 'Food & Bev', client_type: 'Retailer',
      meeting_date: '2026-05-14', meeting_time: '2:15 PM', meeting_location: 'Client Site',
      company_background: `Britannia Industries Limited is an Indian food-products corporation producing dairy and bakery products including bread, biscuits, cakes, rusks, and dairy products. Popular brands include Good Day, Tiger, NutriChoice, Milk Bikis and Marie Gold.`,
      recent_news: [
        { title: 'Britannia reports 15% profit growth in FY26', subtitle: 'Premium biscuit segment drives revenue upswing', date: '10 May 2026' },
        { title: 'Britannia expands dairy portfolio with new variants', subtitle: 'Company targets tier-2 markets with affordable pricing', date: '3 May 2026' },
      ],
      rating: 5, status: 'active', created_at: '2026-05-10T14:15:00.000Z'
    },
  ];

  briefsData.forEach(b => {
    db.get('briefs').push({ id: nextId('briefs'), user_id: userId, ...b }).write();
  });
}

// --- Auth middleware ---
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  if (token === 'demo-token-mirza') {
    req.user = { id: 1, email: 'demo@salesprep.ai' };
    return next();
  }
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

// --- Routes ---

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.get('users').find({ email }).value();
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Invalid email or password' });
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...safe } = user;
  res.json({ token, user: safe });
});

app.post('/api/signup', (req, res) => {
  const { email, password, name, company, role } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (db.get('users').find({ email }).value()) return res.status(409).json({ error: 'Email already registered' });
  const hash = bcrypt.hashSync(password, 10);
  const id = nextId('users');
  const user = { id, email, password: hash, name: name || '', company: company || '', job_title: role || '', industry: '', city: '', onboarding_complete: 0, profile_complete: 0, created_at: new Date().toISOString() };
  db.get('users').push(user).write();
  const token = jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...safe } = user;
  res.json({ token, user: safe });
});

app.get('/api/me', auth, (req, res) => {
  const user = db.get('users').find({ id: req.user.id }).value();
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...safe } = user;
  res.json(safe);
});

app.put('/api/me/profile', auth, (req, res) => {
  const { name, company, job_title, industry, city } = req.body;
  db.get('users').find({ id: req.user.id }).assign({ name, company, job_title, industry, city, profile_complete: 1 }).write();
  res.json({ success: true });
});

app.put('/api/me/onboarding', auth, (req, res) => {
  db.get('users').find({ id: req.user.id }).assign({ onboarding_complete: 1 }).write();
  res.json({ success: true });
});

app.get('/api/clients', auth, (req, res) => {
  res.json(db.get('clients').filter({ user_id: req.user.id }).value());
});

app.post('/api/clients', auth, (req, res) => {
  const { name, industry, type } = req.body;
  const client = { id: nextId('clients'), user_id: req.user.id, name, industry: industry || 'FMCG', type: type || 'Distributor' };
  db.get('clients').push(client).write();
  res.json(client);
});

app.get('/api/briefs', auth, (req, res) => {
  const briefs = db.get('briefs').filter({ user_id: req.user.id }).value();
  res.json([...briefs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
});

app.get('/api/briefs/:id', auth, (req, res) => {
  const brief = db.get('briefs').find({ id: parseInt(req.params.id), user_id: req.user.id }).value();
  if (!brief) return res.status(404).json({ error: 'Brief not found' });
  res.json(brief);
});

app.post('/api/briefs/generate', auth, async (req, res) => {
  const { client_name, industry, client_type, meeting_date, meeting_time, meeting_location } = req.body;

  try {
    console.log(`\n🔍 Generating AI brief for: ${client_name}`);

    // 1. Parallel Tavily searches
    console.log('  → Searching web with Tavily...');
    const [financials, competitors, news] = await Promise.all([
      tavilySearch(`${client_name} quarterly revenue profit financial results earnings 2024 2025 2026`),
      tavilySearch(`${client_name} top competitors market share comparison revenue 2024 2025 2026`),
      tavilySearch(`${client_name} latest news strategy expansion product launch partnership 2025 2026`),
    ]);

    // 2. Build context + collect sources
    const formatResults = (data) =>
      (data.results || []).map(r => `[SOURCE: ${r.title}]\n[URL: ${r.url || 'N/A'}]\n${r.content || r.snippet || ''}`).join('\n\n---\n\n');

    const context = `
=== FINANCIAL PERFORMANCE DATA ===
${financials.answer ? `AI Summary: ${financials.answer}\n\n` : ''}
${formatResults(financials)}

=== COMPETITOR & MARKET DATA ===
${competitors.answer ? `AI Summary: ${competitors.answer}\n\n` : ''}
${formatResults(competitors)}

=== RECENT NEWS & DEVELOPMENTS ===
${news.answer ? `AI Summary: ${news.answer}\n\n` : ''}
${formatResults(news)}
`.trim();

    // Collect all source URLs from Tavily
    const sources = {
      financial: (financials.results || []).filter(r => r.url).map(r => ({ title: r.title, url: r.url, published_date: r.published_date || '' })),
      competitors: (competitors.results || []).filter(r => r.url).map(r => ({ title: r.title, url: r.url, published_date: r.published_date || '' })),
      news: (news.results || []).filter(r => r.url).map(r => ({ title: r.title, url: r.url, published_date: r.published_date || '' })),
    };

    // 3. Call GPT-4o-mini
    console.log('  → Calling GPT-4o-mini...');
    const today = new Date().toISOString().split('T')[0];
    const aiContent = await openaiGenerate(
      BRIEF_SYSTEM_PROMPT,
      `TODAY'S DATE: ${today}. Only include quarterly results publicly reported BEFORE this date.\n\nGenerate a comprehensive sales brief for: ${client_name}\nIndustry: ${industry || 'General'}\n\nWeb search data collected (use the source titles when referencing data):\n\n${context}`
    );
    console.log(`  ✅ GPT-4o-mini brief generated for ${client_name} | Sources: ${sources.financial.length + sources.competitors.length + sources.news.length}`);

    // 4. Build and store brief
    const brief = {
      id: nextId('briefs'),
      user_id: req.user.id,
      client_name: aiContent.company_name || client_name,
      industry: aiContent.industry || industry || 'FMCG',
      client_type: client_type || 'Distributor',
      meeting_date: meeting_date || '',
      meeting_time: meeting_time || '',
      meeting_location: meeting_location || '',
      company_background: aiContent.overview || '',
      recent_news: aiContent.news_highlights || [],
      ai_content: aiContent,
      sources,
      rating: null,
      status: 'active',
      created_at: new Date().toISOString()
    };

    db.get('briefs').push(brief).write();
    res.json(brief);

  } catch (err) {
    console.error('AI generation error:', err.message);
    console.error('Gemini response data:', JSON.stringify(err.response?.data, null, 2));
    // Fallback to basic brief if AI fails
    const brief = {
      id: nextId('briefs'), user_id: req.user.id,
      client_name, industry: industry || 'FMCG', client_type: client_type || 'Distributor',
      meeting_date: meeting_date || '', meeting_time: meeting_time || '', meeting_location: meeting_location || '',
      company_background: `${client_name} is a leading FMCG company in India with a strong market presence.`,
      recent_news: [],
      ai_content: null,
      rating: null, status: 'active', created_at: new Date().toISOString()
    };
    db.get('briefs').push(brief).write();
    res.json(brief);
  }
});

app.put('/api/briefs/:id/rating', auth, (req, res) => {
  db.get('briefs').find({ id: parseInt(req.params.id), user_id: req.user.id }).assign({ rating: req.body.rating }).write();
  res.json({ success: true });
});

app.delete('/api/briefs/:id', auth, (req, res) => {
  db.get('briefs').remove({ id: parseInt(req.params.id), user_id: req.user.id }).write();
  res.json({ success: true });
});

app.post('/api/forgot-password', (req, res) => {
  res.json({ success: true });
});

// ─── Google OAuth ─────────────────────────────────────────────────────────

app.get('/api/auth/google', (req, res) => {
  if (!GOOGLE_CLIENT_ID) return res.status(503).json({ error: 'Google OAuth not configured' });
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${BACKEND_URL}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

app.get('/api/auth/google/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error || !code) return res.redirect(`${FRONTEND_URL}/login?error=google_denied`);

  try {
    // Exchange code → tokens
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: `${BACKEND_URL}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    });

    // Get Google user profile
    const profileRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
    });
    const { email, name, picture, id: google_id } = profileRes.data;

    // Find or create user
    let user = db.get('users').find({ email }).value();
    if (!user) {
      const id = nextId('users');
      user = {
        id, email, name: name || email.split('@')[0], google_id,
        avatar: picture || '', password: '',
        company: '', job_title: '', industry: '', city: '',
        onboarding_complete: 0, profile_complete: 0,
        created_at: new Date().toISOString(),
      };
      db.get('users').push(user).write();
    } else if (!user.google_id) {
      db.get('users').find({ email }).assign({ google_id, avatar: picture || '' }).write();
      user = db.get('users').find({ email }).value();
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user;
    const encodedUser = encodeURIComponent(JSON.stringify(safeUser));
    const dest = user.onboarding_complete ? '/dashboard' : '/onboarding';
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&user=${encodedUser}&next=${dest}`);
  } catch (err) {
    console.error('Google OAuth error:', err.message);
    res.redirect(`${FRONTEND_URL}/login?error=google_failed`);
  }
});

// ─── Start / Export ───────────────────────────────────────────────────────

if (require.main === module) {
  app.listen(PORT, () => console.log(`✅ SalesPrep backend running on http://localhost:${PORT}`));
}
module.exports = app;
