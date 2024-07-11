import React, { createContext, useState, useEffect } from 'react';
import io from 'socket.io-client';

const SensorContext = createContext();

export const SensorProvider = ({ children }) => {
  const [sensorData, setSensorData] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [gaugeValue, setGaugeValue] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0); // Total distance from sensorData (if still needed)
  const [encoderDistance, setEncoderDistance] = useState(0); // Accumulated distance from encoder
  const [prevTimestamp, setPrevTimestamp] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  const [rfidData, setRfidData] = useState([]);

  const MAX_DATA_COUNT = 5;
  const MAX_SPEED = 120;

  // Function to convert km/h to m/s
  const kmhToMs = (value) => {
    if (value === undefined) {
      return { value: 'N/A', unit: 'Km/h' };
    }
    if (value >= 1) {
      const msValue = value / 3.6;
      return { value: msValue.toFixed(2), unit: 'm/s' };
    } else {
      return { value: value.toFixed(2), unit: 'Km/h' };
    }
  };

  useEffect(() => {
    const URL1 = "http://localhost:5001";
    const socket1 = io(URL1, {
      pingTimeout: 30000,
      pingInterval: 5000,
      upgradeTimeout: 30000,
      cors: {
        origin: "http://localhost:5173",
      }
    });

    socket1.connect();

    socket1.on("connect_error", (err) => {
      console.log(`connect_error due to ${err.message}`);
    });

    socket1.on('connect', () => {
      setSocketConnected(true);
    });

    socket1.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket1.on('sensorData', (data) => {
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      const { value, date } = parsedData;
      const newTimestamp = new Date(date).getTime();

      setSensorData(prevData => {
        const newData = [...prevData, { date: newTimestamp, speed: value, time: new Date(newTimestamp).toLocaleString() }].slice(-MAX_DATA_COUNT);

        const newGaugeValue = value > MAX_SPEED ? MAX_SPEED : value;
        setGaugeValue(newGaugeValue);

        if (prevTimestamp !== null) {
          const timeDiff = (newTimestamp - prevTimestamp) / 1000; // time difference in seconds
          const valueInMetersPerSecond = value / 3.6; // convert km/h to m/s
          const incrementalDistance = valueInMetersPerSecond * timeDiff; // distance in meters

          // Update total distance (if still needed)
          const updatedDistance = totalDistance + incrementalDistance;
          setTotalDistance(updatedDistance);

          // Update encoder distance
          const updatedEncoderDistance = encoderDistance + incrementalDistance;
          setEncoderDistance(updatedEncoderDistance);

          const updatedData = newData.map((point, index) => ({
            ...point,
            distance: index === 0 ? 0 : parseFloat(updatedDistance.toFixed(2)),
          }));

          setPrevTimestamp(newTimestamp);
          return updatedData;
        }

        setPrevTimestamp(newTimestamp);
        return newData;
      });
    });

    socket1.on('rfid_data', (data) => {
      try {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

        setRfidData(prevData => {
          const updatedData = [...prevData, parsedData].slice(-MAX_DATA_COUNT);
          return updatedData;
        });
      } catch (error) {
        console.error('Error parsing data:', error); // Log any parsing errors
      }
    });

    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);

    return () => {
      socket1.disconnect();
      clearInterval(interval);
    };
  }, [prevTimestamp, totalDistance, encoderDistance]); // Include encoderDistance in dependencies

  return (
    <SensorContext.Provider value={{
      sensorData,
      socketConnected,
      gaugeValue,
      totalDistance, // If needed for other purposes
      encoderDistance, // Accumulated distance from encoder
      currentTime,
      rfidData,
      kmhToMs
    }}>
      {children}
    </SensorContext.Provider>
  );
};

export default SensorContext;
