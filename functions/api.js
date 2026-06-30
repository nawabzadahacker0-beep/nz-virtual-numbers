const express = require('express');
const axios = require('axios');
const serverless = require('serverless-http');
const app = express();

const API_KEY = 'b75x2Zef3LgSGkA-kt3D429v-nA4jFfFT-1zrHMtgz-TXy73sxZ81WkqRY';
const API_BASE = 'https://onlinesim.ru/api';

// 🔐 SITE PROTECTION PASSWORD
const ACCESS_PASSWORD = 'NawabZada@610"*:!?/*-+`|÷✓™©®£';

app.use(express.json());

// Base Router mapping for Netlify redirect compatibility
const router = express.Router();

// 0. ROUTE: Password verification endpoint
router.post('/verify-auth', (req, res) => {
    const { password } = req.body;
    if (password === ACCESS_PASSWORD) {
        return res.json({ success: true, token: "NZ_SECURE_AUTH_VALIDATED_2026" });
    }
    res.json({ success: false, message: "Invalid access key restriction." });
});

// 1. ROUTE: Get Available Services/Categories (Publicly Viewable)
router.get('/get-services', async (req, res) => {
    try {
        const response = await axios.get(${API_BASE}/getServiceList.php, {
            params: { apikey: API_KEY, lang: 'en' }
        });
        res.json({ success: true, services: response.data.services || response.data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. ROUTE: Buy / Request Virtual Number (Protected via Header validation check)
router.post('/get-number', async (req, res) => {
    try {
        const userToken = req.headers['x-auth-token'];
        if (userToken !== "NZ_SECURE_AUTH_VALIDATED_2026") {
            return res.status(401).json({ success: false, message: "Unauthorized restriction trigger." });
        }

        const { service, country } = req.body;
        const response = await axios.get(${API_BASE}/getNum.php, {
            params: {
                apikey: API_KEY,
                service: service || 'whatsapp',
                country: country || 7 
            }
        });

        if (response.data.tzid) {
            res.json({
                success: true,
                tzid: response.data.tzid,
                number: response.data.number
            });
        } else {
            res.json({ success: false, message: response.data.error || 'Service Busy' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. ROUTE: Check Live Dynamic OTP Status (Protected)
router.get('/get-otp/:tzid', async (req, res) => {
    try {
        const userToken = req.headers['x-auth-token'];
        if (userToken !== "NZ_SECURE_AUTH_VALIDATED_2026") {
            return res.status(401).json({ success: false, message: "Access Denied." });
        }

        const { tzid } = req.params;
        const response = await axios.get(${API_BASE}/getState.php, {
            params: { apikey: API_KEY, tzid: tzid, msg_list: 1 }
        });

        const orderData = Array.isArray(response.data) ? response.data[0] : response.data;

        if (orderData && orderData.msg) {
            res.json({ success: true, status: 'RECEIVED', otp: orderData.msg });
        } else {
            res.json({ success: true, status: 'WAITING', otp: null });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Prefix all routes with /api for Netlify system architecture 
app.use('/api', router);

module.exports.handler = serverless(app);
