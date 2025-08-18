const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    basePrice: {
        type: Number,
        required: [true, 'Base price is required'],
        min: [0, 'Base price cannot be negative']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true,
        maxlength: [100, 'Category cannot exceed 100 characters']
    },
    sku: {
        type: String,
        unique: true,
        sparse: true, // Allows multiple null values but enforces uniqueness for non-null values
        trim: true,
        maxlength: [50, 'SKU cannot exceed 50 characters']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    hsnCode: {
        type: Number,
        default: 9021,
        min: [1, 'HSN code must be a positive number']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance optimization
ProductSchema.index({ name: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ sku: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ name: 'text', description: 'text' }); // Text search index

// Pre-save middleware to ensure SKU is uppercase if provided
ProductSchema.pre('save', function (next) {
    if (this.sku) {
        this.sku = this.sku.toUpperCase();
    }
    next();
});

module.exports = mongoose.model('Product', ProductSchema);