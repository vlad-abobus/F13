"""
DuckDuckGo AI Search Async Wrapper
Provides an async interface to DuckDuckGo's AI chat capabilities.
"""
import asyncio
import logging
from typing import Optional, List, Dict, Tuple
from datetime import datetime

# Optional import - only needed when using DuckAIClient
try:
    from duckduckgo_search import DDGS
    DDGS_AVAILABLE = True
except ImportError:
    DDGS = None
    DDGS_AVAILABLE = False

logger = logging.getLogger(__name__)


class DuckAIClient:
    """
    Async wrapper for DuckDuckGo AI search and chat.
    
    Attributes:
        model: AI model to use (default: gpt-4o-mini)
        timeout: Request timeout in seconds
        max_history: Maximum dialog history messages to retain
        history: List of tuples (role, content, timestamp)
    """
    
    def __init__(
        self,
        model: str = "gpt-4o-mini",
        timeout: int = 30,
        max_history: int = 5
    ):
        if not DDGS_AVAILABLE:
            raise ImportError(
                "duckduckgo-search is not installed. "
                "Install with: pip install duckduckgo-search aiohttp"
            )
        
        self.model = model
        self.timeout = timeout
        self.max_history = max_history
        self.history: List[Dict[str, str]] = []
        self.ddgs = DDGS(timeout=timeout)
    
    async def ask(
        self,
        query: str,
        use_history: bool = True
    ) -> str:
        """
        Ask DuckDuckGo AI a question with optional dialog history.
        
        Args:
            query: The question/prompt to ask
            use_history: Whether to include previous messages in context
        
        Returns:
            The AI's response as a string
            
        Raises:
            DuckAIError: When the request fails (network, timeout, rate limit)
            ValueError: When query is empty or invalid
        """
        if not query or not isinstance(query, str):
            raise ValueError("Query must be a non-empty string")
        
        try:
            # Add current query to history
            self.history.append({
                "role": "user",
                "content": query,
                "timestamp": datetime.now().isoformat()
            })
            
            # Trim history to max_history most recent messages
            if len(self.history) > self.max_history * 2:  # *2 to keep both user and assistant messages
                self.history = self.history[-(self.max_history * 2):]
            
            # Build context from history if requested
            context = ""
            if use_history and len(self.history) > 1:
                context_msgs = self.history[:-1]  # Exclude current query
                lines = []
                for msg in context_msgs:
                    role_tag = "User" if msg["role"] == "user" else "Assistant"
                    lines.append(f"{role_tag}: {msg['content']}")
                if lines:
                    context = "Context:\n" + "\n".join(lines[-8:]) + "\n\n"  # Keep last 8 lines
            
            # Prepare full prompt
            full_query = context + query if context else query
            
            logger.info(f"DuckAIClient.ask() - Querying with model={self.model}, context_len={len(context)}")
            
            # Call DuckDuckGo AI in a thread pool (blocking I/O)
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                self._sync_ask,
                full_query
            )
            
            if not response:
                raise DuckAIError("Empty response from DuckDuckGo AI")
            
            # Add response to history
            self.history.append({
                "role": "assistant",
                "content": response,
                "timestamp": datetime.now().isoformat()
            })
            
            logger.info(f"DuckAIClient.ask() - Received response: {len(response)} chars")
            return response
            
        except DuckAIError:
            raise
        except asyncio.TimeoutError:
            raise DuckAIError(f"DuckDuckGo AI request timed out after {self.timeout}s")
        except Exception as e:
            logger.error(f"DuckAIClient.ask() - Unexpected error: {type(e).__name__}: {e}")
            raise DuckAIError(f"Failed to get response from DuckDuckGo AI: {type(e).__name__}: {str(e)[:200]}")
    
    def _sync_ask(self, query: str) -> Optional[str]:
        """
        Synchronous wrapper for DuckDuckGo DDGS.chat() (blocking).
        Called in executor to avoid blocking event loop.
        """
        try:
            response = self.ddgs.chat(query, model=self.model)
            return response if isinstance(response, str) else str(response)
        except Exception as e:
            logger.error(f"DuckAIClient._sync_ask() - Error: {type(e).__name__}: {e}")
            # Re-raise for caller to handle
            raise
    
    def get_history(self) -> List[Dict[str, str]]:
        """Get the current dialog history."""
        return self.history.copy()
    
    def clear_history(self) -> None:
        """Clear the dialog history."""
        self.history = []
        logger.info("DuckAIClient history cleared")
    
    def get_recent_messages(self, count: int = 5) -> str:
        """
        Get recent messages as a formatted string for context.
        
        Args:
            count: Number of recent messages to return
            
        Returns:
            Formatted string of recent messages
        """
        recent = self.history[-count:]
        lines = []
        for msg in recent:
            role = "User" if msg["role"] == "user" else "Assistant"
            lines.append(f"{role}: {msg['content']}")
        return "\n".join(lines) if lines else ""


class DuckAIError(Exception):
    """Custom exception for DuckAIClient errors."""
    pass


async def main():
    """
    Example usage of DuckAIClient.
    """
    print("=== DuckDuckGo AI Client Example ===\n")
    
    # Initialize client
    client = DuckAIClient(model="gpt-4o-mini", timeout=30, max_history=5)
    
    # Example queries
    questions = [
        "What is machine learning?",
        "Explain neural networks in simple terms.",
        "How does backpropagation work?"
    ]
    
    for i, question in enumerate(questions, 1):
        print(f"\n[Query {i}] {question}")
        print("Thinking...\n")
        
        try:
            response = await client.ask(question)
            print(f"[Response]\n{response}\n")
            print("-" * 60)
        except DuckAIError as e:
            print(f"[Error] {e}\n")
        
        # Add a small delay between requests
        if i < len(questions):
            await asyncio.sleep(2)
    
    # Show final history
    print("\n=== Dialog History ===")
    history = client.get_history()
    for msg in history:
        role = "👤 User" if msg["role"] == "user" else "🤖 Assistant"
        content_preview = msg["content"][:100] + ("..." if len(msg["content"]) > 100 else "")
        print(f"{role}: {content_preview}")


if __name__ == "__main__":
    asyncio.run(main())
