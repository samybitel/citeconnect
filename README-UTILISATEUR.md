# CiteConnect — Guide de l'utilisateur

Ce document explique **comment utiliser le site**, étape par étape. Il ne parle pas
d'installation ni de technique : pour ça, voir [README.md](README.md) et
[DEPLOIEMENT.md](DEPLOIEMENT.md).

> ⚠️ **CiteConnect est une démonstration.** Toutes les données sont fictives.
> Le paiement, la validation NFC et les démarches sont **simulés** : aucune somme n'est
> réellement débitée, aucun titre de transport réel n'est émis, aucun dossier n'est envoyé
> à une mairie. Ne saisissez **pas** vos vrais documents ni vos vraies informations.

---

## 1. Entrer sur le site

| Situation | Ce qu'il faut faire |
|---|---|
| J'ai déjà un compte | aller sur `/login`, saisir **email + mot de passe**, valider |
| Je veux essayer tout de suite | comptes de démonstration ci-dessous |
| Je veux créer mon propre compte | aller sur `/register` |

**Comptes de démonstration**

| Compte | Email | Mot de passe | Intérêt |
|---|---|---|---|
| Démo | `demo@citeconnect.fr` | `Demo1234!` | Déjà rempli : rendez-vous, dossiers, abonnement, tickets, documents, notifications |
| Test | `test@citeconnect.fr` | `Test1234!` | Vierge, pour tester un parcours du début à la fin |

**Créer un compte** demande : prénom, nom, email, identifiant, mot de passe, date de
naissance, et éventuellement un téléphone.

Règles à connaître pour que le formulaire accepte tes valeurs :

- **Identifiant** : 3 à 40 caractères, lettres minuscules, chiffres, `.` `_` `-` uniquement
  (ex. `samy.b`).
