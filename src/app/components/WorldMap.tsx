'use client';

import './WorldMap.css'
import {MapContainer, TileLayer, Marker, FeatureGroup, Popup} from 'react-leaflet';
import {DivIcon, FeatureGroup as LFeatureGroup, Map} from 'leaflet';
import React from 'react'
import {DateTime} from "luxon";

export interface Pin {
    name: string;
    latitude: number;
    longitude: number;
    time: string;
    date: string,
    dateTime?: DateTime;
}

interface WorldMapProps {
    fromZone?: Pin;
    toZones: Pin[];
}


export default function WorldMap({fromZone, toZones}: WorldMapProps) {
    const fromTimeZone = fromZone || {name: '', latitude: 0, longitude: 0, time: '', date: ''} as Pin;
    const mapRef = React.useRef<Map>(null);
    const groupRef = React.useRef<LFeatureGroup>(null);

    fromTimeZone.dateTime = DateTime.fromISO(fromTimeZone.date, {setZone: true});

    setTimeout(() => {

        if (!mapRef.current || !groupRef.current) {
            return;
        }
        const map = mapRef.current;
        const group = groupRef.current;
        map.fitBounds(group.getBounds());
        map.setZoom(map.getZoom() - 1);
        group.eachLayer((layer) => {
            if (layer.openPopup) {
                layer.openPopup();
            }
        });
    }, 1)

    const divIcon = new DivIcon({
        className: 'custom-icon',
        html: `<div class="circle"></div>`
    });

    return (
        <MapContainer zoom={3} center={[0, 0]} ref={mapRef} style={{height: '100vh', width: '100%'}}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            <FeatureGroup ref={groupRef}>
                {/* From Zone Marker */}
                <Marker position={[fromTimeZone.latitude, fromTimeZone.longitude]} icon={divIcon}>
                    <Popup autoClose={false} closeButton={false} closeOnClick={false}>
                        <h1>
                            {fromTimeZone.time.split(' ').pop()}<br/>{fromTimeZone.dateTime.toFormat('yyyy-MM-dd HH:mm')}
                        </h1>

                    </Popup>
                </Marker>

                {/* To Zones Markers */}
                {toZones.map((zone, index) => {
                    zone.dateTime = DateTime.fromISO(zone.date, {setZone: true});
                    return (
                        <Marker key={index} position={[zone.latitude, zone.longitude]} icon={divIcon}>
                            <Popup autoClose={false} closeButton={false} closeOnClick={false}>
                                <h3>
                                    {zone.time.split(' ').pop()}<br/>{zone.dateTime.toFormat('yyyy-MM-dd HH:mm')}

                                </h3>
                            </Popup>
                        </Marker>
                    )
                })}
            </FeatureGroup>
        </MapContainer>
    );
}