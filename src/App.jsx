import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { calculateRunoff, calculateDaysOfReserve } from './utils/hydrology';
import './App.css';

// Pre-configured water hubs. In production, these IDs and coordinates would be fetched 
// dynamically from the mWater API database.
const WATER_HUBS = [
  {
    id: 1,
    name: 'Nairobi North',
    lat: -1.2921,
    lon: 36.8219,
    curveNumber: 78,
    catchmentArea: 1200,
    currentTankLiters: 15000,
    dailyConsumption: 3200
  },
  {
    id: 2,
    name: 'Kisumu East',
    lat: -0.1022,
    lon: 34.7617,
    curveNumber: 74,
    catchmentArea: 980,
    currentTankLiters: 12500,
    dailyConsumption: 2800
  },
  {
    id: 3,
    name: 'Mombasa Coastal',
    lat: -4.0435,
    lon: 39.6682,
    curveNumber: 82,
    catchmentArea: 1100,
    currentTankLiters: 17000,
    dailyConsumption: 3000
  }
];

export default function App() {
  const [activeHub, setActiveHub] = useState(WATER_HUBS[0]);
  const [waterMetrics, setWaterMetrics] = useState({
    projectedRunoff: 0,
    daysRemaining: 0,
    forecastChartData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocalizedHydrologyData(activeHub);
  }, [activeHub]);

  const fetchLocalizedHydrologyData = async (hub) => {
    setLoading(true);
    try {
      // NOTE: This represents the structure for the ICPAC East Africa Hazards Watch API.
      // You would replace 'wrf_rainfall_layer_id' with the actual live layer ID from ICPAC.
      /*
      const response = await fetch(`https://eahazardswatch.icpac.net/api/raster-data/pixel/{wrf_rainfall_layer_id}?lon=${hub.lon}&lat=${hub.lat}`);
      const apiData = await response.json();
      */

      // Simulated 24-hour API response for demonstration
      const simulatedForecast = Array.from({ length: 8 }, (_, i) => ({
        time: `${(i * 3).toString().padStart(2, '0')}:00`,
        precipitationMm: Math.random() > 0.5? Math.random() * 15 : 0 
      }));

      let totalRunoffLiters = 0;
      
      const processedForecast = simulatedForecast.map(interval => {
        // 1. Calculate the direct runoff depth in mm using the SCS-CN algorithm
        const runoffDepthMm = calculateRunoff(interval.precipitationMm, hub.curveNumber);
        
        // 2. Convert depth to volume (1 mm over 1 sq meter = 1 Liter)
        const inflowLiters = Math.round(runoffDepthMm * hub.catchmentArea);
        totalRunoffLiters += inflowLiters;

        return {
          time: interval.time,
          projectedInflowLiters: inflowLiters
        };
      });

      // 3. Calculate the critical "Days of Reserve" metric
      const days = calculateDaysOfReserve(hub.currentTankLiters, totalRunoffLiters, hub.dailyConsumption);

      setWaterMetrics({
        projectedRunoff: totalRunoffLiters,
        daysRemaining: days,
        forecastChartData: processedForecast
      });

    } catch (error) {
      console.error("Error fetching hydro-meteorological data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Determine dynamic background (can be expanded based on season or time)
  const backgroundClass = waterMetrics.projectedRunoff > 5000? 'bg-weather-rain-day' : 'bg-weather-clear-day';

  return (
    <div className={`app ${backgroundClass}`}>
      <main>
        {/* Hub Selection Toggle (reusing the toggle-container class) */}
        <div className="toggle-container">
          {WATER_HUBS.map(hub => (
            <button 
              key={hub.id}
              className="toggle-btn"
              style={{ background: activeHub.id === hub.id? 'rgba(255, 255, 255, 0.4)' : '' }}
              onClick={() => setActiveHub(hub)}
            >
              {hub.name}
            </button>
          ))}
        </div>

        {loading? (
          <div className="landing-welcome"><h1>Synchronizing Telemetry...</h1></div>
        ) : (
          <div className="weather-display">
            
            <div className="location-box">
              <div className="location">{activeHub.name}</div>
              <div className="date">Smart ATM Telemetry & Runoff Forecast</div>
            </div>

            {/* Repurposed Severe Weather Warning: Triggers automated rationing alerts */}
            {waterMetrics.daysRemaining < 7 && (
              <div className="alert-banner">
                URGENT: Water Reserve Critically Low ({waterMetrics.daysRemaining} Days). Automated rationing protocols initiated. Max 20L per RFID transaction.
              </div>
            )}

            {/* Main Metric Box: Reusing the massive.temp class for the critical metric */}
            <div className="weather-box">
              <h1 className="temp">{waterMetrics.daysRemaining} Days</h1>
              <p className="weather-condition">of Reserve Water Remaining</p>
            </div>

            {/* Telemetry Details: Reusing the extra-details grid layout */}
            <div className="extra-details">
              <div className="detail">
                <span>Live Tank Volume</span>
                <strong>{activeHub.currentTankLiters.toLocaleString()} L</strong>
              </div>
              <div className="detail">
                <span>Forecasted Inflow (24h)</span>
                <strong>{waterMetrics.projectedRunoff.toLocaleString()} L</strong>
              </div>
              <div className="detail">
                <span>Avg. Consumption</span>
                <strong>{activeHub.dailyConsumption.toLocaleString()} L/Day</strong>
              </div>
            </div>

            {/* Recharts Container: Plotted Runoff Inflow */}
            <div className="chart-container">
              <h3>24-Hour Catchment Inflow Projection</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={waterMetrics.forecastChartData}>
                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.7)" tick={{fill: 'white'}} />
                    <YAxis stroke="rgba(255,255,255,0.7)" tick={{fill: 'white'}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(25, 25, 35, 0.85)', border: 'none', borderRadius: '8px' }}
                      itemStyle={{ color: '#00E5FF', fontWeight: 'bold' }}
                      labelStyle={{ color: 'rgba(255,255,255,0.7)', marginBottom: '5px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="projectedInflowLiters" 
                      name="Inflow (L)"
                      stroke="#00E5FF" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#00E5FF' }} 
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}