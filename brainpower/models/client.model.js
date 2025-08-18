const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
    street: { 
        type: String,
        trim: true,
        maxlength: [200, 'Street address cannot exceed 200 characters']
    },
    city: { 
        type: String,
        trim: true,
        maxlength: [100, 'City cannot exceed 100 characters']
    },
    state: { 
        type: String,
        trim: true,
        maxlength: [100, 'State cannot exceed 100 characters']
    },
    zipCode: { 
        type: String,
        trim: true,
        maxlength: [20, 'Zip code cannot exceed 20 characters']
    },
    country: { 
        type: String,
        trim: true,
        maxlength: [100, 'Country cannot exceed 100 characters'],
        default: 'India'
    }
}, { _id: false });

const ClientSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Client name is required'],
        trim: true,
        maxlength: [200, 'Client name cannot exceed 200 characters']
    },
    email: { 
        type: String, 
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: { 
        type: String, 
        required: [true, 'Phone number is required'],
        trim: true,
        maxlength: [20, 'Phone number cannot exceed 20 characters']
    },
    gstNumber: { 
        type: String,
        trim: true,
        uppercase: true,
        match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please enter a valid GST number'],
        maxlength: [15, 'GST number cannot exceed 15 characters']
    },
    panNumber: { 
        type: String,
        trim: true,
        uppercase: true,
        match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN number'],
        maxlength: [10, 'PAN number cannot exceed 10 characters']
    },
    aadharNumber: { 
        type: String,
        trim: true,
        match: [/^[0-9]{12}$/, 'Please enter a valid 12-digit Aadhar number'],
        maxlength: [12, 'Aadhar number must be 12 digits']
    },
    address: {
        type: AddressSchema,
        default: {}
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance optimization
ClientSchema.index({ email: 1 });
ClientSchema.index({ name: 1 });
ClientSchema.index({ phone: 1 });
ClientSchema.index({ gstNumber: 1 });
ClientSchema.index({ panNumber: 1 });
ClientSchema.index({ isActive: 1 });
ClientSchema.index({ 'address.state': 1 });
ClientSchema.index({ name: 'text', email: 'text' }); // Text search index

// Pre-save middleware to format GST and PAN numbers
ClientSchema.pre('save', function(next) {
    if (this.gstNumber) {
        this.gstNumber = this.gstNumber.toUpperCase().replace(/\s/g, '');
    }
    if (this.panNumber) {
        this.panNumber = this.panNumber.toUpperCase().replace(/\s/g, '');
    }
    next();
});

module.exports = mongoose.model('Client', ClientSchema);