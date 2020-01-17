# Mock Server

Permets la création simple et rapide d'un serveur de mock qui met en place un API REST via le protocole HTTP (par défaut sur le port 8000, il est possible de le changer en le passant en paramètre).

## Utilisation

```bash
# Lancer l'application sur le port 8000
npm start
node main.js

# Changer le port
node main.js -p 8080
node main.js --port 8080

# Afficher plus d'informations
npm run dev
node main.js -v
node main.js --verbose
```
Il est possible de voir toutes les commandes avec l'argument `-h` ou `--help`.

## Création d'un point d'entré

Pour créer un point d'entré il suffit de créer un fichier json dans la méthode HTTP voulu (ou dans ANY pour n'importe quel méthode).

Pour créer une URL il suffit de faire une arboresence de dossier, ainsi `./user/detail/list/all.json` correspond à l'URL `http://localhost:port/user/detail/list/all`. Il est aussi possible de la faire avec un fichier unique nommé `user.detail.list.all.json`. Il est possible de combiner les deux par exemple `./user/detail/list.all.json`.

Il est aussi possible d'utiliser des parametre soit dans le corp de la requete via un json, soit via l'url en indiquant dans le nom du fichier où sont les paramètres. Par exemple `user.detail.param-id` correspond à l'URL `http://localhost:port/user/detail/{id}` où id est un parametre. En écrivant `user.detail.param-id-optional` permet d'indiquer q'id est un parametre optionnel. Pour récupèrer les données dans le json il suffit d'utiliser l'annotation `${var}`. Dans le cas de notre exemple on utilise `${id}` pour récupèrer l'id.

## Encapsulation réponse

Il est possible d'encapsuler toutes les réponses dans un json pré-définit. Pour cela il suffit de créer un fichier `wrapper.json` qui contient le json pour l'encapsulation. Ce json reçoit un parametre nommé data qui contient le json de la requete (il suffit de mettre `${data}` pour recupérer les données). Voici un exemple de json pour l'encapsulation :

```json
{
    "success": true,
    "data": ${data}
}
```