const mongoose = require('mongoose');

const InvoiceItemSchema = new mongoose.Schema({
    productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product',
        required: [true, 'Product is required']
    },
    size: { 
        type: String, 
        required: [true, 'Size is required'],
        enum: {
            values: ['pediatric', 'x-small', 'small', 'medium', 'large', 'x-large', 'xxl', 'xxxl', 'universal'],
            message: 'Size must be one of: pediatric, x-small, small, medium, large, x-large, xxl, xxxl, universal'
        }
    },
    quantity: { 
        type: Number, 
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1']
    },
    customPrice: { 
        type: Number, 
        required: [true, 'Custom price is required'],
        min: [0, 'Custom price cannot be negative']
    },
    totalPrice: { 
        type: Number,
        default: function() {
            return this.quantity * this.customPrice;
        }
    }
}, { _id: false });

const InvoiceSchema = new mongoose.Schema({
    invoiceNumber: { 
        type: String,
        unique: true
    },
    clientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Client',
        required: [true, 'Client is required']
    },
    invoiceDate: { 
        type: Date, 
        required: [true, 'Invoice date is required'],
        default: Date.now
    },
    dueDate: { 
        type: Date, 
        required: [true, 'Due date is required']
    },
    status: { 
        type: String,
        enum: {
            values: ['draft', 'sent', 'paid', 'overdue'],
            message: 'Status must be one of: draft, sent, paid, overdue'
        },
        default: 'draft'
    },
    items: {
        type: [InvoiceItemSchema],
        validate: {
            validator: function(items) {
                return items && items.length > 0;
            },
            message: 'Invoice must have at least one item'
        }
    },
    subtotal: { 
        type: Number,
        default: 0
    },
    taxType: { 
        type: String,
        required: [true, 'Tax type is required'],
        enum: {
            values: ['in-state', 'out-state'],
            message: 'Tax type must be either in-state or out-state'
        }
    },
    cgst: { 
        type: Number,
        default: 0,
        min: [0, 'CGST cannot be negative']
    },
    sgst: { 
        type: Number,
        default: 0,
        min: [0, 'SGST cannot be negative']
    },
    igst: { 
        type: Number,
        default: 0,
        min: [0, 'IGST cannot be negative']
    },
    totalTaxAmount: { 
        type: Number,
        default: 0
    },
    totalAmount: { 
        type: Number,
        default: 0
    },
    notes: { 
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance optimization
InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ clientId: 1 });
InvoiceSchema.index({ invoiceDate: -1 });
InvoiceSchema.index({ dueDate: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ createdAt: -1 });
InvoiceSchema.index({ clientId: 1, invoiceDate: -1 }); // Compound index for client invoice history
InvoiceSchema.index({ status: 1, dueDate: 1 }); // Compound index for overdue invoices

// Pre-save middleware to calculate totals and generate invoice number
InvoiceSchema.pre('save', async function(next) {
    try {
        // Generate invoice number if not provided
        if (!this.invoiceNumber) {
            const count = await this.constructor.countDocuments();
            const year = new Date().getFullYear();
            this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;
        }

        // Calculate item totals
        if (this.items && this.items.length > 0) {
            this.items.forEach(item => {
                item.totalPrice = item.quantity * item.customPrice;
            });

            // Calculate subtotal
            this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);

            // Calculate taxes based on tax type
            if (this.taxType === 'in-state') {
                this.cgst = this.subtotal * 0.025; // 2.5%
                this.sgst = this.subtotal * 0.025; // 2.5%
                this.igst = 0;
                this.totalTaxAmount = this.cgst + this.sgst;
            } else if (this.taxType === 'out-state') {
                this.cgst = 0;
                this.sgst = 0;
                this.igst = this.subtotal * 0.05; // 5%
                this.totalTaxAmount = this.igst;
            }

            // Calculate total amount
            this.totalAmount = this.subtotal + this.totalTaxAmount;
        }

        next();
    } catch (error) {
        next(error);
    }
});

// Pre-validate middleware to ensure due date is after invoice date
InvoiceSchema.pre('validate', function(next) {
    if (this.dueDate && this.invoiceDate && this.dueDate <= this.invoiceDate) {
        this.invalidate('dueDate', 'Due date must be after invoice date');
    }
    next();
});

module.exports = mongoose.model('Invoice', InvoiceSchema);