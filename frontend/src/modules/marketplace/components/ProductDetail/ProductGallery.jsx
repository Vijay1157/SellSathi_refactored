import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function ProductGallery({ product, images, activeImageIndex, setActiveImageIndex }) {
    const [isZoomed, setIsZoomed] = useState(false);
    const [showZoomPreview, setShowZoomPreview] = useState(false);
    const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });



    const nextImage = () => setActiveImageIndex((prev) => (prev + 1) % images.length);
    const prevImage = () => setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);

    return (
        <div className="pd-media">
            <div className="media-container">
                <div 
                    className="media-stage glass-card"
                    onMouseMove={(e) => {
                        if (!showZoomPreview) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                        setZoomPosition({ x, y });
                    }}
                    onMouseEnter={() => setShowZoomPreview(true)}
                    onMouseLeave={() => setShowZoomPreview(false)}
                    onClick={() => setIsZoomed(true)}
                >
                    <motion.img
                        key={activeImageIndex}
                        src={images[activeImageIndex]}
                        alt={product?.name || 'Product'}
                        className="product-main-image"
                    />
                    <div className="media-controls-bottom">
                        <button 
                            className="ctrl-btn-bottom" 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                prevImage(); 
                            }}
                            onMouseEnter={(e) => e.stopPropagation()}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button 
                            className="ctrl-btn-bottom" 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                nextImage(); 
                            }}
                            onMouseEnter={(e) => e.stopPropagation()}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Zoom Preview - Shows to the right on hover */}
                <AnimatePresence>
                    {showZoomPreview && (
                        <motion.div
                            className="zoom-preview-panel-right"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div 
                                className="zoom-preview-image"
                                style={{
                                    backgroundImage: `url(${images[activeImageIndex]})`,
                                    backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                                    backgroundSize: '250%'
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Zoom Modal - Click to open full image */}
            <AnimatePresence>
                {isZoomed && (
                    <motion.div
                        className="zoom-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsZoomed(false)}
                    >
                        <motion.div
                            className="zoom-modal-content"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <img src={images[activeImageIndex]} alt="Full size" />
                            <button className="close-zoom-btn" onClick={() => setIsZoomed(false)}>
                                <X size={24} />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <div className="thumbnail-track">
                {images.map((img, i) => (
                    <div
                        key={i}
                        className={`thumb-item ${i === activeImageIndex ? 'active' : ''}`}
                        onClick={() => setActiveImageIndex(i)}
                    >
                        <img src={img} alt="" />
                    </div>
                ))}
            </div>
        </div>
    );
}
