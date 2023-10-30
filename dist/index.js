"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostSearch = void 0;
const crowdstrike_falcon_1 = require("crowdstrike-falcon");
const DEVICES_PER_PAGE = 100;
class HostSearchPagination {
    constructor(apiClient, currentResult, offset) {
        this.apiClient = apiClient;
        this.currentResult = currentResult;
        this.offset = offset;
        this.fresh = true;
    }
    hasNext() {
        if (!this.fresh) {
            return this.currentResult.length > 0;
        }
        return true;
    }
    next() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.fresh) {
                this.fresh = false;
            }
            const deviceIds = this.currentResult;
            const [queryResult, deviceDetailsResult] = yield Promise.all([
                this.apiClient.hosts.queryDevicesByFilterScroll(this.offset, DEVICES_PER_PAGE),
                this.apiClient.hosts.getDeviceDetailsV2(deviceIds)
            ]);
            this.currentResult = queryResult.resources;
            return deviceDetailsResult.resources;
        });
    }
}
class HostSearch {
    constructor(clientId, clientSecret) {
        this.apiClient = new crowdstrike_falcon_1.FalconClient({
            cloud: 'us-1',
            clientId,
            clientSecret
        });
    }
    fullScan() {
        return __awaiter(this, void 0, void 0, function* () {
            const apiResult = yield this.apiClient.hosts.queryDevicesByFilterScroll(undefined, DEVICES_PER_PAGE);
            if (!apiResult.meta.pagination) {
                return;
            }
            const offset = apiResult.meta.pagination.total > DEVICES_PER_PAGE ? apiResult.meta.pagination.offset : undefined;
            const deviceIds = apiResult.resources;
            return new HostSearchPagination(this.apiClient, deviceIds, offset);
        });
    }
    scan(page = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            const apiResult = yield this.apiClient.hosts.queryDevicesByFilter((page - 1) * DEVICES_PER_PAGE, DEVICES_PER_PAGE);
            if (!apiResult.meta.pagination)
                throw new Error("meta.pagination is empty");
            const hasNext = apiResult.meta.pagination.offset != apiResult.meta.pagination.total;
            const deviceIDs = apiResult.resources;
            const detailApiResult = yield this.apiClient.hosts.getDeviceDetailsV2(deviceIDs);
            const devices = detailApiResult.resources;
            return ({
                hasNext,
                devices
            });
        });
    }
}
exports.HostSearch = HostSearch;
