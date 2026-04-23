import config from 'config';
import styled from 'styled-components';
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';

interface MapProps {
  id: string;
  lat: number;
  lng: number;
  zoom?: number;
}

const MapWrapper = styled.div`
  display: flex;
  flex: 1 1 100%;
  height: 300px;

  #map-car-delivery {
    flex: 1 1 auto;
  }
`;

export default function Map({ id, lat, lng, zoom = 15 }: MapProps): JSX.Element {
  const { isLoaded } = useJsApiLoader({
    id: `${id}-loader`,
    googleMapsApiKey: config.googleMapsApiKey
  });

  return (
    <MapWrapper>
      {isLoaded ? (
        <GoogleMap id={`${id}-map`} center={{ lat, lng }} zoom={zoom}>
          <InfoWindow position={{ lat, lng }}>
            <h4>Bangkok Center!</h4>
          </InfoWindow>
        </GoogleMap>
      ) : null}
    </MapWrapper>
  );
}
