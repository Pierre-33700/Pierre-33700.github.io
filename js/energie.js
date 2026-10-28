(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Comparateur d'offres d'énergie (électricité / gaz).
  // Contrairement aux forfaits, le coût dépend de la consommation : on calcule
  // un coût annuel (abonnement + kWh) pour chaque offre du catalogue.
  // ---------------------------------------------------------------------------
  const PUISSANCES = [3, 6, 9, 12, 15, 18, 24, 30, 36];
  const PENTE_DEFAUT = 1.4;
  const MAX_AFFICHEES = 10;
  const TYPES_PRIX = { fixe: 'Prix fixe', indexe: 'Prix indexé', reglemente: 'Tarif réglementé' };

  const DEFAUTS = {
    electricite: { conso: 4500, puissance: 6, option: 'base', partHC: 40, offreId: '', kwh: '', hp: '', hc: '', abo: '', total: '' },
    gaz: { conso: 11000, offreId: '', kwh: '', abo: '', total: '' },
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const euros = (v) => v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  const eurosRond = (v) => v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const prixKwh = (v) => v.toLocaleString('fr-FR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }) + ' €';
  const echapper = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nombre = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };

  const stockage = {
    lire(cle, defaut) {
      try {
        const v = localStorage.getItem('comparateur.' + cle);
        return v ? JSON.parse(v) : defaut;
      } catch (e) {
        return defaut;
      }
    },
    ecrire(cle, valeur) {
      try { localStorage.setItem('comparateur.' + cle, JSON.stringify(valeur)); } catch (e) { /* stockage indisponible */ }
    },
  };

  // ---------------------------------------------------------------------------
  // État
  // ---------------------------------------------------------------------------
  const etat = Object.assign(
    { energie: 'electricite', tri: 'an1', prefs: { fixe: false, verte: false, sansEngagement: false }, saisies: {} },
    stockage.lire('energie', {})
  );
  let fichier = null; // dernier fichier importé (gardé en mémoire pour changer d'unité)

  const sauvegarder = () => stockage.ecrire('energie', etat);
  const catalogue = () => (window.OFFRES_ENERGIE && window.OFFRES_ENERGIE.offres) || [];
  const offres = () => catalogue().filter((o) => o.energie === etat.energie);

  function saisie() {
    if (!etat.saisies[etat.energie]) etat.saisies[etat.energie] = Object.assign({}, DEFAUTS[etat.energie]);
    return etat.saisies[etat.energie];
  }

  // ---------------------------------------------------------------------------
  // Moteur de calcul
  // ---------------------------------------------------------------------------
  function aboElec(o, kva, hc) {
    const base6 = hc ? (o.aboHC6 ?? o.abo6) : o.abo6;
    return Math.max(0, base6 + (kva - 6) * (o.pente ?? PENTE_DEFAUT));
  }

  // Formules de facturation possibles pour une offre : une seule en gaz, Base
  // (et Heures creuses si l'utilisateur a un compteur HP/HC) en électricité.
  function formules(o, s) {
    const conso = nombre(s.conso);
    if (o.energie === 'gaz') return [{ option: null, abo: o.abo, energie: conso * o.kwh }];
    const kva = parseInt(s.puissance, 10);
    const part = (nombre(s.partHC) ?? 0) / 100;
    const liste = [];
    if (o.kwhBase != null) liste.push({ option: 'base', abo: aboElec(o, kva, false), energie: conso * o.kwhBase });
    if (s.option === 'hc' && o.kwhHP != null && o.kwhHC != null) {
      liste.push({ option: 'hc', abo: aboElec(o, kva, true), energie: conso * ((1 - part) * o.kwhHP + part * o.kwhHC) });
    }
    return liste;
  }

  // Coût annuel en régime normal et la 1re année (remise et bonus de bienvenue inclus).
  function couts(o, f) {
    const regime = f.abo * 12 + f.energie;
    const moisRemise = Math.min(o.remiseMois || 0, 12);
    const remise = regime * ((o.remisePct || 0) / 100) * (moisRemise / 12);
    return { regime, an1: regime - remise - (o.bonus || 0) };
  }

  // Coût annuel de l'offre actuelle, ou null s'il manque des informations.
  function coutActuel(s) {
    const total = nombre(s.total);
    if (total > 0) return total;
    const abo = nombre(s.abo);
    const conso = nombre(s.conso);
    if (abo === null || conso === null) return null;
    if (etat.energie === 'electricite' && s.option === 'hc') {
      const hp = nombre(s.hp);
      const hc = nombre(s.hc);
      if (hp === null || hc === null) return null;
      const part = (nombre(s.partHC) ?? 0) / 100;
      return abo * 12 + conso * ((1 - part) * hp + part * hc);
    }
    const kwh = nombre(s.kwh);
    return kwh === null ? null : abo * 12 + conso * kwh;
  }

  function analyser(s) {
    const conso = nombre(s.conso);
    if (!(conso > 0)) return null;
    const actuel = coutActuel(s);
    const cle = etat.tri === 'regime' ? 'regime' : 'an1';
    const p = etat.prefs;

    const resultats = offres()
      .filter((o) => o.id !== s.offreId)
      .filter((o) => !p.fixe || o.prixType === 'fixe')
      .filter((o) => !p.verte || o.verte)
      .filter((o) => !p.sansEngagement || !o.engagement)
      .map((o) => {
        const choix = formules(o, s)
          .map((f) => Object.assign({ formule: f }, couts(o, f)))
          .sort((a, b) => a[cle] - b[cle])[0];
        if (!choix) return null;
        return {
          offre: o,
          formule: choix.formule,
          an1: choix.an1,
          regime: choix.regime,
          economieAn1: actuel === null ? null : actuel - choix.an1,
          economieRegime: actuel === null ? null : actuel - choix.regime,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a[cle] - b[cle]);

    const cheaper = actuel === null ? resultats : resultats.filter((r) => (cle === 'regime' ? r.economieRegime : r.economieAn1) >= 1);
    return { actuel, resultats: cheaper, total: resultats.length };
  }

  // ---------------------------------------------------------------------------
  // Lecture d'un fichier de consommation (CSV Enedis / GRDF / générique, JSON)
  // ---------------------------------------------------------------------------
  function lireDate(texte) {
    const t = String(texte).trim();
    let m = t.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
    if (m) return Date.UTC(+m[1], m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
    m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2}))?/);
    if (m) return Date.UTC(+m[3], m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0));
    return NaN;
  }

  function lireNombre(texte) {
    const t = String(texte ?? '').replace(/[\s ]/g, '').replace(',', '.');
    return /^-?\d+(\.\d+)?$/.test(t) ? parseFloat(t) : NaN;
  }

  function pointsCsv(texte) {
    const lignes = texte.split(/\r?\n/).filter((l) => l.trim());
    const echantillon = lignes.slice(0, 50);
    const sep = [';', '\t', ','].map((c) => ({ c, n: echantillon.reduce((n, l) => n + l.split(c).length - 1, 0) }))
      .sort((a, b) => b.n - a.n)[0].c;
    const lignesCellules = lignes.map((l) => l.split(sep).map((c) => c.trim().replace(/^"|"$/g, '')));

    const premiere = lignesCellules.findIndex((r) => r.some((c) => !Number.isNaN(lireDate(c))));
    if (premiere < 0) throw new Error('Aucune date reconnue dans le fichier (formats AAAA-MM-JJ ou JJ/MM/AAAA attendus).');
    const entete = premiere > 0 ? lignesCellules[premiere - 1] : [];
    const modele = lignesCellules[premiere];
    const colsDate = modele.map((c, i) => (Number.isNaN(lireDate(c)) ? -1 : i)).filter((i) => i >= 0);
    const idxDate = colsDate[0];

    const idxHP = entete.findIndex((h) => /heures?\s+pleines|\bhp\b/i.test(h));
    const idxHC = entete.findIndex((h) => /heures?\s+creuses|\bhc\b/i.test(h));
    const separe = idxHP >= 0 && idxHC >= 0;

    let idxValeur = entete.findIndex((h, i) => !colsDate.includes(i) && /conso|valeur|energ|énerg|volume|kwh|\bwh\b/i.test(h));
    if (idxValeur < 0) idxValeur = modele.findIndex((c, i) => !colsDate.includes(i) && !Number.isNaN(lireNombre(c)));
    if (!separe && idxValeur < 0) throw new Error('Aucune colonne de consommation reconnue dans le fichier.');

    const indice = [...lignesCellules.slice(0, premiere).flat(), separe ? entete[idxHP] : entete[idxValeur]].join(' ');
    const points = [];
    lignesCellules.slice(premiere).forEach((r) => {
      const t = lireDate(r[idxDate]);
      if (Number.isNaN(t)) return;
      if (separe) {
        const hp = lireNombre(r[idxHP]);
        const hc = lireNombre(r[idxHC]);
        if (!Number.isNaN(hp) && !Number.isNaN(hc)) points.push({ t, v: hp + hc, hc });
      } else {
        const v = lireNombre(r[idxValeur]);
        if (!Number.isNaN(v)) points.push({ t, v });
      }
    });
    return { points, indice };
  }

  function pointsJson(texte) {
    const objet = JSON.parse(texte);
    const trouver = (n) => {
      if (Array.isArray(n)) {
        if (n.length && n[0] && typeof n[0] === 'object' && 'value' in n[0]) return n;
        for (const x of n) { const r = trouver(x); if (r) return r; }
      } else if (n && typeof n === 'object') {
        for (const k of Object.keys(n)) { const r = trouver(n[k]); if (r) return r; }
      }
      return null;
    };
    const tableau = trouver(objet);
    if (!tableau) throw new Error('Format JSON non reconnu (liste de relevés avec « date » et « value » attendue).');
    const points = tableau.map((x) => ({
      t: lireDate(x.date || x.start || x.horodate || x.dateDebut || ''),
      v: lireNombre(x.value),
    }));
    const unite = texte.match(/"unit"\s*:\s*"([^"]+)"/);
    return { points, indice: unite ? unite[1] : '' };
  }

  // Retourne la période couverte, le total, et une estimation de la consommation annuelle.
  function lireConsommation(texte, uniteForcee) {
    const propre = texte.replace(/^﻿/, '').trim();
    const { points: brut, indice } = /^[[{]/.test(propre) ? pointsJson(propre) : pointsCsv(propre);

    const parDate = new Map();
    brut.filter((p) => !Number.isNaN(p.t) && !Number.isNaN(p.v)).forEach((p) => parDate.set(p.t, p));
    const points = Array.from(parDate.values()).sort((a, b) => a.t - b.t);
    if (points.length < 2) throw new Error('Pas assez de relevés exploitables dans le fichier.');

    let unite = uniteForcee;
    if (unite === 'auto') {
      if (/kwh/i.test(indice)) unite = 'kWh';
      else if (/(^|[^k])wh\b/i.test(indice)) unite = 'Wh';
      else if (/\(\s*w\s*\)|puissance|\bW\b/.test(indice)) unite = 'W';
      else unite = Math.max(...points.map((p) => p.v)) >= 1000 ? 'Wh' : 'kWh';
    }

    const ecarts = points.slice(1).map((p, i) => p.t - points[i].t).sort((a, b) => a - b);
    const pas = ecarts[Math.floor(ecarts.length / 2)] || 86400000;
    const facteur = unite === 'kWh' ? 1 : unite === 'Wh' ? 0.001 : (pas / 3600000) / 1000;

    const total = points.reduce((n, p) => n + p.v * facteur, 0);
    const jours = (points[points.length - 1].t - points[0].t) / 86400000 + pas / 86400000;
    const hc = points.some((p) => p.hc !== undefined) ? points.reduce((n, p) => n + (p.hc || 0) * facteur, 0) : null;
    return {
      nb: points.length,
      debut: points[0].t,
      fin: points[points.length - 1].t,
      jours,
      total,
      annuel: total / jours * 365,
      unite,
      partHC: hc !== null && total > 0 ? Math.round(hc / total * 100) : null,
    };
  }

  function traiterFichier() {
    const zone = $('#e-import-resultat');
    if (!fichier) return;
    zone.hidden = false;
    try {
      const r = lireConsommation(fichier.texte, $('#e-unite').value);
      const s = saisie();
      s.conso = Math.round(r.annuel);
      if (r.partHC !== null && etat.energie === 'electricite') { s.partHC = r.partHC; s.option = 'hc'; }
      const date = (t) => new Date(t).toLocaleDateString('fr-FR', { timeZone: 'UTC' });
      const jours = Math.round(r.jours);
      zone.className = 'resume';
      zone.innerHTML = `✓ <strong>${echapper(fichier.nom)}</strong> : ${r.nb.toLocaleString('fr-FR')} relevés du ${date(r.debut)} au ${date(r.fin)}
        (${jours} jours), unité ${echapper(r.unite)}, total ${Math.round(r.total).toLocaleString('fr-FR')} kWh
        → consommation annuelle estimée <strong>${s.conso.toLocaleString('fr-FR')} kWh</strong>.` +
        (r.partHC !== null ? ` Part d'heures creuses : ${r.partHC} %.` : '') +
        (jours < 60 ? '<br>⚠️ Période courte : l\'estimation annuelle est peu fiable (saisonnalité). Idéalement, importez 12 mois.' : '') +
        '<br>Vérifiez que l\'unité détectée est correcte, sinon changez-la ci-dessus.';
      afficherFormulaire();
      afficherResultats();
      sauvegarder();
    } catch (e) {
      zone.className = 'resume vide';
      zone.textContent = '⚠️ ' + (e instanceof SyntaxError ? 'Fichier JSON invalide.' : e.message);
    }
  }

  // ---------------------------------------------------------------------------
  // Formulaire
  // ---------------------------------------------------------------------------
  function majVisibilite() {
    const s = saisie();
    const elec = etat.energie === 'electricite';
    const hc = elec && s.option === 'hc';
    $$('#form-energie [data-elec]').forEach((el) => { el.hidden = !elec; });
    $$('#form-energie [data-hc]').forEach((el) => { el.hidden = !hc; });
    $$('#form-energie [data-base]').forEach((el) => { el.hidden = hc; });
    $('#e-libelle-conso').textContent = elec ? 'Consommation annuelle d\'électricité' : 'Consommation annuelle de gaz';
  }

  function afficherFormulaire() {
    const s = saisie();
    $$('.segment-btn[data-energie]').forEach((b) => {
      b.classList.toggle('actif', b.dataset.energie === etat.energie);
      b.setAttribute('aria-selected', b.dataset.energie === etat.energie);
    });

    const parOperateur = {};
    offres().forEach((o) => { (parOperateur[o.operateur] = parOperateur[o.operateur] || []).push(o); });
    $('#e-catalogue').innerHTML = '<option value="">— Mon offre n\'est pas dans la liste —</option>' +
      Object.keys(parOperateur).sort().map((op) =>
        `<optgroup label="${echapper(op)}">${parOperateur[op].map((o) =>
          `<option value="${o.id}">${echapper(o.nom)}</option>`).join('')}</optgroup>`).join('');
    $('#e-catalogue').value = s.offreId || '';

    $('#e-conso').value = s.conso;
    if (etat.energie === 'electricite') {
      $('#e-puissance').innerHTML = PUISSANCES.map((p) => `<option value="${p}" ${Number(s.puissance) === p ? 'selected' : ''}>${p} kVA</option>`).join('');
      $('#e-option').value = s.option;
      $('#e-parthc').value = s.partHC;
      $('#e-hp').value = s.hp;
      $('#e-hc').value = s.hc;
    }
    $('#e-kwh').value = s.kwh;
    $('#e-abo').value = s.abo;
    $('#e-total').value = s.total;

    $('#e-fixe').checked = etat.prefs.fixe;
    $('#e-verte').checked = etat.prefs.verte;
    $('#e-sans-engagement').checked = etat.prefs.sansEngagement;
    $('#e-tri').value = etat.tri;
    $('#e-maj').textContent = 'Catalogue : ' + ((window.OFFRES_ENERGIE && window.OFFRES_ENERGIE.misAJour) || 'inconnu') + '.';
    majVisibilite();
  }

  function lireFormulaire() {
    const s = saisie();
    s.conso = $('#e-conso').value;
    if (etat.energie === 'electricite') {
      s.puissance = $('#e-puissance').value;
      s.option = $('#e-option').value;
      s.partHC = $('#e-parthc').value;
      s.hp = $('#e-hp').value;
      s.hc = $('#e-hc').value;
    }
    s.kwh = $('#e-kwh').value;
    s.abo = $('#e-abo').value;
    s.total = $('#e-total').value;
    etat.prefs.fixe = $('#e-fixe').checked;
    etat.prefs.verte = $('#e-verte').checked;
    etat.prefs.sansEngagement = $('#e-sans-engagement').checked;
    etat.tri = $('#e-tri').value;
  }

  // Pré-remplit les prix avec ceux de l'offre choisie dans le catalogue.
  function choisirOffre(id) {
    const s = saisie();
    const o = offres().find((x) => x.id === id);
    s.offreId = id;
    if (!o) return;
    s.total = '';
    if (o.energie === 'gaz') {
      s.kwh = o.kwh;
      s.abo = o.abo;
      return;
    }
    const hc = o.kwhBase == null || (s.option === 'hc' && o.kwhHP != null);
    s.option = hc ? 'hc' : 'base';
    s.abo = Math.round(aboElec(o, parseInt(s.puissance, 10), hc) * 100) / 100;
    if (hc) { s.hp = o.kwhHP; s.hc = o.kwhHC; } else s.kwh = o.kwhBase;
  }

  // ---------------------------------------------------------------------------
  // Résultats
  // ---------------------------------------------------------------------------
  function afficherResultats() {
    const s = saisie();
    const resume = $('#e-resume');
    const liste = $('#e-resultats');
    const a = analyser(s);

    if (a === null) {
      resume.className = 'resume vide';
      resume.textContent = 'Renseignez votre consommation annuelle (en kWh) pour voir les meilleures offres.';
      liste.innerHTML = '';
      return;
    }

    if (!a.resultats.length) {
      resume.className = 'resume vide';
      resume.innerHTML = a.total
        ? `Aucune offre du catalogue ne vous ferait économiser au moins 1 €/an avec ces préférences : votre offre actuelle (<strong>${eurosRond(a.actuel)}/an</strong>) est déjà bien placée.`
        : 'Aucune offre du catalogue ne correspond à ces préférences.';
      liste.innerHTML = '';
      return;
    }

    const meilleure = a.resultats[0];
    const sup = a.resultats.length > MAX_AFFICHEES ? ` (les ${MAX_AFFICHEES} meilleures sont affichées)` : '';
    resume.className = 'resume';
    if (a.actuel === null) {
      resume.innerHTML = `Indiquez votre offre actuelle pour calculer votre économie. En attendant, voici les offres les moins chères pour <strong>${Number(s.conso).toLocaleString('fr-FR')} kWh/an</strong>${sup}.`;
    } else {
      const eco = etat.tri === 'regime' ? meilleure.economieRegime : meilleure.economieAn1;
      resume.innerHTML = `<strong>${a.resultats.length} offre${a.resultats.length > 1 ? 's' : ''}</strong> moins chère${a.resultats.length > 1 ? 's' : ''} que votre offre actuelle (<strong>${eurosRond(a.actuel)}/an</strong>)${sup}.
        Jusqu'à <strong>${eurosRond(eco)} d'économie par an</strong>${etat.tri === 'regime' ? ' en régime normal' : ' la première année'}.`;
    }
    liste.innerHTML = a.resultats.slice(0, MAX_AFFICHEES).map((r, i) => carteOffre(r, i + 1, a.actuel)).join('');
  }

  function carteOffre(r, rang, actuel) {
    const o = r.offre;
    const f = r.formule;
    const promo = r.an1 < r.regime - 0.5;

    const chips = [];
    chips.push(`<li class="carac">${TYPES_PRIX[o.prixType] || ''}</li>`);
    if (o.verte) chips.push('<li class="carac mieux">🌱 Énergie verte</li>');
    chips.push(`<li class="carac">${o.engagement ? 'Engagement ' + o.engagement + ' mois' : 'Sans engagement'}</li>`);
    if (o.energie === 'gaz') {
      chips.push(`<li class="carac">kWh : ${prixKwh(o.kwh)}</li>`, `<li class="carac">Abonnement : ${euros(o.abo)}/mois</li>`);
    } else {
      chips.push(`<li class="carac">Option ${f.option === 'hc' ? 'Heures creuses' : 'Base'}</li>`);
      chips.push(f.option === 'hc'
        ? `<li class="carac">HP ${prixKwh(o.kwhHP)} · HC ${prixKwh(o.kwhHC)}</li>`
        : `<li class="carac">kWh : ${prixKwh(o.kwhBase)}</li>`);
      chips.push(`<li class="carac">Abonnement : ${euros(f.abo)}/mois</li>`);
    }
    if (o.remisePct) chips.push(`<li class="carac mieux">−${o.remisePct} % pendant ${Math.min(o.remiseMois || 12, 12)} mois</li>`);
    if (o.bonus) chips.push(`<li class="carac mieux">Bonus de ${eurosRond(o.bonus)}</li>`);

    const notes = [];
    if (actuel !== null && r.economieRegime < 0) {
      notes.push(`⚠️ Après la 1re année, cette offre coûte ${eurosRond(-r.economieRegime)}/an de plus que votre offre actuelle : pensez à re-comparer à ce moment-là.`);
    }
    if (o.prixType === 'indexe') notes.push('Prix indexé : le tarif peut évoluer à la hausse comme à la baisse pendant le contrat.');

    const economie = actuel === null ? '' : `<span class="economie">− ${eurosRond(r.economieAn1)} la 1re année</span>` +
      (promo && r.economieRegime > 0 ? `<div class="detail">puis − ${eurosRond(r.economieRegime)} / an</div>` : '');

    return `
      <li class="offre">
        <div class="offre-haut">
          <div>
            <div class="offre-op">#${rang} · ${echapper(o.operateur)}</div>
            <div class="offre-nom">${echapper(o.nom)}</div>
          </div>
          <div class="offre-prix">
            <strong>${eurosRond(r.an1)}</strong><span class="detail"> /an la 1re année</span>
            <div class="detail">soit ${euros(r.an1 / 12)}/mois${promo ? ` · puis ${eurosRond(r.regime)}/an` : ''}</div>
            ${economie}
          </div>
        </div>
        <ul class="caracs">${chips.join('')}</ul>
        ${notes.map((n) => `<p class="note">${echapper(n)}</p>`).join('')}
      </li>`;
  }

  // ---------------------------------------------------------------------------
  // Initialisation
  // ---------------------------------------------------------------------------
  function afficher() {
    afficherFormulaire();
    afficherResultats();
  }

  function init() {
    $$('.segment-btn[data-energie]').forEach((b) => b.addEventListener('click', () => {
      etat.energie = b.dataset.energie;
      $('#e-import-resultat').hidden = true;
      afficher();
      sauvegarder();
    }));

    $('#e-catalogue').addEventListener('change', (e) => {
      choisirOffre(e.target.value);
      afficher();
      sauvegarder();
    });

    $('#form-energie').addEventListener('input', (e) => {
      const id = e.target.id;
      if (id === 'e-catalogue' || id === 'e-fichier' || id === 'e-unite') return;
      lireFormulaire();
      const s = saisie();
      // Changer la puissance ou l'option met à jour les prix de l'offre choisie dans le catalogue.
      if ((id === 'e-puissance' || id === 'e-option') && s.offreId) {
        choisirOffre(s.offreId);
        afficherFormulaire();
      } else if (id === 'e-option') {
        majVisibilite();
      }
      afficherResultats();
      sauvegarder();
    });

    $('#e-fichier').addEventListener('change', async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const zone = $('#e-import-resultat');
      if (f.size > 100e6) {
        zone.hidden = false;
        zone.className = 'resume vide';
        zone.textContent = '⚠️ Fichier trop volumineux (100 Mo maximum).';
        return;
      }
      fichier = { nom: f.name, texte: await f.text() };
      traiterFichier();
    });
    $('#e-unite').addEventListener('change', traiterFichier);
  }

  init();
  window.Energie = { afficher };
})();
