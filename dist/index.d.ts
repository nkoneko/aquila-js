import { DeviceapiDeviceSwagger, FalconClient } from "crowdstrike-falcon";
type DeviceDetail = DeviceapiDeviceSwagger;
type ScanResponse = {
    hasNext: boolean;
    devices: DeviceDetail[];
};
declare class HostSearchPagination {
    apiClient: FalconClient;
    currentResult: string[];
    offset?: string;
    fresh: boolean;
    constructor(apiClient: FalconClient, currentResult: string[], offset?: string);
    hasNext(): boolean;
    next(): Promise<DeviceapiDeviceSwagger[]>;
}
declare class HostSearch {
    apiClient: FalconClient;
    constructor(clientId: string, clientSecret: string);
    fullScan(): Promise<HostSearchPagination | undefined>;
    scan(page?: number): Promise<ScanResponse>;
}
export { HostSearch };
