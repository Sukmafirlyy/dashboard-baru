import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import GaugeComponent from 'react-gauge-component';
import logo from './assets/Images/Logo-PT-INKA.png';
import SensorContext from './contexts/SensorContext';

function Home() {
  const {
    sensorData,
    gaugeValue,
    encoderDistance, // Menggunakan encoderDistance dari SensorContext
    currentTime,
    rfidData,
    kmhToMs
  } = useContext(SensorContext);

  // Define the maximum speed for the gauge
  const MAX_SPEED = 120;

  // Define the gauge limits with their respective colors
  const gaugeLimits = [
    { color: '#00ff00', limit: 80 },
    { color: '#ffff00', limit: 130 },
    { color: '#F58B19', limit: 200 },
    { color: '#ff0000', limit: MAX_SPEED }
  ];

  const navigate = useNavigate();
  const lastSensorData = sensorData.length > 0 ? sensorData[sensorData.length - 1].speed : 0;
  const { value: convertedValue, unit: speedUnit } = kmhToMs(lastSensorData);

  // Check if the speed exceeds the limit
  const isSpeedExceeded = lastSensorData > 20;

  // Convert encoderDistance to kilometers or meters based on the value
  const displayDistance = encoderDistance < 1 ? (encoderDistance * 1000).toFixed(2) + ' m' : encoderDistance.toFixed(2) + ' km';

  return (
    <main className='main-container'>
      {isSpeedExceeded && (
        <div className='warning'>
          Warning: Speed exceeds maximum limit!
        </div>
      )}
      <div className='gauge-chart'>
        <h3>Gauge Chart</h3>
        <GaugeComponent
          className='gauge-component'
          arc={{
            nbSubArcs: gaugeLimits.length,
            colorArray: gaugeLimits.map(limit => limit.color),
            width: 0.3,
            padding: 0.003
          }}
          labels={{
            valueLabel: {
              fontSize: 40,
              formatTextValue: value => kmhToMs(value).value + ' ' + kmhToMs(value).unit
            }
          }}
          value={gaugeValue}
          maxValue={MAX_SPEED}
        />
      </div>
      <div className='main-cards'>
        <div className='card'>
          <div className='card-inner'>
            <h3>Speed Rated</h3>
          </div>
          <div className="d-flex align-items-center">
            <h2 id='speedValue'>{convertedValue}</h2>
            <span className="unit">{speedUnit}</span>
          </div>
        </div>
        <div className='card'>
          <div className='card-inner'>
            <h3>Train Position</h3>
          </div>
          <div className="d-flex align-items-center">
            <h2>{displayDistance}</h2>
          </div>
        </div>
        <div className='card'>
          <div className='card-inner'>
            <h3>Block</h3>
          </div>
          <div className="d-flex align-items-center">
            <h2>{rfidData.length > 0 ? rfidData[rfidData.length - 1].name : 'Stand by ...'}</h2>
            <h3>{rfidData.length > 0 ? rfidData[rfidData.length - 1].tag_id : 'Reading ...'}</h3>
          </div>
        </div>
      </div>
      <div className='button-container'>
        <div className='company'>
          <div className="d-flex align-items-center">
            <img src={logo} alt="PT.Inka" className="company-logo" />
          </div>
        </div>
        <div className='info-card'>
          <div className="d-flex align-items-center">
            <h2>{currentTime}</h2>
          </div>
        </div>
        <div className='button'>
          <button onClick={() => navigate('/history')}>History</button>
        </div>
      </div>
      <div className='line-chart'>
        <h3>Line chart (v-s)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={sensorData}
            margin={{
              top: 5,
              right: 30,
              left: 10,
              bottom: 9,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="distance" label={{ value: "Distance (km)", position: 'insideBottomRight', offset: 0 }} />
            <YAxis label={{ value: "Speed (Km/h)", angle: -90, position: 'insideLeft', dx: 4, dy: 50 }}
              domain={[0, 30]}
              ticks={[0, 10, 20, 30]}
            />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="speed" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </main>
  );
}

export default Home;
