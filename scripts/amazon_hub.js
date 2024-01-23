// This is an Apps Script program that finds Amazon Hub email
// notifications and puts them into the "mail" key in the
// server.

function getHubPackages() {
    // Replace with the SCRIPT_SECRET of your server.
    const secret = '123123123123123';

    // Replace this with the server URL.
    const url = "https://activebuilding.server.com/api/kv";

    const hubEmail = "amazonlockers@amazon.com";
    const packages = [];

    GmailApp.search(hubEmail).forEach((thread) => {
        thread.getMessages().forEach((message) => {
            if (message.getFrom().includes(hubEmail)) {
                const subject = message.getSubject();
                const words = subject.split(' ');
                packages.push({
                    accepted_by: words[words.length - 1],
                    type: "Amazon Locker",
                    released_by: null,
                    description: "",
                    arrival: dateToString(message.getDate()),
                    sortKey: message.getDate().getTime(),
                });
            }
        });
    });

    packages.sort((x, y) => x.sortKey - y.sortKey);
    const seen = {};
    const filteredPackages = packages.filter((x) => {
        const pin = x.accepted_by;
        if (seen.hasOwnProperty(pin)) {
            return false;
        }
        seen[pin] = true;
        return true;
    });
    filteredPackages.forEach((x) => {
        delete x.sortKey;
    });

    var options = {
        "method": "post",
        "payload": {
            "secret": secret,
            "key": "mail",
            "value": JSON.stringify(filteredPackages),
        },
    };
    const response = UrlFetchApp.fetch(url, options);
    console.log("posted data", response.getContentText());
}

function dateToString(date) {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}
