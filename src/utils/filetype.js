function getMessageType(mime) {
    if (mime.startsWith("image/")) {
        return "IMAGE";
    }

    if (mime.startsWith("video/")) {
        return "VIDEO";
    }

    if (mime === "application/pdf") {
        return "DOCUMENT";
    }

    return "FILE";
}

module.exports = getMessageType;