document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.mode').forEach(m => m.classList.remove('active'));
        tab.classList.add('active');
        const id = 'mode' + tab.dataset.mode.charAt(0).toUpperCase() + tab.dataset.mode.slice(1);
        document.getElementById(id).classList.add('active');
    });
});

function calcSmelt() {
    const dust = +document.getElementById('m1Dust').value || 0;
    const dustRate = +document.getElementById('m1DustRate').value || 1;
    const ingotRate = +document.getElementById('m1IngotRate').value || 1;
    const vesselCap = +document.getElementById('m1VesselCap').value || 1;
    const totalMb = dust * dustRate;
    const ingots = Math.floor(totalMb / ingotRate);
    const remainder = totalMb % ingotRate;
    const vessels = Math.ceil(totalMb / vesselCap);

    document.getElementById('m1TotalMb').textContent = totalMb.toLocaleString();
    document.getElementById('m1Ingots').textContent = ingots.toLocaleString();
    document.getElementById('m1Remainder').textContent = remainder.toLocaleString();
    document.getElementById('m1Vessels').textContent = vessels.toLocaleString();

    let exact = null, exactDust = null;
    for (let n = 1; n <= 10000; n++) {
        const need = n * ingotRate;
        if (need % dustRate !== 0) continue;
        const nd = need / dustRate;
        if (nd <= dust) { exact = n; exactDust = nd; break; }
    }
    document.getElementById('m1Exact').textContent = exact !== null ? exact.toLocaleString() : '—';
    document.getElementById('m1ExactDust').textContent = exactDust !== null ? exactDust.toLocaleString() : '—';
    document.getElementById('m1Results').classList.remove('hidden');
}

function resetSmelt() {
    ['m1Dust','m1DustRate','m1IngotRate'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('m1Results').classList.add('hidden');
}

document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && document.getElementById('modeSmelt').classList.contains('active')) calcSmelt();
});

const m2InputsList = document.getElementById('m2InputsList');
const m2AddBtn = document.getElementById('m2AddBtn');
const m2TotalMb = document.getElementById('m2TotalMb');
const m2TotalIngots = document.getElementById('m2TotalIngots');

function m2Calculate() {
    const inputs = document.querySelectorAll('#m2InputsList .metal-input');
    let total = 0;
    inputs.forEach(inp => { total += parseFloat(inp.value) || 0; });
    m2TotalMb.textContent = total;
    m2TotalIngots.textContent = Math.floor(total / 144);
    inputs.forEach(inp => {
        const pct = inp.parentElement.querySelector('.percentage');
        pct.textContent = total > 0 ? ((parseFloat(inp.value) || 0) / total * 100).toFixed(1) + '%' : '0%';
    });
}

function m2AddGroup(val) {
    const group = document.createElement('div');
    group.className = 'input-group';
    group.innerHTML = '<input type="number" class="metal-input" value="' + val + '" min="0" step="any" placeholder="мБ"><span class="percentage">0%</span><button class="btn-remove">Удалить</button>';
    m2InputsList.appendChild(group);
    m2Calculate();
}

m2InputsList.addEventListener('input', e => { if (e.target.classList.contains('metal-input')) m2Calculate(); });
m2InputsList.addEventListener('click', e => {
    if (e.target.classList.contains('btn-remove')) { e.target.parentElement.remove(); m2Calculate(); }
});
m2AddBtn.addEventListener('click', () => m2AddGroup(''));
m2AddGroup('');
m2AddGroup('');

const mtList = document.getElementById('mtList');
const mtVesselCap = document.getElementById('mtVesselCap');
const mtRecipeName = document.getElementById('mtRecipeName');

const STORAGE_KEY = 'opencode_alloy_recipes';
const RANGE_KEY = 'opencode_range_mode';

function mtToggleRange() {
    const on = localStorage.getItem(RANGE_KEY) !== 'fixed';
    const newMode = on ? 'fixed' : 'range';
    localStorage.setItem(RANGE_KEY, newMode);
    mtApplyRange(newMode === 'range');
}

