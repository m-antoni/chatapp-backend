
exports.capitalize = (string, a) => {
    var tempstr = string.toLowerCase();
    if (a == false || a == undefined)
        return tempstr.replace(tempstr[0], tempstr[0].toUpperCase());
    else {
        return tempstr.split(" ").map(function (i) { return i[0].toUpperCase() + i.substring(1) }).join(" ");
    }
}
