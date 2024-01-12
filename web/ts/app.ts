interface Window { app: App; }

class App {
    messages: MessagesPanel;
    wall: WallPanel;
    packages: PackagesPanel;

    constructor() {
        this.messages = new MessagesPanel();
        this.wall = new WallPanel();
        this.packages = new PackagesPanel();
    }
}

abstract class Panel<Item> {
    container: HTMLDivElement;
    listElement: HTMLOListElement;

    constructor(list_id: string) {
        this.listElement = document.getElementById(list_id) as HTMLOListElement;
        this.container = this.listElement.parentNode as HTMLDivElement;

        this.refresh();
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
        this.listElement.innerHTML = '';
        results.forEach((x) => this.listElement.appendChild(this.createListItem(x)));
        this.container.classList.remove('panel-loading');
    }

    showError(e: string) {
        console.log('error', e);
        // TODO: this.
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

window.app = new App();