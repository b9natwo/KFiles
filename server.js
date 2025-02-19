const express = require('express');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

// ************************************************************
// IMPORTANT:  Set environment variables in your Vercel project settings!
// ************************************************************
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;  // Use environment variable
const noAlbumArt = 'https://muzyka.vercel.app/img/album.png';  // Ensure this URL is accessible

// Middleware - always use this to handle static assets correctly
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

//  CORS Middleware (important for Vercel, especially if your frontend is on a different domain)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust '*' to your frontend's origin in production (e.g., 'https://your-frontend-domain.com')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST'); // Allow only GET and POST for security
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));  // Serve your index.html
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

    if (!RECAPTCHA_SECRET) {
        console.error("RECAPTCHA_SECRET is not set in environment variables.");
        return res.status(500).send('Internal Server Error:  reCAPTCHA secret not configured.'); // Avoid exposing the real reason in production.
    }

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
            // Validate reCAPTCHA
            const recaptchaResponse = await axios.post(
                `https://www.google.com/recaptcha/api/siteverify`, // Use siteverify, not anchor
                new URLSearchParams({
                    secret: RECAPTCHA_SECRET,
                    response: recaptchaToken,
                })
            );

            if (!recaptchaResponse.data.success) {
                console.error("reCAPTCHA verification failed:", recaptchaResponse.data);  // Log detailed errors
                return res.status(400).send('Invalid CAPTCHA');
            }

            const response = await axios.post(url, null, {  // Send a null body - krakenfiles doesn't need anything in the body
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',  // Correct content type
                    'g-recaptcha-response': recaptchaToken // Include the recaptcha token in headers
                },
            });

            if (response.data.status === 'ok' && response.data.url) {
                res.redirect(response.data.url);
            } else {
                console.error("Error retrieving download URL from KrakenFiles:", response.data);
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

// Vercel uses this to determine the entry point
module.exports = app; // Export the Express app
