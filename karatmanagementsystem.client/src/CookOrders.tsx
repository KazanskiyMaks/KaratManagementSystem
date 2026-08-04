import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import VolumeMuteIcon from '@mui/icons-material/VolumeMute';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from "react-i18next";

declare enum Direction {
    Previous,
    Next
}

interface ServingTable {
    id: number;
    name: string;
}

interface CookItem {
    id: number;
    name: string;
}

interface CookOrderItemDraft {
    cookItemId: number;
    quantity: number;
}

interface CookOrderItem {
    id: number;
    cookOrderId: number;
    cookItemId: number;
    quantity: number;
    isReady: boolean;
    cookItem: CookItem;
}

interface CookOrder {
    id: number;
    table: ServingTable;
    cookItems: CookItem[];
    cookOrderItems: CookOrderItem[];
    notes: string;
    isProcessing: boolean;
    isCompleted: boolean;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
}

export default function CookOrders() {
    const theme = useTheme();
    const { t } = useTranslation();

    function formatLocalDate(date: Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    function parseServerDate(date: string | null | undefined) {
        if (!date) {
            return null;
        }

        const hasTimezone = /([zZ]|[+-]\d{2}:\d{2})$/.test(date);
        return new Date(hasTimezone ? date : `${date}Z`);
    }

    function normalizeOrder(order: CookOrder): CookOrder {
        return {
            ...order,
            createdAt: parseServerDate(order.createdAt)?.toISOString() ?? order.createdAt,
            startedAt: parseServerDate(order.startedAt)?.toISOString() ?? order.startedAt,
            completedAt: parseServerDate(order.completedAt)?.toISOString() ?? order.completedAt
        };
    }

    function formatOrderTime(date: string | null) {
        const parsedDate = parseServerDate(date);
        return parsedDate ? parsedDate.toLocaleTimeString() : '';
    }

    async function fetchOrders(date: Date | string | null, isProcessing?: boolean, isCompleted?: boolean) {
        let formattedDate = '';
        if (date) {
            if (typeof date === 'string') {
                formattedDate = date.split('T')[0];
            } else {
                formattedDate = formatLocalDate(date);
            }
        }
        if (isProcessing && isCompleted) {
            isProcessing = undefined;
            isCompleted = undefined;
        }
        const queryParams = new URLSearchParams();
        if (isProcessing !== undefined) queryParams.append('isProcessing', String(isProcessing));
        if (isCompleted !== undefined) queryParams.append('isCompleted', String(isCompleted));
        const response = await fetch(`api/cookorder/date/${formattedDate}?${queryParams.toString()}`);

        if (!response.ok) {
            throw new Error(`Failed to load cook orders (${response.status} ${response.statusText})`);
        }

        const result = await response.json();
        const updatedOrder: CookOrder[] = result.cookOrder ?? result.CookOrder ?? result;

        return updatedOrder.map(normalizeOrder);
    }

    async function fetchNearDate(date: Date | null, direction: Direction) {
        const formattedDate = date ? formatLocalDate(date) : '';
        const queryParams = new URLSearchParams();
        if (direction === Direction.Previous) queryParams.append('direction', String(Direction.Previous));
        else if (direction === Direction.Next) queryParams.append('direction', String(Direction.Next));
        const response = await fetch(`api/cookorder/date/near/${formattedDate}?${queryParams.toString()}`);

        if (!response.ok) {
            throw new Error(`Failed to ${direction} get date (${response.status} ${response.statusText})`);
        }

        const result = await response.json();
        const fetchDate = parseServerDate(result);

        return fetchDate;
    }

    const [value, setValue] = useState(0);
    const [orders, setOrders] = useState<CookOrder[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [open, setOpen] = useState<Record<number, boolean>>({});
    const [currentTime, setCurrentTime] = useState(Date.now());
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [servingTables, setServingTables] = useState<ServingTable[]>([]);
    const [cookItems, setCookItems] = useState<CookItem[]>([]);
    const [selectedTableId, setSelectedTableId] = useState(0);
    const [notes, setNotes] = useState('');
    const [orderItems, setOrderItems] = useState<CookOrderItemDraft[]>([]);
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const [orderFormError, setOrderFormError] = useState('');
    const previousOrderIdsRef = useRef<Set<number>>(new Set());
    const isFirstLoadRef = useRef(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(false);


    useEffect(() => {
        let isDisposed = false;

        async function refreshOrders() {
            const updatedOrders = await fetchOrders(
                selectedDate,
                value === 1 || value === 0,
                value === 2 || value === 0
            );

            if (isDisposed) return;

            const prevIds = previousOrderIdsRef.current;
            const nextIds = new Set(updatedOrders.map(o => o.id));
            const hasNewOrder = updatedOrders.some(o => !prevIds.has(o.id));

            if (!isFirstLoadRef.current && hasNewOrder) {
                playNewOrderSound();
            }

            isFirstLoadRef.current = false;
            previousOrderIdsRef.current = nextIds;
            setOrders(updatedOrders);
        }

        void refreshOrders();
        const timer = setInterval(() => { void refreshOrders(); }, 5000);

        return () => {
            isDisposed = true;
            clearInterval(timer);
        };
    }, [selectedDate, value, soundEnabled]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        async function loadOrderFormData() {
            try {
                const [tablesResponse, itemsResponse] = await Promise.all([
                    fetch('api/cooklist/serving_tables'),
                    fetch('api/cooklist/cook_items')
                ]);

                if (tablesResponse.ok) {
                    const tablesResult = await tablesResponse.json();
                    const updatedTables: ServingTable[] = tablesResult.servingTables ?? tablesResult.ServingTables ?? tablesResult;
                    setServingTables(updatedTables);
                }

                if (itemsResponse.ok) {
                    const itemsResult = await itemsResponse.json();
                    const updatedItems: CookItem[] = itemsResult.cookItems ?? itemsResult.CookItems ?? itemsResult;
                    setCookItems(updatedItems);
                }
            } catch {
                return;
            }
        }

        void loadOrderFormData();
    }, []);

    useEffect(() => {
        if (!isAddDialogOpen) {
            return;
        }

        if (selectedTableId === 0 && servingTables.length > 0) {
            setSelectedTableId(servingTables[0].id);
        }

        if (orderItems.length === 0 && cookItems.length > 0) {
            setOrderItems([{ cookItemId: cookItems[0].id, quantity: 1 }]);
        }
    }, [isAddDialogOpen, selectedTableId, orderItems.length, servingTables, cookItems]);

    useEffect(() => {
        audioRef.current = new Audio('/sounds/new-order.mp3'); // файл у public/sounds/new-order.mp3
        audioRef.current.preload = 'auto';
    }, []);

    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const handleOpen = (orderId: number) => {
        setOpen((current) => ({
            ...current,
            [orderId]: !current[orderId]
        }));
    };

    const isOpen = (orderId: number) => open[orderId] ?? false;

    function resetOrderForm() {
        setOrderFormError('');
        setSelectedTableId(servingTables[0]?.id ?? 0);
        setOrderItems(cookItems.length > 0 ? [{ cookItemId: cookItems[0].id, quantity: 1 }] : []);
    }

    function handleOpenAddDialog() {
        resetOrderForm();
        setIsAddDialogOpen(true);
    }

    function handleCloseAddDialog() {
        setIsAddDialogOpen(false);
        setIsSubmittingOrder(false);
        setOrderFormError('');
    }

    function updateOrderItem(index: number, updater: (item: CookOrderItemDraft) => CookOrderItemDraft) {
        setOrderItems((current) => current.map((item, currentIndex) => (currentIndex === index ? updater(item) : item)));
    }

    function addOrderItemRow() {
        setOrderItems((current) => [...current, { cookItemId: cookItems[0]?.id ?? 0, quantity: 1 }]);
    }

    function removeOrderItemRow(index: number) {
        setOrderItems((current) => current.length > 1 ? current.filter((_, currentIndex) => currentIndex !== index) : current);
    }

    function playNewOrderSound() {
        if (!soundEnabled || !audioRef.current) return;
        audioRef.current.currentTime = 0;
        void audioRef.current.play().catch(() => {
            // браузер може блокувати звук без user interaction
        });
    }

    async function submitNewCookOrder() {
        const selectedTable = servingTables.find((table) => table.id === selectedTableId);
        const preparedItems = orderItems
            .filter((item) => item.cookItemId > 0 && item.quantity > 0)
            .map((item) => ({
                cookItemId: item.cookItemId,
                quantity: item.quantity
            }));

        if (!selectedTable) {
            setOrderFormError(t("orders.error_select_table"));
            return;
        }

        if (preparedItems.length === 0) {
            setOrderFormError(t("orders.error_add_item"));
            return;
        }

        setIsSubmittingOrder(true);
        setOrderFormError('');

        try {
            const response = await fetch('api/cookorder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    servingTable: selectedTable,
                    cookItems: preparedItems,
                    notes: notes
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = 'Failed to create cook order.';

                try {
                    const parsedError = JSON.parse(errorText) as { message?: string; Message?: string };
                    errorMessage = parsedError.message ?? parsedError.Message ?? errorMessage;
                } catch {
                    if (errorText) {
                        errorMessage = errorText;
                    }
                }

                setOrderFormError(errorMessage);
                return;
            }

            handleCloseAddDialog();
            const updatedOrders = await fetchOrders(selectedDate, value === 1 || value === 0, value === 2 || value === 0);
            setOrders(updatedOrders);
        } finally {
            setIsSubmittingOrder(false);
        }
    }

    async function setStart(id: number) {
        const response = await fetch(`api/cookorder/${id}/start_process`, {
            method: 'PATCH',
        });
        if (!response.ok) return;

        const result = await response.json();
        const updatedOrder = result.cookOrder ?? result.CookOrder ?? result;
        const normalizedOrder = updatedOrder ? normalizeOrder(updatedOrder) : null;

        setOrders((currentOrders) =>
            currentOrders.map((order) => {
                if (order.id !== id) {
                    return order;
                }

                if (normalizedOrder) {
                    return normalizedOrder;
                }

                return {
                    ...order,
                    isProcessing: true,
                    startedAt: order.startedAt ?? new Date().toISOString()
                };
            })
        );
    }

    async function setComplete(id: number) {
        const response = await fetch(`api/cookorder/${id}/complete_process`, {
            method: 'PATCH',
        });
        if (!response.ok) return;

        const result = await response.json();
        const updatedOrder = result.cookOrder ?? result.CookOrder ?? result;
        const normalizedOrder = updatedOrder ? normalizeOrder(updatedOrder) : null;

        setOrders((currentOrders) =>
            currentOrders.map((order) => {
                if (order.id !== id) {
                    return order;
                }

                if (normalizedOrder) {
                    return normalizedOrder;
                }

                return {
                    ...order,
                    isCompleted: true,
                    completedAt: order.completedAt ?? new Date().toISOString()
                };
            })
        );
    }

    async function checkOrderItem(orderItemId: number) {
        const response = await fetch(`api/cookorder/${orderItemId}/check_cook_order_item`, {
            method: 'PATCH',
        });
        if (!response.ok) return;

        const result = await response.json();
        const updatedOrder = result.cookOrder ?? result.CookOrder ?? result;
        const normalizedOrder = updatedOrder ? normalizeOrder(updatedOrder) : null;

        setOrders((currentOrders) => {
            if (normalizedOrder?.id) {
                return currentOrders.map((order) =>
                    order.id === normalizedOrder.id ? normalizedOrder : order
                );
            }

            return currentOrders.map((order) => ({
                ...order,
                cookOrderItems: order.cookOrderItems.map((item) =>
                    item.id === orderItemId ? { ...item, isReady: !item.isReady } : item
                )
            }));
        });
    }

    return (
        <Box sx={{ width: '100%', typography: 'body1' }}>
            <Button
                variant="contained"
                onClick={handleOpenAddDialog}
                sx={{ position: 'absolute', bottom: 16, right: 16, aspectRatio: '1' }}>
                <AddIcon/>
            </Button>
            <Dialog open={isAddDialogOpen} onClose={handleCloseAddDialog} fullWidth maxWidth="sm">
                <DialogTitle>{t("orders.add_order_dialog_title")}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            select
                            fullWidth
                            label={t("orders.serving_table")}
                            value={selectedTableId}
                            onChange={(event) => setSelectedTableId(Number(event.target.value))}
                        >
                            {servingTables.map((table) => (
                                <MenuItem key={table.id} value={table.id}>
                                    {table.name}
                                </MenuItem>
                            ))}
                        </TextField>
                        <Divider />
                        <TextField
                            label={t("orders.notes")}
                            value={notes}
                            onChange={(event) => setNotes(event.target.value) }
                        >
                        </TextField>
                        <Divider />
                        <Stack spacing={1}>
                            <Typography variant="subtitle1">{t("orders.items")}</Typography>
                            {orderItems.map((item, index) => (
                                <Stack key={`${index}-${item.cookItemId}`} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label={t("orders.cook_item")}
                                        value={item.cookItemId}
                                        onChange={(event) => {
                                            const nextValue = Number(event.target.value);
                                            updateOrderItem(index, (current) => ({ ...current, cookItemId: nextValue }));
                                        }}
                                    >
                                        {cookItems.map((cookItem) => (
                                            <MenuItem key={cookItem.id} value={cookItem.id}>
                                                {cookItem.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                    <TextField
                                        label={t("orders.quantity")}
                                        type="number"
                                        value={item.quantity}
                                        onChange={(event) => {
                                            const nextValue = Math.max(1, Number(event.target.value) || 1);
                                            updateOrderItem(index, (current) => ({ ...current, quantity: nextValue }));
                                        }}
                                        slotProps={{ htmlInput: { min: 1 } }}
                                        sx={{ width: 130 }}
                                    />
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={() => removeOrderItemRow(index)} disabled={orderItems.length === 1}
                                        sx={{ aspectRatio:1 }}
                                    >
                                        <RemoveIcon/>
                                    </Button>
                                </Stack>
                            ))}
                            <Button variant="text" onClick={addOrderItemRow}>
                                {t("orders.add_item")}
                            </Button>
                        </Stack>
                        {orderFormError && (
                            <Typography color="error">{orderFormError}</Typography>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAddDialog}>{t("common.cancel")}</Button>
                    <Button variant="contained" onClick={submitNewCookOrder} disabled={isSubmittingOrder}>
                        {isSubmittingOrder ? t("orders.saving") : t("common.save")}
                    </Button>
                </DialogActions>
            </Dialog>
            <Box sx={{
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2
            }}>
                <Button color="inherit" onClick={() => fetchNearDate(selectedDate, Direction.Previous).then(setSelectedDate)} ><KeyboardArrowLeftIcon/></Button>
                <DatePicker label={t("orders.select_date")} value={selectedDate} onChange={(date) => { if (date === null || !isNaN(date.getTime())) setSelectedDate(date); }} />
                <Button color="inherit" onClick={() => fetchNearDate(selectedDate, Direction.Next).then(setSelectedDate)} ><KeyboardArrowRightIcon /></Button>
                <Button variant="outlined" onClick={() => setSoundEnabled(!soundEnabled)}>
                    {soundEnabled ? <VolumeUpIcon /> : <VolumeMuteIcon />}
                </Button>
            </Box>
            <Tabs value={value} onChange={handleChange} aria-label="cook orders tabs">
                <Tab label={t("orders.all_orders")} value={0} />
                <Tab label={t("orders.processing_orders")} value={1} />
                <Tab label={t("orders.completed_orders")} value={2} />
            </Tabs>
            <List>
                {orders.map((order) => (
                    <Box key={order.id}>
                        <ListItemButton 
                            onClick={() => handleOpen(order.id)}
                            sx={{
                                borderRadius: isOpen(order.id) ? '8px 8px 0px 0px' : '8px',
                                backgroundColor: theme.palette.mode === 'dark' 
                                    ? 'rgba(255, 255, 255, 0.08)' 
                                    : 'rgba(0, 0, 0, 0.04)',
                                transition: 'background-color 0.3s ease',
                                '&:hover': {
                                    backgroundColor: theme.palette.mode === 'dark'
                                        ? 'rgba(255, 255, 255, 0.15)'
                                        : 'rgba(0, 0, 0, 0.08)'
                                },
                                mb: isOpen(order.id) ? 0 : 1
                            }}
                        >
                            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }} >
                                <ListItemText
                                    primary={`${t("orders.table")}: ${order.table.name}`}
                                    secondary={`${t("orders.items")}: ${order.cookItems.map(item => item.name).join(', ')} | ${t("orders.notes")}: ${order.notes}`}
                                />
                                {!order.isProcessing && !order.isCompleted &&
                                    <Button
                                        color="warning"
                                        variant="outlined"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setStart(order.id);
                                        }}
                                    >
                                        {t("orders.begin")}
                                    </Button>
                                }
                                {order.isProcessing && !order.isCompleted &&
                                    <Button
                                        color="success"
                                        variant="outlined"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setStart(order.id);
                                        }}
                                    >
                                        {t("orders.suspend")}
                                    </Button>
                                }
                                {!order.isCompleted &&
                                    <Button
                                        color="error"
                                        variant="outlined"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setComplete(order.id);
                                        }}
                                    >
                                        {t("orders.complete")}
                                    </Button>
                                }
                                {order.isCompleted && <span style={{ marginLeft: '8px', color: theme.palette.success.main }}>{t("orders.completed")}</span>}
                                {order.isProcessing && !order.isCompleted && <span style={{ marginLeft: '8px', color: theme.palette.warning.main }}>{t("orders.processing")}</span>}
                                {!order.isProcessing && !order.isCompleted && <span style={{ marginLeft: '8px', color: theme.palette.text.secondary }}>{t("orders.pending")}</span>}
                                {order.startedAt && <span style={{ marginLeft: '8px', color: theme.palette.info.main }}>{t("orders.started_at")}: {formatOrderTime(order.startedAt)}</span>}
                                {order.isProcessing && order.startedAt && !order.isCompleted && <span style={{ marginLeft: '8px', color: theme.palette.info.main }}>{t("orders.elapsed_time")}: {new Date(currentTime - parseServerDate(order.startedAt)!.getTime()).toISOString().substr(11, 8)}</span>}
                                {order.isCompleted && order.completedAt && <span style={{ marginLeft: '8px', color: theme.palette.success.main }}>{t("orders.completed_at")}: {formatOrderTime(order.completedAt)}</span>}
                            </Stack>
                            <Box sx={{ marginLeft: 'auto' }}>
                                {isOpen(order.id) ? <ExpandLess /> : <ExpandMore />}
                            </Box>
                        </ListItemButton>
                        <Collapse 
                            in={isOpen(order.id)} 
                            timeout="auto" 
                            unmountOnExit
                            sx={{
                                borderRadius: '0px 0px 8px 8px',
                                backgroundColor: theme.palette.mode === 'dark'
                                    ? 'rgba(255, 255, 255, 0.04)'
                                    : 'rgba(0, 0, 0, 0.02)',
                                overflow: 'hidden'
                            }}
                        >
                            <List sx={{ pt: 0, pb: 0 }}>
                            {order.cookOrderItems.map((item) => (
                                <ListItem
                                    key={item.id}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 1,
                                        m: 1,
                                        bgcolor: theme.palette.mode === 'dark'
                                            ? 'rgba(255, 255, 255, 0.06)'
                                            : 'rgba(0, 0, 0, 0.03)',
                                        border: 1,
                                        borderRadius: '6px',
                                        borderColor: theme.palette.mode === 'dark'
                                            ? 'rgba(255, 255, 255, 0.12)'
                                            : 'rgba(0, 0, 0, 0.12)',
                                        p: 2,
                                        transition: 'background-color 0.2s ease'
                                    }}>
                                    <Stack direction="row" spacing={2} sx={{alignItems: 'center'}} >
                                        <ListItemText
                                            primary={`${item.cookItem.name} - ${item.quantity} ${t("orders.pcs")}`}
                                        />
                                        <Checkbox checked={item.isReady} onChange={() => checkOrderItem(item.id)} />{t("orders.ready")}
                                    </Stack>
                                </ListItem>
                            ))}
                            </List>
                        </Collapse>
                    </Box>
                ))}
            </List>
        </Box>
    );
}
