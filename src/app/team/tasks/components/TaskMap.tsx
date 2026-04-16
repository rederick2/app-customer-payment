'use client';

import { useEffect, useRef, useState } from 'react';

interface MarkerLocation {
  lat: number;
  lng: number;
  title: string;
  address: string;
  index: number;
}

interface TaskMapProps {
  locations: MarkerLocation[];
  onSelectMarker?: (index: number) => void;
}

declare global {
  interface Window {
    google: any;
    initTaskMap: () => void;
  }
}

export default function TaskMap({ locations, onSelectMarker }: TaskMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!locations.length) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    const initMap = () => {
      if (!mapRef.current || mapInstance.current) return;

      const center = locations.length > 0
        ? { lat: locations[0].lat, lng: locations[0].lng }
        : { lat: 25.7617, lng: -80.1918 };

      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: locations.length === 1 ? 14 : 11,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
          { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
          { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
          { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e2f3' }] },
        ],
      });

      const bounds = new window.google.maps.LatLngBounds();

      locations.forEach((loc, i) => {
        const marker = new window.google.maps.Marker({
          position: { lat: loc.lat, lng: loc.lng },
          map: mapInstance.current,
          title: loc.title,
          label: {
            text: String(i + 1),
            color: 'white',
            fontWeight: 'bold',
            fontSize: '13px',
          },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 18,
            fillColor: '#10b981',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2.5,
          },
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="font-family:sans-serif;padding:4px 4px 0;max-width:200px">
              <div style="font-weight:700;font-size:13px;margin-bottom:4px;color:#0f172a">${loc.title}</div>
              <div style="font-size:11px;color:#64748b">${loc.address}</div>
            </div>
          `,
        });

        marker.addListener('click', () => {
          setActiveIndex(i);
          infoWindow.open(mapInstance.current, marker);
          onSelectMarker?.(i);
        });

        markersRef.current.push({ marker, infoWindow });
        bounds.extend({ lat: loc.lat, lng: loc.lng });
      });

      if (locations.length > 1) {
        mapInstance.current.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
      }
    };

    if (window.google?.maps) {
      initMap();
    } else {
      window.initTaskMap = initMap;
      if (!document.querySelector('#google-maps-script')) {
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initTaskMap`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }
  }, [locations]);

  // Highlight marker when active changes externally
  useEffect(() => {
    markersRef.current.forEach(({ marker, infoWindow }, i) => {
      if (i === activeIndex) {
        marker.setIcon({
          path: window.google?.maps?.SymbolPath?.CIRCLE,
          scale: 22,
          fillColor: '#f59e0b',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        });
        infoWindow.open(mapInstance.current, marker);
      } else {
        marker.setIcon({
          path: window.google?.maps?.SymbolPath?.CIRCLE,
          scale: 18,
          fillColor: '#10b981',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2.5,
        });
      }
    });
  }, [activeIndex]);

  if (!locations.length) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-xl">
        <p className="text-muted-foreground text-sm">No locations to display</p>
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-full rounded-xl" />;
}
