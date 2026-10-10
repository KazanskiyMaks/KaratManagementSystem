import { useState, useEffect } from 'react';
import * as React from 'react';
import './App.css';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CookOrders from './CookOrders';
import CookListCrud from './CookListCrud';
import { useTranslation } from "react-i18next";
import { clearAuthSession, getAuthSession, saveAuthSession } from './auth';

interface LoginResponse {
    accessToken?: string;
    login?: string;
    message?: string;
}

interface AuthStatus {
    isAuthenticated: boolean;
    login: string;
    role: string;
}

function App() {
    const { t, i18n } = useTranslation();

    const initialSession = getAuthSession();

    const [value, setValue] = useState(0);
    const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
    const [loginInput, setLoginInput] = useState('');
    const [passwordInput, setPasswordInput] = useState('');
    const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [authToken, setAuthToken] = useState(initialSession?.token ?? '');
    const [authLogin, setAuthLogin] = useState(initialSession?.login ?? '');
    const [accountMenuAnchorEl, setAccountMenuAnchorEl] = useState<null | HTMLElement>(null);

    const isAuthenticated = authToken.length > 0 && authLogin.length > 0;

    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
        if (!isAuthenticated && newValue !== 0) {
            return;
        }

        setValue(newValue);
    };

    const openLoginDialog = () => {
        setLoginError('');
        setLoginInput('');
        setPasswordInput('');
        setIsLoginDialogOpen(true);
    };

    const closeLoginDialog = () => {
        if (isSubmittingLogin) {
            return;
        }

        setIsLoginDialogOpen(false);
    };

    const handleAccountMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAccountMenuAnchorEl(event.currentTarget);
    };

    const handleAccountMenuClose = () => {
        setAccountMenuAnchorEl(null);
    };

    const handleLogout = () => {
        clearAuthSession();
        setAuthToken('');
        setAuthLogin('');
        setValue(0);
        handleAccountMenuClose();
    };

    const handleLoginSubmit = async () => {
        if (!loginInput.trim() || !passwordInput.trim()) {
            setLoginError(t('auth.validation_required'));
            return;
        }

        setIsSubmittingLogin(true);
        setLoginError('');

        try {
            const response = await fetch('api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    login: loginInput.trim(),
                    password: passwordInput
                })
            });

            const data: LoginResponse = await response.json();

            if (!response.ok || !data.accessToken || !data.login) {
                setLoginError(data.message ?? t('auth.login_failed'));
                return;
            }

            saveAuthSession({ token: data.accessToken, login: data.login });
            setAuthToken(data.accessToken);
            setAuthLogin(data.login);
            setIsLoginDialogOpen(false);
            setValue(0);
        } catch {
            setLoginError(t('auth.login_failed'));
        } finally {
            setIsSubmittingLogin(false);
        }
    };

    async function refreshAuthSession() {
        const result = await fetch('api/auth/refresh', {
            method: 'POST'
        });
        if (!result.ok) {
            handleLogout();
            return;
        }
        const data: LoginResponse = await result.json();

        if (!data.accessToken || !data.login) {
            return;
        }

        saveAuthSession({ token: data.accessToken, login: data.login });
        setAuthToken(data.accessToken);
        setAuthLogin(data.login);
    }

    async function checkAuthStatus() {
        const result = await fetch('api/auth/status');
        if (!result.ok) {
            handleLogout();
            return;
        }

        const data: AuthStatus = await result.json();
        if (!data.isAuthenticated) {
            handleLogout();
            return;
        }
    }

    useEffect(() => {
        const interval = setInterval(() => {
            refreshAuthSession();
            checkAuthStatus();
        }, 5 * 60 * 1000); // Refresh every 5 minutes

        checkAuthStatus();

        return () => clearInterval(interval);
    }, []);

    const contentMap: Record<number, React.ReactNode> = {
        0: (
            <Box>
                <h1>{t("home.title")}</h1>
                <h3>alpha testing</h3>
            </Box>
        ),
        1: <CookOrders />,
        2: <CookListCrud />
    };

    const selectedContent = !isAuthenticated && value !== 0
        ? contentMap[0]
        : contentMap[value] || <Box>{t("common.not_found")}</Box>;

    return (
        <Box sx={{ width: '100%', typography: 'body1' }}>
            <Box sx={{
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2
            }}>
                <Tabs
                    value={value}
                    onChange={handleChange}
                    aria-label="main-navigation"
                    textColor="inherit"
                    indicatorColor="secondary"
                    sx={{
                        '& .MuiTab-root': { color: 'text.secondary' },
                        '& .Mui-selected': { color: 'text.primary !important' },
                    }}
                >
                    <Tab label={t("home.home")} value={0} />
                    {isAuthenticated && <Tab label={t("home.orders")} value={1} />}
                    {isAuthenticated && <Tab label={t("home.tables")} value={2} />}
                </Tabs>
                <Box sx={{ display: 'flex', gap: 1, pr: 1 }}>
                    <Select
                        value=""
                        displayEmpty
                        renderValue={() => i18n.language}
                        sx={{ minWidth: 50 }}
                    >
                        <MenuItem value="uk" onClick={() => i18n.changeLanguage("uk")}>UA</MenuItem>
                        <MenuItem value="en" onClick={() => i18n.changeLanguage("en")}>EN</MenuItem>
                    </Select>

                    {!isAuthenticated && (
                        <Button variant="outlined" onClick={openLoginDialog}>
                            {t('auth.login_button')}
                        </Button>
                    )}

                    {isAuthenticated && (
                        <>
                            <Button variant="outlined" onClick={handleAccountMenuOpen}>
                                {authLogin}
                            </Button>
                            <Menu
                                anchorEl={accountMenuAnchorEl}
                                open={Boolean(accountMenuAnchorEl)}
                                onClose={handleAccountMenuClose}
                            >
                                <MenuItem onClick={handleLogout}>{t('auth.logout_button')}</MenuItem>
                            </Menu>
                        </>
                    )}
                </Box>
            </Box>

            <Box sx={{ p: 3 }}>
                {selectedContent}
            </Box>

            <Dialog open={isLoginDialogOpen} onClose={closeLoginDialog} fullWidth maxWidth="xs">
                <DialogTitle>{t('auth.login_dialog_title')}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label={t('auth.login_field_label')}
                            value={loginInput}
                            onChange={(event) => setLoginInput(event.target.value)}
                            autoComplete="username"
                            fullWidth
                        />
                        <TextField
                            label={t('auth.password_field_label')}
                            type="password"
                            value={passwordInput}
                            onChange={(event) => setPasswordInput(event.target.value)}
                            autoComplete="current-password"
                            fullWidth
                        />
                        {loginError && (
                            <Typography color="error" variant="body2">
                                {loginError}
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeLoginDialog} disabled={isSubmittingLogin}>
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleLoginSubmit} variant="contained" disabled={isSubmittingLogin}>
                        {isSubmittingLogin ? t('auth.login_in_progress') : t('auth.login_confirm_button')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default App;
