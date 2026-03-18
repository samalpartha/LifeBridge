"""Knowledge Base content for LifeBridge Crisis Corridor.

Content to be ingested into DigitalOcean Gradient AI Knowledge Base.
"""

CRISIS_FAQS = """
# Crisis Response FAQs

## Finding Safe Havens

Q: What is a safe haven?
A: A safe haven is a verified location offering protection, services, or aid during a crisis. This includes shelters, hospitals, embassies, humanitarian aid stations, and designated water points.

Q: How are havens verified?
A: Havens have three verification tiers:
- OFFICIAL: Confirmed by recognized organizations (UN, Red Cross, government agencies)
- VERIFIED: Confirmed by trained field staff within 24 hours
- COMMUNITY: Reported by community members (requires multiple reports)

Q: What services do havens offer?
A: Common services include: emergency shelter, medical care, food distribution, water access, phone charging, translation services, legal aid, family tracing, and document assistance.

## Safety and Navigation

Q: How do I choose a route?
A: Always review all three route options:
- FASTEST: Shortest time but may have higher risks
- SAFEST: Avoids known hazards and conflict zones
- ACCESSIBLE: Optimized for mobility needs (wheelchair, elderly, children)

Q: What are risk factors?
A: Routes are scored based on: active conflict proximity, curfew zones, reported road closures, infrastructure damage, lack of lighting, isolation (no nearby help), and terrain difficulty.

Q: Can I travel at night?
A: Night travel increases risk due to: reduced visibility, curfew enforcement, higher crime, and limited help availability. Plan to reach havens before dark when possible.

Q: What if I have mobility limitations?
A: Specify your needs (wheelchair, walking aid, can't carry heavy items, children in group) and routes will be adjusted for: accessible paths, shorter distances, rest points, and vehicle-accessible routes.

## Family Reunification

Q: How does the reunion beacon work?
A: Create a beacon with a unique code. Share this code with family members. They can use it to see your last known location and status. Location data is encrypted and only visible to those with your code.

Q: What if I don't have internet?
A: Enable offline mode before connectivity is lost. Your beacon will store check-ins locally and sync when connection is restored. Low-power mode sends GPS pings every 30 minutes.

Q: How do I protect my privacy?
A: Reunion codes use only partial family name (first 2 letters) and anonymous user IDs. Full identity is never shared publicly. You control who sees your location.

## Help Requests

Q: How do I request help?
A: Specify what you need (transport, medical, food, water, shelter, charging) and your urgency level. Nearby offers are automatically matched. Include details like number of people, special needs, and current location.

Q: How do I offer help?
A: List what you can provide, how many people you can help, and your service radius. You'll be notified of matching requests nearby. All interactions are logged for safety.

Q: How is abuse prevented?
A: Multiple safeguards: rate limits on requests, location sanity checks, community reporting, verification requirements for high-impact actions, and audit logs for all matches.

## Emergency Procedures

Q: What if the haven is full?
A: The system will show alternative havens nearby. Check capacity status before traveling. Contact havens directly if possible. Report capacity changes to help others.

Q: What should I bring to a haven?
A: Essentials: ID documents, medications, water, phone/charger, cash if available, list of emergency contacts, and any medical/mobility aids you need.

Q: What if I don't speak the local language?
A: Use the app's translation feature. Many havens have multilingual staff or volunteer translators. Show your phone screen with your needs listed.

Q: Emergency contacts?
A: Universal emergency numbers vary by country. The app shows local emergency services. For immediate life-threatening situations, call local emergency services first, then update your status in the app.
"""

