# Test Strategy Overview — GoMaster

## Testing Tiers
1. **Tier 1: Core Go Rule Engine (Unit Tests)**
   - Orthogonal adjacency and liberties count.
   - Single stone and group captures.
   - Suicide move detection and conditional allowance (when capturing).
   - Simple Ko rule enforcement.
   - SGF parsing and serialization.
2. **Tier 2: Go Board Component (Component Tests)**
   - Click to place stone.
   - Ghost stone hover preview.
   - Last move marker update.
   - Captures counter and turn toggle.
3. **Tier 3: Engine & AI Bridge (Integration Tests with Mocks)**
   - KataGo JSON pipe parsing.
   - Gemini prompt builder and structured response parsing.
