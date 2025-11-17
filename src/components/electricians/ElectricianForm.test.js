import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ElectricianForm from './ElectricianForm';
import api from '../../config/axios';

jest.mock('../../config/axios');

describe('ElectricianForm', () => {
  const mockNavigate = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetchElectricianDetails is called when in edit mode', async () => {
    const mockElectrician = {
      data: {
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890'
        }
      }
    };
    
    api.get.mockResolvedValueOnce(mockElectrician);
    
    render(
      <BrowserRouter>
        <ElectricianForm />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });
  });

  test('renders form fields correctly', () => {
    render(
      <BrowserRouter>
        <ElectricianForm />
      </BrowserRouter>
    );
    
    expect(screen.getByRole('form') || screen.getByTestId('electrician-form')).toBeInTheDocument();
  });
});
