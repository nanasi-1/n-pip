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
    // 教材
    if ((new RegExp('/courses/.*/chapters/.*/.*/.*')).test(location.href)) {
        await sleep(300);
        const ifr = await promiseLoop(() => {
            const result = document.querySelector('[aria-label="教材モーダル"]>iframe');
            return result;
        }, [null]);
        if(!ifr || ifr?.contentDocument?.baseURI === location.href) {
            console.info(`N-PiP: ifr要素が空または正常ではありませんでした。このログはPiPボタンをクリックしたときにも出ます。 ifr: ${ifr}`);
            return;
        };

        await promiseLoop(async () => {
            await appendBtn(async () => {
                await pip(ifr);
            }, ifr.contentDocument);
        });
    }

    // フォーラム
    if ((new RegExp('/questions/.*')).test(location.href)) {
        await sleep(500);
        if(document.querySelectorAll('#root div>p').length !== 3) return;
        const aElem = document.querySelector('div:has(>p) a');

        aElem.addEventListener('click', async () => {
            await sleep(500);
            const ifr = document.querySelector('[title="引用教材"]');
            await promiseLoop(async () => {
                const btn = await appendBtn(
                    async () => {await pip(ifr);}, 
                    ifr.contentDocument,
                    false
                );
                if(!btn) return false;
                ifr.contentDocument.querySelector('header').append(btn);
                return true;
            });
        });
    }
});

/** 
 * ボタンを追加する関数 
 * @param {() => Promise<any>} handle 
 * @param {Document} doc   
 */
async function appendBtn(handle, doc, isAppend=true) {
    const header = await promiseLoop(() => doc.querySelector('header'), [null]);
    if(!header) throw new Error(`header要素が${header}でした。読み込みが遅い可能性があります`);
    if(header.querySelector('#pip-btn')) {
        console.debug('N-PiP: PiPボタンはすでにあります');
        return;
    };
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

async function promiseLoop(func, ngList=[], isThrow=false) {
    const TRIAL = 20;
    const SLEEP_MS = 50;
    for (let i = 0; i < TRIAL; i++) {
        try {
            const result = await func();
            if(ngList.includes(result)) throw new Error(`関数の実行結果が${result}でした`);
            return result;
        } catch (e) {
            await sleep(SLEEP_MS);
            if (i >= TRIAL - 1) { // ループじゃ解決しなかった場合
                const errObj = new Error(`N-PiP：loop関数内でエラーが発生しました：${e.message} ${e.stack}`);
                if (isThrow) {
                    console.error(errObj);
                    throw errObj;
                } else {
                    console.info(errObj);
                    return;
                }
            }
        }
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