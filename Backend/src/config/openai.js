const OpenAI = require('openai');
require('dotenv').config();

let openai = null;
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    console.warn('Warning: OPENAI_API_KEY not set. Receipt scanning will not work.');
} else {
    openai = new OpenAI({
        apiKey: apiKey
    });
}

module.exports = openai;
