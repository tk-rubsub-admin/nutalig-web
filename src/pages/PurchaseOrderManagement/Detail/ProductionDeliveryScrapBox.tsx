import { Add, Calculate, DeleteOutline } from '@mui/icons-material';
import {
  Box,
  Button,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import toast from 'react-hot-toast';
import { BRAND_COLORS } from 'theme/brandTokens';

export interface ScrapBoxComponentChoice {
  key: string;
  purchaseOrderDetailId: number;
  purchaseOrderDetailComponentId: number;
  label: string;
  remainingQuantity: number;
}

export interface ProductionDeliveryScrapBoxDraft {
  id: number;
  netWeightKg: string;
  grossWeightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  cbmM3: string;
  items: Array<{ componentKey: string; quantity: string }>;
}

export function createScrapBoxDraft(id: number): ProductionDeliveryScrapBoxDraft {
  return {
    id,
    netWeightKg: '',
    grossWeightKg: '',
    lengthCm: '',
    widthCm: '',
    heightCm: '',
    cbmM3: '',
    items: [{ componentKey: '', quantity: '' }]
  };
}

interface Props {
  value: ProductionDeliveryScrapBoxDraft;
  choices: ScrapBoxComponentChoice[];
  disabled: boolean;
  onChange: (value: ProductionDeliveryScrapBoxDraft) => void;
  onRemove: () => void;
}

export default function ProductionDeliveryScrapBox({
  value,
  choices,
  disabled,
  onChange,
  onRemove
}: Props) {
  const updateItem = (index: number, field: 'componentKey' | 'quantity', nextValue: string) => {
    onChange({
      ...value,
      items: value.items.map((item, i) => (i === index ? { ...item, [field]: nextValue } : item))
    });
  };
  const calculateCbm = () => {
    const dimensions = [value.lengthCm, value.widthCm, value.heightCm].map(Number);
    if (dimensions.some((dimension) => !Number.isFinite(dimension) || dimension <= 0)) {
      toast.error('กรุณากรอกขนาดยาว กว้าง สูง ให้ครบก่อนคำนวณ CBM');
      return;
    }
    onChange({
      ...value,
      cbmM3: (dimensions.reduce((total, dimension) => total * dimension, 1) / 1_000_000).toFixed(6)
    });
  };

  return (
    <Box
      role="group"
      aria-label="กล่องเศษ"
      sx={{ border: `1px solid ${BRAND_COLORS.sand}`, borderRadius: 2, p: 2 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          กล่องเศษ
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            startIcon={<Calculate fontSize="small" />}
            onClick={calculateCbm}
            disabled={disabled}>
            คำนวณ CBM
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteOutline fontSize="small" />}
            onClick={onRemove}
            disabled={disabled}>
            ลบกล่องเศษ
          </Button>
        </Stack>
      </Stack>
      <Stack spacing={1.5}>
        <Typography variant="body2" color="text.secondary">
          อะไหล่ในกล่องเดียวกัน ใช้ข้อมูลน้ำหนักและขนาดกล่องร่วมกัน
        </Typography>
        {value.items.map((item, index) => (
          <Grid container spacing={1} alignItems="center" key={index}>
            <Grid item xs={7}>
              <TextField
                select
                fullWidth
                label="อะไหล่/ชิ้นส่วน"
                value={item.componentKey}
                onChange={(event) => updateItem(index, 'componentKey', event.target.value)}
                disabled={disabled}
                InputLabelProps={{ shrink: true }}
                required>
                {choices.map((choice) => (
                  <MenuItem
                    key={choice.key}
                    value={choice.key}
                    disabled={value.items.some(
                      (other, i) => i !== index && other.componentKey === choice.key
                    )}>
                    {choice.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField
                type="number"
                fullWidth
                label="จำนวนชิ้น"
                InputLabelProps={{ shrink: true }}
                value={item.quantity}
                onChange={(event) => updateItem(index, 'quantity', event.target.value)}
                disabled={disabled}
                inputProps={{ min: 0, step: 'any' }}
                required
              />
            </Grid>
            <Grid item xs={1}>
              <IconButton
                size="small"
                color="error"
                aria-label="ลบอะไหล่จากกล่องเศษ"
                disabled={disabled}
                onClick={() =>
                  onChange({ ...value, items: value.items.filter((_, i) => i !== index) })
                }>
                <DeleteOutline fontSize="small" />
              </IconButton>
            </Grid>
          </Grid>
        ))}
        <Button
          size="small"
          startIcon={<Add fontSize="small" />}
          disabled={disabled || value.items.length >= choices.length}
          onClick={() =>
            onChange({ ...value, items: [...value.items, { componentKey: '', quantity: '' }] })
          }
          sx={{ alignSelf: 'flex-start' }}>
          เพิ่มอะไหล่
        </Button>
        <Grid container spacing={1.5}>
          {(
            [
              ['netWeightKg', 'Net Weight (KGS)'],
              ['grossWeightKg', 'Gross Weight (KGS)'],
              ['cbmM3', 'CBM (M³)'],
              ['lengthCm', 'ยาว (CM)'],
              ['widthCm', 'กว้าง (CM)'],
              ['heightCm', 'สูง (CM)']
            ] as const
          ).map(([field, label]) => (
            <Grid item xs={12} sm={6} md={4} key={field}>
              <TextField
                type="number"
                label={label}
                value={value[field]}
                fullWidth
                disabled={disabled}
                onChange={(event) => onChange({ ...value, [field]: event.target.value })}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: 0, step: 'any' }}
              />
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Box>
  );
}

export function serializeScrapBoxes(
  boxes: ProductionDeliveryScrapBoxDraft[],
  choices: ScrapBoxComponentChoice[]
) {
  const choicesByKey = new Map(choices.map((choice) => [choice.key, choice]));
  const optionalMeasurement = (input: string): number | null => {
    if (!input.trim()) return null;
    const value = Number(input);
    if (!Number.isFinite(value) || value < 0)
      throw new Error('ข้อมูลน้ำหนัก ขนาด และ CBM ของกล่องเศษต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป');
    return value;
  };
  const scrapBoxes = boxes.map((box) => {
    const lengthCm = optionalMeasurement(box.lengthCm);
    const widthCm = optionalMeasurement(box.widthCm);
    const heightCm = optionalMeasurement(box.heightCm);
    return {
      netWeightKg: optionalMeasurement(box.netWeightKg),
      grossWeightKg: optionalMeasurement(box.grossWeightKg),
      lengthCm,
      widthCm,
      heightCm,
      cbmM3:
        optionalMeasurement(box.cbmM3) ??
        (lengthCm && widthCm && heightCm
          ? Number(((lengthCm * widthCm * heightCm) / 1_000_000).toFixed(6))
          : null)
    };
  });
  const details = boxes.flatMap((box, scrapBoxIndex) => {
    if (!box.items.length) throw new Error('กรุณาเพิ่มอะไหล่ในกล่องเศษอย่างน้อย 1 รายการ');
    const used = new Set<string>();
    return box.items.map((item) => {
      const choice = choicesByKey.get(item.componentKey);
      const quantity = Number(item.quantity);
      if (!choice || !Number.isFinite(quantity) || quantity <= 0) {
        throw new Error('กรุณาเลือกอะไหล่และระบุจำนวนชิ้นในกล่องเศษให้มากกว่า 0');
      }
      if (used.has(item.componentKey))
        throw new Error('กรุณาระบุอะไหล่แต่ละชนิดเพียงครั้งเดียวต่อกล่องเศษ');
      used.add(item.componentKey);
      return {
        scrapBoxIndex,
        purchaseOrderDetailId: choice.purchaseOrderDetailId,
        purchaseOrderDetailComponentId: choice.purchaseOrderDetailComponentId,
        quantity
      };
    });
  });
  return { scrapBoxes, details };
}
