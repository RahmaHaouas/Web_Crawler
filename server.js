const cheerio = require('cheerio');
const request = require('request-promise');
const mongoose = require('mongoose');

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

mongoose.connect('your_BD', { useNewUrlParser: true });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const ImageSchema = new mongoose.Schema({
  url: String,
  name: String,
  price: String,
  location: String
});
const Image = mongoose.model('Image', ImageSchema);

const urls = ['Liste_des_urls'];

async function crawl() {
  for (let url of urls) {
    try {
      const html = await request(url);
      const $ = cheerio.load(html);
      $('img').each(async function() {
        const image = new Image({
          url: $(this).attr('src'),
          name: $(this).attr('alt'),
          price: parseFloat($(this).closest('.product').find('.price').text()),
          location: $(this).closest('.product').find('.location').text()
        });
        await image.save();
      });
    } catch (err) {
      console.error(`Erreur lors de l'extraction des données du site ${url}: ${err}`);
    }
  }
}

crawl();

app.get('/produits', async (req, res) => {
  try {
    const produits = await Image.find();
    res.send(produits);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

app.use(bodyParser.json());

app.listen(3000, () => {
  console.log('Serveur démarré sur le port 3000');
});
