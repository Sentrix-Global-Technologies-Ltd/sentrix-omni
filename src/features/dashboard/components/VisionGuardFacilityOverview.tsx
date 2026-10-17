import { useFacilityMap } from '../../facility/hooks/useFacilityMap';
import { MapPinIcon } from '../../../icons';

/**
 * VisionGuardFacilityOverview
 * Shows a building count from useFacilityMap() over a Bolt-derived CSS map.
 * MOCK: map pins, building layout, and fallback site counts are Bolt references.
 * When the API returns buildings, the site-summary reflects the real count.
 */
export default function VisionGuardFacilityOverview() {
  const { data: result, isLoading, isError } = useFacilityMap();
  const facilityMap = result?.data;

  const hasLiveData = !isLoading && !isError && facilityMap != null;
  // MOCK: Bolt reference counts when no live facility data
  const totalSites   = hasLiveData ? facilityMap!.buildings.length : 16;
  const secureSites  = hasLiveData ? Math.max(0, facilityMap!.buildings.length - 2) : 14;
  const attnSites    = hasLiveData ? Math.min(2, facilityMap!.buildings.length) : 2;
  const isMock       = !hasLiveData && !isLoading;

  return (
    <section className="panel facility-panel">
      <div className="panel-title">
        <h2>
          Facility Overview
          {isMock && (
            <span title="Mock data — no live facility data" style={{ fontSize: 9, opacity: 0.4 }}>*</span>
          )}
        </h2>
        <button className="text-link">Manage</button>
      </div>

      <div className="facility-body">
        {/* MOCK: CSS map layout is the Bolt reference visual */}
        <div className="map">
          <div className="building b1" />
          <div className="building b2" />
          <div className="building b3" />
          <div className="building b4" />
          <div className="building b5" />
          <div className="building b6" />
          <div className="map-pin p1" />
          <div className="map-pin p2" />
          <div className="map-pin p3" />
          <div className="map-pin p4" />
          <div className="map-pin warning" />
        </div>

        <div className="site-summary">
          <div>
            <MapPinIcon style={{ width: 14, height: 14 }} />
            <b>{isLoading ? '…' : totalSites}</b>
            <span>Sites</span>
          </div>
          <div>
            <MapPinIcon style={{ width: 14, height: 14, color: '#12aaa9' }} />
            <b style={{ color: '#12aaa9' }}>{isLoading ? '…' : secureSites}</b>
            <span>Secure</span>
          </div>
          <div>
            <MapPinIcon style={{ width: 14, height: 14, color: '#eca32f' }} />
            <b style={{ color: '#eca32f' }}>{isLoading ? '…' : attnSites}</b>
            <span>Attention</span>
          </div>
        </div>
      </div>
    </section>
  );
}
