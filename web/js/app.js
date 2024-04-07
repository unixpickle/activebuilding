var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const RELOAD_INTERVAL = 60 * 10;
class App {
    constructor() {
        this.messages = new MessagesPanel();
        this.wall = new WallPanel();
        this.packages = new PackagesPanel();
        this.calendar = new CalendarPanel();
    }
}
class Panel {
    constructor(list_id) {
        this.elementCache = new Map();
        this.listElement = document.getElementById(list_id);
        this.container = this.listElement.parentNode;
        this.errorElement = document.createElement('div');
        this.errorElement.className = 'panel-error-dialog';
        const errorHeader = document.createElement('h3');
        errorHeader.textContent = 'Error loading data';
        errorHeader.className = 'panel-error-dialog-header';
        this.errorElement.appendChild(errorHeader);
        this.errorElementError = document.createElement('div');
        this.errorElementError.className = 'panel-error-dialog-error';
        const errorElementClose = document.createElement('button');
        errorElementClose.className = 'panel-error-dialog-close';
        this.errorElement.appendChild(this.errorElementError);
        this.errorElement.appendChild(errorElementClose);
        errorElementClose.addEventListener('click', () => this.closeError());
        errorElementClose.textContent = 'Close';
        this.refresh();
        setInterval(() => {
            this.refresh();
        }, 1000 * RELOAD_INTERVAL);
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
            this.closeError();
            const prevCache = this.elementCache;
            this.elementCache = new Map();
            this.listElement.innerHTML = '';
            results.forEach((x) => {
                const key = deterministicJSON(x);
                let elem = prevCache.get(key) || this.createListItem(x);
                this.listElement.appendChild(elem);
                this.elementCache.set(key, elem);
            });
            this.container.classList.remove('panel-loading');
        });
    }
    showError(e) {
        this.errorElementError.textContent = e;
        if (!this.errorElement.parentNode) {
            this.container.appendChild(this.errorElement);
        }
    }
    closeError() {
        if (this.errorElement.parentElement) {
            this.container.removeChild(this.errorElement);
        }
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
        return new MessagePanelItem(item).element;
    }
}
class MessagePanelItem {
    constructor(item) {
        this.item = item;
        this.attempted = false;
        this.element = document.createElement('li');
        this.element.className = 'message-item';
        const sender = document.createElement('label');
        sender.className = 'message-item-username';
        sender.textContent = item.username;
        this.element.appendChild(sender);
        const date = document.createElement('label');
        date.className = 'message-item-date';
        date.textContent = item.lastActivity;
        this.element.appendChild(date);
        const subject = document.createElement('label');
        subject.className = 'message-item-subject';
        subject.textContent = item.subject;
        this.element.appendChild(subject);
        this.expandButton = document.createElement('button');
        this.expandButton.textContent = 'Expand';
        this.expandButton.className = 'message-item-expand-button';
        this.expandButton.addEventListener('click', () => this.expandOrClose());
        this.element.appendChild(this.expandButton);
    }
    expandOrClose() {
        const closeClass = 'message-item-expand-button-close';
        if (!this.attempted) {
            this.attempted = true;
            const loader = document.createElement('div');
            loader.className = 'loader';
            this.messageBody = document.createElement('div');
            this.messageBody.className = 'message-item-body';
            this.messageBody.appendChild(loader);
            this.element.insertBefore(this.messageBody, this.expandButton);
            this.expandButton.classList.add(closeClass);
            this.attemptToLoad();
            return;
        }
        if (this.expandButton.classList.contains(closeClass)) {
            this.expandButton.classList.remove(closeClass);
            this.element.removeChild(this.messageBody);
        }
        else {
            this.expandButton.classList.add(closeClass);
            this.element.insertBefore(this.messageBody, this.expandButton);
        }
    }
    attemptToLoad() {
        return __awaiter(this, void 0, void 0, function* () {
            let message;
            try {
                message = yield fetchMessage(this.item.id, this.item.folder);
            }
            catch (e) {
                const error = document.createElement('label');
                error.className = 'message-item-body-error';
                error.textContent = 'Failed to fetch message: ' + e;
                this.messageBody.replaceChildren(error);
                return;
            }
            this.messageBody.innerHTML = message.bodyHTML;
        });
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
        const header = document.createElement('div');
        header.className = 'wall-post-item-header';
        const posterName = document.createElement('label');
        posterName.className = 'wall-post-item-poster-name';
        posterName.textContent = item.posterName;
        const postTime = document.createElement('label');
        postTime.className = 'wall-post-item-post-time';
        postTime.textContent = item.relativeTime;
        header.appendChild(posterName);
        header.appendChild(postTime);
        result.appendChild(header);
        const contents = document.createElement('div');
        contents.className = 'wall-post-item-contents';
        contents.innerHTML = item.contentsHTML;
        result.appendChild(contents);
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
        const fields = document.createElement('div');
        fields.className = 'package-item-fields';
        fields.appendChild(this.createField('Type', item.type));
        fields.appendChild(this.createField('Arrival', item.arrival));
        if (item.description) {
            fields.appendChild(this.createField('Description', item.description));
        }
        fields.appendChild(this.createField('Accepted By', item.acceptedBy));
        fields.appendChild(this.createField('Released By', item.releasedBy));
        result.appendChild(fields);
        const icon = document.createElement('img');
        icon.className = 'package-item-icon';
        if (item.type == 'USPS') {
            icon.src = "/svg/usps.svg";
        }
        else if (item.type == "FedEx") {
            icon.src = "/svg/fedex.svg";
        }
        else if (item.type == "Amazon") {
            icon.src = "/svg/amazon.svg";
        }
        else if (item.type == "UPS") {
            icon.src = "/svg/ups.svg";
        }
        else if (item.type == "Amazon Locker") {
            icon.src = "/svg/locker.svg";
        }
        else {
            icon.src = "/svg/amazon_box.svg";
        }
        result.appendChild(icon);
        return result;
    }
    createField(name, value) {
        const field = document.createElement('div');
        field.className = 'package-item-field';
        const nameLabel = document.createElement('label');
        nameLabel.className = 'package-item-field-name';
        nameLabel.textContent = name;
        const valueLabel = document.createElement('label');
        valueLabel.className = 'package-item-field-value';
        valueLabel.textContent = value;
        field.appendChild(nameLabel);
        field.appendChild(valueLabel);
        return field;
    }
}
class CalendarPanel extends Panel {
    constructor() {
        super('calendar');
    }
    fetchResults() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield fetchCalendar();
        });
    }
    createListItem(item) {
        const result = document.createElement('li');
        result.className = 'calendar-item';
        const title = document.createElement('label');
        title.className = 'calendar-item-title';
        title.textContent = item.name;
        const time = document.createElement('label');
        time.className = 'calendar-item-time';
        var start = new Date(0);
        var end = new Date(0);
        start.setUTCSeconds(item.startTime / 1000);
        end.setUTCSeconds(item.endTime / 1000);
        if (item.allDay) {
            time.textContent = start.toLocaleDateString() + ' - ' + end.toLocaleDateString();
        }
        else {
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayOfWeek = daysOfWeek[start.getDay()];
            time.textContent = `${dayOfWeek} ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`;
        }
        result.appendChild(title);
        result.appendChild(time);
        return result;
    }
}
function deterministicJSON(obj) {
    if ('string' == typeof obj || 'number' == typeof obj || 'boolean' == typeof obj
        || obj === null) {
        return JSON.stringify(obj);
    }
    else if (Array.isArray(obj)) {
        return '[' + obj.map(deterministicJSON).join(',') + ']';
    }
    else {
        const keys = Object.keys(obj);
        keys.sort();
        return '{' + keys.map((k) => {
            return JSON.stringify(k) + ':' + deterministicJSON(obj[k]);
        }).join(',') + '}';
    }
}
window.app = new App();
//# sourceMappingURL=app.js.map