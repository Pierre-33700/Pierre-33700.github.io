(function () {
  'use strict';

  const ILLIMITE = 9999;

  // ---------------------------------------------------------------------------
  // Configuration des catégories.
  // Pour ajouter un nouveau type de produit (énergie, assurance…), il suffit
  // d'ajouter une entrée ici et un fichier de données dans data/.
  // (L'énergie, dont le coût dépend de la consommation, a son propre module : js/energie.js.)
  //
  // Types de critères :
  //   min      plus c'est grand, mieux c'est (data, débit)
  //   max      plus c'est petit, mieux c'est (engagement)
  //   bool     inclus / non inclus
  //   ordinal  liste ordonnée du moins bon au meilleur (techno, Wi-Fi)
  //   same     doit être identique (réseau)
  // ---------------------------------------------------------------------------
  const CATEGORIES = {
    mobile: {
      libelle: 'forfait mobile',
      offres: () => window.OFFRES_MOBILE || [],
      criteres: [
        { id: 'data', libelle: 'Data en France', type: 'min', unite: 'Go', illimite: true, defaut: 'indispensable', valeur: 100 },
        { id: 'appels', libelle: 'Appels & SMS illimités', type: 'bool', defaut: 'indispensable', valeur: true },
        { id: 'g5', libelle: '5G', type: 'bool', defaut: 'secondaire', valeur: false },
        { id: 'dataEurope', libelle: 'Data en Europe', type: 'min', unite: 'Go', defaut: 'secondaire', valeur: 15 },
        { id: 'reseau', libelle: 'Réseau', type: 'same', options: ['Orange', 'SFR', 'Bouygues', 'Free'], defaut: 'ignore', valeur: 'Orange' },
        { id: 'esim', libelle: 'eSIM', type: 'bool', defaut: 'ignore', valeur: false },
        { id: 'engagement', libelle: 'Engagement', type: 'max', unite: 'mois', defaut: 'indispensable', valeur: 0 },
      ],
    },
    internet: {
      libelle: 'offre internet',
      offres: () => window.OFFRES_INTERNET || [],
      criteres: [
        { id: 'techno', libelle: 'Technologie', type: 'ordinal', options: ['ADSL', 'VDSL', 'Fibre'], defaut: 'indispensable', valeur: 'Fibre' },
        { id: 'debitDown', libelle: 'Débit descendant', type: 'min', unite: 'Mbit/s', defaut: 'secondaire', valeur: 1000 },
        { id: 'debitUp', libelle: 'Débit montant', type: 'min', unite: 'Mbit/s', defaut: 'secondaire', valeur: 500 },
        { id: 'wifi', libelle: 'Wi-Fi', type: 'ordinal', options: ['Wi-Fi 5', 'Wi-Fi 6', 'Wi-Fi 6E', 'Wi-Fi 7'], defaut: 'secondaire', valeur: 'Wi-Fi 6' },
        { id: 'tv', libelle: 'TV incluse', type: 'bool', defaut: 'indispensable', valeur: true },
        { id: 'appels', libelle: 'Appels illimités fixes & mobiles', type: 'bool', defaut: 'secondaire', valeur: true },
        { id: 'engagement', libelle: 'Engagement', type: 'max', unite: 'mois', defaut: 'secondaire', valeur: 12 },
      ],
    },
  };

  const IMPORTANCES = [
    { id: 'indispensable', libelle: 'Indispensable' },
    { id: 'secondaire', libelle: 'Secondaire' },
    { id: 'ignore', libelle: 'Indifférent' },
  ];

  // ---------------------------------------------------------------------------
  // Utilitaires
  // ---------------------------------------------------------------------------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const euros = (v) => v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  const echapper = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

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

  function formaterValeur(c, v) {
    if (v === undefined || v === null || v === '') return '—';
    if (c.type === 'bool') return v ? 'Oui' : 'Non';
    if (c.type === 'min' || c.type === 'max') {
      if (c.illimite && v >= ILLIMITE) return 'Illimité';
      if (c.unite === 'Go' && v < 1) return Math.round(v * 1000) + ' Mo';
      if (c.unite === 'Mbit/s' && v >= 1000) return (v / 1000).toLocaleString('fr-FR') + ' Gbit/s';
      if (c.id === 'engagement' && v === 0) return 'Sans engagement';
      return v.toLocaleString('fr-FR') + ' ' + c.unite;
    }
    return v;
  }

  // ---------------------------------------------------------------------------
  // État
  // ---------------------------------------------------------------------------
  const etat = Object.assign(
    { vue: 'comparer', categorie: 'mobile', horizon: 24, tri: 'correspondance', saisies: {} },
    stockage.lire('etat', {})
  );
  let alertes = stockage.lire('alertes', []);

  function saisieParDefaut(idCat) {
    const cat = CATEGORIES[idCat];
    const s = { offreId: '', operateur: '', nom: '', prix: '', valeurs: {}, importances: {} };
    cat.criteres.forEach((c) => {
      s.valeurs[c.id] = c.valeur;
      s.importances[c.id] = c.defaut;
    });
    return s;
  }

  function saisie() {
    if (!etat.saisies[etat.categorie]) etat.saisies[etat.categorie] = saisieParDefaut(etat.categorie);
    return etat.saisies[etat.categorie];
  }

  const sauvegarder = () => stockage.ecrire('etat', etat);

  // ---------------------------------------------------------------------------
  // Moteur de comparaison (indépendant de l'affichage, réutilisé par les alertes)
  // ---------------------------------------------------------------------------

  // Coût mensuel moyen sur l'horizon, promotions et frais ponctuels inclus.
  function coutMoyen(offre, horizon) {
    const moisPromo = offre.prixPromo != null ? Math.min(offre.dureePromo || 0, horizon) : 0;
    const total = (offre.prixPromo || 0) * moisPromo + offre.prix * (horizon - moisPromo) + (offre.frais || 0);
    return total / horizon;
  }

  // Compare une caractéristique de l'offre à celle du forfait actuel.
  function comparer(c, actuel, offre) {
    if (actuel === undefined || actuel === null || actuel === '') return 'egal';
    switch (c.type) {
      case 'min': return offre > actuel ? 'mieux' : offre === actuel ? 'egal' : 'moins';
      case 'max': return offre < actuel ? 'mieux' : offre === actuel ? 'egal' : 'moins';
      case 'bool': return offre === actuel ? 'egal' : offre ? 'mieux' : 'moins';
      case 'ordinal': {
        const a = c.options.indexOf(actuel);
        const o = c.options.indexOf(offre);
        return o > a ? 'mieux' : o === a ? 'egal' : 'moins';
      }
      case 'same': return offre === actuel ? 'egal' : 'moins';
      default: return 'egal';
    }
  }

  // Retourne les offres respectant tous les critères indispensables et moins
  // chères que le forfait actuel, ou null si le prix actuel n'est pas renseigné.
  function analyser(idCat, s, horizon) {
    const cat = CATEGORIES[idCat];
    const prixActuel = parseFloat(s.prix);
    if (!(prixActuel > 0)) return null;
    const secondaires = cat.criteres.filter((c) => s.importances[c.id] === 'secondaire');

    return cat.offres()
      .filter((o) => o.id !== s.offreId)
      .map((o) => {
        const details = cat.criteres.map((c) => ({
          critere: c,
          importance: s.importances[c.id],
          verdict: comparer(c, s.valeurs[c.id], o[c.id]),
        }));
        const respecteIndispensables = details.every((d) => d.importance !== 'indispensable' || d.verdict !== 'moins');
        const secondairesOk = details.filter((d) => d.importance === 'secondaire' && d.verdict !== 'moins').length;
        const cout = coutMoyen(o, horizon);
        return {
          offre: o,
          details,
          respecteIndispensables,
          secondairesOk,
          nbSecondaires: secondaires.length,
          score: secondaires.length ? secondairesOk / secondaires.length : 1,
          cout,
          economie: prixActuel - cout,
        };
      })
      .filter((r) => r.respecteIndispensables && r.economie >= 0.01);
  }

  function trier(resultats, tri) {
    const parEconomie = (a, b) => b.economie - a.economie;
    return resultats.slice().sort(tri === 'correspondance' ? (a, b) => (b.score - a.score) || parEconomie(a, b) : parEconomie);
  }

  // ---------------------------------------------------------------------------
  // Formulaire
  // ---------------------------------------------------------------------------
  function champValeur(c, v) {
    const id = 'v-' + c.id;
    switch (c.type) {
      case 'bool':
        return `<label class="coche"><input type="checkbox" id="${id}" ${v ? 'checked' : ''}> Inclus</label>`;
      case 'ordinal':
      case 'same':
        return `<select id="${id}">${c.options.map((o) => `<option ${o === v ? 'selected' : ''}>${echapper(o)}</option>`).join('')}</select>`;
      default: {
        const illimite = c.illimite && v >= ILLIMITE;
        return `<input type="number" id="${id}" min="0" step="any" inputmode="decimal" value="${illimite ? '' : echapper(v)}" ${illimite ? 'disabled' : ''}>
          <span>${echapper(c.unite)}</span>
          ${c.illimite ? `<label class="coche"><input type="checkbox" id="${id}-illimite" ${illimite ? 'checked' : ''}> Illimité</label>` : ''}`;
      }
    }
  }

  function afficherFormulaire() {
    const cat = CATEGORIES[etat.categorie];
    const s = saisie();

    const parOperateur = {};
    cat.offres().forEach((o) => { (parOperateur[o.operateur] = parOperateur[o.operateur] || []).push(o); });
    $('#catalogue').innerHTML = '<option value="">— Mon offre n\'est pas dans la liste —</option>' +
      Object.keys(parOperateur).sort().map((op) =>
        `<optgroup label="${echapper(op)}">${parOperateur[op].map((o) =>
          `<option value="${o.id}">${echapper(o.nom)} — ${euros(o.prix)}/mois</option>`).join('')}</optgroup>`
      ).join('');
    $('#catalogue').value = s.offreId || '';
    $('#operateur').value = s.operateur;
    $('#nom').value = s.nom;
    $('#prix').value = s.prix;

    $('#criteres').innerHTML = cat.criteres.map((c) => `
      <div class="critere">
        <label class="critere-nom" for="v-${c.id}">${echapper(c.libelle)}</label>
        <div class="critere-valeur">${champValeur(c, s.valeurs[c.id])}</div>
        <div class="importance" role="radiogroup" aria-label="Importance : ${echapper(c.libelle)}">
          ${IMPORTANCES.map((i) => `<label class="pill"><input type="radio" name="imp-${c.id}" value="${i.id}" ${s.importances[c.id] === i.id ? 'checked' : ''}><span>${i.libelle}</span></label>`).join('')}
        </div>
      </div>`).join('');
  }

  function lireFormulaire() {
    const cat = CATEGORIES[etat.categorie];
    const s = saisie();
    s.operateur = $('#operateur').value.trim();
    s.nom = $('#nom').value.trim();
    s.prix = $('#prix').value;
    cat.criteres.forEach((c) => {
      const el = $('#v-' + c.id);
      if (c.type === 'bool') s.valeurs[c.id] = el.checked;
      else if (c.type === 'ordinal' || c.type === 'same') s.valeurs[c.id] = el.value;
      else {
        const illimite = c.illimite && $('#v-' + c.id + '-illimite').checked;
        el.disabled = illimite;
        s.valeurs[c.id] = illimite ? ILLIMITE : (el.value === '' ? '' : parseFloat(el.value));
      }
      const imp = document.querySelector(`input[name="imp-${c.id}"]:checked`);
      if (imp) s.importances[c.id] = imp.value;
    });
  }

  function choisirOffreCatalogue(id) {
    const cat = CATEGORIES[etat.categorie];
    const s = saisie();
    const o = cat.offres().find((x) => x.id === id);
    s.offreId = id;
    if (o) {
      s.operateur = o.operateur;
      s.nom = o.nom;
      s.prix = String(o.prix);
      cat.criteres.forEach((c) => { s.valeurs[c.id] = o[c.id]; });
    }
    afficherFormulaire();
  }

  // ---------------------------------------------------------------------------
  // Résultats
  // ---------------------------------------------------------------------------
  function afficherResultats() {
    const s = saisie();
    const resultats = analyser(etat.categorie, s, etat.horizon);
    const resume = $('#resume');
    const liste = $('#resultats');
    $('#alerte-ok').hidden = true;

    if (resultats === null) {
      resume.className = 'resume vide';
      resume.textContent = 'Renseignez le prix que vous payez actuellement pour voir les offres moins chères.';
      liste.innerHTML = '';
      $('#zone-alerte').hidden = true;
      return;
    }

    $('#zone-alerte').hidden = false;
    const tries = trier(resultats, etat.tri);
    const prixActuel = parseFloat(s.prix);

    if (!tries.length) {
      resume.className = 'resume vide';
      resume.innerHTML = `Aucune offre du catalogue ne respecte tous vos critères indispensables pour moins de <strong>${euros(prixActuel)}/mois</strong>.
        Votre forfait est déjà bien placé ! Vous pouvez assouplir certains critères, ou créer une alerte pour être prévenu si une offre apparaît.`;
      liste.innerHTML = '';
      return;
    }

    const meilleur = trier(resultats, 'economie')[0];
    resume.className = 'resume';
    resume.innerHTML = `<strong>${tries.length} offre${tries.length > 1 ? 's' : ''}</strong> équivalente${tries.length > 1 ? 's' : ''} moins chère${tries.length > 1 ? 's' : ''}.
      Jusqu'à <strong>${euros(meilleur.economie * 12)} d'économie par an</strong>
      (coût moyen calculé sur ${etat.horizon} mois, promotions et frais d'activation inclus).`;

    liste.innerHTML = tries.map((r) => carteOffre(r, prixActuel)).join('');
  }

  function carteOffre(r, prixActuel) {
    const o = r.offre;
    const promo = o.prixPromo != null
      ? `${euros(o.prixPromo)} pendant ${o.dureePromo} mois, puis ${euros(o.prix)}`
      : `${euros(o.prix)}/mois`;
    const frais = o.frais ? ` · ${euros(o.frais)} de frais d'activation` : '';
    const caracs = r.details
      .filter((d) => d.importance !== 'ignore' || d.verdict === 'mieux')
      .map((d) => {
        const signe = d.verdict === 'mieux' ? '▲ ' : d.verdict === 'moins' ? '▼ ' : '';
        return `<li class="carac ${d.verdict}" title="${echapper(d.critere.libelle)}">${signe}${echapper(d.critere.libelle)} : ${echapper(formaterValeur(d.critere, o[d.critere.id]))}</li>`;
      }).join('');
    const hausse = o.prix > prixActuel
      ? `<p class="note">⚠️ Après la promotion, le prix passe à ${euros(o.prix)}/mois, soit plus que votre forfait actuel : pensez à re-comparer à ce moment-là.</p>`
      : '';
    const score = r.nbSecondaires
      ? `<div class="score">Critères secondaires respectés : ${r.secondairesOk}/${r.nbSecondaires}</div>`
      : '';
    return `
      <li class="offre">
        <div class="offre-haut">
          <div>
            <div class="offre-op">${echapper(o.operateur)}</div>
            <div class="offre-nom">${echapper(o.nom)}</div>
          </div>
          <div class="offre-prix">
            <strong>${euros(r.cout)}</strong><span class="detail"> /mois en moyenne</span>
            <div class="detail">${promo}${frais}</div>
            <span class="economie">− ${euros(r.economie * 12)} / an</span>
          </div>
        </div>
        <ul class="caracs">${caracs}</ul>
        ${score}
        ${hausse}
      </li>`;
  }

  // ---------------------------------------------------------------------------
  // Alertes de prix
  // ---------------------------------------------------------------------------
  const signature = (r) => r.offre.id + '@' + r.cout.toFixed(2);

  function evaluerAlerte(a) {
    const resultats = analyser(a.categorie, a.saisie, a.horizon) || [];
    const meilleur = trier(resultats, 'economie')[0];
    return { alerte: a, meilleur, declenchee: !!meilleur && meilleur.economie >= a.seuil };
  }

  function libelleForfait(a) {
    const s = a.saisie;
    const nom = [s.operateur, s.nom].filter(Boolean).join(' – ') || 'Mon ' + CATEGORIES[a.categorie].libelle;
    return `${nom} (${euros(parseFloat(s.prix))}/mois)`;
  }

  function creerAlerte() {
    lireFormulaire();
    const seuil = Math.max(0, parseFloat($('#seuil').value) || 0);
    const a = {
      id: Date.now().toString(36),
      categorie: etat.categorie,
      horizon: etat.horizon,
      seuil,
      saisie: JSON.parse(JSON.stringify(saisie())),
      creeLe: new Date().toISOString(),
      dernierNotifie: null,
    };
    // Les offres déjà visibles au moment de la création ne déclenchent pas de notification.
    const ev = evaluerAlerte(a);
    if (ev.declenchee) a.dernierNotifie = signature(ev.meilleur);
    alertes.push(a);
    stockage.ecrire('alertes', alertes);
    const ok = $('#alerte-ok');
    ok.hidden = false;
    ok.textContent = `✓ Alerte créée : vous serez prévenu dès qu'une offre vous fera économiser au moins ${euros(seuil)}/mois.`;
    afficherCompteur();
  }

  function verifierAlertes() {
    const evaluations = alertes.map(evaluerAlerte);
    const nouvelles = evaluations.filter((e) => e.declenchee && e.alerte.dernierNotifie !== signature(e.meilleur));

    nouvelles.forEach((e) => {
      notifier(
        'Un forfait moins cher est disponible',
        `${e.meilleur.offre.operateur} ${e.meilleur.offre.nom} : ${euros(e.meilleur.economie * 12)} d'économie par an par rapport à ${libelleForfait(e.alerte)}.`
      );
      e.alerte.dernierNotifie = signature(e.meilleur);
    });
    if (nouvelles.length) stockage.ecrire('alertes', alertes);

    const bandeau = $('#bandeau-alertes');
    if (nouvelles.length) {
      bandeau.hidden = false;
      bandeau.innerHTML = `<strong>🔔 Bonne nouvelle !</strong> De nouvelles offres correspondent à vos alertes :
        <ul>${nouvelles.map((e) => `<li>${echapper(e.meilleur.offre.operateur)} ${echapper(e.meilleur.offre.nom)} — ${euros(e.meilleur.economie * 12)}/an d'économie sur ${echapper(libelleForfait(e.alerte))}</li>`).join('')}</ul>`;
    } else {
      bandeau.hidden = true;
    }
    return evaluations;
  }

  function notifier(titre, corps) {
    try {
      if ('Notification' in window && Notification.permission === 'granted') new Notification(titre, { body: corps });
    } catch (e) { /* notifications indisponibles */ }
  }

  function afficherEtatNotifs() {
    const el = $('#etat-notifs');
    const bouton = $('#activer-notifs');
    if (!('Notification' in window)) {
      bouton.hidden = true;
      el.textContent = 'Votre navigateur ne gère pas les notifications.';
    } else if (Notification.permission === 'granted') {
      bouton.hidden = true;
      el.textContent = '✓ Notifications activées.';
    } else if (Notification.permission === 'denied') {
      bouton.hidden = true;
      el.textContent = 'Notifications bloquées dans les réglages du navigateur.';
    }
  }

  function afficherAlertes() {
    const evaluations = alertes.map(evaluerAlerte);
    const liste = $('#liste-alertes');
    if (!evaluations.length) {
      liste.innerHTML = '<li class="aide">Aucune alerte pour l\'instant. Créez-en une depuis l\'onglet « Comparer », sous les résultats.</li>';
      return;
    }
    liste.innerHTML = evaluations.map((e) => {
      const a = e.alerte;
      const statut = e.declenchee
        ? `✅ Meilleure offre : <strong>${echapper(e.meilleur.offre.operateur)} ${echapper(e.meilleur.offre.nom)}</strong> — ${euros(e.meilleur.economie)}/mois d'économie`
        : `⏳ Pas encore d'offre faisant économiser ${euros(a.seuil)}/mois`;
      return `
        <li class="alerte ${e.declenchee ? 'declenchee' : ''}">
          <div>
            <div class="offre-op">${a.categorie === 'mobile' ? '📱 Mobile' : '🏠 Internet fixe'} · créée le ${new Date(a.creeLe).toLocaleDateString('fr-FR')}</div>
            <div class="offre-nom">${echapper(libelleForfait(a))}</div>
            <div class="aide">Seuil : ${euros(a.seuil)}/mois · ${statut}</div>
          </div>
          <div class="alerte-actions">
            <button type="button" class="bouton secondaire petit" data-ouvrir="${a.id}">Revoir</button>
            <button type="button" class="bouton danger petit" data-supprimer="${a.id}">Supprimer</button>
          </div>
        </li>`;
    }).join('');
  }

  function afficherCompteur() {
    const el = $('#nb-alertes');
    el.hidden = !alertes.length;
    el.textContent = alertes.length;
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------
  function changerVue(vue) {
    etat.vue = vue;
    $$('.onglet').forEach((b) => b.classList.toggle('actif', b.dataset.vue === vue));
    $('#vue-comparer').hidden = vue !== 'comparer';
    $('#vue-alertes').hidden = vue !== 'alertes';
    if (vue === 'alertes') { afficherAlertes(); afficherEtatNotifs(); }
    sauvegarder();
  }

  function changerCategorie(idCat) {
    etat.categorie = idCat;
    $$('.segment-btn[data-categorie]').forEach((b) => {
      b.classList.toggle('actif', b.dataset.categorie === idCat);
      b.setAttribute('aria-selected', b.dataset.categorie === idCat);
    });
    // L'énergie a son propre formulaire (js/energie.js) : le coût dépend de la consommation.
    const energie = idCat === 'energie';
    $('#bloc-forfaits').hidden = energie;
    $('#bloc-energie').hidden = !energie;
    if (energie) {
      window.Energie.afficher();
    } else {
      afficherFormulaire();
      afficherResultats();
    }
    sauvegarder();
  }

  // ---------------------------------------------------------------------------
  // Initialisation
  // ---------------------------------------------------------------------------
  function init() {
    $$('.onglet').forEach((b) => b.addEventListener('click', () => changerVue(b.dataset.vue)));
    $$('.segment-btn[data-categorie]').forEach((b) => b.addEventListener('click', () => changerCategorie(b.dataset.categorie)));

    $('#catalogue').addEventListener('change', (e) => {
      choisirOffreCatalogue(e.target.value);
      afficherResultats();
      sauvegarder();
    });
    $('#formulaire').addEventListener('input', (e) => {
      if (e.target.id === 'catalogue') return;
      lireFormulaire();
      afficherResultats();
      sauvegarder();
    });

    $('#horizon').value = String(etat.horizon);
    $('#horizon').addEventListener('change', (e) => { etat.horizon = parseInt(e.target.value, 10); afficherResultats(); sauvegarder(); });
    $('#tri').value = etat.tri;
    $('#tri').addEventListener('change', (e) => { etat.tri = e.target.value; afficherResultats(); sauvegarder(); });

    $('#creer-alerte').addEventListener('click', creerAlerte);
    $('#activer-notifs').addEventListener('click', () => {
      if ('Notification' in window) Notification.requestPermission().then(afficherEtatNotifs);
    });
    $('#liste-alertes').addEventListener('click', (e) => {
      const ouvrir = e.target.dataset.ouvrir;
      const supprimer = e.target.dataset.supprimer;
      if (ouvrir) {
        const a = alertes.find((x) => x.id === ouvrir);
        etat.saisies[a.categorie] = JSON.parse(JSON.stringify(a.saisie));
        etat.horizon = a.horizon;
        $('#horizon').value = String(a.horizon);
        changerCategorie(a.categorie);
        changerVue('comparer');
      } else if (supprimer) {
        alertes = alertes.filter((x) => x.id !== supprimer);
        stockage.ecrire('alertes', alertes);
        afficherAlertes();
        afficherCompteur();
      }
    });

    $('#statut-donnees').textContent = 'Données d\'exemple : tarifs et caractéristiques indicatifs, à vérifier auprès des opérateurs avant toute souscription.';

    changerCategorie(etat.categorie);
    changerVue(etat.vue);
    afficherCompteur();
    verifierAlertes();
  }

  init();
})();
