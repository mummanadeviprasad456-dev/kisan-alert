import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';


interface FarmMapProps {
  onLocationSelect?: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  markers?: Array<{ lat: number; lng: number; label: string }>;
  height?: string;
}

const FarmMap: React.FC<FarmMapProps> = ({
  onLocationSelect,
  initialLat = 17.385,
  initialLng = 78.4867,
  markers = [],
  height = '400px',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  
  const [selectedPos, setSelectedPos] = useState({ lat: initialLat, lng: initialLng });
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Dynamically load Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const initMap = async () => {
      const L = await import('leaflet');

      if (!mapRef.current || mapInstanceRef.current) return;

      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current).setView([initialLat, initialLng], 10);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      // Current position marker
      const currentMarker = L.marker([initialLat, initialLng], { draggable: !!onLocationSelect }).addTo(map);
      currentMarker.bindPopup('📍 Your Farm Location').openPopup();

      if (onLocationSelect) {
        currentMarker.on('dragend', (e: any) => {
          const pos = e.target.getLatLng();
          setSelectedPos({ lat: pos.lat, lng: pos.lng });
          onLocationSelect(pos.lat, pos.lng);
        });

        map.on('click', (e: any) => {
          currentMarker.setLatLng(e.latlng);
          setSelectedPos({ lat: e.latlng.lat, lng: e.latlng.lng });
          onLocationSelect(e.latlng.lat, e.latlng.lng);
        });
      }

      // Additional markers
      markers.forEach((m) => {
        L.marker([m.lat, m.lng]).addTo(map).bindPopup(m.label);
      });

      setMapLoaded(true);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10">
      <div ref={mapRef} style={{ height, width: '100%' }} className="z-0" />
      <div className="absolute bottom-3 left-3 bg-gray-900/80 backdrop-blur-md rounded-xl px-4 py-2 flex items-center gap-2 text-sm text-emerald-300 z-[1000]">
        <MapPin size={16} />
        <span>
          {selectedPos.lat.toFixed(4)}, {selectedPos.lng.toFixed(4)}
        </span>
      </div>
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center z-[1001]">
          <div className="animate-spin h-8 w-8 border-4 border-emerald-400/30 border-t-emerald-400 rounded-full" />
        </div>
      )}
    </div>
  );
};

export default FarmMap;
