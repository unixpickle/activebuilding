interface Window { app: App; }

const RELOAD_INTERVAL = 60 * 10;

class App {
    messages: MessagesPanel;
    wall: WallPanel;
    packages: PackagesPanel;
    calendar: CalendarPanel;

    constructor() {
        this.messages = new MessagesPanel();
        this.wall = new WallPanel();
        this.packages = new PackagesPanel();
        this.calendar = new CalendarPanel();
    }
}

abstract class Panel<Item> {
    container: HTMLDivElement;
    listElement: HTMLOListElement;
    errorElement: HTMLElement;
    errorElementError: HTMLElement;
    elementCache: Map<string, HTMLElement> = new Map();

    constructor(list_id: string) {
        this.listElement = document.getElementById(list_id) as HTMLOListElement;
        this.container = this.listElement.parentNode as HTMLDivElement;
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

    abstract fetchResults(): Promise<Item[]>;
    abstract createListItem(item: Item): HTMLLIElement;

    async refresh() {
        let results;
        try {
            results = await this.fetchResults();
        } catch (e) {
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
            this.listElement.appendChild(elem)
            this.elementCache.set(key, elem);
        });
        this.container.classList.remove('panel-loading');
    }

    showError(e: string) {
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

class MessagesPanel extends Panel<MessageListing> {
    constructor() {
        super('messages-list');
    }

    async fetchResults(): Promise<MessageListing[]> {
        return await fetchInbox();
    }

    createListItem(item: MessageListing): HTMLLIElement {
        return new MessagePanelItem(item).element;
    }
}

class MessagePanelItem {
    public element: HTMLLIElement;

    attempted: boolean = false;
    messageBody: HTMLElement;
    expandButton: HTMLButtonElement;

    constructor(public item: MessageListing) {
        this.element = document.createElement('li');
        this.element.className = 'message-item';

        const sender = document.createElement('label');
        sender.className = 'message-item-username';
        sender.textContent = item.username;
        this.element.appendChild(sender);
        const date = document.createElement('label');
        date.className = 'message-item-date';
        date.textContent = item.last_activity;
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
        } else {
            this.expandButton.classList.add(closeClass);
            this.element.insertBefore(this.messageBody, this.expandButton);
        }
    }

    async attemptToLoad() {
        let message;
        try {
            message = await fetchMessage(this.item.id, this.item.folder);
        } catch (e) {
            const error = document.createElement('label');
            error.className = 'message-item-body-error';
            error.textContent = 'Failed to fetch message: ' + e;
            this.messageBody.replaceChildren(error);
            return;
        }
        this.messageBody.innerHTML = message.body_html;
    }
}

class WallPanel extends Panel<WallPost> {
    constructor() {
        super('wall-post-list');
    }

    async fetchResults(): Promise<WallPost[]> {
        return await fetchWall();
    }

    createListItem(item: WallPost): HTMLLIElement {
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

class PackagesPanel extends Panel<Package> {
    constructor() {
        super('packages-list');
    }

    async fetchResults(): Promise<Package[]> {
        return await fetchPackages();
    }

    createListItem(item: Package): HTMLLIElement {
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
        } else if (item.type == "FedEx") {
            icon.src = "/svg/fedex.svg";
        } else if (item.type == "Amazon") {
            icon.src = "/svg/amazon.svg";
        } else if (item.type == "UPS") {
            icon.src = "/svg/ups.svg";
        } else {
            icon.src = "/svg/amazon_box.svg";
        }
        result.appendChild(icon);
        return result;
    }

    createField(name: string, value: string): HTMLElement {
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

class CalendarPanel extends Panel<CalendarEvent> {
    constructor() {
        super('calendar');
    }

    async fetchResults(): Promise<CalendarEvent[]> {
        return await fetchCalendar();
    }

    createListItem(item: CalendarEvent): HTMLLIElement {
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
        } else {
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayOfWeek = daysOfWeek[start.getDay()];
            time.textContent = `${dayOfWeek} ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`;
        }
        result.appendChild(title);
        result.appendChild(time);
        return result;
    }
}

function deterministicJSON(obj: any): string {
    if ('string' == typeof obj || 'number' == typeof obj || 'boolean' == typeof obj
        || obj === null) {
        return JSON.stringify(obj);
    } else if (Array.isArray(obj)) {
        return '[' + obj.map(deterministicJSON).join(',') + ']';
    } else {
        const keys = Object.keys(obj);
        keys.sort();
        return '{' + keys.map((k) => {
            return JSON.stringify(k) + ':' + deterministicJSON(obj[k]);
        }).join(',') + '}';
    }
}

window.app = new App();