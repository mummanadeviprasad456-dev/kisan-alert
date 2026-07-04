import React, { useState } from 'react';
import {
  MessageCircle, CheckCircle, Clock, Send,
  User, Sprout, Eye, ChevronRight,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import StatsCard from '../components/common/StatsCard';
import VoiceAssistant from '../components/speech/VoiceAssistant';
import FarmMap from '../components/maps/FarmMap';
import toast from 'react-hot-toast';

// Mock advisory data
const mockAdvisories = [
  {
    id: '1', farmerId: 'F001', farmerName: 'Ramesh Kumar',
    query: 'My rice leaves are turning yellow from tips. What could be the issue?',
    cropType: 'Rice', location: { lat: 17.3, lng: 78.5 },
    soilData: { nitrogen: 45, phosphorus: 30, potassium: 55, pH: 6.2, moisture: 38 },
    status: 'pending' as const, createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: '2', farmerId: 'F002', farmerName: 'Lakshmi Devi',
    query: 'When is the best time to sow cotton in our region? Soil is red clay type.',
    cropType: 'Cotton', location: { lat: 16.5, lng: 79.2 },
    soilData: { nitrogen: 70, phosphorus: 55, potassium: 40, pH: 7.1, moisture: 55 },
    status: 'pending' as const, createdAt: new Date(Date.now() - 7200000),
  },
  {
    id: '3', farmerId: 'F003', farmerName: 'Venkata Rao',
    query: 'Which fertilizer should I use for groundnut at pegging stage?',
    cropType: 'Groundnut', location: { lat: 15.8, lng: 78.0 },
    soilData: { nitrogen: 90, phosphorus: 40, potassium: 35, pH: 6.8, moisture: 42 },
    status: 'resolved' as const, createdAt: new Date(Date.now() - 86400000),
    response: 'Apply Gypsum at 500 kg/ha at pegging stage. Also apply a foliar spray of DAP 2% to improve pod filling.',
  },
];

const ExpertDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const [advisories, setAdvisories] = useState(mockAdvisories);
  const [selectedAdvisory, setSelectedAdvisory] = useState<typeof mockAdvisories[0] | null>(null);
  const [responseText, setResponseText] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  const filteredAdvisories = advisories.filter(
    (a) => filter === 'all' || a.status === filter
  );

  const pendingCount = advisories.filter((a) => a.status === 'pending').length;
  const resolvedCount = advisories.filter((a) => a.status === 'resolved').length;

  const handleRespond = () => {
    if (!selectedAdvisory || !responseText.trim()) {
      toast.error('Please write a response');
      return;
    }

    setAdvisories((prev) =>
      prev.map((a) =>
        a.id === selectedAdvisory.id
          ? { ...a, status: 'resolved' as const, response: responseText }
          : a
      )
    );
    setSelectedAdvisory({ ...selectedAdvisory, status: 'resolved', response: responseText });
    setResponseText('');
    toast.success('Response sent to farmer!');
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-600/5 to-purple-500/10 rounded-3xl border border-blue-500/10 p-6">
        <h2 className="text-2xl font-bold text-white mb-1">
          👨‍🔬 {t('welcome_expert')}, {profile?.name || 'Expert'}
        </h2>
        <p className="text-gray-400 text-sm">Review and respond to farmer queries</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Queries" value={advisories.length} icon={<MessageCircle size={20} />} color="blue" />
        <StatsCard title={t('pending')} value={pendingCount} icon={<Clock size={20} />} color="amber" trend={pendingCount > 0 ? 'up' : 'neutral'} trendValue={`${pendingCount} new`} />
        <StatsCard title={t('resolved')} value={resolvedCount} icon={<CheckCircle size={20} />} color="emerald" />
        <StatsCard title="Farmers Helped" value={resolvedCount} icon={<User size={20} />} color="purple" />
      </div>

      {/* Filter + List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Advisory List */}
        <div className="lg:col-span-1 bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Queries</h3>
            <div className="flex gap-1 bg-white/5 rounded-xl p-1">
              {(['all', 'pending', 'resolved'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all capitalize ${
                    filter === f ? 'bg-emerald-500/20 text-emerald-300' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredAdvisories.map((advisory) => (
              <button
                key={advisory.id}
                onClick={() => setSelectedAdvisory(advisory)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedAdvisory?.id === advisory.id
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-white/5 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{advisory.farmerName}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    advisory.status === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {advisory.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{advisory.query}</p>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-600">
                  <Sprout size={10} /> {advisory.cropType}
                  <span>•</span>
                  <Clock size={10} /> {advisory.createdAt.toLocaleTimeString()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail View */}
        <div className="lg:col-span-2 bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
          {selectedAdvisory ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Eye size={18} className="text-blue-400" />
                  Query Detail
                </h3>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  selectedAdvisory.status === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {selectedAdvisory.status}
                </span>
              </div>

              {/* Farmer Info */}
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold">
                    {selectedAdvisory.farmerName[0]}
                  </div>
                  <div>
                    <p className="font-medium text-white">{selectedAdvisory.farmerName}</p>
                    <p className="text-xs text-gray-500">Crop: {selectedAdvisory.cropType}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-300 bg-white/5 rounded-xl p-3">{selectedAdvisory.query}</p>
              </div>

              {/* Soil Data */}
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-emerald-300 mb-3">{t('soil_data')}</h4>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(selectedAdvisory.soilData).map(([key, val]) => (
                    <div key={key} className="bg-white/5 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-white">{val}</p>
                      <p className="text-[10px] text-gray-500 capitalize">{key}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map */}
              <FarmMap
                initialLat={selectedAdvisory.location.lat}
                initialLng={selectedAdvisory.location.lng}
                height="200px"
                markers={[{ lat: selectedAdvisory.location.lat, lng: selectedAdvisory.location.lng, label: selectedAdvisory.farmerName + "'s Farm" }]}
              />

              {/* Response */}
              {selectedAdvisory.status === 'resolved' && selectedAdvisory.response ? (
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-emerald-300 mb-2">Your Response:</h4>
                  <p className="text-sm text-gray-300">{selectedAdvisory.response}</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-semibold text-white">{t('respond')}</h4>
                    <VoiceAssistant onTranscript={setResponseText} />
                  </div>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none"
                    placeholder="Write your expert advice here..."
                  />
                  <button
                    onClick={handleRespond}
                    className="mt-3 w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:from-blue-400 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    <Send size={18} />
                    Send Response
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-gray-600">
              <MessageCircle size={48} className="mb-3 opacity-30" />
              <p className="text-sm">Select a query from the list to view details</p>
              <ChevronRight size={16} className="mt-2 animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpertDashboard;
