#!/usr/bin/env python3
"""
Test Gemini API with proper error handling and API key management
"""
import os
from dotenv import load_dotenv
from google import genai

# Load .env file first
load_dotenv()


def test_gemini_direct():
    """Test direct Gemini API call with proper key handling"""
    
    # Get API key from environment (now loaded from .env)
    api_key = os.getenv('GOOGLE_API_KEY')
    
    if not api_key:
        print("[ERROR] GOOGLE_API_KEY environment variable not set")
        print("\nHow to set it:")
        print("PowerShell: $env:GOOGLE_API_KEY='your_key_here'")
        print("Bash:       export GOOGLE_API_KEY='your_key_here'")
        print("\nGet your key from: https://google.ai.dev")
        return False
    
    print(f"[OK] API Key found: {api_key[:10]}...")
    
    try:
        # Create client with API key
        client = genai.Client(api_key=api_key)
        
        # Make request with proper model name
        print("[INFO] Sending request to Gemini...")
        response = client.models.generate_content(
            model="gemini-2.0-flash",  # Or "gemini-3-flash-preview"
            contents="Explain how AI works in a few words",
        )
        
        # Access response text correctly
        if hasattr(response, 'text') and response.text:
            print("[SUCCESS] Response from Gemini:")
            print(f"\n{response.text}\n")
            return True
        else:
            print(f"[WARNING] Unexpected response format: {response}")
            return False
            
    except Exception as e:
        print(f"[ERROR] {type(e).__name__}: {e}")
        return False


if __name__ == "__main__":
    success = test_gemini_direct()
    exit(0 if success else 1)
