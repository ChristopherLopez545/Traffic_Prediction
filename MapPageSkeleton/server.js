const express = require('express');
const app = express();
const PORT = 3030;
const TOMTOM_API_KEY = 'tzSGmwXqKngH3h0GDPBqeo88Pf9jYy4G';

// Set view engine to EJS for rendering pages
app.set('view engine', 'ejs');

// Middleware to parse JSON request bodies
app.use(express.json());

// Route to render the MapPage
app.get('/MapPage', (req, res) => {
    res.render('MapPage');
});

// Route to handle search requests for location coordinates
app.post('/search', async (req, res) => {
    const { search } = req.body; // Extract search query from request body

    console.log('Received location:', search);

    // Construct URL for TomTom geocoding API request
    const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(search)}.json?key=${TOMTOM_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        // Extract latitude and longitude from API response
        const { lat, lon } = data.results[0].position;
        res.json = ({ lat, lon }); // Send response back to client

        console.log('Received lat:', lat);
        console.log('Received lon:', lon);
    } catch (error) {
        console.error('Error fetching coordinates:', error);
        res.status(500).json({ error: 'Failed to fetch location data' });
    }
});

// Route to handle route calculation between two locations
app.post('/route', async (req, res) => {
    const { start, end } = req.body; // Extract start and end locations from request body

    // Construct URLs for geocoding start and end locations
    const startUrl = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(start)}.json?key=${TOMTOM_API_KEY}`;
    const endUrl = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(end)}.json?key=${TOMTOM_API_KEY}`;
    const matrixPostUrl = `https://api.tomtom.com/routing/matrix/2/async?key=${TOMTOM_API_KEY}`;

    try {
        // Fetch coordinates for start location
        const startResponse = await fetch(startUrl);
        const startData = await startResponse.json();

        // Fetch coordinates for end location
        const endResponse = await fetch(endUrl);
        const endData = await endResponse.json();

        // Extract latitude and longitude for both locations
        const { lat: startLat, lon: startLon } = startData.results[0].position;
        const { lat: endLat, lon: endLon } = endData.results[0].position;

        console.log('Received route Start:', start);
        console.log('Received route End:', end);
        console.log(`Start: ${startLat}, ${startLon}, End: ${endLat}, ${endLon}`);

        // Create request body for TomTom Matrix Routing API
        const requestBody = {
            "origins": [{ "point": { "latitude": startLat, "longitude": startLon } }],
            "destinations": [{ "point": { "latitude": endLat, "longitude": endLon } }],
            "options": { "travelMode": "car" }
        };

        // Send POST request to start matrix routing job
        const matrixPostResponse = await fetch(matrixPostUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        const matrixPostResponseJson = await matrixPostResponse.json();
        const matrixJobId = matrixPostResponseJson.jobId;

        // Poll status of matrix routing job
        const statusUrl = `https://api.tomtom.com/routing/matrix/2/async/${matrixJobId}?key=${TOMTOM_API_KEY}`;

        while (true) {
            const status = await fetch(statusUrl);
            const statusData = await status.json();

            if (statusData.state == 'Completed') {
                break;
            } else if (statusData.state == 'Failed') {
                console.log("404, State: Failed");
                break;
            }
        }

        // Fetch the final routing results
        const matrixGetUrl = `https://api.tomtom.com/routing/matrix/2/async/${matrixJobId}/result?key=${TOMTOM_API_KEY}`;
        const matrixGetResponse = await fetch(matrixGetUrl, {
            method: "GET",
            headers: { "Accept-Encoding": "gzip" }
        });

        const matrixGetData = await matrixGetResponse.json();
        console.log(await matrixGetData.data[0].routeSummary);

    } catch (error) {
        console.error('Error fetching route data:', error);
        res.status(500).json({ error: 'Failed to fetch route data' });
    }
});

// Start the Express server
app.listen(PORT, () => console.log(`Server is ready on port ${PORT}`));