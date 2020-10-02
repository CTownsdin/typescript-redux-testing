import React from 'react';
import { Provider } from 'react-redux';
import {
    render as rtlRender,
    fireEvent,
    waitFor
} from '@testing-library/react';
import App from './App';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from './store/reducers';
import '@testing-library/jest-dom/extend-expect';
import axios from 'axios';
import { aRandomNumberFacts } from './store/mocks';

jest.mock('axios');

// wrap the RTL render method with our Provider with a mock redux store on it.
const render = (ui: any, initialStore = {}, options = {}) => {
    const store = createStore(
        rootReducer,
        initialStore,
        applyMiddleware(thunk)
    );

    const Providers = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
    );

    return rtlRender(ui, { wrapper: Providers, ...options });
};

describe('Applicatio HomePage', () => {
    test('clicking the "Get new fact" button should display a new fact', async () => {
        // Arrange
        const { getByText, queryByText, debug } = render(<App />);
        expect(queryByText('Save that fact')).not.toBeInTheDocument();

        const mockFact = 'Random fact';
        (axios.get as jest.Mock).mockResolvedValue({ data: mockFact });

        // Act
        fireEvent.click(getByText('Get new fact!'));

        // Assert
        expect(queryByText('Loading...')).toBeInTheDocument();

        await waitFor(() => {
            expect(getByText(mockFact)).toBeInTheDocument();
            expect(getByText('Save that fact')).toBeInTheDocument();
        });
    });

    test('clicking "Get new fact" should replace the current fact with a new fact', async () => {
        // Arrange
        const firstRandomFactText = 'First random fact';
        const secondRandomFactText = 'Second random fact';

        const { getByText, queryByText } = render(<App />);

        (axios.get as jest.Mock).mockResolvedValue({
            data: firstRandomFactText
        });

        // Act
        fireEvent.click(getByText('Get new fact!'));

        // Assert
        await waitFor(() => {
            expect(queryByText(firstRandomFactText)).toBeInTheDocument();
        });

        (axios.get as jest.Mock).mockResolvedValue({
            data: secondRandomFactText
        });

        // Act
        fireEvent.click(getByText('Get new fact!'));

        // Assert
        await waitFor(() => {
            expect(queryByText(secondRandomFactText)).toBeInTheDocument();
            expect(queryByText(firstRandomFactText)).not.toBeInTheDocument();
        });
    });

    it('clicking the save button should save a random fact', () => {
        const randomFactText = 'Random fact';
        const { queryByLabelText, getByText, getByRole, queryByRole } = render(
            <App />,
            {
                randomNumberFacts: aRandomNumberFacts({
                    currentFact: randomFactText
                })
            }
        );

        expect(
            queryByLabelText('Currently displayed random fact')
        ).toBeInTheDocument();

        expect(queryByRole('listitem')).not.toBeInTheDocument();

        fireEvent.click(getByText('Save that fact'));

        expect(
            queryByLabelText('Currently displayed random fact')
        ).not.toBeInTheDocument();

        expect(getByRole('listitem')).toHaveTextContent(randomFactText);
    });
});
