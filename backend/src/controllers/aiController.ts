import { Request, Response } from 'express';
import { getGeminiModel } from '../config/gemini';
import { storageService } from '../services/storage';

// ────────────────────────────────────────────────────────────────
// Mock responses for when Gemini API key is not configured
// ────────────────────────────────────────────────────────────────
const getMockCropRecommendation = (soil: any) => ({
  recommendations: [
    {
      crop: 'Rice (Paddy)',
      suitability: 92,
      season: 'Kharif (June–October)',
      reasons: [
        'High soil moisture is ideal for paddy',
        'NPK levels support rice growth',
        'Current weather conditions are favorable',
      ],
      tips: [
        'Maintain 5cm standing water during tillering',
        'Apply urea in 3 split doses',
        'Monitor for blast disease during humid periods',
      ],
    },
    {
      crop: 'Cotton',
      suitability: 78,
      season: 'Kharif (June–November)',
      reasons: [
        'Soil pH is within optimal range for cotton',
        'Good potassium levels support fiber development',
      ],
      tips: [
        'Ensure proper drainage to avoid waterlogging',
        'Apply 60kg/ha nitrogen at sowing',
        'Scout for bollworm weekly after flowering',
      ],
    },
    {
      crop: 'Groundnut',
      suitability: 71,
      season: 'Kharif / Rabi',
      reasons: [
        'Moderate nitrogen levels suit legume growth',
        'Well-draining soil conditions are favorable',
      ],
      tips: [
        'Apply gypsum at 500kg/ha during pegging',
        'Avoid excessive nitrogen which delays maturity',
        'Harvest when 70% shells show darkening inside',
      ],
    },
  ],
  fertilizer: {
    nitrogen: `Apply ${Math.max(0, 120 - (soil.nitrogen || 50))} kg/ha additional Nitrogen`,
    phosphorus: `Apply ${Math.max(0, 60 - (soil.phosphorus || 30))} kg/ha additional Phosphorus`,
    potassium: `Apply ${Math.max(0, 40 - (soil.potassium || 20))} kg/ha additional Potassium`,
    organic: 'Apply 5 tonnes/ha of farmyard manure before sowing',
  },
  groundwater: {
    level: 'Moderate (8-12m depth)',
    quality: 'Suitable for irrigation',
    advisory: 'Consider drip irrigation to conserve groundwater',
  },
});

const getMockDiseaseDetection = () => ({
  disease: 'Leaf Blight (Helminthosporium)',
  confidence: 87,
  crop: 'Rice',
  symptoms: [
    'Oval to elongated brown lesions on leaves',
    'Lesions may have yellow halos',
    'Severe infection causes leaf drying from tips',
  ],
  treatment: {
    organic: [
      'Apply Trichoderma viride as seed treatment (4g/kg)',
      'Spray neem oil (5ml/litre) at early infection stage',
      'Remove and destroy severely infected plant debris',
    ],
    chemical: [
      'Spray Mancozeb 75% WP @ 2.5g/litre at 15-day intervals',
      'Propiconazole 25% EC @ 1ml/litre for severe infections',
      'Carbendazim 50% WP @ 1g/litre as preventive spray',
    ],
  },
  prevention: [
    'Use resistant varieties like MTU-1010 or BPT-5204',
    'Maintain proper spacing for air circulation',
    'Avoid excessive nitrogen fertilization',
    'Ensure proper drainage in the field',
  ],
});

