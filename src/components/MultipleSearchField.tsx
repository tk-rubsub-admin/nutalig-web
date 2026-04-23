import { useState, ChangeEvent, useRef } from 'react';
import { Autocomplete, Grid, TextField, InputAdornment, IconButton, Button } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { DEFAULT_DATE_FORMAT_MONTH_TEXT } from 'utils';
import styled from 'styled-components';
import dayjs, { Dayjs } from 'dayjs';
import DatePicker from 'components/DatePicker';

export const SearchDatePicker = styled(DatePicker)`
  .MuiInputBase-root {
    height: 51px;
  }
`;
const SearchSubmitButton = styled(Button)`
  height: 51px;
`;

export interface SelectOption {
  label: string;
  value: string;
}

export interface SearchField {
  type: 'textbox' | 'datepicker';
  optionId: string;
  optionLabel: string;
  defaultValue?: string;
  defaultDate?: string;
  placeholder?: string;
}

interface MultipleSearchFieldProps {
  id: string;
  fields: SearchField[];
  spacing?: number;
  dateFormat?: string;
  onSubmit: (inputId: string | undefined | null, inputValue: string | undefined | null) => void;
  onClear: () => void;
}

interface RenderTextFieldProps {
  fieldId: string;
  placeholder?: string;
  defaultValue?: string;
  disabled?: boolean;
}

interface RenderDatePickerFieldProps {
  fieldId: string;
  fieldLable: string;
  value: string | number | null | undefined;
}

function parseDateFormat(date: Dayjs, format?: string) {
  const startOfDate = date.startOf('day');
  if (format) {
    return startOfDate.format(format);
  }
  return startOfDate.toISOString();
}

export default function MultipleSearchField({
  id,
  fields,
  spacing,
  dateFormat,
  onSubmit,
  onClear
}: MultipleSearchFieldProps): JSX.Element {
  const { t } = useTranslation();

  const textInputElement = useRef<HTMLInputElement>();
  const [selectedOption, setSelectedOption] = useState<SelectOption | null | undefined>(null);
  const [stateValue, setStateValue] = useState<string>();

  const isDisabledSearchButton = !!(!stateValue || (stateValue && stateValue?.length < 2));

  const searchOptions: SelectOption[] = fields.map((field) => {
    return {
      label: field.optionLabel,
      value: field.optionId
    };
  });

  function handleOnSubmit() {
    onSubmit(selectedOption?.value, stateValue);
  }

  function renderTextField({ fieldId, placeholder, defaultValue, disabled }: RenderTextFieldProps) {
    return (
      <TextField
        inputRef={textInputElement}
        id={`${id}_${fieldId}_input`}
        type="text"
        variant="outlined"
        fullWidth
        onChange={(event: ChangeEvent<HTMLInputElement>, value?: string) => {
          const { value: eventValue } = event.target;
          const fieldValue = value ? value : eventValue;
          setStateValue(() => fieldValue);
        }}
        onKeyDown={(event) => {
          const { value } = event.target as HTMLTextAreaElement;

          if (event.key === 'Enter' && value.length >= 2) {
            setStateValue(() => value);
            handleOnSubmit();
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        value={stateValue}
        defaultValue={defaultValue}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton disabled={disabled}>
                <SearchIcon color={disabled ? 'disabled' : 'action'} />
              </IconButton>
            </InputAdornment>
          )
        }}
      />
    );
  }

  function renderDatePickerField({ fieldId, fieldLable, value }: RenderDatePickerFieldProps) {
    return (
      <SearchDatePicker
        fullWidth={true}
        label={fieldLable}
        KeyboardButtonProps={{
          id: `${id}_${fieldId}_icon`
        }}
        id={`${id}_${fieldId}_input`}
        name={fieldId}
        value={value}
        format={DEFAULT_DATE_FORMAT_MONTH_TEXT}
        inputVariant="outlined"
        onChange={(date) => {
          if (date) {
            setStateValue(parseDateFormat(date, dateFormat));
            return;
          }
          setStateValue('');
        }}
      />
    );
  }

  function renderSearchInputField() {
    const searchField: SearchField | undefined = fields.find(
      (field) => field.optionId === selectedOption?.value
    );

    if (textInputElement.current) {
      textInputElement.current.value = '';
    }

    if (!searchField || !selectedOption) {
      onSubmit(undefined, undefined);
      return renderTextField({
        fieldId: 'disabled',
        placeholder: t('search.initPlaceholderInputField'),
        disabled: true
      });
    }

    const { type, optionId, optionLabel, placeholder, defaultValue, defaultDate } = searchField;

    switch (type) {
      case 'textbox': {
        return renderTextField({
          fieldId: optionId,
          placeholder,
          defaultValue
        });
      }
      case 'datepicker': {
        if (!stateValue) {
          setStateValue(() => parseDateFormat(dayjs(), dateFormat));
        }
        return renderDatePickerField({
          fieldId: optionId,
          fieldLable: optionLabel,
          value: stateValue || defaultDate
        });
      }
    }
  }

  return (
    <Grid container spacing={spacing}>
      <Grid item xs={12} sm={6} md={5}>
        <Autocomplete
          autoHighlight
          id="search_select_list"
          options={searchOptions}
          getOptionLabel={(option) => option.label}
          renderInput={(params) => {
            return (
              <TextField
                {...params}
                label={t('search.initPlaceholderInputField')}
                variant="outlined"
              />
            );
          }}
          isOptionEqualToValue={(option, value) =>
            option.value === value.value || value.value === ''
          }
          value={selectedOption || null}
          onChange={(_e, value) => {
            setStateValue(() => '');
            if (value) {
              setSelectedOption(() => value);
              return;
            }
            setSelectedOption(() => null);
            onClear();
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={5}>
        {renderSearchInputField()}
      </Grid>
      <Grid item xs={12} sm={6} md={2}>
        <SearchSubmitButton
          fullWidth
          id="user_group_search_button"
          variant="contained"
          size="large"
          disabled={isDisabledSearchButton}
          onClick={handleOnSubmit}>
          {t('button.search').toUpperCase()}
        </SearchSubmitButton>
      </Grid>
    </Grid>
  );
}
