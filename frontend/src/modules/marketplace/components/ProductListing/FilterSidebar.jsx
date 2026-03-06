import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { MAIN_CATEGORIES, getSubcategories } from '@/modules/shared/config/categories';

export default function FilterSidebar({
    selectedCategory,
    setSelectedCategory,
    selectedSubcategories,
    setSelectedSubcategories,
    priceRange,
    setPriceRange,
    sortBy,
    setSortBy,
    clearAllFilters
}) {
    const availableSubcategories = selectedCategory !== 'All' ? getSubcategories(selectedCategory) : [];

    const toggleSubcategory = (subcategory) => {
        setSelectedSubcategories(prev => {
            if (prev.includes(subcategory)) {
                return prev.filter(s => s !== subcategory);
            } else {
                return [...prev, subcategory];
            }
        });
    };

    return (
        <aside className="filters-sidebar-pro glass-card">
            <div className="sidebar-header">
                <div className="sidebar-title">
                    <SlidersHorizontal size={20} />
                    <h3>Filters</h3>
                </div>
                {(selectedCategory !== 'All' || selectedSubcategories.length > 0 || priceRange < 200000) && (
                    <button className="clear-filters-btn" onClick={clearAllFilters}>
                        Clear All
                    </button>
                )}
            </div>

            {/* Categories Section */}
            <div className="filter-section">
                <h4 className="filter-section-title">Categories</h4>
                <div className="category-list-pro">
                    <button
                        className={selectedCategory === 'All' ? 'active' : ''}
                        onClick={() => {
                            setSelectedCategory('All');
                            setSelectedSubcategories([]);
                        }}
                    >
                        All Products
                    </button>
                    {MAIN_CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            className={selectedCategory === cat ? 'active' : ''}
                            onClick={() => {
                                setSelectedCategory(cat);
                                setSelectedSubcategories([]);
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Subcategories Section */}
            {selectedCategory !== 'All' && availableSubcategories.length > 0 && (
                <div className="filter-section">
                    <h4 className="filter-section-title">Subcategories</h4>
                    <div className="subcategory-list-pro">
                        {availableSubcategories.map(sub => (
                            <label key={sub} className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={selectedSubcategories.includes(sub)}
                                    onChange={() => toggleSubcategory(sub)}
                                />
                                <span>{sub}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Price Range Section */}
            <div className="filter-section">
                <h4 className="filter-section-title">Price Range</h4>
                <div className="price-filter-pro">
                    <input
                        type="range"
                        min="0"
                        max="200000"
                        step="1000"
                        value={priceRange}
                        onChange={(e) => setPriceRange(Number(e.target.value))}
                    />
                    <div className="price-labels">
                        <span>₹0</span>
                        <span className="current-price">₹{priceRange.toLocaleString()}</span>
                        <span>₹2,00,000</span>
                    </div>
                </div>
            </div>

            {/* Sort By Section */}
            <div className="filter-section">
                <h4 className="filter-section-title">Sort By</h4>
                <div className="sort-options-pro">
                    <label className="radio-label">
                        <input type="radio" name="sort" value="newest" checked={sortBy === 'newest'} onChange={(e) => setSortBy(e.target.value)} />
                        <span>Newest First</span>
                    </label>
                    <label className="radio-label">
                        <input type="radio" name="sort" value="priceLow" checked={sortBy === 'priceLow'} onChange={(e) => setSortBy(e.target.value)} />
                        <span>Price: Low to High</span>
                    </label>
                    <label className="radio-label">
                        <input type="radio" name="sort" value="priceHigh" checked={sortBy === 'priceHigh'} onChange={(e) => setSortBy(e.target.value)} />
                        <span>Price: High to Low</span>
                    </label>
                </div>
            </div>
        </aside>
    );
}
