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
            this.container.classList.remove('panel-loading');
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
        const date = document.createElement('label');
        date.className = 'message-item-date';
        date.textContent = item.last_activity;
        result.appendChild(date);
        const subject = document.createElement('label');
        subject.className = 'message-item-subject';
        subject.textContent = item.subject;
        result.appendChild(subject);
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
        const header = document.createElement('div');
        header.className = 'wall-post-item-header';
        const posterName = document.createElement('label');
        posterName.className = 'wall-post-item-poster-name';
        posterName.textContent = item.poster_name;
        const postTime = document.createElement('label');
        postTime.className = 'wall-post-item-post-time';
        postTime.textContent = item.relative_time;
        header.appendChild(posterName);
        header.appendChild(postTime);
        result.appendChild(header);
        const contents = document.createElement('div');
        contents.className = 'wall-post-item-contents';
        contents.innerHTML = item.contents_html;
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
        fields.appendChild(this.createField('Accepted By', item.accepted_by));
        fields.appendChild(this.createField('Released By', item.released_by));
        result.appendChild(fields);
        const icon = document.createElement('img');
        icon.className = 'package-item-icon';
        if (item.type == 'USPS') {
            icon.src = "/svg/usps.svg";
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
window.app = new App();
//# sourceMappingURL=app.js.map