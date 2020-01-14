# Mock Server

Permets la création simple et rapide d'un serveur de mock qui met en place un API REST via le protocole HTTP (par défaut sur le port 8000, il est possible de le changer en le passant en paramètre).

## Création d'un point d'entré

Pour créer un point d'entrer il suffit de créer un fichier json qui contient la valeur de retour souhaité dans le dossier correspondant à la méthode désirée pour l'appel (les dossiers se trouvent dans le dossier server). Pour créer un point d'entrée en POST correspondant à l'URL `http://localhost:8000/test`, il suffit de créer un fichier nommé test.json dans le dossier POST. Quand l'URL sera appelée alors le contenu du fichier json sera retourné.

Il est possible de créer des sous-dossiers pour mock des URL avec plus d'informations. Ainsi créer un fichier list.json dans un sous-dossier user du dossier GET (le chemin est donc `GET/user/list.json`), permet de créer un mock pour l'URL `http://localhost:8000/user/list` en GET. Il est possible de créer autant de sous dossier que nécessaire.

Enfin le dossier ANY permet de créer un point d'entrée utilisable avec n'importe quel type de requête HTTP.