function mtApplyRange(rangeOn) {
    const thumb = document.getElementById('mtToggleThumb');
    const fixedLabel = document.getElementById('mtToggleFixed');
    const rangeLabel = document.getElementById('mtToggleRange');
    thumb.className = 'toggle-thumb ' + (rangeOn ? 'right' : 'left');
    fixedLabel.classList.toggle('active', !rangeOn);
    rangeLabel.classList.toggle('active', rangeOn);
    document.getElementById('mtHdrTo').style.display = rangeOn ? '' : 'none';
    document.querySelectorAll('#mtList .mt-pct-max').forEach(el => el.style.display = rangeOn ? '' : 'none');
    mtUpdatePreview();
    mtCalc();
}

function mtGetRows() {
    return document.querySelectorAll('#mtList .mt-row');
}

function mtReadRow(r) {
    const pctMin = +r.querySelector('.mt-pct-min').value || 0;
    const pctMax = localStorage.getItem(RANGE_KEY) === 'range' ? (+r.querySelector('.mt-pct-max').value || 0) : pctMin;
    return {
        name: r.querySelector('.mt-name').value || '?',
        pctMin, pctMax,
        rate: +r.querySelector('.mt-rate').value || 1,
        have: +r.querySelector('.mt-have').value || 0
    };
}

function mtSetRow(r, data) {
    r.querySelector('.mt-name').value = data.name || '';
    r.querySelector('.mt-pct-min').value = data.pctMin ?? '';
    r.querySelector('.mt-pct-max').value = data.pctMax ?? '';
    r.querySelector('.mt-rate').value = data.rate ?? 144;
    r.querySelector('.mt-have').value = data.have ?? '';
    r.querySelector('.mt-need').textContent = data.need ?? '0';
}

function mtAddRow(data) {
    data = data || { name: '', pctMin: '', pctMax: '', rate: 144, have: '', need: '0' };
    const d = document.createElement('div');
    d.className = 'mt-row';
    const rangeOn = localStorage.getItem(RANGE_KEY) === 'range';
    d.innerHTML = '<input class="mt-name" value="" placeholder="Название">' +
        '<input type="number" class="mt-pct-min" value="" min="0" max="100" step="any" placeholder="%">' +
        '<input type="number" class="mt-pct-max" value="" min="0" max="100" step="any" placeholder="%">' +
        '<input type="number" class="mt-rate" value="144" min="0" step="any" placeholder="мб/ед">' +
        '<input type="number" class="mt-have" value="" min="0" step="any" placeholder="шт">' +
        '<span class="mt-need">0</span>' +
        '<button class="m2-remove">x</button>';
    mtSetRow(d, data);
    if (!rangeOn) d.querySelector('.mt-pct-max').style.display = 'none';
    mtList.appendChild(d);
}

function mtCollect() {
    const rows = mtGetRows();
    return Array.from(rows).map(r => mtReadRow(r));
}

