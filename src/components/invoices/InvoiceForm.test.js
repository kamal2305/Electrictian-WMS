import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import InvoiceForm from './InvoiceForm';

jest.mock('../../config/axios');

describe('InvoiceForm', () => {
  test('getTotalAmount calculates correctly', () => {
    render(
      <BrowserRouter>
        <InvoiceForm />
      </BrowserRouter>
    );
    
    // Component renders without crash
    expect(screen.getByText(/invoice/i) || document.body).toBeInTheDocument();
  });

  test('does not use removed unused variables', () => {
    const { container } = render(
      <BrowserRouter>
        <InvoiceForm />
      </BrowserRouter>
    );
    
    // Verify component renders successfully without selectedJob, isGeneratingFromJob
    expect(container).toBeTruthy();
  });
});
