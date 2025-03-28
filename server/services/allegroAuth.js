// allegroAuth.js
const axios = require('axios');

let accessToken = null;
let tokenExpiration = null;

const getAllegroToken = async () => {
    if (accessToken && Date.now() < tokenExpiration) {
        return accessToken;
    }

    try {
        const authString = Buffer.from(`${process.env.ALLEGRO_CLIENT_ID}:${process.env.ALLEGRO_CLIENT_SECRET}`).toString('base64');
        
        const response = await axios.post(`${process.env.ALLEGRO_API_URL}/auth/oauth/token`, 
            'grant_type=client_credentials',
            {
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        accessToken = response.data.access_token;
        tokenExpiration = Date.now() + (response.data.expires_in * 1000);
        return accessToken;
    } catch (error) {
        console.error('Error getting Allegro token:', error.response ? error.response.data : error.message);
        return null;
    }
};

module.exports = { getAllegroToken };