HAVEN_VERIFICATION_PLAYBOOK = """
# Haven Verification Playbook

## Verification Tiers

### Tier A: OFFICIAL (Highest Trust)
Sources:
- UN agencies (UNHCR, UNICEF, WHO)
- International Red Cross/Red Crescent
- Government emergency management agencies
- Embassy/consulate official notices

Requirements:
- Direct API or official document
- Signed or digitally verified
- Updated within 7 days

### Tier B: VERIFIED (High Trust)
Sources:
- Trained field staff reports
- Partnered local NGOs
- Verified media outlets
- Municipal authorities

Requirements:
- In-person verification within 24 hours
- Photo/video evidence
- Contact information validated
- Cross-referenced with other sources

### Tier C: COMMUNITY (Moderate Trust)
Sources:
- Community member reports
- Multiple independent reports (quorum of 3+)
- Social media (cross-validated)

Requirements:
- At least 3 independent reports
- Recent (within 48 hours)
- Location GPS-verified
- Flagged for official follow-up

## Verification Checklist

For field verification of a new haven:
1. Physical location confirmation (GPS coordinates)
2. Services inventory (what's actually available)
3. Capacity assessment (current occupancy vs maximum)
4. Access requirements (who can enter, documentation needed)
5. Operating hours (24/7 or specific times)
6. Contact method (phone, radio, in-person only)
7. Safety assessment (structural integrity, security present)
8. Resource status (food, water, medical supplies levels)

## Status Updates

Haven status should be updated when:
- Capacity changes significantly (from available to limited or full)
- Services added or removed
- Hours of operation change
- New risks identified nearby
- Access requirements change
- Location becomes unsafe or closes

Update format:
- Clear status change
- Reason for change
- Evidence (photo, document, witness report)
- Reporter identification (role/organization)
- Timestamp

## Red Flags (Remove or Downgrade)

Remove haven if:
- Reported unsafe by multiple sources
- Confirmed closed or abandoned
- Access blocked (road closure, military control)
- No updates >30 days for COMMUNITY tier

Downgrade tier if:
- Conflicting reports
- Unable to verify within timeframe
- Services reduced significantly
- Trust concerns raised

## Quality Standards

Every haven entry must have:
- Precise GPS coordinates (within 50 meters)
- Clear name and type
- At least one contact method OR verification source
- Last verified timestamp
- Appropriate tier based on source

Good haven descriptions:
- "Central Hospital - Emergency room open 24/7, no referral needed, 200-bed capacity"
- "UN Emergency Shelter - Families with children prioritized, free meals 3x/day, capacity 500"

Poor haven descriptions:
- "Shelter somewhere downtown"
- "Hospital (not sure if open)"

## Update Frequency

Target update intervals:
- OFFICIAL: Every 7 days or on status change
- VERIFIED: Every 24 hours in active crisis
- COMMUNITY: Validate within 48 hours of report

Stale data handling:
- Flag >7 days for OFFICIAL
- Flag >48 hours for VERIFIED
- Flag >24 hours for COMMUNITY
- Show age prominently in UI
"""

CRISIS_SAFETY_PROTOCOLS = """
# Crisis Safety Protocols

## Route Risk Assessment

### High Risk Factors (Avoid if Possible)
- Active conflict zone (within 5km)
- Curfew violation
- Recent attack or incident (<24 hours)
- Infrastructure collapse (bridges, roads)
- No cellular coverage
- Isolated areas with no havens nearby
- Known checkpoints with reports of issues

### Medium Risk Factors (Proceed with Caution)
- Conflict zone proximity (5-15km)
- Poor road conditions
- Limited lighting (night travel)
- Minimal haven coverage
- Intermittent connectivity
- Crowded areas (stampede risk)

### Low Risk Factors (Generally Safe)
- Multiple havens along route
- Good cellular coverage
- Daylight travel
- Established roads
- Regular traffic/foot traffic
- Proximity to safe zones

## Travel Guidelines

### Day Travel
- Preferred time: 8am - 4pm
- Maximum distance: 20km for walking, 100km for vehicle
- Rest every 2 hours
- Stay hydrated (1L water per 5km walking)

### Night Travel (Only if Essential)
- Use fastest route to minimize exposure
- Travel in groups when possible
- Keep phone charged
- Enable check-in tracking
- Avoid isolated areas

### Group Travel Considerations
- Children: Plan for breaks every hour, carry snacks
- Elderly: Shorter distances, accessible routes, more frequent rests
- Pregnant: Medical haven proximity, shorter distances
- Disabled: Wheelchair-accessible only, vehicle preferred

## Communication Safety

### What to Share
- Your status (safe, moving, need help)
- General location (city/district, not precise address)
- Immediate needs
- Reunion code for family

### What NOT to Share
- Exact real-time location (publicly)
- Full names or identifying info
- Travel plans in advance
- Specific routes you're taking
- Photos showing faces or identifying features

## Battery Management

### Critical (<20%)
- GPS ping only (every 30 min)
- Disable non-essential features
- Message only for emergencies

### Low (20-50%)
- GPS ping every 15 min
- Essential features only
- Plan charging at next haven

### Normal (>50%)
- Full features enabled
- Real-time tracking
- Map and route viewing

## If You Feel Unsafe

Immediate actions:
1. Move to nearest public/populated area
2. Contact local emergency services if safe
3. Update status to "need help"
4. Share reunion code with trusted contact
5. Follow any official evacuation orders

Do NOT:
- Hesitate to change plans if something feels wrong
- Follow routes into isolated areas if concerned
- Ignore local warnings or official advisories
- Travel alone at night unless absolutely necessary
"""
