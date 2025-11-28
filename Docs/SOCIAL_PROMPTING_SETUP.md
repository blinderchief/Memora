# Social Prompting Engine - Setup Guide

## 🚀 Feature Overview

The Social Prompting Engine enables "network osmosis" - automatically discovering insights from your social graph and transforming them into actionable knowledge sparks.

**Key Features:**
- 🔐 **Privacy-First**: Only stores anonymized vectors, never raw posts
- 🤖 **AI-Orchestrated**: Powered by Lamatic.ai for complex multi-step workflows
- ✨ **Beautiful UI**: Glowing Network Spark cards with animations
- 🔍 **Hybrid Search**: Semantic + keyword matching for relevance
- 💡 **PKM Prompts**: Auto-generated reflection questions

---

## 📋 Setup Instructions

### 1. Backend Configuration

#### a) Environment Variables

Copy the example file:
```bash
cp backend/.env.social.example backend/.env.social
```

Add to your main `.env`:
```bash
# Lamatic.ai
LAMATIC_API_KEY=your_lamatic_api_key_here

# Social Platform APIs
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
LINKEDIN_ACCESS_TOKEN=your_linkedin_token
```

**Getting API Keys:**

**Lamatic.ai:**
1. Sign up at https://lamatic.ai
2. Go to Dashboard → API Keys
3. Create new key
4. Copy to `LAMATIC_API_KEY`

**Twitter/X API v2:**
1. Create app at https://developer.twitter.com/en/portal/dashboard
2. Enable OAuth 2.0
3. Copy Bearer Token to `TWITTER_BEARER_TOKEN`

**LinkedIn API:**
1. Create app at https://www.linkedin.com/developers/apps
2. Request OAuth 2.0 access
3. Generate access token
4. Copy to `LINKEDIN_ACCESS_TOKEN`

#### b) Lamatic Flow Setup

1. Open https://lamatic.ai/dashboard/flows
2. Click "Import Flow"
3. Copy content from `backend/lamatic-social-inspire-flow.json`
4. Paste into Lamatic dashboard
5. Configure secrets:
   - `GEMINI_API_KEY`: Your Google AI key
   - `QDRANT_URL`: Your Qdrant instance
   - `QDRANT_API_KEY`: Your Qdrant key (if needed)
6. Test the flow with sample data
7. Deploy to production
8. Copy webhook URL and update config if needed

#### c) Install Dependencies

```bash
cd backend
pip install httpx  # For Lamatic API calls
```

---

### 2. Frontend Integration

#### a) Add to Dashboard Navigation

Edit `frontend/src/app/(dashboard)/layout.tsx`:

```tsx
// Add to navigation items
{
  title: "Network Sparks",
  href: "/dashboard/network-sparks",
  icon: Sparkles,
  badge: "New",
}
```

#### b) Add Inspire Button to Dashboard

Edit `frontend/src/app/(dashboard)/dashboard/page.tsx`:

```tsx
import { InspireMeButton } from "@/components/social/inspire-me-button";
import { useUser } from "@clerk/nextjs";

// In component:
const { user } = useUser();

// Add to UI:
{user && (
  <InspireMeButton
    userId={user.id}
    focusAreas={["AI", "productivity", "innovation"]}
    onInspired={(count) => console.log(`${count} sparks generated!`)}
  />
)}
```

---

### 3. Privacy Configuration

The system is privacy-first by default:

**Privacy Levels:**
- `FULL_ANONYMIZE`: Complete anonymization, no identifiable info
- `BLUR_AUTHOR`: Anonymize author handles (default)
- `MINIMAL`: Keep source with explicit user consent

**What We Store:**
✅ Distilled content summaries
✅ Anonymized author IDs (hashed)
✅ Vector embeddings
✅ Topic tags

❌ Raw social posts
❌ Real author handles
❌ Direct post URLs
❌ Personal data

---

## 🎨 Usage

### API Endpoints

**Inspire Me:**
```bash
POST /api/social/inspire
{
  "user_id": "user_123",
  "focus_areas": ["AI", "productivity"],
  "max_results": 10,
  "include_prompts": true,
  "privacy_level": "blur_author"
}
```

**Get Network Sparks:**
```bash
GET /api/social/sparks?user_id=user_123&limit=20&min_relevance=0.5
```

**Delete Spark:**
```bash
DELETE /api/social/sparks/{spark_id}?user_id=user_123
```

---

### Frontend Components

**Network Sparks Page:**
- Navigate to `/dashboard/network-sparks`
- Click "Inspire Me from Network"
- View glowing spark cards
- Click cards for details

**Inspire Me Button:**
```tsx
<InspireMeButton
  userId={userId}
  focusAreas={["AI", "productivity"]}
  onInspired={(count) => handleNewSparks(count)}
/>
```

**Network Spark Cards:**
```tsx
<NetworkSparksGrid
  sparks={sparks}
  onSparkView={(id) => viewSparkDetail(id)}
/>
```

---

## 🔧 Development Mode

For development without API keys, use demo mode:

```bash
# In .env
LAMATIC_API_KEY=demo
TWITTER_BEARER_TOKEN=demo
LINKEDIN_ACCESS_TOKEN=demo
```

This uses:
- Local flow processing (no Lamatic calls)
- Demo social signals (pre-defined inspiring posts)
- All features work with synthetic data

---

## 🧪 Testing

### Test the Backend

```bash
cd backend
python -m pytest tests/test_social_prompting.py
```

### Test API Endpoints

```bash
# Inspire Me
curl -X POST http://localhost:8000/api/social/inspire \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test_user","focus_areas":["AI"],"max_results":5}'

# Get Sparks
curl http://localhost:8000/api/social/sparks?user_id=test_user&limit=10
```

---

## 📊 Lamatic Flow Pipeline

The flow orchestrates:

1. **Fetch** → Pull signals from Twitter, LinkedIn, etc.
2. **Filter** → Remove spam, apply time window, topic filters
3. **Anonymize** → Hash author IDs, blur handles
4. **Embed** → Generate dense + sparse vectors
5. **Match** → Search user's Qdrant memories for relevance
6. **Distill** → Summarize content (remove PII)
7. **Extract** → Pull topic tags
8. **Generate** → Create PKM prompts
9. **Score** → Calculate relevance scores
10. **Upsert** → Store in Qdrant as network_spark

---

## 🎯 Roadmap

- [ ] Reddit integration
- [ ] Hacker News signals
- [ ] Mastodon federation
- [ ] Custom RSS feeds
- [ ] Spark clustering (find patterns)
- [ ] Weekly digest emails
- [ ] Mobile app support

---

## 🐛 Troubleshooting

**"Lamatic API error":**
- Check API key is valid
- Verify flow is deployed
- Falls back to local processing

**"No sparks found":**
- Ensure social APIs are configured
- Check focus_areas match network content
- Lower relevance_threshold

**"Privacy concerns":**
- All data is anonymized by default
- Review `PrivacyLevel` enum
- Check Qdrant payload (no raw posts)

---

## 📚 References

- [Lamatic.ai Docs](https://docs.lamatic.ai)
- [Twitter API v2](https://developer.twitter.com/en/docs/twitter-api)
- [LinkedIn API](https://docs.microsoft.com/en-us/linkedin/)
- [Qdrant Hybrid Search](https://qdrant.tech/documentation/concepts/hybrid-queries/)

---

**Built with ❤️ for Memora - Your Collaborative Memory OS**
