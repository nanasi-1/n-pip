/**
 * ピクチャーインピクチャーにする関数
 * @param {HTMLIFrameElement} elem 
 */
async function pip(elem) {
    if(documentPictureInPicture.window) return;
    const container = elem.parentElement; // 復帰用
    const pip = await documentPictureInPicture.requestWindow({
        width: 500,
        height: 1200,
    });
    pip.document.body.append(elem);

    pip.addEventListener("unload", (event) => {
        container.append(elem);
    });
    return pip;
}

window.addEventListener('urlChange-pip', async () => {

    await sleep(500);
    for (let i = 0; i < 20; i++) {
        if(appendBtn(pip)) break;
        await sleep(50);
    }
});

/** ボタンを追加する関数 @param {() => any} handle  */
async function appendBtn(handle) {
    /** @type {Document} */
    const doc = document.querySelector('[aria-label="教材モーダル"]>iframe').contentDocument;
    const header = doc.querySelector('header');
    if(!header) return false;
    const isBookmark = !!header.querySelector('#bookmark-btn');

    const btn = strToElement('<button id="pip-btn" class="u-button type-primary"></button>');
    btn.style.position = 'absolute';
    btn.style.right = `${ isBookmark ? 270 : 130}px`;
    btn.style.top = '0';
    btn.style.marginTop = '-10px';
    btn.style.padding = '0';
    btn.style.lineHeight = '42px';
    btn.style.width = '130px';

    btn.textContent = 'PiPで見る';
    btn.addEventListener('click', handle);
    header.insertBefore(btn, header.querySelector('button'));

    return btn;
}

{ // urlChangeイベント
    let oldUrl = ''; // URLの一時保管用
    const observer = new MutationObserver(async () => {
        await sleep(50); // 判定が速すぎたため
        if (oldUrl !== location.href) {
            window.dispatchEvent(new CustomEvent('urlChange-pip', { detail: oldUrl || '' }));
            oldUrl = location.href; // oldUrlを更新
        }
    });
    window.addEventListener('load', () => {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });
        window.dispatchEvent(new CustomEvent('urlChange-pip'));
    });
}

function sleep(sec) {
    return new Promise(resolve => {
        setTimeout(() => { resolve(); }, sec);
    })
}

/** 文字列をHTMLElementにする関数 @param {String} str @returns {HTMLElement} */
function strToElement(str, inHTML = false) {
    const tempEl = document.createElement(inHTML ? 'html' : 'body');
    tempEl.innerHTML = str;
    return inHTML ? tempEl : tempEl.firstElementChild;
}