// Catalogue des offres d'énergie (électricité et gaz naturel), prix TTC.
// ⚠️ Jeu de données d'exemple : tarifs indicatifs, à vérifier et à mettre à jour
// régulièrement auprès des fournisseurs (ou à partir de l'open data du Médiateur
// national de l'énergie / de la CRE).
//
// Champs communs :
//   id, energie ('electricite' | 'gaz'), operateur, nom
//   prixType    'fixe' (prix bloqué), 'indexe' (suit un indice) ou 'reglemente'
//   verte       énergie verte / renouvelable
//   engagement  durée d'engagement (mois), 0 = sans engagement
//   remisePct   remise (%) sur la facture pendant remiseMois mois (max. 12 pris en compte), optionnel
//   remiseMois  durée de la remise (mois), optionnel
//   bonus       avoir ou chèque de bienvenue (€), déduit de la 1re année, optionnel
//
// Électricité :
//   abo6        abonnement mensuel option Base pour 6 kVA (€)
//   aboHC6      abonnement mensuel option Heures creuses pour 6 kVA (€), si l'option existe
//   pente       supplément d'abonnement par kVA au-delà de 6 (€ / mois), défaut 1,4
//   kwhBase     prix du kWh en option Base (€), si l'option existe
//   kwhHP/kwhHC prix du kWh en heures pleines / creuses (€), si l'option existe
//
// Gaz :
//   abo         abonnement mensuel (€)
//   kwh         prix du kWh (€)
window.OFFRES_ENERGIE = {
  misAJour: 'exemple',
  offres: [
    // ---- Électricité ----
    { id: 'edf-tarif-bleu', energie: 'electricite', operateur: 'EDF', nom: 'Tarif Bleu (réglementé)', prixType: 'reglemente', verte: false, engagement: 0, abo6: 15.65, aboHC6: 15.96, kwhBase: 0.1952, kwhHP: 0.2081, kwhHC: 0.1635 },
    { id: 'edf-zen-fixe', energie: 'electricite', operateur: 'EDF', nom: 'Zen Fixe 1 an', prixType: 'fixe', verte: false, engagement: 12, abo6: 15.65, kwhBase: 0.1895 },
    { id: 'engie-elec-ref', energie: 'electricite', operateur: 'Engie', nom: 'Élec Référence 1 an', prixType: 'fixe', verte: false, engagement: 12, abo6: 15.48, aboHC6: 15.90, kwhBase: 0.1860, kwhHP: 0.1980, kwhHC: 0.1540 },
    { id: 'happ-e-fixe', energie: 'electricite', operateur: 'Happ-e by Engie', nom: 'Prix Fixe en ligne', prixType: 'fixe', verte: false, engagement: 0, abo6: 15.20, kwhBase: 0.1830 },
    { id: 'total-verte-fixe', energie: 'electricite', operateur: 'TotalEnergies', nom: 'Verte Fixe', prixType: 'fixe', verte: true, engagement: 0, abo6: 15.74, aboHC6: 16.10, kwhBase: 0.1915, kwhHP: 0.2040, kwhHC: 0.1590 },
    { id: 'mint-eco', energie: 'electricite', operateur: 'Mint Énergie', nom: 'Offre Verte Fixe', prixType: 'fixe', verte: true, engagement: 0, abo6: 14.90, aboHC6: 15.30, kwhBase: 0.1790, kwhHP: 0.1890, kwhHC: 0.1480 },
    { id: 'ohm-indexee', energie: 'electricite', operateur: 'OHM Énergie', nom: 'Offre indexée sur le tarif réglementé', prixType: 'indexe', verte: false, engagement: 0, abo6: 15.30, kwhBase: 0.1755 },
    { id: 'octopus-eco', energie: 'electricite', operateur: 'Octopus Energy', nom: 'Éco-conso (100 % verte)', prixType: 'fixe', verte: true, engagement: 0, abo6: 15.40, aboHC6: 15.80, kwhBase: 0.1840, kwhHP: 0.1950, kwhHC: 0.1520 },
    { id: 'ekwateur-verte', energie: 'electricite', operateur: 'Ekwateur', nom: 'Électricité verte fixe', prixType: 'fixe', verte: true, engagement: 0, abo6: 15.80, aboHC6: 16.20, kwhBase: 0.1930, kwhHP: 0.2060, kwhHC: 0.1620, bonus: 40 },
    { id: 'vattenfall-fixe', energie: 'electricite', operateur: 'Vattenfall', nom: 'Fixe 1 an', prixType: 'fixe', verte: false, engagement: 12, abo6: 15.10, aboHC6: 15.55, kwhBase: 0.1870, kwhHP: 0.1990, kwhHC: 0.1550, remisePct: 8, remiseMois: 12 },
    { id: 'plum-solaire', energie: 'electricite', operateur: 'Plüm énergie', nom: 'Kilowattheure Plüm', prixType: 'indexe', verte: true, engagement: 0, abo6: 14.60, kwhBase: 0.1815 },
    { id: 'enercoop-verte', energie: 'electricite', operateur: 'Enercoop', nom: 'Électricité 100 % renouvelable (coopérative)', prixType: 'fixe', verte: true, engagement: 0, abo6: 16.20, aboHC6: 16.60, kwhBase: 0.2085, kwhHP: 0.2210, kwhHC: 0.1760 },

    // ---- Gaz naturel ----
    { id: 'engie-gaz-ref', energie: 'gaz', operateur: 'Engie', nom: 'Gaz Référence (indexé sur le prix repère)', prixType: 'indexe', verte: false, engagement: 0, abo: 20.90, kwh: 0.1085 },
    { id: 'engie-gaz-fixe', energie: 'gaz', operateur: 'Engie', nom: 'Gaz Fixe 1 an', prixType: 'fixe', verte: false, engagement: 12, abo: 20.90, kwh: 0.1060 },
    { id: 'edf-gaz-fixe', energie: 'gaz', operateur: 'EDF', nom: 'Gaz Fixe 1 an', prixType: 'fixe', verte: false, engagement: 12, abo: 21.10, kwh: 0.1075 },
    { id: 'total-gaz-fixe', energie: 'gaz', operateur: 'TotalEnergies', nom: 'Gaz Fixe', prixType: 'fixe', verte: false, engagement: 0, abo: 21.50, kwh: 0.1050 },
    { id: 'eni-gaz-fixe', energie: 'gaz', operateur: 'Eni Plenitude', nom: 'Gaz prix fixe', prixType: 'fixe', verte: false, engagement: 0, abo: 20.40, kwh: 0.1090, remisePct: 10, remiseMois: 12 },
    { id: 'vattenfall-gaz', energie: 'gaz', operateur: 'Vattenfall', nom: 'Gaz Fixe 1 an', prixType: 'fixe', verte: false, engagement: 12, abo: 20.20, kwh: 0.1070 },
    { id: 'ohm-gaz', energie: 'gaz', operateur: 'OHM Énergie', nom: 'Gaz indexé', prixType: 'indexe', verte: false, engagement: 0, abo: 19.80, kwh: 0.1045 },
    { id: 'ekwateur-gaz-vert', energie: 'gaz', operateur: 'Ekwateur', nom: 'Gaz vert (biométhane)', prixType: 'fixe', verte: true, engagement: 0, abo: 21.90, kwh: 0.1220, bonus: 40 },
    { id: 'ilek-gaz-vert', energie: 'gaz', operateur: 'ilek', nom: 'Gaz vert local', prixType: 'fixe', verte: true, engagement: 0, abo: 22.30, kwh: 0.1180 },
  ],
};
