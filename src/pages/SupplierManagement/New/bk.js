
  const [supplierTypeRows, setSupplierTypeRows] = useState([]);
  const [supplierTypeRowModesModel, setSupplierTypeRowModesModel] = useState({});
  const supplierTypeHeaderColumn = [
    { field: 'id', headerName: t('supplierManagement.column.types.id') },
    {
      field: 'typeId',
      headerName: t('supplierManagement.column.types.id'),
      align: 'center',
      headerAlign: 'center',
      editable: false,
      width: 200
    },
    {
      field: 'typeName',
      headerName: t('supplierManagement.column.types.name'),
      align: 'center',
      headerAlign: 'center',
      editable: true,
      flex: 1,
      type: 'singleSelect',
      valueOptions: supplierTypes?.map((type: SupplierType) => type.typeName)
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      cellClassName: 'actions',
      getActions: ({ id }) => {
        const isInEditMode = supplierTypeRowModesModel[id]?.mode === GridRowModes.Edit;
        if (isInEditMode) {
          return [
            <GridActionsCellItem
              icon={<Save />}
              label="Save"
              sx={{
                color: 'primary.main'
              }}
              onClick={handleSaveSupplierTypeClick(id)}
            />,
            <GridActionsCellItem
              icon={<Cancel />}
              label="Cancel"
              className="textPrimary"
              onClick={handleCancelSupplierTypeClick(id)}
              color="inherit"
            />
          ];
        }
        return [
          <GridActionsCellItem
            icon={<Delete />}
            label="Delete"
            onClick={handleDeleteSupplierTypeClick(id)}
            color="inherit"
          />
        ];
      }
    }
  ];

  const processRowSupplierTypeUpdate = (newRow) => {
    const selectType = supplierTypes?.filter(
      (supplierType) => supplierType.typeName === newRow.typeName
    );
    const updatedRow = {
      ...newRow,
      isNew: false,
      typeName: selectType[0].typeIcon + ' ' + selectType[0].typeName,
      typeId: selectType[0].typeId
    };
    setSupplierTypeRows(supplierTypeRows.map((row) => (row.id === newRow.id ? updatedRow : row)));
    return updatedRow;
  };

  const handleSaveSupplierTypeClick = (id) => () => {
    setSupplierTypeRowModesModel({
      ...supplierTypeRowModesModel,
      [id]: { mode: GridRowModes.View }
    });
  };

  const handleDeleteSupplierTypeClick = (id) => () => {
    setSupplierTypeRows(supplierTypeRows.filter((row) => row.id !== id));
  };

  const handleCancelSupplierTypeClick = (id) => () => {
    setSupplierTypeRowModesModel({
      ...supplierTypeRowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true }
    });

    const editedRow = supplierTypeRows.find((row) => row.id === id);
    if (editedRow.isNew) {
      setSupplierTypeRows(supplierTypeRows.filter((row) => row.id !== id));
    }
  };

  const handleSupplierTypeRowModesModelChange = (newRowModesModel) => {
    setSupplierTypeRowModesModel(newRowModesModel);
  };

  const handleSupplierTypeRowEditStop = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  function SupplierTypeEditToolbar(props) {
    const { setSupplierTypeRows, setSupplierTypeRowModesModel } = props;

    const handleClick = () => {
      const id = uuidv4();
      setSupplierTypeRows((oldRows) => [
        ...oldRows,
        {
          id,
          typeName: '',
          updatedDate: '',
          updatedBy: getUserId(),
          isNew: true
        }
      ]);
      setSupplierTypeRowModesModel((oldModel) => ({
        ...oldModel,
        [id]: { mode: GridRowModes.Edit, fieldToFocus: 'typeName' }
      }));
    };
    return (
      <GridToolbarContainer>
        <GridTextField item xs={12} sm={12} style={{ textAlign: 'right' }}>
          <Button
            color="primary"
            variant="contained"
            startIcon={<PlaylistAdd />}
            onClick={handleClick}>
            {t('supplierManagement.action.addType')}
          </Button>
        </GridTextField>
      </GridToolbarContainer>
    );
  }

  const [accountRows, setAccountRows] = useState([]);
  const [accountRowModesModel, setAccountRowModesModel] = useState({});
  const accountHeaderColumn = [
    { field: 'id', headerName: 'id' },
    // {
    //   field: 'bankName',
    //   headerName: t('supplierManagement.column.account.bankName'),
    //   align: 'center',
    //   headerAlign: 'center',
    //   editable: true,
    //   width: 200,
    //   type: 'singleSelect',
    //   valueOptions: bankNames?.map((bank: SystemConfig) => bank.nameTh)
    // },
    {
      field: 'bankName',
      headerName: t('supplierManagement.column.account.bankName'),
      align: 'center',
      headerAlign: 'center',
      editable: true,
      width: 400,
      renderEditCell: (params) => (
        <BankSelectEditComponent
          {...params}
          bankOptions={bankNames?.map((bank) => ({
            icon: bankLists[bank.code].icon,
            nameTh: bank.nameTh,
            code: bank.code
          }))}
        />
      ),
      renderCell: (params) => {
        const [iconUrl, bankName] = (params.value || '').split('||');
        return (
          <Box display="flex" alignItems="center">
            {iconUrl && (
              <img src={iconUrl} alt={bankName} width={24} height={24} style={{ marginRight: 8 }} />
            )}
            {bankName}
          </Box>
        );
      }
    },
    {
      field: 'accountName',
      headerName: t('supplierManagement.column.account.name'),
      align: 'center',
      headerAlign: 'center',
      editable: true,
      flex: 0.5
    },
    {
      field: 'accountNo',
      headerName: t('supplierManagement.column.account.number'),
      align: 'center',
      headerAlign: 'center',
      flex: 0.5,
      editable: true
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      cellClassName: 'actions',
      getActions: ({ id }) => {
        const isInEditMode = accountRowModesModel[id]?.mode === GridRowModes.Edit;
        if (isInEditMode) {
          return [
            <GridActionsCellItem
              icon={<Save />}
              label="Save"
              sx={{
                color: 'primary.main'
              }}
              onClick={handleSaveAccountClick(id)}
            />,
            <GridActionsCellItem
              icon={<Cancel />}
              label="Cancel"
              className="textPrimary"
              onClick={handleCancelAccountClick(id)}
              color="inherit"
            />
          ];
        }
        return [
          <GridActionsCellItem
            icon={<Delete />}
            label="Delete"
            onClick={handleDeleteAccountClick(id)}
            color="inherit"
          />
        ];
      }
    }
  ];
  const processRowAccountUpdate = (newRow) => {
    const selectedBank = bankNames?.filter((bank) => bank.nameTh === newRow.bankName);
    const updatedRow = {
      ...newRow,
      // bankCode: selectedBank[0].code,
      isNew: false
    };
    setAccountRows(accountRows.map((row) => (row.id === newRow.id ? updatedRow : row)));
    return updatedRow;
  };

  const handleSaveAccountClick = (id) => () => {
    setAccountRowModesModel({
      ...accountRowModesModel,
      [id]: { mode: GridRowModes.View }
    });
  };

  const handleDeleteAccountClick = (id) => () => {
    setAccountRows(accountRows.filter((row) => row.id !== id));
  };

  const handleCancelAccountClick = (id) => () => {
    setAccountRowModesModel({
      ...accountRowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true }
    });

    const editedRow = accountRows.find((row) => row.id === id);
    if (editedRow.isNew) {
      setAccountRows(accountRows.filter((row) => row.id !== id));
    }
  };

  const handleAccountRowModesModelChange = (newRowModesModel) => {
    setAccountRowModesModel(newRowModesModel);
  };

  const handleAccountRowEditStop = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  function AccountEditToolbar(props) {
    const { setAccountRows, setAccountRowModesModel } = props;

    const handleClick = () => {
      const id = uuidv4();
      setAccountRows((oldRows) => [
        ...oldRows,
        {
          id,
          typeName: '',
          updatedDate: '',
          updatedBy: getUserId(),
          isNew: true
        }
      ]);
      setAccountRowModesModel((oldModel) => ({
        ...oldModel,
        [id]: { mode: GridRowModes.Edit, fieldToFocus: 'typeName' }
      }));
    };
    return (
      <GridToolbarContainer>
        <GridTextField item xs={12} sm={12} style={{ textAlign: 'right' }}>
          <Button
            color="primary"
            variant="contained"
            startIcon={<PlaylistAdd />}
            onClick={handleClick}
            disabled={accountRows.length > 1}>
            {t('supplierManagement.action.addAccount')}
          </Button>
        </GridTextField>
      </GridToolbarContainer>
    );
  }

  function CustomNoRowsOverlay(text: string) {
    return (
      <Box sx={{ mt: 2 }} style={{ textAlign: 'center', paddingTop: '20px' }}>
        {text}
      </Box>
    );
  }

      <Wrapper>
        <Grid container spacing={1}>
          <GridTextField item xs={12} sm={12}>
            <Typography>{t('supplierManagement.column.types.title')}</Typography>
          </GridTextField>
          <DataGrid
            rows={supplierTypeRows}
            columnVisibilityModel={{ id: false }}
            columns={supplierTypeHeaderColumn}
            autoHeight
            disableColumnMenu
            disableRowSelectionOnClick
            editMode="row"
            rowModesModel={supplierTypeRowModesModel}
            onRowModesModelChange={handleSupplierTypeRowModesModelChange}
            onRowEditStop={handleSupplierTypeRowEditStop}
            processRowUpdate={processRowSupplierTypeUpdate}
            slots={{
              toolbar: SupplierTypeEditToolbar,
              noRowsOverlay: () => CustomNoRowsOverlay('ยังไม่ได้ระบุประเภทคู่ค้า')
            }}
            slotProps={{
              toolbar: { setSupplierTypeRows, setSupplierTypeRowModesModel }
            }}
            hideFooterPagination={true}
          />
        </Grid>
      </Wrapper>
      <Grid container spacing={1}>
          <GridTextField item xs={12} sm={12}>
            <Typography>{t('supplierManagement.column.account.title')}</Typography>
          </GridTextField>
          <DataGrid
            rows={accountRows}
            columnVisibilityModel={{ id: false }}
            columns={accountHeaderColumn}
            autoHeight
            disableColumnMenu
            disableRowSelectionOnClick
            editMode="row"
            rowModesModel={accountRowModesModel}
            onRowModesModelChange={handleAccountRowModesModelChange}
            onRowEditStop={handleAccountRowEditStop}
            processRowUpdate={processRowAccountUpdate}
            slots={{
              toolbar: AccountEditToolbar,
              noRowsOverlay: () => CustomNoRowsOverlay('ยังไม่ได้ระบุบัญชี')
            }}
            slotProps={{
              toolbar: { setAccountRows, setAccountRowModesModel }
            }}
            hideFooterPagination={true}
          />
        </Grid>
        <br />
        