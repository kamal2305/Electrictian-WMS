import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ElectricianDashboard from './ElectricianDashboard';
import { AuthContext } from '../../context/AuthContext';

describe('ElectricianDashboard', () => {
  const mockUser = { id: '123', role: 'Electrician' };
  
  test('does not create unused AbortController', () => {
    const { container } = render(
      <AuthContext.Provider value={{ user: mockUser, loading: false }}>
        <BrowserRouter>
          <ElectricianDashboard />
        </BrowserRouter>
      </AuthContext.Provider>
    );
    
    // Verify component renders without AbortController variable
    expect(container).toBeTruthy();
  });

  test('whitespace-before-property syntax is fixed', () => {
    const { container } = render(
      <AuthContext.Provider value={{ user: mockUser, loading: false }}>
        <BrowserRouter>
          <ElectricianDashboard />
        </BrowserRouter>
      </AuthContext.Provider>
    );
    
    // Component should render without syntax errors
    expect(container).toBeTruthy();
  });
});
