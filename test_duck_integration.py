#!/usr/bin/env python
"""
Quick validation script for DuckDuckGo + MikuGPT integration.
Tests imports and basic async/sync compatibility.
"""
import sys
import asyncio

def test_imports():
    """Test that all required imports work."""
    print("Testing imports...")
    
    try:
        from app.services.duck_ai_client import DuckAIClient, DuckAIError
        print("✓ DuckAIClient imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import DuckAIClient: {e}")
        return False
    
    try:
        from app.routes.miku import miku_bp
        print("✓ MikuGPT routes imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import miku routes: {e}")
        return False
    
    try:
        from duckduckgo_search import DDGS
        print("✓ duckduckgo-search imported successfully")
    except ImportError as e:
        print(f"⚠ duckduckgo-search not installed: {e}")
        print("  Run: pip install duckduckgo-search aiohttp")
        return False
    
    return True


async def test_duck_ai_client():
    """Test basic DuckAIClient functionality."""
    print("\nTesting DuckAIClient...")
    
    try:
        from app.services.duck_ai_client import DuckAIClient
        
        client = DuckAIClient(model="gpt-4o-mini", timeout=10, max_history=3)
        print("✓ DuckAIClient initialized")
        
        # Test that client has required methods
        assert hasattr(client, 'ask'), "Missing 'ask' method"
        assert hasattr(client, 'get_history'), "Missing 'get_history' method"
        assert hasattr(client, 'clear_history'), "Missing 'clear_history' method"
        print("✓ All required methods present")
        
        return True
    except Exception as e:
        print(f"✗ DuckAIClient test failed: {e}")
        return False


def test_async_event_loop():
    """Test that asyncio event loop creation works."""
    print("\nTesting event loop compatibility...")
    
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        async def dummy():
            return "success"
        
        result = loop.run_until_complete(dummy())
        loop.close()
        
        assert result == "success"
        print("✓ Event loop works correctly")
        return True
    except Exception as e:
        print(f"✗ Event loop test failed: {e}")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("DuckDuckGo + MikuGPT Integration Validation")
    print("=" * 60)
    
    results = []
    
    results.append(("Imports", test_imports()))
    results.append(("DuckAIClient", test_duck_ai_client()))
    results.append(("AsyncIO Event Loop", test_async_event_loop()))
    
    print("\n" + "=" * 60)
    print("Summary:")
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"  {name}: {status}")
    
    all_passed = all(result[1] for result in results)
    
    if all_passed:
        print("\n✓ All validations passed! Integration ready.")
        sys.exit(0)
    else:
        print("\n⚠ Some validations failed. See details above.")
        sys.exit(1)
