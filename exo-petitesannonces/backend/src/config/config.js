/**
 * Script de configuration de l'application. Le script configure le pool de connexions à la base de données et le port d'écoute du serveur.
 * Les valeurs sont lues à partir des variables d'environnement définies dans le fichier .env à la racine du projet.
 * 
 * @author Les enseignants EMF du module 324
 * @version 1.0
 */

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "db",
  user: process.env.MYSQL_USER || "appuser",
  password: process.env.MYSQL_PASSWORD || "userpwd",
  database: process.env.MYSQL_DATABASE || "db_annonces",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const port = process.env.PORT || 3000;

module.exports = { pool, port };

