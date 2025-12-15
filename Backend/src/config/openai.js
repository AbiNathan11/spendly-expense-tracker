const OpenAI = require('openai');
require('dotenv').config();

if (!process.env.OPENAI_API_KEY) {
    console.warn('Warning: OPENAI_API_KEY not set. Receipt scanning will not work.');
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

module.exports = openai;
