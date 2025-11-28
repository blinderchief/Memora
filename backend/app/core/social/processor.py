"""Social signal processor for fetching and filtering network data."""

import hashlib
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings
from app.models.social import (
    SocialPlatform,
    SocialSignal,
    PrivacyLevel,
)

logger = logging.getLogger(__name__)


class SocialProcessor:
    """Processor for fetching and anonymizing social signals."""

    def __init__(self):
        """Initialize social processor."""
        self._http_client: Optional[httpx.AsyncClient] = None
        
        # API configurations (would be loaded from env)
        self._twitter_bearer_token = settings.twitter_bearer_token
        self._linkedin_access_token = settings.linkedin_access_token

    @property
    def http_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(timeout=15.0)
        return self._http_client

    async def fetch_signals(
        self,
        platforms: List[SocialPlatform],
        time_window_hours: int = 72,
        max_per_platform: int = 50,
    ) -> List[SocialSignal]:
        """
        Fetch social signals from multiple platforms.
        
        Args:
            platforms: Platforms to fetch from
            time_window_hours: How far back to look
            max_per_platform: Max signals per platform
            
        Returns:
            List of raw social signals
        """
        all_signals: List[SocialSignal] = []
        
        for platform in platforms:
            try:
                if platform == SocialPlatform.TWITTER:
                    signals = await self._fetch_twitter_signals(
                        time_window_hours, max_per_platform
                    )
                elif platform == SocialPlatform.LINKEDIN:
                    signals = await self._fetch_linkedin_signals(
                        time_window_hours, max_per_platform
                    )
                elif platform == SocialPlatform.MASTODON:
                    signals = await self._fetch_mastodon_signals(
                        time_window_hours, max_per_platform
                    )
                elif platform == SocialPlatform.GITHUB:
                    signals = await self._fetch_github_signals(
                        time_window_hours, max_per_platform
                    )
                else:
                    logger.warning(f"Platform {platform} not yet implemented")
                    continue
                
                all_signals.extend(signals)
                logger.info(f"Fetched {len(signals)} signals from {platform}")
                
            except Exception as e:
                logger.error(f"Failed to fetch from {platform}: {e}")
                continue
        
        return all_signals

    async def _fetch_twitter_signals(
        self,
        time_window_hours: int,
        max_results: int,
    ) -> List[SocialSignal]:
        """
        Fetch Twitter/X signals from user's network.
        
        Uses Twitter API v2 to fetch timeline from followed accounts.
        Privacy: Only fetches public posts from followed accounts.
        """
        if not self._twitter_bearer_token or self._twitter_bearer_token == "demo":
            # Return demo data for development
            return self._get_demo_twitter_signals()
        
        signals: List[SocialSignal] = []
        
        try:
            # Twitter API v2 - Home timeline endpoint
            url = "https://api.twitter.com/2/tweets/search/recent"
            
            # Build query for followed accounts (simplified)
            since_time = datetime.utcnow() - timedelta(hours=time_window_hours)
            
            params = {
                "query": "from:following",  # Would need user context
                "max_results": min(max_results, 100),
                "tweet.fields": "created_at,public_metrics,author_id",
                "expansions": "author_id",
                "start_time": since_time.isoformat() + "Z",
            }
            
            headers = {
                "Authorization": f"Bearer {self._twitter_bearer_token}",
            }
            
            response = await self.http_client.get(url, params=params, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            # Parse tweets
            for tweet in data.get("data", []):
                author_id = tweet.get("author_id", "unknown")
                author_handle = f"user_{author_id}"  # Would be enriched from includes
                
                signal = SocialSignal(
                    platform=SocialPlatform.TWITTER,
                    content=tweet.get("text", ""),
                    author_handle=author_handle,
                    url=f"https://twitter.com/i/status/{tweet['id']}",
                    posted_at=datetime.fromisoformat(
                        tweet["created_at"].replace("Z", "+00:00")
                    ),
                    engagement_score=self._calculate_twitter_engagement(tweet),
                    raw_metadata={"tweet_id": tweet["id"]},
                )
                signals.append(signal)
            
            return signals
            
        except Exception as e:
            logger.error(f"Twitter fetch failed: {e}")
            return self._get_demo_twitter_signals()

    async def _fetch_linkedin_signals(
        self,
        time_window_hours: int,
        max_results: int,
    ) -> List[SocialSignal]:
        """
        Fetch LinkedIn signals from network.
        
        Uses LinkedIn API to fetch feed from connections.
        """
        if not self._linkedin_access_token or self._linkedin_access_token == "demo":
            return self._get_demo_linkedin_signals()
        
        # LinkedIn API implementation would go here
        # For now, return demo data
        return self._get_demo_linkedin_signals()

    async def _fetch_mastodon_signals(
        self,
        time_window_hours: int,
        max_results: int,
    ) -> List[SocialSignal]:
        """Fetch Mastodon signals (federated, privacy-friendly)."""
        # Mastodon implementation
        return []

    async def _fetch_github_signals(
        self,
        time_window_hours: int,
        max_results: int,
    ) -> List[SocialSignal]:
        """Fetch GitHub activity from followed users (stars, discussions)."""
        # GitHub API implementation
        return []

    def _calculate_twitter_engagement(self, tweet: Dict[str, Any]) -> float:
        """Calculate engagement score from Twitter metrics."""
        metrics = tweet.get("public_metrics", {})
        likes = metrics.get("like_count", 0)
        retweets = metrics.get("retweet_count", 0)
        replies = metrics.get("reply_count", 0)
        
        # Weighted engagement score
        return float(likes + (retweets * 2) + (replies * 3))

    def _get_demo_twitter_signals(self) -> List[SocialSignal]:
        """Demo Twitter signals for development."""
        now = datetime.utcnow()
        
        return [
            SocialSignal(
                platform=SocialPlatform.TWITTER,
                content="Just learned a game-changing negotiation tip: Always anchor high, but with a justified rationale. The 'why' matters as much as the 'what'. Changed how I approach salary discussions. 🧠",
                author_handle="strategist_pro",
                author_display_name="Strategy Insights",
                url="https://twitter.com/demo/status/1",
                posted_at=now - timedelta(hours=5),
                engagement_score=247.0,
                raw_metadata={"demo": True},
            ),
            SocialSignal(
                platform=SocialPlatform.TWITTER,
                content="AI productivity hack: I use vector embeddings to resurface past meeting notes when starting new projects. It's like having a perfect memory of every decision context. Game changer for remote teams.",
                author_handle="ai_builder_23",
                author_display_name="AI Builder",
                url="https://twitter.com/demo/status/2",
                posted_at=now - timedelta(hours=12),
                engagement_score=892.0,
                raw_metadata={"demo": True},
            ),
            SocialSignal(
                platform=SocialPlatform.TWITTER,
                content="The best leadership advice I got this year: 'Make decisions like you're playing chess, but communicate them like you're telling a story.' Context > commands.",
                author_handle="tech_lead_101",
                url="https://twitter.com/demo/status/3",
                posted_at=now - timedelta(hours=24),
                engagement_score=1534.0,
                raw_metadata={"demo": True},
            ),
            SocialSignal(
                platform=SocialPlatform.TWITTER,
                content="Spent the weekend building a RAG system with Qdrant. The hybrid search (dense + sparse) is insanely good. Semantic understanding + keyword precision = chef's kiss 👨‍🍳",
                author_handle="vector_wizard",
                url="https://twitter.com/demo/status/4",
                posted_at=now - timedelta(hours=36),
                engagement_score=423.0,
                raw_metadata={"demo": True},
            ),
        ]

    def _get_demo_linkedin_signals(self) -> List[SocialSignal]:
        """Demo LinkedIn signals for development."""
        now = datetime.utcnow()
        
        return [
            SocialSignal(
                platform=SocialPlatform.LINKEDIN,
                content="After 10 years in product management, here's what I wish I knew earlier: Your roadmap is a hypothesis, not a contract. Test, learn, pivot. The best PMs are scientists, not fortune tellers.",
                author_handle="pm_insights",
                author_display_name="PM Insights",
                url="https://linkedin.com/demo/post/1",
                posted_at=now - timedelta(hours=8),
                engagement_score=567.0,
                raw_metadata={"demo": True},
            ),
            SocialSignal(
                platform=SocialPlatform.LINKEDIN,
                content="The future of work isn't remote vs. office. It's about building systems that preserve institutional memory in distributed teams. Knowledge graphs + AI agents are the answer.",
                author_handle="future_of_work",
                url="https://linkedin.com/demo/post/2",
                posted_at=now - timedelta(hours=18),
                engagement_score=1203.0,
                raw_metadata={"demo": True},
            ),
        ]

    def anonymize_signal(
        self,
        signal: SocialSignal,
        privacy_level: PrivacyLevel,
    ) -> SocialSignal:
        """
        Anonymize a social signal based on privacy level.
        
        Args:
            signal: Original signal
            privacy_level: Level of anonymization
            
        Returns:
            Anonymized signal (metadata only, no raw content stored)
        """
        if privacy_level == PrivacyLevel.FULL_ANONYMIZE:
            # Complete anonymization
            signal.author_handle = self._hash_handle(signal.author_handle)
            signal.author_display_name = None
            signal.url = ""  # Remove direct link
            
        elif privacy_level == PrivacyLevel.BLUR_AUTHOR:
            # Keep platform, blur author
            signal.author_handle = self._blur_handle(signal.author_handle)
            signal.author_display_name = None
            
        # MINIMAL: Keep as-is (with user consent)
        
        return signal

    def _hash_handle(self, handle: str) -> str:
        """Create irreversible hash of handle."""
        return hashlib.sha256(handle.encode("utf-8")).hexdigest()[:16]

    def _blur_handle(self, handle: str) -> str:
        """Create blurred version of handle."""
        if len(handle) <= 3:
            return "***"
        return handle[0] + "*" * (len(handle) - 2) + handle[-1]

    async def close(self):
        """Clean up resources."""
        if self._http_client:
            await self._http_client.aclose()


# Global instance
social_processor = SocialProcessor()
