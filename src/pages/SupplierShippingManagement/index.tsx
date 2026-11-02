import {
  Add,
  ArrowForward,
  Clear,
  DirectionsBoat,
  ExpandLess,
  ExpandMore,
  LocalShipping,
  Place,
  Search
} from '@mui/icons-material';
import {
  Chip,
  CircularProgress,
  Button,
  Box,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import PageTitle from 'components/PageTitle';
import { GridSearchSection, TextLineClamp, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { getCountry } from 'services/Address/address-api';
import { Country } from 'services/Address/address-type';
import { getSystemConfig } from 'services/Config/config-api';
import { GROUP_CODE, SystemConfig } from 'services/Config/config-type';
import {
  searchShippingLocations,
  searchShippingRoutes,
  searchSupplierShippingsV2
} from 'services/Supplier/supplier-api';
import {
  ShippingLocation,
  ShippingRoute,
  SupplierShippingRoute
} from 'services/Supplier/supplier-type';
import CreateShippingLocationDialog from './CreateShippingLocationDialog';
import CreateShippingRouteDialog from './CreateShippingRouteDialog';
import CreateSupplierShippingDialog from './CreateSupplierShippingDialog';

export default function SupplierShippingManagement(): JSX.Element {
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [locationKeyword, setLocationKeyword] = useState('');
  const [locationType, setLocationType] = useState('');
  const [locationSearchParams, setLocationSearchParams] = useState<{
    keyword?: string;
    locationType?: string;
  }>({});
  const [locationPage, setLocationPage] = useState(0);
  const [locationRowsPerPage, setLocationRowsPerPage] = useState(10);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [routeDialogOpen, setRouteDialogOpen] = useState(false);
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [routeKeyword, setRouteKeyword] = useState('');
  const [routeSearchParams, setRouteSearchParams] = useState<{ keyword?: string }>({});
  const [routePage, setRoutePage] = useState(0);
  const [routeRowsPerPage, setRouteRowsPerPage] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [method, setMethod] = useState('ALL');
  const [expandedShippingIds, setExpandedShippingIds] = useState<number[]>([]);
  const [searchParams, setSearchParams] = useState<{
    keyword?: string;
    shippingMethod?: string;
  }>({});
  const routeQuery = useQuery<SupplierShippingRoute[]>(
    ['supplier-shipping-management-v2', searchParams],
    () => searchSupplierShippingsV2(searchParams),
    { refetchOnWindowFocus: false }
  );
  const routeData = routeQuery.data || [];
  const isFetching = routeQuery.isFetching;
  const isError = routeQuery.isError;
  const locationQuery = useQuery<ShippingLocation[]>(
    ['shipping-location-management-v2', locationSearchParams],
    () => searchShippingLocations(locationSearchParams),
    { enabled: activeTab === 1 || activeTab === 2, refetchOnWindowFocus: false }
  );
  const locationTypeQuery = useQuery<SystemConfig[]>(
    ['shipping-location-types', GROUP_CODE.LOCATION_TYPE],
    () => getSystemConfig(GROUP_CODE.LOCATION_TYPE),
    { enabled: activeTab === 2, refetchOnWindowFocus: false }
  );
  const countryQuery = useQuery<Country[]>(['shipping-location-countries'], getCountry, {
    enabled: activeTab === 2,
    refetchOnWindowFocus: false
  });
  const countries = countryQuery.data || [];
  const locationTypes = locationTypeQuery.data || [];
  const shippingRouteQuery = useQuery<ShippingRoute[]>(
    ['shipping-route-management-v2', routeSearchParams],
    () => searchShippingRoutes(routeSearchParams),
    { enabled: activeTab === 1 || shippingDialogOpen, refetchOnWindowFocus: false }
  );
  const shippingRoutes = shippingRouteQuery.data || [];
  const pagedRoutes = shippingRoutes.slice(
    routePage * routeRowsPerPage,
    routePage * routeRowsPerPage + routeRowsPerPage
  );
  const locations = locationQuery.data || [];
  const pagedLocations = locations.slice(
    locationPage * locationRowsPerPage,
    locationPage * locationRowsPerPage + locationRowsPerPage
  );
  const groupedShippings = useMemo(() => {
    const groups = new Map<
      number,
      { shipping: SupplierShippingRoute; routes: SupplierShippingRoute[] }
    >();
    routeData.forEach((route) => {
      const existing = groups.get(route.supplierShippingId);
      if (existing) {
        existing.routes.push(route);
      } else {
        groups.set(route.supplierShippingId, { shipping: route, routes: [route] });
      }
    });
    return Array.from(groups.values()).sort(
      (a, b) => a.shipping.supplierShippingId - b.shipping.supplierShippingId
    );
  }, [routeData]);
  const pagedRows = groupedShippings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Page>
      <PageTitle title="จัดการข้อมูลขนส่ง" />
      <Wrapper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            aria-label="supplier shipping management tabs">
            <Tab label="ขนส่ง" />
            <Tab label="เส้นทาง" />
            <Tab label="ท่าเรือ" />
          </Tabs>
        </Box>
        {activeTab === 0 ? (
          <>
            <GridSearchSection container spacing={1.5} component={Paper} elevation={0}>
              <Grid item xs={12} sm={6} md={7}>
                <TextField
                  fullWidth
                  label="ค้นหา"
                  placeholder="ชื่อขนส่ง, ต้นทาง, ปลายทาง หรือรหัสรถ"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  InputProps={{ startAdornment: <Search color="action" sx={{ mr: 1 }} /> }}
                />
              </Grid>
              <Grid item xs={12} sm={3} md={2.5}>
                <TextField
                  select
                  fullWidth
                  label="วิธีขนส่ง"
                  value={method}
                  onChange={(event) => setMethod(event.target.value)}>
                  <MenuItem value="ALL">ทั้งหมด</MenuItem>
                  <MenuItem value="LAND">LAND</MenuItem>
                  <MenuItem value="SEA">SEA</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3} md={2.5}>
                <Stack
                  direction="row"
                  justifyContent="flex-end"
                  alignItems="center"
                  spacing={1}
                  sx={{ height: '100%' }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<Add />}
                    sx={{ minWidth: 100 }}
                    onClick={() => setShippingDialogOpen(true)}>
                    สร้าง
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Search />}
                    sx={{ minWidth: 100 }}
                    onClick={() => {
                      setPage(0);
                      setExpandedShippingIds([]);
                      setSearchParams({
                        keyword: keyword.trim() || undefined,
                        shippingMethod: method === 'ALL' ? undefined : method
                      });
                    }}>
                    ค้นหา
                  </Button>
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<Clear />}
                    sx={{ minWidth: 100 }}
                    onClick={() => {
                      setKeyword('');
                      setMethod('ALL');
                      setPage(0);
                      setExpandedShippingIds([]);
                      setSearchParams({});
                    }}>
                    ล้าง
                  </Button>
                </Stack>
              </Grid>
            </GridSearchSection>

            <GridSearchSection container sx={{ mt: 2 }}>
              <Grid item xs={12}>
                <TableContainer component={Paper}>
                  <Table id="supplier_shipping_list___table" size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell align="center">ชื่อขนส่ง</TableCell>
                        <TableCell align="center">วิธีขนส่ง</TableCell>
                        <TableCell align="center">จำนวนเส้นทาง</TableCell>
                        <TableCell align="center">รหัสรถ</TableCell>
                        <TableCell align="center">เส้นทาง</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {isFetching ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <CircularProgress size={28} />
                          </TableCell>
                        </TableRow>
                      ) : isError ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            ไม่สามารถโหลดข้อมูล Supplier Shipping ได้
                          </TableCell>
                        </TableRow>
                      ) : pagedRows.length ? (
                        pagedRows.flatMap(({ shipping, routes }) => {
                          const expanded = expandedShippingIds.includes(
                            shipping.supplierShippingId
                          );
                          return [
                            <TableRow hover key={`shipping-${shipping.supplierShippingId}`}>
                              <TableCell>
                                <Stack direction="row" spacing={0.75} alignItems="center">
                                  <TextLineClamp>
                                    {shipping.supplierShippingName || '-'}
                                  </TextLineClamp>
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    label={`id:#${shipping.supplierShippingId}`}
                                  />
                                </Stack>
                              </TableCell>
                              <TableCell align="center">
                                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                  <Chip
                                    size="small"
                                    icon={
                                      shipping.shippingMethod === 'SEA' ? (
                                        <DirectionsBoat />
                                      ) : (
                                        <LocalShipping />
                                      )
                                    }
                                    label={shipping.shippingMethod || '-'}
                                  />
                                  {shipping.shippingMode ? (
                                    <Chip
                                      size="small"
                                      variant="outlined"
                                      label={shipping.shippingMode}
                                    />
                                  ) : null}
                                </Stack>
                              </TableCell>
                              <TableCell align="center">{routes.length}</TableCell>
                              <TableCell align="center">{shipping.carCode || '-'}</TableCell>
                              <TableCell align="center">
                                <IconButton
                                  size="small"
                                  aria-label={expanded ? 'ซ่อนเส้นทาง' : 'แสดงเส้นทาง'}
                                  onClick={() =>
                                    setExpandedShippingIds((current) =>
                                      expanded
                                        ? current.filter((id) => id !== shipping.supplierShippingId)
                                        : [...current, shipping.supplierShippingId]
                                    )
                                  }>
                                  {expanded ? <ExpandLess /> : <ExpandMore />}
                                </IconButton>
                              </TableCell>
                            </TableRow>,
                            ...(expanded
                              ? [
                                <TableRow key={`shipping-routes-${shipping.supplierShippingId}`}>
                                  <TableCell colSpan={5} sx={{ bgcolor: 'action.hover', py: 1 }}>
                                    <Stack spacing={0.75} sx={{ pl: 6 }}>
                                      {routes.map((route) => (
                                        <Stack
                                          key={route.id}
                                          direction="row"
                                          spacing={1}
                                          alignItems="center">
                                          {/* <Typography variant="body2">
                                            {route.routeCode || '-'}
                                          </Typography> */}
                                          <Place color="action" fontSize="small" />
                                          <Typography variant="body2">
                                            {route.originLocationName || '-'}
                                          </Typography>
                                          <ArrowForward color="action" fontSize="small" />
                                          <Typography variant="body2">
                                            {route.destinationLocationName || '-'}
                                          </Typography>
                                        </Stack>
                                      ))}
                                    </Stack>
                                  </TableCell>
                                </TableRow>
                              ]
                              : [])
                          ];
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            ไม่พบข้อมูล Supplier Shipping
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={groupedShippings.length}
                  page={page}
                  onPageChange={(_, nextPage) => setPage(nextPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(event) => {
                    setRowsPerPage(Number(event.target.value));
                    setPage(0);
                  }}
                  rowsPerPageOptions={[10, 25, 50]}
                  labelRowsPerPage="จำนวนต่อหน้า"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count}`}
                />
              </Grid>
            </GridSearchSection>
          </>
        ) : activeTab === 1 ? (
          <>
            <GridSearchSection container spacing={1.5} component={Paper} elevation={0}>
              <Grid item xs={12} sm={6} md={7}>
                <TextField
                  fullWidth
                  label="ค้นหาเส้นทาง"
                  placeholder="Route code, ต้นทาง หรือปลายทาง"
                  value={routeKeyword}
                  onChange={(event) => setRouteKeyword(event.target.value)}
                  InputProps={{ startAdornment: <Search color="action" sx={{ mr: 1 }} /> }}
                />
              </Grid>
              <Grid item xs={12} sm={3} md={2.5} />
              <Grid item xs={12} sm={3} md={2.5}>
                <Stack
                  direction="row"
                  justifyContent="flex-end"
                  alignItems="center"
                  spacing={1}
                  sx={{ height: '100%' }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<Add />}
                    sx={{ minWidth: 100 }}
                    onClick={() => setRouteDialogOpen(true)}>
                    สร้าง
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Search />}
                    sx={{ minWidth: 100 }}
                    onClick={() => {
                      setRoutePage(0);
                      setRouteSearchParams({ keyword: routeKeyword.trim() || undefined });
                    }}>
                    ค้นหา
                  </Button>
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<Clear />}
                    sx={{ minWidth: 100 }}
                    onClick={() => {
                      setRouteKeyword('');
                      setRoutePage(0);
                      setRouteSearchParams({});
                    }}>
                    ล้าง
                  </Button>
                </Stack>
              </Grid>
            </GridSearchSection>
            <GridSearchSection container sx={{ mt: 2 }}>
              <Grid item xs={12}>
                <TableContainer component={Paper}>
                  <Table id="shipping_route_list___table" size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell align="center">รหัส</TableCell>
                        <TableCell align="center">Route code</TableCell>
                        <TableCell align="center">เส้นทาง</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {shippingRouteQuery.isFetching ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            <CircularProgress size={28} />
                          </TableCell>
                        </TableRow>
                      ) : shippingRouteQuery.isError ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            ไม่สามารถโหลดข้อมูลเส้นทางได้
                          </TableCell>
                        </TableRow>
                      ) : pagedRoutes.length ? (
                        pagedRoutes.map((route) => (
                          <TableRow hover key={route.id}>
                            <TableCell align="center">{route.id}</TableCell>
                            <TableCell align="center">{route.routeCode || '-'}</TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={1} alignItems="center">
                                <TextLineClamp>{route.originLocationName || '-'}</TextLineClamp>
                                <ArrowForward color="action" fontSize="small" />
                                <TextLineClamp>
                                  {route.destinationLocationName || '-'}
                                </TextLineClamp>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            ไม่พบข้อมูลเส้นทาง
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <TablePagination
                    component="div"
                    count={shippingRoutes.length}
                    page={routePage}
                    onPageChange={(_, nextPage) => setRoutePage(nextPage)}
                    rowsPerPage={routeRowsPerPage}
                    onRowsPerPageChange={(event) => {
                      setRouteRowsPerPage(Number(event.target.value));
                      setRoutePage(0);
                    }}
                    rowsPerPageOptions={[10, 25, 50]}
                    labelRowsPerPage="จำนวนต่อหน้า"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count}`}
                  />
                </TableContainer>
              </Grid>
            </GridSearchSection>
          </>
        ) : activeTab === 2 ? (
          <>
            <GridSearchSection container spacing={1.5} component={Paper} elevation={0}>
              <Grid item xs={12} sm={6} md={7}>
                <TextField
                  fullWidth
                  label="ค้นหาท่าเรือ"
                  placeholder="รหัส, ชื่อ, ประเทศ หรือจังหวัด"
                  value={locationKeyword}
                  onChange={(event) => setLocationKeyword(event.target.value)}
                  InputProps={{ startAdornment: <Search color="action" sx={{ mr: 1 }} /> }}
                />
              </Grid>
              <Grid item xs={12} sm={3} md={2.5}>
                <TextField
                  select
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  label="ประเภทสถานที่"
                  value={locationType}
                  onChange={(event) => setLocationType(event.target.value)}>
                  <MenuItem value="">ทั้งหมด</MenuItem>
                  {locationTypes.map((config) => (
                    <MenuItem key={config.code} value={config.code}>
                      {config.nameTh || config.nameEn || config.code}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3} md={2.5}>
                <Stack
                  direction="row"
                  justifyContent="flex-end"
                  alignItems="center"
                  spacing={1}
                  sx={{ height: '100%' }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<Add />}
                    sx={{ minWidth: 100 }}
                    onClick={() => setLocationDialogOpen(true)}>
                    สร้าง
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Search />}
                    sx={{ minWidth: 100 }}
                    onClick={() => {
                      setLocationPage(0);
                      setLocationSearchParams({
                        keyword: locationKeyword.trim() || undefined,
                        locationType: locationType || undefined
                      });
                    }}>
                    ค้นหา
                  </Button>
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<Clear />}
                    sx={{ minWidth: 100 }}
                    onClick={() => {
                      setLocationKeyword('');
                      setLocationType('');
                      setLocationPage(0);
                      setLocationSearchParams({});
                    }}>
                    ล้าง
                  </Button>
                </Stack>
              </Grid>
            </GridSearchSection>
            <GridSearchSection container sx={{ mt: 2 }}>
              <Grid item xs={12}>
                <TableContainer component={Paper}>
                  <Table id="shipping_location_list___table" size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Code</TableCell>
                        <TableCell>ชื่อท่าเรือ/สถานที่</TableCell>
                        <TableCell>ประเภท</TableCell>
                        <TableCell>ประเทศ</TableCell>
                        <TableCell>จังหวัด</TableCell>
                        <TableCell>ที่อยู่</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {locationQuery.isFetching ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <CircularProgress size={28} />
                          </TableCell>
                        </TableRow>
                      ) : locationQuery.isError ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            ไม่สามารถโหลดข้อมูลท่าเรือได้
                          </TableCell>
                        </TableRow>
                      ) : pagedLocations.length ? (
                        pagedLocations.map((location) => (
                          <TableRow hover key={location.id}>
                            <TableCell>
                              <Stack direction="row" spacing={0.75} alignItems="center">
                                <span>{location.code || '-'}</span>
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  label={`id:#${location.id}`}
                                />
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <TextLineClamp>{location.name}</TextLineClamp>
                            </TableCell>
                            <TableCell>
                              {location.locationType?.nameTh ||
                                location.locationType?.nameEn ||
                                location.locationType?.code ||
                                '-'}
                            </TableCell>
                            <TableCell>{location.countryCode || '-'}</TableCell>
                            <TableCell>{location.province || '-'}</TableCell>
                            <TableCell>
                              <TextLineClamp>{location.address || '-'}</TextLineClamp>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            ไม่พบข้อมูลท่าเรือ
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <TablePagination
                    component="div"
                    count={locations.length}
                    page={locationPage}
                    onPageChange={(_, nextPage) => setLocationPage(nextPage)}
                    rowsPerPage={locationRowsPerPage}
                    onRowsPerPageChange={(event) => {
                      setLocationRowsPerPage(Number(event.target.value));
                      setLocationPage(0);
                    }}
                    rowsPerPageOptions={[10, 25, 50]}
                    labelRowsPerPage="จำนวนต่อหน้า"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count}`}
                  />
                </TableContainer>
              </Grid>
            </GridSearchSection>
          </>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {activeTab === 1 ? 'ส่วนจัดการเส้นทางขนส่ง' : 'ส่วนจัดการท่าเรือและสถานที่ขนส่ง'}
            </Typography>
          </Paper>
        )}
      </Wrapper>
      <CreateShippingLocationDialog
        open={locationDialogOpen}
        countries={countries}
        locationTypes={locationTypes}
        onClose={() => setLocationDialogOpen(false)}
        onCreated={() => locationQuery.refetch()}
      />
      <CreateShippingRouteDialog
        open={routeDialogOpen}
        locations={locations}
        onClose={() => setRouteDialogOpen(false)}
        onCreated={() => shippingRouteQuery.refetch()}
      />
      <CreateSupplierShippingDialog
        open={shippingDialogOpen}
        routes={shippingRoutes}
        onClose={() => setShippingDialogOpen(false)}
        onCreated={() => routeQuery.refetch()}
      />
    </Page>
  );
}
