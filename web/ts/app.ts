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
        return result;
    }
}

window.app = new App();