function mtCalc() {
    const rows = mtGetRows();
    const vesselCap = +mtVesselCap.value || 1;
    const ingredients = mtCollect();
    if (ingredients.length < 2) return;

    const allHave = ingredients.filter(i => i.have > 0);
    const pctEl = document.getElementById('mtTotalPct');
    const rangeOn = localStorage.getItem(RANGE_KEY) === 'range';

    // total recipe pct display
    const totalPctMin = ingredients.reduce((s, i) => s + i.pctMin, 0);
    const totalPctMax = ingredients.reduce((s, i) => s + i.pctMax, 0);
    if (totalPctMin === totalPctMax) {
        pctEl.textContent = totalPctMin.toFixed(1) + '%';
        pctEl.style.color = Math.abs(totalPctMin - 100) < 0.01 ? '#4ade80' : '#f87171';
    } else {
        pctEl.textContent = totalPctMin.toFixed(1) + '–' + totalPctMax.toFixed(1) + '%';
        pctEl.style.color = (totalPctMin <= 100 && totalPctMax >= 100) ? '#4ade80' : '#f87171';
    }

    if (allHave.length >= 2) {
        // SUM MODE: user entered quantities for multiple materials, just sum
        let totalMb = 0;
        ingredients.forEach(i => { totalMb += i.have * i.rate; });
        rows.forEach(r => r.querySelector('.mt-need').textContent = '—');
        document.getElementById('mtTotalMb').textContent = totalMb.toLocaleString();
        document.getElementById('mtTotalIngots').textContent = Math.floor(totalMb / 144);
        document.getElementById('mtVessels').textContent = Math.ceil(totalMb / vesselCap);
        return;
    }

    // CALC MODE: only one material has quantity, calculate others
    const haveIdx = ingredients.findIndex(i => i.have > 0);
    if (haveIdx === -1) return;

    const base = ingredients[haveIdx];
    const baseMb = base.have * base.rate;
    const basePct = (base.pctMin + base.pctMax) / 2;
    if (basePct === 0) return;

    let bestResult = null;
    let bestScore = Infinity;

    const targetPcts = ingredients.map(i => (i.pctMin + i.pctMax) / 2);
    const sumTarget = targetPcts.reduce((a, b) => a + b, 0);
    const normTarget = targetPcts.map(p => p / sumTarget * 100);

    const idealTotal = baseMb / (normTarget[haveIdx] / 100);

    // For each non-base ingredient, try a range of unit counts
    let ranges = ingredients.map((i, idx) => {
        if (idx === haveIdx) return { min: i.have, max: i.have };
        const idealUnits = idealTotal * normTarget[idx] / 100 / i.rate;
        const min = Math.max(0, Math.floor(idealUnits) - 1);
        const max = Math.ceil(idealUnits) + 2;
        return { min, max };
    });

    function enumerate(idx, current) {
        if (idx === ingredients.length) {
            const actualMb = current.reduce((s, u, i) => s + u * ingredients[i].rate, 0);
            const actualPcts = current.map((u, i) => u * ingredients[i].rate / actualMb * 100);
            const dev = actualPcts.reduce((s, ap, i) => s + Math.abs(ap - normTarget[i]), 0);
            const unitsOk = current.every(u => Number.isInteger(u) && u >= 0);
            if (!unitsOk) return;
            if (current[haveIdx] !== ingredients[haveIdx].have) return;
            if (dev < bestScore) {
                bestScore = dev;
                bestResult = { units: [...current], totalMb: actualMb, pcts: actualPcts };
            }
            return;
        }
        const { min, max } = ranges[idx];
        for (let u = min; u <= max; u++) {
            current.push(u);
            enumerate(idx + 1, current);
            current.pop();
        }
    }

    enumerate(0, []);

    if (!bestResult) {
        const fallbackUnits = ingredients.map((i, idx) => {
            if (idx === haveIdx) return i.have;
            return Math.round(idealTotal * normTarget[idx] / 100 / i.rate) || 1;
        });
        const fallbackMb = fallbackUnits.reduce((s, u, i) => s + u * ingredients[i].rate, 0);
        bestResult = { units: fallbackUnits, totalMb: fallbackMb, pcts: normTarget };
    }

    rows.forEach((r, i) => {
        r.querySelector('.mt-need').textContent = bestResult.units[i];
    });

    rows.forEach((r, i) => {
        const pct = bestResult.pcts[i].toFixed(1);
        r.querySelector('.mt-need').textContent = bestResult.units[i] + ' (' + pct + '%)';
    });

    document.getElementById('mtTotalMb').textContent = actualMb.toLocaleString();
    document.getElementById('mtTotalIngots').textContent = Math.floor(actualMb / 144);
    document.getElementById('mtVessels').textContent = Math.ceil(actualMb / vesselCap);
    document.getElementById('mtResults').classList.remove('hidden');
    mtUpdatePreview();
}

mtList.addEventListener('input', () => mtCalc());
mtList.addEventListener('click', e => {
    if (e.target.classList.contains('m2-remove')) {
        e.target.parentElement.remove();
        mtUpdatePreview();
        mtCalc();
    }
});

document.getElementById('mtAddBtn').addEventListener('click', () => { mtAddRow(); mtUpdatePreview(); });

function mtReset() {
    mtList.innerHTML = '';
    mtAddRow({ name: 'Медь', pctMin: 70, pctMax: 80, rate: 144 });
    mtAddRow({ name: 'Олово', pctMin: 20, pctMax: 30, rate: 144 });
    document.getElementById('mtResults').classList.add('hidden');
    mtUpdatePreview();
    mtCalc();
}

// ===== RECIPE SAVE/LOAD =====
function mtToast(msg) {
    const el = document.createElement('div');
    el.textContent = msg;
    Object.assign(el.style, {
        position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.25)',
        color: '#c4b5fd', padding: '10px 24px', borderRadius: '12px', fontSize: '14px',
        fontWeight: '600', zIndex: '999', backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease'
    });
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }, 2000);
}

