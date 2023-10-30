import { DeviceapiDeviceSwagger, FalconClient, FalconErrorExplain } from "crowdstrike-falcon";

const DEVICES_PER_PAGE = 100;

type DeviceDetail = DeviceapiDeviceSwagger;
type ScanResponse = {
    hasNext: boolean,
    devices: DeviceDetail[]
};

class HostSearchPagination {
    apiClient: FalconClient;
    currentResult: string[];
    offset?: string;
    fresh: boolean;

    constructor(apiClient: FalconClient, currentResult: string[], offset?: string) {
        this.apiClient = apiClient;
        this.currentResult = currentResult;
        this.offset = offset;
        this.fresh = true;
    }

    hasNext(): boolean {
        if (!this.fresh) {
            return this.currentResult.length > 0;
        }
        return true;
    }

    async next(): Promise<DeviceapiDeviceSwagger[]> {
        if (this.fresh) {
            this.fresh = false;
        }
        const deviceIds = this.currentResult;
        const [ queryResult, deviceDetailsResult ] = await Promise.all([
            this.apiClient.hosts.queryDevicesByFilterScroll(this.offset, DEVICES_PER_PAGE),
            this.apiClient.hosts.getDeviceDetailsV2(deviceIds)
        ]);
        this.currentResult = queryResult.resources;
        return deviceDetailsResult.resources;
    }
}

class HostSearch {
    apiClient: FalconClient

    constructor(clientId: string, clientSecret: string) {
        this.apiClient = new FalconClient({
            cloud: 'us-1',
            clientId,
            clientSecret
        })
    }

    async fullScan() {
        const apiResult = await this.apiClient.hosts.queryDevicesByFilterScroll(undefined, DEVICES_PER_PAGE);
        if (!apiResult.meta.pagination) {
            return;
        }
        const offset = apiResult.meta.pagination.total > DEVICES_PER_PAGE ? apiResult.meta.pagination.offset : undefined;
        const deviceIds = apiResult.resources;
        return new HostSearchPagination(this.apiClient, deviceIds, offset);
    }

    async scan(page: number = 1): Promise<ScanResponse> {
        const apiResult = await this.apiClient.hosts.queryDevicesByFilter((page - 1) * DEVICES_PER_PAGE, DEVICES_PER_PAGE);
        if (!apiResult.meta.pagination) throw new Error("meta.pagination is empty");

        const hasNext = apiResult.meta.pagination.offset != apiResult.meta.pagination.total;
        const deviceIDs = apiResult.resources;

        const detailApiResult = await this.apiClient.hosts.getDeviceDetailsV2(deviceIDs);
        const devices = detailApiResult.resources;
        return ({
            hasNext,
            devices
        })
    }
}

export {
    HostSearch
}