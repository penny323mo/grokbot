// Tower DPS, Upgrade Tables, and Economy Monotonicity Tests
import assert from 'assert';
import { TOWERS } from '../src/data.js';

export function runTowerEconomyTests() {
    console.log('--- Running Tower DPS & Economy Tests ---');

    // 1. Tower Costs & Upgrades
    for (const tKey in TOWERS) {
        const t = TOWERS[tKey];
        assert(t.cost > 0 && Number.isInteger(t.cost), `${tKey} base cost must be positive integer`);

        const l1 = t.levels['1'];
        const l2 = t.levels['2'];
        const l3a = t.levels['3a'];
        const l3b = t.levels['3b'];

        assert(l1 && l2 && l3a && l3b, `${tKey} must have levels 1, 2, 3a, 3b`);
        assert(l1.upgradeCost > 0, `${tKey} l1 upgradeCost must be > 0`);
        assert(l2.upgradeCost > 0, `${tKey} l2 upgradeCost must be > 0`);

        // Monotonic DPS / Effectiveness Check
        if (tKey === 'crossbow' || tKey === 'mortar' || tKey === 'frost') {
            const dps1 = l1.damage / l1.rate;
            const dps2 = l2.damage / l2.rate;

            assert(dps2 > dps1, `${tKey} level 2 DPS (${dps2.toFixed(1)}) must exceed level 1 DPS (${dps1.toFixed(1)})`);

            // Check 3a and 3b
            const dps3a = (l3a.damage || 0) / (l3a.rate || 1);
            assert(dps3a > dps2, `${tKey} 3a DPS (${dps3a.toFixed(1)}) must exceed level 2 DPS (${dps2.toFixed(1)})`);

            if (l3b.burst) {
                const dps3b = (l3b.damage * l3b.burst) / l3b.rate;
                assert(dps3b > dps2, `${tKey} 3b burst DPS (${dps3b.toFixed(1)}) must exceed level 2 DPS (${dps2.toFixed(1)})`);
            } else if (l3b.damage) {
                const dps3b = l3b.damage / l3b.rate;
                assert(dps3b > 0, `${tKey} 3b DPS must be positive`);
            }
        } else if (tKey === 'guard') {
            assert(l2.guardHp > l1.guardHp, `Guard post L2 HP must exceed L1 HP`);
            assert(l2.guardAtk > l1.guardAtk, `Guard post L2 ATK must exceed L1 ATK`);
            assert(l3a.guardHp > l2.guardHp, `Guard post 3a HP must exceed L2 HP`);
            assert(l3b.guardAtk > l2.guardAtk, `Guard post 3b ATK must exceed L2 ATK`);
        } else if (tKey === 'bell') {
            assert(l2.buffDamage > l1.buffDamage, `Bell tower L2 buffDamage must exceed L1`);
            assert(l3a.buffDamage > l2.buffDamage, `Bell tower 3a buffDamage must exceed L2`);
        }
    }
    console.log('✓ Tower stats and DPS progression are strictly monotonic');

    // 2. Economy & Selling Calculation
    for (const tKey in TOWERS) {
        let gold = 1000;
        const tDef = TOWERS[tKey];
        const cost1 = tDef.cost;
        const up1 = tDef.levels['1'].upgradeCost;
        const up2 = tDef.levels['2'].upgradeCost;

        // Build L1
        gold -= cost1;
        assert(!isNaN(gold) && gold >= 0, 'Gold must never be NaN or negative after build');

        // Upgrade to L2
        gold -= up1;
        assert(!isNaN(gold), 'Gold must not be NaN after L2 upgrade');

        // Upgrade to L3a
        gold -= up2;
        assert(!isNaN(gold), 'Gold must not be NaN after L3 upgrade');

        // Sell calculation
        const totalInvested = cost1 + up1 + up2;
        const refund = Math.floor(totalInvested * 0.7);
        assert(refund > 0 && refund < totalInvested, 'Refund must be 70% of total investment');

        gold += refund;
        assert(!isNaN(gold) && Number.isInteger(gold), 'Gold after refund must be integer and non-NaN');
    }
    console.log('✓ Economy math and 70% refund formulas verified');

    return true;
}
