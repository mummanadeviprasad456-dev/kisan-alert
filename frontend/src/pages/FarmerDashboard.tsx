import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Cloud, Droplets, Wind, Thermometer, Sun, Upload, Send,
  Sprout, Bug, Zap, MapPin, BarChart3, Leaf, AlertTriangle, Navigation,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import StatsCard from '../components/common/StatsCard';
import VoiceAssistant from '../components/speech/VoiceAssistant';
import FarmMap from '../components/maps/FarmMap';
import useGeolocation from '../hooks/useGeolocation';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface WeatherData {
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    wind_speed: number;
    description: string;
    icon: string;
    rainfall: number;
    uv_index: number;
  };
  forecast: Array<{
    date: string;
    temp_max: number;
    temp_min: number;
    humidity: number;
    description: string;
    icon: string;
    rain_chance: number;
  }>;
  location: { lat: number; lon: number; name: string };
}

const FarmerDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { language } = useLanguage();
  const { profile } = useAuth();

  // State
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname.split('/').pop() || 'overview';
  const activeSection = (path === 'dashboard' || path === 'weather') ? 'overview' : path;
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [farmLocation, setFarmLocation] = useState({ lat: 17.385, lng: 78.4867 });
  const { position: gpsPosition, loading: gpsLoading, error: gpsError, requestLocation } = useGeolocation();

  // Soil form
  const [soilData, setSoilData] = useState({
    nitrogen: 80, phosphorus: 45, potassium: 50, pH: 6.5, moisture: 42,
  });

  // Crop recommendation results
  const [cropResults, setCropResults] = useState<any>(null);
  const [cropLoading, setCropLoading] = useState(false);

  // Disease detection
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [diseaseResult, setDiseaseResult] = useState<any>(null);
  const [diseaseLoading, setDiseaseLoading] = useState(false);

  // Irrigation
  const [irrigationResult, setIrrigationResult] = useState<any>(null);

  // Advisory
  const [advisoryQuery, setAdvisoryQuery] = useState('');
  const [advisoryResponse, setAdvisoryResponse] = useState('');
  const [advisoryLoading, setAdvisoryLoading] = useState(false);

  // On mount: request GPS immediately
  useEffect(() => {
    requestLocation();
  }, []);

  // When GPS resolves, update map + weather
  useEffect(() => {
    if (gpsPosition) {
      setFarmLocation({ lat: gpsPosition.lat, lng: gpsPosition.lng });
      fetchWeather(gpsPosition.lat, gpsPosition.lng);
    }
  }, [gpsPosition]);

  // If GPS fails, fall back to Hyderabad weather
  useEffect(() => {
    if (gpsError && !gpsPosition) {
      fetchWeather(17.385, 78.4867);
    }
  }, [gpsError]);

  const fetchWeather = async (lat: number, lng: number) => {
    try {
      const res = await axios.get(`${API_URL}/weather`, { params: { lat, lon: lng } });
      setWeather(res.data);
    } catch (error) {
      // Use mock weather data if API is down
      setWeather({
        current: {
          temp: 32, feels_like: 35, humidity: 68, pressure: 1012,
          wind_speed: 5.2, description: 'Partly Cloudy', icon: '02d',
          rainfall: 2.5, uv_index: 7,
        },
        forecast: [
          { date: '2026-07-05', temp_max: 35, temp_min: 24, humidity: 72, description: 'Sunny', icon: '01d', rain_chance: 10 },
          { date: '2026-07-06', temp_max: 33, temp_min: 23, humidity: 78, description: 'Cloudy', icon: '04d', rain_chance: 45 },
          { date: '2026-07-07', temp_max: 29, temp_min: 22, humidity: 85, description: 'Light Rain', icon: '10d', rain_chance: 80 },
          { date: '2026-07-08', temp_max: 31, temp_min: 23, humidity: 70, description: 'Sunny', icon: '01d', rain_chance: 15 },
          { date: '2026-07-09', temp_max: 34, temp_min: 25, humidity: 65, description: 'Clear', icon: '01d', rain_chance: 5 },
        ],
        location: { lat, lon: lng, name: 'Hyderabad' },
      });
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setFarmLocation({ lat, lng });
    fetchWeather(lat, lng);
  };

  const getCropRecommendation = async () => {
    setCropLoading(true);
    try {
      const res = await axios.post(`${API_URL}/ai/crop-recommendation`, {
        soil: soilData,
        weather: weather?.current,
        location: farmLocation,
        language,
      });
      setCropResults(res.data);
      toast.success(t('success'));
    } catch (error) {
      // Fallback mock data
      setCropResults({
        recommendations: [
          { crop: 'Rice (Paddy)', suitability: 92, season: 'Kharif', reasons: ['High moisture', 'Good NPK'], tips: ['Maintain standing water', 'Split urea doses'] },
          { crop: 'Cotton', suitability: 78, season: 'Kharif', reasons: ['Good pH', 'K levels OK'], tips: ['Ensure drainage', 'Scout for bollworm'] },
          { crop: 'Groundnut', suitability: 71, season: 'Rabi', reasons: ['Moderate N', 'Well-draining'], tips: ['Apply gypsum', 'Avoid excess N'] },
        ],
        fertilizer: {
          nitrogen: 'Apply 40 kg/ha additional Nitrogen',
          phosphorus: 'Apply 15 kg/ha additional Phosphorus',
          potassium: 'Potassium levels are adequate',
          organic: 'Apply 5 tonnes/ha farmyard manure',
        },
        groundwater: { level: 'Moderate (8-12m)', quality: 'Good', advisory: 'Use drip irrigation' },
      });
      toast.success('Using demo recommendations');
    } finally {
      setCropLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const detectDisease = async () => {
    if (!selectedImage) {
      toast.error('Please upload an image first');
      return;
    }
    setDiseaseLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      const res = await axios.post(`${API_URL}/ai/disease-detection`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDiseaseResult(res.data);
      toast.success(t('success'));
    } catch {
      setDiseaseResult({
        disease: 'Leaf Blight', confidence: 87, crop: 'Rice',
        symptoms: ['Brown oval lesions', 'Yellow halos', 'Leaf drying'],
        treatment: {
          organic: ['Trichoderma seed treatment', 'Neem oil spray'],
          chemical: ['Mancozeb 2.5g/L', 'Propiconazole 1ml/L'],
        },
        prevention: ['Use resistant varieties', 'Proper spacing', 'Avoid excess N'],
      });
      toast.success('Using demo analysis');
    } finally {
      setDiseaseLoading(false);
    }
  };

  const getIrrigation = async () => {
    try {
      const res = await axios.post(`${API_URL}/weather/irrigation`, {
        soilMoisture: soilData.moisture,
        temp: weather?.current.temp,
        humidity: weather?.current.humidity,
        cropType: cropResults?.recommendations?.[0]?.crop?.toLowerCase() || 'rice',
        rainfall: weather?.current.rainfall,
      });
      setIrrigationResult(res.data);
    } catch {
      setIrrigationResult({
        recommendation: 'Soil moisture is below optimal. Irrigate with 4.2mm within 24 hours.',
        waterNeeded: 4.2, urgency: 'medium', et0: 0.52,
        currentMoisture: soilData.moisture, optimalMoisture: 60,
      });
    }
  };

  const askAdvisory = async () => {
    if (!advisoryQuery.trim()) return;
    setAdvisoryLoading(true);
    try {
      const res = await axios.post(`${API_URL}/ai/advisory`, {
        query: advisoryQuery, language, context: { soil: soilData, weather: weather?.current },
      });
      setAdvisoryResponse(res.data.response);
    } catch {
      setAdvisoryResponse(`Thank you for asking about "${advisoryQuery}". Based on current conditions: maintain regular irrigation, monitor soil health, and consult your local agricultural officer for specific guidance.`);
    } finally {
      setAdvisoryLoading(false);
    }
  };

  const urgencyColors: Record<string, string> = {
    low: 'text-emerald-400 bg-emerald-500/10', medium: 'text-amber-400 bg-amber-500/10',
    high: 'text-orange-400 bg-orange-500/10', critical: 'text-red-400 bg-red-500/10',
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-green-600/5 to-teal-500/10 rounded-3xl border border-emerald-500/10 p-6">
        <h2 className="text-2xl font-bold text-white mb-1">
          🌾 {t('welcome_farmer')}, {profile?.name || 'Farmer'}!
        </h2>
        <p className="text-gray-400 text-sm">AI-powered insights for your farm • {new Date().toLocaleDateString()}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title={t('temperature')} value={`${weather?.current.temp?.toFixed(1) || '--'}°C`} icon={<Thermometer size={20} />} color="amber" trend="up" trendValue="+2°" />
        <StatsCard title={t('humidity')} value={`${weather?.current.humidity || '--'}%`} icon={<Droplets size={20} />} color="blue" />
        <StatsCard title={t('wind_speed')} value={`${weather?.current.wind_speed?.toFixed(1) || '--'} m/s`} icon={<Wind size={20} />} color="purple" />
        <StatsCard title={t('rainfall')} value={`${weather?.current.rainfall?.toFixed(1) || '0'} mm`} icon={<Cloud size={20} />} color="emerald" />
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'overview', icon: BarChart3, label: t('weather') },
          { id: 'crop', icon: Sprout, label: t('crop_recommendation') },
          { id: 'disease', icon: Bug, label: t('disease_detection') },
          { id: 'irrigation', icon: Droplets, label: t('irrigation') },
          { id: 'advisory', icon: Send, label: t('advisories') },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.id === 'overview' ? '/dashboard' : `/dashboard/${tab.id}`)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeSection === tab.id
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                : 'bg-white/5 text-gray-500 border border-white/5 hover:text-gray-300 hover:border-white/10'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── WEATHER / OVERVIEW SECTION ──────────────────────── */}
      {activeSection === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map */}
          <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <MapPin size={18} className="text-emerald-400" /> {t('select_location')}
              </h3>
              <button
                onClick={() => {
                  requestLocation();
                  toast.loading('Getting your location…', { id: 'gps' });
                  setTimeout(() => toast.dismiss('gps'), 3000);
                }}
                disabled={gpsLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/25 transition-all disabled:opacity-50"
              >
                <Navigation size={13} className={gpsLoading ? 'animate-pulse' : ''} />
                {gpsLoading ? 'Locating…' : 'Use My Location'}
              </button>
            </div>
            <FarmMap onLocationSelect={handleLocationSelect} initialLat={farmLocation.lat} initialLng={farmLocation.lng} height="350px" />
          </div>

          {/* 5-Day Forecast */}
          <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Sun size={18} className="text-amber-400" /> {t('forecast')}
            </h3>
            <div className="space-y-3">
              {weather?.forecast.map((day, i) => (
                <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {day.description.includes('rain') ? '🌧️' : day.description.includes('cloud') ? '⛅' : '☀️'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{new Date(day.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                      <p className="text-xs text-gray-500 capitalize">{day.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{day.temp_max.toFixed(0)}° / {day.temp_min.toFixed(0)}°</p>
                    <p className="text-xs text-blue-400">🌧 {day.rain_chance}%</p>
                  </div>
                </div>
              )) || <p className="text-gray-500 text-sm">Loading forecast...</p>}
            </div>
          </div>
        </div>
      )}

      {/* ─── CROP RECOMMENDATION SECTION ─────────────────────── */}
      {activeSection === 'crop' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Soil Input Form */}
          <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Leaf size={18} className="text-emerald-400" /> {t('soil_data')}
            </h3>
            <div className="space-y-4">
              {[
                { key: 'nitrogen', label: t('nitrogen'), max: 200 },
                { key: 'phosphorus', label: t('phosphorus'), max: 150 },
                { key: 'potassium', label: t('potassium'), max: 150 },
                { key: 'pH', label: t('ph_level'), max: 14 },
                { key: 'moisture', label: t('soil_moisture'), max: 100 },
              ].map((field) => (
                <div key={field.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{field.label}</span>
                    <span className="text-emerald-300 font-medium">{(soilData as any)[field.key]}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={field.max}
                    step={field.key === 'pH' ? 0.1 : 1}
                    value={(soilData as any)[field.key]}
                    onChange={(e) => setSoilData({ ...soilData, [field.key]: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              ))}
              <button
                onClick={getCropRecommendation}
                disabled={cropLoading}
                className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-3 rounded-xl hover:from-emerald-400 hover:to-green-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {cropLoading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <>
                    <Sprout size={18} />
                    {t('get_recommendations')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4">AI {t('crop_recommendation')}</h3>
            {cropResults ? (
              <div className="space-y-4">
                {cropResults.recommendations?.map((rec: any, i: number) => (
                  <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-emerald-500/20 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white flex items-center gap-2">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {rec.crop}
                      </h4>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                        rec.suitability >= 80 ? 'bg-emerald-500/20 text-emerald-300' :
                        rec.suitability >= 60 ? 'bg-amber-500/20 text-amber-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {rec.suitability}% {t('suitability')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{t('season')}: {rec.season}</p>
                    <ul className="space-y-1">
                      {rec.tips?.map((tip: string, j: number) => (
                        <li key={j} className="text-xs text-gray-400 flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">•</span> {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Fertilizer Plan */}
                {cropResults.fertilizer && (
                  <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/10">
                    <h4 className="font-semibold text-emerald-300 mb-2 flex items-center gap-2">
                      <Zap size={16} /> {t('fertilizer_plan')}
                    </h4>
                    {Object.entries(cropResults.fertilizer).map(([key, val]) => (
                      <p key={key} className="text-xs text-gray-400 mb-1">• {val as string}</p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-600">
                <Sprout size={48} className="mb-3 opacity-30" />
                <p className="text-sm">Enter soil data and click to get AI recommendations</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── DISEASE DETECTION SECTION ────────────────────────── */}
      {activeSection === 'disease' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload */}
          <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Bug size={18} className="text-red-400" /> {t('upload_image')}
            </h3>
            <label className="block w-full cursor-pointer">
              <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                imagePreview ? 'border-emerald-500/30' : 'border-white/10 hover:border-white/20'
              }`}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover rounded-xl" />
                ) : (
                  <div className="flex flex-col items-center text-gray-500">
                    <Upload size={40} className="mb-3 opacity-40" />
                    <p className="text-sm font-medium">Click or drag an image here</p>
                    <p className="text-xs mt-1">JPG, PNG up to 10MB</p>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            <button
              onClick={detectDisease}
              disabled={diseaseLoading || !selectedImage}
              className="w-full mt-4 bg-gradient-to-r from-red-500 to-orange-600 text-white font-semibold py-3 rounded-xl hover:from-red-400 hover:to-orange-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
            >
              {diseaseLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <>
                  <Bug size={18} />
                  {t('detect_disease')}
                </>
              )}
            </button>
          </div>

          {/* Results */}
          <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4">AI Diagnosis</h3>
            {diseaseResult ? (
              <div className="space-y-4">
                <div className={`rounded-xl p-4 border ${
                  diseaseResult.disease === 'Healthy'
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-red-500/10 border-red-500/20'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-lg text-white">{diseaseResult.disease}</h4>
                    <span className={`text-sm font-bold px-3 py-1 rounded-lg ${
                      diseaseResult.confidence >= 80 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {diseaseResult.confidence}% {t('confidence')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{t('crop_recommendation')}: {diseaseResult.crop}</p>
                </div>

                {/* Symptoms */}
                <div className="bg-white/5 rounded-xl p-4">
                  <h5 className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-2">
                    <AlertTriangle size={14} /> {t('symptoms')}
                  </h5>
                  <ul className="space-y-1">
                    {diseaseResult.symptoms?.map((s: string, i: number) => (
                      <li key={i} className="text-xs text-gray-400">• {s}</li>
                    ))}
                  </ul>
                </div>

                {/* Treatment */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/10">
                    <h5 className="text-xs font-semibold text-emerald-300 mb-2">🌿 {t('organic')}</h5>
                    {diseaseResult.treatment?.organic?.map((t2: string, i: number) => (
                      <p key={i} className="text-xs text-gray-400 mb-1">• {t2}</p>
                    ))}
                  </div>
                  <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/10">
                    <h5 className="text-xs font-semibold text-blue-300 mb-2">🧪 {t('chemical')}</h5>
                    {diseaseResult.treatment?.chemical?.map((t2: string, i: number) => (
                      <p key={i} className="text-xs text-gray-400 mb-1">• {t2}</p>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-600">
                <Bug size={48} className="mb-3 opacity-30" />
                <p className="text-sm">Upload a crop image for AI disease analysis</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── IRRIGATION SECTION ───────────────────────────────── */}
      {activeSection === 'irrigation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Droplets size={18} className="text-blue-400" /> {t('irrigation')}
            </h3>
            <div className="space-y-4 mb-4">
              <div>
                <label className="text-sm text-gray-400">{t('soil_moisture')}</label>
                <div className="mt-2 relative h-4 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                      soilData.moisture > 60 ? 'bg-emerald-500' : soilData.moisture > 30 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${soilData.moisture}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span className="text-white font-medium">{soilData.moisture}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
            <button
              onClick={getIrrigation}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold py-3 rounded-xl hover:from-blue-400 hover:to-cyan-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Droplets size={18} />
              Get Irrigation Advice
            </button>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Irrigation Recommendation</h3>
            {irrigationResult ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border ${urgencyColors[irrigationResult.urgency] || ''}`}>
                  <span className="text-xs font-bold uppercase">{t('urgency')}: {t(irrigationResult.urgency)}</span>
                </div>
                <p className="text-sm text-gray-300">{irrigationResult.recommendation}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-500/10 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-blue-300">{irrigationResult.waterNeeded}</p>
                    <p className="text-xs text-gray-500">{t('water_needed')} (mm)</p>
                  </div>
                  <div className="bg-emerald-500/10 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-300">{irrigationResult.et0}</p>
                    <p className="text-xs text-gray-500">ET₀ (mm/day)</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-600">
                <Droplets size={48} className="mb-3 opacity-30" />
                <p className="text-sm">Click to get real-time irrigation advice</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── ADVISORY SECTION ─────────────────────────────────── */}
      {activeSection === 'advisory' && (
        <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Send size={18} className="text-emerald-400" /> {t('ask_expert')} (AI-Powered)
          </h3>
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={advisoryQuery}
                onChange={(e) => setAdvisoryQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && askAdvisory()}
                placeholder="Ask anything about farming, crops, or weather..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all pr-12"
              />
            </div>
            <VoiceAssistant onTranscript={setAdvisoryQuery} textToSpeak={advisoryResponse} />
            <button
              onClick={askAdvisory}
              disabled={advisoryLoading || !advisoryQuery.trim()}
              className="bg-emerald-500 hover:bg-emerald-400 text-white p-3 rounded-xl transition-all disabled:opacity-50"
            >
              {advisoryLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
          {advisoryResponse && (
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                  🤖
                </div>
                <span className="text-sm font-medium text-emerald-300">Kisan Mitra AI</span>
              </div>
              <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">{advisoryResponse}</p>
            </div>
          )}
        </div>
      )}

      {/* ─── ALERTS / BROADCASTS SECTION ───────────────────────── */}
      {activeSection === 'alerts' && (
        <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5 space-y-4">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-400" /> Active Agricultural Alerts
          </h3>
          <div className="space-y-3">
            {[
              { id: '1', type: 'weather', severity: 'warning', title: 'Heavy Rainfall Expected', message: 'IMD warns of heavy rainfall in Telangana region for next 48 hours.', date: 'Today' },
              { id: '2', type: 'pest', severity: 'critical', title: 'Fall Armyworm Alert', message: 'Fall armyworm outbreak reported in multiple districts. Inspect maize fields immediately.', date: 'Yesterday' }
            ].map((alert) => (
              <div key={alert.id} className={`p-4 rounded-xl border ${
                alert.severity === 'critical' ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-sm text-white">{alert.title}</h4>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-black/20">{alert.severity}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{alert.message}</p>
                <span className="text-[9px] text-gray-500 block mt-2">{alert.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerDashboard;
