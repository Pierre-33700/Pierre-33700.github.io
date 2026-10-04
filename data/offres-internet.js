// Catalogue des offres internet fixe (box).
// ⚠️ Jeu de données d'exemple : tarifs et caractéristiques indicatifs, à vérifier
// et à mettre à jour régulièrement auprès des opérateurs.
//
// Champs :
//   prix        prix mensuel hors promotion (€)
//   prixPromo   prix mensuel pendant la promotion (€), optionnel
//   dureePromo  durée de la promotion (mois), optionnel
//   frais       frais ponctuels : mise en service (€)
//   techno      ADSL, VDSL ou Fibre
//   debitDown   débit descendant maximal (Mbit/s)
//   debitUp     débit montant maximal (Mbit/s)
//   wifi        norme Wi-Fi de la box
//   tv          décodeur / bouquet TV inclus
//   appels      appels illimités vers fixes et mobiles
//   engagement  durée d'engagement (mois)
window.OFFRES_INTERNET = [
  { id: 'freebox-revolution-light', operateur: 'Free', nom: 'Freebox Révolution Light', prix: 29.99, frais: 49, techno: 'Fibre', debitDown: 1000, debitUp: 600, wifi: 'Wi-Fi 5', tv: false, appels: true, engagement: 12 },
  { id: 'freebox-pop', operateur: 'Free', nom: 'Freebox Pop', prix: 39.99, prixPromo: 29.99, dureePromo: 12, frais: 49, techno: 'Fibre', debitDown: 5000, debitUp: 700, wifi: 'Wi-Fi 7', tv: true, appels: true, engagement: 12 },
  { id: 'freebox-ultra-essentiel', operateur: 'Free', nom: 'Freebox Ultra Essentiel', prix: 49.99, prixPromo: 39.99, dureePromo: 12, frais: 49, techno: 'Fibre', debitDown: 8000, debitUp: 8000, wifi: 'Wi-Fi 7', tv: true, appels: true, engagement: 12 },
  { id: 'freebox-ultra', operateur: 'Free', nom: 'Freebox Ultra', prix: 59.99, prixPromo: 49.99, dureePromo: 12, frais: 49, techno: 'Fibre', debitDown: 8000, debitUp: 8000, wifi: 'Wi-Fi 7', tv: true, appels: true, engagement: 12 },
  { id: 'orange-livebox-fibre', operateur: 'Orange', nom: 'Livebox Fibre', prix: 42.99, prixPromo: 23.99, dureePromo: 12, frais: 0, techno: 'Fibre', debitDown: 500, debitUp: 500, wifi: 'Wi-Fi 6', tv: true, appels: true, engagement: 12 },
  { id: 'orange-livebox-up', operateur: 'Orange', nom: 'Livebox Up Fibre', prix: 51.99, prixPromo: 31.99, dureePromo: 12, frais: 0, techno: 'Fibre', debitDown: 2000, debitUp: 800, wifi: 'Wi-Fi 6E', tv: true, appels: true, engagement: 12 },
  { id: 'orange-livebox-max', operateur: 'Orange', nom: 'Livebox Max Fibre', prix: 59.99, prixPromo: 39.99, dureePromo: 12, frais: 0, techno: 'Fibre', debitDown: 5000, debitUp: 1000, wifi: 'Wi-Fi 7', tv: true, appels: true, engagement: 12 },
  { id: 'sosh-boite-fibre', operateur: 'Sosh', nom: 'Boîte Fibre', prix: 25.99, frais: 48, techno: 'Fibre', debitDown: 400, debitUp: 400, wifi: 'Wi-Fi 6', tv: false, appels: true, engagement: 0 },
  { id: 'sfr-fibre-power', operateur: 'SFR', nom: 'SFR Fibre Power', prix: 44.99, prixPromo: 25.99, dureePromo: 12, frais: 48, techno: 'Fibre', debitDown: 2000, debitUp: 700, wifi: 'Wi-Fi 6', tv: true, appels: true, engagement: 12 },
  { id: 'sfr-premium', operateur: 'SFR', nom: 'SFR Premium', prix: 54.99, prixPromo: 32.99, dureePromo: 12, frais: 48, techno: 'Fibre', debitDown: 8000, debitUp: 1000, wifi: 'Wi-Fi 7', tv: true, appels: true, engagement: 12 },
  { id: 'red-box-fibre', operateur: 'RED by SFR', nom: 'RED Box Fibre', prix: 24.99, frais: 39, techno: 'Fibre', debitDown: 1000, debitUp: 800, wifi: 'Wi-Fi 6', tv: false, appels: true, engagement: 0 },
  { id: 'red-box-adsl', operateur: 'RED by SFR', nom: 'RED Box ADSL', prix: 24.99, frais: 39, techno: 'ADSL', debitDown: 15, debitUp: 1, wifi: 'Wi-Fi 5', tv: false, appels: true, engagement: 0 },
  { id: 'bbox-fit', operateur: 'Bouygues Telecom', nom: 'Bbox Fit', prix: 32.99, prixPromo: 24.99, dureePromo: 12, frais: 48, techno: 'Fibre', debitDown: 400, debitUp: 400, wifi: 'Wi-Fi 6', tv: false, appels: true, engagement: 12 },
  { id: 'bbox-must', operateur: 'Bouygues Telecom', nom: 'Bbox Must', prix: 42.99, prixPromo: 27.99, dureePromo: 12, frais: 48, techno: 'Fibre', debitDown: 1000, debitUp: 700, wifi: 'Wi-Fi 6E', tv: true, appels: true, engagement: 12 },
  { id: 'bbox-ultym', operateur: 'Bouygues Telecom', nom: 'Bbox Ultym', prix: 52.99, prixPromo: 37.99, dureePromo: 12, frais: 48, techno: 'Fibre', debitDown: 8000, debitUp: 1000, wifi: 'Wi-Fi 7', tv: true, appels: true, engagement: 12 },
  { id: 'byou-pure-fibre', operateur: 'B&You', nom: 'Pure Fibre', prix: 24.99, frais: 48, techno: 'Fibre', debitDown: 8000, debitUp: 1000, wifi: 'Wi-Fi 7', tv: false, appels: true, engagement: 0 },
];
