const express = require('express');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true })); // To handle form submissions

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

        // Extract the token
        const token = $('input[name="token"]').val();

        // Extract the file name
        const fileName = $('.coin-name').text().trim();

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
