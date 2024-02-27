/**
 * ピクチャーインピクチャーにする関数
 * @param {HTMLIFrameElement} elem 
 */
async function pip(elem) {
    if(documentPictureInPicture.window) return;
    const container = elem.parentElement; // 復帰用
    const pip = await documentPictureInPicture.requestWindow({
        width: 800,
        height: 1200,
    });
    pip.document.body.append(elem);

    pip.addEventListener("unload", (event) => {
        container.append(elem);
    });
    return pip;
}

window.addEventListener('urlChange-pip', async () => {
    const TRIAL = 20; // ループ回数、多分このくらいでいいと思う
    const SLEEP_MS = 50; // ループ間隔、多分こんくらいでいいと思う

    // 教材
    if ((new RegExp('/courses/.*/chapters/.*/.*/.*')).test(location.href)) {
        await sleep(500);
        const ifr = document.querySelector('[aria-label="教材モーダル"]>iframe');
        await promiseLoop(
            async () => {
                await appendBtn(() => {
                    pip(ifr);
                }, ifr.contentDocument);
            }, 
            TRIAL, 
            SLEEP_MS
        ).catch(e => {throw new Error(e)});
    }

    // フォーラム
    if ((new RegExp('/questions/.*')).test(location.href)) {
        await sleep(500);
        if(document.querySelectorAll('#root div>p').length !== 3) return;
        const aElem = document.querySelector('div:has(>p) a');

        aElem.addEventListener('click', async () => {
            await sleep(500);
            const ifr = document.querySelector('[title="引用教材"]');
            console.log('click');
            await promiseLoop(async () => {
                console.log('loop');
                const btn = await appendBtn(
                    () => {pip(ifr);}, 
                    ifr.contentDocument,
                    false
                )
                if(!btn) return false;
                ifr.contentDocument.querySelector('header').append(btn);
                return true;
            }, TRIAL, SLEEP_MS);
        });
    }
});

/** 
 * ボタンを追加する関数 
 * @param {() => any} handle 
 * @param {Document} doc   
 * @param {() => void} reject 失敗時の処理（promiseのreject）
 */
async function appendBtn(handle, doc, isAppend=true) {
    const header = doc.querySelector('header');
    if(!header) {
        return new Promise((_, reject) => {
            reject(new Error('header要素が空です、読み込みが遅い可能性があります'));
        })
    };
    if(header.querySelector('#pip-btn')) return true;
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
    if(isAppend) header.insertBefore(btn, header.querySelector('button'));

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

async function promiseLoop(func, trial, sleepMs) {
    for (let i = 0; i < trial; i++) {
        const result = await func().catch(async e => {
            await sleep(sleepMs);
            if(i === trial) {
                return new Promise((_, reject) => {
                    reject(new Error(`N-PiP：loop関数内でエラーが発生しました：${e.message}`));
                });
            }
        });
        return result;
    }
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