import {
  Tv as TvIcon,
  AddToQueue as AdditionalScreenIcon,
  PhoneIphone,
  AccountBox
} from '@mui/icons-material';
import { Tooltip, IconButton } from '@mui/material';

interface TooltipOptions {
  type: string;
  color: string;
  subTitle?: string;
  display?: boolean;
  onClick?: () => void;
}
export default function Tooltips({
  type,
  color,
  subTitle,
  display,
  onClick
}: TooltipOptions): JSX.Element {
  if (type === 'TV' && display) {
    return (
      <Tooltip title={subTitle}>
        <IconButton onClick={onClick}>
          <TvIcon htmlColor={color} />
        </IconButton>
      </Tooltip>
    );
  } else if (type === 'ADDITIONAL' && display) {
    return (
      <Tooltip title={subTitle}>
        <IconButton onClick={onClick}>
          <AdditionalScreenIcon htmlColor={color} />
        </IconButton>
      </Tooltip>
    );
  } else if (type === 'ADMIN') {
    return (
      <Tooltip title={subTitle}>
        <IconButton onClick={onClick}>
          <AccountBox htmlColor={color} />
        </IconButton>
      </Tooltip>
    );
  } else if (type === 'USER') {
    return (
      <Tooltip title={subTitle}>
        <IconButton onClick={onClick}>
          <AccountBox htmlColor={color} />
        </IconButton>
      </Tooltip>
    );
  } else if (display) {
    return (
      <Tooltip title={subTitle}>
        <IconButton onClick={onClick}>
          <PhoneIphone htmlColor={color} />
        </IconButton>
      </Tooltip>
    );
  }
  return '';
}
