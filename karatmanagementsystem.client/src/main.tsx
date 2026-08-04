import React, { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Snackbar from '@mui/joy/Snackbar';
import { CssVarsProvider } from '@mui/joy/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import './index.css';
import App from './App.tsx';
import "./i18n";

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

type AppErrorBoundaryProps = {
    onError: (message: string) => void;
    children: React.ReactNode;
};

class AppErrorBoundary extends React.Component<AppErrorBoundaryProps> {
    componentDidCatch(error: Error) {
        this.props.onError(error.message || 'Unexpected rendering error');
    }

    render() {
        return this.props.children;
    }
}

function RootWithErrorSnackbar() {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const handleWindowError = (event: ErrorEvent) => {
            setErrorMessage(event.error?.message || event.message || 'Unexpected runtime error');
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const reason = event.reason;
            if (reason instanceof Error) {
                setErrorMessage(reason.message);
                return;
            }

            if (typeof reason === 'string') {
                setErrorMessage(reason);
                return;
            }

            setErrorMessage('Unhandled promise rejection');
        };

        window.addEventListener('error', handleWindowError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('error', handleWindowError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);

    return (
        <>
            <AppErrorBoundary onError={setErrorMessage}>
                <App />
            </AppErrorBoundary>

            <CssVarsProvider>
                <Snackbar
                    open={Boolean(errorMessage)}
                    color="danger"
                    variant="solid"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    onClose={() => setErrorMessage(null)}
                >
                    {errorMessage}
                </Snackbar>
            </CssVarsProvider>
        </>
    );
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider theme={darkTheme}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <CssBaseline />
                <RootWithErrorSnackbar />
            </LocalizationProvider>
        </ThemeProvider>
    </StrictMode>,
);
