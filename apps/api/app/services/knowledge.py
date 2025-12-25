import httpx
import time
from typing import List, Dict, Optional
from ..schemas.knowledge import KnowledgeTopic, KnowledgeContent
from ..utils.logger import get_logger

logger = get_logger(__name__)

class KnowledgeService:
    # Source Configurations
    SOURCES = {
        "t3nsor": {
            "base_url": "https://raw.githubusercontent.com/t3nsor/us-immigration-faq/master",
            "api_url": "https://api.github.com/repos/t3nsor/us-immigration-faq/commits",
            "repo_url": "https://github.com/t3nsor/us-immigration-faq/blob/master"
        },
        "awesome": {
            "base_url": "https://raw.githubusercontent.com/AwesomeVisa/awesome-immigration/master",
            "api_url": "https://api.github.com/repos/AwesomeVisa/awesome-immigration/commits",
            "repo_url": "https://github.com/AwesomeVisa/awesome-immigration/blob/master"
        }
    }
    
    TOPICS = [
        # US Specific (t3nsor)
        {"id": "general", "source": "t3nsor", "file": "general.md", "title": "🇺🇸 General US Admin", "description": "Overview of US immigration concepts"},
        {"id": "h1b", "source": "t3nsor", "file": "H-1B.md", "title": "🇺🇸 H-1B Visa", "description": "Specialty Occupations"},
        {"id": "l1", "source": "t3nsor", "file": "L-1.md", "title": "🇺🇸 L-1 Visa", "description": "Intracompany Transferee"},
        {"id": "tn", "source": "t3nsor", "file": "TN.md", "title": "🇺🇸 TN Status", "description": "NAFTA Professionals (Canada/Mexico)"},
        {"id": "green-card", "source": "t3nsor", "file": "green-card.md", "title": "🇺🇸 Green Card", "description": "Permanent Residence"},
        {"id": "visas", "source": "t3nsor", "file": "visas.md", "title": "🇺🇸 Visa Types", "description": "Overview of different visa categories"},
        
        # Global / Awesome Immigration (AwesomeVisa)
        {"id": "checklist", "source": "awesome", "file": "README.md", "title": "✅ Ultimate Immigration Checklist", "description": "Step-by-step guide for any country"},
        {"id": "digital-nomad", "source": "awesome", "file": "nomad.md", "title": "🌍 Digital Nomad Visas", "description": "Remote work visas for 50+ countries"},
        {"id": "skilled-migrant", "source": "awesome", "file": "skilled.md", "title": "💼 Skilled Migrant Visas", "description": "Points-based systems (Australia, Canada, UK, etc)"},
        {"id": "entrepreneur", "source": "awesome", "file": "entrepreneur.md", "title": "🚀 Entrepreneur Visas", "description": "Visas for startup founders and investors"},
        {"id": "job-seeker", "source": "awesome", "file": "jobseeker.md", "title": "🔍 Job Seeker Visas", "description": "Visas allowing you to enter and search for work"},
    ]

    _content_cache: Dict[str, Dict] = {} # {slug: {content: str, timestamp: float, sha: str}}
    _CACHE_TTL = 3600  # 1 hour

    async def get_topics(self) -> List[KnowledgeTopic]:
        topics = []
        for t in self.TOPICS:
            source_config = self.SOURCES.get(t["source"], self.SOURCES["t3nsor"])
            topics.append(KnowledgeTopic(
                id=t["id"],
                title=t["title"],
                description=t["description"],
                source_url=f"{source_config['repo_url']}/{t['file']}"
            ))
        return topics

    async def get_content(self, topic_id: str) -> Optional[KnowledgeContent]:
        topic = next((t for t in self.TOPICS if t["id"] == topic_id), None)
        
        # Dynamic Topic Fallback
        if not topic:
            # Assume it's a t3nsor file we haven't explicitly whitelisted
            # This handles links like [Adjusting Status](adjusting-status.md) which maps to topic_id="adjusting-status"
            topic = {
                "id": topic_id,
                "source": "t3nsor",
                "file": f"{topic_id}.md",
                "title": topic_id.replace("-", " ").title(), # Fallback title
                "description": "Dynamic topic"
            }

        # Check cache
        cached = self._content_cache.get(topic_id)
        if cached and time.time() - cached["timestamp"] < self._CACHE_TTL:
            return KnowledgeContent(
                topic_id=topic_id,
                title=topic["title"],
                content=cached["content"],
                last_updated=cached.get("last_updated"),
                commit_sha=cached.get("sha")
            )

        source_config = self.SOURCES.get(topic["source"], self.SOURCES["t3nsor"])

        try:
            async with httpx.AsyncClient() as client:
                # Fetch raw content
                content_url = f"{source_config['base_url']}/{topic['file']}"
                logger.info("fetching_knowledge_content", url=content_url)
                resp = await client.get(content_url)
                
                # FALLBACK: If 404, try web search
                if resp.status_code == 404:
                    logger.info("topic_not_found_searching_web", topic=topic["title"])
                    try:
                        from duckduckgo_search import DDGS
                        
                        search_query = f"US immigration {topic['title']} guide"
                        results = list(DDGS().text(search_query, max_results=5))
                        
                        md_content = f"# {topic['title']}\n\n"
                        md_content += "> **Note:** This topic was not found in our curated library, so we searched the web for you.\n\n"
                        
                        if results:
                            for res in results:
                                md_content += f"### [{res['title']}]({res['href']})\n"
                                md_content += f"{res['body']}\n\n"
                        else:
                            md_content += "No search results found. Please try a different topic."
                            
                        return KnowledgeContent(
                            topic_id=topic_id,
                            title=topic["title"],
                            content=md_content,
                            last_updated=None,
                            commit_sha=None
                        )
                    except Exception as search_err:
                        logger.error("web_search_failed", error=str(search_err))
                        # Fall through to standard error handling
                        pass

                resp.raise_for_status()
                content = resp.text

                # Fetch metadata (commit info)
                commit_sha = None
                last_updated = None
                try:
                    commit_url = f"{source_config['api_url']}?path={topic['file']}&per_page=1"
                    commit_resp = await client.get(commit_url)
                    if commit_resp.status_code == 200:
                        commits = commit_resp.json()
                        if commits:
                            commit_sha = commits[0]["sha"]
                            last_updated = commits[0]["commit"]["author"]["date"]
                except Exception as e:
                    logger.warning("failed_to_fetch_commit_info", error=str(e))

                # Update cache
                self._content_cache[topic_id] = {
                    "content": content,
                    "timestamp": time.time(),
                    "sha": commit_sha,
                    "last_updated": last_updated
                }

                return KnowledgeContent(
                    topic_id=topic_id,
                    title=topic["title"],
                    content=content,
                    last_updated=last_updated,
                    commit_sha=commit_sha
                )

        except Exception as e:
            logger.error("failed_to_fetch_knowledge", topic_id=topic_id, error=str(e))
            return None

knowledge_service = KnowledgeService()

async def get_knowledge_service() -> KnowledgeService:
    return knowledge_service
