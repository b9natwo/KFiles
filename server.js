const express = require('express');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const RECAPTCHA_SECRET = '09ANOXeZxzyfYZoWK8W0qj05zUg09chIbvvIF_LDu2mrUcLfje68Q_29hWXM6dlU_JDGkg6AhNkJGP19ggN84wnh3KQvezsKnJnzZD0fgT55JY90m8POvIWEkYh4zWzHxz';

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

        // Load the HTML into Cheerio
        const $ = cheerio.load(html);

        // Extract the token
        const token = $('input[name="token"]').val();

        // Extract the file name
        const fileName = $('.coin-name').text().trim();

        // Extract the cover art URL
        const coverArtElement = $('img[src*="cover.png"]').attr('src');
        const coverArtUrl = coverArtElement ? `https:${coverArtElement}` : noAlbumArt;

        // Look for the <script> tag containing the m4a URL
        let audioUrl = null;
        $('script').each((_, script) => {
            const scriptContent = $(script).html();
            if (scriptContent && scriptContent.includes('jPlayer("setMedia"')) {
                const audioMatch = scriptContent.match(/m4a:\s*['"](\/\/s6\.krakenfiles\.com\/uploads\/[^\s'"]+\.m4a)['"]/);
                if (audioMatch && audioMatch[1]) {
                    audioUrl = `https:${audioMatch[1]}`; // Construct full URL with HTTPS
                    return false; // Exit loop once the URL is found
                }
            }
        });

        // Render the EJS template with the extracted data
        res.render('embed', { id: id, token: token, fileName: fileName, coverArtUrl, audioUrl, source: 'kraken'});
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

        // Construct the cover art URL
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
    const recaptchaToken = req.body.token; // g-recaptcha-response from frontend

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
            // Validate the reCAPTCHA token with Google's API
            const recaptchaResponse = await axios.post(
                `https://www.google.com/recaptcha/api2/anchor?ar=1&k=6LfGsJIdAAAAAIKjg0JIKSG2s3e3_dJF55k7kPEG&co=aHR0cHM6Ly9rcmFrZW5maWxlcy5jb206NDQz&hl=en&v=pPK749sccDmVW_9DSeTMVvh2&size=invisible&cb=pn8blhctcss1`,
                new URLSearchParams({
                    secret: RECAPTCHA_SECRET,
                    response: recaptchaToken,
                })
            );

            if (!recaptchaResponse.data.success) {
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
