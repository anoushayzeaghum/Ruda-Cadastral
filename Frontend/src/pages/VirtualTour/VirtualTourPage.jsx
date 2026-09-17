import React, { useEffect, useState } from 'react';
import VirtualTourViewer from './components/VirtualTourViewer';
import { loadVirtualTourVendors } from './utils/loadVirtualTourVendors';
import './styles/virtualTour.css';

export default function VirtualTourPage() {
  const [vendorReady, setVendorReady] = useState(Boolean(window.Marzipano));
  const [vendorError, setVendorError] = useState('');

  useEffect(() => {
    let active = true;
    loadVirtualTourVendors()
      .then(() => { if (active) setVendorReady(true); })
      .catch((error) => {
        console.error('Virtual Tour vendor loading failed:', error);
        if (active) setVendorError(error?.message || 'Unable to load the 360 viewer libraries.');
      });
    return () => { active = false; };
  }, []);

  return (
    <div className="ruda-virtual-tour-page">
      {vendorError ? (
        <div className="vt-integration-error" role="alert">
          <h2>Unable to start Virtual Tour</h2>
          <p>{vendorError}</p>
          <button type="button" onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : vendorReady ? (
        <VirtualTourViewer />
      ) : (
        <div className="vt-loading">
          <div className="vt-loading__logo">RUDA <span>Virtual Tour</span></div>
          <div className="vt-spinner" />
          <div className="vt-loading__label">Preparing immersive view…</div>
        </div>
      )}
    </div>
  );
}
