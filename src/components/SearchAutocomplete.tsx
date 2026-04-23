import { SyntheticEvent } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { SelectOption } from 'utils';

export interface StatusProps {
  id: string;
  statusOptions: SelectOption[];
  textLabel: string;
  value: SelectOption | null | undefined;
  handleChange: (event: SyntheticEvent<Element, Event>, item: SelectOption | null) => void;
}

export default function SearchAutocomplete({
  id,
  statusOptions,
  textLabel,
  value,
  handleChange
}: StatusProps): JSX.Element {
  return (
    <Autocomplete
      autoHighlight
      id={id}
      options={statusOptions}
      getOptionLabel={(option) => option.label}
      renderInput={(params) => {
        return <TextField {...params} label={textLabel} variant="outlined" />;
      }}
      isOptionEqualToValue={(option, value) => option.value === value.value || value.value === ''}
      value={value || null}
      onChange={(e, item) => handleChange(e, item)}
    />
  );
}
