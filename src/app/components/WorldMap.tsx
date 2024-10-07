'use client';

import './WorldMap.css'
import {MapContainer, TileLayer, Marker, FeatureGroup, Popup} from 'react-leaflet';
import {DivIcon, FeatureGroup as LFeatureGroup, Map} from 'leaflet';
import React, {useEffect, useMemo} from 'react'
import {DateTime} from "luxon";

export interface Pin {
    name: string;
    latitude: number;
    longitude: number;
    time: string;
    date: string,
    dateTime?: DateTime;
    isFrom: boolean;
}

interface WorldMapProps {
    pins: Pin[];
}


export default function WorldMap({pins}: WorldMapProps) {
    const [interactivePins, setInteractivePins] = React.useState<Pin[]>(pins);

    const mapRef = React.useRef<Map>(null);
    const groupRef = React.useRef<LFeatureGroup>(null);
    const changeZoomRef = React.useRef(false);


    setTimeout(() => {

        if (!mapRef.current || !groupRef.current) {
            return;
        }
        const map = mapRef.current;
        const group = groupRef.current;

        group.eachLayer((layer) => {
            if (layer.openPopup) {
                layer.openPopup();
            }
        });
        map.fitBounds(group.getBounds());
        if (!changeZoomRef.current) {
            map.setZoom(map.getZoom() - 1);
            changeZoomRef.current = true;
        }
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


                {/* To Zones Markers */}
                {interactivePins.map((zone, index) => {
                    zone.dateTime = DateTime.fromISO(zone.date, {setZone: true});
                    return (
                        <Marker key={index} position={[zone.latitude, zone.longitude]}
                                icon={divIcon}>
                            <Popup autoClose={false} closeButton={false}
                                   closeOnClick={false}>
                                {(zone.isFrom) ?
                                    (<>
                                        <h1>
                                            {zone.time.split(' ').pop()}<br/>{zone.dateTime.toFormat('yyyy-MM-dd HH:mm')}
                                        </h1>
                                    </>)
                                    :
                                    (<h3 onClick={() => {

                                        interactivePins.forEach((pin) => {
                                            pin.isFrom = false
                                        });
                                        zone.isFrom = true;
                                        setInteractivePins([...interactivePins.filter(p => p.time !== zone.time), zone])
                                    }}>
                                        {zone.time.split(' ').pop()}<br/>{zone.dateTime.toFormat('yyyy-MM-dd HH:mm')}

                                    </h3>)
                                }

                            </Popup>
                        </Marker>
                    )
                })}
            </FeatureGroup>
        </MapContainer>
    );
}