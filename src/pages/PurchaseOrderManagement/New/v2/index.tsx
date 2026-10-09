import { ArrowBackIos, AssignmentTurnedIn, ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Typography
} from '@mui/material';
import ConfirmDialog from 'components/ConfirmDialog';
import LoadingDialog from 'components/LoadingDialog';
import PageTitle from 'components/PageTitle';
import { Page } from 'layout/LayoutRoute';
import { ReactElement, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';
import {
  createPurchaseOrder,
  updatePurchaseOrder
} from 'services/PurchaseOrder/purchase-order-api';
import { getSalesOrderV1 } from 'services/SaleOrder/sale-order-api';
import { SalesOrderV1 } from 'services/SaleOrder/sale-order-type';
import { getShippingMethodLabel } from 'utils/shipping';
import SupplierPurchaseOrderForm, { PurchaseOrderSectionData } from './SupplierPurchaseOrderForm';
import { groupSalesOrderBySupplier } from './supplierGroups';

interface ConfirmedPurchaseOrderSection extends PurchaseOrderSectionData {
  source: SalesOrderV1;
}

export default function NewPurchaseOrder(): ReactElement {
  const { salesOrderId } = useParams<{ salesOrderId: string }>();
  const history = useHistory();
  const [createdOrders, setCreatedOrders] = useState<Record<string, { purchaseNo: string }>>({});
  const [confirmedSections, setConfirmedSections] = useState<
    Record<string, ConfirmedPurchaseOrderSection>
  >({});
  const [sectionErrors, setSectionErrors] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [activeSectionLabel, setActiveSectionLabel] = useState('');
  const submitInProgress = useRef(false);
  const {
    data: salesOrder,
    isFetching,
    isError
  } = useQuery(
    ['purchase-order-create-v2-sales-order', salesOrderId],
    () => getSalesOrderV1(salesOrderId),
    { enabled: Boolean(salesOrderId), refetchOnWindowFocus: false }
  );
  const supplierGroups = useMemo(
    () => (salesOrder ? groupSalesOrderBySupplier(salesOrder) : []),
    [salesOrder]
  );
  const sections = useMemo(
    () =>
      supplierGroups.flatMap((group) =>
        group.shippingGroups.map((shippingGroup) => ({
          ...shippingGroup,
          key: `${salesOrderId}:${group.supplierId}:${
            shippingGroup.shippingLocked ? shippingGroup.shippingMethod || 'UNRESOLVED' : 'SUPPLIER'
          }`,
          label: shippingGroup.shippingLocked
            ? `${group.supplierName} / ${getShippingMethodLabel(
                shippingGroup.shippingMethod,
                'ไม่พบการขนส่ง'
              )}`
            : group.supplierName,
          supplierId: group.supplierId
        }))
      ),
    [salesOrderId, supplierGroups]
  );
  const missingSupplierItems = (salesOrder?.items || []).filter((item) => !item.supplier?.id);
  const pendingSections = sections.filter((section) => !createdOrders[section.key]);
  const confirmedCount = sections.filter(
    (section) =>
      Boolean(createdOrders[section.key]) ||
      confirmedSections[section.key]?.source === section.salesOrder
  ).length;
  const canCreate =
    sections.length > 0 &&
    pendingSections.length > 0 &&
    confirmedCount === sections.length &&
    !missingSupplierItems.length &&
    sections.every((section) => !section.shippingLocked || Boolean(section.shippingMethod)) &&
    !isFetching &&
    !isError;

  const clearConfirmation = (key: string) => {
    setConfirmedSections((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
    setSectionErrors((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  const handleCreateAll = async () => {
    if (submitInProgress.current || !canCreate) return;
    submitInProgress.current = true;
    setIsCreating(true);
    setIsConfirmOpen(false);
    const queue = pendingSections.map((section) => ({
      ...section,
      data: confirmedSections[section.key]
    }));
    try {
      for (const section of queue) {
        setActiveSectionLabel(section.label);
        setSectionErrors((previous) => {
          const next = { ...previous };
          delete next[section.key];
          return next;
        });
        const { request, attachments } = section.data;
        try {
          const response = await toast.promise(createPurchaseOrder(request, attachments), {
            loading: `กำลังสร้างใบสั่งซื้อ ${section.label}`,
            success: `สร้างใบสั่งซื้อ ${section.label} สำเร็จ`,
            error: `สร้างใบสั่งซื้อ ${section.label} ไม่สำเร็จ`
          });
          // Record the successful creation before the secondary remark update, so retries skip it.
          setCreatedOrders((previous) => ({
            ...previous,
            [section.key]: { purchaseNo: response.purchaseOrderNo }
          }));
          try {
            await toast.promise(
              updatePurchaseOrder(response.purchaseOrderNo, {
                docDate: request.docDate || null,
                productionLeadTimeDay: request.productionLeadTimeDay ?? null,
                shippingLeadTimeDay: request.shippingLeadTimeDay ?? null,
                remark: [response.purchaseOrderNo, request.remark?.trim()]
                  .filter(Boolean)
                  .join('\n')
              }),
              {
                loading: 'กำลังอัปเดตหมายเหตุใบสั่งซื้อ',
                success: 'อัปเดตหมายเหตุใบสั่งซื้อสำเร็จ',
                error: 'สร้างใบสั่งซื้อแล้ว แต่ไม่สามารถอัปเดตหมายเหตุได้'
              }
            );
          } catch (error) {
            console.error('Cannot update purchase order remark', error);
          }
        } catch (error) {
          console.error('Cannot create purchase order', error);
          setSectionErrors((previous) => ({
            ...previous,
            [section.key]:
              'สร้างใบสั่งซื้อไม่สำเร็จ สามารถแก้ไขข้อมูลหรือกดสร้างใบสั่งซื้อเพื่อลองใหม่ได้'
          }));
        }
      }
    } finally {
      submitInProgress.current = false;
      setIsCreating(false);
      setActiveSectionLabel('');
    }
  };

  return (
    <Page>
      <LoadingDialog open={isFetching || isCreating} />
      <PageTitle title="สร้างใบสั่งซื้อ" />
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button
          variant="contained"
          className="btn-cool-grey"
          startIcon={<ArrowBackIos />}
          disabled={isCreating}
          onClick={() => history.push(ROUTE_PATHS.SALE_ORDER_DETAIL.replace(':id', salesOrderId))}>
          กลับ
        </Button>
      </Stack>
      {isError ? <Alert severity="error">ไม่สามารถโหลดข้อมูลใบยืนยันสั่งซื้อได้</Alert> : null}
      {missingSupplierItems.length ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          รายการที่ยังไม่มี Supplier:{' '}
          {missingSupplierItems.map((item) => item.name || `รายการที่ ${item.lineNo}`).join(', ')}
          {' กรุณาระบุ Supplier ในใบยืนยันสั่งซื้อก่อนสร้าง PO สำหรับรายการเหล่านี้'}
        </Alert>
      ) : null}
      {!isFetching && !isError && !supplierGroups.length ? (
        <Typography align="center">ไม่มีรายการสินค้าสำหรับสร้างใบสั่งซื้อ</Typography>
      ) : null}
      {supplierGroups.map((group, index) => {
        const supplierSections = sections.filter(
          (section) => section.supplierId === group.supplierId
        );
        const supplierConfirmedCount = supplierSections.filter(
          (section) =>
            Boolean(createdOrders[section.key]) ||
            confirmedSections[section.key]?.source === section.salesOrder
        ).length;
        const supplierCreatedCount = supplierSections.filter((section) =>
          Boolean(createdOrders[section.key])
        ).length;
        return (
          <Box
            component="section"
            aria-label={`Supplier ${group.supplierId}`}
            key={`${salesOrderId}:${group.supplierId}`}
            sx={{ mb: 2 }}>
            <Accordion
              defaultExpanded={index === 0}
              TransitionProps={{ mountOnEnter: true, unmountOnExit: false }}
              sx={{ borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
                  <Typography fontWeight={600}>{`ใบสั่งซื้อ ${index + 1}/${
                    supplierGroups.length
                  } : ซัพพลายเออร์ ${group.supplierName}`}</Typography>
                  {supplierCreatedCount ? (
                    <Chip
                      size="small"
                      color="success"
                      label={`สร้างแล้ว ${supplierCreatedCount}/${supplierSections.length} ใบ`}
                    />
                  ) : supplierConfirmedCount ? (
                    <Chip
                      size="small"
                      color="info"
                      label={`ยืนยันแล้ว ${supplierConfirmedCount}/${supplierSections.length} กลุ่ม`}
                    />
                  ) : null}
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ px: { xs: 0, sm: 2 } }}>
                {supplierSections.map((section) => {
                  const purchaseNo = createdOrders[section.key]?.purchaseNo || null;
                  const confirmed = confirmedSections[section.key];
                  const confirmedData = confirmed?.source === section.salesOrder ? confirmed : null;
                  return (
                    <Box
                      component="section"
                      aria-label={`Supplier ${group.supplierId} Shipping ${
                        section.shippingLocked ? section.shippingMethod || 'UNRESOLVED' : 'SUPPLIER'
                      }`}
                      key={section.key}
                      sx={{ mb: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                        <Typography fontWeight={600}>
                          {section.shippingLocked
                            ? `${getShippingMethodLabel(section.shippingMethod, 'ไม่พบการขนส่ง')}`
                            : 'รายการสินค้า'}
                        </Typography>
                        {purchaseNo ? (
                          <Chip size="small" color="success" label={`สร้างแล้ว ${purchaseNo}`} />
                        ) : confirmedData ? (
                          <Chip size="small" color="info" label="ยืนยันข้อมูลแล้ว" />
                        ) : null}
                      </Stack>
                      {sectionErrors[section.key] ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          {sectionErrors[section.key]}
                        </Alert>
                      ) : null}
                      {!section.shippingLocked || section.shippingMethod ? (
                        <SupplierPurchaseOrderForm
                          salesOrder={section.salesOrder}
                          shippingLocked={section.shippingLocked}
                          createdPurchaseOrderNo={purchaseNo}
                          confirmedData={confirmedData}
                          isCreating={isCreating}
                          onConfirm={(data) => {
                            setConfirmedSections((previous) => ({
                              ...previous,
                              [section.key]: { ...data, source: section.salesOrder }
                            }));
                            setSectionErrors((previous) => {
                              const next = { ...previous };
                              delete next[section.key];
                              return next;
                            });
                          }}
                          onEdit={() => clearConfirmation(section.key)}
                        />
                      ) : (
                        <Alert severity="error">
                          ไม่สามารถระบุการขนส่งของรายการ:{' '}
                          {section.salesOrder.items.map((item) => item.name).join(', ')}
                          {' กรุณาตรวจสอบข้อมูล RFQ Tier Split ก่อนสร้างใบสั่งซื้อ'}
                        </Alert>
                      )}
                    </Box>
                  );
                })}
              </AccordionDetails>
            </Accordion>
          </Box>
        );
      })}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems="center"
        justifyContent="flex-end"
        sx={{ my: 3 }}>
        <Typography>{`ยืนยันข้อมูล ${confirmedCount}/${sections.length} กลุ่ม • สร้างแล้ว ${
          sections.length - pendingSections.length
        }/${sections.length} ใบ`}</Typography>
        <Button
          variant="contained"
          className="btn-emerald-green"
          startIcon={<AssignmentTurnedIn />}
          disabled={!canCreate || isCreating}
          onClick={() => setIsConfirmOpen(true)}>
          สร้างใบสั่งซื้อ
        </Button>
      </Stack>
      {isCreating ? (
        <Typography role="status">{`กำลังสร้างใบสั่งซื้อ ${activeSectionLabel}`}</Typography>
      ) : null}
      <ConfirmDialog
        open={isConfirmOpen}
        title="ยืนยันสร้างใบสั่งซื้อทั้งหมด"
        confirmDisabled={!canCreate || isCreating}
        message={`ต้องการสร้างใบสั่งซื้อ ${pendingSections.length} ใบ จากข้อมูลที่ยืนยันแล้วใช่หรือไม่? ระบบจะสร้างแยกตาม Supplier และแยกตามการขนส่งเพิ่มเติมสำหรับ Supplier ที่มี RFQ Tier Split`}
        isShowCancelButton
        isShowConfirmButton
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleCreateAll}
      />
    </Page>
  );
}
