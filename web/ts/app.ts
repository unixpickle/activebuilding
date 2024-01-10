interface Window { app: App; }

class App {
    constructor() {
    }
}

class MessagesPanel {
    element: HTMLOListElement;

    constructor() {
        this.element = document.getElementById('messages-list') as HTMLOListElement;
    }
}

window.app = new App();