import { useState } from 'react';
import * as React from 'react';
import './App.css';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CookOrders from './CookOrders';
import CookListCrud from './CookListCrud';
import { useTranslation } from "react-i18next";

function App() {
    const { t, i18n } = useTranslation();

    const [value, setValue] = useState(0);

    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const contentMap: Record<number, React.ReactNode> = {
        0: (
            <Box>
                <h1>{t("home.title")}</h1>
            </Box>
        ),
        1: <CookOrders />,
        2: <CookListCrud />
    };

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
                    <Tab label={t("home.orders")} value={1} />
                    <Tab label={t("home.tables")} value={2} />
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
                </Box>
            </Box>

            <Box sx={{ p: 3 }}>
                {contentMap[value] || <Box>{t("common.not_found")}</Box>}
            </Box>
        </Box>
    );
}

export default App;
