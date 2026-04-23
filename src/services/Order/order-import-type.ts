import { Pagination } from 'services/fulfillment-type';

export interface CreateOrderImportedTemplateRequest {
  companyId: string;
  templateName: string;
  fields: string[];
}

export interface SearchOrderImportedTemplateRequest {
  templateNameContain: string;
  companyIdEqual: string;
}

export interface OrderImportedField {
  fieldId: string;
  fieldName: string;
  fieldValue: string;
  fieldVariableName: string;
}
export interface SearchOrderImportedTemplateResponse extends Response {
  data: {
    pagination: Pagination;
    templates: OrderImportedTemplate[];
  };
}

export interface OrderImportedTemplate {
  templateId: string;
  templateName: string;
  companyId: string;
  fieldList: OrderImportedField[];
}

export interface OrderImportedTemplateParam {
  id: string;
}

export interface UpdateOrderImportedTemplateRequest {
  templateName: string;
  fields: string[];
}
