window.$ = (q) => {
    return document.querySelector(q);
}

window.$$ = (q) => {
    return document.querySelectorAll(q);
}

window.scrub = (text) => {
    let scrubber = document.createElement('span');
    scrubber.innerText = text;
    let s = scrubber.innerHTML;
    s = s.replace('"', '&quot;');
    s = s.replace("'", '&apos;');
    return s;
}

window.css = (p) => {
    let el = document.createElement('link');
    el.setAttribute('href', p);
    el.setAttribute('rel',  "stylesheet");
    el.setAttribute('type', "text/css");
    document.head.appendChild(el);
}
