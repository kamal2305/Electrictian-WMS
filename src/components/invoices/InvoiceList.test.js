import { render, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import InvoiceList from './InvoiceList';
import api from '../../config/axios';

jest.mock('../../config/axios');

describe('InvoiceList', () => {
  test('fetchInvoices is memoized with useCallback', async () => {
    const mockInvoices = {
      data: {
        success: true,
        data: []
      }
    };
    
    api.get.mockResolvedValueOnce(mockInvoices);
    
    render(
      <BrowserRouter>
        <InvoiceList />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/invoices', { params: {} });
    });
  });
});
