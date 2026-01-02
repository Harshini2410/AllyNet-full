import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, ExternalLink } from 'lucide-react';

/**
 * Emergency Map Modal
 * Shows emergency location on a map (Google Maps embed)
 * Can be used by both creator and helper views
 */
const EmergencyMapModal = ({ isOpen, onClose, location, emergencyType = 'Emergency' }) => {
  if (!location || !location.latitude || !location.longitude) {
    return null;
  }

  const latitude = location.latitude;
  const longitude = location.longitude;
  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
  // Use OpenStreetMap embed (free, no API key required)
  const openStreetMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-md z-[120]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[121] flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-charcoal-800 rounded-[2rem] w-full max-w-2xl h-[80vh] max-h-[600px] flex flex-col shadow-2xl pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-sand-200 dark:border-charcoal-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sage-50 dark:bg-sage-900/20 rounded-xl">
                    <MapPin className="text-sage-600 dark:text-sage-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-display text-charcoal-500 dark:text-sand-50">
                      Emergency Location
                    </h3>
                    <p className="text-xs text-charcoal-300 dark:text-sand-400 capitalize">
                      {emergencyType} Emergency
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-sand-100 dark:hover:bg-charcoal-700 rounded-full transition-colors"
                    title="Open in Google Maps"
                  >
                    <ExternalLink size={18} className="text-charcoal-400 dark:text-sand-400" />
                  </a>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-sand-100 dark:hover:bg-charcoal-700 rounded-full transition-colors"
                    title="Close map"
                  >
                    <X size={20} className="text-charcoal-400 dark:text-sand-400" />
                  </button>
                </div>
              </div>

              {/* Map Container */}
              <div className="flex-1 relative overflow-hidden bg-sage-50 dark:bg-charcoal-700">
                {/* OpenStreetMap Embed */}
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={openStreetMapUrl}
                  className="absolute inset-0"
                  title="Emergency Location Map"
                />
                
                {/* Coordinates and link overlay */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-charcoal-800/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-sand-200 dark:border-charcoal-700">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase tracking-widest text-sage-600 dark:text-sage-400 mb-1">
                        Coordinates
                      </p>
                      <p className="text-sm font-mono text-charcoal-700 dark:text-sand-300">
                        Lat: {latitude.toFixed(6)}, Lon: {longitude.toFixed(6)}
                      </p>
                      {location.address && (
                        <p className="text-xs text-charcoal-400 dark:text-sand-500 mt-1">
                          {location.address}
                        </p>
                      )}
                    </div>
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-sage-500 hover:bg-sage-600 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                      <ExternalLink size={16} />
                      Google Maps
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EmergencyMapModal;

