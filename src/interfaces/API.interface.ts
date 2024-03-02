export interface APIHeaders {
    'Authorization'?: string;
    'x-api-key'?: string;
}

export interface Routes {
    [key: string]: string;
}

export interface ErrorResponse {
    status: number;
    msg: string;
    error: string;
}