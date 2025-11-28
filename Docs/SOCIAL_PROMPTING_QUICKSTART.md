# Social Prompting Engine - Quick Reference

## 🎯 What It Does

Automatically discovers insights from your Twitter, LinkedIn, and other social networks, then:
1. **Fetches** public posts from people you follow
2. **Anonymizes** author information (privacy-first)
3. **Analyzes** content for relevance to your interests
4. **Generates** PKM (Personal Knowledge Management) prompts
5. **Stores** as beautiful "Network Spark" cards in Memora

---

## 🚀 Quick Start (5 Minutes)

### 1. Set Environment Variables

Add to `backend/.env`:
```bash
# Demo mode (works immediately, no API keys needed)
LAMATIC_API_KEY=demo
TWITTER_BEARER_TOKEN=demo
LINKEDIN_ACCESS_TOKEN=demo
```

### 2. Start Backend

```bash
cd backend
uvicorn app.main:app --reload
```

### 3. Start Frontend

```bash
cd frontend
npm run dev
```

### 4. Try It!

1. Navigate to `http://localhost:3000/dashboard/network-sparks`
2. Click **"Inspire Me from Network"**
3. See glowing Network Spark cards appear! ✨

---

## 📁 Files Created

### Backend
```
backend/
├── app/
│   ├── models/social.py              # Data models
│   ├── core/social/
│   │   ├── lamatic_service.py        # Lamatic.ai orchestration
│   │   └── processor.py              # Social signal fetching
│   ├── api/routes/social.py          # API endpoints
│   └── db/qdrant.py                  # Extended for sparks
├── lamatic-social-inspire-flow.json  # Import to Lamatic.ai
└── .env.social.example               # Config template
```

### Frontend
```
frontend/
├── src/
│   ├── components/social/
│   │   ├── network-spark-card.tsx    # Glowing cards
│   │   └── inspire-me-button.tsx     # Trigger button
│   └── app/(dashboard)/
│       └── network-sparks/page.tsx   # Main page
```

### Documentation
```
SOCIAL_PROMPTING_SETUP.md             # Full setup guide
```

---

## 🎨 UI Components

### Network Spark Card
```tsx
<NetworkSparkCard
  id="spark-123"
  title="Network Insight: AI"
  content="Your network is buzzing about AI productivity tools..."
  sourceLabel="Network Node #42"
  platform="twitter"
  relevanceScore={0.87}
  glowIntensity={0.9}
  tags={["AI", "productivity"]}
  prompt="How might this insight apply to your current work?"
  createdAt="2025-11-28T10:00:00Z"
/>
```

### Inspire Me Button
```tsx
<InspireMeButton
  userId={user.id}
  focusAreas={["AI", "productivity", "innovation"]}
  onInspired={(count) => console.log(`${count} sparks!`)}
/>
```

---

## 🔌 API Endpoints

### POST `/api/social/inspire`
Trigger network inspiration flow

**Request:**
```json
{
  "user_id": "user_123",
  "focus_areas": ["AI", "productivity"],
  "max_results": 10,
  "include_prompts": true,
  "privacy_level": "blur_author"
}
```

**Response:**
```json
{
  "sparks": [...],
  "total_found": 8,
  "generated_prompts": ["..."],
  "network_heuristics": ["🔥 Your network is discussing: AI, productivity"],
  "timestamp": "2025-11-28T10:00:00Z"
}
```

### GET `/api/social/sparks`
Retrieve stored network sparks

**Query Params:**
- `user_id`: User identifier (required)
- `limit`: Max results (default: 20)
- `min_relevance`: Filter threshold (default: 0.5)

---

## 🔐 Privacy Features

✅ **What We Store:**
- Distilled content summaries (no PII)
- Anonymized author IDs (SHA-256 hash)
- Vector embeddings only
- Topic tags and metadata

❌ **What We Never Store:**
- Raw social posts
- Real author names/handles
- Direct post URLs
- Personal identifiable information

**Privacy Levels:**
- `FULL_ANONYMIZE`: Complete anonymization
- `BLUR_AUTHOR`: Hash author handles (default)
- `MINIMAL`: Keep sources (requires consent)

---

## 🧪 Demo Data

When using `demo` mode, you get pre-defined inspiring posts like:

> "Just learned a game-changing negotiation tip: Always anchor high, but with a justified rationale..."
> 
> — Network Node #247 (Twitter) • 87% relevance

> "AI productivity hack: I use vector embeddings to resurface past meeting notes..."
> 
> — Network Node #142 (Twitter) • 92% relevance

---

## 🎭 Features Showcase

### Glowing Cards
Cards glow based on relevance:
- **Purple glow** (80%+): Highly relevant insights
- **Blue glow** (60-80%): Medium relevance
- **Green glow** (<60%): Lower relevance

### Animations
- Pulse effect on hover
- Smooth card transitions
- Animated background gradients
- Loading spinners

### Smart Filtering
- Time window (last 24h, 7d, 30d)
- Topic matching
- Engagement scoring
- Relevance thresholds

---

## 📊 Lamatic Flow

The `lamatic-social-inspire-flow.json` orchestrates:

1. **Filter** signals by time + topics
2. **Anonymize** author information
3. **Embed** using Gemini text-embedding-004
4. **Match** against user's Qdrant memories
5. **Score** relevance (weighted)
6. **Distill** content summaries
7. **Extract** topic tags
8. **Generate** PKM prompts
9. **Create** NetworkSpark objects
10. **Rank** and return top results

Import to Lamatic dashboard or use local processing.

---

## 🛠️ Customization

### Change Focus Areas
```tsx
<InspireMeButton
  focusAreas={["design", "leadership", "startups"]}
/>
```

### Adjust Relevance Threshold
```typescript
const sparks = await fetch('/api/social/sparks?min_relevance=0.7')
```

### Custom Privacy Level
```json
{
  "privacy_level": "full_anonymize"
}
```

---

## 🐛 Common Issues

**No sparks appearing?**
- Check API keys are set (or use `demo` mode)
- Verify focus_areas match network content
- Lower min_relevance threshold

**Lamatic errors?**
- Falls back to local processing automatically
- Check API key validity
- Verify flow is deployed

**UI not loading?**
- Check backend is running on `:8000`
- Verify CORS settings in config
- Check browser console for errors

---

## 📈 Next Steps

1. **Get Real API Keys**
   - Twitter: https://developer.twitter.com
   - LinkedIn: https://www.linkedin.com/developers
   - Lamatic: https://lamatic.ai

2. **Deploy Lamatic Flow**
   - Import JSON to dashboard
   - Configure secrets
   - Test and deploy

3. **Customize UI**
   - Adjust glow colors
   - Add more animations
   - Create detail modals

4. **Extend Platforms**
   - Add Mastodon support
   - Integrate Reddit
   - Pull from RSS feeds

---

**🎉 You're all set! Start discovering network insights with the Social Prompting Engine.**

For full documentation, see `SOCIAL_PROMPTING_SETUP.md`
