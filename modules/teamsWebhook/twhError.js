const teamsWebhook = require("./teamsWebhook")

module.exports = async (msg, error, filename) => {
    let payload = {
        "@type": "MessageCard",
        "@context": "https://schema.org/extensions",
        "summary": "Vis til arkiv error",
        "themeColor": "ff0033",
        "title": "VIS til arkiv - error",
        "sections": [
            {
                "facts": [
                    {
                        "name": "Message:",
                        "value": msg
                    },
                    {
                        "name": "Filename",
                        "value": filename
                    },
                    {
                        "name": "Error",
                        "value": error.toString()
                    }
                ]
            }
        ]
    }
    await teamsWebhook(payload)
}