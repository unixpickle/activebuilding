function entrypoint() {
    // Replace this with the names of the calendars
    // you'd like to sync.
    const useCalendars = [
        'Sam + Alex',
        'Sam + Carol + Scott + Alex',
    ];

    // Replace with the SCRIPT_SECRET of your server.
    const secret = '123123123123123';

    // Replace with the address of your server.
    const url = "https://activebuilding.server.com/api/kv";

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const daysOfInterest = [today, tomorrow];

    const allEvents = [];
    const seenIDs = {};
    CalendarApp.getAllCalendars().forEach((cal) => {
        if (!useCalendars.includes(cal.getName())) {
            return;
        }
        daysOfInterest.forEach((date) => {
            cal.getEventsForDay(date).forEach((event) => {
                const id = event.getId();
                if (seenIDs[id]) {
                    return;
                }
                seenIDs[id] = true;
                allEvents.push({
                    name: event.getTitle(),
                    allDay: event.isAllDayEvent(),
                    startTime: event.getStartTime().getTime(),
                    endTime: event.getEndTime().getTime(),
                });
            });
        });
    });

    var options = {
        "method": "post",
        "payload": {
            "secret": secret,
            "key": "calendar",
            "value": JSON.stringify(allEvents),
        },
    };
    const response = UrlFetchApp.fetch(url, options);
    console.log("posted data", response.getContentText());
}
