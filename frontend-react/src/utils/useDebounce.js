import { useState, useEffect } from 'react';

/**
 * useDebounce - delays updating a value until after a specified delay.
 * Prevents excessive API calls during rapid user input (e.g., search boxes).
 *
 * @param {any}    value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 400ms)
 * @returns {any}  The debounced value
 *
 * Usage:
 *   const debouncedSearch = useDebounce(searchTerm, 400);
 *   // Use debouncedSearch in your useEffect/API call dependency array
 */
const useDebounce = (value, delay = 400) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
};

export default useDebounce;
