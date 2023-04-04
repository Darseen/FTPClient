const allLinks = document.querySelectorAll('a:not(.file-download)');
const goBackLink = document.querySelector('#goBack');

let url = '';

allLinks.forEach(link => {
    link.addEventListener('click', () => {
        url = link.baseURI;
        url += '/' + link.childNodes[3].innerText;
        link.setAttribute('href', url);
    })
})

let previousURL = goBackLink.pathname.split('/');
previousURL.pop();
previousURL = previousURL.join('/');

goBackLink.setAttribute('href', previousURL);

if (window.location.href === goBackLink.origin + '/files') {
    goBackLink.style.display = 'none';
}

setInterval(() => {
    if (window.location.href !== url) {
        url = window.location.href;
    }
}, 1000);