// ────────────────────────────────────────────────────────────────
// Crop Recommendation Endpoint
// ────────────────────────────────────────────────────────────────
export const getCropRecommendation = async (req: Request, res: Response) => {
  try {
    const { soil, weather, location, language } = req.body;

    if (!soil) {
      return res.status(400).json({ error: 'Soil data is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️  Gemini API key not set. Returning mock crop recommendations.');
      return res.json(getMockCropRecommendation(soil));
    }

    const model = getGeminiModel();

    const langMap: Record<string, string> = { en: 'English', te: 'Telugu', hi: 'Hindi' };
    const responseLang = langMap[language] || 'English';

    const prompt = `You are an expert agricultural scientist in India. Analyze the following data and provide crop recommendations.

SOIL DATA:
- Nitrogen (N): ${soil.nitrogen || 'unknown'} kg/ha
- Phosphorus (P): ${soil.phosphorus || 'unknown'} kg/ha
- Potassium (K): ${soil.potassium || 'unknown'} kg/ha
- pH Level: ${soil.pH || 'unknown'}
- Soil Moisture: ${soil.moisture || 'unknown'}%

WEATHER DATA:
- Temperature: ${weather?.temp || 'unknown'}°C
- Humidity: ${weather?.humidity || 'unknown'}%
- Rainfall: ${weather?.rainfall || 'unknown'} mm
- Season: ${weather?.season || 'current'}

LOCATION: Lat ${location?.lat || 'unknown'}, Lon ${location?.lng || 'unknown'} (India)

Provide your response in ${responseLang} language as a JSON object with exactly this structure:
{
  "recommendations": [
    {
      "crop": "crop name",
      "suitability": <percentage 0-100>,
      "season": "recommended season",
      "reasons": ["reason 1", "reason 2"],
      "tips": ["tip 1", "tip 2", "tip 3"]
    }
  ],
  "fertilizer": {
    "nitrogen": "recommendation",
    "phosphorus": "recommendation",
    "potassium": "recommendation",
    "organic": "recommendation"
  },
  "groundwater": {
    "level": "estimated level",
    "quality": "assessment",
    "advisory": "water management advice"
  }
}

Provide exactly 3 crop recommendations sorted by suitability score. Be specific with quantities and timings.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return res.json(parsed);
    }

    // Fallback to mock if parsing fails
    return res.json(getMockCropRecommendation(soil));
  } catch (error: any) {
    console.error('Crop recommendation error:', error.message);
    res.status(500).json({ error: 'Failed to generate crop recommendations' });
  }
};

// ────────────────────────────────────────────────────────────────
// Disease Detection Endpoint
// ────────────────────────────────────────────────────────────────
export const detectDisease = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    // Abstract storage upload
    let imageUrl = '';
    try {
      imageUrl = await storageService.uploadFile(file.buffer, file.originalname, file.mimetype);
      console.log(`Saved file to abstract storage service. Local/Cloud URL: ${imageUrl}`);
    } catch (storageErr: any) {
      console.error('Storage service upload failed:', storageErr.message);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️  Gemini API key not set. Returning mock disease detection.');
      return res.json({ ...getMockDiseaseDetection(), imageUrl });
    }

    const model = getGeminiModel();

    const imageData = {
      inlineData: {
        data: file.buffer.toString('base64'),
        mimeType: file.mimetype,
      },
    };

    const prompt = `You are an expert plant pathologist. Analyze this crop/plant image and identify any disease.

Provide your response as a JSON object with exactly this structure:
{
  "disease": "disease name or 'Healthy' if no disease detected",
  "confidence": <percentage 0-100>,
  "crop": "identified crop type",
  "symptoms": ["visible symptom 1", "visible symptom 2"],
  "treatment": {
    "organic": ["organic treatment 1", "organic treatment 2"],
    "chemical": ["chemical treatment 1", "chemical treatment 2"]
  },
  "prevention": ["prevention measure 1", "prevention measure 2"]
}

Be specific about disease identification, treatment dosages, and application methods.`;

    const result = await model.generateContent([prompt, imageData]);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return res.json({ ...parsed, imageUrl });
    }

    return res.json({ ...getMockDiseaseDetection(), imageUrl });
  } catch (error: any) {
    console.error('Disease detection error:', error.message);
    res.status(500).json({ error: 'Failed to analyze crop image' });
  }
};


// ────────────────────────────────────────────────────────────────
// AI Chat / Advisory Endpoint
// ────────────────────────────────────────────────────────────────
export const getAiAdvisory = async (req: Request, res: Response) => {
  try {
    const { query, language, context } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        response: `Thank you for your question about "${query}". Based on general agricultural practices, I recommend consulting with your local agricultural extension officer for personalized advice. Key tips: maintain proper irrigation schedules, use balanced fertilizers, and monitor crops regularly for pests and diseases.`,
      });
    }

    const model = getGeminiModel();
    const langMap: Record<string, string> = { en: 'English', te: 'Telugu', hi: 'Hindi' };

    const prompt = `You are Kisan Mitra (Farmer's Friend), an expert AI agricultural advisor for Indian farmers.
The farmer asks: "${query}"

${context ? `Additional context: ${JSON.stringify(context)}` : ''}

Respond in ${langMap[language] || 'English'} language. Be practical, specific, and empathetic. Include:
1. Direct answer to the question
2. Step-by-step actionable advice
3. Any warnings or precautions
Keep the response concise but helpful (under 300 words).`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    res.json({ response: responseText });
  } catch (error: any) {
    console.error('AI advisory error:', error.message);
    res.status(500).json({ error: 'Failed to generate advisory response' });
  }
};
