// Product Variants Configuration
// Defines which variant options are available for each category

export const VARIANT_CONFIGS = {
  "Fashion (Men)": {
    icon: "👔",
    hasSizes: true,
    hasColors: true,
    hasVariants: true,
    variantTypes: [
      { key: "fabric", label: "Fabric", presets: ["Cotton", "Polyester", "Linen", "Denim", "Silk"] },
      { key: "fit", label: "Fit", presets: ["Slim Fit", "Regular Fit", "Loose Fit"] },
      { key: "occasion", label: "Occasion", presets: ["Casual", "Formal", "Party", "Sports"] },
      { key: "pattern", label: "Pattern", presets: ["Solid", "Striped", "Checked", "Printed"] },
      { key: "sleeve_type", label: "Sleeve Type", presets: ["Short Sleeve", "Long Sleeve", "Sleeveless"] }
    ],
    defaultSizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    colorPresets: ["Black", "White", "Blue", "Navy", "Red", "Grey", "Green", "Brown"]
  },
  "Fashion (Women)": {
    icon: "👗",
    hasSizes: true,
    hasColors: true,
    hasVariants: true,
    variantTypes: [
      { key: "fabric", label: "Fabric", presets: ["Cotton", "Silk", "Chiffon", "Denim", "Linen"] },
      { key: "style", label: "Style", presets: ["Casual", "Formal", "Party Wear", "Ethnic", "Western"] },
      { key: "occasion", label: "Occasion", presets: ["Casual", "Formal", "Party", "Wedding", "Festive"] },
      { key: "length", label: "Length", presets: ["Mini", "Midi", "Maxi", "Knee Length"] },
      { key: "pattern", label: "Pattern", presets: ["Solid", "Floral", "Striped", "Printed"] }
    ],
    defaultSizes: ["XS", "S", "M", "L", "XL", "XXL", "Free Size"],
    colorPresets: ["Black", "White", "Red", "Pink", "Blue", "Green", "Yellow", "Purple"]
  },
  "Kids & Baby": {
    icon: "👶",
    hasSizes: true,
    hasVariants: true,
    variantTypes: [
      { key: "age_group", label: "Age Group", presets: ["0-3 Months", "3-6 Months", "6-12 Months", "1-2 Years", "3-4 Years", "5-7 Years"] },
      { key: "gender", label: "Gender", presets: ["Boys", "Girls", "Unisex"] },
      { key: "material", label: "Material", presets: ["Cotton", "Fleece", "Wool", "Polyester"] },
      { key: "brand", label: "Brand", presets: [] },
      { key: "product_type", label: "Product Type", presets: ["Clothing", "Toys", "Accessories", "Footwear"] }
    ]
  },
  "Electronics": {
    icon: "📱",
    hasVariants: true,
    variantTypes: [
      { key: "brand", label: "Brand", presets: ["Apple", "Samsung", "Sony", "Dell", "HP", "Lenovo"] },
      { key: "ram", label: "RAM", presets: ["4GB", "8GB", "16GB", "32GB"] },
      { key: "storage", label: "Storage", presets: ["64GB", "128GB", "256GB", "512GB", "1TB"] },
      { key: "battery", label: "Battery", presets: ["3000mAh", "4000mAh", "5000mAh"] },
      { key: "screen_size", label: "Screen Size", presets: ["5 inch", "6 inch", "13 inch", "15 inch"] },
      { key: "connectivity", label: "Connectivity", presets: ["WiFi", "Bluetooth", "5G", "4G"] },
      { key: "warranty", label: "Warranty", presets: ["1 Year", "2 Years", "No Warranty"] },
      { key: "condition", label: "Condition", presets: ["New", "Refurbished", "Used"] }
    ]
  },
  "Home & Living": {
    icon: "🏠",
    hasColors: true,
    hasVariants: true,
    variantTypes: [
      { key: "material", label: "Material", presets: ["Wood", "Metal", "Plastic", "Glass", "Fabric"] },
      { key: "dimensions", label: "Dimensions", presets: ["Small", "Medium", "Large"] },
      { key: "weight", label: "Weight", presets: [] },
      { key: "style", label: "Style", presets: ["Modern", "Traditional", "Minimalist", "Vintage"] },
      { key: "room_type", label: "Room Type", presets: ["Living Room", "Bedroom", "Kitchen", "Bathroom"] }
    ],
    colorPresets: ["White", "Black", "Brown", "Grey", "Beige"]
  },
  "Handicrafts": {
    icon: "🎨",
    hasVariants: true,
    variantTypes: [
      { key: "material", label: "Material", presets: ["Wood", "Clay", "Bamboo", "Textile", "Metal"] },
      { key: "handmade", label: "Handmade", presets: ["Yes", "Partially"] },
      { key: "region", label: "Region", presets: [] },
      { key: "artisan_type", label: "Artisan Type", presets: ["Individual", "Community", "NGO"] },
      { key: "customizable", label: "Customizable", presets: ["Yes", "No"] }
    ]
  },
  "Artworks": {
    icon: "🖼️",
    hasSizes: true,
    hasVariants: true,
    variantTypes: [
      { key: "type", label: "Type", presets: ["Painting", "Sketch", "Digital Art", "Sculpture"] },
      { key: "medium", label: "Medium", presets: ["Oil", "Watercolor", "Acrylic", "Charcoal", "Digital"] },
      { key: "frame_included", label: "Frame Included", presets: ["Yes", "No"] },
      { key: "artist", label: "Artist", presets: [] },
      { key: "customizable", label: "Customizable", presets: ["Yes", "No"] }
    ]
  },
  "Beauty & Personal Care": {
    icon: "💄",
    hasVariants: true,
    variantTypes: [
      { key: "skin_type", label: "Skin Type", presets: ["Oily", "Dry", "Combination", "Sensitive", "All"] },
      { key: "hair_type", label: "Hair Type", presets: ["Straight", "Wavy", "Curly", "Coily"] },
      { key: "ingredients", label: "Ingredients", presets: ["Organic", "Chemical-Free", "Vegan", "Herbal"] },
      { key: "gender", label: "Gender", presets: ["Men", "Women", "Unisex"] },
      { key: "concern", label: "Concern", presets: ["Acne", "Aging", "Dryness", "Hairfall", "Dandruff"] },
      { key: "brand", label: "Brand", presets: [] },
      { key: "expiry_date", label: "Expiry Date", presets: ["12 Months", "24 Months", "36 Months"] }
    ]
  },
  "Sports & Fitness": {
    icon: "⚽",
    hasSizes: true,
    hasVariants: true,
    variantTypes: [
      { key: "type", label: "Type", presets: ["Equipment", "Apparel", "Footwear", "Accessories"] },
      { key: "weight", label: "Weight", presets: ["1kg", "2kg", "5kg", "10kg"] },
      { key: "material", label: "Material", presets: ["Nylon", "Rubber", "Leather", "Plastic", "Metal"] },
      { key: "skill_level", label: "Skill Level", presets: ["Beginner", "Intermediate", "Advanced", "Professional"] },
      { key: "indoor_outdoor", label: "Indoor/Outdoor", presets: ["Indoor", "Outdoor", "Both"] }
    ]
  },
  "Books & Stationery": {
    icon: "📚",
    hasVariants: true,
    variantTypes: [
      { key: "genre", label: "Genre", presets: ["Fiction", "Non-Fiction", "Academic", "Children", "Comics"] },
      { key: "author", label: "Author", presets: [] },
      { key: "language", label: "Language", presets: ["English", "Hindi", "Regional"] },
      { key: "binding", label: "Binding", presets: ["Hardcover", "Paperback", "Spiral"] },
      { key: "publication_year", label: "Publication Year", presets: [] },
      { key: "pages", label: "Pages", presets: [] }
    ]
  },
  "Food & Beverages": {
    icon: "🍽️",
    hasVariants: true,
    variantTypes: [
      { key: "type", label: "Type", presets: ["Snacks", "Beverages", "Sweets", "Spices", "Health Food"] },
      { key: "veg_nonveg", label: "Veg/Non-Veg", presets: ["Vegetarian", "Non-Vegetarian", "Vegan"] },
      { key: "ingredients", label: "Ingredients", presets: [] },
      { key: "shelf_life", label: "Shelf Life", presets: ["1 Month", "3 Months", "6 Months", "1 Year"] },
      { key: "fssai_certified", label: "FSSAI Certified", presets: ["Yes", "No"] },
      { key: "organic", label: "Organic", presets: ["Yes", "No"] },
      { key: "weight", label: "Weight", presets: ["100g", "250g", "500g", "1kg", "5kg"] }
    ]
  },
  "Gifts & Customization": {
    icon: "🎁",
    hasVariants: true,
    variantTypes: [
      { key: "occasion", label: "Occasion", presets: ["Birthday", "Anniversary", "Wedding", "Festivals", "Corporate"] },
      { key: "personalization", label: "Personalization", presets: ["Name Engraving", "Photo Print", "Custom Message"] },
      { key: "material", label: "Material", presets: ["Wood", "Glass", "Metal", "Ceramic", "Paper"] },
      { key: "packaging", label: "Packaging", presets: ["Standard Box", "Premium Gift Wrap", "Eco-friendly"] },
      { key: "delivery_time", label: "Delivery Time", presets: ["Same Day", "2-3 Days", "1 Week"] }
    ]
  },
  "Jewelry & Accessories": {
    icon: "💍",
    hasVariants: true,
    variantTypes: [
      { key: "material", label: "Material", presets: ["Gold", "Silver", "Platinum", "Artificial", "Beads", "Oxidized"] },
      { key: "type", label: "Type", presets: ["Necklace", "Earrings", "Rings", "Bracelets", "Bangels", "Sets"] },
      { key: "occasion", label: "Occasion", presets: ["Bridal", "Party", "Casual", "Office Wear Festivel"] },
      { key: "gender", label: "Gender", presets: ["Women", "Men", "Unisex", "Kids"] },
      { key: "weight", label: "Weight", presets: [] },
      { key: "stone_type", label: "Stone Type", presets: ["Diamond", "Ruby", "Kundan", "Pearls", "None"] }
    ]
  },
  "Fabrics & Tailoring Materials": {
    icon: "🧵",
    hasColors: true,
    hasVariants: true,
    variantTypes: [
      { key: "fabric_type", label: "Fabric Type", presets: ["Cotton", "Silk", "Georgette", "Chiffon", "Velvet", "Linen"] },
      { key: "length", label: "Length", presets: ["1 Meter", "2.5 Meters", "5 Meters", "Custom"] },
      { key: "pattern", label: "Pattern", presets: ["Plain", "Printed", "Embroidered", "Zari Work"] },
      { key: "gsm", label: "GSM", presets: ["Light", "Medium", "Heavy"] },
      { key: "usage", label: "Usage", presets: ["Sarees", "Kurtis", "Dresses", "Upholstery", "Curtains"] }
    ],
    colorPresets: ["Red", "Blue", "Green", "Yellow", "Black", "White", "Pink", "Multicolor"]
  },
  "Local Sellers / Homepreneurs": {
    icon: "🏡",
    hasVariants: true,
    variantTypes: [
      { key: "location", label: "Location", presets: [] },
      { key: "seller_type", label: "Seller Type", presets: ["Home Maker", "Student", "Artisan", "Boutique"] },
      { key: "handmade", label: "Handmade", presets: ["Yes", "Partially", "No"] },
      { key: "custom_orders", label: "Custom Orders", presets: ["Accepted", "Not Accepted"] },
      { key: "delivery_radius", label: "Delivery Radius", presets: ["Local City", "State", "Pan India"] }
    ]
  },
  "Services": {
    icon: "🛠️",
    hasVariants: true,
    variantTypes: [
      { key: "service_type", label: "Service Type", presets: ["Consulting", "Repair", "Tailoring", "Event Management", "Design"] },
      { key: "location", label: "Location", presets: ["Online", "At Customer Space", "At Service Center"] },
      { key: "experience_level", label: "Experience Level", presets: ["Beginner", "Intermediate", "Expert"] },
      { key: "price_range", label: "Price Range", presets: ["Hourly", "Fixed", "Variable"] },
      { key: "availability", label: "Availability", presets: ["Weekdays", "Weekends", "24/7"] },
      { key: "customization", label: "Customization", presets: ["Available", "Not Available"] }
    ]
  },
  "Pet Supplies": {
    icon: "🐾",
    hasVariants: true,
    variantTypes: [
      { key: "pet_type", label: "Pet Type", presets: ["Dogs", "Cats", "Birds", "Fish", "Small Pets"] },
      { key: "breed_size", label: "Breed Size", presets: ["Small", "Medium", "Large", "All Breeds"] },
      { key: "age", label: "Age", presets: ["Puppy/Kitten", "Adult", "Senior", "All Ages"] },
      { key: "product_type", label: "Product Type", presets: ["Food", "Toys", "Grooming", "Accessories", "Bedding"] },
      { key: "ingredients", label: "Ingredients", presets: ["Chicken", "Fish", "Veg", "Grain-free"] }
    ]
  },
  "Automotive & Accessories": {
    icon: "🚗",
    hasVariants: true,
    variantTypes: [
      { key: "vehicle_type", label: "Vehicle Type", presets: ["Car", "Bike", "Scooter", "Commercial"] },
      { key: "compatibility", label: "Compatibility", presets: ["Universal", "Specific Models"] },
      { key: "brand", label: "Brand", presets: [] },
      { key: "material", label: "Material", presets: ["Plastic", "Metal", "Rubber", "Leather", "Microfiber"] },
      { key: "installation_type", label: "Installation Type", presets: ["DIY", "Professional"] }
    ]
  },
  "Travel & Utility": {
    icon: "🧳",
    hasVariants: true,
    variantTypes: [
      { key: "capacity", label: "Capacity", presets: ["Small", "Medium", "Large", "20L", "40L", "60L"] },
      { key: "material", label: "Material", presets: ["Nylon", "Polyester", "Leather", "Hard Shell", "Canvas"] },
      { key: "weight", label: "Weight", presets: ["Lightweight", "Heavy Duty"] },
      { key: "waterproof", label: "Waterproof", presets: ["Yes", "Water Resistant", "No"] },
      { key: "usage", label: "Usage", presets: ["Trekking", "Business", "Casual", "Luggage"] }
    ]
  },
  "Sustainability & Eco-Friendly": {
    icon: "♻️",
    hasVariants: true,
    variantTypes: [
      { key: "material", label: "Material", presets: ["Bamboo", "Jute", "Recycled Plastic", "Organic Cotton", "Cork", "Paper"] },
      { key: "eco_certification", label: "Eco Certification", presets: ["Fair Trade", "GOTS", "FSC", "None"] },
      { key: "reusable", label: "Reusable", presets: ["Yes", "No"] },
      { key: "biodegradable", label: "Biodegradable", presets: ["100% Biodegradable", "Partially", "No"] },
      { key: "category_type", label: "Category Type", presets: ["Home", "Fashion", "Personal Care", "Packaging"] }
    ]
  },
  "Other": {
    icon: "📦",
    hasColors: true,
    hasSizes: true,
    hasVariants: true,
    variantTypes: [
      { key: "brand", label: "Brand", presets: [] },
      { key: "material", label: "Material", presets: [] }
    ]
  }
};

// Get variant configuration for a category
export const getVariantConfig = (category) => {
  return VARIANT_CONFIGS[category] || VARIANT_CONFIGS["Other"];
};

// Check if category has specific variant type
export const hasVariantType = (category, variantType) => {
  const config = getVariantConfig(category);
  return config[variantType] === true;
};

// Get available sizes for a category
export const getSizesForCategory = (category) => {
  const config = getVariantConfig(category);
  return config.defaultSizes || [];
};

// Get available colors for a category
export const getColorsForCategory = (category) => {
  const config = getVariantConfig(category);
  return config.colorPresets || [];
};

// Get variant types for a category
export const getVariantTypesForCategory = (category) => {
  const config = getVariantConfig(category);
  return config.variantTypes || [];
};
