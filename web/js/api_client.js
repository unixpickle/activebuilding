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
        const packages = yield fetchAPI('/api/packages');
        const external = yield fetchExternalPackages();
        external.forEach((x) => {
            packages.push(x);
        });
        packages.sort((x, y) => {
            return dateStringSortKey(y.arrival) - dateStringSortKey(x.arrival);
        });
        return packages;
    });
}
function dateStringSortKey(x) {
    const match = x.match(/([0-9]*)\/([0-9]*)\/([0-9]*),? ([0-9]*):([0-9]*)(:[0-9]*)? (AM|PM)/);
    if (!match) {
        return 0;
    }
    const month = parseInt(match[1]);
    const day = parseInt(match[2]);
    const year = match[3].length == 4 ? parseInt(match[3]) : parseInt('20' + match[3]);
    const hour = parseInt(match[4]);
    const minute = parseInt(match[5]);
    const ampm = match[7];
    return ((((year - 2000) * 12 + month) * 31 + day) * 24 + (ampm == 'PM' ? 12 : 0) + hour) * 60 + minute;
}
function fetchExternalPackages() {
    return __awaiter(this, void 0, void 0, function* () {
        return fetchScriptKey("mail");
    });
}
function fetchInbox() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield fetchAPI('/api/inbox');
    });
}
function fetchMessage(id, folder) {
    return __awaiter(this, void 0, void 0, function* () {
        const escapedID = encodeURIComponent(id);
        const escapedFolder = encodeURIComponent(folder);
        return yield fetchAPI(`/api/message?id=${escapedID}&folder=${escapedFolder}`);
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