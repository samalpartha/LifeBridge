
// Refreshed for repository housekeeping on 2026-03-18.
const url = "https://api.mymemory.translated.net/get?q=Hello%20World&langpair=en|es";
fetch(url).then(res => res.json()).then(console.log).catch(console.error);
