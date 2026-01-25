export const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {
            "@type": "Question",
            "name": "Does SurtitleLive store full script files on user devices?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "No. SurtitleLive uses a 'Fetch on Demand' architecture. No complete script files are persistently stored on user devices. The viewer's device only requests small chunks of subtitles directly around the current cue."
            }
        },
        {
            "@type": "Question",
            "name": "How does SurtitleLive encrypt scripts?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Scripts are encrypted using AES-256 for data at rest and packet-level encryption. In transit, all connections use TLS 1.3. Decryption happens only in the device's temporary memory (RAM), ensuring no persistent file remains."
            }
        },
        {
            "@type": "Question",
            "name": "Can bots scrape scripts from SurtitleLive?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "It is impractical for automated bots to scrape an entire libretto in a single session because the browser only requests text for the active cue, requiring real-time simulation of the entire performance."
            }
        },
        {
            "@type": "Question",
            "name": "Can SurtitleLive prevent screen recording?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "No digital delivery system can completely prevent screen recording or optical character recognition (OCR) from external cameras. This is known as the 'Analog Hole'. However, SurtitleLive raises technical barriers to make unauthorized mass reproduction impractical."
            }
        }
    ]
};
