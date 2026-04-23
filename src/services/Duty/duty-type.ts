/* eslint-disable prettier/prettier */
import { UserProfileResponse } from 'services/User/user-type';

export interface DutyDto {
    date: string;
    bkkDutyList: UserProfileResponse[];
    provinceDutyList: UserProfileResponse[];
}

export interface GetDutyResponse {
    data: DutyDto;
}

export interface CreateDutyRequest {
    date: string
    persons: UserProfileResponse[]
}