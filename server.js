const express = require('express');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const ejs = require('ejs');  // Import EJS
const app = express();

// Configuration
const RECAPTCHA_SECRET = '09ANOXeZxzyfYZoWK8W0qj05zUg09chIbvvIF_LDu2mrUcLfje68Q_29hWXM6dlU_JDGkg6AhNkJGP19ggN84wnh3KQvezsKnJnzZD0fgT55JY90m8POvIWEkYh4zWzHxz';
const noAlbumArt = 'https://muzyka.vercel.app/img/album.png';

// Middleware

app.use(express.urlencoded({ extended: true }));

// Set the view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Assuming you have a 'views' folder

// Define routes
app.get('/', (req, res) => {
    res.render('index'); // Render the index.ejs file
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

        let audioUrl = null;
        $('script').each((_, script) => {
            const scriptContent = $(script).html();
            if (scriptContent && scriptContent.includes('jPlayer("setMedia"')) {
                const audioMatch = scriptContent.match(/m4a:\s*['"](\/\/s6\.krakenfiles\.com\/uploads\/[^\s'"]+\.m4a)['"]/);
                if (audioMatch && audioMatch[1]) {
                    audioUrl = `https:${audioMatch[1]}`;
                    return false;
                }
            }
        });

        res.render('embed', { id: id, token: token, fileName: fileName, coverArtUrl, audioUrl, source: 'kraken' });
    } catch (error) {
        console.error('Error fetching the KrakenFiles page:', error);
        res.status(500).send('Error fetching the KrakenFiles page');
    }
});

app.get('/f/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const response = await axios.get(`https://plwcse.top/f/${id}`);
        const html = response.data;
        const $ = cheerio.load(html);

        const fileName = $('span[aria-live="polite"]').text().trim();
        const coverArtUrl = `https://api.plwcse.top/api/cover/${id}`;

        res.render('embed', { id: id, token: null, fileName: fileName, coverArtUrl: coverArtUrl, audioUrl: null, source: 'plwcse' });
    } catch (error) {
        console.error('Error fetching the plwcse.top page:', error);
        res.status(500).send('Error fetching the plwcse.top page');
    }
});

app.post('/download/:source/:id', async (req, res) => {
    const id = req.params.id;
    const source = req.params.source;
    const recaptchaToken = req.body.token;

    let url;
    if (source === 'kraken') {
        url = `https://krakenfiles.com/download/${id}`;
    } else if (source === 'plwcse') {
        url = `https://api.plwcse.top/api/download/${id}`;
    } else {
        return res.status(400).send('Invalid source');
    }

    try {
        if (source === 'kraken') {
            // reCAPTCHA Validation
            const recaptchaResponse = await axios.post(
                `https://www.google.com/recaptcha/api/siteverify`, // Use siteverify endpoint
                new URLSearchParams({
                    secret: RECAPTCHA_SECRET,
                    response: recaptchaToken,
                })
            );

            if (!recaptchaResponse.data.success) {
                console.log('reCAPTCHA failed:', recaptchaResponse.data);
                return res.status(400).send('Invalid CAPTCHA');
            }

            const response = await axios.post(url, `g-recaptcha-response=${recaptchaToken}`, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            if (response.data.status === 'ok' && response.data.url) {
                res.redirect(response.data.url);
            } else {
                console.error('Download URL retrieval failed:', response.data);
                res.status(500).send('Error retrieving download URL');
            }
        } else if (source === 'plwcse') {
            res.redirect(url);
        }
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).send('Error processing the download request');
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app; 
