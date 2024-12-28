const express = require('express');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

const noAlbumArt = 'https://muzyka.vercel.app/img/album.png';

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/view/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const response = await axios.get(`https://krakenfiles.com/view/${id}/file.html`);
        const html = response.data;
        const $ = cheerio.load(html);

        const token = $('input[name="token"]').val();

        const fileName = $('.coin-name').text().trim();

        const coverArtElement = $('img[src*="cover.png"]').attr('src');
        const coverArtUrl = coverArtElement ? `https:${coverArtElement}` : noAlbumArt;

        res.render('embed', { id: id, token: token, fileName: fileName });
    } catch (error) {
        res.status(500).send('Error fetching the KrakenFiles page');
    }
});

app.post('/download/:id', async (req, res) => {
    const id = req.params.id;
    const token = req.body.token;

    try {
        const response = await axios.post(`https://krakenfiles.com/download/${id}`, `token=${token}`, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const downloadData = response.data;

        if (downloadData.status === 'ok' && downloadData.url) {
            res.json({ url: downloadData.url });
        } else {
            res.status(500).send('Error retrieving download URL');
        }
    } catch (error) {
        console.error('Error sending download request:', error.response ? error.response.data : error.message);
        res.status(500).send('Error sending the download request');
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
