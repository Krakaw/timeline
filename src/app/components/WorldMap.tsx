'use client';

import {MapContainer, TileLayer, Marker, Tooltip, FeatureGroup, Popup} from 'react-leaflet';
import React from 'react'
import {LeafletElement} from "@react-leaflet/core";

export interface Pin {
    name: string;
    latitude: number;
    longitude: number;
    time: string;
}

interface WorldMapProps {
    fromZone?: Pin;
    toZones: Pin[];
}


export default function WorldMap({fromZone, toZones}: WorldMapProps) {
    const fromTimeZone = fromZone || {name: '', latitude: 0, longitude: 0, time: ''};
    const mapRef = React.useRef<never>(null);
    const groupRef = React.useRef<never>(null);


    setTimeout(() => {
        console.log(mapRef.current, groupRef.current)

        if (!mapRef.current || !groupRef.current) {
            return;
        }
        const group = groupRef.current;
        mapRef.current?.fitBounds(group.getBounds());
    }, 1)

    return (
        <MapContainer zoom={3} center={[0, 0]} ref={mapRef} style={{height: '100vh', width: '100%'}}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            <FeatureGroup ref={groupRef}>
                {/* From Zone Marker */}
                <Marker position={[fromTimeZone.latitude, fromTimeZone.longitude]}>
                    <Popup><h1>{fromTimeZone.name}</h1></Popup>
                    <Tooltip permanent><h1>{fromTimeZone.time}</h1></Tooltip>
                </Marker>

                {/* To Zones Markers */}
                {toZones.map((zone, index) => (
                    <Marker key={index} position={[zone.latitude, zone.longitude]}>
                        <Tooltip permanent>
                            <h3>{zone.time}</h3>
                        </Tooltip>
                    </Marker>
                ))}
            </FeatureGroup>
        </MapContainer>
    );
}