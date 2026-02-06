/**
 * Endpoint principal de l'application.
 * 
 * @author Les enseignants EMF du module 324
 * @version 1.0
 */
require("dotenv").config();
const coucou = "AS";
const config = require('./config/config');
const cors = require('cors');
const bodyParser = require('body-parser');


const annoncesRoutes = require('./routes/annonceRoutes');

const express = require('express');
const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/annonces', annoncesRoutes);

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});