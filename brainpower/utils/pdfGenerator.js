const puppeteer = require('puppeteer');

// Generate PDF template HTML for invoice
const generateInvoiceHTML = (invoice) => {
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Arial', sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #333;
                background: white;
            }
            
            .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: white;
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 30px;
                border-bottom: 2px solid #007bff;
                padding-bottom: 20px;
            }
            
            .company-info {
                flex: 1;
            }
            
            .company-name {
                font-size: 24px;
                font-weight: bold;
                color: #007bff;
                margin-bottom: 5px;
            }
            
            .company-details {
                font-size: 11px;
                color: #666;
                line-height: 1.3;
            }
            
            .invoice-title {
                text-align: right;
                flex: 1;
            }
            
            .invoice-title h1 {
                font-size: 28px;
                color: #007bff;
                margin-bottom: 10px;
            }
            
            .invoice-number {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .invoice-dates {
                font-size: 11px;
                color: #666;
            }
            
            .billing-section {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
            }
            
            .billing-info {
                flex: 1;
                margin-right: 20px;
            }
            
            .billing-info h3 {
                font-size: 14px;
                color: #007bff;
                margin-bottom: 10px;
                border-bottom: 1px solid #eee;
                padding-bottom: 5px;
            }
            
            .client-details {
                font-size: 11px;
                line-height: 1.4;
            }
            
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
                font-size: 11px;
            }
            
            .items-table th {
                background-color: #007bff;
                color: white;
                padding: 10px 8px;
                text-align: left;
                font-weight: bold;
                border: 1px solid #007bff;
            }
            
            .items-table td {
                padding: 8px;
                border: 1px solid #ddd;
                vertical-align: top;
            }
            
            .items-table tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            
            .text-right {
                text-align: right;
            }
            
            .text-center {
                text-align: center;
            }
            
            .totals-section {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 30px;
            }
            
            .totals-table {
                width: 300px;
                border-collapse: collapse;
                font-size: 12px;
            }
            
            .totals-table td {
                padding: 8px 12px;
                border: 1px solid #ddd;
            }
            
            .totals-table .label {
                background-color: #f8f9fa;
                font-weight: bold;
                text-align: right;
                width: 60%;
            }
            
            .totals-table .amount {
                text-align: right;
                width: 40%;
            }
            
            .total-row {
                background-color: #007bff !important;
                color: white !important;
                font-weight: bold;
                font-size: 14px;
            }
            
            .notes-section {
                margin-bottom: 30px;
            }
            
            .notes-section h4 {
                color: #007bff;
                margin-bottom: 10px;
                font-size: 14px;
            }
            
            .notes-content {
                background-color: #f8f9fa;
                padding: 15px;
                border-left: 4px solid #007bff;
                font-size: 11px;
                line-height: 1.4;
            }
            
            .footer {
                text-align: center;
                font-size: 10px;
                color: #666;
                border-top: 1px solid #eee;
                padding-top: 20px;
                margin-top: 30px;
            }
            
            .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 10px;
                font-weight: bold;
                text-transform: uppercase;
                margin-left: 10px;
            }
            
            .status-draft {
                background-color: #ffc107;
                color: #856404;
            }
            
            .status-sent {
                background-color: #17a2b8;
                color: white;
            }
            
            .status-paid {
                background-color: #28a745;
                color: white;
            }
            
            .status-overdue {
                background-color: #dc3545;
                color: white;
            }
            
            @media print {
                .invoice-container {
                    padding: 0;
                    max-width: none;
                }
                
                body {
                    font-size: 11px;
                }
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <!-- Header Section -->
            <div class="header">
                <div class="company-info">
                    <div class="company-name">BrainPower Solutions</div>
                    <div class="company-details">
                        123 Business Street<br>
                        Mumbai, Maharashtra 400001<br>
                        Phone: +91 98765 43210<br>
                        Email: info@brainpowersolutions.com<br>
                        GST: 27ABCDE1234F1Z5
                    </div>
                </div>
                <div class="invoice-title">
                    <h1>INVOICE</h1>
                    <div class="invoice-number">${invoice.invoiceNumber}</div>
                    <div class="invoice-dates">
                        <div><strong>Date:</strong> ${formatDate(invoice.invoiceDate)}</div>
                        <div><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</div>
                        <span class="status-badge status-${invoice.status}">${invoice.status}</span>
                    </div>
                </div>
            </div>
            
            <!-- Billing Information -->
            <div class="billing-section">
                <div class="billing-info">
                    <h3>Bill To:</h3>
                    <div class="client-details">
                        <strong>${invoice.clientId.name}</strong><br>
                        ${invoice.clientId.email}<br>
                        ${invoice.clientId.phone}<br>
                        ${invoice.clientId.gstNumber ? `GST: ${invoice.clientId.gstNumber}<br>` : ''}
                        ${invoice.clientId.panNumber ? `PAN: ${invoice.clientId.panNumber}<br>` : ''}
                        ${invoice.clientId.address ? `
                            ${invoice.clientId.address.street ? invoice.clientId.address.street + '<br>' : ''}
                            ${invoice.clientId.address.city ? invoice.clientId.address.city + ', ' : ''}
                            ${invoice.clientId.address.state ? invoice.clientId.address.state + ' ' : ''}
                            ${invoice.clientId.address.zipCode ? invoice.clientId.address.zipCode + '<br>' : ''}
                            ${invoice.clientId.address.country ? invoice.clientId.address.country : ''}
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Items Table -->
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 5%">#</th>
                        <th style="width: 30%">Product</th>
                        <th style="width: 15%">Size</th>
                        <th style="width: 10%" class="text-center">Qty</th>
                        <th style="width: 15%" class="text-right">Unit Price</th>
                        <th style="width: 10%" class="text-center">HSN</th>
                        <th style="width: 15%" class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.items.map((item, index) => `
                        <tr>
                            <td class="text-center">${index + 1}</td>
                            <td>
                                <strong>${item.productId.name}</strong>
                                ${item.productId.description ? `<br><small style="color: #666;">${item.productId.description}</small>` : ''}
                            </td>
                            <td class="text-center">${item.size}</td>
                            <td class="text-center">${item.quantity}</td>
                            <td class="text-right">${formatCurrency(item.customPrice)}</td>
                            <td class="text-center">${item.productId.hsnCode || '9021'}</td>
                            <td class="text-right">${formatCurrency(item.totalPrice)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <!-- Totals Section -->
            <div class="totals-section">
                <table class="totals-table">
                    <tr>
                        <td class="label">Subtotal:</td>
                        <td class="amount">${formatCurrency(invoice.subtotal)}</td>
                    </tr>
                    ${invoice.taxType === 'in-state' ? `
                        <tr>
                            <td class="label">CGST (2.5%):</td>
                            <td class="amount">${formatCurrency(invoice.cgst)}</td>
                        </tr>
                        <tr>
                            <td class="label">SGST (2.5%):</td>
                            <td class="amount">${formatCurrency(invoice.sgst)}</td>
                        </tr>
                    ` : `
                        <tr>
                            <td class="label">IGST (5%):</td>
                            <td class="amount">${formatCurrency(invoice.igst)}</td>
                        </tr>
                    `}
                    <tr>
                        <td class="label">Total Tax:</td>
                        <td class="amount">${formatCurrency(invoice.totalTaxAmount)}</td>
                    </tr>
                    <tr class="total-row">
                        <td class="label">Total Amount:</td>
                        <td class="amount">${formatCurrency(invoice.totalAmount)}</td>
                    </tr>
                </table>
            </div>
            
            <!-- Notes Section -->
            ${invoice.notes ? `
                <div class="notes-section">
                    <h4>Notes:</h4>
                    <div class="notes-content">
                        ${invoice.notes}
                    </div>
                </div>
            ` : ''}
            
            <!-- Footer -->
            <div class="footer">
                <p>Thank you for your business!</p>
                <p>This is a computer-generated invoice and does not require a signature.</p>
                <p>Generated on ${formatDate(new Date())}</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

// Generate PDF from invoice data
const generateInvoicePDF = async (invoice) => {
    let browser;
    
    try {
        // Launch browser
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Generate HTML content
        const htmlContent = generateInvoiceHTML(invoice);
        
        // Set content and wait for it to load
        await page.setContent(htmlContent, { 
            waitUntil: 'networkidle0' 
        });
        
        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });
        
        return Buffer.from(pdfBuffer);
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw new Error('Failed to generate PDF');
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

module.exports = {
    generateInvoicePDF,
    generateInvoiceHTML
};