var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function fetchPackages() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield fetchAPI('/api/packages');
    });
}
function fetchInbox() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield fetchAPI('/api/inbox');
    });
}
function fetchMessage(id, folder) {
    return __awaiter(this, void 0, void 0, function* () {
        const escaped_id = encodeURIComponent(id);
        const escaped_folder = encodeURIComponent(folder);
        return yield fetchAPI(`/api/message?id=${escaped_id}&folder=${escaped_folder}`);
    });
}
function fetchWall() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield fetchAPI('/api/wall');
    });
}
function fetchCalendar() {
    return __awaiter(this, void 0, void 0, function* () {
        return fetchScriptKey('calendar');
    });
}
class APIError extends Error {
    constructor(message) {
        super(`error from API backend: ${message}`);
    }
}
function fetchAPI(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = (yield (yield fetch(url)).json());
        if (result.hasOwnProperty('error')) {
            throw new APIError(result.error);
        }
        return result.data;
    });
}
function fetchScriptKey(key) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield fetchAPI('/api/kv?key=' + encodeURIComponent(key));
        return JSON.parse(data);
    });
}
//# sourceMappingURL=api_client.js.map