function mtGetRecipeData() {
    const name = mtRecipeName.value.trim() || 'Без имени';
    const ingredients = mtCollect();
    return { name, ingredients };
}

function mtUpdatePreview() {
    const el = document.getElementById('mtPreview');
    const ingredients = mtCollect();
    if (!ingredients.length) { el.innerHTML = '<span class="preview-empty">Нет ингредиентов</span>'; return; }
    const rangeOn = localStorage.getItem(RANGE_KEY) === 'range';
    const pctOk = ingredients.reduce((s, i) => s + ((i.pctMin + i.pctMax) / 2), 0);
    el.innerHTML = ingredients.map(i => {
        const pctStr = rangeOn ? (i.pctMin + '–' + i.pctMax + '%') : (i.pctMin + '%');
        return '<span class="preview-chip">' + i.name + ' <em>' + pctStr + '</em></span>';
    }).join('') +
    '<span class="preview-pct ' + (Math.abs(pctOk - 100) < 1 ? 'good' : 'bad') + '">' +
    Math.round(pctOk) + '%</span>';
}

function mtRenderGallery() {
    let recipes = {};
    try { recipes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch(e) {}
    const gallery = document.getElementById('mtGallery');
    const keys = Object.keys(recipes);
    if (!keys.length) { gallery.innerHTML = ''; return; }
    gallery.innerHTML = keys.map(k => {
        const ings = recipes[k];
        const pct = ings.reduce((s, i) => s + (i.pctMin + i.pctMax) / 2, 0);
        return '<div class="recipe-card" onclick="mtLoad(\'' + k.replace(/'/g, "\\'") + '\')">' +
            '<div class="card-name">' + k + '</div>' +
            '<div class="card-meta">' +
            '<span>' + ings.length + ' ингр.</span>' +
            '<span>' + Math.round(pct) + '%</span>' +
            '</div></div>';
    }).join('');
}

function mtSave() {
    const data = mtGetRecipeData();
    if (!data.ingredients.length) return;
    let recipes = {};
    try { recipes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch(e) {}
    recipes[data.name] = data.ingredients;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
    mtRenderGallery();
    mtToast('Рецепт "' + data.name + '" сохранён');
}

function mtLoad(name) {
    if (!name) return;
    let recipes = {};
    try { recipes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch(e) {}
    const data = recipes[name];
    if (!data) return;
    mtRecipeName.value = name;
    mtList.innerHTML = '';
    data.forEach(d => mtAddRow(d));
    document.getElementById('mtResults').classList.add('hidden');
    mtUpdatePreview();
    mtCalc();
}

function mtDelete() {
    const name = mtRecipeName.value.trim();
    if (!name) return;
    let recipes = {};
    try { recipes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch(e) {}
    delete recipes[name];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
    mtRenderGallery();
    mtList.innerHTML = '';
    mtAddRow({ name: 'Медь', pctMin: 70, pctMax: 80, rate: 144 });
    mtAddRow({ name: 'Олово', pctMin: 20, pctMax: 30, rate: 144 });
    document.getElementById('mtPreview').innerHTML = '<span class="preview-empty">Нет загруженного рецепта</span>';
    document.getElementById('mtResults').classList.add('hidden');
    mtToast('Рецепт "' + name + '" удалён');
}

function mtExport() {
    const data = mtGetRecipeData();
    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
        mtToast('JSON рецепта скопирован');
    });
}

function mtImport() {
    const json = prompt('Вставь JSON рецепта:');
    if (!json) return;
    try {
        const data = JSON.parse(json);
        if (!data.ingredients || !data.ingredients.length) throw 'no ingredients';
        mtRecipeName.value = data.name || 'Импорт';
        mtList.innerHTML = '';
        data.ingredients.forEach(d => mtAddRow(d));
        document.getElementById('mtResults').classList.add('hidden');
        mtUpdatePreview();
        mtCalc();
        mtToast('Рецепт импортирован');
    } catch(e) {
        mtToast('Ошибка: неверный JSON');
    }
}

// init
if (localStorage.getItem(RANGE_KEY) !== 'range') localStorage.setItem(RANGE_KEY, 'fixed');
mtApplyRange(localStorage.getItem(RANGE_KEY) === 'range');
mtRenderGallery();
mtReset();
