const teamsWebhook = require("./teamsWebhook")

module.exports = async (msg, info, filename) => {
    let payload = {
        "@type": "MessageCard",
        "@context": "https://schema.org/extensions",
        "summary": "Vis til arkiv Info",
        "themeColor": "f5d142",
        "title": "VIS til arkiv - Info",
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
                        "name": "Info",
                        "value": info
                    }
                ]
            }
        ]
    }
    await teamsWebhook(payload)
}