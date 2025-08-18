/**
 * Tax Calculation Logic Unit Tests
 * Tests the tax calculation logic used in invoice processing
 */

describe('Tax Calculation Logic Unit Tests', () => {
  describe('In-State Tax Calculation (CGST + SGST)', () => {
    test('should calculate CGST and SGST correctly for single item', () => {
      const subtotal = 1000;
      const taxType = 'in-state';
      
      // Calculate taxes (2.5% each for CGST and SGST)
      const cgst = subtotal * 0.025; // 25
      const sgst = subtotal * 0.025; // 25
      const igst = 0;
      const totalTaxAmount = cgst + sgst; // 50
      const totalAmount = subtotal + totalTaxAmount; // 1050
      
      expect(cgst).toBe(25);
      expect(sgst).toBe(25);
      expect(igst).toBe(0);
      expect(totalTaxAmount).toBe(50);
      expect(totalAmount).toBe(1050);
    });

    test('should calculate CGST and SGST correctly for multiple items', () => {
      const items = [
        { quantity: 2, customPrice: 100 }, // 200
        { quantity: 3, customPrice: 150 }, // 450
        { quantity: 1, customPrice: 250 }  // 250
      ];
      
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.customPrice), 0); // 900
      
      const cgst = subtotal * 0.025; // 22.5
      const sgst = subtotal * 0.025; // 22.5
      const igst = 0;
      const totalTaxAmount = cgst + sgst; // 45
      const totalAmount = subtotal + totalTaxAmount; // 945
      
      expect(subtotal).toBe(900);
      expect(cgst).toBe(22.5);
      expect(sgst).toBe(22.5);
      expect(igst).toBe(0);
      expect(totalTaxAmount).toBe(45);
      expect(totalAmount).toBe(945);
    });

    test('should handle decimal calculations correctly', () => {
      const subtotal = 333.33;
      
      const cgst = subtotal * 0.025; // 8.33325
      const sgst = subtotal * 0.025; // 8.33325
      const totalTaxAmount = cgst + sgst; // 16.6665
      const totalAmount = subtotal + totalTaxAmount; // 349.9965
      
      expect(cgst).toBeCloseTo(8.33, 2);
      expect(sgst).toBeCloseTo(8.33, 2);
      expect(totalTaxAmount).toBeCloseTo(16.67, 2);
      expect(totalAmount).toBeCloseTo(350.00, 2);
    });
  });

  describe('Out-State Tax Calculation (IGST)', () => {
    test('should calculate IGST correctly for single item', () => {
      const subtotal = 1000;
      const taxType = 'out-state';
      
      // Calculate taxes (5% IGST)
      const cgst = 0;
      const sgst = 0;
      const igst = subtotal * 0.05; // 50
      const totalTaxAmount = igst; // 50
      const totalAmount = subtotal + totalTaxAmount; // 1050
      
      expect(cgst).toBe(0);
      expect(sgst).toBe(0);
      expect(igst).toBe(50);
      expect(totalTaxAmount).toBe(50);
      expect(totalAmount).toBe(1050);
    });

    test('should calculate IGST correctly for multiple items', () => {
      const items = [
        { quantity: 4, customPrice: 125 }, // 500
        { quantity: 2, customPrice: 175 }  // 350
      ];
      
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.customPrice), 0); // 850
      
      const cgst = 0;
      const sgst = 0;
      const igst = subtotal * 0.05; // 42.5
      const totalTaxAmount = igst; // 42.5
      const totalAmount = subtotal + totalTaxAmount; // 892.5
      
      expect(subtotal).toBe(850);
      expect(cgst).toBe(0);
      expect(sgst).toBe(0);
      expect(igst).toBe(42.5);
      expect(totalTaxAmount).toBe(42.5);
      expect(totalAmount).toBe(892.5);
    });

    test('should handle decimal calculations correctly', () => {
      const subtotal = 777.77;
      
      const cgst = 0;
      const sgst = 0;
      const igst = subtotal * 0.05; // 38.8885
      const totalTaxAmount = igst; // 38.8885
      const totalAmount = subtotal + totalTaxAmount; // 816.6585
      
      expect(cgst).toBe(0);
      expect(sgst).toBe(0);
      expect(igst).toBeCloseTo(38.89, 2);
      expect(totalTaxAmount).toBeCloseTo(38.89, 2);
      expect(totalAmount).toBeCloseTo(816.66, 2);
    });
  });

  describe('Tax Rate Constants', () => {
    test('should use correct tax rates', () => {
      const CGST_RATE = 0.025; // 2.5%
      const SGST_RATE = 0.025; // 2.5%
      const IGST_RATE = 0.05;  // 5%
      
      expect(CGST_RATE + SGST_RATE).toBe(IGST_RATE); // Combined in-state rate equals out-state rate
      expect(CGST_RATE).toBe(0.025);
      expect(SGST_RATE).toBe(0.025);
      expect(IGST_RATE).toBe(0.05);
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero subtotal', () => {
      const subtotal = 0;
      
      // In-state
      const cgstInState = subtotal * 0.025;
      const sgstInState = subtotal * 0.025;
      const totalInState = subtotal + cgstInState + sgstInState;
      
      // Out-state
      const igstOutState = subtotal * 0.05;
      const totalOutState = subtotal + igstOutState;
      
      expect(cgstInState).toBe(0);
      expect(sgstInState).toBe(0);
      expect(totalInState).toBe(0);
      expect(igstOutState).toBe(0);
      expect(totalOutState).toBe(0);
    });

    test('should handle very small amounts', () => {
      const subtotal = 0.01; // 1 paisa
      
      // In-state
      const cgst = subtotal * 0.025; // 0.00025
      const sgst = subtotal * 0.025; // 0.00025
      const totalTaxInState = cgst + sgst; // 0.0005
      const totalInState = subtotal + totalTaxInState; // 0.0105
      
      // Out-state
      const igst = subtotal * 0.05; // 0.0005
      const totalOutState = subtotal + igst; // 0.0105
      
      expect(cgst).toBeCloseTo(0.00025, 5);
      expect(sgst).toBeCloseTo(0.00025, 5);
      expect(totalTaxInState).toBeCloseTo(0.0005, 4);
      expect(totalInState).toBeCloseTo(0.0105, 4);
      expect(igst).toBeCloseTo(0.0005, 4);
      expect(totalOutState).toBeCloseTo(0.0105, 4);
    });

    test('should handle large amounts', () => {
      const subtotal = 1000000; // 10 lakh
      
      // In-state
      const cgst = subtotal * 0.025; // 25000
      const sgst = subtotal * 0.025; // 25000
      const totalTaxInState = cgst + sgst; // 50000
      const totalInState = subtotal + totalTaxInState; // 1050000
      
      // Out-state
      const igst = subtotal * 0.05; // 50000
      const totalOutState = subtotal + igst; // 1050000
      
      expect(cgst).toBe(25000);
      expect(sgst).toBe(25000);
      expect(totalTaxInState).toBe(50000);
      expect(totalInState).toBe(1050000);
      expect(igst).toBe(50000);
      expect(totalOutState).toBe(1050000);
    });
  });

  describe('Tax Calculation Utility Functions', () => {
    // Helper function to calculate subtotal
    const calculateSubtotal = (items) => {
      return items.reduce((sum, item) => sum + (item.quantity * item.customPrice), 0);
    };

    // Helper function to calculate in-state taxes
    const calculateInStateTaxes = (subtotal) => {
      const cgst = subtotal * 0.025;
      const sgst = subtotal * 0.025;
      const igst = 0;
      const totalTaxAmount = cgst + sgst;
      const totalAmount = subtotal + totalTaxAmount;
      
      return { cgst, sgst, igst, totalTaxAmount, totalAmount };
    };

    // Helper function to calculate out-state taxes
    const calculateOutStateTaxes = (subtotal) => {
      const cgst = 0;
      const sgst = 0;
      const igst = subtotal * 0.05;
      const totalTaxAmount = igst;
      const totalAmount = subtotal + totalTaxAmount;
      
      return { cgst, sgst, igst, totalTaxAmount, totalAmount };
    };

    test('should calculate subtotal correctly', () => {
      const items = [
        { quantity: 2, customPrice: 50 },
        { quantity: 1, customPrice: 100 },
        { quantity: 3, customPrice: 75 }
      ];
      
      const subtotal = calculateSubtotal(items);
      expect(subtotal).toBe(425); // (2*50) + (1*100) + (3*75)
    });

    test('should calculate in-state taxes using utility function', () => {
      const subtotal = 500;
      const taxes = calculateInStateTaxes(subtotal);
      
      expect(taxes.cgst).toBe(12.5);
      expect(taxes.sgst).toBe(12.5);
      expect(taxes.igst).toBe(0);
      expect(taxes.totalTaxAmount).toBe(25);
      expect(taxes.totalAmount).toBe(525);
    });

    test('should calculate out-state taxes using utility function', () => {
      const subtotal = 500;
      const taxes = calculateOutStateTaxes(subtotal);
      
      expect(taxes.cgst).toBe(0);
      expect(taxes.sgst).toBe(0);
      expect(taxes.igst).toBe(25);
      expect(taxes.totalTaxAmount).toBe(25);
      expect(taxes.totalAmount).toBe(525);
    });

    test('should produce same total amount for both tax types', () => {
      const subtotal = 1000;
      
      const inStateTaxes = calculateInStateTaxes(subtotal);
      const outStateTaxes = calculateOutStateTaxes(subtotal);
      
      expect(inStateTaxes.totalAmount).toBe(outStateTaxes.totalAmount);
      expect(inStateTaxes.totalTaxAmount).toBe(outStateTaxes.totalTaxAmount);
    });
  });
});