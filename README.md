# Comparateur de forfaits

Site statique (GitHub Pages) qui aide à trouver un forfait **mobile** ou une offre **internet fixe**
équivalente à son offre actuelle, mais moins chère.

## Fonctionnalités

1. **Forfait actuel** : choix dans le catalogue (pré-remplit les caractéristiques) ou saisie manuelle,
   avec le prix réellement payé.
2. **Critères** : pour chaque caractéristique, l'utilisateur indique si elle est
   *indispensable* (l'offre proposée doit être au moins aussi bien), *secondaire* (sert au classement)
   ou *indifférente*.
3. **Résultats** : offres moins chères respectant tous les critères indispensables, avec le coût
   mensuel moyen sur 12 ou 24 mois (promotions et frais d'activation inclus), l'économie annuelle
   et un avertissement quand le prix après promotion dépasse le prix actuel.
4. **Alertes de prix** : enregistre le forfait et les critères avec un seuil d'économie ; à chaque
   visite, le site re-vérifie le catalogue et affiche un bandeau (et une notification du navigateur
   si elle est autorisée) quand une nouvelle offre passe sous le seuil.

5. **Énergie (électricité / gaz)** : saisie de la consommation annuelle (kWh) ou **import d'un fichier**
   (CSV Enedis / GRDF / fournisseur, JSON Enedis Data Connect ; unités kWh, Wh ou W détectées, estimation
   annuelle à partir de la période couverte, part d'heures creuses si le fichier la distingue). L'offre actuelle
   se choisit dans le catalogue (ou prix saisis à la main / montant annuel payé). Le coût annuel
   (abonnement + kWh, remises et bonus inclus) est calculé pour chaque offre : classement par coût de la 1re
   année ou en régime normal, filtres prix fixe / énergie verte / sans engagement.
   Le PDL/PCE ne permet pas de retrouver le fournisseur sans l'API Enedis/GRDF (consentement + serveur) :
   l'offre actuelle est donc choisie manuellement. Fichier lu localement, jamais envoyé.

## Structure

```
index.html              page unique
css/style.css           styles (clair / sombre, responsive)
js/app.js               moteur de comparaison, formulaire, alertes
data/offres-mobile.js   catalogue des forfaits mobiles
data/offres-internet.js catalogue des offres box
data/offres-energie.js  catalogue des offres d'électricité et de gaz
js/energie.js           comparateur d'énergie (calcul, import de fichier)
```

Aucun build ni serveur : ouvrir `index.html` suffit.

## Ajouter une catégorie de produit

Ajouter un fichier `data/offres-xxx.js` et une entrée dans `CATEGORIES` (`js/app.js`) décrivant les
critères (`min`, `max`, `bool`, `ordinal`, `same`). Le formulaire, le moteur et les alertes sont
génériques.

## Limites actuelles

- Pas d'alertes de prix pour l'énergie pour l'instant.
- Les **données sont des exemples indicatifs** : il faut les vérifier et les tenir à jour.
- Les alertes sont stockées dans le navigateur (`localStorage`) et ne sont vérifiées que lorsque
  la page est ouverte. Des alertes par e-mail nécessiteront un back-end (ou une tâche planifiée).