- **Mot de passe** : 8 caractères minimum, avec **au moins une lettre et au moins un chiffre**.
- **Email** : une adresse valide, sinon le site refuse.
- Une fois connecté, le site garde ta session ouverte **7 jours** (il faut te
  reconnecter après ce délai, ou si tu changes d'appareil).

**Mot de passe oublié ?** Il n'existe pas de réinitialisation en ligne dans cette version.
Il faut passer par l'administrateur du site, ou recréer un compte.

---

## 2. Se repérer

- **Sur ordinateur** : le menu est sur le côté gauche.
- **Sur téléphone** : le menu est en barre en bas de l'écran.
- Un bouton permet de passer du **thème clair au thème sombre**.
- Le **nombre en rouge** sur « Notifications » indique les messages non lus, il se met à
  jour tout de suite.
- Partout, un petit badge **« Fictif »** signale une donnée de démonstration.

### Tableau de bord (`/dashboard`)

C'est la page d'accueil une fois connecté. Elle rassemble en un écran :
tes prochains rendez-vous, ton abonnement de transport actif, tes dernières démarches,
tes documents récents et tes notifications non lues. Chaque bloc est cliquable.

---

## 3. Mon compte (`/account`)

### Profil
Tu modifies ton prénom, ton nom et ton téléphone, et tu peux changer ta photo de profil.

### Adresse
Tu saisis rue, complément, code postal, ville, pays.
⚠️ Le **code postal doit faire exactement 5 chiffres**.

### Email et adresse : attention, c'est une demande
Changer son **email** ou son **adresse** ne se fait pas en direct : tu déposes une
**demande de changement** avec la nouvelle valeur et un motif. La demande reste en attente
de validation par un agent. Tu peux suivre son état.

### Documents officiels (`/account/documents`)
Tu peux **ajouter**, **remplacer** ou **supprimer** un document.

- Formats acceptés : **PDF, PNG, JPEG, WebP**
- Taille maximale : **8 Mo** par fichier
- Types proposés : carte d'identité, passeport, autre
- Pour un « autre » document, tu donnes un libellé, et éventuellement un numéro de
  document et une date d'expiration

Tes fichiers sont rangés dans une zone privée du serveur : ils ne sont lisibles que par
toi, quand tu es connecté. Ils ne sont jamais publics.

### Sécurité (`/account/security`)
- **Changer de mot de passe** (on te demande l'ancien, puis le nouveau)
- **Voir tes sessions actives** (les appareils où tu es connecté) et te déconnecter
  d'une session ou de toutes

---

## 4. Service public (`/services`)

### Les démarches (`/services/procedures`)
Un catalogue de procédures est rangé par catégorie :

| Catégorie | Exemples |
|---|---|
| État civil | actes, déclaration, changement |
| Urbanisme | déclaration de travaux, autorisation |
| Logement | aide, dossier locatif |
| Scolaire | inscription, cantine |

Parcours type : **catégorie → procédure → « Déposer une démarche »**.
Ton dossier reçoit un numéro et tu le retrouves dans **« Mes dossiers »**
(`/services/dossiers`). Chaque dossier affiche son **historique d'événements**
(déposé, en cours d'instruction, complémentaire pièce demandée, terminé), donc tu sais
toujours où en est ton dossier et ce qui te reste à faire.

### Les rendez-vous (`/services/appointments`)
Tu choisis le **service** (état civil, urbanisme, logement, scolaire, compte), un
**motif**, puis le site te propose les **créneaux libres** sur une date.
La durée va de **15 à 120 minutes** (30 min par défaut).
Tu peux **prendre**, **déplacer** ou **annuler** un rendez-vous ; le prochain
rendez-vous est rappelé sur le tableau de bord.

---

## 5. Transport (`/transport`)

### Modes et lignes (`/transport/modes`)
Bus, tram et train disponibles, avec leurs lignes.

### Abonnements (`/transport/subscriptions`)
Tu choisis une formule, tu peux cocher le **renouvellement automatique**.
Ton abonnement affiche son statut : actif, à renouveler ou expiré.
⚠️ Le paiement n'est **pas réel** : l'abonnement est émis immédiatement, comme si le
paiement avait abouti.

### Tickets (`/transport/tickets`)
Tu achètes un ou plusieurs tickets (**1 à 10** à la fois). Chaque ticket devient un
**titre numérique avec un QR code** que tu présentes au contrôle.

### NFC Express simulé (`/transport/nfc`)
Ce module reproduit ce que fait la borne dans le bus ou le train :

1. tu choisis le **mode** (bus, tram, train) ;
2. tu indiques la **ligne** et l'**arrêt** ;
3. tu valides avec **ton abonnement actif**, ou tu consommes **un ticket** précis ;
4. le résultat s'affiche (validé ou refusé) et chaque validation part dans l'**historique**.

Comme le paiement, **rien n'est réel** ici : c'est une maquette du fonctionnement.

---

## 6. Notifications (`/notifications`)

Tout ce qui te concerne arrive ici : dépôts de dossier, changements de statut,
rappels de rendez-vous, expiration d'abonnement, demandes de changement d'email ou
d'adresse.

Tu peux :
- filtrer **toutes / non lues** ;
- marquer **une** notification comme lue, ou **toutes** d'un coup ;
- en supprimer une.

---

## 7. Messages d'erreur courants

| Message | Ce qui ne va pas |
|---|---|
| « Adresse électronique invalide » | email incomplet ou sans `@` |
| « Identifiant : lettres minuscules, chiffres, . _ - uniquement » | majuscules ou caractères interdits dans l'identifiant |
| « Le mot de passe doit contenir au moins 8 caractères » | mot de passe trop court, ou sans lettre, ou sans chiffre |
| « Code postal invalide (5 chiffres) » | code postal à 4 ou 6 chiffres |
| « Fichier trop lourd (8 Mo maximum) » | document à compresser, ou à passer en PDF |
| Écran de connexion qui refuse alors que tout est correct | la session a expiré (7 jours), reconnecte-toi |

Si une action échoue sans message clair, recharge la page : sur un téléphone, la session
peut avoir expiré pendant que tu remplissais le formulaire.

---

## 8. Confidentialité

- Seules les données nécessaires au service sont demandées (identité, contact, adresse).
- Les documents uploadés sortent de la partie publique du site et ne sont accessibles
  qu'à leur propriétaire, après contrôle à chaque téléchargement.
- Le site n'utilise **aucun service externe** au chargement de la page (pas de Google
  Fonts, pas de tracker) : la police est hébergée avec le site.
- Les mots de passe ne sont pas stockés en clair.
- Sur une installation de production, l'accès passe par **HTTPS**, donc tes données
  circulent chiffrées.
