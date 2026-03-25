import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

/**
 * ProductGallery
 *
 * - Main image area: shows mainImages[activeImageIndex] OR variantImageUrl if a variant is selected
 * - Arrows: cycle through mainImages only
 * - Thumbnail strip: shows only variant images (one per color/variant key)
 *   Clicking a variant thumb → sets variantImageUrl + selects that color
 */
export default function ProductGallery({
    product,
    mainImages,
    variantImageMap,
    variantImageUrl,
    setVariantImageUrl,
    activeImageIndex,
    setActiveImageIndex,
    selectedColor,
    setSelectedColor,
}) {
    const [isZoomed, setIsZoomed] = useState(false);
    const [showZoomPreview, setShowZoomPreview] = useState(false);
    const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

    const safeMainImages = mainImages?.length > 0 ? mainImages : ['/placeholder-image.jpg'];
    const displayImage = variantImageUrl || safeMainImages[activeImageIndex] || safeMainImages[0];

    const nextImage = () => {
        setVariantImageUrl(null); // clear variant override when using arrows
        setActiveImageIndex((prev) => (prev + 1) % safeMainImages.length);
    };
    const prevImage = () => {
        setVariantImageUrl(null);
        setActiveImageIndex((prev) => (prev - 1 + safeMainImages.length) % safeMainImages.length);
    };

    const variantEntries = Object.entries(variantImageMap || {});

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
                        key={displayImage}
                        src={displayImage}
                        alt={product?.name || 'Product'}
                        className="product-main-image"
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                    />
                    {safeMainImages.length > 1 && (
                        <div className="media-controls-bottom">
                            <button
                                className="ctrl-btn-bottom"
                                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                onMouseEnter={(e) => e.stopPropagation()}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                className="ctrl-btn-bottom"
                                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                onMouseEnter={(e) => e.stopPropagation()}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Zoom Preview on hover */}
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
                                    backgroundImage: `url(${displayImage})`,
                                    backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                                    backgroundSize: '250%'
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Zoom Modal */}
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
                            <img src={displayImage} alt="Full size" />
                            <button className="close-zoom-btn" onClick={() => setIsZoomed(false)}>
                                <X size={24} />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Thumbnail strip — variant images only */}
            {variantEntries.length > 0 && (
                <div className="thumbnail-track">
                    {variantEntries.map(([colorKey, imgUrl]) => {
                        const isActive = variantImageUrl === imgUrl ||
                            (selectedColor && (typeof selectedColor === 'object' ? selectedColor.name : selectedColor) === colorKey);
                        return (
                            <div
                                key={colorKey}
                                className={`thumb-item ${isActive ? 'active' : ''}`}
                                title={colorKey}
                                onClick={() => {
                                    setVariantImageUrl(imgUrl);
                                    if (setSelectedColor && product?.colors) {
                                        const match = product.colors.find(c =>
                                            (typeof c === 'object' ? c.name : c) === colorKey
                                        );
                                        if (match) setSelectedColor(match);
                                    }
                                }}
                            >
                                <img src={imgUrl} alt={colorKey} />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
