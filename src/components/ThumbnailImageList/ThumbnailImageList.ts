export interface ThumbnailImageListProps {
  id: string;
  onDeleted?: (index: number) => void;
  isDisabled: boolean;
  isMultiple: boolean;
  files: string[];
  isLoading: boolean;
  inputId: string;
  progress: number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  maxFiles?: number;
}
