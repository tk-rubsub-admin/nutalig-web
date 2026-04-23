export interface FileUploaderProps {
  id: string;
  inputId: string;
  isDisabled: boolean;
  readOnly?: boolean;
  isError: boolean;
  isMultiple: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
