-- 005_compliance_gate.sql
-- Compliance rule sets v1: semantic rules, risk tiers, review status, and the
-- 25-industry pre-seed pack. Paired with app/services/compliance_gate.py.
--
-- NOTE ON THE SEED: the industry rule sets below are global, non-removable
-- guardrails, so the upserts use DO UPDATE rather than DO NOTHING. This
-- deliberately overwrites the two placeholder rows seeded in 003
-- (finance/Finance Core, medical/Medical Core). If an admin has hand-edited a
-- rule set with one of these exact (industry, name) keys via /admin/compliance,
-- their edit is replaced by the canonical version.

-- ---------------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------------

ALTER TABLE compliance_rule_sets
  ADD COLUMN IF NOT EXISTS semantic_rules TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS requires_semantic_check BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS risk_tier SMALLINT NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

DO $$ BEGIN
  ALTER TABLE compliance_rule_sets
    ADD CONSTRAINT compliance_rule_sets_status_chk
    CHECK (status IN ('active', 'pending_review', 'retired'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE compliance_rule_sets
    ADD CONSTRAINT compliance_rule_sets_risk_tier_chk
    CHECK (risk_tier BETWEEN 1 AND 3);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Only 'active' rule sets are loaded at runtime (see load_compliance_for_industry).
CREATE INDEX IF NOT EXISTS idx_compliance_rule_sets_lookup
  ON compliance_rule_sets (LOWER(industry))
  WHERE is_active = TRUE AND status = 'active';

-- Violation detail for blocked posts, surfaced in /admin/approvals.
ALTER TABLE approval_items
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

-- ---------------------------------------------------------------------------
-- Global baseline
-- Sentinel is 'global' (NOT '__global__') — load_compliance_for_industry
-- matches this literal to union the baseline into every industry lookup.
-- ---------------------------------------------------------------------------

INSERT INTO compliance_rule_sets
  (industry, name, forbidden_phrases, required_disclaimers,
   semantic_rules, requires_semantic_check, risk_tier, status)
VALUES
('global', 'Global Baseline',
 ARRAY['guaranteed results','100% success rate','no risk','overnight results',
       'comment YES','tag 3 people','DM me now','limited spots',
       'studies show','research proves','experts agree'],
 ARRAY[]::TEXT[],
 ARRAY[
   'No content that harasses, demeans, or targets a person or group',
   'No misleading or deceptive claims',
   'No impersonation of a named person or organisation',
   'No engagement bait or requests for artificial engagement',
   'No spam patterns: excessive hashtags, repeated tagging, link stuffing',
   'No statistics, percentages, or research findings unless supplied by the user',
   'No specific personal experiences the user has not provided',
   'No claims about the user''s credentials, tenure, client count, revenue, or results beyond their brief',
   'No quotes attributed to real, named people',
   'No guarantees of outcomes and no absolute claims',
   'No negative naming of identifiable competitors',
   'No artificial urgency unless the user supplied a real deadline'
 ],
 -- The baseline never drives escalation: merge_compliance_into_config ignores
 -- the global set's tier so it cannot pin every industry to tier 1. These two
 -- values are recorded to match that behaviour, not to relax the rules above —
 -- the phrases and semantic rules here still apply to every industry.
 FALSE, 3, 'active')
ON CONFLICT (industry, name) DO UPDATE SET
  forbidden_phrases = EXCLUDED.forbidden_phrases,
  required_disclaimers = EXCLUDED.required_disclaimers,
  semantic_rules = EXCLUDED.semantic_rules,
  requires_semantic_check = EXCLUDED.requires_semantic_check,
  risk_tier = EXCLUDED.risk_tier,
  status = EXCLUDED.status,
  is_active = TRUE,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- Tier 1 — licensed professions (semantic check always on)
-- ---------------------------------------------------------------------------

INSERT INTO compliance_rule_sets
  (industry, name, forbidden_phrases, required_disclaimers,
   semantic_rules, requires_semantic_check, risk_tier, status)
VALUES

('healthcare', 'Healthcare Core',
 ARRAY['cures cancer','miracle cure','FDA approved miracle','guaranteed cure',
       'no side effects','doctor recommended','clinically proven',
       'diagnose yourself','replaces your doctor'],
 ARRAY['Not medical advice. Consult a qualified healthcare professional.'],
 ARRAY['No diagnosis, treatment recommendation, or dosage for any individual',
       'No claim that a treatment cures, prevents, or guarantees an outcome',
       'No patient details, even anonymised, unless consent is stated',
       'No treatment outcomes presented as typical',
       'No superiority claim over another provider'],
 TRUE, 1, 'active'),

('mental_health', 'Mental Health Core',
 ARRAY['cure depression','fix your anxiety','guaranteed recovery',
       'you don''t need medication','stop taking','self-diagnose'],
 ARRAY['Not a substitute for professional mental health care.'],
 ARRAY['No diagnostic language directed at the reader',
       'No advice to start, stop, or change medication',
       'No client stories or case details without stated consent',
       'No crisis guidance without directing to professional help',
       'No claims about recovery timelines'],
 TRUE, 1, 'active'),

('pharmacy', 'Pharmacy Core',
 ARRAY['prescription not needed','order without prescription',
       'guaranteed effective','cures','alternative to your doctor'],
 ARRAY['Consult a registered medical practitioner before use.'],
 ARRAY['No promotion of prescription-only medicines to the public',
       'No suggestion that a prescription can be bypassed',
       'No therapeutic claim for a specific product',
       'No pricing or discount promotion of scheduled drugs'],
 TRUE, 1, 'active'),

('finance', 'Finance Core',
 ARRAY['guaranteed returns','risk-free investment','get rich quick',
       'assured profit','double your money','can''t lose','insider tip','sure shot'],
 ARRAY['Not investment advice. Markets carry risk.'],
 ARRAY['No specific security, fund, or asset recommendation',
       'No return figures unless user-supplied and sourced',
       'No claim or implication that an investment is safe or guaranteed',
       'No urgency framing around a market event',
       'No advice tailored to an individual''s circumstances'],
 TRUE, 1, 'active'),

('insurance', 'Insurance Core',
 ARRAY['guaranteed claim approval','no rejection','full coverage',
       'covers everything','no questions asked','cheapest policy'],
 ARRAY['Terms and conditions apply. Read the policy document carefully.'],
 ARRAY['No claim that coverage is unconditional or claims always approved',
       'No premium or benefit figures without stating they are illustrative',
       'No assertion that a competitor policy is inferior',
       'No suggestion of coverage for excluded conditions'],
 TRUE, 1, 'active'),

('legal', 'Legal Core',
 ARRAY['guaranteed win','we always win','sure victory','free legal advice',
       'settle in your favour','best lawyer'],
 ARRAY['This is general information, not legal advice.'],
 ARRAY['No prediction or guarantee of case outcome',
       'No case-specific advice to any reader',
       'No client matter details without stated consent',
       'No superlative self-description',
       'No solicitation of specific legal work'],
 TRUE, 1, 'active'),

('accounting_tax', 'Accounting and Tax Core',
 ARRAY['guaranteed refund','avoid tax','zero tax','loophole',
       'we''ll get you a refund','beat the department'],
 ARRAY['General information only. Consult your tax advisor.'],
 ARRAY['No specific tax position or filing advice to individuals',
       'No guarantee of refund, assessment, or regulatory outcome',
       'No content encouraging avoidance or concealment',
       'No client financial details'],
 TRUE, 1, 'active'),

('immigration_services', 'Immigration Core',
 ARRAY['guaranteed visa','100% approval','government approved',
       'we have contacts','fast track guaranteed','settlement guaranteed'],
 ARRAY['Immigration outcomes depend on government decisions and are not guaranteed.'],
 ARRAY['No guarantee or probability claim about visa or PR approval',
       'No implication of influence over any government authority',
       'No processing-time promise',
       'No suggestion the firm is an official or government body'],
 TRUE, 1, 'active'),

('nutrition_fitness', 'Nutrition and Fitness Core',
 ARRAY['lose 10 kg in','guaranteed weight loss','burn fat fast','detox',
       'cleanse','no diet needed','melts fat','miracle supplement'],
 ARRAY['Not medical or nutritional advice. Consult a professional before changing your diet or exercise routine.'],
 ARRAY['No calorie targets, meal plans, or fasting protocols directed at readers',
       'No weight-loss figures or timelines',
       'No transformation claims presented as typical',
       'No language framing body types or weight as shameful',
       'No supplement therapeutic claims'],
 TRUE, 1, 'active'),

('education_edtech', 'Education Core',
 ARRAY['guaranteed placement','100% job guarantee','assured admission',
       'guaranteed selection','guaranteed score'],
 ARRAY['Outcomes vary by individual.'],
 ARRAY['No placement, admission, or salary guarantee',
       'No placement percentages or salary figures unless user-supplied',
       'No accreditation claim not stated in the brief',
       'No student names or results without consent',
       'No ranking claim without a named source'],
 TRUE, 1, 'active'),

-- ---------------------------------------------------------------------------
-- Tier 2 — regulated claims
-- ---------------------------------------------------------------------------

('real_estate', 'Real Estate Core',
 ARRAY['guaranteed appreciation','assured returns','prices will double',
       'risk-free property','last few units','price rising tomorrow'],
 ARRAY['Property investment carries risk. Verify all project approvals independently.'],
 ARRAY['No appreciation, rental-yield, or return projection',
       'No artificial scarcity or urgency about availability',
       'No approval or registration claim not supplied by the user',
       'No possession or completion date guarantee'],
 TRUE, 2, 'active'),

('recruitment_hr', 'Recruitment Core',
 ARRAY['guaranteed placement','guaranteed hire','we place everyone','assured joining'],
 ARRAY[]::TEXT[],
 ARRAY['No placement or hiring guarantee',
       'No candidate details without consent',
       'No client company names without consent',
       'No salary figures presented as typical without a source',
       'No content implying preference by age, gender, marital status, religion, or caste'],
 TRUE, 2, 'active'),

('beauty_wellness', 'Beauty and Wellness Core',
 ARRAY['permanent results','guaranteed glow','removes wrinkles','cures acne',
       'no side effects','instant fairness'],
 ARRAY['Individual results vary.'],
 ARRAY['No permanence or guaranteed-outcome claim',
       'No medical or therapeutic claim for a cosmetic treatment',
       'No before/after results presented as typical',
       'No skin-tone claims or language implying one appearance is superior',
       'No claim a treatment is risk-free'],
 TRUE, 2, 'active'),

('cybersecurity', 'Cybersecurity Core',
 ARRAY['unhackable','100% secure','guaranteed protection','zero risk',
       'we stop all attacks'],
 ARRAY[]::TEXT[],
 ARRAY['No absolute security guarantee',
       'No client name or breach detail without consent',
       'No unverified vulnerability claim about a named product or company',
       'No content usable as an attack method'],
 TRUE, 2, 'active'),

('it_services', 'IT Services Core',
 ARRAY['zero downtime','guaranteed delivery','cheapest in market'],
 ARRAY[]::TEXT[],
 ARRAY['No SLA or uptime figure not supplied by the user',
       'No client name without consent',
       'No delivery-timeline guarantee',
       'No project figures or team sizes not in the brief'],
 FALSE, 2, 'active'),

('management_consulting', 'Consulting Core',
 ARRAY['guaranteed ROI','guaranteed growth','we always deliver'],
 ARRAY[]::TEXT[],
 ARRAY['No ROI, growth, or savings figure unless user-supplied',
       'No client name or engagement detail without consent',
       'No results presented as typical',
       'No credential or firm-history claim beyond the brief'],
 FALSE, 2, 'active'),

('coaching_training', 'Coaching Core',
 ARRAY['guaranteed transformation','change your life overnight',
       'guaranteed income','proven system','everyone succeeds'],
 ARRAY['Results vary by individual.'],
 ARRAY['No income, career, or life-outcome guarantee',
       'No client testimonial invented or presented as typical',
       'No manipulative urgency or scarcity',
       'No claim to expertise not stated in the brief'],
 TRUE, 2, 'active'),

('hospitality_travel', 'Hospitality Core',
 ARRAY['guaranteed booking','no cancellation charges'],
 ARRAY[]::TEXT[],
 ARRAY['No price, availability, or refund guarantee not supplied by the user',
       'No rating or award claim without a source',
       'No guest details or images without consent',
       'No visa or entry-requirement advice'],
 FALSE, 2, 'active'),

-- ---------------------------------------------------------------------------
-- Tier 3 — ordinary commercial (fast path only)
-- ---------------------------------------------------------------------------

('software_saas', 'SaaS Core',
 ARRAY['guaranteed results','10x your revenue','replaces your team',
       'zero learning curve'],
 ARRAY[]::TEXT[],
 ARRAY['No performance metric or customer count unless user-supplied',
       'No customer name without consent',
       'No feature described that the brief does not mention'],
 FALSE, 3, 'active'),

('data_ai', 'Data and AI Core',
 ARRAY['guaranteed accuracy','100% accurate','fully autonomous',
       'replaces human judgement','eliminates bias'],
 ARRAY[]::TEXT[],
 ARRAY['No accuracy or performance figure unless user-supplied',
       'No benchmark or research claim without a source',
       'No claim a model is unbiased, error-free, or fully autonomous'],
 FALSE, 3, 'active'),

('ecommerce_retail', 'E-commerce Core',
 ARRAY['lowest price guaranteed','cheapest ever'],
 ARRAY[]::TEXT[],
 ARRAY['No price, discount, or stock claim not supplied by the user',
       'No manufactured urgency or scarcity',
       'No product performance claim beyond the brief'],
 FALSE, 3, 'active'),

('manufacturing', 'Manufacturing Core',
 ARRAY['guaranteed quality','zero defects'],
 ARRAY[]::TEXT[],
 ARRAY['No certification or compliance claim not supplied by the user',
       'No client name without consent',
       'No capacity or output figure not in the brief',
       'No safety claim without a basis'],
 FALSE, 3, 'active'),

('logistics_supply_chain', 'Logistics Core',
 ARRAY['guaranteed delivery','never delayed','100% on time','zero damage'],
 ARRAY[]::TEXT[],
 ARRAY['No delivery-time or reliability guarantee',
       'No performance figure unless user-supplied',
       'No client name without consent'],
 FALSE, 3, 'active'),

('marketing_agency', 'Marketing Agency Core',
 ARRAY['guaranteed leads','guaranteed ranking','viral guaranteed',
       'guaranteed followers','page 1 guaranteed'],
 ARRAY[]::TEXT[],
 ARRAY['No lead, ranking, reach, or engagement guarantee',
       'No client name or campaign result without consent',
       'No performance figure unless user-supplied',
       'No claim to platform relationships or insider access'],
 FALSE, 3, 'active'),

('construction_infrastructure', 'Construction Core',
 ARRAY['guaranteed completion','fastest in industry','zero cost overrun'],
 ARRAY[]::TEXT[],
 ARRAY['No completion-date or budget guarantee',
       'No approval, licence, or clearance claim not supplied by the user',
       'No safety record claim without a source',
       'No project value or client name without consent'],
 FALSE, 3, 'active')

ON CONFLICT (industry, name) DO UPDATE SET
  forbidden_phrases = EXCLUDED.forbidden_phrases,
  required_disclaimers = EXCLUDED.required_disclaimers,
  semantic_rules = EXCLUDED.semantic_rules,
  requires_semantic_check = EXCLUDED.requires_semantic_check,
  risk_tier = EXCLUDED.risk_tier,
  status = EXCLUDED.status,
  is_active = TRUE,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- Legacy 'medical' industry (seeded in 003).
-- Kept as a live alias of 'healthcare' rather than deleted, so tenants whose
-- tenants.industry is still 'medical' keep full coverage. Collapse the two
-- once tenant industry values are normalised.
-- ---------------------------------------------------------------------------

UPDATE compliance_rule_sets AS crs SET
  forbidden_phrases = src.forbidden_phrases,
  required_disclaimers = src.required_disclaimers,
  semantic_rules = src.semantic_rules,
  requires_semantic_check = src.requires_semantic_check,
  risk_tier = src.risk_tier,
  status = src.status,
  is_active = TRUE,
  updated_at = NOW()
FROM compliance_rule_sets AS src
WHERE src.industry = 'healthcare' AND src.name = 'Healthcare Core'
  AND crs.industry = 'medical' AND crs.name = 'Medical Core';
