const openai = require('../config/openai');
const { supabase } = require('../config/supabase');

/**
 * Scan receipt using OpenAI Vision
 */
const scanReceipt = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No receipt image provided'
            });
        }

        // Check if OpenAI is available
        if (!openai) {
            return res.status(503).json({
                success: false,
                error: 'Receipt scanning service is not available. OPENAI_API_KEY not configured.'
            });
        }

        const userId = req.user.id;
        const imageBuffer = req.file.buffer;
        const base64Image = imageBuffer.toString('base64');

        // Upload image to Supabase Storage first
        const fileName = `${userId}/${Date.now()}-${req.file.originalname}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(fileName, imageBuffer, {
                contentType: req.file.mimetype,
                cacheControl: '3600'
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error('Failed to upload receipt image');
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('receipts')
            .getPublicUrl(fileName);

        // Use OpenAI Vision to analyze the receipt
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Analyze this receipt image and extract the following information in JSON format:
              {
                "total_amount": <number>,
                "shop_name": "<string>",
                "date": "<YYYY-MM-DD>",
                "category": "<one of: Food, Travel, Shopping, Bills, Other>",
                "items": [
                  {
                    "name": "<string>",
                    "quantity": <number>,
                    "price": <number>
                  }
                ]
              }
              
              If any field is unclear or missing, use reasonable defaults:
              - total_amount: 0
              - shop_name: "Unknown"
              - date: today's date
              - category: "Other"
              - items: []
              
              Return ONLY the JSON object, no additional text.`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${req.file.mimetype};base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 500
        });

        const aiResponse = response.choices[0].message.content;

        // Parse the JSON response
        let parsedData;
        try {
            // Remove any markdown code blocks if present
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            parsedData = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
        } catch (parseError) {
            console.error('Failed to parse AI response:', aiResponse);
            throw new Error('Failed to parse receipt data');
        }

        // Map category to envelope icon
        const categoryIconMap = {
            'Food': '🍔',
            'Travel': '🚗',
            'Shopping': '🎁',
            'Bills': '💡',
            'Other': '📦'
        };

        const result = {
            total_amount: parsedData.total_amount || 0,
            shop_name: parsedData.shop_name || 'Unknown',
            date: parsedData.date || new Date().toISOString().split('T')[0],
            category: parsedData.category || 'Other',
            suggested_envelope_icon: categoryIconMap[parsedData.category] || '📦',
            items: parsedData.items || [],
            receipt_url: publicUrl
        };

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Receipt scan error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to scan receipt'
        });
    }
};

/**
 * Upload receipt directly without scanning
 */
const uploadReceipt = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No receipt image provided'
            });
        }

        const userId = req.user.id;
        const imageBuffer = req.file.buffer;

        const fileName = `${userId}/${Date.now()}-${req.file.originalname}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(fileName, imageBuffer, {
                contentType: req.file.mimetype,
                cacheControl: '3600'
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('receipts')
            .getPublicUrl(fileName);

        return res.status(200).json({
            success: true,
            data: {
                receipt_url: publicUrl
            }
        });
    } catch (error) {
        console.error('Upload receipt error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to upload receipt'
        });
    }
};

module.exports = {
    scanReceipt,
    uploadReceipt
};
