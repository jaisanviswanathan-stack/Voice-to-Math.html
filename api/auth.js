// Vercel Serverless Function to handle OAuth
// This runs on the server, avoiding COOP issues

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        const { code, redirect_uri } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Authorization code required' });
        }

        try {
            // Exchange authorization code for access token
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    code: code,
                    client_id: process.env.GOOGLE_CLIENT_ID,
                    client_secret: process.env.GOOGLE_CLIENT_SECRET,
                    redirect_uri: redirect_uri || `${process.env.VERCEL_URL}/`,
                    grant_type: 'authorization_code',
                }),
            });

            const tokenData = await tokenResponse.json();

            if (tokenData.error) {
                console.error('Token exchange error:', tokenData);
                return res.status(400).json({ error: tokenData.error });
            }

            // Return the access token to the client
            return res.status(200).json({
                access_token: tokenData.access_token,
                expires_in: tokenData.expires_in,
                refresh_token: tokenData.refresh_token,
                scope: tokenData.scope,
                token_type: tokenData.token_type,
            });

        } catch (error) {
            console.error('Error exchanging code:', error);
            return res.status(500).json({ error: 'Failed to exchange authorization code' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
