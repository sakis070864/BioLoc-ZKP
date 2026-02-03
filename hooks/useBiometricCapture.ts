import { useState, useRef, useCallback } from 'react';

export interface KeyEvent {
    code: string;
    time: number;
    type: "keydown" | "keyup";
}

export const useBiometricCapture = () => {
    const [data, setData] = useState<KeyEvent[]>([]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent | KeyboardEvent) => {
        if (e.repeat) return;

        const event: KeyEvent = {
            code: e.code,
            time: performance.now(),
            type: "keydown"
        };
        setData(prev => [...prev, event]);
    }, []);

    const handleKeyUp = useCallback((e: React.KeyboardEvent | KeyboardEvent) => {
        const event: KeyEvent = {
            code: e.code,
            time: performance.now(),
            type: "keyup"
        };
        setData(prev => [...prev, event]);
    }, []);

    const resetCapture = useCallback(() => {
        setData([]);
    }, []);

    return {
        data,
        handleKeyDown,
        handleKeyUp,
        resetCapture
    };
};
