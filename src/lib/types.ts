import {DateTime} from "luxon";

export interface Pin {
    name: string;
    latitude: number;
    longitude: number;
    time: string;
    date: string;
    dateTime?: DateTime;
    isFrom: boolean;
    invalid?: boolean;
}
