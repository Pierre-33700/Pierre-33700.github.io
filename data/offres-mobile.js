// Catalogue des forfaits mobiles.
// ⚠️ Jeu de données d'exemple : tarifs et caractéristiques indicatifs, à vérifier
// et à mettre à jour régulièrement auprès des opérateurs.
//
// Champs :
//   prix        prix mensuel hors promotion (€)
//   prixPromo   prix mensuel pendant la promotion (€), optionnel
//   dureePromo  durée de la promotion (mois), optionnel
//   frais       frais ponctuels : carte SIM / activation (€)
//   data        volume de data mensuel en France (Go, 9999 = illimité)
//   g5          5G incluse
//   appels      appels et SMS illimités
//   dataEurope  data utilisable en Europe / DOM (Go)
//   reseau      réseau utilisé (Orange, SFR, Bouygues, Free)
//   esim        eSIM disponible
//   engagement  durée d'engagement (mois)
window.OFFRES_MOBILE = [
  { id: 'free-2e', operateur: 'Free', nom: 'Forfait 2 €', prix: 2, frais: 10, data: 0.05, g5: false, appels: false, dataEurope: 0.05, reseau: 'Free', esim: true, engagement: 0 },
  { id: 'free-serie-150', operateur: 'Free', nom: 'Série Free 150 Go', prix: 15.99, prixPromo: 8.99, dureePromo: 12, frais: 10, data: 150, g5: false, appels: true, dataEurope: 25, reseau: 'Free', esim: true, engagement: 0 },
  { id: 'free-5g-350', operateur: 'Free', nom: 'Forfait Free 5G 350 Go', prix: 19.99, frais: 10, data: 350, g5: true, appels: true, dataEurope: 35, reseau: 'Free', esim: true, engagement: 0 },
  { id: 'sosh-40', operateur: 'Sosh', nom: 'Forfait 40 Go', prix: 11.99, frais: 10, data: 40, g5: false, appels: true, dataEurope: 15, reseau: 'Orange', esim: true, engagement: 0 },
  { id: 'sosh-100-5g', operateur: 'Sosh', nom: 'Forfait 100 Go 5G', prix: 15.99, frais: 10, data: 100, g5: true, appels: true, dataEurope: 25, reseau: 'Orange', esim: true, engagement: 0 },
  { id: 'sosh-200-5g', operateur: 'Sosh', nom: 'Forfait 200 Go 5G', prix: 19.99, frais: 10, data: 200, g5: true, appels: true, dataEurope: 30, reseau: 'Orange', esim: true, engagement: 0 },
  { id: 'red-100', operateur: 'RED by SFR', nom: 'Forfait 100 Go', prix: 9.99, frais: 10, data: 100, g5: false, appels: true, dataEurope: 20, reseau: 'SFR', esim: true, engagement: 0 },
  { id: 'red-200-5g', operateur: 'RED by SFR', nom: 'Forfait 200 Go 5G', prix: 14.99, frais: 10, data: 200, g5: true, appels: true, dataEurope: 25, reseau: 'SFR', esim: true, engagement: 0 },
  { id: 'byou-130', operateur: 'B&You', nom: 'Forfait 130 Go', prix: 9.99, frais: 10, data: 130, g5: false, appels: true, dataEurope: 20, reseau: 'Bouygues', esim: true, engagement: 0 },
  { id: 'byou-300-5g', operateur: 'B&You', nom: 'Forfait 300 Go 5G', prix: 15.99, frais: 10, data: 300, g5: true, appels: true, dataEurope: 30, reseau: 'Bouygues', esim: true, engagement: 0 },
  { id: 'orange-80-5g', operateur: 'Orange', nom: 'Forfait 80 Go 5G', prix: 39.99, prixPromo: 24.99, dureePromo: 12, frais: 10, data: 80, g5: true, appels: true, dataEurope: 40, reseau: 'Orange', esim: true, engagement: 12 },
  { id: 'sfr-200-5g', operateur: 'SFR', nom: 'Forfait 200 Go 5G', prix: 44.99, prixPromo: 29.99, dureePromo: 12, frais: 10, data: 200, g5: true, appels: true, dataEurope: 40, reseau: 'SFR', esim: true, engagement: 12 },
  { id: 'bouygues-130-5g', operateur: 'Bouygues Telecom', nom: 'Sensation 130 Go 5G', prix: 34.99, prixPromo: 19.99, dureePromo: 12, frais: 10, data: 130, g5: true, appels: true, dataEurope: 30, reseau: 'Bouygues', esim: true, engagement: 12 },
  { id: 'prixtel-100', operateur: 'Prixtel', nom: 'Le Grand 100 Go', prix: 9.99, frais: 10, data: 100, g5: false, appels: true, dataEurope: 15, reseau: 'SFR', esim: false, engagement: 0 },
  { id: 'syma-5', operateur: 'Syma Mobile', nom: 'Forfait 5 Go', prix: 4.99, frais: 10, data: 5, g5: false, appels: true, dataEurope: 5, reseau: 'SFR', esim: false, engagement: 0 },
  { id: 'syma-100', operateur: 'Syma Mobile', nom: 'Forfait 100 Go', prix: 7.99, frais: 10, data: 100, g5: false, appels: true, dataEurope: 12, reseau: 'SFR', esim: false, engagement: 0 },
  { id: 'lebara-100-5g', operateur: 'Lebara', nom: 'Forfait 100 Go 5G', prix: 9.99, frais: 0, data: 100, g5: true, appels: true, dataEurope: 15, reseau: 'Bouygues', esim: true, engagement: 0 },
  { id: 'youprice-120', operateur: 'YouPrice', nom: 'Forfait 120 Go', prix: 8.99, frais: 10, data: 120, g5: false, appels: true, dataEurope: 15, reseau: 'Orange', esim: false, engagement: 0 },
  { id: 'laposte-100-5g', operateur: 'La Poste Mobile', nom: 'Forfait 100 Go 5G', prix: 12.99, frais: 10, data: 100, g5: true, appels: true, dataEurope: 20, reseau: 'SFR', esim: true, engagement: 0 },
  { id: 'nrj-100', operateur: 'NRJ Mobile', nom: 'Forfait 100 Go', prix: 10.99, frais: 10, data: 100, g5: false, appels: true, dataEurope: 15, reseau: 'SFR', esim: false, engagement: 0 },
  { id: 'auchan-130', operateur: 'Auchan Télécom', nom: 'Forfait 130 Go', prix: 9.99, frais: 10, data: 130, g5: false, appels: true, dataEurope: 15, reseau: 'Bouygues', esim: false, engagement: 0 },
  { id: 'cdiscount-100', operateur: 'Cdiscount Mobile', nom: 'Forfait 100 Go', prix: 6.99, frais: 10, data: 100, g5: false, appels: true, dataEurope: 10, reseau: 'Bouygues', esim: false, engagement: 0 },
];
