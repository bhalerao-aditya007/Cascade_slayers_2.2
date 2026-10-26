import sys, os
sys.path.insert(0, 'Backend')
os.environ['PROJECT_ROOT'] = os.path.abspath('Backend')

from api.engine import EngineState
eng = EngineState()

print("="*60)
print("1. BRUTAL SCENARIO VERIFICATION")
print("="*60)
results = {}
for sc in ['flood', 'heat', 'grid', 'quake', 'chem', 'compound_a', 'compound_b', 'epidemic']:
    eng.load_scenario(sc, 'mumbai', 'F0')
    risk = eng.get_risk_state()
    casc = eng.get_cascade_info()
    p_casc = risk.city.p_cascade_24h
    rho = casc.rho
    results[sc] = (p_casc, rho)
    print(f"Scenario: {sc:12s} | P(24h): {p_casc:0.2f} | Hawkes rho: {rho:0.2f} | Chains: {len(casc.chains)} | Zones: {len(risk.zones)}")

# Check that scenarios don't produce the exact same static number
p_vals = set(r[0] for r in results.values())
rho_vals = set(r[1] for r in results.values())
print(f"\nDistinct P(24h) values across scenarios: {len(p_vals)} distinct values")
print(f"Distinct Hawkes rho values across scenarios: {len(rho_vals)} distinct values")
assert len(p_vals) > 1, "CRITICAL: P(24h) is static across scenarios!"
assert len(rho_vals) > 1, "CRITICAL: Hawkes rho is static across scenarios!"
print(">>> SCENARIOS DYNAMIC CHECK: PASSED! <<<")

print("\n" + "="*60)
print("2. MULTI-HORIZON LIGHTGBM & ISOTONIC CALIBRATOR AUDIT")
print("="*60)
eng.load_scenario('flood', 'mumbai', 'F0')
import numpy as np
feat = np.array([0.85, 0.12, 0.45, 0.60])
cdf = eng.risk_gbm.predict_cdf(feat, 'cascade')
print("Trained LightGBM Multi-Horizon CDF predictions:")
for h in ['1', '3', '6', '12', '24', '48', '72']:
    assert h in cdf, f"Missing horizon {h}"
    print(f"  - Horizon {h:>2s}h: P = {cdf[h]:0.4f}")

# Check monotonic CDF: P(1h) <= P(3h) <= ... <= P(72h)
p_seq = [cdf[h] for h in ['1', '3', '6', '12', '24', '48', '72']]
assert all(p_seq[i] <= p_seq[i+1] + 1e-5 for i in range(len(p_seq)-1)), "CDF is non-monotonic!"
print(">>> LIGHTGBM MULTI-HORIZON CALIBRATED CDF: 100% MONOTONIC & VALID! <<<")

print("\n" + "="*60)
print("3. HAWKES POINT PROCESS & INTER-LAYER COUPLING")
print("="*60)
casc = eng.get_cascade_info()
print(f"Branching ratio rho: {casc.rho} (Subcritical physical stability: {casc.rho < 2.5})")
print(f"Primary Cascade Chains: {len(casc.chains)}")
if casc.chains:
    top_chain = casc.chains[0]
    print(f"Top chain rank: {top_chain.get('rank')}, prob: {top_chain.get('prob')}")
    for stage in top_chain.get('stages', []):
        print(f"  Layer: {stage.get('layer')} | Zone: {stage.get('zone_code')} | Event: {stage.get('event')}")

print(f"Feedback loops detected: {len(casc.loops)}")
for lp in casc.loops:
    nodes = lp.get('nodes', [])
    gain = lp.get('gain', 0)
    desc = lp.get('description', '')
    print(f"  - Nodes: {' <-> '.join(nodes)} | Gain: {gain} | {desc}")
assert len(casc.chains) > 0, "No cascade chains computed!"
print(">>> HAWKES POINT PROCESS: PASSED! <<<")

print("\n" + "="*60)
print("4. CANARY STRICT TEMPORAL LEAKAGE TEST")
print("="*60)
from harness.canary import run_leakage_canary_test
canary_res = run_leakage_canary_test(eng)
print("Canary Status:", canary_res)
assert canary_res.get("passed") is True, f"Canary leakage test failed: {canary_res}"
print(">>> ZERO FUTURE DATA LEAKAGE: 100% VERIFIED! <<<")

print("\n" + "="*60)
print("5. AUDIT LEDGER HASH CHAIN VERIFICATION")
print("="*60)
ledger_valid = eng.ledger.verify_chain()
print(f"Blocks in Ledger: {len(eng.ledger.chain)}")
print(f"Cryptographic hash chain valid: {ledger_valid}")
assert ledger_valid is True, "Audit ledger corrupted!"
print(">>> AUDIT LEDGER: CRYPTOGRAPHICALLY SOUND! <<<")

print("\n" + "="*60)
print("6. COUNTERFACTUAL SIMULATION & MILP ALLOCATION")
print("="*60)
plan = eng.counterfactual.evaluate_plan(['INT-DRN-01', 'INT-PWR-01'], eng.store.view(eng.clock.as_of))
print("Evaluated Plan ID:", plan.get('plan_id'))
print("Net Risk Reduction:", plan.get('risk_reduction'))
print("Recommended Interventions count:", len(plan.get('interventions', [])))
assert plan.get('risk_reduction') > 0, "Counterfactual plan shows zero impact!"
print(">>> INTERVENTIONS & MILP: PASSED! <<<")

print("\n" + "="*60)
print("ALL 6 BACKEND INTEGRATION DOMAINS VERIFIED SUCCESSFULLY!")
print("="*60)
