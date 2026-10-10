import { useEffect, useMemo, useState } from 'react';
import * as React from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import {
    type GridRowsProp,
    type GridRowModesModel,
    GridRowModes,
    DataGrid,
    type GridColDef,
    type GridEventListener,
    type GridRowId,
    type GridRowModel,
    GridRowEditStopReasons,
    type GridSlotProps,
    Toolbar,
    ToolbarButton,
    type GridSlots,
    gridEditRowsStateSelector,
    useGridSelector,
    useGridApiContext,
    GridActionsCell,
    type GridRenderCellParams,
    GridActionsCellItem,
} from '@mui/x-data-grid';

declare module '@mui/x-data-grid' {
    interface ToolbarPropsOverrides {
        setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
        setRowModesModel: (
            newModel: (oldModel: GridRowModesModel) => GridRowModesModel,
        ) => void;
    }
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

interface ServingTable {
    id: number;
    name: string;
}

interface CookItem {
    id: number;
    name: string;
}

interface ActionHandlers {
    handleCancelClick: (id: GridRowId) => void;
    handleDeleteClick: (id: GridRowId) => void;
    handleEditClick: (id: GridRowId) => void;
    handleSaveClick: (id: GridRowId) => void;
}

declare enum TableType {
    ServingTables,
    CookItems,
    CookOrders,
}

const ActionHandlersContext = React.createContext<ActionHandlers>({
    handleCancelClick: () => { },
    handleDeleteClick: () => { },
    handleEditClick: () => { },
    handleSaveClick: () => { },
});

function EditToolbar(props: GridSlotProps['toolbar']) {
    const { setRows, setRowModesModel } = props;

    const handleClick = () => {
        const id = Date.now();
        setRows((oldRows) => [
            ...oldRows,
            { id, name: '', isNew: true },
        ]);
        setRowModesModel((oldModel) => ({
            ...oldModel,
            [id]: { mode: GridRowModes.Edit, fieldToFocus: 'name' },
        }));
    };

    return (
        <Toolbar>
            <Tooltip title="Add record">
                <ToolbarButton onClick={handleClick}>
                    <AddIcon fontSize="small" />
                </ToolbarButton>
            </Tooltip>
        </Toolbar>
    );
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`data-tabpanel-${index}`}
            aria-labelledby={`data-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function ActionsCell(props: GridRenderCellParams) {
    const apiRef = useGridApiContext();
    const rowModesModel = useGridSelector(apiRef, gridEditRowsStateSelector);
    const isInEditMode = typeof rowModesModel[props.id] !== 'undefined';

    const { handleSaveClick, handleCancelClick, handleEditClick, handleDeleteClick } =
        React.useContext(ActionHandlersContext);

    return (
        <GridActionsCell {...props}>
            {isInEditMode ? (
                <React.Fragment>
                    <GridActionsCellItem
                        icon={<SaveIcon />}
                        label="Save"
                        material={{ sx: { color: 'primary.main' } }}
                        onClick={() => handleSaveClick(props.id)}
                    />
                    <GridActionsCellItem
                        icon={<CancelIcon />}
                        label="Cancel"
                        className="textPrimary"
                        onClick={() => handleCancelClick(props.id)}
                        color="inherit"
                    />
                </React.Fragment>
            ) : (
                <React.Fragment>
                    <GridActionsCellItem
                        icon={<EditIcon />}
                        label="Edit"
                        className="textPrimary"
                        onClick={() => handleEditClick(props.id)}
                        color="inherit"
                    />
                    <GridActionsCellItem
                        icon={<DeleteIcon />}
                        label="Delete"
                        onClick={() => handleDeleteClick(props.id)}
                        color="inherit"
                    />
                </React.Fragment>
            )}
        </GridActionsCell>
    );
}

const actionsColumn: GridColDef = {
    field: 'actions',
    type: 'actions',
    headerName: 'Actions',
    width: 100,
    cellClassName: 'actions',
    renderCell: (params) => <ActionsCell {...params} />,
};

const getTableColumns = (servingTables: ServingTable[]): Record<TableType, GridColDef[]> => ({
    [TableType.ServingTables]: [
        { field: 'id', headerName: 'ID', width: 70, editable: false },
        { field: 'name', headerName: 'Name', width: 200, editable: true },
        actionsColumn,
    ],
    [TableType.CookItems]: [
        { field: 'id', headerName: 'ID', width: 70, editable: false },
        { field: 'name', headerName: 'Name', width: 200, editable: true },
        actionsColumn,
    ],
    [TableType.CookOrders]: [
        { field: 'id', headerName: 'ID', type: 'number', width: 50, editable: false },
        { field: 'tableId', headerName: 'Table ID', type: 'singleSelect', valueOptions: servingTables.map((table) => table.id), width: 80, editable: true },
        { field: 'notes', headerName: 'Notes', type: 'longText', width: 200, editable: true },
        { field: 'isProcessing', headerName: 'Processing', type: 'boolean', width: 100, editable: true },
        { field: 'isCompleted', headerName: 'Completed', type: 'boolean', width: 100, editable: true },
        { field: 'createdAt', headerName: 'Created At', type: 'dateTime', valueGetter: (value) => value && new Date(value), width: 175, editable: true },
        { field: 'startedAt', headerName: 'Started At', type: 'dateTime', valueGetter: (value) => value && new Date(value), width: 175, editable: true },
        { field: 'completedAt', headerName: 'Completed At', type: 'dateTime', valueGetter: (value) => value && new Date(value), width: 175, editable: true },
        actionsColumn,
    ],
});

const tabTableMap: TableType[] = [TableType.ServingTables, TableType.CookItems, TableType.CookOrders];

export default function CookListCrud() {
    const [value, setValue] = useState(0);
    const [rows, setRows] = React.useState<GridRowsProp>([]);
    const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({});
    const [servingTables, setServingTables] = React.useState<ServingTable[]>([]);

    const activeTable = tabTableMap[value] ?? TableType.ServingTables;
    const columns = getTableColumns(servingTables)[activeTable];

    useEffect(() => {
        if (activeTable === TableType.ServingTables) {
            void getServingTables();
        } else if (activeTable === TableType.CookItems) {
            void getCookItems();
        } else if (activeTable === TableType.CookOrders) {
            void getCookOrders();
        }
    }, [activeTable]);

    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const handleRowEditStop: GridEventListener<'rowEditStop'> = (params, event) => {
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true;
        }
    };

    const actionHandlers = useMemo<ActionHandlers>(
        () => ({
            handleEditClick: (id: GridRowId) => {
                setRowModesModel((prevRowModesModel) => ({
                    ...prevRowModesModel,
                    [id]: { mode: GridRowModes.Edit },
                }));
            },
            handleSaveClick: (id: GridRowId) => {
                setRowModesModel((prevRowModesModel) => ({
                    ...prevRowModesModel,
                    [id]: { mode: GridRowModes.View },
                }));
            },
            handleDeleteClick: (id: GridRowId) => {
                if (activeTable === TableType.ServingTables) {
                    void deleteServingTable(id as number);
                } else if (activeTable === TableType.CookItems) {
                    void deleteCookItem(id as number);
                } else if (activeTable === TableType.CookOrders) {
                    void deleteCookOrder(id as number);
                }
                setRows((prevRows) => prevRows.filter((row) => row.id !== id));
            },
            handleCancelClick: (id: GridRowId) => {
                setRowModesModel((prevRowModesModel) => {
                    return {
                        ...prevRowModesModel,
                        [id]: { mode: GridRowModes.View, ignoreModifications: true },
                    };
                });

                setRows((prevRows) => {
                    const editedRow = prevRows.find((row) => row.id === id);
                    if (editedRow && 'isNew' in editedRow && editedRow.isNew) {
                        return prevRows.filter((row) => row.id !== id);
                    }
                    return prevRows;
                });
            },
        }),
        [activeTable],
    );

    const processServingTableRowUpdate = async (newRow: GridRowModel) => {
        const updatedRow = { ...newRow, isNew: false };

        if (newRow.isNew) {
            const resp = await fetch('api/cooklist/serving_table', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tableName: newRow.name }),
            });
            if (!resp.ok) throw new Error('Create failed');
            const result = await resp.json();
            const created = result.servingTable ?? result.ServingTable ?? result;
            setRows((prev) =>
                prev.map((r) => (r.id === newRow.id ? { ...updatedRow, id: created.id } : r)),
            );
            return { ...updatedRow, id: created.id };
        }

        const resp = await fetch(`api/cooklist/serving_table/${newRow.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableName: newRow.name }),
        });
        if (!resp.ok) throw new Error('Update failed');
        const result = await resp.json();
        const updated = result.servingTable ?? result.ServingTable ?? result;
        setRows((prev) => prev.map((r) => (r.id === newRow.id ? updated : r)));
        return updated;
    };

    const processCookItemRowUpdate = async (newRow: GridRowModel) => {
        const updatedRow = { ...newRow, isNew: false };

        if (newRow.isNew) {
            const resp = await fetch('api/cooklist/cook_item', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemName: newRow.name }),
            });
            if (!resp.ok) throw new Error('Create failed');
            const result = await resp.json();
            const created = result.cookItem ?? result.CookItem ?? result;
            setRows((prev) =>
                prev.map((r) => (r.id === newRow.id ? { ...updatedRow, id: created.id } : r)),
            );
            return { ...updatedRow, id: created.id };
        }

        const resp = await fetch(`api/cooklist/cook_item/${newRow.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemName: newRow.name }),
        });
        if (!resp.ok) throw new Error('Update failed');
        const result = await resp.json();
        const updated = result.cookItem ?? result.CookItem ?? result;
        setRows((prev) => prev.map((r) => (r.id === newRow.id ? updated : r)));
        return updated;
    };

    const processCookOrderRowUpdate = async (newRow: GridRowModel) => {
        const updatedRow = { ...newRow, isNew: false };
        const body = JSON.stringify({
            tableId: newRow.tableId,
            notes: newRow.notes,
            isProcessing: newRow.isProcessing,
            isCompleted: newRow.isCompleted,
            createdAt: newRow.createdAt,
            startedAt: newRow.startedAt,
            completedAt: newRow.completedAt,
        });

        const toCookOrderRow = (order: any, fallback: GridRowModel) => ({
            id: order.id,
            tableId: order.table?.id ?? fallback.tableId,
            notes: order.notes ?? fallback.notes,
            isProcessing: order.isProcessing ?? fallback.isProcessing,
            isCompleted: order.isCompleted ?? fallback.isCompleted,
            createdAt: order.createdAt ?? fallback.createdAt,
            startedAt: order.startedAt ?? fallback.startedAt,
            completedAt: order.completedAt ?? fallback.completedAt,
            isNew: false,
        });

        if (newRow.isNew) {
            const resp = await fetch('api/cooklist/cook_order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
            });
            if (!resp.ok) throw new Error('Create failed');
            const result = await resp.json();
            const createdOrder = result.cookOrder ?? result.CookOrder ?? result;
            const created = toCookOrderRow(createdOrder, updatedRow);
            setRows((prev) => prev.map((r) => (r.id === newRow.id ? created : r)));
            return created;
        }

        const resp = await fetch(`api/cooklist/cook_order/${newRow.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body,
        });
        if (!resp.ok) throw new Error('Update failed');
        const result = await resp.json();
        const updatedOrder = result.cookOrder ?? result.CookOrder ?? result;
        const updated = toCookOrderRow(updatedOrder, updatedRow);
        setRows((prev) => prev.map((r) => (r.id === newRow.id ? updated : r)));
        return updated;
    };

    const processRowUpdate = async (newRow: GridRowModel) => {
        if (activeTable === TableType.ServingTables) {
            return processServingTableRowUpdate(newRow);
        } else if (activeTable === TableType.CookItems) {
            return processCookItemRowUpdate(newRow);
        } else if (activeTable === TableType.CookOrders) {
            return processCookOrderRowUpdate(newRow);
        }
        throw new Error(`Unsupported table type: ${activeTable}`);
    };

    return (
        <Box sx={{ width: '100%', typography: 'body1' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={value}
                    onChange={handleChange}
                    aria-label="data-tabs"
                    textColor="inherit"
                    indicatorColor="secondary"
                    sx={{
                        '& .MuiTab-root': { color: 'text.secondary' },
                        '& .Mui-selected': { color: 'text.primary !important' },
                    }}
                >
                    <Tab label="Service Tables" value={TableType.ServingTables} />
                    <Tab label="Cook Items" value={TableType.CookItems} />
                    <Tab label="Cook Orders" value={TableType.CookOrders} />
                </Tabs>
                <Box
                    sx={{
                        height: 500,
                        width: '100%',
                        '& .actions': {
                            color: 'text.secondary',
                        },
                        '& .textPrimary': {
                            color: 'text.primary',
                        },
                    }}
                >
                    <ActionHandlersContext.Provider value={actionHandlers}>
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            editMode="row"
                            rowModesModel={rowModesModel}
                            onRowModesModelChange={setRowModesModel}
                            onRowEditStop={handleRowEditStop}
                            processRowUpdate={processRowUpdate}
                            showToolbar
                            slots={{ toolbar: EditToolbar as GridSlots['toolbar'] }}
                            slotProps={{
                                toolbar: { setRows, setRowModesModel },
                            }}
                        />
                    </ActionHandlersContext.Provider>
                </Box>
                <TabPanel value={value} index={0} />
            </Box>
        </Box>
    );

    async function getServingTables() {
        const response = await fetch('api/cooklist/serving_tables');
        if (!response.ok) return;
        const data: ServingTable[] = await response.json();
        setServingTables(data);
        setRows(data.map((t) => ({ id: t.id, name: t.name, isNew: false })));
    }

    async function deleteServingTable(id: number) {
        const response = await fetch(`api/cooklist/serving_table/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) return;
        setRows((prev) => prev.filter((t) => t.id !== id));
    }

    async function getCookItems() {
        const response = await fetch('api/cooklist/cook_items');
        if (!response.ok) return;
        const data: CookItem[] = await response.json();
        setRows(data.map((i) => ({ id: i.id, name: i.name, isNew: false })));
    }

    async function deleteCookItem(id: number) {
        const response = await fetch(`api/cooklist/cook_item/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) return;
        setRows((prev) => prev.filter((i) => i.id !== id));
    }

    async function getCookOrders() {
        const response = await fetch('api/cooklist/cook_orders');
        if (!response.ok) return;
        const data = await response.json();
        setRows(data.map((o: any) => ({
            id: o.id,
            tableId: o.table?.id,
            notes: o.notes,
            isProcessing: o.isProcessing,
            isCompleted: o.isCompleted,
            createdAt: o.createdAt,
            startedAt: o.startedAt,
            completedAt: o.completedAt,
            isNew: false
        })));
    }

    async function deleteCookOrder(id: number) {
        const response = await fetch(`api/cooklist/cook_order/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) return;
        setRows((prev) => prev.filter((o) => o.id !== id));
    }
}
