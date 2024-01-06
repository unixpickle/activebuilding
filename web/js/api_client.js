var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function fetch_packages() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield fetch_api('/api/packages');
    });
}
class APIError extends Error {
    constructor(message) {
        super(`error from API backend: ${message}`);
    }
}
function fetch_api(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = (yield (yield fetch(url)).json());
        if (result.hasOwnProperty('error')) {
            throw new APIError(result.error);
        }
        return result.data;
    });
}
//# sourceMappingURL=api_client.js.map