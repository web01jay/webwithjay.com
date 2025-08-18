const mongoose = require('mongoose');
const Client = require('../../../models/client.model');
const DataFactory = require('../../factories/dataFactory');

describe('Client Model Unit Tests', () => {
  describe('Client Creation', () => {
    test('should create a valid client with all fields', async () => {
      const clientData = DataFactory.client();
      const client = new Client(clientData);
      
      const savedClient = await client.save();
      
      expect(savedClient._id).toBeDefined();
      expect(savedClient.name).toBe(clientData.name);
      expect(savedClient.email).toBe(clientData.email.toLowerCase()); // Should be lowercase
      expect(savedClient.phone).toBe(clientData.phone);
      expect(savedClient.gstNumber).toBe(clientData.gstNumber.toUpperCase()); // Should be uppercase
      expect(savedClient.panNumber).toBe(clientData.panNumber.toUpperCase()); // Should be uppercase
      expect(savedClient.aadharNumber).toBe(clientData.aadharNumber);
      expect(savedClient.address.street).toBe(clientData.address.street);
      expect(savedClient.address.city).toBe(clientData.address.city);
      expect(savedClient.address.state).toBe(clientData.address.state);
      expect(savedClient.address.zipCode).toBe(clientData.address.zipCode);
      expect(savedClient.address.country).toBe(clientData.address.country);
      expect(savedClient.isActive).toBe(true);
      expect(savedClient.createdAt).toBeDefined();
      expect(savedClient.updatedAt).toBeDefined();
    });

    test('should create client with minimal required fields', async () => {
      const clientData = {
        name: 'Minimal Client',
        email: 'minimal@example.com',
        phone: '1234567890'
      };
      
      const client = new Client(clientData);
      const savedClient = await client.save();
      
      expect(savedClient._id).toBeDefined();
      expect(savedClient.name).toBe(clientData.name);
      expect(savedClient.email).toBe(clientData.email);
      expect(savedClient.phone).toBe(clientData.phone);
      expect(savedClient.address.country).toBe('India'); // Default value
      expect(savedClient.isActive).toBe(true); // Default value
    });

    test('should convert email to lowercase and format GST/PAN numbers', async () => {
      const clientData = DataFactory.client({
        email: 'TEST@EXAMPLE.COM',
        gstNumber: '29abcde1234f1z5',
        panNumber: 'abcde1234f'
      });
      
      const client = new Client(clientData);
      const savedClient = await client.save();
      
      expect(savedClient.email).toBe('test@example.com');
      expect(savedClient.gstNumber).toBe('29ABCDE1234F1Z5');
      expect(savedClient.panNumber).toBe('ABCDE1234F');
    });
  });

  describe('Client Validation', () => {
    test('should fail validation when name is missing', async () => {
      const clientData = DataFactory.invalidData().client.missingName;
      const client = new Client(clientData);
      
      await expect(client.save()).rejects.toThrow('Client name is required');
    });

    test('should fail validation when email is missing', async () => {
      const clientData = DataFactory.invalidData().client.missingEmail;
      const client = new Client(clientData);
      
      await expect(client.save()).rejects.toThrow('Email is required');
    });

    test('should fail validation when phone is missing', async () => {
      const clientData = DataFactory.invalidData().client.missingPhone;
      const client = new Client(clientData);
      
      await expect(client.save()).rejects.toThrow('Phone number is required');
    });

    test('should fail validation with invalid email format', async () => {
      const clientData = DataFactory.invalidData().client.invalidEmail;
      const client = new Client(clientData);
      
      await expect(client.save()).rejects.toThrow('Please enter a valid email');
    });

    test('should fail validation with invalid GST number format', async () => {
      const clientData = DataFactory.client({ gstNumber: 'INVALID-GST' });
      const client = new Client(clientData);
      
      await expect(client.save()).rejects.toThrow('Please enter a valid GST number');
    });

    test('should fail validation with invalid PAN number format', async () => {
      const clientData = DataFactory.client({ panNumber: 'INVALID-PAN' });
      const client = new Client(clientData);
      
      await expect(client.save()).rejects.toThrow('Please enter a valid PAN number');
    });

    test('should fail validation with invalid Aadhar number format', async () => {
      const clientData = DataFactory.client({ aadharNumber: '123' }); // Too short
      const client = new Client(clientData);
      
      await expect(client.save()).rejects.toThrow('Please enter a valid 12-digit Aadhar number');
    });

    test('should validate field length constraints', async () => {
      const testCases = [
        { field: 'name', value: 'A'.repeat(201), error: 'Client name cannot exceed 200 characters' },
        { field: 'phone', value: 'A'.repeat(21), error: 'Phone number cannot exceed 20 characters' }
      ];

      for (const testCase of testCases) {
        const clientData = DataFactory.client({ [testCase.field]: testCase.value });
        const client = new Client(clientData);
        
        await expect(client.save()).rejects.toThrow(testCase.error);
      }
    });

    test('should validate GST number length constraint', async () => {
      // GST number with invalid format (too long) will fail format validation first
      const clientData = DataFactory.client({ gstNumber: 'A'.repeat(16) });
      const client = new Client(clientData);
      
      await expect(client.save()).rejects.toThrow('Please enter a valid GST number');
    });

    test('should validate PAN number length constraint', async () => {
      // PAN number with invalid format (too long) will fail format validation first
      const clientData = DataFactory.client({ panNumber: 'A'.repeat(11) });
      const client = new Client(clientData);
      
      await expect(client.save()).rejects.toThrow('Please enter a valid PAN number');
    });

    test('should validate Aadhar number length constraint', async () => {
      // Aadhar number with invalid format (too long) will fail format validation first
      const clientData = DataFactory.client({ aadharNumber: 'A'.repeat(13) });
      const client = new Client(clientData);
      
      await expect(client.save()).rejects.toThrow('Please enter a valid 12-digit Aadhar number');
    });

    test('should validate address field length constraints', async () => {
      const clientData = DataFactory.client({
        address: {
          street: 'A'.repeat(201), // Exceeds 200 character limit
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'India'
        }
      });
      
      const client = new Client(clientData);
      
      await expect(client.save()).rejects.toThrow('Street address cannot exceed 200 characters');
    });
  });

  describe('Client Uniqueness', () => {
    test('should enforce unique email constraint', async () => {
      const email = 'unique@example.com';
      
      // Create first client with email
      const client1 = new Client(DataFactory.client({ email }));
      await client1.save();
      
      // Try to create second client with same email
      const client2 = new Client(DataFactory.client({ email }));
      
      await expect(client2.save()).rejects.toThrow();
    });
  });

  describe('Client Updates', () => {
    test('should update client fields correctly', async () => {
      const client = new Client(DataFactory.client());
      const savedClient = await client.save();
      
      // Update fields
      savedClient.name = 'Updated Client Name';
      savedClient.phone = '9876543210';
      savedClient.isActive = false;
      savedClient.address.city = 'Updated City';
      
      const updatedClient = await savedClient.save();
      
      expect(updatedClient.name).toBe('Updated Client Name');
      expect(updatedClient.phone).toBe('9876543210');
      expect(updatedClient.isActive).toBe(false);
      expect(updatedClient.address.city).toBe('Updated City');
      expect(updatedClient.updatedAt).not.toEqual(updatedClient.createdAt);
    });

    test('should maintain validation on updates', async () => {
      const client = new Client(DataFactory.client());
      const savedClient = await client.save();
      
      // Try to update with invalid data
      savedClient.email = 'invalid-email';
      
      await expect(savedClient.save()).rejects.toThrow('Please enter a valid email');
    });
  });

  describe('Client Queries', () => {
    beforeEach(async () => {
      // Create test clients
      await Client.create([
        DataFactory.client({ 
          name: 'Active Client 1', 
          email: 'active1@example.com',
          address: { state: 'Maharashtra' },
          isActive: true 
        }),
        DataFactory.client({ 
          name: 'Active Client 2', 
          email: 'active2@example.com',
          address: { state: 'Gujarat' },
          isActive: true 
        }),
        DataFactory.client({ 
          name: 'Inactive Client', 
          email: 'inactive@example.com',
          address: { state: 'Maharashtra' },
          isActive: false 
        })
      ]);
    });

    test('should find clients by state', async () => {
      const clients = await Client.find({ 'address.state': 'Maharashtra' });
      
      expect(clients).toHaveLength(2);
      expect(clients.every(c => c.address.state === 'Maharashtra')).toBe(true);
    });

    test('should find only active clients', async () => {
      const activeClients = await Client.find({ isActive: true });
      
      expect(activeClients).toHaveLength(2);
      expect(activeClients.every(c => c.isActive === true)).toBe(true);
    });

    test('should support text search on name and email', async () => {
      // Create a client with searchable content
      await Client.create(DataFactory.client({ 
        name: 'Searchable Client',
        email: 'searchable@example.com'
      }));
      
      const searchResults = await Client.find({ $text: { $search: 'searchable' } });
      
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults.some(c => c.name.includes('Searchable'))).toBe(true);
    });
  });

  describe('GST and PAN Number Validation', () => {
    test('should accept valid GST number formats', async () => {
      const validGstNumbers = [
        '29ABCDE1234F1Z5',
        '27ABCDE1234F1Z5',
        '09ABCDE1234F1Z5'
      ];

      for (const gstNumber of validGstNumbers) {
        const clientData = DataFactory.client({ gstNumber });
        const client = new Client(clientData);
        
        const savedClient = await client.save();
        expect(savedClient.gstNumber).toBe(gstNumber);
        
        // Clean up for next iteration
        await Client.deleteOne({ _id: savedClient._id });
      }
    });

    test('should accept valid PAN number formats', async () => {
      const validPanNumbers = [
        'ABCDE1234F',
        'XYZAB5678C',
        'PQRST9876D'
      ];

      for (const panNumber of validPanNumbers) {
        const clientData = DataFactory.client({ panNumber });
        const client = new Client(clientData);
        
        const savedClient = await client.save();
        expect(savedClient.panNumber).toBe(panNumber);
        
        // Clean up for next iteration
        await Client.deleteOne({ _id: savedClient._id });
      }
    });

    test('should accept valid Aadhar number formats', async () => {
      const validAadharNumbers = [
        '123456789012',
        '987654321098',
        '555666777888'
      ];

      for (const aadharNumber of validAadharNumbers) {
        const clientData = DataFactory.client({ aadharNumber });
        const client = new Client(clientData);
        
        const savedClient = await client.save();
        expect(savedClient.aadharNumber).toBe(aadharNumber);
        
        // Clean up for next iteration
        await Client.deleteOne({ _id: savedClient._id });
      }
    });
  });
});