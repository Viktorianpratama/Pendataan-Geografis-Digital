"use client";

import { useEffect, useState } from "react";
import { Compass as CompassIcon } from "lucide-react";
import styles from "./Compass.module.css";

export default function Compass() {
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    const handleOrientation = (event) => {
      // event.webkitCompassHeading is available on iOS devices
      // event.alpha is available on Android (though might need calculation depending on the device)
      let compassHeading = event.webkitCompassHeading || Math.abs(event.alpha - 360);
      
      if (compassHeading) {
        setHeading(compassHeading);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", handleOrientation, true);
    } else {
      console.warn("DeviceOrientation is not supported");
    }

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, []);

  return (
    <div className={styles.compassContainer}>
      <div 
        className={styles.compassRose}
        style={{ transform: `rotate(${-heading}deg)` }}
      >
        <span className={styles.north}>N</span>
        <CompassIcon size={32} color="#0f172a" strokeWidth={1} />
      </div>
      <div className={styles.arrow} />
    </div>
  );
}
