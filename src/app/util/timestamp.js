module.exports = {
    getTimeStamp: function(date) {
        var year = date.getFullYear(),
    // months are zero indexed
        month = ((date.getMonth() + 1) < 10 ? '0' : '') + (date.getMonth() + 1),
        day = (date.getDate() < 10 ? '0' : '') + date.getDate(),
        hour = (date.getHours() < 10 ? '0' : '') + date.getHours(),
        minute = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes(),
        second = (date.getSeconds() < 10 ? '0' : '') + date.getSeconds();
    //hourFormatted = hour % 12 || 12, // hour returned in 24 hour format
    //minuteFormatted = minute < 10 ? "0" + minute : minute,
    //morning = hour < 12 ? "am" : "pm";
    return (year.toString().substr(2,2) + month + day +  hour + minute + second).toString();
    }
}