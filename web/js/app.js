var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class App {
    constructor() {
        this.messages = new MessagesPanel();
        this.wall = new WallPanel();
        this.packages = new PackagesPanel();
    }
}
class Panel {
    constructor(list_id) {
        this.listElement = document.getElementById(list_id);
        this.container = this.listElement.parentNode;
        this.refresh();
    }
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            let results;
            try {
                results = yield this.fetchResults();
            }
            catch (e) {
                this.showError(e.toString());
                return;
            }
            this.listElement.innerHTML = '';
            results.forEach((x) => this.listElement.appendChild(this.createListItem(x)));
        });
    }
    showError(e) {
        console.log('error', e);
    }
}
class MessagesPanel extends Panel {
    constructor() {
        super('messages-list');
    }
    fetchResults() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield fetchInbox();
        });
    }
    createListItem(item) {
        const result = document.createElement('li');
        result.className = 'message-item';
        const sender = document.createElement('label');
        sender.className = 'message-item-username';
        sender.textContent = item.username;
        result.appendChild(sender);
        const subject = document.createElement('label');
        subject.className = 'message-item-subject';
        subject.textContent = item.subject;
        result.appendChild(subject);
        const date = document.createElement('label');
        date.className = 'message-item-date';
        date.textContent = item.last_activity;
        result.appendChild(date);
        return result;
    }
}
class WallPanel extends Panel {
    constructor() {
        super('wall-post-list');
    }
    fetchResults() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield fetchWall();
        });
    }
    createListItem(item) {
        const result = document.createElement('li');
        result.className = 'wall-post-item';
        return result;
    }
}
class PackagesPanel extends Panel {
    constructor() {
        super('packages-list');
    }
    fetchResults() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield fetchPackages();
        });
    }
    createListItem(item) {
        const result = document.createElement('li');
        result.className = 'package-item';
        return result;
    }
}
window.app = new App();
//# sourceMappingURL=app.js.map