// Save the user's updated JSON with Alberta added
const fs = require('fs');
const userJson = require('../data/domiciles.json');

// The user's JSON was provided in the chat. We need to check if the key OpenClaw
// updates (source_urls, last_verified for Bermuda and BC) are present.
// If not, we apply them manually.
const bermuda = userJson.find(d => d.name === 'Bermuda');
if (bermuda && !bermuda.last_verified) {
    bermuda.last_verified = "2026-03-27";
    bermuda.source_urls = [
        "https://cdn.bma.bm/documents/2025-03-24-13-49-51-2023-Captive-Report.pdf",
        "https://cdn.bma.bm/documents/2023-11-14-13-37-59-Insurance-Act-1978.pdf"
    ];
    console.log('Updated Bermuda with OpenClaw data');
}

const bc = userJson.find(d => d.name === 'British Columbia');
if (bc && !bc.source_urls) {
    bc.contact_name = "BC Financial Services Authority";
    bc.last_verified = "2026-03-27";
    bc.source_urls = [
        "https://www.bcfsa.ca/industry-resources/insurance-resources",
        "https://www.bcfsa.ca/about-us/contact-us",
        "https://www.bcfsa.ca/industry-resources/insurance-resources/insurance-regulatory-information/insurance-regulatory-statements"
    ];
    console.log('Updated BC with OpenClaw data');
}

const cayman = userJson.find(d => d.name === 'Cayman Islands');
if (cayman && !cayman.contact_name) {
    cayman.contact_name = "Insurance Division, Cayman Islands Monetary Authority";
    cayman.contact_email = "insurance@cima.ky";
    console.log('Updated Cayman with OpenClaw data');
}

const vermont = userJson.find(d => d.name === 'Vermont');
if (vermont && !vermont.contact_name) {
    vermont.contact_name = "Christine Brown, Deputy Commissioner, Captive Insurance Division";
    vermont.contact_email = "christine.brown@vermont.gov";
    console.log('Updated Vermont with OpenClaw data');
}

fs.writeFileSync('data/domiciles.json', JSON.stringify(userJson, null, 2), 'utf8');
console.log(`Saved ${userJson.length} domiciles to JSON`);
